import { GlyphChars } from '../../constants';
import type { Container } from '../../container';
import { Features } from '../../features';
import { getRemoteNameFromBranchName } from '../../git/models/branch';
import type { GitBranchReference, GitReference } from '../../git/models/reference';
import { getReferenceLabel, isBranchReference } from '../../git/models/reference';
import type { Repository } from '../../git/models/repository';
import { createDirectiveQuickPickItem, Directive } from '../../quickpicks/items/directive';
import type { FlagsQuickPickItem } from '../../quickpicks/items/flags';
import { createFlagsQuickPickItem } from '../../quickpicks/items/flags';
import { isStringArray } from '../../system/array';
import { configuration } from '../../system/configuration';
import { fromNow } from '../../system/date';
import { pad, pluralize } from '../../system/string';
import type { ViewsWithRepositoryFolders } from '../../views/viewBase';
import type {
	AsyncStepResultGenerator,
	PartialStepState,
	QuickPickStep,
	StepGenerator,
	StepSelection,
	StepState,
} from '../quickCommand';
import { canPickStepContinue, endSteps, QuickCommand, StepResultBreak } from '../quickCommand';
import { FetchQuickInputButton } from '../quickCommand.buttons';
import { appendReposToTitle, pickRepositoriesStep, pickRepositoryStep } from '../quickCommand.steps';

interface Context {
	repos: Repository[];
	associatedView: ViewsWithRepositoryFolders;
	title: string;
}

type Flags = '--force' | '--set-upstream' | string;

interface State<Repos = string | string[] | Repository | Repository[]> {
	repos: Repos;
	reference?: GitReference;
	flags: Flags[];
}

export interface PushGitCommandArgs {
	readonly command: 'push';
	confirm?: boolean;
	state?: Partial<State>;
}

type PushStepState<T extends State = State> = ExcludeSome<StepState<T>, 'repos', string | string[] | Repository>;

export class PushGitCommand extends QuickCommand<State> {
	constructor(container: Container, args?: PushGitCommandArgs) {
		super(container, 'push', 'push', 'Push', {
			description: '将当前分支的更改推送到远程分支',
		});

		let counter = 0;
		if (args?.state?.repos != null && (!Array.isArray(args.state.repos) || args.state.repos.length !== 0)) {
			counter++;
		}

		this.initialState = {
			counter: counter,
			confirm: args?.confirm,
			...args?.state,
		};
	}

	execute(state: State<Repository[]>) {
		const index = state.flags.indexOf('--set-upstream');
		if (index !== -1) {
			return this.container.git.pushAll(state.repos, {
				force: false,
				publish: { remote: state.flags[index + 1] },
				reference: state.reference,
			});
		}

		return this.container.git.pushAll(state.repos, {
			force: state.flags.includes('--force'),
			reference: state.reference,
		});
	}

	protected async *steps(state: PartialStepState<State>): StepGenerator {
		const context: Context = {
			repos: this.container.git.openRepositories,
			associatedView: this.container.commitsView,
			title: this.title,
		};

		if (state.flags == null) {
			state.flags = [];
		}

		if (state.repos != null && !Array.isArray(state.repos)) {
			state.repos = [state.repos as string];
		}

		let skippedStepOne = false;

		while (this.canStepsContinue(state)) {
			context.title = this.title;

			if (state.counter < 1 || state.repos == null || state.repos.length === 0 || isStringArray(state.repos)) {
				skippedStepOne = false;
				if (context.repos.length === 1) {
					skippedStepOne = true;
					if (state.repos == null) {
						state.counter++;
					}

					state.repos = [context.repos[0]];
				} else if (state.reference != null) {
					const result = yield* pickRepositoryStep(
						{ ...state, repos: undefined, repo: state.reference.repoPath },
						context,
					);
					// Always break on the first step (so we will go back)
					if (result === StepResultBreak) break;

					state.repos = [result];
				} else {
					const result = yield* pickRepositoriesStep(
						state as ExcludeSome<typeof state, 'repos', string | Repository>,
						context,
						{ skipIfPossible: state.counter >= 1 },
					);
					// Always break on the first step (so we will go back)
					if (result === StepResultBreak) break;

					state.repos = result;
				}
			}

			if (this.confirm(state.confirm)) {
				const result = yield* this.confirmStep(state as PushStepState, context);
				if (result === StepResultBreak) {
					// If we skipped the previous step, make sure we back up past it
					if (skippedStepOne) {
						state.counter--;
					}

					continue;
				}

				state.flags = result;
			}

			endSteps(state);
			void this.execute(state as State<Repository[]>);
		}

		return state.counter < 0 ? StepResultBreak : undefined;
	}

