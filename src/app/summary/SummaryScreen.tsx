import { clockTime, errorLabel } from '@/app/labels';
import { useServices } from '@/app/services';
import styles from '@/app/summary/summary.module.css';
import type { SessionSummary } from '@/core/engine/summary';

const RING_RADIUS = 62;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function SummaryScreen({ summary, onDone }: { summary: SessionSummary; onDone(): void }) {
  const { content } = useServices();
  const name = (id: string) => content.skills.find((s) => s.id === id)?.name ?? id;
  const scored = summary.passed + summary.failed;
  const fluentPct = Math.round(summary.fluentRate * 100);

  return (
    <main className={styles.screen}>
      <div className={styles.hero}>
        <svg
          className={styles.ring}
          role="img"
          aria-label={scored > 0 ? `${fluentPct}% fluent` : 'No scored exercises'}
          width="148"
          height="148"
          viewBox="0 0 148 148"
        >
          <circle
            className={styles.ringTrack}
            cx="74"
            cy="74"
            r={RING_RADIUS}
          />
          {scored > 0 && fluentPct > 0 && (
            <circle
              className={styles.ringFill}
              cx="74"
              cy="74"
              r={RING_RADIUS}
              strokeDasharray={`${summary.fluentRate * RING_LENGTH} ${RING_LENGTH}`}
              transform="rotate(-90 74 74)"
            />
          )}
          <text
            className={styles.ringValue}
            x="74"
            y="80"
          >
            {scored > 0 ? `${fluentPct}%` : '—'}
          </text>
          <text
            className={styles.ringLabel}
            x="74"
            y="102"
          >
            fluent
          </text>
        </svg>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{'// session complete'}</span>
          <h1>Session done</h1>
          <p>
            {summary.exercises} {summary.exercises === 1 ? 'exercise' : 'exercises'} in{' '}
            {clockTime(summary.durationMs)}.
          </p>
        </div>
      </div>

      <section
        className={styles.stats}
        aria-label="Results"
      >
        <div className={styles.stat}>
          <span>Exercises</span>
          <strong>{summary.exercises}</strong>
        </div>
        <div className={styles.stat}>
          <span>Correct</span>
          <strong>
            {summary.passed} <small>/ {scored}</small>
          </strong>
        </div>
        <div className={`${styles.stat} ${styles.statAccent}`}>
          <span>Fluent</span>
          <strong>
            {summary.fluent} <small>/ {scored}</small>
          </strong>
        </div>
      </section>

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Slowest skill</dt>
          <dd className={styles.code}>
            {summary.slowestSkillId ? name(summary.slowestSkillId) : '—'}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Most common error</dt>
          <dd>
            {summary.topErrorClass ?
              <span className={styles.errorChip}>{errorLabel(summary.topErrorClass)}</span>
            : 'none'}
          </dd>
        </div>
        {summary.newSkillIds.length > 0 && (
          <div className={styles.row}>
            <dt>Started</dt>
            <dd className={styles.chips}>
              {summary.newSkillIds.map((id) => (
                <span
                  key={id}
                  className={styles.learningChip}
                >
                  {name(id)}
                </span>
              ))}
            </dd>
          </div>
        )}
        {summary.masteredSkillIds.length > 0 && (
          <div className={styles.row}>
            <dt>Mastered</dt>
            <dd className={styles.chips}>
              {summary.masteredSkillIds.map((id) => (
                <span
                  key={id}
                  className={styles.masteredChip}
                >
                  {name(id)}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <div>
        <button
          className="primary large"
          autoFocus
          onClick={onDone}
        >
          Done <kbd>↵</kbd>
        </button>
      </div>
    </main>
  );
}
