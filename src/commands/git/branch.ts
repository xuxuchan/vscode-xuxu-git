import { QuickInputButtons } from 'vscode';
import type { Container } from '../../container';
import type { GitBranchReference, GitReference } from '../../git/models/reference';
import { getNameWithoutRemote, getReferenceLabel, isRevisionReference } from '../../git/models/reference';
import { Repository } from '../../git/models/repository';
import type { QuickPickItemOfT } from '../../quickpicks/items/common';
import type { FlagsQuickPickItem } from '../../quickpicks/items/flags';
import { createFlagsQuickPickItem } from '../../quickpicks/items/flags';
import { pluralize } from '../../system/string';
import type { ViewsWithRepositoryFolders } from '../../views/viewBase';
import { getSteps } from '../gitCommands.utils';
import type {
	AsyncStepResultGenerator,
	PartialStepState,
	QuickPickStep,
	StepGenerator,
	StepResultGenerator,
	StepSelection,
	StepState,
} from '../quickCommand';
import {
	canPickStepContinue,
	createConfirmStep,
	createPickStep,
	endSteps,
	QuickCommand,
	StepResultBreak,
} from '../quickCommand';
import {
	appendReposToTitle,
	inputBranchNameStep,
	pickBranchesStep,
	pickBranchOrTagStep,
	pickBranchStep,
	pickRepositoryStep,
} from '../quickCommand.steps';

interface Context {
	repos: Repository[];
	associatedView: ViewsWithRepositoryFolders;
	showTags: boolean;
	title: string;
}

type CreateFlags = '--switch' | '--worktree';

interface CreateState {
	subcommand: 'create';
	repo: string | Repository;
	reference: GitReference;
	name: string;
	flags: CreateFlags[];

	suggestNameOnly?: boolean;
}

type DeleteFlags = '--force' | '--remotes';

interface DeleteState {
	subcommand: 'delete';
	repo: string | Repository;
	references: GitBranchReference | GitBranchReference[];
	flags: DeleteFlags[];
}

type PruneState = Replace<DeleteState, 'subcommand', 'prune'>;

type RenameFlags = '-m';

interface RenameState {
	subcommand: 'rename';
	repo: string | Repository;
	reference: GitBranchReference;
	name: string;
	flags: RenameFlags[];
}

type State = CreateState | DeleteState | PruneState | RenameState;
type BranchStepState<T extends State> = SomeNonNullable<StepState<T>, 'subcommand'>;

type CreateStepState<T extends CreateState = CreateState> = BranchStepState<ExcludeSome<T, 'repo', string>>;
function assertStateStepCreate(state: PartialStepState<State>): asserts state is CreateStepState {
	if (state.repo instanceof Repository && state.subcommand === 'create') return;

	debugger;
	throw new Error('Missing repository');
}

type DeleteStepState<T extends DeleteState = DeleteState> = BranchStepState<ExcludeSome<T, 'repo', string>>;
function assertStateStepDelete(state: PartialStepState<State>): asserts state is DeleteStepState {
	if (state.repo instanceof Repository && state.subcommand === 'delete') return;

	debugger;
	throw new Error('Missing repository');
}

type PruneStepState<T extends PruneState = PruneState> = BranchStepState<ExcludeSome<T, 'repo', string>>;
function assertStateStepPrune(state: PartialStepState<State>): asserts state is PruneStepState {
	if (state.repo instanceof Repository && state.subcommand === 'prune') return;

	debugger;
	throw new Error('Missing repository');
}

type RenameStepState<T extends RenameState = RenameState> = BranchStepState<ExcludeSome<T, 'repo', string>>;
function assertStateStepRename(state: PartialStepState<State>): asserts state is RenameStepState {
	if (state.repo instanceof Repository && state.subcommand === 'rename') return;

	debugger;
	throw new Error('Missing repository');
}

function assertStateStepDeleteBranches(
	state: DeleteStepState | PruneStepState,
): asserts state is ExcludeSome<typeof state, 'references', GitBranchReference> {
	if (Array.isArray(state.references)) return;

	debugger;
	throw new Error('Missing branches');
}

const subcommandToTitleMap = new Map<State['subcommand'], string>([
	['create', '创建'],
	['delete', '删除'],
	['prune', '修剪'],
	['rename', '重命名'],
]);
function getTitle(title: string, subcommand: State['subcommand'] | undefined) {
	return subcommand == null ? title : `${subcommandToTitleMap.get(subcommand)} ${title}`;
}

