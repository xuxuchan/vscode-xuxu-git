import type { QuickInput, QuickInputButton } from 'vscode';
import { ThemeIcon, Uri } from 'vscode';
import { Container } from '../container';

export class ToggleQuickInputButton implements QuickInputButton {
	constructor(
		private readonly state:
			| {
					on: { icon: string | { light: Uri; dark: Uri } | ThemeIcon; tooltip: string };
					off: { icon: string | { light: Uri; dark: Uri } | ThemeIcon; tooltip: string };
			  }
			| (() => {
					on: { icon: string | { light: Uri; dark: Uri } | ThemeIcon; tooltip: string };
					off: { icon: string | { light: Uri; dark: Uri } | ThemeIcon; tooltip: string };
			  }),
		private _on = false,
	) {}

	get iconPath(): { light: Uri; dark: Uri } | ThemeIcon {
		const icon = this.getToggledState().icon;
		return typeof icon === 'string'
			? {
					dark: Uri.file(Container.instance.context.asAbsolutePath(`images/dark/${icon}.svg`)),
					light: Uri.file(Container.instance.context.asAbsolutePath(`images/light/${icon}.svg`)),
			  }
			: icon;
	}

	get tooltip(): string {
		return this.getToggledState().tooltip;
	}

	get on() {
		return this._on;
	}
	set on(value: boolean) {
		this._on = value;
	}

	/**
	 * @returns `true` if the step should be retried (refreshed)
	 */
	onDidClick?(quickInput: QuickInput): boolean | void | Promise<boolean | void>;

	private getState() {
		return typeof this.state === 'function' ? this.state() : this.state;
	}

	private getToggledState() {
		return this.on ? this.getState().on : this.getState().off;
	}
}

export class SelectableQuickInputButton extends ToggleQuickInputButton {
	constructor(tooltip: string, icon: { off: string | ThemeIcon; on: string | ThemeIcon }, selected: boolean = false) {
		super({ off: { tooltip: tooltip, icon: icon.off }, on: { tooltip: tooltip, icon: icon.on } }, selected);
	}
}

export const ClearQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('clear-all'),
	tooltip: 'Clear',
};

export const FeedbackQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('feedback'),
	tooltip: 'Give Us Feedback',
};

export const FetchQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('gitlens-repo-fetch'),
	tooltip: '获取',
};

export const LoadMoreQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('refresh'),
	tooltip: '加载更多',
};

export const MatchCaseToggleQuickInputButton = class extends SelectableQuickInputButton {
	constructor(on = false) {
		super('匹配大小写', { off: 'icon-match-case', on: 'icon-match-case-selected' }, on);
	}
};

export const MatchAllToggleQuickInputButton = class extends SelectableQuickInputButton {
	constructor(on = false) {
		super('匹配所有', { off: 'icon-match-all', on: 'icon-match-all-selected' }, on);
	}
};

export const MatchRegexToggleQuickInputButton = class extends SelectableQuickInputButton {
	constructor(on = false) {
		super('正则匹配', { off: 'icon-match-regex', on: 'icon-match-regex-selected' }, on);
	}
};

export const PickCommitQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('git-commit'),
	tooltip: '选择一个指定的提交',
};

export const PickCommitToggleQuickInputButton = class extends ToggleQuickInputButton {
	constructor(on = false, context: { showTags: boolean }, onDidClick?: (quickInput: QuickInput) => void) {
		super(
			() => ({
				on: { tooltip: '选择一个指定的提交', icon: new ThemeIcon('git-commit') },
				off: {
					tooltip: `选择一个分支${context.showTags ? '或标签' : ''}`,
					icon: new ThemeIcon('git-branch'),
				},
			}),
			on,
		);

		this.onDidClick = onDidClick;
	}
};

export const MergeQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('merge'),
	tooltip: '合并...',
};

export const OpenOnGitHubQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('globe'),
	tooltip: '在Github中打开',
};

export const OpenOnWebQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('globe'),
	tooltip: '在 xutec.org 中打开',
};

export const OpenInEditorQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('link-external'),
	tooltip: '在编辑器中打开',
};

export const LaunchpadSettingsQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('gear'),
	tooltip: '启动板设置',
};

export const PinQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('pinned'),
	tooltip: '固定',
};

export const UnpinQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('pin'),
	tooltip: '取消固定',
};

export const SnoozeQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('bell-slash'),
	tooltip: '暂时忽略',
};

export const RefreshQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('refresh'),
	tooltip: '刷新',
};

export const UnsnoozeQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('bell'),
	tooltip: '取消暂时忽略',
};
export const OpenInNewWindowQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('empty-window'),
	tooltip: '在新窗口中打开',
};

export const RevealInSideBarQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('search'),
	tooltip: '在侧边栏中显示',
};

export const SetRemoteAsDefaultQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('settings-gear'),
	tooltip: '设置为默认远程',
};

export const ShowDetailsViewQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('eye'),
	tooltip: '审查详情',
};

export const OpenChangesViewQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('compare-changes'),
	tooltip: '打开已更改',
};

export const ShowResultsInSideBarQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('link-external'),
	tooltip: '在侧边栏中显示结果',
};

export const ShowTagsToggleQuickInputButton = class extends SelectableQuickInputButton {
	constructor(on = false) {
		super('显示标签', { off: new ThemeIcon('tag'), on: 'icon-tag-selected' }, on);
	}
};

export const WillConfirmForcedQuickInputButton: QuickInputButton = {
	iconPath: new ThemeIcon('gitlens-confirm-checked'),
	tooltip: '在执行操作之前，您将需要完成一个必要的确认步骤。',
};

export const WillConfirmToggleQuickInputButton = class extends ToggleQuickInputButton {
	constructor(on = false, isConfirmationStep: boolean, onDidClick?: (quickInput: QuickInput) => void) {
		super(
			() => ({
				on: {
					tooltip: isConfirmationStep
					? '对于未来的操作，在执行操作之前，您将看到一个确认步骤\n点击以切换'
					: '在执行操作之前，您将看到一个确认步骤\n点击以切换',
					icon: new ThemeIcon('gitlens-confirm-checked'),
				},
				off: {
					tooltip: isConfirmationStep
					? "对于未来的操作，在执行操作之前，您不会看到确认步骤\n点击以切换"
					: "在执行操作之前，您不会看到确认步骤\n点击以切换",
					icon: new ThemeIcon('gitlens-confirm-unchecked'),
				},
			}),
			on,
		);

		this.onDidClick = onDidClick;
	}
};
