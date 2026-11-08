import { targetMs, type Performance } from '@/core/engine/fluency';
import {
  applyAttempt,
  initialLearnerState,
  type LearnerState,
  type SkillChange,
} from '@/core/engine/learnerState';
import { pickPlacement } from '@/core/engine/placement';
import { createReviewScheduler } from '@/core/engine/reviewScheduler';
import {
  pickNext,
  type Pick,
  type SelectionContext,
  type SessionItem,
} from '@/core/engine/selection';
import { buildSkillGraph, type SkillGraph } from '@/core/engine/skillGraph';
import type { Attempt } from '@/core/model/attempt';
import type { ContentPack, Scaffold } from '@/core/model/content';

export const SESSION_LENGTH_MS = 10 * 60 * 1000;

/** The engine's public surface: everything the app needs, for one content pack. */
export type Engine = {
  content: ContentPack;
  graph: SkillGraph;
  /** Rebuilds learner state from the full attempt log, oldest first. */
  replay(attempts: Attempt[]): LearnerState;
  /** Folds one new attempt into `state` in place. */
  apply(
    state: LearnerState,
    attempt: Attempt,
  ): { performance: Performance; changes: SkillChange[] };
  pickNext(state: LearnerState, ctx: SelectionContext): Pick | null;
  pickPlacement(
    state: LearnerState,
    ctx: { items: SessionItem[]; random: () => number },
  ): Pick | null;
  targetMs(state: LearnerState, scaffold: Scaffold, targetChars: number): number;
};

export async function createEngine(content: ContentPack): Promise<Engine> {
  const scheduler = await createReviewScheduler();
  const graph = buildSkillGraph(content.skills);
  const deps = { content, graph, scheduler };

  return {
    content,
    graph,
    replay(attempts) {
      const state = initialLearnerState(content);
      for (const attempt of attempts) applyAttempt(state, attempt, deps);
      return state;
    },
    apply: (state, attempt) => applyAttempt(state, attempt, deps),
    pickNext: (state, ctx) => pickNext(state, content, ctx),
    pickPlacement: (state, ctx) => pickPlacement(state, content, graph, ctx),
    targetMs: (state, scaffold, targetChars) => targetMs(scaffold, targetChars, state.cps),
  };
}
