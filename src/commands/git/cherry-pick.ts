import type { Container } from '../../container';
import type { GitBranch } from '../../git/models/branch';
import type { GitLog } from '../../git/models/log';
import type { GitReference } from '../../git/models/reference';
import { createRevisionRange, getReferenceLabel, isRevisionReference } from '../../git/models/reference';
import type { Repository } from '../../git/models/repository';
import type { FlagsQuickPickItem } from '../../quickpicks/items/flags';
import { createFlagsQuickPickItem } from '../../quickpicks/items/flags';
import type { ViewsWithRepositoryFolders } from '../../views/viewBase';
import type {
	PartialStepState,
	QuickPickStep,
	StepGenerator,
	StepResult,
	StepResultGenerator,
	StepSelection,
	StepState,
} from '../quickCommand';
import { canPickStepContinue, createConfirmStep, endSteps, QuickCommand, StepResultBreak } from '../quickCommand';
import { appendReposToTitle, pickBranchOrTagStep, pickCommitsStep, pickRepositoryStep } from '../quickCommand.steps';

interface Context {
	repos: Repository[];
	associatedView: ViewsWithRepositoryFolders;
	cache: Map<string, Promise<GitLog | undefined>>;
	destination: GitBranch;
	selectedBranchOrTag: GitReference | undefined;
	showTags: boolean;
	title: string;
}

type Flags = '--edit' | '--no-commit';

interface State<Refs = GitReference | GitReference[]> {
	repo: string | Repository;
	references: Refs;
	flags: Flags[];
}

export interface CherryPickGitCommandArgs {
	readonly command: 'cherry-pick';
	state?: Partial<State>;
}

type CherryPickStepState<T extends State = State> = ExcludeSome<StepState<T>, 'repo', string>;

export class CherryPickGitCommand extends QuickCommand<State> {
	constructor(container: Container, args?: CherryPickGitCommandArgs) {
		super(container, 'cherry-pick', 'cherry-pick', 'Cherry Pick', {
			description: '将指定提交的更改集成到当前分支中',
		});

		let counter = 0;
		if (args?.state?.repo != null) {
			counter++;
		}

		if (args?.state?.references != null) {
			if (Array.isArray(args.state.references)) {
				if (args.state.references.length > 0) {
					if (isRevisionReference(args.state.references[0])) {
						counter += 2;
					} else {
						counter++;
					}
				}
			} else {
				counter++;
			}
		}

		this.initialState = {
			counter: counter,
			confirm: true,
			...args?.state,
		};
	}

	override get canSkipConfirm(): boolean {
		return false;
	}

	execute(state: CherryPickStepState<State<GitReference[]>>) {
		state.repo.cherryPick(...state.flags, ...state.references.map(c => c.ref).reverse());
	}

	override isFuzzyMatch(name: string) {
		return super.isFuzzyMatch(name) || name === 'cherry';
	}

