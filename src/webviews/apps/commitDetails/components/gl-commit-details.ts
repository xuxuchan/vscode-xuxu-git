import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { when } from 'lit/directives/when.js';
import type { Autolink } from '../../../../annotations/autolinks';
import type { ManageCloudIntegrationsCommandArgs } from '../../../../commands/cloudIntegrations';
import type { IssueOrPullRequest } from '../../../../git/models/issue';
import type { PullRequestShape } from '../../../../git/models/pullRequest';
import type { IssueIntegrationId } from '../../../../plus/integrations/providers/models';
import type { Serialized } from '../../../../system/serialize';
import type { State } from '../../../commitDetails/protocol';
import { messageHeadlineSplitterToken } from '../../../commitDetails/protocol';
import type { TreeItemAction, TreeItemBase } from '../../shared/components/tree/base';
import { uncommittedSha } from './commit-details-app';
import type { File } from './gl-details-base';
import { GlDetailsBase } from './gl-details-base';
import '../../shared/components/button';
import '../../shared/components/code-icon';
import '../../shared/components/skeleton-loader';
import '../../shared/components/webview-pane';
import '../../shared/components/actions/action-item';
import '../../shared/components/actions/action-nav';
import '../../shared/components/commit/commit-identity';
import '../../shared/components/commit/commit-stats';
import '../../shared/components/overlays/popover';
import '../../shared/components/overlays/tooltip';
import '../../shared/components/rich/issue-pull-request';

interface ExplainState {
	cancelled?: boolean;
	error?: { message: string };
	summary?: string;
}

@customElement('gl-commit-details')
export class GlCommitDetails extends GlDetailsBase {
	override readonly tab = 'commit';

	@property({ type: Object })
	state?: Serialized<State>;

	@state()
	get isStash() {
		return this.state?.commit?.stashNumber != null;
	}

	@state()
	get shortSha() {
		return this.state?.commit?.shortSha ?? '';
	}

	@state()
	explainBusy = false;

	@property({ type: Object })
	explain?: ExplainState;

	get navigation() {
		if (this.state?.navigationStack == null) {
			return {
				back: false,
				forward: false,
			};
		}

		const actions = {
			back: true,
			forward: true,
		};

		if (this.state.navigationStack.count <= 1) {
			actions.back = false;
			actions.forward = false;
		} else if (this.state.navigationStack.position === 0) {
			actions.back = true;
			actions.forward = false;
		} else if (this.state.navigationStack.position === this.state.navigationStack.count - 1) {
			actions.back = false;
			actions.forward = true;
		}

		return actions;
	}

	override updated(changedProperties: Map<string, any>) {
		if (changedProperties.has('explain')) {
			this.explainBusy = false;
			this.querySelector('[data-region="commit-explanation"]')?.scrollIntoView();
		}
	}

	private renderEmptyContent() {
		return html`
			<div class="section section--empty" id="empty">
				<p>在您导航时显示提交和暂存的丰富细节：</p>

				<ul class="bulleted">
					<li>文本编辑器中的行</li>
					<li>
						在<a href="command:gitlens.showGraph">提交图</a>、
						<a href="command:gitlens.showTimelineView">可视化文件历史</a>或
						<a href="command:gitlens.showCommitsView">提交视图</a>中的提交
					</li>
					<li>在<a href="command:gitlens.showStashesView">暂存视图</a>中的暂存</li>
				</ul>

				<p>或者，展示您的进行中工作，或搜索或选择一个提交</p>

				<p class="button-container">
					<span class="button-group button-group--single">
						<gl-button full data-action="wip">概览</gl-button>
					</span>
				</p>
				<p class="button-container">
					<span class="button-group button-group--single">
						<gl-button full data-action="pick-commit">选择提交...</gl-button>
						<gl-button density="compact" data-action="search-commit" tooltip="搜索提交"
							><code-icon icon="search"></code-icon
						></gl-button>
					</span>
				</p>
			</div>
		`;
	}

