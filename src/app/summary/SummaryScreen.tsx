import { clockTime, errorLabel } from '@/app/labels';
import { useServices } from '@/app/services';
import styles from '@/app/summary/summary.module.css';
import type { SessionSummary } from '@/core/engine/summary';

export function SummaryScreen({ summary, onDone }: { summary: SessionSummary; onDone(): void }) {
  const { content } = useServices();
  const name = (id: string) => content.skills.find((s) => s.id === id)?.name ?? id;
  const scored = summary.passed + summary.failed;

  const rows: [string, string][] = [
    ['Exercises', `${summary.exercises} in ${clockTime(summary.durationMs)}`],
    [
      'Fluent',
      scored > 0 ?
        `${summary.fluent} of ${scored} (${Math.round(summary.fluentRate * 100)}%)`
      : '—',
    ],
    ['Correct', `${summary.passed} of ${scored}`],
    ['Slowest skill', summary.slowestSkillId ? name(summary.slowestSkillId) : '—'],
    ['Most common error', summary.topErrorClass ? errorLabel(summary.topErrorClass) : 'none'],
  ];
  if (summary.newSkillIds.length > 0)
    rows.push(['Started', summary.newSkillIds.map(name).join(', ')]);
  if (summary.masteredSkillIds.length > 0)
    rows.push(['Mastered', summary.masteredSkillIds.map(name).join(', ')]);

  return (
    <div className={styles.screen}>
      <h1>Session done</h1>
      <dl className={styles.list}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className={styles.row}
          >
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        className="primary"
        autoFocus
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}
