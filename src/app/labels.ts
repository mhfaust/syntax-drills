import type { Performance } from '@/core/engine/fluency';
import type { SkillStatus } from '@/core/engine/learnerState';
import type { PickReason } from '@/core/engine/selection';
import type { Scaffold } from '@/core/model/content';
import type { GradeOutcome } from '@/core/ports/language';

export const SCAFFOLD_LABEL: Record<Scaffold, string> = {
  copy: 'Copy',
  fill: 'Fill in',
  compose: 'Write',
};

export const SCAFFOLD_HINT: Record<Scaffold, string> = {
  copy: 'Type the code shown, exactly.',
  fill: 'Replace each ___ to complete the code.',
  compose: 'Write the code from scratch.',
};

export const REASON_LABEL: Record<PickReason, string> = {
  warmup: 'Warm-up',
  retry: 'Try again',
  introduce: 'New skill',
  due: 'Review',
  ahead: 'Practice',
  placement: 'Placement',
};

export const PERFORMANCE_LABEL: Record<Performance, string> = {
  fluent: 'Fluent',
  pass: 'Correct',
  slow: 'Correct, but slow',
  fail: 'Not yet',
};

export const OUTCOME_LABEL: Record<GradeOutcome, string> = {
  pass: 'Correct',
  fail: 'Not quite',
  'syntax-error': 'Syntax error',
  'runtime-error': 'Error while running',
  timeout: 'Timed out',
};

export const STATUS_LABEL: Record<SkillStatus, string> = {
  new: 'New',
  learning: 'Learning',
  mastered: 'Mastered',
};

/** 'py.missing-colon' → 'missing colon'. Works for any language prefix. */
export function errorLabel(errorClass: string): string {
  return errorClass.replace(/^[a-z]+\./, '').replaceAll('-', ' ');
}

export function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function clockTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function dueLabel(due: Date | undefined, now: Date): string {
  if (!due) return '—';
  const days = (due.getTime() - now.getTime()) / 86_400_000;
  if (days <= 0) return 'Due now';
  if (days < 1) return `In ${Math.max(1, Math.round(days * 24))}h`;
  return `In ${Math.round(days)}d`;
}
