import { dueLabel, SCAFFOLD_LABEL, STATUS_LABEL } from '@/app/labels';
import { useServices } from '@/app/services';
import styles from '@/app/skills/skills.module.css';
import type { LearnerHandle } from '@/app/useLearner';
import { MASTERY } from '@/core/engine/learnerState';
import { prerequisitesReady } from '@/core/engine/selection';

export function SkillsScreen({ learner, onBack }: { learner: LearnerHandle; onBack(): void }) {
  const { content, clock } = useServices();
  const state = learner.state;
  if (!state) return null;
  const now = clock.now();
  const groups = [...new Set(content.skills.map((s) => s.group))];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button
          className="link"
          onClick={onBack}
        >
          ← Back
        </button>
        <h1>Skills</h1>
        <p>
          Mastered means {MASTERY.fluentAttempts} fluent attempts, on at least{' '}
          {MASTERY.distinctTemplates} different exercises, over {MASTERY.distinctDays} different
          days.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group}>
          <h2>{group}</h2>
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
              {content.skills
                .filter((s) => s.group === group)
                .map((skill) => {
                  const s = state.skills.get(skill.id)!;
                  return (
                    <tr key={skill.id}>
                      <td>
                        <span className={styles.name}>{skill.name}</span>
                        <span className={styles.summary}>{skill.summary}</span>
                      </td>
                      <td>
                        <span className={styles[s.status]}>{STATUS_LABEL[s.status]}</span>
                      </td>
                      <td>{s.status === 'new' ? '—' : SCAFFOLD_LABEL[s.scaffold]}</td>
                      <td>{s.fluentCompose.length}</td>
                      <td>
                        {s.status === 'new' ?
                          '—'
                        : prerequisitesReady(state, skill) ?
                          dueLabel(s.card?.dueAt, now)
                        : 'After prerequisites'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
