import { useCallback, useEffect, useRef, useState } from 'react';
import { ulid } from 'ulid';
import { KeystrokeTimer } from '@/app/session/keystrokeTimer';
import { useServices } from '@/app/services';
import type { LearnerHandle } from '@/app/useLearner';
import { SESSION_LENGTH_MS } from '@/core/engine/engine';
import { targetMs, type Performance } from '@/core/engine/fluency';
import type { SkillChange } from '@/core/engine/learnerState';
import type { Pick as ExercisePick, SessionEntry } from '@/core/engine/selection';
import { summarizeSession, type SessionSummary } from '@/core/engine/summary';
import type { Attempt } from '@/core/model/attempt';
import type { Exercise } from '@/core/model/content';
import type { GradeResult } from '@/core/ports/language';

export type SessionMode = 'practice' | 'placement';
export const MAX_SUBMISSIONS = 3;

/*
 * loading → working ⇄ grading → passed → (next) loading
 *                           ↘ (reveal or 3 misses) retype → (pass) loading
 * Placement skips retype. Practice ends at the first exercise boundary after 10 minutes.
 */
export type Phase = 'loading' | 'working' | 'grading' | 'passed' | 'retype' | 'done';

export type CurrentExercise = {
  pick: ExercisePick;
  exercise: Exercise;
  shownAt: Date;
  timer: KeystrokeTimer;
  submissions: number;
  errorClasses: string[];
  lastResult: GradeResult | null;
  /** Changes whenever the editor should reset. */
  editorKey: number;
};

export type PassInfo = {
  performance: Performance;
  totalMs: number;
  targetMs: number;
  idiomFlags: string[];
};

type Result = { attempt: Attempt; performance: Performance; cps: number };

