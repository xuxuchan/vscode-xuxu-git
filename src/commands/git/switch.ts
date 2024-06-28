import { ProgressLocation, window } from 'vscode';
import type { Container } from '../../container';
import type { GitReference } from '../../git/models/reference';
import {
	getNameWithoutRemote,
	getReferenceLabel,
	getReferenceTypeLabel,
	isBranchReference,
} from '../../git/models/reference';
import type { Repository } from '../../git/models/repository';
import type { QuickPickItemOfT } from '../../quickpicks/items/common';
import { createQuickPickSeparator } from '../../quickpicks/items/common';
import { isStringArray } from '../../system/array';
import { executeCommand } from '../../system/command';
import type { ViewsWithRepositoryFolders } from '../../views/viewBase';
import { getSteps } from '../gitCommands.utils';
import type { PartialStepState, StepGenerator, StepResultGenerator, StepSelection, StepState } from '../quickCommand';
import { canPickStepContinue, endSteps, isCrossCommandReference, QuickCommand, StepResultBreak } from '../quickCommand';
import {
	appendReposToTitle,
	inputBranchNameStep,
	pickBranchOrTagStepMultiRepo,
	pickRepositoriesStep,
} from '../quickCommand.steps';

interface Context {
	repos: Repository[];
	associatedView: ViewsWithRepositoryFolders;
	canSwitchToLocalBranch: GitReference | undefined;
	promptToCreateBranch: boolean;
	showTags: boolean;
	title: string;
}

interface State {
	repos: string | string[] | Repository | Repository[];
	reference: GitReference;
	createBranch?: string;
	fastForwardTo?: GitReference;
}

type ConfirmationChoice =
	| 'switch'
	| 'switchViaWorktree'
	| 'switchToLocalBranch'
	| 'switchToLocalBranchAndFastForward'
	| 'switchToLocalBranchViaWorktree'
	| 'switchToNewBranch'
	| 'switchToNewBranchViaWorktree';

type SwitchStepState<T extends State = State> = ExcludeSome<StepState<T>, 'repos', string | string[] | Repository>;

export interface SwitchGitCommandArgs {
	readonly command: 'switch' | 'checkout';
	confirm?: boolean;
	state?: Partial<State>;
}

export class SwitchGitCommand extends QuickCommand<State> {
	constructor(container: Container, args?: SwitchGitCommandArgs) {
		super(container, 'switch', 'switch', 'Switch to...', {
			description: '又名“检出”，切换到指定的分支',
		});

		let counter = 0;
		if (args?.state?.repos != null && (!Array.isArray(args.state.repos) || args.state.repos.length !== 0)) {
			counter++;
		}

		if (args?.state?.reference != null) {
			counter++;
		}

		this.initialState = {
			counter: counter,
			confirm: args?.confirm,
			...args?.state,
		};
	}

	private _canConfirmOverride: boolean | undefined;
	override get canConfirm(): boolean {
		return this._canConfirmOverride ?? true;
	}

	async execute(state: SwitchStepState) {
		await window.withProgress(
			{
				location: ProgressLocation.Notification,
				title: `切换 ${
					state.repos.length === 1 ? state.repos[0].formattedName : `${state.repos.length} 个仓库`
				} 到 ${state.reference.name}`,
			},
			() =>
				Promise.all(
					state.repos.map(r =>
						r.switch(state.reference.ref, { createBranch: state.createBranch, progress: false }),
					),
				),
		);

		if (state.fastForwardTo != null) {
			state.repos[0].merge('--ff-only', state.fastForwardTo.ref);
		}
	}

	override isMatch(key: string) {
		return super.isMatch(key) || key === 'checkout';
	}

	override isFuzzyMatch(name: string) {
		return super.isFuzzyMatch(name) || name === 'checkout';
	}

