import type { Attempt } from '@/core/model/attempt';
import type { LanguageId, LearnerId } from '@/core/model/ids';

/** The event log. Only appends in normal use; `putMany` exists for import and sync. */
export interface AttemptStore {
  add(attempt: Attempt): Promise<void>;
  /** All attempts for a learner and language, oldest first. */
  list(learnerId: LearnerId, languageId: LanguageId): Promise<Attempt[]>;
  /** All attempts for a learner across languages, oldest first. */
  listAll(learnerId: LearnerId): Promise<Attempt[]>;
  /** Insert or replace by id. */
  putMany(attempts: Attempt[]): Promise<void>;
}
