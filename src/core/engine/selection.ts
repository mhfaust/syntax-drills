import type { Performance } from '@/core/engine/fluency';
import type { LearnerState, SkillState } from '@/core/engine/learnerState';
import { expectedSuccess, meanRating, TARGET_SUCCESS } from '@/core/engine/rating';
import type { ContentPack, ItemTemplate, Scaffold } from '@/core/model/content';
import type { SkillId, TemplateId } from '@/core/model/ids';

export type PickReason = 'warmup' | 'retry' | 'introduce' | 'due' | 'ahead' | 'placement';

export type Pick = {
  template: ItemTemplate;
  scaffold: Scaffold;
  focusSkillId: SkillId;
  reason: PickReason;
};

/** What has happened so far in the current session. */
export type SessionItem = {
  templateId: TemplateId;
  skillIds: SkillId[];
  focusSkillId: SkillId;
  scaffold: Scaffold;
  reason: PickReason;
  performance: Performance;
};

export type SelectionContext = {
  now: Date;
  items: SessionItem[];
  random: () => number;
};

export const WARMUP_ITEMS = 2;
export const MAX_NEW_SKILLS_PER_SESSION = 1;
/** A failed skill comes back after at least this many other items. */
const RETRY_GAP = 2;
const MAX_RETRIES_PER_SKILL = 2;
/** A new skill's copy → fill → compose ladder stops after this many items in one session. */
const MAX_INTRO_ITEMS = 6;
/** Skills seen this recently are skipped for 'ahead' practice, to keep things mixed. */
const AHEAD_EXCLUDE_RECENT = 3;

/**
 * Chooses the next practice item. In priority order:
 *   warm-up (first items of a session, copy level, skills already learned)
 *   retry (a skill failed a couple of items ago)
 *   introduce (continue, or start, this session's new skill)
 *   due (skills whose review date has passed, most overdue first)
 *   ahead (earliest-due skill, practiced early)
 */
export function pickNext(
  state: LearnerState,
  content: ContentPack,
  ctx: SelectionContext,
): Pick | null {
  const lastSkills = new Set(ctx.items.at(-1)?.skillIds ?? []);
  const learned = content.skills
    .map((s) => state.skills.get(s.id)!)
    .filter((s) => s.status !== 'new');
  const byDue = [...learned].sort((a, b) => dueTime(a) - dueTime(b));

  const usedTemplates = new Set(ctx.items.map((i) => i.templateId));
  const make = (skill: SkillState, reason: PickReason, scaffold = skill.scaffold) =>
    pickFor(state, content, skill.skillId, scaffold, reason, ctx.random, { avoid: usedTemplates });

  /* Warm up on skills that aren't due, so the warm-up doesn't hand over a review's answer. */
  if (ctx.items.length < WARMUP_ITEMS && ctx.items.every((i) => i.reason === 'warmup')) {
    const notDue = learned
      .filter((s) => dueTime(s) > ctx.now.getTime())
      .sort((a, b) => (a.lastPracticedAt ?? '').localeCompare(b.lastPracticedAt ?? ''));
    const skill = [...notDue, ...byDue].find((s) => !lastSkills.has(s.skillId));
    const pick = skill && make(skill, 'warmup', 'copy');
    if (pick) return pick;
  }

  const practiced = ctx.items.filter((i) => i.reason !== 'warmup');

  for (const skill of learned) {
    const items = practiced.filter((i) => i.focusSkillId === skill.skillId);
    const last = items.at(-1);
    if (!last || last.performance !== 'fail') continue;
    const gap = practiced.length - 1 - practiced.lastIndexOf(last);
    const retries = items.filter((i) => i.reason === 'retry').length;
    if (gap >= RETRY_GAP && retries < MAX_RETRIES_PER_SKILL) {
      const pick = make(skill, 'retry');
      if (pick) return pick;
    }
  }

  const introduced = [
    ...new Set(practiced.filter((i) => i.reason === 'introduce').map((i) => i.focusSkillId)),
  ];
  for (const skillId of introduced) {
    const items = practiced.filter((i) => i.focusSkillId === skillId);
    const composedOk = items.some((i) => i.scaffold === 'compose' && i.performance !== 'fail');
    if (!composedOk && items.length < MAX_INTRO_ITEMS) {
      const pick = make(state.skills.get(skillId)!, 'introduce');
      if (pick) return pick;
    }
  }

  for (const skill of byDue) {
    if (dueTime(skill) > ctx.now.getTime() || lastSkills.has(skill.skillId)) continue;
    const pick = make(skill, 'due');
    if (pick) return pick;
  }

  if (introduced.length < MAX_NEW_SKILLS_PER_SESSION) {
    for (const skill of unlockedNewSkills(state, content)) {
      const pick = make(skill, 'introduce');
      if (pick) return pick;
    }
  }

  const recent = new Set(practiced.slice(-AHEAD_EXCLUDE_RECENT).map((i) => i.focusSkillId));
  const ahead =
    byDue.find((s) => !recent.has(s.skillId)) ??
    byDue.find((s) => !lastSkills.has(s.skillId)) ??
    byDue[0];
  return ahead ? make(ahead, 'ahead') : null;
}