	protected async *steps(state: PartialStepState<State>): StepGenerator {
		const context: Context = {
			repos: this.container.git.openRepositories,
			associatedView: this.container.commitsView,
			canSwitchToLocalBranch: undefined,
			promptToCreateBranch: false,
			showTags: false,
			title: this.title,
		};

		if (state.repos != null && !Array.isArray(state.repos)) {
			state.repos = [state.repos] as string[] | Repository[];
		}

		let skippedStepOne = false;

		outer: while (this.canStepsContinue(state)) {
			context.title = this.title;

			if (state.counter < 1 || state.repos == null || state.repos.length === 0 || isStringArray(state.repos)) {
				skippedStepOne = false;
				if (context.repos.length === 1) {
					skippedStepOne = true;
					if (state.repos == null) {
						state.counter++;
					}

					state.repos = [context.repos[0]];
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

			if (state.counter < 2 || state.reference == null) {
				const result = yield* pickBranchOrTagStepMultiRepo(state as SwitchStepState, context, {
					placeholder: context => `选择一个分支${context.showTags ? '或标签' : ''} 以切换`,
					allowCreate: state.repos.length === 1,
				});
				if (result === StepResultBreak) {
					// If we skipped the previous step, make sure we back up past it
					if (skippedStepOne) {
						state.counter--;
					}

					continue;
				}

				if (typeof result == 'string') {
					yield* getSteps(
						this.container,
						{
							command: 'branch',
							state: {
								subcommand: 'create',
								repo: state.repos[0],
								name: result,
								suggestNameOnly: true,
								flags: ['--switch'],
							},
						},
						this.pickedVia,
					);

					endSteps(state);
					return;
				}

				if (isCrossCommandReference(result)) {
					void executeCommand(result.command, result.args);
					endSteps(state);
					return;
				}

				state.reference = result;
			}

			context.canSwitchToLocalBranch = undefined;

			if (isBranchReference(state.reference) && !state.reference.remote) {
				state.createBranch = undefined;

				const worktree = await this.container.git.getWorktree(
					state.reference.repoPath,
					w => w.branch?.name === state.reference!.name,
				);
				if (worktree != null && !worktree.main) {
					if (state.fastForwardTo != null) {
						state.repos[0].merge('--ff-only', state.fastForwardTo.ref);
					}

					const worktreeResult = yield* getSteps(
						this.container,
						{
							command: 'worktree',
							state: {
								subcommand: 'open',
								worktree: worktree,
								openOnly: true,
								overrides: {
									disallowBack: true,
									confirmation: {
										title: `确认切换到工作树 \u2022 ${getReferenceLabel(state.reference, {
											icon: false,
											label: false,
										})}`,
										placeholder: `${getReferenceLabel(state.reference, {
											capitalize: true,
											icon: false,
										})} 已链接到一个工作树`,
									},
								},
								repo: state.repos[0],
							},
						},
						this.pickedVia,
					);
					if (worktreeResult === StepResultBreak) continue;

					endSteps(state);
					return;
				}
			} else if (isBranchReference(state.reference) && state.reference.remote) {
				// See if there is a local branch that tracks the remote branch
				const { values: branches } = await this.container.git.getBranches(state.reference.repoPath, {
					filter: b => b.upstream?.name === state.reference!.name,
					sort: { orderBy: 'date:desc' },
				});

				if (branches.length) {
					context.canSwitchToLocalBranch = branches[0];

					state.createBranch = undefined;
					context.promptToCreateBranch = false;
				} else {
					context.promptToCreateBranch = true;
				}
			}

			if (this.confirm(context.promptToCreateBranch || context.canSwitchToLocalBranch ? true : state.confirm)) {
				const result = yield* this.confirmStep(state as SwitchStepState, context);
				if (result === StepResultBreak) continue;

				switch (result) {
					case 'switchToLocalBranch':
						state.reference = context.canSwitchToLocalBranch!;
						continue outer;

					case 'switchToLocalBranchAndFastForward':
						state.fastForwardTo = state.reference;
						state.reference = context.canSwitchToLocalBranch!;
						continue outer;

					case 'switchToNewBranch': {
						context.title = `切换到新分支`;
						this._canConfirmOverride = false;

						const result = yield* inputBranchNameStep(state as SwitchStepState, context, {
							titleContext: ` from ${getReferenceLabel(state.reference, {
								capitalize: true,
								icon: false,
								label: state.reference.refType !== 'branch',
							})}`,
							value: state.createBranch ?? getNameWithoutRemote(state.reference),
						});

						this._canConfirmOverride = undefined;

						if (result === StepResultBreak) continue outer;

						state.createBranch = result;
						break;
					}
					case 'switchViaWorktree':
					case 'switchToLocalBranchViaWorktree':
					case 'switchToNewBranchViaWorktree': {
						const worktreeResult = yield* getSteps(
							this.container,
							{
								command: 'worktree',
								state: {
									subcommand: 'create',
									reference:
										result === 'switchToLocalBranchViaWorktree'
											? context.canSwitchToLocalBranch
											: state.reference,
									createBranch:
										result === 'switchToNewBranchViaWorktree' ? state.createBranch : undefined,
									repo: state.repos[0],
								},
							},
							this.pickedVia,
						);
						if (worktreeResult === StepResultBreak) continue outer;

						endSteps(state);
						return;
					}
				}
			}

			endSteps(state);
			void this.execute(state as SwitchStepState);
		}

		return state.counter < 0 ? StepResultBreak : undefined;
	}

	private *confirmStep(state: SwitchStepState, context: Context): StepResultGenerator<ConfirmationChoice> {
		const isLocalBranch = isBranchReference(state.reference) && !state.reference.remote;

		type StepType = QuickPickItemOfT<ConfirmationChoice>;

		const confirmations: StepType[] = [];
		if (!state.createBranch) {
			if (context.canSwitchToLocalBranch != null) {
				confirmations.push(createQuickPickSeparator('Local'));
				confirmations.push({
					label: `Switch to Local Branch`,
					description: '',
					detail: `切换到本地 ${getReferenceLabel(
						context.canSwitchToLocalBranch,
					)} 为 ${getReferenceLabel(state.reference)}`,
					item: 'switchToLocalBranch',
				});

				if (state.repos.length === 1) {
					confirmations.push({
						label: `Switch to Local Branch & Fast-Forward`,
						description: '',
						detail: `切换并且快进本地 ${getReferenceLabel(
							context.canSwitchToLocalBranch,
						)}`,
						item: 'switchToLocalBranchAndFastForward',
					});
				}
			} else if (isLocalBranch) {
				confirmations.push({
					label: 'Switch to Branch',
					description: '',
					detail: `切换到 ${getReferenceLabel(state.reference)}${
						state.repos.length > 1 ? ` 在 ${state.repos.length} 个仓库` : ''
					}`,
					item: 'switch',
				});
			}
		}

		if (!isLocalBranch || state.createBranch || context.promptToCreateBranch) {
			if (confirmations.length) {
				confirmations.push(createQuickPickSeparator('Remote'));
			}
			confirmations.push({
				label: `Switch to New Local Branch`,
				description: '',
				detail: `创建并切换到新的本地分支 ${
					state.createBranch ? ` 名为 ${state.createBranch}` : ''
				} 从 ${getReferenceLabel(state.reference)}${
					state.repos.length > 1 ? ` 在 ${state.repos.length} 个仓库` : ''
				}`,
				item: 'switchToNewBranch',
			});
		}

		if (state.repos.length === 1) {
			if (confirmations.length) {
				confirmations.push(createQuickPickSeparator('Worktree'));
			}
			if (isLocalBranch) {
				confirmations.push({
					label: `Create Worktree for Branch...`,
					description: '避免修改你的工作树',
					detail: `将为 ${getReferenceLabel(state.reference)} 创建一个新的工作树`,
					item: 'switchViaWorktree',
				});
			} else if (!state.createBranch && context.canSwitchToLocalBranch != null) {
				confirmations.push({
					label: `Create Worktree for Local Branch...`,
					description: '避免修改你的工作树',
					detail: `将为本地 ${getReferenceLabel(context.canSwitchToLocalBranch)} 创建一个新的工作树`,
					item: 'switchToLocalBranchViaWorktree',
				});
			} else {
				confirmations.push({
					label: `Create Worktree for New Local Branch...`,
					description: '避免修改你的工作树',
					detail: `将为一个新的本地分支${
						state.createBranch ? ` 名为 ${state.createBranch}` : ''
					}从 ${getReferenceLabel(state.reference)}${
						state.repos.length > 1 ? ` 在 ${state.repos.length} 个仓库中` : ''
					}创建一个新的工作树`,
					item: 'switchToNewBranchViaWorktree',
				});
			}
		}

		if (!isLocalBranch) {
			if (confirmations.length) {
				confirmations.push(createQuickPickSeparator());
			}
			if (!isBranchReference(state.reference)) {
				confirmations.push({
					label: `Checkout to ${getReferenceTypeLabel(state.reference)}`,
					description: '(分离的)',
					detail: `将切换到 ${getReferenceLabel(state.reference)}${
						state.repos.length > 1 ? ` 在 ${state.repos.length} 个仓库中` : ''
					}`,
					item: 'switch',
				});
			} else if (!state.createBranch) {
				confirmations.push({
					label: `Checkout to Remote Branch`,
					description: '(分离的)',
					detail: `将切换到 ${getReferenceLabel(state.reference)}`,
					item: 'switch',
				});
			}
		}

		const step = this.createConfirmStep(
			appendReposToTitle(
				`确认切换到 ${getReferenceLabel(state.reference, { icon: false, capitalize: true })}`,
				state,
				context,
			),
			confirmations,
			undefined,
			{
				placeholder: `Confirm ${context.title}`,
			},
		);
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}
}
