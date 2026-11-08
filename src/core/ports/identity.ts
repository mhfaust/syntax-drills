import type { LearnerId } from '@/core/model/ids';

export type Learner = {
  id: LearnerId;
  displayName: string;
};

/** Who is practicing. v0 always returns the single local learner. */
export interface IdentityProvider {
  current(): Promise<Learner>;
}
