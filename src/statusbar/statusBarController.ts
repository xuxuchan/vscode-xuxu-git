import type { ConfigurationChangeEvent, StatusBarItem, TextEditor, Uri } from 'vscode';
import { CancellationTokenSource, Disposable, MarkdownString, StatusBarAlignment, window } from 'vscode';
import { Command } from '../commands/base';
import type { ToggleFileChangesAnnotationCommandArgs } from '../commands/toggleFileAnnotations';
import { StatusBarCommand } from '../config';
import { Commands, GlyphChars } from '../constants';
import type { Container } from '../container';
import { CommitFormatter } from '../git/formatters/commitFormatter';
import type { PullRequest } from '../git/models/pullRequest';
import { detailsMessage } from '../hovers/hovers';
import { asCommand } from '../system/command';
import { configuration } from '../system/configuration';
import { debug } from '../system/decorators/log';
import { once } from '../system/event';
import { Logger } from '../system/logger';
import { getLogScope } from '../system/logger.scope';
import type { MaybePausedResult } from '../system/promise';
import { getSettledValue, pauseOnCancelOrTimeout } from '../system/promise';
import { isTextEditor } from '../system/utils';
import type { LinesChangeEvent, LineState } from '../trackers/lineTracker';

export class StatusBarController implements Disposable {
	private _cancellation: CancellationTokenSource | undefined;
	private readonly _disposable: Disposable;
	private _selectedSha: string | undefined;
	private _statusBarBlame: StatusBarItem | undefined;
	private _statusBarMode: StatusBarItem | undefined;

	constructor(private readonly container: Container) {
		this._disposable = Disposable.from(
			once(container.onReady)(this.onReady, this),
			configuration.onDidChange(this.onConfigurationChanged, this),
		);
	}

	dispose() {
		this.clearBlame();

		this._statusBarBlame?.dispose();
		this._statusBarMode?.dispose();

		this.container.lineTracker.unsubscribe(this);
		this._disposable.dispose();
	}

	private onReady(): void {
		this.onConfigurationChanged();
	}

	private onConfigurationChanged(e?: ConfigurationChangeEvent) {
		if (configuration.changed(e, 'mode')) {
			const mode = configuration.get('mode.statusBar.enabled') ? this.container.mode : undefined;
			if (mode?.statusBarItemName) {
				const alignment =
					configuration.get('mode.statusBar.alignment') !== 'left'
						? StatusBarAlignment.Right
						: StatusBarAlignment.Left;

				if (configuration.changed(e, 'mode.statusBar.alignment')) {
					if (this._statusBarMode?.alignment !== alignment) {
						this._statusBarMode?.dispose();
						this._statusBarMode = undefined;
					}
				}

				this._statusBarMode =
					this._statusBarMode ??
					window.createStatusBarItem(
						'gitlens.mode',
						alignment,
						alignment === StatusBarAlignment.Right ? 999 : 1,
					);
				this._statusBarMode.name = 'XU-Git 模式';
				this._statusBarMode.command = Commands.SwitchMode;
				this._statusBarMode.text = mode.statusBarItemName;
				this._statusBarMode.tooltip = new MarkdownString(
					`**${mode.statusBarItemName}** ${GlyphChars.Dash} ${mode.description}\n\n---\n\n点击切换 XU-Git 模式`,
					true,
				);
				this._statusBarMode.accessibilityInformation = {
					label: `XU-Git 模式: ${mode.statusBarItemName}\n点击切换 XU-Git 模式`,
				};
				this._statusBarMode.show();
			} else {
				this._statusBarMode?.dispose();
				this._statusBarMode = undefined;
			}
		}

		if (!configuration.changed(e, 'statusBar')) return;

		if (configuration.get('statusBar.enabled')) {
			const alignment =
				configuration.get('statusBar.alignment') !== 'left'
					? StatusBarAlignment.Right
					: StatusBarAlignment.Left;

			if (configuration.changed(e, 'statusBar.alignment')) {
				if (this._statusBarBlame?.alignment !== alignment) {
					this._statusBarBlame?.dispose();
					this._statusBarBlame = undefined;
				}
			}

			this._statusBarBlame =
				this._statusBarBlame ??
				window.createStatusBarItem(
					'gitlens.blame',
					alignment,
					alignment === StatusBarAlignment.Right ? 1000 : 0,
				);
			this._statusBarBlame.name = 'XU-Git 行内追溯';
			this._statusBarBlame.command = configuration.get('statusBar.command');

			if (configuration.changed(e, 'statusBar.enabled')) {
				this.container.lineTracker.subscribe(
					this,
					this.container.lineTracker.onDidChangeActiveLines(this.onActiveLinesChanged, this),
				);
			}
		} else if (configuration.changed(e, 'statusBar.enabled')) {
			this.container.lineTracker.unsubscribe(this);

			this._statusBarBlame?.dispose();
			this._statusBarBlame = undefined;
		}
	}

