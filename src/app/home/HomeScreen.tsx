import { useRef, useState } from 'react';
import styles from '@/app/home/home.module.css';
import { useServices } from '@/app/services';
import type { LearnerHandle } from '@/app/useLearner';
import { prerequisitesReady } from '@/core/engine/selection';
import type { Attempt } from '@/core/model/attempt';

type Props = {
  learner: LearnerHandle;
  onStart(mode: 'practice' | 'placement'): void;
  onSkills(): void;
};

const EXPORT_FORMAT = 'syntax-drills/attempts';

export function HomeScreen({ learner, onStart, onSkills }: Props) {
  const { attempts, learner: who, clock, content } = useServices();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const state = learner.state;
  if (!state) return null;

  const now = clock.now();
  const skills = [...state.skills.values()];
  const count = (status: string) => skills.filter((s) => s.status === status).length;
  const due = content.skills
    .filter((def) => prerequisitesReady(state, def))
    .map((def) => state.skills.get(def.id)!)
    .filter((s) => s.card && s.card.dueAt <= now).length;
  const firstRun = state.attemptCount === 0;

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
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Syntax Drills</h1>
        <p>Short, literal {content.languageName} exercises, until the syntax is in your fingers.</p>
      </header>

      <section className={styles.stats}>
        <Stat
          label="Due now"
          value={due}
        />
        <Stat
          label="Learning"
          value={count('learning')}
        />
        <Stat
          label="Mastered"
          value={count('mastered')}
        />
        <Stat
          label="Not started"
          value={count('new')}
        />
      </section>

      <section className={styles.start}>
        {firstRun ?
          <>
            <button
              className="primary"
              onClick={() => onStart('placement')}
            >
              Take the placement test
            </button>
            <button onClick={() => onStart('practice')}>Start from the beginning</button>
            <p className={styles.note}>
              Placement is up to 15 exercises, hardest first. Every skill you pass also marks its
              prerequisites as known, so you skip what you already know.
            </p>
          </>
        : <button
            className="primary"
            onClick={() => onStart('practice')}
          >
            Start a 10-minute session
          </button>
        }
      </section>

      <footer className={styles.footer}>
        <button
          className="link"
          onClick={onSkills}
        >
          Skills
        </button>
        <button
          className="link"
          onClick={() => void exportLog()}
        >
          Export history
        </button>
        <button
          className="link"
          onClick={() => fileInput.current?.click()}
        >
          Import history
        </button>
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
      </footer>
      {notice && <p className={styles.note}>{notice}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