	protected async *steps(state: PartialStepState<State>): StepGenerator {
		const context: Context = {
			repos: this.container.git.openRepositories,
			associatedView: this.container.commitsView,
			cache: new Map<string, Promise<GitLog | undefined>>(),
			destination: undefined!,
			selectedBranchOrTag: undefined,
			showTags: true,
			title: this.title,
		};

		if (state.flags == null) {
			state.flags = [];
		}

		if (state.references != null && !Array.isArray(state.references)) {
			state.references = [state.references];
		}

		let skippedStepOne = false;

		while (this.canStepsContinue(state)) {
			context.title = this.title;

			if (state.counter < 1 || state.repo == null || typeof state.repo === 'string') {
				skippedStepOne = false;
				if (context.repos.length === 1) {
					skippedStepOne = true;
					if (state.repo == null) {
						state.counter++;
					}

					state.repo = context.repos[0];
				} else {
					const result = yield* pickRepositoryStep(state, context);
					// Always break on the first step (so we will go back)
					if (result === StepResultBreak) break;

					state.repo = result;
				}
			}

			if (context.destination == null) {
				const branch = await state.repo.getBranch();
				if (branch == null) break;

				context.destination = branch;
			}

			context.title = `${this.title} into ${getReferenceLabel(context.destination, {
				icon: false,
			})}`;

			if (state.counter < 2 || state.references == null || state.references.length === 0) {
				const result: StepResult<GitReference> = yield* pickBranchOrTagStep(
					state as CherryPickStepState,
					context,
					{
						filter: { branches: b => b.id !== context.destination.id },
						placeholder: context =>
							`选择一个分支${context.showTags ? '或标签' : ''} 来优选`,
						picked: context.selectedBranchOrTag?.ref,
						value: context.selectedBranchOrTag == null ? state.references?.[0]?.ref : undefined,
					},
				);
				if (result === StepResultBreak) {
					// If we skipped the previous step, make sure we back up past it
					if (skippedStepOne) {
						state.counter--;
					}

					continue;
				}

				if (isRevisionReference(result)) {
					state.references = [result];
					context.selectedBranchOrTag = undefined;
				} else {
					context.selectedBranchOrTag = result;
				}
			}

			if (context.selectedBranchOrTag == null && state.references?.length) {
				const branches = await this.container.git.getCommitBranches(
					state.repo.path,
					state.references.map(r => r.ref),
					undefined,
					{ mode: 'contains' },
				);
				if (branches.length) {
					const branch = await state.repo.getBranch(branches[0]);
					if (branch != null) {
						context.selectedBranchOrTag = branch;
					}
				}
			}

			if (state.counter < 3 && context.selectedBranchOrTag != null) {
				const ref = createRevisionRange(context.destination.ref, context.selectedBranchOrTag.ref);

				let log = context.cache.get(ref);
				if (log == null) {
					log = this.container.git.getLog(state.repo.path, { ref: ref, merges: 'first-parent' });
					context.cache.set(ref, log);
				}

				const result: StepResult<GitReference[]> = yield* pickCommitsStep(
					state as CherryPickStepState,
					context,
					{
						log: await log,
						onDidLoadMore: log => context.cache.set(ref, Promise.resolve(log)),
						picked: state.references?.map(r => r.ref),
						placeholder: (context, log) =>
							log == null
								? `未找到可挑选的提交，在 ${getReferenceLabel(context.selectedBranchOrTag, {
										icon: false,
								  })}`
								: `选择提交来优选 ${getReferenceLabel(context.destination, {
										icon: false,
								  })}`,
					},
				);
				if (result === StepResultBreak) continue;

				state.references = result;
			}

			if (this.confirm(state.confirm)) {
				const result = yield* this.confirmStep(state as CherryPickStepState, context);
				if (result === StepResultBreak) continue;

				state.flags = result;
			}

			endSteps(state);
			this.execute(state as CherryPickStepState<State<GitReference[]>>);
		}

		return state.counter < 0 ? StepResultBreak : undefined;
	}

	private *confirmStep(state: CherryPickStepState, context: Context): StepResultGenerator<Flags[]> {
		const step: QuickPickStep<FlagsQuickPickItem<Flags>> = createConfirmStep(
			appendReposToTitle(`确认 ${context.title}`, state, context),
			[
				createFlagsQuickPickItem<Flags>(state.flags, [], {
					label: this.title,
					detail: `将会应用 ${getReferenceLabel(state.references)} 到 ${getReferenceLabel(
						context.destination,
					)}`,
				}),
				createFlagsQuickPickItem<Flags>(state.flags, ['--edit'], {
					label: `${this.title} & Edit`,
					description: '--edit',
					detail: `将会编辑并应用 ${getReferenceLabel(state.references)} 到 ${getReferenceLabel(
						context.destination,
					)}`,
				}),
				createFlagsQuickPickItem<Flags>(state.flags, ['--no-commit'], {
					label: `${this.title}，不提交`,
					description: '--no-commit',
					detail: `将会应用 ${getReferenceLabel(state.references)} 到 ${getReferenceLabel(
						context.destination,
					)} ，不提交`,
				}),
			],
			context,
		);
		const selection: StepSelection<typeof step> = yield step;
		return canPickStepContinue(step, state, selection) ? selection[0].item : StepResultBreak;
	}
}
