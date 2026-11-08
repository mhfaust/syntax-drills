import type { Skill } from '@/core/model/content';
import type { SkillId } from '@/core/model/ids';

export type SkillGraph = {
  byId: Map<SkillId, Skill>;
  ancestors(skillId: SkillId): Set<SkillId>;
  descendants(skillId: SkillId): Set<SkillId>;
};

export function buildSkillGraph(skills: Skill[]): SkillGraph {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const children = new Map<SkillId, SkillId[]>();
  for (const skill of skills) {
    for (const parent of skill.prerequisites) {
      children.set(parent, [...(children.get(parent) ?? []), skill.id]);
    }
  }

  const walk = (start: SkillId, next: (id: SkillId) => SkillId[]): Set<SkillId> => {
    const seen = new Set<SkillId>();
    const stack = [...next(start)];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...next(id));
    }
    return seen;
  };

  return {
    byId,
    ancestors: (id) => walk(id, (x) => byId.get(x)?.prerequisites ?? []),
    descendants: (id) => walk(id, (x) => children.get(x) ?? []),
  };
}
