import { useCallback, useEffect, useRef, useState } from 'react';
import type { Performance } from '@/core/engine/fluency';
import type { LearnerState, SkillChange } from '@/core/engine/learnerState';
import type { Attempt } from '@/core/model/attempt';
import { useServices } from '@/app/services';

export type RecordResult = { performance: Performance; changes: SkillChange[]; cps: number };

export type LearnerHandle = {
  /** null while the attempt log loads. */
  state: LearnerState | null;
  /** Bumps on every change, since the engine updates `state` in place. */
  version: number;
  record(attempt: Attempt): Promise<RecordResult>;
  /** Replaces in-memory state from the store, e.g. after an import. */
  reload(): Promise<void>;
};

/** Loads the attempt log, replays it into learner state, and records new attempts. */
export function useLearner(): LearnerHandle {
  const { attempts, engine, events, learner, content } = useServices();
  const stateRef = useRef<LearnerState | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const log = await attempts.list(learner.id, content.languageId);
    stateRef.current = engine.replay(log);
    setVersion((v) => v + 1);
  }, [attempts, engine, learner.id, content.languageId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const record = useCallback(
    async (attempt: Attempt): Promise<RecordResult> => {
      const state = stateRef.current;
      if (!state) throw new Error('Learner state is not loaded yet');
      await attempts.add(attempt);
      const cps = state.cps;
      const { performance, changes } = engine.apply(state, attempt);
      events.emit({ type: 'attempt.recorded', attempt, performance });
      for (const change of changes)
        events.emit({ type: 'skill.changed', change, at: attempt.startedAt });
      setVersion((v) => v + 1);
      return { performance, changes, cps };
    },
    [attempts, engine, events],
  );

  return { state: stateRef.current, version, record, reload };
}
