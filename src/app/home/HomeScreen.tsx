import { useRef, useState } from 'react';
import { AppHeader, type Nav } from '@/app/header/AppHeader';
import styles from '@/app/home/home.module.css';
import { dueLabel, SCAFFOLD_LABEL } from '@/app/labels';
import { useServices } from '@/app/services';
import type { LearnerHandle } from '@/app/useLearner';
import { prerequisitesReady } from '@/core/engine/selection';
import type { Attempt } from '@/core/model/attempt';

type Props = {
  learner: LearnerHandle;
  nav: Nav;
  onStart(mode: 'practice' | 'placement'): void;
};

const EXPORT_FORMAT = 'syntax-drills/attempts';
const QUEUE_LENGTH = 5;

export function HomeScreen({ learner, nav, onStart }: Props) {
  const { attempts, learner: who, clock, content } = useServices();
  const fileInput = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const state = learner.state;
  if (!state) return null;

  const now = clock.now();
  const total = content.skills.length;
  const skills = [...state.skills.values()];
  const count = (status: string) => skills.filter((s) => s.status === status).length;
  /* Started, unlocked skills, soonest review first. */
  const scheduled = content.skills
    .filter((def) => prerequisitesReady(state, def))
    .map((def) => ({ def, skill: state.skills.get(def.id)! }))
    .filter(({ skill }) => skill.card)
    .sort((a, b) => a.skill.card!.dueAt.getTime() - b.skill.card!.dueAt.getTime());
  const due = scheduled.filter(({ skill }) => skill.card!.dueAt <= now).length;
  const queue = scheduled.slice(0, QUEUE_LENGTH);
  const firstRun = state.attemptCount === 0;

  const stats = [
    { label: 'Due now', value: due, tone: styles.toneAccent },
    { label: 'Learning', value: count('learning'), tone: styles.toneLearning },
    { label: 'Mastered', value: count('mastered'), tone: styles.toneMastered },
    { label: 'Not started', value: count('new'), tone: styles.toneNew },
  ];

  async function exportLog() {
    const log = await attempts.listAll(who.id);
    const blob = new Blob(
      [JSON.stringify({ format: EXPORT_FORMAT, version: 1, attempts: log }, null, 2)],
      {
        type: 'application/json',
      },
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `syntax-drills-${now.toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importLog(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { format?: string; attempts?: Attempt[] };
      if (data.format !== EXPORT_FORMAT || !Array.isArray(data.attempts))
        throw new Error('not an export file');
      /* Imported attempts belong to whoever is practicing here now. */
      await attempts.putMany(data.attempts.map((a) => ({ ...a, learnerId: who.id })));
      await learner.reload();
      setNotice(`Imported ${data.attempts.length} attempts.`);
    } catch (error) {
      setNotice(`Import failed: ${String(error)}`);
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader nav={nav}>
        <button
          className={styles.menuButton}
          popoverTarget="history-menu"
        >
          History
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div
          ref={menu}
          id="history-menu"
          className={styles.menu}
          popover="auto"
        >
          <button
            onClick={() => {
              menu.current?.hidePopover();
              void exportLog();
            }}
          >
            Export history
          </button>
          <button
            onClick={() => {
              menu.current?.hidePopover();
              fileInput.current?.click();
            }}
          >
            Import history
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importLog(file);
            e.target.value = '';
          }}
        />
      </AppHeader>

      <main className={styles.main}>
        {notice && (
          <p
            className={styles.notice}
            role="status"
          >
            {notice}
          </p>
        )}

        <section className={styles.hero}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>
              {firstRun ?
                '// new here'
              : due > 0 ?
                `// ${due} ${due === 1 ? 'skill' : 'skills'} due for review`
              : '// nothing due, practice ahead'}
            </span>
            <h1>
              Keep the syntax
              <br />
              in your fingers.
            </h1>
            <p className={styles.lede}>
              Short, literal {content.languageName} exercises. Type them, get them right, get them
              fast, then move on.
            </p>
            <div className={styles.actions}>
              {firstRun ?
                <>
                  <button
                    className="primary large"
                    onClick={() => onStart('placement')}
                  >
                    Take the placement test
                  </button>
                  <button
                    className="large"
                    onClick={() => onStart('practice')}
                  >
                    Start from the beginning
                  </button>
                  <p className={styles.note}>
                    Placement is up to 15 exercises, hardest first. Every skill you pass also marks
                    its prerequisites as known, so you skip what you already know.
                  </p>
                </>
              : <>
                  <button
                    className="primary large"
                    autoFocus
                    onClick={() => onStart('practice')}
                  >
                    Start a 10-minute session <kbd>↵</kbd>
                  </button>
                  <button
                    className="large"
                    onClick={nav.skills}
                  >
                    Browse skills
                  </button>
                </>
              }
            </div>
          </div>

          <section
            className={styles.queue}
            aria-labelledby="queue-title"
          >
            <div className={styles.queueHead}>
              <h2 id="queue-title">Up for review</h2>
              <button
                className="link"
                onClick={nav.skills}
              >
                All skills →
              </button>
            </div>
            {queue.length > 0 ?
              <ul>
                {queue.map(({ def, skill }) => {
                  const isDue = skill.card!.dueAt <= now;
                  return (
                    <li key={def.id}>
                      <span className={styles.queueName}>{def.name}</span>
                      <span className={styles.chip}>{SCAFFOLD_LABEL[skill.scaffold]}</span>
                      <span className={isDue ? styles.dueNow : styles.dueLater}>
                        {dueLabel(skill.card!.dueAt, now)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            : <p className={styles.empty}>
                Nothing scheduled yet. Skills show up here once you have practiced them.
              </p>
            }
          </section>
        </section>

        <section
          className={styles.stats}
          aria-label="Progress"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${styles.stat} ${s.tone}`}
            >
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{s.value}</span>
              <span
                className={styles.bar}
                aria-hidden="true"
              >
                <span style={{ width: `${total ? (s.value / total) * 100 : 0}%` }} />
              </span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
