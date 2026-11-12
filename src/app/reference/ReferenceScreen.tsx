import { useEffect, useState } from 'react';
import { AppHeader, type Nav } from '@/app/header/AppHeader';
import { STATUS_LABEL } from '@/app/labels';
import { Markdown } from '@/app/reference/Markdown';
import styles from '@/app/reference/reference.module.css';
import { useServices } from '@/app/services';
import type { LearnerHandle } from '@/app/useLearner';
import type { SkillId } from '@/core/model/ids';

type Props = {
  learner: LearnerHandle;
  /** The overview to open on; defaults to the first skill. */
  skillId?: SkillId;
  nav: Nav;
  /** Escape goes back to wherever the reference was opened from. */
  onBack(): void;
};

/*
 * Every skill's overview, one at a time. Nothing is locked: skills not started yet are
 * only shown muted, since this is a reference.
 */
export function ReferenceScreen({ learner, skillId, nav, onBack }: Props) {
  const { content } = useServices();
  const skills = content.skills;
  const groups = [...new Set(skills.map((s) => s.group))];
  const ordered = groups.flatMap((g) => skills.filter((s) => s.group === g));
  const [currentId, setCurrentId] = useState<SkillId>(skillId ?? ordered[0]!.id);
  const index = ordered.findIndex((s) => s.id === currentId);
  const skill = ordered[index]!;
  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const status = learner.state?.skills.get(skill.id)?.status ?? 'new';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLSelectElement || event.metaKey || event.ctrlKey) return;
      if (event.key === 'ArrowLeft' && prev) setCurrentId(prev.id);
      else if (event.key === 'ArrowRight' && next) setCurrentId(next.id);
      else if (event.key === 'Escape') onBack();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onBack]);

  const isNew = (id: SkillId) => (learner.state?.skills.get(id)?.status ?? 'new') === 'new';

  return (
    <div className={styles.page}>
      <AppHeader
        nav={nav}
        current="reference"
      />
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>Reference</h1>
          <p>One short cheat sheet per skill: the forms, a few examples, and the usual slips.</p>
        </header>

        <div className={styles.layout}>
          <nav
            className={styles.nav}
            aria-label="Skills"
          >
            <select
              className={styles.picker}
              aria-label="Skill"
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
            >
              {groups.map((group) => (
                <optgroup
                  key={group}
                  label={group}
                >
                  {ordered
                    .filter((s) => s.group === group)
                    .map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                      >
                        {s.name}
                        {isNew(s.id) ? ' (not started)' : ''}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            <div className={styles.list}>
              {groups.map((group) => (
                <section key={group}>
                  <h2>{group}</h2>
                  <ul>
                    {ordered
                      .filter((s) => s.group === group)
                      .map((s) => (
                        <li key={s.id}>
                          <button
                            className={`${styles.item} ${isNew(s.id) ? styles.itemNew : ''}`}
                            aria-current={s.id === currentId ? 'page' : undefined}
                            title={isNew(s.id) ? 'Not started yet' : undefined}
                            onClick={() => setCurrentId(s.id)}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </nav>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <span className={styles.group}>{skill.group}</span>
              <h1>{skill.name}</h1>
              <span className={`${styles.status} ${styles[status]}`}>
                {status === 'new' ? 'Not started yet' : STATUS_LABEL[status]}
              </span>
            </header>
            {skill.overview ?
              <Markdown
                key={skill.id}
                source={skill.overview}
                languageId={content.languageId}
              />
            : <p className={styles.missing}>No overview yet.</p>}

            <footer className={styles.pager}>
              {prev ?
                <button onClick={() => setCurrentId(prev.id)}>
                  <kbd>←</kbd> {prev.name}
                </button>
              : <span />}
              {next && (
                <button onClick={() => setCurrentId(next.id)}>
                  {next.name} <kbd>→</kbd>
                </button>
              )}
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
