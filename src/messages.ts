import type { MessageItem } from 'vscode';
import { ConfigurationTarget, window } from 'vscode';
import type { SuppressedMessages } from './config';
import { Commands, urls } from './constants';
import type { BlameIgnoreRevsFileError } from './git/errors';
import { BlameIgnoreRevsFileBadRevisionError } from './git/errors';
import type { GitCommit } from './git/models/commit';
import { executeCommand } from './system/command';
import { configuration } from './system/configuration';
import { Logger } from './system/logger';
import { openUrl } from './system/utils';

export function showBlameInvalidIgnoreRevsFileWarningMessage(
	ex: BlameIgnoreRevsFileError | BlameIgnoreRevsFileBadRevisionError,
): Promise<MessageItem | undefined> {
	if (ex instanceof BlameIgnoreRevsFileBadRevisionError) {
		return showMessage(
			'error',
			`无法显示追溯。在 Git 配置的 blame.ignoreRevsFile 中指定了无效的修订版本（${ex.revision}）。`,
			'suppressBlameInvalidIgnoreRevsFileBadRevisionWarning',
		);
	}

	return showMessage(
		'error',
		`无法显示追溯。在您的 Git 配置中指定了无效或缺失的 blame.ignoreRevsFile（${ex.fileName}） 。`,
		'suppressBlameInvalidIgnoreRevsFileWarning',
	);
}

export function showCommitHasNoPreviousCommitWarningMessage(commit?: GitCommit): Promise<MessageItem | undefined> {
	if (commit == null) {
		return showMessage('info', '没有之前的提交。', 'suppressCommitHasNoPreviousCommitWarning');
	}
	return showMessage(
		'info',
		`提交 ${commit.shortSha}（${commit.author.name}，${commit.formattedDate}）没有之前的提交。`,
		'suppressCommitHasNoPreviousCommitWarning',
	);
}

export function showCommitNotFoundWarningMessage(message: string): Promise<MessageItem | undefined> {
	return showMessage('warn', `${message}。 找不到该提交。`, 'suppressCommitNotFoundWarning');
}

export async function showCreatePullRequestPrompt(branch: string): Promise<boolean> {
	const create = { title: 'Create Pull Request...' };
	const result = await showMessage(
		'info',
		`您想为分支 '${branch}' 创建一个拉取请求吗？`,
		'suppressCreatePullRequestPrompt',
		{ title: "不再显示" },
		create,
	);
	return result === create;
}

export async function showDebugLoggingWarningMessage(): Promise<boolean> {
	const disable = { title: '禁用调试日志记录' };
	const result = await showMessage(
		'warn',
		'XU-Git 调试日志记录当前已启用。除非您正在报告问题，否则建议将其禁用。您想要禁用它吗？',
		'suppressDebugLoggingWarning',
		{ title: "不再显示" },
		disable,
	);

	return result === disable;
}

export async function showGenericErrorMessage(message: string): Promise<void> {
	if (Logger.enabled('error')) {
		const result = await showMessage('error', `${message}。 查看输出频道以获取更多详情。`, undefined, null, {
			title: '打开输出频道',
		});

		if (result != null) {
			Logger.showOutputChannel();
		}
	} else {
		const result = await showMessage(
			'error',
			`${message}。 如果错误仍然存在，请启用调试日志记录并再次尝试。`,
			undefined,
			null,
			{
				title: '禁用调试日志记录',
			},
		);

		if (result != null) {
			void executeCommand(Commands.EnableDebugLogging);
		}
	}
}

export function showFileNotUnderSourceControlWarningMessage(message: string): Promise<MessageItem | undefined> {
	return showMessage(
		'warn',
		`${message}。 文件可能不在源代码控制之下。`,
		'suppressFileNotUnderSourceControlWarning',
	);
}

export function showGitDisabledErrorMessage() {
	return showMessage(
		'error',
		'XU-Git 需要启用 Git。请重新启用 Git —— 将 `git.enabled` 设置为 true 并重新加载。',
		'suppressGitDisabledWarning',
	);
}

export function showGitInvalidConfigErrorMessage() {
	return showMessage(
		'error',
		'XU-Git 无法使用 Git。您的 Git 配置似乎无效。请解决 Git 配置中的任何问题并重新加载。',
	);
}

export function showGitMissingErrorMessage() {
	return showMessage(
		'error',
		"XU-Git 无法找到 Git。请确保 Git 已安装。同时确保 Git 要么在 PATH 中，要么 'git.path' 指向其安装位置。",
		'suppressGitMissingWarning',
	);
}

export function showGitVersionUnsupportedErrorMessage(
	version: string,
	required: string,
): Promise<MessageItem | undefined> {
	return showMessage(
		'error',
		`XU-Git 需要的 Git 版本（>= ${required}）高于当前安装的版本（${version}）。请安装更新的 Git 版本。`,
		'suppressGitVersionWarning',
	);
}

