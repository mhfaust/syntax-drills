import {
  classifyPerformance,
  DEFAULT_CPS,
  updateTypingSpeed,
  type Performance,
} from '@/core/engine/fluency';
import { INITIAL_SKILL_RATING, PLACED_SKILL_RATING, ratingDeltas } from '@/core/engine/rating';
import {
  makeDueNow,
  type ReviewCard,
  type ReviewGrade,
  type ReviewScheduler,
} from '@/core/engine/reviewScheduler';
import type { SkillGraph } from '@/core/engine/skillGraph';
import type { Attempt } from '@/core/model/attempt';
import { SCAFFOLDS, type ContentPack, type Scaffold } from '@/core/model/content';
import type { SkillId, TemplateId } from '@/core/model/ids';

export type SkillStatus = 'new' | 'learning' | 'mastered';

export type SkillState = {
  skillId: SkillId;
  status: SkillStatus;
  rating: number;
  scaffold: Scaffold;
  /** Consecutive first-try passes at the current scaffold; two in a row move it up. */
  streak: number;
  /** null until the skill is first practiced (or placed). */
  card: ReviewCard | null;
  fluentCompose: { templateId: TemplateId; day: string }[];
  lastComposeFailed: boolean;
  /** Most recent first. */
  recentTemplateIds: TemplateId[];
  attempts: number;
  lastPracticedAt: string | null;
  /** Set when a placement pass showed this skill is already known. */
  placedKnown: boolean;
  /** Set when an idiom for this skill was missed; such skills are introduced first. */
  idiomMissedAt: string | null;
};

export type LearnerState = {
  skills: Map<SkillId, SkillState>;
  templateDifficulty: Map<TemplateId, number>;
  /** Estimated typing speed, characters per second. */
  cps: number;
  attemptCount: number;
};

export type SkillChange = {
  skillId: SkillId;
  fromStatus: SkillStatus;
  toStatus: SkillStatus;
  fromScaffold: Scaffold;
  toScaffold: Scaffold;
};

export const MASTERY = { fluentAttempts: 3, distinctTemplates: 2, distinctDays: 3 } as const;
const PROMOTE_AFTER_STREAK = 2;
const RECENT_TEMPLATES_KEPT = 5;

export function initialLearnerState(content: ContentPack): LearnerState {
  return {
    skills: new Map(content.skills.map((s) => [s.id, newSkillState(s.id)])),
    templateDifficulty: new Map(content.templates.map((t) => [t.id, t.difficulty])),
    cps: DEFAULT_CPS,
    attemptCount: 0,
  };
}

function newSkillState(skillId: SkillId): SkillState {
  return {
    skillId,
    status: 'new',
    rating: INITIAL_SKILL_RATING,
    scaffold: 'copy',
    streak: 0,
    card: null,
    fluentCompose: [],
    lastComposeFailed: false,
    recentTemplateIds: [],
    attempts: 0,
    lastPracticedAt: null,
    placedKnown: false,
    idiomMissedAt: null,
  };
}

type ApplyDeps = { content: ContentPack; graph: SkillGraph; scheduler: ReviewScheduler };

/**
 * Folds one attempt into the learner state, in place. Returns how the attempt was judged
 * and which skills changed status or scaffold, for events and summaries.
 */