export interface BranchGitCommandArgs {
	readonly command: 'branch';
	confirm?: boolean;
	state?: Partial<State>;
}

export class BranchGitCommand extends QuickCommand {
	private subcommand: State['subcommand'] | undefined;

	constructor(container: Container, args?: BranchGitCommandArgs) {
		super(container, 'branch', 'branch', 'Branch', {
			description: '创建、修剪、重命名或删除分支',
		});

		let counter = 0;
		if (args?.state?.subcommand != null) {
			counter++;

			switch (args?.state.subcommand) {
				case 'create':
					if (args.state.reference != null) {
						counter++;
					}

					if (!args.state.suggestNameOnly && args.state.name != null) {
						counter++;
					}

					break;
				case 'delete':
				case 'prune':
					if (
						args.state.references != null &&
						(!Array.isArray(args.state.references) || args.state.references.length !== 0)
					) {
						counter++;
					}

					break;
				case 'rename':
					if (args.state.reference != null) {
						counter++;
					}

					if (args.state.name != null) {
						counter++;
					}

					break;
			}
		}

		if (args?.state?.repo != null) {
			counter++;
		}

		this.initialState = {
			counter: counter,
			confirm: args?.confirm,
			...args?.state,
		};
	}

	override get canConfirm(): boolean {
		return this.subcommand != null;
	}

	override get canSkipConfirm(): boolean {
		return this.subcommand === 'delete' || this.subcommand === 'prune' || this.subcommand === 'rename'
			? false
			: super.canSkipConfirm;
	}

	override get skipConfirmKey() {
		return `${this.key}${this.subcommand == null ? '' : `-${this.subcommand}`}:${this.pickedVia}`;
	}

	protected async *steps(state: PartialStepState<State>): StepGenerator {
		const context: Context = {
			associatedView: this.container.branchesView,
			repos: this.container.git.openRepositories,
			showTags: false,
			title: this.title,
		};

		let skippedStepTwo = false;

		while (this.canStepsContinue(state)) {
			context.title = this.title;

			if (state.counter < 1 || state.subcommand == null) {
				this.subcommand = undefined;

				const result = yield* this.pickSubcommandStep(state);
				// Always break on the first step (so we will go back)
				if (result === StepResultBreak) break;

				state.subcommand = result;
			}

			this.subcommand = state.subcommand;

			context.title = getTitle(
				state.subcommand === 'delete' || state.subcommand === 'prune' ? '分支' : this.title,
				state.subcommand,
			);

			if (state.counter < 2 || state.repo == null || typeof state.repo === 'string') {
				skippedStepTwo = false;
				if (context.repos.length === 1) {
					skippedStepTwo = true;
					if (state.repo == null) {
						state.counter++;
					}

					state.repo = context.repos[0];
				} else {
					const result = yield* pickRepositoryStep(state, context);
					if (result === StepResultBreak) continue;

					state.repo = result;
				}
			}

			switch (state.subcommand) {
				case 'create':
					assertStateStepCreate(state);
					yield* this.createCommandSteps(state, context);
					// Clear any chosen name, since we are exiting this subcommand
					state.name = undefined!;
					break;
				case 'delete':
					assertStateStepDelete(state);
					yield* this.deleteCommandSteps(state, context);
					break;
				case 'prune':
					assertStateStepPrune(state);
					yield* this.deleteCommandSteps(state, context);
					break;
				case 'rename':
					assertStateStepRename(state);
					yield* this.renameCommandSteps(state, context);
					// Clear any chosen name, since we are exiting this subcommand
					state.name = undefined!;
					break;
				default:
					endSteps(state);
					break;
			}

			// If we skipped the previous step, make sure we back up past it
			if (skippedStepTwo) {
				state.counter--;
			}
		}

		return state.counter < 0 ? StepResultBreak : undefined;
	}

	private *pickSubcommandStep(state: PartialStepState<State>): StepResultGenerator<State['subcommand']> {
		const step = createPickStep<QuickPickItemOfT<State['subcommand']>>({
			title: this.title,
			placeholder: `选择一个 ${this.label} 命令`,
			items: [
				{
					label: 'create',
					description: '创建一个分支',
					picked: state.subcommand === 'create',
					item: 'create',
				},
				{
					label: 'delete',
					description: '删除指定的分支',
					picked: state.subcommand === 'delete',
					item: 'delete',
				},
				{
					label: 'prune',
					description: '删除没有上游的本地分支',
					picked: state.subcommand === 'prune',
					item: 'prune',
				},
				{
					label: 'rename',
					description: '重命名指定的分支',
					picked: state.subcommand === 'rename',
					item: 'rename',
				},
			],
			buttons: [QuickInputButtons.Back],
		});
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}

