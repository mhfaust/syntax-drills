import { targetMs, type Performance } from '@/core/engine/fluency';
import type { SkillChange } from '@/core/engine/learnerState';
import type { Attempt } from '@/core/model/attempt';
import type { SessionId, SkillId } from '@/core/model/ids';

export type SessionSummary = {
  sessionId: SessionId;
  items: number;
  fluent: number;
  passed: number;
  failed: number;
  /** Share of items, warm-ups excluded, that were fluent. */
  fluentRate: number;
  durationMs: number;
  /** The passed skill that took longest relative to its target time. */
  slowestSkillId: SkillId | null;
  topErrorClass: string | null;
  newSkillIds: SkillId[];
  masteredSkillIds: SkillId[];
};

export function summarizeSession(
  sessionId: SessionId,
  results: { attempt: Attempt; performance: Performance; cps: number }[],
  changes: SkillChange[],
): SessionSummary {
  const scored = results.filter((r) => r.attempt.mode !== 'warmup');
  const fluent = scored.filter((r) => r.performance === 'fluent').length;
  const failed = scored.filter((r) => r.performance === 'fail').length;

  let slowestSkillId: SkillId | null = null;
  let slowestRatio = 0;
  for (const { attempt, cps } of scored) {
    if (!attempt.passed) continue;
    const ratio = attempt.totalMs / targetMs(attempt.scaffold, attempt.targetChars, cps);
    if (ratio > slowestRatio) {
      slowestRatio = ratio;
      slowestSkillId = attempt.skillIds[0] ?? null;
    }
  }

  const errorCounts = new Map<string, number>();
  for (const { attempt } of results) {
    for (const e of attempt.errorClasses) errorCounts.set(e, (errorCounts.get(e) ?? 0) + 1);
  }
  const topErrorClass = [...errorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const first = results[0]?.attempt;
  const last = results.at(-1)?.attempt;
  const durationMs =
    first && last ?
      new Date(last.startedAt).getTime() + last.totalMs - new Date(first.startedAt).getTime()
    : 0;

  return {
    sessionId,
    items: results.length,
    fluent,
    passed: scored.length - failed,
    failed,
    fluentRate: scored.length > 0 ? fluent / scored.length : 0,
    durationMs,
    slowestSkillId,
    topErrorClass,
    newSkillIds: unique(changes.filter((c) => c.fromStatus === 'new').map((c) => c.skillId)),
    masteredSkillIds: unique(
      changes
        .filter((c) => c.toStatus === 'mastered' && c.fromStatus !== 'mastered')
        .map((c) => c.skillId),
    ),
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
