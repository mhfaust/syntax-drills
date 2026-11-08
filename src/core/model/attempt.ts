import type { Scaffold } from '@/core/model/content';
import type {
  AttemptId,
  LanguageId,
  LearnerId,
  SessionId,
  SkillId,
  TemplateId,
} from '@/core/model/ids';

export type AttemptMode = 'warmup' | 'practice' | 'placement';

/**
 * One exercise, start to finish. Attempts are append-only facts: everything else
 * (skill state, schedules, mastery, summaries) is derived by replaying them.
 */
export type Attempt = {
  id: AttemptId;
  learnerId: LearnerId;
  languageId: LanguageId;
  sessionId: SessionId;
  mode: AttemptMode;
  contentVersion: number;

  templateId: TemplateId;
  seed: number;
  scaffold: Scaffold;
  skillIds: SkillId[];
  targetChars: number;

  /** ISO 8601, UTC. */
  startedAt: string;
  /** Time from the item appearing to the first keystroke; null if nothing was typed. */
  firstKeyMs: number | null;
  /** Time from the item appearing to the passing submission, or to the reveal. */
  totalMs: number;
  longestPauseMs: number;
  keystrokes: number;
  backspaces: number;

  submissions: number;
  /** True when the learner asked for the answer (or ran out of submissions). */
  revealed: boolean;
  /** True when a submission passed before any reveal. */
  passed: boolean;
  errorClasses: string[];
  idiomFlags: string[];
  finalCode: string;
};
