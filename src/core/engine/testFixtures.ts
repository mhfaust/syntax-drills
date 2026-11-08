import type { Attempt } from '@/core/model/attempt';
import type { ContentPack, ItemTemplate, Skill } from '@/core/model/content';

/*
 * A tiny content pack for engine tests:
 *   loop ─┬─ enum
 *         └─ comp ── dictcomp
 *   fstr (no prerequisites)
 */
const skill = (id: string, prerequisites: string[] = []): Skill => ({
  id: `t/${id}`,
  languageId: 't',
  name: id,
  group: 'Test',
  summary: id,
  prerequisites: prerequisites.map((p) => `t/${p}`),
});

const template = (id: string, skills: string[], difficulty = 900): ItemTemplate => ({
  id: `t/${id}`,
  languageId: 't',
  skillIds: skills.map((s) => `t/${s}`),
  difficulty,
  spec: {},
});

export const testContent: ContentPack = {
  languageId: 't',
  languageName: 'Test',
  packId: 't/core',
  version: 1,
  skills: [
    skill('loop'),
    skill('fstr'),
    skill('enum', ['loop']),
    skill('comp', ['loop']),
    skill('dictcomp', ['comp']),
  ],
  templates: [
    template('loop-a', ['loop']),
    template('loop-b', ['loop'], 1000),
    template('fstr-a', ['fstr']),
    template('fstr-b', ['fstr']),
    template('enum-a', ['enum']),
    template('enum-b', ['enum']),
    template('comp-a', ['comp']),
    template('comp-b', ['comp']),
    template('dictcomp-a', ['dictcomp']),
    template('enum-fstr', ['enum', 'fstr'], 1100),
  ],
  idioms: [{ flag: 't.range-len', skillId: 't/enum', message: 'Use enumerate.' }],
};

let counter = 0;

/** A fluent first-try pass by default; override what the test cares about. */
export function makeAttempt(overrides: Partial<Attempt> & Pick<Attempt, 'templateId'>): Attempt {
  counter += 1;
  const template = testContent.templates.find((t) => t.id === overrides.templateId)!;
  return {
    id: `a${counter}`,
    learnerId: 'local',
    languageId: 't',
    sessionId: 's1',
    mode: 'practice',
    contentVersion: 1,
    seed: 1,
    scaffold: 'compose',
    skillIds: template.skillIds,
    targetChars: 20,
    startedAt: '2026-01-01T10:00:00.000Z',
    firstKeyMs: 1000,
    totalMs: 5000,
    longestPauseMs: 500,
    keystrokes: 20,
    backspaces: 0,
    submissions: 1,
    revealed: false,
    passed: true,
    errorClasses: [],
    idiomFlags: [],
    finalCode: '',
    ...overrides,
  };
}

export const failed = { passed: false, submissions: 3, revealed: true } as const;
