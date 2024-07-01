import type { CancellationToken, Event, FileDecoration, FileDecorationProvider } from 'vscode';
import { Disposable, EventEmitter, ThemeColor, Uri, window } from 'vscode';
import { getQueryDataFromScmGitUri } from '../@types/vscode.git.uri';
import type { Colors } from '../constants';
import { GlyphChars, Schemes } from '../constants';
import type { GitBranchStatus } from '../git/models/branch';

export class ViewFileDecorationProvider implements FileDecorationProvider, Disposable {
	private readonly _onDidChange = new EventEmitter<undefined | Uri | Uri[]>();
	get onDidChange(): Event<undefined | Uri | Uri[]> {
		return this._onDidChange.event;
	}

	private readonly disposable: Disposable;
	constructor() {
		this.disposable = Disposable.from(
			// Register the current branch decorator separately (since we can only have 2 char's per decoration)
			window.registerFileDecorationProvider({
				provideFileDecoration: (uri, token) => {
					if (uri.scheme !== 'gitlens-view') return undefined;

					switch (uri.authority) {
						case 'branch':
							return this.provideBranchDecoration(uri, token);
						case 'remote':
							return this.provideRemoteDefaultDecoration(uri, token);
						case 'status':
							return this.provideStatusDecoration(uri, token);
						case 'workspaces':
							return this.provideWorkspaceDecoration(uri, token);
						default:
							return undefined;
					}
				},
			}),
			window.registerFileDecorationProvider(this),
		);
	}

	dispose(): void {
		this.disposable.dispose();
	}

	provideWorkspaceDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const [, type, status] = uri.path.split('/');
		if (type === 'repository') {
			if (status === 'open') {
				return {
					badge: '●',
					color: new ThemeColor('gitlens.decorations.workspaceRepoOpenForegroundColor' satisfies Colors),
					tooltip: '',
				};
			}

			if (status === 'missing') {
				return {
					badge: '?',
					color: new ThemeColor('gitlens.decorations.workspaceRepoMissingForegroundColor' satisfies Colors),
					tooltip: '',
				};
			}
		}

		if (type === 'workspace') {
			if (status === 'current') {
				return {
					badge: '●',
					color: new ThemeColor('gitlens.decorations.workspaceCurrentForegroundColor' satisfies Colors),
					tooltip: '',
				};
			}
		}

