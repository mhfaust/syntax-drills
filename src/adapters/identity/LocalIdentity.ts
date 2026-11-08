import type { IdentityProvider, Learner } from '@/core/ports/identity';

/**
 * The single learner on this device. When sign-in arrives, an OAuth provider replaces this,
 * and records stored under 'local' get claimed by the signed-in learner on first sign-in.
 */
export const LOCAL_LEARNER: Learner = { id: 'local', displayName: 'You' };

export class LocalIdentity implements IdentityProvider {
  async current(): Promise<Learner> {
    return LOCAL_LEARNER;
  }
}
