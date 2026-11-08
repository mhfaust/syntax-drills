import { describe, expect, it } from 'vitest';
import {
  classifyPerformance,
  DEFAULT_CPS,
  targetMs,
  updateTypingSpeed,
} from '@/core/engine/fluency';

const base = {
  passed: true,
  revealed: false,
  submissions: 1,
  scaffold: 'compose' as const,
  targetChars: 35,
};
/* compose: 8000 ms thinking + 35 chars / 3.5 cps = 18000 ms */
const target = targetMs('compose', 35, DEFAULT_CPS);

describe('classifyPerformance', () => {
  it('uses thinking time plus typing time as the target', () => {
    expect(target).toBe(18000);
  });

  it('is fluent on a first-try pass within the target', () => {
    expect(classifyPerformance({ ...base, totalMs: target }, DEFAULT_CPS)).toBe('fluent');
  });

  it('is a pass within twice the target', () => {
    expect(classifyPerformance({ ...base, totalMs: target + 1 }, DEFAULT_CPS)).toBe('pass');
  });

  it('is slow beyond twice the target or after several submissions', () => {
    expect(classifyPerformance({ ...base, totalMs: target * 2 + 1 }, DEFAULT_CPS)).toBe('slow');
    expect(classifyPerformance({ ...base, totalMs: 1000, submissions: 2 }, DEFAULT_CPS)).toBe(
      'slow',
    );
  });

  it('is a fail when never passed or revealed', () => {
    expect(classifyPerformance({ ...base, totalMs: 1000, passed: false }, DEFAULT_CPS)).toBe(
      'fail',
    );
    expect(classifyPerformance({ ...base, totalMs: 1000, revealed: true }, DEFAULT_CPS)).toBe(
      'fail',
    );
  });
});

describe('updateTypingSpeed', () => {
  const copy = { ...base, scaffold: 'copy' as const, targetChars: 40, firstKeyMs: 1000 };

  it('moves toward the observed speed on first-try copy passes', () => {
    /* 40 chars in 5 s = 8 cps; a quarter of the way from 3.5 is 4.625 */
    expect(updateTypingSpeed(3.5, { ...copy, totalMs: 6000 })).toBeCloseTo(4.625);
  });

  it('ignores compose attempts and failures', () => {
    expect(updateTypingSpeed(3.5, { ...copy, scaffold: 'compose', totalMs: 6000 })).toBe(3.5);
    expect(updateTypingSpeed(3.5, { ...copy, passed: false, totalMs: 6000 })).toBe(3.5);
  });
});
