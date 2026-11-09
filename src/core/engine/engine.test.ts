import { beforeAll, describe, expect, it } from 'vitest';
import { createEngine, type Engine } from '@/core/engine/engine';
import { pickFor, type SessionEntry } from '@/core/engine/selection';
import { failed, makeAttempt, testContent } from '@/core/engine/testFixtures';

let engine: Engine;
beforeAll(async () => {
  engine = await createEngine(testContent);
});

const day = (n: number) => `2026-01-0${n}T10:00:00.000Z`;
const random = () => 0.5;

const entry = (focus: string, overrides: Partial<SessionEntry> = {}): SessionEntry => ({
  templateId: `t/${focus}-a`,
  skillIds: [`t/${focus}`],
  focusSkillId: `t/${focus}`,
  scaffold: 'compose',
  reason: 'due',
  performance: 'fluent',
  ...overrides,
});

describe('skill status and scaffold', () => {
  it('starts new at copy and becomes learning after an attempt', () => {
    const state = engine.replay([]);
    expect(state.skills.get('t/loop')).toMatchObject({ status: 'new', scaffold: 'copy' });
    engine.apply(state, makeAttempt({ templateId: 't/loop-a', scaffold: 'copy' }));
    expect(state.skills.get('t/loop')?.status).toBe('learning');
  });

  it('moves up a level after two first-try passes in a row', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', scaffold: 'copy' }),
      makeAttempt({ templateId: 't/loop-b', scaffold: 'copy' }),
    ]);
    expect(state.skills.get('t/loop')?.scaffold).toBe('fill');
  });

  it('drops one level below the attempted scaffold on a fail', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', mode: 'placement' }),
      makeAttempt({ templateId: 't/loop-b', ...failed }),
    ]);
    expect(state.skills.get('t/loop')?.scaffold).toBe('fill');
  });

  it('needs 3 fluent compose attempts on 2 templates over 3 days for mastery', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', startedAt: day(1) }),
      makeAttempt({ templateId: 't/loop-a', startedAt: day(2) }),
    ]);
    expect(state.skills.get('t/loop')?.status).toBe('learning');

    const sameDay = engine.apply(state, makeAttempt({ templateId: 't/loop-b', startedAt: day(2) }));
    expect(sameDay.changes).toEqual([]);

    const { changes } = engine.apply(
      state,
      makeAttempt({ templateId: 't/loop-b', startedAt: day(3) }),
    );
    expect(changes).toContainEqual(
      expect.objectContaining({ skillId: 't/loop', fromStatus: 'learning', toStatus: 'mastered' }),
    );
  });

  it('only calibrates typing speed on warm-ups', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', mode: 'warmup', scaffold: 'copy', targetChars: 40 }),
    ]);
    expect(state.skills.get('t/loop')?.status).toBe('new');
    expect(state.cps).not.toBe(3.5);
  });

  it('rebuilds the same state from the log as from incremental updates', () => {
    const attempts = [
      makeAttempt({ templateId: 't/loop-a', scaffold: 'copy', startedAt: day(1) }),
      makeAttempt({ templateId: 't/loop-b', ...failed, startedAt: day(2) }),
      makeAttempt({ templateId: 't/fstr-a', startedAt: day(3) }),
    ];
    const incremental = engine.replay([]);
    for (const a of attempts) engine.apply(incremental, a);
    expect(engine.replay(attempts)).toEqual(incremental);
  });
});

describe('placement', () => {
  it('marks every prerequisite of a passed skill as known', () => {
    const state = engine.replay([makeAttempt({ templateId: 't/dictcomp-a', mode: 'placement' })]);
    for (const id of ['t/comp', 't/loop']) {
      expect(state.skills.get(id)).toMatchObject({
        placedKnown: true,
        scaffold: 'compose',
        status: 'learning',
      });
    }
    expect(state.skills.get('t/enum')?.status).toBe('new');
  });

  it('leaves a missed skill new, so it is introduced from the start later', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/dictcomp-a', mode: 'placement', ...failed }),
    ]);
    expect(state.skills.get('t/dictcomp')).toMatchObject({
      status: 'new',
      scaffold: 'copy',
      card: null,
    });
    const pick = engine.pickNext(state, { now: new Date(day(2)), entries: [], random });
    expect(pick).toMatchObject({ focusSkillId: 't/loop', reason: 'introduce' });
  });

  it('tests the deepest skill first and skips what builds on a failed skill', () => {
    const state = engine.replay([]);
    expect(engine.pickPlacement(state, { entries: [], random })?.focusSkillId).toBe('t/dictcomp');

    const afterFail = engine.pickPlacement(state, {
      entries: [entry('dictcomp', { performance: 'fail' }), entry('comp', { performance: 'fail' })],
      random,
    });
    expect(afterFail?.focusSkillId).toBe('t/enum');
  });
});