	private renderCommitMessage() {
		const details = this.state?.commit;
		if (details == null) return undefined;

		const message = details.message;
		const index = message.indexOf(messageHeadlineSplitterToken);
		return html`
			<div class="section section--message">
				${when(
					!this.isStash,
					() => html`
						<commit-identity
							class="mb-1"
							name="${details.author.name}"
							url="${details.author.email ? `mailto:${details.author.email}` : undefined}"
							date=${details.author.date}
							.dateFormat="${this.preferences?.dateFormat}"
							.avatarUrl="${details.author.avatar ?? ''}"
							.showAvatar="${this.preferences?.avatars ?? true}"
							.actionLabel="${details.sha === uncommittedSha ? '已更改' : '已提交'}"
						></commit-identity>
					`,
				)}
				<div class="message-block">
					${when(
						index === -1,
						() =>
							html`<p class="message-block__text scrollable" data-region="message">
								<strong>${unsafeHTML(message)}</strong>
							</p>`,
						() =>
							html`<p class="message-block__text scrollable" data-region="message">
								<strong>${unsafeHTML(message.substring(0, index))}</strong><br /><span
									>${unsafeHTML(message.substring(index + 3))}</span
								>
							</p>`,
					)}
				</div>
			</div>
		`;
	}

	private renderJiraLink() {
		if (this.state == null) return 'Jira 问题';

		const { hasAccount, hasConnectedJira } = this.state;

		let message = html`<a
				href="command:gitlens.plus.cloudIntegrations.manage?${encodeURIComponent(
					JSON.stringify({
						integrationId: 'jira' as IssueIntegrationId.Jira,
						source: 'inspect',
						detail: {
							action: 'connect',
							integration: 'jira',
						},
					} satisfies ManageCloudIntegrationsCommandArgs),
				)}"
				>连接到 Jira 云</a
			>
			&mdash; ${hasAccount ? '' : '注册并'}获得自动丰富的 Jira 自动链接的访问权限`;

		if (hasAccount && hasConnectedJira) {
			message = html`<i class="codicon codicon-check" style="vertical-align: text-bottom"></i> Jira 已连接
				&mdash; 已启用自动丰富的 Jira 自动链接`;
		}

		return html`<gl-popover hoist class="inline-popover">
			<span class="tooltip-hint" slot="anchor"
				>Jira 问题 <code-icon icon="${hasConnectedJira ? 'check' : 'gl-unplug'}"></code-icon
			></span>
			<span slot="content">${message}</span>
		</gl-popover>`;
	}

