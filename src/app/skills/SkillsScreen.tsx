import { useState } from 'react';
import { AppHeader, type Nav } from '@/app/header/AppHeader';
import { dueLabel, SCAFFOLD_LABEL, STATUS_LABEL } from '@/app/labels';
import { useServices } from '@/app/services';
import styles from '@/app/skills/skills.module.css';
import type { LearnerHandle } from '@/app/useLearner';
import { MASTERY, type SkillStatus } from '@/core/engine/learnerState';
import { prerequisitesReady } from '@/core/engine/selection';
import type { Scaffold } from '@/core/model/content';
import type { SkillId } from '@/core/model/ids';

type Props = {
  learner: LearnerHandle;
  nav: Nav;
  onOverview(skillId: SkillId): void;
};

type Filter = 'all' | SkillStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'learning', label: STATUS_LABEL.learning },
  { id: 'mastered', label: STATUS_LABEL.mastered },
  { id: 'new', label: STATUS_LABEL.new },
];

/** Position of each scaffold on the copy → fill in → write ladder. */
const LADDER: Record<Scaffold, number> = { copy: 1, fill: 2, compose: 3 };
const RUNGS = [1, 2, 3];

export function SkillsScreen({ learner, nav, onOverview }: Props) {
  const { content, clock } = useServices();
  const [filter, setFilter] = useState<Filter>('all');
  const state = learner.state;
  if (!state) return null;
  const now = clock.now();
  const groups = [...new Set(content.skills.map((s) => s.group))];
  const statusOf = (id: SkillId) => state.skills.get(id)!.status;
  const countOf = (f: Filter) =>
    f === 'all' ? content.skills.length : content.skills.filter((s) => statusOf(s.id) === f).length;
  const dots = Array.from({ length: MASTERY.fluentAttempts }, (_, i) => i);

  return (
    <div className={styles.page}>
      <AppHeader
        nav={nav}
        current="skills"
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.title}>
            <h1>Skills</h1>
            <p>
              Mastered means {MASTERY.fluentAttempts} fluent attempts, on at least{' '}
              {MASTERY.distinctTemplates} different exercises, over {MASTERY.distinctDays} different
              days.
            </p>
          </div>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter by status"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className={styles.count}>{countOf(f.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {groups.map((group) => {
          const all = content.skills.filter((s) => s.group === group);
          const shown = all.filter((s) => filter === 'all' || statusOf(s.id) === filter);
          if (shown.length === 0) return null;
          const mastered = all.filter((s) => statusOf(s.id) === 'mastered').length;
          return (
            <section
              key={group}
              className={styles.group}
            >
              <div className={styles.groupHead}>
                <h2>{group}</h2>
                <span>
                  {mastered} of {all.length} mastered
                </span>
              </div>
              <div className={styles.card}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Status</th>
                      <th>Level</th>
                      <th>Fluent</th>
                      <th>Next review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((skill) => {
                      const s = state.skills.get(skill.id)!;
                      const started = s.status !== 'new';
                      const rung = started ? LADDER[s.scaffold] : 0;
                      const fluent = Math.min(s.fluentCompose.length, MASTERY.fluentAttempts);
                      const due =
                        !started ? '—'
                        : prerequisitesReady(state, skill) ? dueLabel(s.card?.dueAt, now)
                        : 'After prerequisites';
                      return (
                        <tr key={skill.id}>
                          <td>
                            <button
                              className={styles.name}
                              onClick={() => onOverview(skill.id)}
                            >
                              {skill.name}
                            </button>
                            <span className={styles.summary}>{skill.summary}</span>
                          </td>
                          <td>
                            <span className={`${styles.status} ${styles[s.status]}`}>
                              {STATUS_LABEL[s.status]}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.ladder} ${styles[s.status]}`}
                              aria-hidden="true"
                            >
                              {RUNGS.map((r) => (
                                <span
                                  key={r}
                                  className={r <= rung ? styles.on : undefined}
                                />
                              ))}
                            </span>
                            <span className={styles.level}>
                              {started ? SCAFFOLD_LABEL[s.scaffold] : '—'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={styles.dots}
                              aria-hidden="true"
                            >
                              {dots.map((d) => (
                                <span
                                  key={d}
                                  className={d < fluent ? styles.on : undefined}
                                />
                              ))}
                            </span>
                            <span className="visually-hidden">
                              {s.fluentCompose.length} of {MASTERY.fluentAttempts}
                            </span>
                          </td>
                          <td className={due === 'Due now' ? styles.dueNow : styles.due}>{due}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
