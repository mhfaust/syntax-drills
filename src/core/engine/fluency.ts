import type { Attempt } from '@/core/model/attempt';
import type { Scaffold } from '@/core/model/content';

/** How an attempt went, from worst to best. */
export type Performance = 'fail' | 'slow' | 'pass' | 'fluent';

/** Time allowed for reading and thinking before typing, by scaffold. */
export const THINK_MS: Record<Scaffold, number> = { copy: 2500, fill: 5000, compose: 8000 };

/** Typing speed in characters per second, before there is any data. */
export const DEFAULT_CPS = 3.5;
const MIN_CPS = 1;
const MAX_CPS = 12;
/** Weight of each new observation in the running typing-speed estimate. */
const CPS_SMOOTHING = 0.25;

export function targetMs(scaffold: Scaffold, targetChars: number, cps: number): number {
  return Math.round(THINK_MS[scaffold] + (targetChars / cps) * 1000);
}

type GradedFields = Pick<
  Attempt,
  'passed' | 'revealed' | 'submissions' | 'totalMs' | 'scaffold' | 'targetChars'
>;

/**
 * fluent: first submission, within the target time
 * pass:   first submission, within twice the target time
 * slow:   passed, but slower or after more submissions
 * fail:   never passed, or the answer was revealed
 */
export function classifyPerformance(attempt: GradedFields, cps: number): Performance {
  if (!attempt.passed || attempt.revealed) return 'fail';
  const target = targetMs(attempt.scaffold, attempt.targetChars, cps);
  if (attempt.submissions === 1 && attempt.totalMs <= target) return 'fluent';
  if (attempt.submissions === 1 && attempt.totalMs <= target * 2) return 'pass';
  return 'slow';
}

/** Learns typing speed from first-try copy passes, where nearly all the time is typing. */
export function updateTypingSpeed(
  cps: number,
  attempt: Pick<
    Attempt,
    'scaffold' | 'passed' | 'revealed' | 'submissions' | 'totalMs' | 'firstKeyMs' | 'targetChars'
  >,
): number {
  if (attempt.scaffold !== 'copy' || !attempt.passed || attempt.revealed) return cps;
  if (attempt.submissions !== 1 || attempt.firstKeyMs === null) return cps;
  const typingMs = attempt.totalMs - attempt.firstKeyMs;
  if (typingMs <= 0 || attempt.targetChars < 10) return cps;
  const observed = clamp(attempt.targetChars / (typingMs / 1000), MIN_CPS, MAX_CPS);
  return cps + CPS_SMOOTHING * (observed - cps);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
