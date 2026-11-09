import { useEffect, useRef } from 'react';
import { CodeEditor } from '@/app/editor/CodeEditor';
import {
  clockTime,
  errorLabel,
  OUTCOME_LABEL,
  PERFORMANCE_LABEL,
  REASON_LABEL,
  SCAFFOLD_HINT,
  SCAFFOLD_LABEL,
  seconds,
} from '@/app/labels';
import { Prose } from '@/app/Prose';
import { useServices } from '@/app/services';
import styles from '@/app/session/session.module.css';
import { MAX_SUBMISSIONS, useDrillSession, type SessionMode } from '@/app/session/useDrillSession';
import type { LearnerHandle } from '@/app/useLearner';
import { SESSION_LENGTH_MS } from '@/core/engine/engine';
import { PLACEMENT_MAX_EXERCISES } from '@/core/engine/placement';
import type { SessionSummary } from '@/core/engine/summary';

type Props = {
  mode: SessionMode;
  learner: LearnerHandle;
  onFinish(summary: SessionSummary): void;
};

export function SessionScreen({ mode, learner, onFinish }: Props) {
  const { content } = useServices();
  const session = useDrillSession(mode, learner, onFinish);
  const { phase, current, pass } = session;
  const code = useRef('');
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    code.current = current?.exercise.starterCode ?? '';
  }, [current?.editorKey, current?.exercise.starterCode]);

  useEffect(() => {
    if (phase === 'passed') nextButton.current?.focus();
  }, [phase]);

  const skillNames = current?.pick.template.skillIds
    .map((id) => content.skills.find((s) => s.id === id)?.name ?? id)
    .join(' + ');
  const retyping = phase === 'retype';
  const result = current?.lastResult;
  const failed = result && result.outcome !== 'pass';
  const remaining = SESSION_LENGTH_MS - session.elapsedMs;

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <span className={styles.barTitle}>{mode === 'placement' ? 'Placement' : 'Practice'}</span>
        <span className={styles.barMeta}>
          {mode === 'placement' ?
            `${Math.min(session.exerciseNumber, PLACEMENT_MAX_EXERCISES)} of up to ${PLACEMENT_MAX_EXERCISES}`
          : `#${session.exerciseNumber} · ${remaining > 0 ? `${clockTime(remaining)} left` : 'last exercise'}`
          }
        </span>
        <button
          className="link"
          onClick={session.end}
        >
          End session
        </button>
      </header>

      {session.error && <p className={styles.error}>{session.error}</p>}

      {!current && !session.error && <p className={styles.loading}>Starting Python…</p>}

      {current && (
        <main className={styles.card}>
          <div className={styles.tags}>
            <span className={styles.tag}>{REASON_LABEL[current.pick.reason]}</span>
            <span className={styles.tag}>{SCAFFOLD_LABEL[current.exercise.scaffold]}</span>
            <span className={styles.skills}>{skillNames}</span>
          </div>

          <h1 className={styles.prompt}>
            <Prose text={current.exercise.prompt} />
          </h1>
          <p className={styles.hint}>
            {retyping ?
              'Here is one answer. Type it out to continue.'
            : SCAFFOLD_HINT[current.exercise.scaffold]}
          </p>

          {current.exercise.setup && (
            <section className={styles.block}>
              <span className={styles.blockLabel}>Given</span>
              <CodeEditor
                key={`setup-${current.editorKey}`}
                languageId={content.languageId}
                initialCode={current.exercise.setup}
                readOnly
              />
            </section>
          )}

          {(current.exercise.scaffold === 'copy' || retyping) && (
            <section className={`${styles.block} ${styles.reference}`}>
              <span className={styles.blockLabel}>Type this</span>
              <CodeEditor
                key={`ref-${current.editorKey}`}
                languageId={content.languageId}
                initialCode={current.exercise.referenceCode}
                readOnly
              />
            </section>
          )}

          <section className={`${styles.block} ${styles.editor}`}>
            <span className={styles.blockLabel}>Your code</span>
            <CodeEditor
              key={`edit-${current.editorKey}`}
              languageId={content.languageId}
              initialCode={retyping ? '' : current.exercise.starterCode}
              blank="___"
              placeholderText={
                current.exercise.scaffold === 'compose' && !retyping ?
                  'Write your code here'
                : undefined
              }
              onChange={(c) => (code.current = c)}
              onKey={(k) => current.timer.key(k)}
              onSubmit={(c) => void session.submit(c)}
            />
          </section>

          {failed && (
            <section
              className={styles.feedbackError}
              role="alert"
            >
              <strong>
                {OUTCOME_LABEL[result.outcome]}
                {result.line ? ` on line ${result.line}` : ''}
              </strong>
              {result.message && <pre className={styles.message}>{result.message}</pre>}
              {result.errorClass && (
                <span className={styles.errorClass}>{errorLabel(result.errorClass)}</span>
              )}
            </section>
          )}

          {phase === 'passed' && pass && (
            <section
              className={
                pass.performance === 'fluent' ? styles.feedbackFluent : styles.feedbackPass
              }
              role="status"
            >
              <strong>
                {current.submissions > 1 ?
                  `Correct on try ${current.submissions}`
                : PERFORMANCE_LABEL[pass.performance]}
              </strong>
              <span>
                {seconds(pass.totalMs)} (target {seconds(pass.targetMs)})
              </span>
              {pass.idiomFlags.map((flag) => (
                <div
                  key={flag}
                  className={styles.idiom}
                >
                  <Prose
                    text={content.idioms.find((i) => i.flag === flag)?.message ?? errorLabel(flag)}
                  />
                </div>
              ))}
              {pass.idiomFlags.length > 0 && (
                <div className={styles.block}>
                  <span className={styles.blockLabel}>Idiomatic version</span>
                  <CodeEditor
                    languageId={content.languageId}
                    initialCode={current.exercise.referenceCode}
                    readOnly
                  />
                </div>
              )}
            </section>
          )}

          <footer className={styles.actions}>
            {phase === 'passed' ?
              <button
                ref={nextButton}
                className="primary"
                onClick={session.next}
              >
                Next <kbd>↵</kbd>
              </button>
            : <>
                <button
                  className="primary"
                  disabled={phase === 'grading' || phase === 'loading'}
                  onClick={() => void session.submit(code.current)}
                >
                  {phase === 'grading' ? 'Checking…' : 'Check'} <kbd>⌘↵</kbd>
                </button>
                {phase !== 'retype' && current.exercise.scaffold !== 'copy' && (
                  <button
                    disabled={phase !== 'working'}
                    onClick={() => session.reveal(code.current)}
                  >
                    {mode === 'placement' ? "Skip, I don't know this" : 'Show answer'}
                  </button>
                )}
                {phase === 'working' && current.submissions > 0 && (
                  <span className={styles.tries}>
                    Try {current.submissions + 1} of {MAX_SUBMISSIONS}
                  </span>
                )}
              </>
            }
          </footer>
        </main>
      )}
    </div>
  );
}
