import type { LearnerState } from '@/core/engine/learnerState';
import { pickFor, type Pick, type SessionItem } from '@/core/engine/selection';
import type { SkillGraph } from '@/core/engine/skillGraph';
import type { ContentPack } from '@/core/model/content';
import type { SkillId } from '@/core/model/ids';

export const PLACEMENT_MAX_ITEMS = 15;

/*
 * Placement tests the most advanced untested skill first. A pass marks all its
 * prerequisites as known (done in applyAttempt); a fail rules out testing anything
 * that builds on it. It stops after PLACEMENT_MAX_ITEMS or when nothing is left.
 */
export function pickPlacement(
  state: LearnerState,
  content: ContentPack,
  graph: SkillGraph,
  ctx: { items: SessionItem[]; random: () => number },
): Pick | null {
  if (ctx.items.length >= PLACEMENT_MAX_ITEMS) return null;

  const tested = new Set(ctx.items.map((i) => i.focusSkillId));
  const blocked = new Set<SkillId>();
  for (const item of ctx.items) {
    if (item.performance !== 'fail') continue;
    blocked.add(item.focusSkillId);
    for (const id of graph.descendants(item.focusSkillId)) blocked.add(id);
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
      avoid: new Set(ctx.items.map((i) => i.templateId)),
    });
    if (pick) return pick;
  }
  return null;
}
