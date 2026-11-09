import type { LearnerState } from '@/core/engine/learnerState';
import { pickFor, type Pick, type SessionEntry } from '@/core/engine/selection';
import type { SkillGraph } from '@/core/engine/skillGraph';
import type { ContentPack } from '@/core/model/content';
import type { SkillId } from '@/core/model/ids';

export const PLACEMENT_MAX_EXERCISES = 15;

/*
 * Placement tests the most advanced untested skill first. A pass marks all its
 * prerequisites as known (done in applyAttempt); a fail rules out testing anything
 * that builds on it. It stops after PLACEMENT_MAX_EXERCISES or when nothing is left.
 */
export function pickPlacement(
  state: LearnerState,
  content: ContentPack,
  graph: SkillGraph,
  ctx: { entries: SessionEntry[]; random: () => number },
): Pick | null {
  if (ctx.entries.length >= PLACEMENT_MAX_EXERCISES) return null;

  const tested = new Set(ctx.entries.map((i) => i.focusSkillId));
  const blocked = new Set<SkillId>();
  for (const entry of ctx.entries) {
    if (entry.performance !== 'fail') continue;
    blocked.add(entry.focusSkillId);
    for (const id of graph.descendants(entry.focusSkillId)) blocked.add(id);
  }

  const candidates = content.skills
    .filter(
      (s) => state.skills.get(s.id)?.status === 'new' && !tested.has(s.id) && !blocked.has(s.id),
    )
    .map((s) => ({ id: s.id, depth: graph.ancestors(s.id).size, tiebreak: ctx.random() }))
    .sort((a, b) => b.depth - a.depth || a.tiebreak - b.tiebreak);

  for (const candidate of candidates) {
    const pick = pickFor(state, content, candidate.id, 'compose', 'placement', ctx.random, {
      singleSkillOnly: true,
      avoid: new Set(ctx.entries.map((i) => i.templateId)),
    });
    if (pick) return pick;
  }
  return null;
}
