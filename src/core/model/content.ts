import type { LanguageId, SkillId, TemplateId } from '@/core/model/ids';

/** How much help an item gives: type a shown solution, fill in blanks, or write it all. */
export type Scaffold = 'copy' | 'fill' | 'compose';
export const SCAFFOLDS: readonly Scaffold[] = ['copy', 'fill', 'compose'];

export type Skill = {
  id: SkillId;
  languageId: LanguageId;
  name: string;
  group: string;
  summary: string;
  prerequisites: SkillId[];
};

/**
 * One exercise family. The core only needs its id, skills and difficulty; `spec` is the
 * language-specific body (generator, solution, checks) and is opaque here.
 */
export type ItemTemplate = {
  id: TemplateId;
  languageId: LanguageId;
  skillIds: SkillId[];
  /** Authored difficulty on the same scale as skill ratings (roughly 800–1300). */
  difficulty: number;
  spec: unknown;
};

/** A non-idiomatic pattern a grader can flag, and the skill that teaches the idiom. */
export type Idiom = {
  flag: string;
  skillId: SkillId;
  message: string;
};

export type ContentPack = {
  languageId: LanguageId;
  /** Shown in the UI, e.g. 'Python'. */
  languageName: string;
  packId: string;
  version: number;
  /** In introduction order: new skills are offered from the top. */
  skills: Skill[];
  templates: ItemTemplate[];
  idioms: Idiom[];
};

/** A template turned into a concrete exercise with generated data, at one scaffold level. */
export type ItemInstance = {
  templateId: TemplateId;
  seed: number;
  scaffold: Scaffold;
  prompt: string;
  /** Read-only code shown above the editor (the data the learner works with). */
  setup: string;
  /** Initial editor contents: empty for copy and compose, code with blanks for fill. */
  starterCode: string;
  /** The idiomatic solution, shown for copy, after a reveal, and next to non-idiomatic passes. */
  referenceCode: string;
  /** Characters the learner is expected to type; used for target times. */
  targetChars: number;
  /** Language-specific grading data, passed back to the runtime untouched. */
  payload: unknown;
};
