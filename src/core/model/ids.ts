/*
 * Identifier types. They are plain strings so records stay easy to serialize and sync.
 * Namespacing conventions keep them unique across languages:
 *   LanguageId  'python'
 *   SkillId     'python/enumerate'
 *   TemplateId  'python/enumerate-numbered-labels'
 *   Error/idiom 'py.missing-colon', 'py.range-len-index'
 */
export type LearnerId = string;
export type LanguageId = string;
export type SkillId = string;
export type TemplateId = string;
export type SessionId = string;
export type AttemptId = string;