	private renderAutoLinks() {
		if (this.isUncommitted) return undefined;

		const deduped = new Map<
			string,
			| { type: 'autolink'; value: Serialized<Autolink> }
			| { type: 'issue'; value: Serialized<IssueOrPullRequest> }
			| { type: 'pr'; value: Serialized<PullRequestShape> }
		>();

		if (this.state?.commit?.autolinks != null) {
			for (const autolink of this.state.commit.autolinks) {
				deduped.set(autolink.id, { type: 'autolink', value: autolink });
			}
		}

		if (this.state?.autolinkedIssues != null) {
			for (const issue of this.state.autolinkedIssues) {
				deduped.set(issue.id, { type: 'issue', value: issue });
			}
		}

		if (this.state?.pullRequest != null) {
			deduped.set(this.state.pullRequest.id, { type: 'pr', value: this.state.pullRequest });
		}

		const autolinks: Serialized<Autolink>[] = [];
		const issues: Serialized<IssueOrPullRequest>[] = [];
		const prs: Serialized<PullRequestShape>[] = [];

		for (const item of deduped.values()) {
			switch (item.type) {
				case 'autolink':
					autolinks.push(item.value);
					break;
				case 'issue':
					issues.push(item.value);
					break;
				case 'pr':
					prs.push(item.value);
					break;
			}
		}

		const { hasAccount, hasConnectedJira } = this.state ?? {};
		const jiraIntegrationLink = `command:gitlens.plus.cloudIntegrations.manage?${encodeURIComponent(
			JSON.stringify({
				integrationId: 'jira' as IssueIntegrationId.Jira,
				source: 'inspect',
				detail: {
					action: 'connect',
					integration: 'jira',
				},
			} satisfies ManageCloudIntegrationsCommandArgs),
		)}`;

		return html`
			<webview-pane
				collapsable
				?expanded=${this.state?.preferences?.autolinksExpanded ?? true}
				?loading=${!this.state?.includeRichContent}
				data-region="rich-pane"
			>
				<span slot="title">自动链接</span>
				<span slot="subtitle" data-region="autolink-count"
					>${this.state?.includeRichContent || deduped.size ? `找到 ${deduped.size} 个 ` : ''}${this.state
						?.includeRichContent
						? ''
						: '…'}</span
				>
				<action-nav slot="actions">
					<action-item
						label="${hasAccount && hasConnectedJira ? '管理 Jira' : '连接到 Jira 云'}"
						icon="gl-provider-jira"
						href="${jiraIntegrationLink}"
					></action-item>
					<action-item
						data-action="autolinks-settings"
						label="自动链接设置"
						icon="gear"
						href="command:gitlens.showSettingsPage!autolinks"
					></action-item>
				</action-nav>
				${when(
					this.state == null,
					() => html`
						<div class="section" data-region="autolinks">
							<section class="auto-link" aria-label="Custom Autolinks" data-region="custom-autolinks">
								<skeleton-loader lines="2"></skeleton-loader>
							</section>
							<section class="pull-request" aria-label="Pull request" data-region="pull-request">
								<skeleton-loader lines="2"></skeleton-loader>
							</section>
							<section class="issue" aria-label="Issue" data-region="issue">
								<skeleton-loader lines="2"></skeleton-loader>
							</section>
						</div>
					`,
					() => {
						if (deduped.size === 0) {
							return html`
								<div class="section" data-region="rich-info">
									<p>
										<code-icon icon="info"></code-icon>&nbsp;使用
										<gl-tooltip hoist>
											<a
												href="command:gitlens.showSettingsPage!autolinks"
												data-action="autolink-settings"
												>自动链接</a
											>
											<span slot="content">配置自动链接</span>
										</gl-tooltip>
										在提交消息中链接外部引用，如 ${this.renderJiraLink()} 或 Zendesk 工单。
									</p>
								</div>
							`;
						}
						return html`
							<div class="section" data-region="autolinks">
								${autolinks.length
									? html`
											<section
												class="auto-link"
												aria-label="自定义自动链接"
												data-region="custom-autolinks"
											>
												${autolinks.map(autolink => {
													let name = autolink.description ?? autolink.title;
													if (name === undefined) {
														name = `自定义自动链接 ${autolink.prefix}${autolink.id}`;
													}
													return html`
														<issue-pull-request
															type="autolink"
															name="${name}"
															url="${autolink.url}"
															identifier="${autolink.prefix}${autolink.id}"
															status=""
														></issue-pull-request>
													`;
												})}
											</section>
									  `
									: undefined}
								${prs.length
									? html`
											<section
												class="pull-request"
												aria-label="Pull request"
												data-region="pull-request"
											>
												${prs.map(
													pr => html`
														<issue-pull-request
																type="pr"
																name="${pr.title}"
																url="${pr.url}"
																identifier="#${pr.id}"
																status="${pr.state}"
																.date=${pr.updatedDate}
																.dateFormat="${this.state!.preferences.dateFormat}"
																.dateStyle="${this.state!.preferences.dateStyle}"
															></issue-pull-request>
														</section>
									  				`,
												)}
											</section>
									  `
									: undefined}
								${issues.length
									? html`
											<section class="issue" aria-label="Issue" data-region="issue">
												${issues.map(
													issue => html`
														<issue-pull-request
															type="issue"
															name="${issue.title}"
															url="${issue.url}"
															identifier="${issue.id}"
															status="${issue.state}"
															.date=${issue.closed ? issue.closedDate : issue.createdDate}
															.dateFormat="${this.state!.preferences.dateFormat}"
															.dateStyle="${this.state!.preferences.dateStyle}"
														></issue-pull-request>
													`,
												)}
											</section>
									  `
									: undefined}
							</div>
						`;
					},
				)}
			</webview-pane>
		`;
	}