	@debug<StatusBarController['onActiveLinesChanged']>({
		args: {
			0: e =>
				`editor=${e.editor?.document.uri.toString(true)}, selections=${e.selections
					?.map(s => `[${s.anchor}-${s.active}]`)
					.join(',')}, pending=${Boolean(e.pending)}, reason=${e.reason}`,
		},
	})
	private onActiveLinesChanged(e: LinesChangeEvent) {
		// If we need to reduceFlicker, don't clear if only the selected lines changed
		let clear = !(
			configuration.get('statusBar.reduceFlicker') &&
			e.reason === 'selection' &&
			(e.pending || e.selections != null)
		);
		if (!e.pending && e.selections != null) {
			const state = this.container.lineTracker.getState(e.selections[0].active);
			if (state?.commit != null) {
				void this.updateBlame(e.editor!, state);

				return;
			}

			clear = true;
		}

		if (clear) {
			this.clearBlame();

			if (e.suspended && e.editor?.document.isDirty && this._statusBarBlame != null) {
				const statusBarItem = this._statusBarBlame;
				const trackedDocumentPromise = this.container.documentTracker.get(e.editor.document);
				queueMicrotask(async () => {
					const doc = await trackedDocumentPromise;
					if (!doc?.isBlameable) return;

					statusBarItem.tooltip = new MarkdownString();
					statusBarItem.tooltip.isTrusted = { enabledCommands: [Commands.ShowSettingsPage] };

					if (doc.canDirtyIdle) {
						statusBarItem.text = '$(watch) 追溯暂停';
						statusBarItem.tooltip.appendMarkdown(
							`在[${configuration.get(
								'advanced.blame.delayAfterEdit',
							)}毫秒延迟](${Command.getMarkdownCommandArgsCore<[undefined, string]>(
								Commands.ShowSettingsPage,
								[undefined, 'advanced.blame.delayAfterEdit'],
							)} '更改编辑后延迟')之后恢复追溯，以限制性能影响，因为存在未保存的更改`,
						);
					} else {
						statusBarItem.text = '$(debug-pause) 追溯暂停';
						statusBarItem.tooltip.appendMarkdown(
							`因为存在未保存的更改，并且文件超过了[${configuration.get(
								'advanced.blame.sizeThresholdAfterEdit',
							)}行阈值](${Command.getMarkdownCommandArgsCore<[undefined, string]>(
								Commands.ShowSettingsPage,
								[undefined, 'advanced.blame.sizeThresholdAfterEdit'],
							)} '更改编辑后的行阈值')，以限制性能影响，保存后将恢复追溯`,
						);
					}

					statusBarItem.show();
				});
			}
		} else if (this._statusBarBlame?.text.startsWith('$(git-commit)')) {
			this._statusBarBlame.text = `$(watch)${this._statusBarBlame.text.substring(13)}`;
		}
	}

	clearBlame() {
		this._selectedSha = undefined;
		this._cancellation?.cancel();
		this._statusBarBlame?.hide();
	}