	private async *createCommandSteps(state: CreateStepState, context: Context): AsyncStepResultGenerator<void> {
		if (state.flags == null) {
			state.flags = [];
		}

		while (this.canStepsContinue(state)) {
			if (state.counter < 3 || state.reference == null) {
				const result = yield* pickBranchOrTagStep(state, context, {
					placeholder: context =>
						`选择一个分支${context.showTags ? ' 或标签' : ''} 来创建新的分支`,
					picked: state.reference?.ref ?? (await state.repo.getBranch())?.ref,
					titleContext: ' 从',
					value: isRevisionReference(state.reference) ? state.reference.ref : undefined,
				});
				// Always break on the first step (so we will go back)
				if (result === StepResultBreak) break;

				state.reference = result;
			}

			if (state.counter < 4 || state.name == null) {
				const result = yield* inputBranchNameStep(state, context, {
					titleContext: ` 从 ${getReferenceLabel(state.reference, {
						capitalize: true,
						icon: false,
						label: state.reference.refType !== 'branch',
					})}`,
					value: state.name ?? getNameWithoutRemote(state.reference),
				});
				if (result === StepResultBreak) continue;

				state.name = result;
			}

			if (this.confirm(state.confirm)) {
				const result = yield* this.createCommandConfirmStep(state, context);
				if (result === StepResultBreak) continue;

				state.flags = result;
			}

			if (state.flags.includes('--worktree')) {
				const worktreeResult = yield* getSteps(
					this.container,
					{
						command: 'worktree',
						state: {
							subcommand: 'create',
							reference: state.reference,
							createBranch: state.name,
						},
					},
					this.pickedVia,
				);
				if (worktreeResult === StepResultBreak) continue;

				endSteps(state);
				return;
			}

			endSteps(state);
			if (state.flags.includes('--switch')) {
				await state.repo.switch(state.reference.ref, { createBranch: state.name });
			} else {
				state.repo.branch(...state.flags, state.name, state.reference.ref);
			}
		}
	}

	private *createCommandConfirmStep(state: CreateStepState, context: Context): StepResultGenerator<CreateFlags[]> {
		const step: QuickPickStep<FlagsQuickPickItem<CreateFlags>> = createConfirmStep(
			appendReposToTitle(`Confirm ${context.title}`, state, context),
			[
				createFlagsQuickPickItem<CreateFlags>(state.flags, [], {
					label: context.title,
					detail: `创建一个新的名为 ${state.name} 的分支从 ${getReferenceLabel(state.reference)}`,
				}),
				createFlagsQuickPickItem<CreateFlags>(state.flags, ['--switch'], {
					label: `创建并切换到分支`,
					detail: `创建并切换到一个新的名为 ${state.name} 的分支从 ${getReferenceLabel(
						state.reference,
					)}`,
				}),
				createFlagsQuickPickItem<CreateFlags>(state.flags, ['--worktree'], {
					label: `${context.title} 在新的工作树中`,
					description: '避免修改你的工作树',
					detail: `为名为 ${state.name} 的新分支创建一个新的工作树从 ${getReferenceLabel(
						state.reference,
					)}`,
				}),
			],
			context,
		);
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}

	private *deleteCommandSteps(state: DeleteStepState | PruneStepState, context: Context): StepResultGenerator<void> {
		const prune = state.subcommand === 'prune';
		if (state.flags == null) {
			state.flags = [];
		}

		while (this.canStepsContinue(state)) {
			if (state.references != null && !Array.isArray(state.references)) {
				state.references = [state.references];
			}

			if (
				state.counter < 3 ||
				state.references == null ||
				(Array.isArray(state.references) && state.references.length === 0)
			) {
				context.title = getTitle('分支', state.subcommand);

				const result = yield* pickBranchesStep(state, context, {
					filter: prune ? b => !b.current && Boolean(b.upstream?.missing) : b => !b.current,
					picked: state.references?.map(r => r.ref),
					placeholder: prune
						? '选择要删除的没有上游的分支'
						: '选择要删除的分支',
					emptyPlaceholder: prune
						? `${state.repo.formattedName} 中没有缺少上游的分支`
						: undefined,
					sort: { current: false, missingUpstream: true },
				});
				// Always break on the first step (so we will go back)
				if (result === StepResultBreak) break;

				state.references = result;
			}

			context.title = getTitle(
				pluralize('分支', state.references.length, { only: true, plural: '分支' }),
				state.subcommand === 'prune' ? 'delete' : state.subcommand,
			);

			assertStateStepDeleteBranches(state);
			const result = yield* this.deleteCommandConfirmStep(state, context);
			if (result === StepResultBreak) continue;

			state.flags = result;

			endSteps(state);
			state.repo.branchDelete(state.references, {
				force: state.flags.includes('--force'),
				remote: state.flags.includes('--remotes'),
			});
		}
	}

