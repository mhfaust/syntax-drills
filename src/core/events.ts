import type { Performance } from '@/core/engine/fluency';
import type { SkillChange } from '@/core/engine/learnerState';
import type { SessionSummary } from '@/core/engine/summary';
import type { Attempt } from '@/core/model/attempt';
import type { SessionId } from '@/core/model/ids';

/*
 * Domain events. Nothing listens yet; gamification, analytics and sync will subscribe here
 * instead of being wired into the session flow.
 */
export type DomainEvent =
  | { type: 'session.started'; sessionId: SessionId; mode: 'practice' | 'placement'; at: string }
  | { type: 'attempt.recorded'; attempt: Attempt; performance: Performance }
  | { type: 'skill.changed'; change: SkillChange; at: string }
  | { type: 'session.completed'; summary: SessionSummary; at: string };

export type DomainEventType = DomainEvent['type'];
type EventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;

export type EventBus = {
  emit(event: DomainEvent): void;
  on<T extends DomainEventType>(type: T, handler: (event: EventOf<T>) => void): () => void;
};

export function createEventBus(): EventBus {
  const handlers = new Map<DomainEventType, Set<(event: DomainEvent) => void>>();
  return {
    emit(event) {
      for (const handler of handlers.get(event.type) ?? []) handler(event);
    },
    on(type, handler) {
      const set = handlers.get(type) ?? new Set();
      const wrapped = handler as (event: DomainEvent) => void;
      set.add(wrapped);
      handlers.set(type, set);
      return () => set.delete(wrapped);
    },
  };
}