export function showPreReleaseExpiredErrorMessage(version: string) {
	return showMessage(
		'error',
		`这个 XU-Git 预发布版本（${version}）已过期。请升级到更近的版本。`,
	);
}

export function showLineUncommittedWarningMessage(message: string): Promise<MessageItem | undefined> {
	return showMessage('warn', `${message}。 该行有未提交的更改。`, 'suppressLineUncommittedWarning');
}

export function showNoRepositoryWarningMessage(message: string): Promise<MessageItem | undefined> {
	return showMessage('warn', `${message}。 未找到仓库。`, 'suppressNoRepositoryWarning');
}

export function showRebaseSwitchToTextWarningMessage(): Promise<MessageItem | undefined> {
	return showMessage(
		'warn',
		'关闭 git-rebase-todo 文件或 Rebase 编辑器将启动变基。',
		'suppressRebaseSwitchToTextWarning',
	);
}

export function showIntegrationDisconnectedTooManyFailedRequestsWarningMessage(
	providerName: string,
): Promise<MessageItem | undefined> {
	return showMessage(
		'error',
		`由于过多的失败请求，本次会话中与 ${providerName} 的富集成已断开连接。`,
		'suppressIntegrationDisconnectedTooManyFailedRequestsWarning',
		undefined,
		{
			title: 'OK',
		},
	);
}

export function showIntegrationRequestFailed500WarningMessage(message: string): Promise<MessageItem | undefined> {
	return showMessage('error', message, 'suppressIntegrationRequestFailed500Warning', undefined, {
		title: 'OK',
	});
}

export function showIntegrationRequestTimedOutWarningMessage(providerName: string): Promise<MessageItem | undefined> {
	return showMessage(
		'error',
		`${providerName} 请求超时。`,
		'suppressIntegrationRequestTimedOutWarning',
		undefined,
		{
			title: 'OK',
		},
	);
}

export async function showWhatsNewMessage(version: string) {
	const confirm = { title: 'OK', isCloseAffordance: true };
	const announcement = { title: '读取公告', isCloseAffordance: true };
	const result = await showMessage(
		'info',
		`升级到 XU-Git ${version}${
			version === '15'
				? `, 包括一系列新的 [Pro 功能](${urls.proFeatures})，包括 [启动台](${urls.codeSuggest})、[代码建议](${urls.codeSuggest}) 等`
				: ''
		} — [查看更新说明](${urls.releaseNotes} "查看 XU-Git ${version} 的新功能").`,
		undefined,
		null,
		confirm,
		announcement,
	);

	if (result === announcement) {
		void openUrl(urls.releaseAnnouncement);
	}
}

export async function showMessage(
	type: 'info' | 'warn' | 'error',
	message: string,
	suppressionKey?: SuppressedMessages,
	dontShowAgain: MessageItem | null = { title: "不再显示" },
	...actions: MessageItem[]
): Promise<MessageItem | undefined> {
	Logger.log(`ShowMessage(${type}, '${message}', ${suppressionKey}, ${JSON.stringify(dontShowAgain)})`);

	if (suppressionKey != null && configuration.get(`advanced.messages.${suppressionKey}` as const)) {
		Logger.log(`ShowMessage(${type}, '${message}', ${suppressionKey}, ${JSON.stringify(dontShowAgain)}) skipped`);
		return undefined;
	}

	if (suppressionKey != null && dontShowAgain !== null) {
		actions.push(dontShowAgain);
	}

	let result: MessageItem | undefined = undefined;
	switch (type) {
		case 'info':
			result = await window.showInformationMessage(message, ...actions);
			break;

		case 'warn':
			result = await window.showWarningMessage(message, ...actions);
			break;

		case 'error':
			result = await window.showErrorMessage(message, ...actions);
			break;
	}

	if (suppressionKey != null && (dontShowAgain === null || result === dontShowAgain)) {
		Logger.log(
			`ShowMessage(${type}, '${message}', ${suppressionKey}, ${JSON.stringify(
				dontShowAgain,
			)}) 不再显示 requested`,
		);
		await suppressedMessage(suppressionKey);

		if (result === dontShowAgain) return undefined;
	}

	Logger.log(
		`ShowMessage(${type}, '${message}', ${suppressionKey}, ${JSON.stringify(dontShowAgain)}) returned ${
			result != null ? result.title : result
		}`,
	);
	return result;
}

function suppressedMessage(suppressionKey: SuppressedMessages) {
	const messages = { ...configuration.get('advanced.messages') };

	messages[suppressionKey] = true;

	for (const [key, value] of Object.entries(messages)) {
		if (value !== true) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete messages[key as keyof typeof messages];
		}
	}

	return configuration.update('advanced.messages', messages, ConfigurationTarget.Global);
}