	private *deleteCommandConfirmStep(
		state:
			| DeleteStepState<ExcludeSome<DeleteState, 'references', GitBranchReference>>
			| PruneStepState<ExcludeSome<PruneState, 'references', GitBranchReference>>,
		context: Context,
	): StepResultGenerator<DeleteFlags[]> {
		const confirmations: FlagsQuickPickItem<DeleteFlags>[] = [
			createFlagsQuickPickItem<DeleteFlags>(state.flags, [], {
				label: context.title,
				detail: `删除 ${getReferenceLabel(state.references)}`,
			}),
		];
		if (!state.references.every(b => b.remote)) {
			confirmations.push(
				createFlagsQuickPickItem<DeleteFlags>(state.flags, ['--force'], {
					label: `Force ${context.title}`,
					description: '--force',
					detail: `强制删除 ${getReferenceLabel(state.references)}`,
				}),
			);

			if (state.subcommand !== 'prune' && state.references.some(b => b.upstream != null)) {
				confirmations.push(
					createFlagsQuickPickItem<DeleteFlags>(state.flags, ['--remotes'], {
						label: `${context.title} & Remote${
							state.references.filter(b => !b.remote).length > 1 ? 's' : ''
						}`,
						description: '--remotes',
						detail: `删除 ${getReferenceLabel(state.references)} 以及任何远程跟踪分支`,
					}),
					createFlagsQuickPickItem<DeleteFlags>(state.flags, ['--force', '--remotes'], {
						label: `Force ${context.title} & Remote${
							state.references.filter(b => !b.remote).length > 1 ? 's' : ''
						}`,
						description: '--force --remotes',
						detail: `强制删除 ${getReferenceLabel(
							state.references,
						)} 以及任何远程跟踪分支`,
					}),
				);
			}
		}

		const step: QuickPickStep<FlagsQuickPickItem<DeleteFlags>> = createConfirmStep(
			appendReposToTitle(`Confirm ${context.title}`, state, context),
			confirmations,
			context,
		);
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}

	private async *renameCommandSteps(state: RenameStepState, context: Context): AsyncStepResultGenerator<void> {
		if (state.flags == null) {
			state.flags = [];
		}

		while (this.canStepsContinue(state)) {
			if (state.counter < 3 || state.reference == null) {
				const result = yield* pickBranchStep(state, context, {
					filter: b => !b.remote,
					picked: state.reference?.ref,
					placeholder: '选择一个分支以重命名',
				});
				// Always break on the first step (so we will go back)
				if (result === StepResultBreak) break;

				state.reference = result;
			}

			if (state.counter < 4 || state.name == null) {
				const result = yield* inputBranchNameStep(state, context, {
					titleContext: ` ${getReferenceLabel(state.reference, false)}`,
					value: state.name ?? state.reference.name,
				});
				if (result === StepResultBreak) continue;

				state.name = result;
			}

			const result = yield* this.renameCommandConfirmStep(state, context);
			if (result === StepResultBreak) continue;

			state.flags = result;

			endSteps(state);
			state.repo.branch(...state.flags, state.reference.ref, state.name);
		}
	}

	private *renameCommandConfirmStep(state: RenameStepState, context: Context): StepResultGenerator<RenameFlags[]> {
		const step: QuickPickStep<FlagsQuickPickItem<RenameFlags>> = createConfirmStep(
			appendReposToTitle(`Confirm ${context.title}`, state, context),
			[
				createFlagsQuickPickItem<RenameFlags>(state.flags, ['-m'], {
					label: context.title,
					detail: `重命名 ${getReferenceLabel(state.reference)} 为 ${state.name}`,
				}),
			],
			context,
		);
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}
}