	private async *confirmStep(state: PushStepState, context: Context): AsyncStepResultGenerator<Flags[]> {
		const useForceWithLease = configuration.getCore('git.useForcePushWithLease') ?? true;
		const useForceIfIncludes =
			useForceWithLease &&
			(configuration.getCore('git.useForcePushIfIncludes') ?? true) &&
			(await this.container.git.supports(state.repos[0].uri, Features.ForceIfIncludes));

		let step: QuickPickStep<FlagsQuickPickItem<Flags>>;

		if (state.repos.length > 1) {
			step = this.createConfirmStep(appendReposToTitle(`Confirm ${context.title}`, state, context), [
				createFlagsQuickPickItem<Flags>(state.flags, [], {
					label: this.title,
					detail: `推送 ${state.repos.length} repos`,
				}),
				createFlagsQuickPickItem<Flags>(state.flags, ['--force'], {
					label: `强制 ${this.title}${ useForceIfIncludes ? '（带租约且包含时）' : useForceWithLease ? '（带租约）' : '' }`,
					description: `--force${
						useForceWithLease ? `-with-lease${useForceIfIncludes ? ' --force-if-includes' : ''}` : ''
					}`,
					detail: `强制推送${ useForceIfIncludes ? '（带租约且包含时）' : useForceWithLease ? '（带租约）' : '' } ${state.repos.length} 个仓库`,
				}),
			]);
		} else {
			const [repo] = state.repos;

			const items: FlagsQuickPickItem<Flags>[] = [];

			if (isBranchReference(state.reference)) {
				if (state.reference.remote) {
					step = this.createConfirmStep(
						appendReposToTitle(context.title, state, context),
						[],
						createDirectiveQuickPickItem(Directive.Cancel, true, {
							label: 'OK',
							detail: '无法推送远程分支',
						}),
						{ placeholder: '无法推送远程分支' },
					);
				} else {
					const branch = await repo.getBranch(state.reference.name);

					if (branch != null && branch?.upstream == null) {
						for (const remote of await repo.getRemotes()) {
							items.push(
								createFlagsQuickPickItem<Flags>(
									state.flags,
									['--set-upstream', remote.name, branch.name],
									{
										label: `发布 ${branch.name} 到 ${remote.name}`,
										detail: `将会发布 ${getReferenceLabel(branch)} 到 ${remote.name}`,
									},
								),
							);
						}

						if (items.length) {
							step = this.createConfirmStep(
								appendReposToTitle('确认发布', state, context),
								items,
								undefined,
								{ placeholder: '确认发布' },
							);
						} else {
							step = this.createConfirmStep(
								appendReposToTitle('发布', state, context),
								[],
								createDirectiveQuickPickItem(Directive.Cancel, true, {
									label: 'OK',
									detail: '未找到远程',
								}),
								{ placeholder: '无法发布; 未找到远程' },
							);
						}
					} else if (branch != null && branch?.state.behind > 0) {
						step = this.createConfirmStep(
							appendReposToTitle(`确认 ${context.title}`, state, context),
							[
								createFlagsQuickPickItem<Flags>(state.flags, ['--force'], {
									label: `强制 ${this.title}${
										useForceIfIncludes
											? ' (带租约且包含时)'
											: useForceWithLease
											  ? ' (带租约)'
											  : ''
									}`,
									description: `--force${
										useForceWithLease
											? `-with-lease${useForceIfIncludes ? ' --force-if-includes' : ''}`
											: ''
									}`,
									detail: `强制推送${
										useForceIfIncludes
											? ' (带租约且包含时)'
											: useForceWithLease
											  ? ' (带租约)'
											  : ''
									} ${branch?.state.ahead ? ` ${pluralize('个提交', branch.state.ahead)}` : ''}${
										branch.getRemoteName() ? ` to ${branch.getRemoteName()}` : ''
									}${
										branch != null && branch.state.behind > 0
											? `, overwriting ${pluralize('个提交', branch.state.behind)}${
													branch?.getRemoteName() ? ` on ${branch.getRemoteName()}` : ''
											  }`
											: ''
									}`,
								}),
							],
							createDirectiveQuickPickItem(Directive.Cancel, true, {
								label: `取消 ${this.title}`,
								detail: `无法推送; ${getReferenceLabel(
									branch,
								)} 落后于 ${branch.getRemoteName()} ${pluralize('个提交', branch.state.behind)}`,
							}),
						);
					} else if (branch != null && branch?.state.ahead > 0) {
						step = this.createConfirmStep(appendReposToTitle(`Confirm ${context.title}`, state, context), [
							createFlagsQuickPickItem<Flags>(state.flags, [branch.getRemoteName()!], {
								label: this.title,
								detail: `推送 ${pluralize('个提交', branch.state.ahead)} 从 ${getReferenceLabel(
									branch,
								)} 到 ${branch.getRemoteName()}`,
							}),
						]);
					} else {
						step = this.createConfirmStep(
							appendReposToTitle(context.title, state, context),
							[],
							createDirectiveQuickPickItem(Directive.Cancel, true, {
								label: 'OK',
								detail: '未找到可推送的提交',
							}),
							{ placeholder: '没有可以推送的内容; 未找到可推送的提交' },
						);
					}
				}
			} else {
				const status = await repo.getStatus();

				const branch: GitBranchReference = {
					refType: 'branch',
					name: status?.branch ?? 'HEAD',
					ref: status?.branch ?? 'HEAD',
					remote: false,
					repoPath: repo.path,
				};

				if (status?.state.ahead === 0) {
					if (!isBranchReference(state.reference) && status.upstream == null) {
						let pushDetails;

						if (state.reference != null) {
							pushDetails = ` 直到并包括 ${getReferenceLabel(state.reference, {
								label: false,
							})}`;
						} else {
							state.reference = branch;
							pushDetails = '';
						}

						for (const remote of await repo.getRemotes()) {
							items.push(
								createFlagsQuickPickItem<Flags>(
									state.flags,
									['--set-upstream', remote.name, status.branch],
									{
										label: `发布 ${branch.name} to ${remote.name}`,
										detail: `将会发布 ${getReferenceLabel(branch)}${pushDetails} 到 ${
											remote.name
										}`,
									},
								),
							);
						}
					}

					if (items.length) {
						step = this.createConfirmStep(
							appendReposToTitle('确认发布', state, context),
							items,
							undefined,
							{ placeholder: '确认发布' },
						);
					} else if (status.upstream == null) {
						step = this.createConfirmStep(
							appendReposToTitle('发布', state, context),
							[],
							createDirectiveQuickPickItem(Directive.Cancel, true, {
								label: 'OK',
								detail: '未找到远程',
							}),
							{ placeholder: '无法发布；未找到远程' },
						);
					} else {
						step = this.createConfirmStep(
							appendReposToTitle(context.title, state, context),
							[],
							createDirectiveQuickPickItem(Directive.Cancel, true, {
								label: 'OK',
								detail: `没有不在 ${getRemoteNameFromBranchName(status.upstream?.name)} 中的提交`,
							}),
							{
								placeholder: `没有可推送的内容; 没有不在 ${getRemoteNameFromBranchName(
									status.upstream?.name,
								)} 中的提交`,
							},
						);
					}
				} else {
					let lastFetchedOn = '';

					const lastFetched = await repo.getLastFetched();
					if (lastFetched !== 0) {
						lastFetchedOn = `${pad(GlyphChars.Dot, 2, 2)}Last fetched ${fromNow(new Date(lastFetched))}`;
					}

					let pushDetails;
					if (state.reference != null) {
						pushDetails = `${
							status?.state.ahead
								? ` 直到并包含 ${getReferenceLabel(state.reference, {
										label: false,
								  })} 的提交`
								: ''
						}${status?.upstream ? ` 到 ${getRemoteNameFromBranchName(status.upstream?.name)}` : ''}`;
					} else {
						pushDetails = `${status?.state.ahead ? ` ${pluralize('个提交', status.state.ahead)}` : ''}${
							status?.upstream ? ` 到 ${getRemoteNameFromBranchName(status.upstream?.name)}` : ''
						}`;
					}

					step = this.createConfirmStep(
						appendReposToTitle(`Confirm ${context.title}`, state, context, lastFetchedOn),
						[
							...(status?.state.behind
								? []
								: [
										createFlagsQuickPickItem<Flags>(state.flags, [], {
											label: this.title,
											detail: `将会推送${pushDetails}`,
										}),
								  ]),
							createFlagsQuickPickItem<Flags>(state.flags, ['--force'], {
								label: `强制 ${this.title}${
									useForceIfIncludes
										? ' (带有租约且包含时)'
										: useForceWithLease
										  ? ' (带有租约)'
										  : ''
								}`,
								description: `--force${
									useForceWithLease
										? `-with-lease${useForceIfIncludes ? ' --force-if-includes' : ''}`
										: ''
								}`,
								detail: `强制推送${
									useForceIfIncludes
										? ' (带有租约且包含时)'
										: useForceWithLease
										  ? ' (带有租约)'
										  : ''
								} ${pushDetails}${
									status != null && status.state.behind > 0
										? `, 覆盖 ${pluralize('个提交', status.state.behind)}${
												status?.upstream
													? ` on ${getRemoteNameFromBranchName(status.upstream?.name)}`
													: ''
										  }`
										: ''
								}`,
							}),
						],
						status?.state.behind
							? createDirectiveQuickPickItem(Directive.Cancel, true, {
									label: `取消 ${this.title}`,
									detail: `无法推送; ${getReferenceLabel(branch)} 落后${
										status?.upstream ? ` ${getRemoteNameFromBranchName(status.upstream?.name)}` : ''
									} ${pluralize('个提交', status.state.behind)}`,
							  })
							: undefined,
					);

					step.additionalButtons = [FetchQuickInputButton];
					step.onDidClickButton = async (quickpick, button) => {
						if (button !== FetchQuickInputButton || quickpick.busy) return false;

						quickpick.title = `确认 ${context.title}${pad(GlyphChars.Dot, 2, 2)}获取中${
							GlyphChars.Ellipsis
						}`;

						quickpick.busy = true;
						try {
							await repo.fetch({ progress: true });
							// Signal that the step should be retried
							return true;
						} finally {
							quickpick.busy = false;
						}
					};
				}
			}
		}

		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}
}