		return undefined;
	}

	provideFileDecoration(uri: Uri, token: CancellationToken): FileDecoration | undefined {
		if (uri.scheme === Schemes.Git) {
			const data = getQueryDataFromScmGitUri(uri);
			if (data?.decoration != null) {
				uri = Uri.parse(data?.decoration);
			}
		}
		if (uri.scheme !== 'gitlens-view') return undefined;

		switch (uri.authority) {
			case 'branch':
				return this.provideBranchStatusDecoration(uri, token);
			case 'commit-file':
				return this.provideCommitFileStatusDecoration(uri, token);
		}

		return undefined;
	}

	provideCommitFileStatusDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const [, , status] = uri.path.split('/');

		switch (status) {
			case '!':
				return {
					badge: 'I',
					color: new ThemeColor('gitlens.decorations.ignoredForegroundColor' satisfies Colors),
					tooltip: '已忽略',
				};
			case '?':
				return {
					badge: 'U',
					color: new ThemeColor('gitlens.decorations.untrackedForegroundColor' satisfies Colors),
					tooltip: '未跟踪',
				};
			case 'A':
				return {
					badge: 'A',
					color: new ThemeColor('gitlens.decorations.addedForegroundColor' satisfies Colors),
					tooltip: '已添加',
				};
			case 'C':
				return {
					badge: 'C',
					color: new ThemeColor('gitlens.decorations.copiedForegroundColor' satisfies Colors),
					tooltip: '已复制',
				};
			case 'D':
				return {
					badge: 'D',
					color: new ThemeColor('gitlens.decorations.deletedForegroundColor' satisfies Colors),
					tooltip: '已删除',
				};
			case 'M':
				return {
					badge: 'M',
					// Commented out until we can control the color to only apply to the badge, as the color is applied to the entire decoration and its too much
					// https://github.com/microsoft/vscode/issues/182098
					// color: new ThemeColor('gitlens.decorations.modifiedForegroundColor' satisfies Colors),
					tooltip: '已编辑',
				};
			case 'R':
				return {
					badge: 'R',
					color: new ThemeColor('gitlens.decorations.renamedForegroundColor' satisfies Colors),
					tooltip: '已重命名',
				};
			default:
				return undefined;
		}
	}

	provideBranchStatusDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const query = new URLSearchParams(uri.query);
		const status = query.get('status')! as GitBranchStatus;

		switch (status) {
			case 'ahead':
				return {
					badge: '▲',
					color: new ThemeColor('gitlens.decorations.branchAheadForegroundColor' satisfies Colors),
					tooltip: '领先',
				};
			case 'behind':
				return {
					badge: '▼',
					color: new ThemeColor('gitlens.decorations.branchBehindForegroundColor' satisfies Colors),
					tooltip: '落后',
				};
			case 'diverged':
				return {
					badge: '▼▲',
					color: new ThemeColor('gitlens.decorations.branchDivergedForegroundColor' satisfies Colors),
					tooltip: '已分叉',
				};
			case 'missingUpstream':
				return {
					badge: '!',
					color: new ThemeColor('gitlens.decorations.branchMissingUpstreamForegroundColor' satisfies Colors),
					tooltip: '丢失上游',
				};
			case 'upToDate':
				return {
					badge: '',
					color: new ThemeColor('gitlens.decorations.branchUpToDateForegroundColor' satisfies Colors),
					tooltip: '已经是最新',
				};
			case 'unpublished':
				return {
					badge: '▲+',
					color: new ThemeColor('gitlens.decorations.branchUnpublishedForegroundColor' satisfies Colors),
					tooltip: '未发布',
				};
			default:
				return undefined;
		}
	}

	provideBranchDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const query = new URLSearchParams(uri.query);

		const current = Boolean(query.get('current'));
		const opened = Boolean(query.get('opened'));
		const status = query.get('status')! as GitBranchStatus;

		if (!current && !opened) return undefined;

		let color;
		switch (status) {
			case 'ahead':
				color = new ThemeColor('gitlens.decorations.branchAheadForegroundColor' satisfies Colors);
				break;
			case 'behind':
				color = new ThemeColor('gitlens.decorations.branchBehindForegroundColor' satisfies Colors);
				break;
			case 'diverged':
				color = new ThemeColor('gitlens.decorations.branchDivergedForegroundColor' satisfies Colors);
				break;
			case 'upToDate':
				color = new ThemeColor('gitlens.decorations.branchUpToDateForegroundColor' satisfies Colors);
				break;
			case 'unpublished':
				color = new ThemeColor('gitlens.decorations.branchUnpublishedForegroundColor' satisfies Colors);
				break;
		}

		return {
			badge: GlyphChars.Check,
			color: color,
			tooltip: current ? 'Current Branch' : 'Opened Worktree Branch',
		};
	}

	provideRemoteDefaultDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const [, isDefault] = uri.path.split('/');

		if (!isDefault) return undefined;

		return {
			badge: GlyphChars.Check,
			tooltip: '默认远程',
		};
	}

	provideStatusDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		const [, status, conflicts] = uri.path.split('/');

		switch (status) {
			case 'rebasing':
			case 'merging':
				if (conflicts) {
					return {
						badge: '!',
						color: new ThemeColor(
							'gitlens.decorations.statusMergingOrRebasingConflictForegroundColor' satisfies Colors,
						),
					};
				}
				return {
					color: new ThemeColor(
						'gitlens.decorations.statusMergingOrRebasingForegroundColor' satisfies Colors,
					),
				};
			default:
				return undefined;
		}
	}
}