export function applyAttempt(
  state: LearnerState,
  attempt: Attempt,
  deps: ApplyDeps,
): { performance: Performance; changes: SkillChange[] } {
  const performance = classifyPerformance(attempt, state.cps);
  state.cps = updateTypingSpeed(state.cps, attempt);
  state.attemptCount += 1;

  const touched = new Map<SkillId, { status: SkillStatus; scaffold: Scaffold }>();
  const touch = (skill: SkillState) => {
    if (!touched.has(skill.skillId)) {
      touched.set(skill.skillId, { status: skill.status, scaffold: skill.scaffold });
    }
    return skill;
  };

  /*
   * Warm-ups only calibrate typing speed. A missed placement item only means "not known
   * yet": the skill stays new, to be introduced from the start when its turn comes.
   */
  const missedPlacement = attempt.mode === 'placement' && performance === 'fail';
  if (attempt.mode !== 'warmup' && !missedPlacement) {
    const at = new Date(attempt.startedAt);
    const skills = attempt.skillIds
      .map((id) => state.skills.get(id))
      .filter((s): s is SkillState => s !== undefined)
      .map(touch);

    if (attempt.scaffold === 'compose') {
      const difficulty = state.templateDifficulty.get(attempt.templateId) ?? INITIAL_SKILL_RATING;
      const delta = ratingDeltas(
        skills.map((s) => s.rating),
        difficulty,
        performance,
      );
      for (const skill of skills) skill.rating += delta.skill;
      state.templateDifficulty.set(attempt.templateId, difficulty + delta.template);
    }

    for (const skill of skills) {
      updateScaffold(skill, attempt, performance);
      skill.card = deps.scheduler.review(
        skill.card ?? deps.scheduler.newCard(skill.skillId, at),
        reviewGrade(performance, attempt.scaffold),
        at,
      );
      if (attempt.scaffold === 'compose') {
        skill.lastComposeFailed = performance === 'fail';
        if (performance === 'fluent') {
          skill.fluentCompose.push({
            templateId: attempt.templateId,
            day: attempt.startedAt.slice(0, 10),
          });
        }
      }
      skill.recentTemplateIds = [attempt.templateId, ...skill.recentTemplateIds].slice(
        0,
        RECENT_TEMPLATES_KEPT,
      );
      skill.attempts += 1;
      skill.lastPracticedAt = attempt.startedAt;
    }

    if (attempt.mode === 'placement' && performance !== 'fail') {
      for (const id of attempt.skillIds) {
        for (const ancestorId of deps.graph.ancestors(id)) {
          const ancestor = state.skills.get(ancestorId);
          if (ancestor && ancestor.attempts === 0 && !ancestor.placedKnown) {
            markPlacedKnown(touch(ancestor), at, deps.scheduler);
          }
        }
      }
    }

    for (const flag of attempt.idiomFlags) {
      const idiom = deps.content.idioms.find((i) => i.flag === flag);
      const skill = idiom && state.skills.get(idiom.skillId);
      if (!skill || attempt.skillIds.includes(skill.skillId)) continue;
      touch(skill);
      if (skill.card) skill.card = makeDueNow(skill.card, at);
      else skill.idiomMissedAt = attempt.startedAt;
    }
  }

  const changes: SkillChange[] = [];
  for (const [skillId, before] of touched) {
    const skill = state.skills.get(skillId)!;
    skill.status = deriveStatus(skill);
    if (skill.status !== before.status || skill.scaffold !== before.scaffold) {
      changes.push({
        skillId,
        fromStatus: before.status,
        toStatus: skill.status,
        fromScaffold: before.scaffold,
        toScaffold: skill.scaffold,
      });
    }
  }
  return { performance, changes };
}

/*
 * A fail drops the skill to one level below the attempt's scaffold (never raising it).
 * A pass above the current level jumps straight there (placement).
 * Two first-try passes in a row at the current level move it up one.
 */
function updateScaffold(skill: SkillState, attempt: Attempt, performance: Performance): void {
  const current = SCAFFOLDS.indexOf(skill.scaffold);
  const attempted = SCAFFOLDS.indexOf(attempt.scaffold);
  if (performance === 'fail') {
    skill.scaffold = SCAFFOLDS[Math.min(current, Math.max(0, attempted - 1))]!;
    skill.streak = 0;
    return;
  }
  if (attempted > current) {
    skill.scaffold = attempt.scaffold;
    skill.streak = 0;
    return;
  }
  if (attempted < current) return;
  skill.streak = attempt.submissions === 1 ? skill.streak + 1 : 0;
  if (skill.streak >= PROMOTE_AFTER_STREAK && current < SCAFFOLDS.length - 1) {
    skill.scaffold = SCAFFOLDS[current + 1]!;
    skill.streak = 0;
  }
}

/** Below compose, a success never earns more than 'hard': it proves recognition, not recall. */
function reviewGrade(performance: Performance, scaffold: Scaffold): ReviewGrade {
  if (performance === 'fail') return 'again';
  if (scaffold !== 'compose' || performance === 'slow') return 'hard';
  return performance === 'fluent' ? 'easy' : 'good';
}

function markPlacedKnown(skill: SkillState, at: Date, scheduler: ReviewScheduler): void {
  skill.placedKnown = true;
  skill.scaffold = 'compose';
  skill.rating = Math.max(skill.rating, PLACED_SKILL_RATING);
  skill.card = scheduler.review(scheduler.newCard(skill.skillId, at), 'good', at);
}

export function deriveStatus(skill: SkillState): SkillStatus {
  if (skill.attempts === 0 && !skill.placedKnown) return 'new';
  return isMastered(skill) ? 'mastered' : 'learning';
}

function isMastered(skill: SkillState): boolean {
  const fluent = skill.fluentCompose;
  return (
    !skill.lastComposeFailed &&
    fluent.length >= MASTERY.fluentAttempts &&
    new Set(fluent.map((f) => f.templateId)).size >= MASTERY.distinctTemplates &&
    new Set(fluent.map((f) => f.day)).size >= MASTERY.distinctDays
  );
}