	private renderExplainAi() {
		if (this.state?.orgSettings.ai === false) return undefined;

		// TODO: add loading and response states
		return html`
			<webview-pane collapsable data-region="explain-pane">
				<span slot="title">解释 (AI)</span>
				<span slot="subtitle"><code-icon icon="beaker" size="12"></code-icon></span>
				<action-nav slot="actions">
					<action-item data-action="switch-ai" label="切换 AI 模型" icon="hubot"></action-item>
				</action-nav>

				<div class="section">
					<p>让AI帮助理解这次提交所做的更改。</p>
					<p class="button-container">
						<span class="button-group button-group--single">
							<gl-button
								full
								class="button--busy"
								data-action="explain-commit"
								aria-busy="${this.explainBusy ? 'true' : nothing}"
								@click=${this.onExplainChanges}
								@keydown=${this.onExplainChanges}
								><code-icon icon="loading" modifier="spin" slot="prefix"></code-icon>解释修改</gl-button
							>
						</span>
					</p>
					${when(
						this.explain,
						() => html`
							<div
								class="ai-content${this.explain?.error ? ' has-error' : ''}"
								data-region="commit-explanation"
							>
								${when(
									this.explain?.error,
									() =>
										html`<p class="ai-content__summary scrollable">
											${this.explain!.error!.message ?? '检索内容时出错'}
										</p>`,
								)}
								${when(
									this.explain?.summary,
									() => html`<p class="ai-content__summary scrollable">${this.explain!.summary}</p>`,
								)}
							</div>
						`,
					)}
				</div>
			</webview-pane>
		`;
	}

	override render() {
		if (this.state?.commit == null) {
			return this.renderEmptyContent();
		}

		return html`
			${this.renderCommitMessage()}
			<webview-pane-group flexible>
				${this.renderAutoLinks()}
				${this.renderChangedFiles(
					this.isStash ? 'stash' : 'commit',
					this.renderCommitStats(this.state.commit.stats),
				)}
				${this.renderExplainAi()}
			</webview-pane-group>
		`;
	}

	onExplainChanges(e: MouseEvent | KeyboardEvent) {
		if (this.explainBusy === true || (e instanceof KeyboardEvent && e.key !== 'Enter')) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		this.explainBusy = true;
	}

	private renderCommitStats(stats?: NonNullable<NonNullable<typeof this.state>['commit']>['stats']) {
		if (stats?.changedFiles == null) return undefined;

		if (typeof stats.changedFiles === 'number') {
			return html`<commit-stats added="?" modified="${stats.changedFiles}" removed="?"></commit-stats>`;
		}

		const { added, deleted, changed } = stats.changedFiles;
		return html`<commit-stats added="${added}" modified="${changed}" removed="${deleted}"></commit-stats>`;
	}

	override getFileActions(_file: File, _options?: Partial<TreeItemBase>): TreeItemAction[] {
		const actions = [
			{
				icon: 'go-to-file',
				label: '打开文件',
				action: 'file-open',
			},
		];

		if (this.isUncommitted) {
			return actions;
		}

		actions.push({
			icon: 'git-compare',
			label: '与工作文件的更改进行对比',
			action: 'file-compare-working',
		});

		if (!this.isStash) {
			actions.push(
				{
					icon: 'globe',
					label: '在远程中打开',
					action: 'file-open-on-remote',
				},
				{
					icon: 'ellipsis',
					label: '更多操作',
					action: 'file-more-actions',
				},
			);
		}

		return actions;
	}
}