export function useDrillSession(
  mode: SessionMode,
  learner: LearnerHandle,
  onFinish: (summary: SessionSummary) => void,
) {
  const { engine, runtime, clock, events, learner: who, content } = useServices();
  const [phase, setPhase] = useState<Phase>('loading');
  const [current, setCurrent] = useState<CurrentExercise | null>(null);
  const [pass, setPass] = useState<PassInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => clock.now());

  const session = useRef({
    id: ulid(),
    startedAt: clock.now(),
    started: false,
    entries: [] as SessionEntry[],
    results: [] as Result[],
    changes: [] as SkillChange[],
    lastPerformance: 'fail' as Performance,
    editorKey: 0,
  });

  const finish = useCallback(() => {
    const s = session.current;
    const summary = summarizeSession(s.id, s.results, s.changes);
    events.emit({ type: 'session.completed', summary, at: clock.now().toISOString() });
    setPhase('done');
    onFinish(summary);
  }, [clock, events, onFinish]);

  const loadNext = useCallback(async () => {
    const s = session.current;
    const state = learner.state;
    if (!state) return;
    setPhase('loading');
    setPass(null);
    const at = clock.now();
    if (mode === 'practice' && at.getTime() - s.startedAt.getTime() >= SESSION_LENGTH_MS) {
      finish();
      return;
    }
    const ctx = { entries: s.entries, random: Math.random };
    const pick =
      mode === 'placement' ?
        engine.pickPlacement(state, ctx)
      : engine.pickNext(state, { ...ctx, now: at });
    if (!pick) {
      finish();
      return;
    }
    try {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const exercise = await runtime.instantiate(pick.template, seed, pick.scaffold);
      setCurrent({
        pick,
        exercise,
        shownAt: clock.now(),
        timer: new KeystrokeTimer(),
        submissions: 0,
        errorClasses: [],
        lastResult: null,
        editorKey: ++s.editorKey,
      });
      setPhase('working');
    } catch (e) {
      setError(`Could not load the next exercise (${pick.template.id}): ${String(e)}`);
    }
  }, [clock, engine, finish, learner.state, mode, runtime]);

  /* Start once the learner state is loaded. The ref guard keeps StrictMode from starting twice. */
  useEffect(() => {
    if (!learner.state || session.current.started) return;
    session.current.started = true;
    events.emit({
      type: 'session.started',
      sessionId: session.current.id,
      mode,
      at: clock.now().toISOString(),
    });
    void loadNext();
  }, [clock, events, learner.state, loadNext, mode]);

  useEffect(() => {
    const timer = setInterval(() => setNow(clock.now()), 1000);
    return () => clearInterval(timer);
  }, [clock]);

  const record = useCallback(
    async (
      current: CurrentExercise,
      fields: Pick<
        Attempt,
        'passed' | 'revealed' | 'idiomFlags' | 'finalCode' | 'submissions' | 'errorClasses'
      >,
    ) => {
      const s = session.current;
      const attempt: Attempt = {
        id: ulid(),
        learnerId: who.id,
        languageId: content.languageId,
        sessionId: s.id,
        mode: current.pick.reason === 'warmup' ? 'warmup' : mode,
        contentVersion: content.version,
        templateId: current.pick.template.id,
        seed: current.exercise.seed,
        scaffold: current.exercise.scaffold,
        skillIds: current.pick.template.skillIds,
        targetChars: current.exercise.targetChars,
        startedAt: current.shownAt.toISOString(),
        ...current.timer.snapshot(),
        ...fields,
      };
      const result = await learner.record(attempt);
      s.results.push({ attempt, performance: result.performance, cps: result.cps });
      s.changes.push(...result.changes);
      s.lastPerformance = result.performance;
      return { attempt, ...result };
    },
    [content.languageId, content.version, learner, mode, who.id],
  );

  const next = useCallback(() => {
    if (!current) return;
    session.current.entries.push({
      templateId: current.pick.template.id,
      skillIds: current.pick.template.skillIds,
      focusSkillId: current.pick.focusSkillId,
      scaffold: current.exercise.scaffold,
      reason: current.pick.reason,
      performance: session.current.lastPerformance,
    });
    void loadNext();
  }, [current, loadNext]);

  const reveal = useCallback(
    async (current: CurrentExercise, code: string) => {
      await record(current, {
        passed: false,
        revealed: true,
        idiomFlags: [],
        finalCode: code,
        submissions: current.submissions,
        errorClasses: current.errorClasses,
      });
      if (mode === 'placement') {
        session.current.entries.push({
          templateId: current.pick.template.id,
          skillIds: current.pick.template.skillIds,
          focusSkillId: current.pick.focusSkillId,
          scaffold: current.exercise.scaffold,
          reason: current.pick.reason,
          performance: 'fail',
        });
        void loadNext();
        return;
      }
      setCurrent({ ...current, lastResult: null, editorKey: ++session.current.editorKey });
      setPhase('retype');
    },
    [loadNext, mode, record],
  );

  const submit = useCallback(
    async (code: string) => {
      if (!current || (phase !== 'working' && phase !== 'retype')) return;
      const retyping = phase === 'retype';
      setPhase('grading');
      let result: GradeResult;
      try {
        result = await runtime.grade(current.exercise, code);
      } catch (e) {
        setError(`Grading failed: ${String(e)}`);
        return;
      }

      if (retyping) {
        if (result.outcome === 'pass') next();
        else {
          setCurrent({ ...current, lastResult: result });
          setPhase('retype');
        }
        return;
      }

      const updated: CurrentExercise = {
        ...current,
        submissions: current.submissions + 1,
        errorClasses:
          result.errorClass ? [...current.errorClasses, result.errorClass] : current.errorClasses,
        lastResult: result,
      };
      setCurrent(updated);

      if (result.outcome === 'pass') {
        const { attempt, performance, cps } = await record(updated, {
          passed: true,
          revealed: false,
          idiomFlags: result.idiomFlags,
          finalCode: code,
          submissions: updated.submissions,
          errorClasses: updated.errorClasses,
        });
        setPass({
          performance,
          totalMs: attempt.totalMs,
          targetMs: targetMs(attempt.scaffold, attempt.targetChars, cps),
          idiomFlags: result.idiomFlags,
        });
        setPhase('passed');
      } else if (updated.submissions >= MAX_SUBMISSIONS) {
        await reveal(updated, code);
      } else {
        setPhase('working');
      }
    },
    [current, next, phase, record, reveal, runtime],
  );

  return {
    phase,
    current,
    pass,
    error,
    elapsedMs: now.getTime() - session.current.startedAt.getTime(),
    exerciseNumber: session.current.entries.length + (current ? 1 : 0),
    submit,
    reveal: (code: string) => {
      if (current && phase === 'working') void reveal(current, code);
    },
    next,
    end: finish,
  };
}