describe('pickNext', () => {
  const now = new Date(day(9));

  it('introduces the first unlocked new skill at copy for a brand-new learner', () => {
    const pick = engine.pickNext(engine.replay([]), { now, entries: [], random });
    expect(pick).toMatchObject({ focusSkillId: 't/loop', scaffold: 'copy', reason: 'introduce' });
  });

  it('warms up at copy level, then reviews due skills', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/fstr-a', startedAt: day(1), mode: 'placement' }),
      makeAttempt({ templateId: 't/loop-a', startedAt: day(1), ...failed }),
    ]);
    const warmup = engine.pickNext(state, { now, entries: [], random });
    /* fstr (placed, not due yet) warms up; loop (failed, due) is saved for review */
    expect(warmup).toMatchObject({ reason: 'warmup', scaffold: 'copy', focusSkillId: 't/fstr' });

    const entries = [
      entry('loop', { reason: 'warmup', scaffold: 'copy' }),
      entry('fstr', { reason: 'warmup', scaffold: 'copy' }),
    ];
    expect(engine.pickNext(state, { now, entries, random })).toMatchObject({
      reason: 'due',
      focusSkillId: 't/loop',
    });
  });

  it('warms up on skills that are not due before ones that are', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/fstr-a', startedAt: day(8), mode: 'placement' }),
      makeAttempt({ templateId: 't/loop-a', startedAt: day(1), ...failed }),
    ]);
    const warmup = engine.pickNext(state, { now: new Date(day(8)), entries: [], random });
    expect(warmup).toMatchObject({ reason: 'warmup', focusSkillId: 't/fstr' });
  });

  it('does not repeat a template within a session when there is another', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', startedAt: day(1), ...failed }),
    ]);
    const entries = [entry('loop', { templateId: 't/loop-b', reason: 'warmup', scaffold: 'copy' })];
    for (let i = 0; i < 10; i++) {
      expect(engine.pickNext(state, { now, entries, random: Math.random })?.template.id).not.toBe(
        't/loop-b',
      );
    }
  });

  it('never repeats the last template when the session has used them all', () => {
    /* loop-b was the last one practiced; both have been used this session */
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-b', startedAt: day(1), ...failed }),
    ]);
    const avoid = new Set(['t/loop-a', 't/loop-b']);
    for (let i = 0; i < 10; i++) {
      const pick = pickFor(state, testContent, 't/loop', 'copy', 'due', Math.random, { avoid });
      expect(pick?.template.id).toBe('t/loop-a');
    }
  });

  it('brings a failed skill back after two other exercises', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', mode: 'placement', startedAt: day(8) }),
      makeAttempt({ templateId: 't/fstr-a', mode: 'placement', startedAt: day(8) }),
    ]);
    const soon = new Date(day(8));
    const failedLoop = entry('loop', { performance: 'fail' });
    expect(
      engine.pickNext(state, { now: soon, entries: [failedLoop, entry('fstr')], random })?.reason,
    ).not.toBe('retry');
    expect(
      engine.pickNext(state, {
        now: soon,
        entries: [failedLoop, entry('fstr'), entry('enum')],
        random,
      }),
    ).toMatchObject({ reason: 'retry', focusSkillId: 't/loop' });
  });

  it('introduces at most one new skill per session', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/loop-a', mode: 'placement', startedAt: day(8) }),
    ]);
    const soon = new Date(day(8));
    const warmups = [
      entry('loop', { reason: 'warmup', scaffold: 'copy' }),
      entry('loop', { reason: 'warmup', scaffold: 'copy' }),
    ];
    const first = engine.pickNext(state, { now: soon, entries: warmups, random });
    expect(first?.reason).toBe('introduce');

    const introduced = entry(first!.focusSkillId.slice(2), {
      reason: 'introduce',
      scaffold: 'compose',
    });
    const next = engine.pickNext(state, { now: soon, entries: [...warmups, introduced], random });
    expect(next?.reason).toBe('ahead');
  });

  it('only combines skills that are already learned', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/enum-a', mode: 'placement', startedAt: day(8) }),
    ]);
    for (let i = 0; i < 10; i++) {
      const pick = engine.pickNext(state, { now, entries: [], random: Math.random });
      expect(pick?.template.id).not.toBe('t/enum-fstr');
    }
  });

  it('parks a started skill until its prerequisites reach compose', () => {
    /* comp was practiced and failed, but loop (its prerequisite) is still new */
    const state = engine.replay([makeAttempt({ templateId: 't/comp-a', ...failed })]);
    expect(state.skills.get('t/comp')?.status).toBe('learning');
    for (let i = 0; i < 10; i++) {
      const pick = engine.pickNext(state, { now, entries: [], random: Math.random });
      expect(pick).toMatchObject({ focusSkillId: 't/loop', reason: 'introduce' });
    }

    engine.apply(state, makeAttempt({ templateId: 't/loop-a', startedAt: day(1) }));
    const entries = [
      entry('fstr', { reason: 'warmup', scaffold: 'copy' }),
      entry('fstr', { reason: 'warmup', scaffold: 'copy' }),
    ];
    expect(engine.pickNext(state, { now, entries, random })).toMatchObject({
      focusSkillId: 't/comp',
      reason: 'due',
    });
  });

  it('makes a skill due now when its idiom is missed', () => {
    const state = engine.replay([
      makeAttempt({ templateId: 't/enum-a', mode: 'placement', startedAt: day(1) }),
      makeAttempt({ templateId: 't/fstr-a', startedAt: day(2), idiomFlags: ['t.range-len'] }),
    ]);
    expect(state.skills.get('t/enum')?.card?.dueAt.toISOString()).toBe(day(2));
  });
});