	@debug<StatusBarController['updateBlame']>({
		args: {
			0: false,
			1: s => s.commit?.sha,
		},
	})
	private async updateBlame(editor: TextEditor, state: LineState) {
		const cfg = configuration.get('statusBar');
		if (!cfg.enabled || this._statusBarBlame == null || !isTextEditor(editor)) {
			this._cancellation?.cancel();
			this._selectedSha = undefined;

			return;
		}

		const { commit } = state;
		if (commit == null) {
			this._cancellation?.cancel();

			return;
		}

		// We can avoid refreshing if the commit is the same, except when the commit is uncommitted, since we need to incorporate the line number in the hover
		if (this._selectedSha === commit.sha && !commit.isUncommitted) {
			if (this._statusBarBlame?.text.startsWith('$(watch)')) {
				this._statusBarBlame.text = `$(git-commit)${this._statusBarBlame.text.substring(8)}`;
			}

			return;
		}

		const scope = getLogScope();
		this._selectedSha = commit.sha;

		this._cancellation?.cancel();
		this._cancellation = new CancellationTokenSource();
		const cancellation = this._cancellation.token;

		let actionTooltip: string;
		switch (cfg.command) {
			case StatusBarCommand.CopyRemoteCommitUrl:
				actionTooltip = '点击复制远程提交URL';
				break;
			case StatusBarCommand.CopyRemoteFileUrl:
				this._statusBarBlame.command = Commands.CopyRemoteFileUrl;
				actionTooltip = '点击复制远程文件修订URL';
				break;
			case StatusBarCommand.DiffWithPrevious:
				this._statusBarBlame.command = Commands.DiffLineWithPrevious;
				actionTooltip = '点击打开与上一修订的行更改';
				break;
			case StatusBarCommand.DiffWithWorking:
				this._statusBarBlame.command = Commands.DiffLineWithWorking;
				actionTooltip = '点击打开与工作文件的行更改';
				break;
			case StatusBarCommand.OpenCommitOnRemote:
				actionTooltip = '点击在远程打开提交';
				break;
			case StatusBarCommand.OpenFileOnRemote:
				actionTooltip = '点击在远程打开修订';
				break;
			case StatusBarCommand.RevealCommitInView:
				actionTooltip = '点击在侧边栏显示提交';
				break;
			case StatusBarCommand.ShowCommitsInView:
				actionTooltip = '点击搜索提交';
				break;
			case StatusBarCommand.ShowQuickCommitDetails:
				actionTooltip = '点击显示提交详情';
				break;
			case StatusBarCommand.ShowQuickCommitFileDetails:
				actionTooltip = '点击显示提交（文件）';
				break;
			case StatusBarCommand.ShowQuickCurrentBranchHistory:
				actionTooltip = '点击显示分支历史';
				break;
			case StatusBarCommand.ShowQuickFileHistory:
				actionTooltip = '点击显示文件历史';
				break;
			case StatusBarCommand.ToggleCodeLens:
				actionTooltip = '点击切换Git CodeLens';
				break;
			case StatusBarCommand.ToggleFileBlame:
				actionTooltip = '点击切换文件责任追溯';
				break;
			case StatusBarCommand.ToggleFileChanges: {
				if (commit.file != null) {
					this._statusBarBlame.command = asCommand<[Uri, ToggleFileChangesAnnotationCommandArgs]>({
						title: '切换文件更改',
						command: Commands.ToggleFileChanges,
						arguments: [
							commit.file.uri,
							{
								type: 'changes',
								context: { sha: commit.sha, only: false, selection: false },
							},
						],
					});
				}
				actionTooltip = '点击切换文件更改';
				break;
			}
			case StatusBarCommand.ToggleFileChangesOnly: {
				if (commit.file != null) {
					this._statusBarBlame.command = asCommand<[Uri, ToggleFileChangesAnnotationCommandArgs]>({
						title: '切换文件更改',
						command: Commands.ToggleFileChanges,
						arguments: [
							commit.file.uri,
							{
								type: 'changes',
								context: { sha: commit.sha, only: true, selection: false },
							},
						],
					});
				}
				actionTooltip = '点击切换文件更改';
				break;
			}
			case StatusBarCommand.ToggleFileHeatmap:
				actionTooltip = '点击切换文件热图';
				break;
		}

		this._statusBarBlame.tooltip = new MarkdownString(`Loading... \n\n---\n\n${actionTooltip}`);
		this._statusBarBlame.accessibilityInformation = {
			label: `${this._statusBarBlame.text}\n${actionTooltip}`,
		};

		const remotes = await this.container.git.getBestRemotesWithProviders(commit.repoPath);
		const [remote] = remotes;

		const defaultDateFormat = configuration.get('defaultDateFormat');
		const getBranchAndTagTipsPromise =
			CommitFormatter.has(cfg.format, 'tips') || CommitFormatter.has(cfg.tooltipFormat, 'tips')
				? this.container.git.getBranchesAndTagsTipsFn(commit.repoPath)
				: undefined;

		const showPullRequests =
			!commit.isUncommitted &&
			remote?.hasIntegration() &&
			cfg.pullRequests.enabled &&
			(CommitFormatter.has(
				cfg.format,
				'pullRequest',
				'pullRequestAgo',
				'pullRequestAgoOrDate',
				'pullRequestDate',
				'pullRequestState',
			) ||
				CommitFormatter.has(
					cfg.tooltipFormat,
					'pullRequest',
					'pullRequestAgo',
					'pullRequestAgoOrDate',
					'pullRequestDate',
					'pullRequestState',
				));

		function setBlameText(
			statusBarItem: StatusBarItem,
			getBranchAndTagTips: Awaited<typeof getBranchAndTagTipsPromise> | undefined,
			pr: Promise<PullRequest | undefined> | PullRequest | undefined,
		) {
			statusBarItem.text = `$(git-commit) ${CommitFormatter.fromTemplate(cfg.format, commit, {
				dateFormat: cfg.dateFormat === null ? defaultDateFormat : cfg.dateFormat,
				getBranchAndTagTips: getBranchAndTagTips,
				messageTruncateAtNewLine: true,
				pullRequest: pr,
				pullRequestPendingMessage: 'PR $(watch)',
				remotes: remotes,
			})}`;
			statusBarItem.accessibilityInformation = {
				label: `${statusBarItem.text}\n${actionTooltip}`,
			};
		}

		async function getBlameTooltip(
			container: Container,
			getBranchAndTagTips: Awaited<typeof getBranchAndTagTipsPromise> | undefined,
			pr: Promise<PullRequest | undefined> | PullRequest | undefined,
			timeout?: number,
		) {
			return detailsMessage(container, commit, commit.getGitUri(), commit.lines[0].line - 1, {
				autolinks: true,
				cancellation: cancellation,
				dateFormat: defaultDateFormat,
				format: cfg.tooltipFormat,
				getBranchAndTagTips: getBranchAndTagTips,
				pullRequest: pr,
				pullRequests: showPullRequests && pr != null,
				remotes: remotes,
				timeout: timeout,
			});
		}

		let prResult: MaybePausedResult<PullRequest | undefined> | undefined;
		if (showPullRequests) {
			// TODO: Make this configurable?
			const timeout = 100;

			prResult = await pauseOnCancelOrTimeout(
				commit.getAssociatedPullRequest(remote),
				cancellation,
				timeout,
				async result => {
					if (result.reason !== 'timedout' || this._statusBarBlame == null) return;

					// If the PR is taking too long, refresh the status bar once it completes

					Logger.debug(scope, `${GlyphChars.Dot} pull request query took too long (over ${timeout} ms)`);

					const [getBranchAndTagTipsResult, prResult] = await Promise.allSettled([
						getBranchAndTagTipsPromise,
						result.value,
					]);

					if (cancellation.isCancellationRequested || this._statusBarBlame == null) return;

					const pr = getSettledValue(prResult);
					const getBranchAndTagTips = getSettledValue(getBranchAndTagTipsResult);

					Logger.debug(scope, `${GlyphChars.Dot} pull request query completed; updating...`);

					setBlameText(this._statusBarBlame, getBranchAndTagTips, pr);

					const tooltip = await getBlameTooltip(this.container, getBranchAndTagTips, pr);
					if (tooltip != null) {
						this._statusBarBlame.tooltip = tooltip.appendMarkdown(`\n\n---\n\n${actionTooltip}`);
					}
				},
			);
		}

		const getBranchAndTagTips = getBranchAndTagTipsPromise != null ? await getBranchAndTagTipsPromise : undefined;

		if (cancellation.isCancellationRequested) return;

		setBlameText(this._statusBarBlame, getBranchAndTagTips, prResult?.value);
		this._statusBarBlame.show();

		const tooltipResult = await pauseOnCancelOrTimeout(
			getBlameTooltip(this.container, getBranchAndTagTips, prResult?.value, 20),
			cancellation,
			100,
			async result => {
				if (result.reason !== 'timedout' || this._statusBarBlame == null) return;

				const tooltip = await result.value;
				if (tooltip != null) {
					this._statusBarBlame.tooltip = tooltip.appendMarkdown(`\n\n---\n\n${actionTooltip}`);
				}
			},
		);

		if (!cancellation.isCancellationRequested && !tooltipResult.paused && tooltipResult.value != null) {
			this._statusBarBlame.tooltip = tooltipResult.value.appendMarkdown(`\n\n---\n\n${actionTooltip}`);
		}
	}
}