/**
 * New skills whose prerequisites are all learned to compose level, in content order,
 * with skills flagged by a missed idiom first.
 */
export function unlockedNewSkills(state: LearnerState, content: ContentPack): SkillState[] {
  const unlocked = content.skills
    .filter((skill) =>
      skill.prerequisites.every((p) => {
        const prereq = state.skills.get(p);
        return prereq !== undefined && prereq.status !== 'new' && prereq.scaffold === 'compose';
      }),
    )
    .map((s) => state.skills.get(s.id)!)
    .filter((s) => s.status === 'new');
  return [
    ...unlocked.filter((s) => s.idiomMissedAt !== null),
    ...unlocked.filter((s) => s.idiomMissedAt === null),
  ];
}

export function pickFor(
  state: LearnerState,
  content: ContentPack,
  skillId: SkillId,
  scaffold: Scaffold,
  reason: PickReason,
  random: () => number,
  options: TemplateOptions = {},
): Pick | null {
  const template = chooseTemplate(state, content, skillId, scaffold, random, options);
  return template ? { template, scaffold, focusSkillId: skillId, reason } : null;
}

type TemplateOptions = {
  singleSkillOnly?: boolean;
  /** Templates already used this session; skipped when there is an alternative. */
  avoid?: Set<TemplateId>;
};

/*
 * Copy and fill use single-skill templates, so the blanks are about the focus skill.
 * Compose may combine skills, but only with skills already learned. Among candidates,
 * compose picks the predicted success closest to the target; the others pick at random.
 * Recently used templates, and ones already used this session, are skipped when there is an alternative.
 */
function chooseTemplate(
  state: LearnerState,
  content: ContentPack,
  skillId: SkillId,
  scaffold: Scaffold,
  random: () => number,
  options: TemplateOptions,
): ItemTemplate | null {
  const skill = state.skills.get(skillId);
  if (!skill) return null;
  const forSkill = content.templates.filter((t) => t.skillIds.includes(skillId));
  const single = forSkill.filter((t) => t.skillIds.length === 1);
  const combinable = forSkill.filter((t) =>
    t.skillIds.every((id) => id === skillId || state.skills.get(id)?.status !== 'new'),
  );
  const pool =
    scaffold === 'compose' && !options.singleSkillOnly ? combinable
    : single.length > 0 ? single
    : combinable;
  if (pool.length === 0) return null;

  const recent = new Set([...skill.recentTemplateIds.slice(0, 2), ...(options.avoid ?? [])]);
  const fresh = pool.filter((t) => !recent.has(t.id));
  const notLast = pool.filter((t) => t.id !== skill.recentTemplateIds[0]);
  const candidates =
    fresh.length > 0 ? fresh
    : notLast.length > 0 ? notLast
    : pool;

  if (scaffold !== 'compose') {
    return candidates[Math.floor(random() * candidates.length)] ?? null;
  }
  let best: ItemTemplate | null = null;
  let bestScore = Infinity;
  for (const template of candidates) {
    const rating = meanRating(template.skillIds.map((id) => state.skills.get(id)?.rating ?? 0));
    const difficulty = state.templateDifficulty.get(template.id) ?? template.difficulty;
    const score = Math.abs(expectedSuccess(rating, difficulty) - TARGET_SUCCESS) + random() * 0.05;
    if (score < bestScore) {
      best = template;
      bestScore = score;
    }
  }
  return best;
}

function dueTime(skill: SkillState): number {
  return skill.card?.dueAt.getTime() ?? 0;
}
