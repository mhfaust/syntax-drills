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

/** How far past the larger of time and target the timing bar extends. */
const TIMING_HEADROOM = 1.15;

export function SessionScreen({ mode, learner, onFinish }: Props) {
  const { content } = useServices();
  const session = useDrillSession(mode, learner, onFinish);
  const { phase, current, pass, paused } = session;
  const code = useRef('');
  const nextButton = useRef<HTMLButtonElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    code.current = current?.exercise.starterCode ?? '';
  }, [current?.editorKey, current?.exercise.starterCode]);

  useEffect(() => {
    if (paused) resumeButton.current?.focus();
    else if (phase === 'passed') nextButton.current?.focus();
  }, [phase, paused]);

  const placement = mode === 'placement';
  const skillNames = current?.pick.template.skillIds
    .map((id) => content.skills.find((s) => s.id === id)?.name ?? id)
    .join(' + ');
  const retyping = phase === 'retype';
  const result = current?.lastResult;
  const failed = result && result.outcome !== 'pass';
  const remaining = SESSION_LENGTH_MS - session.elapsedMs;
  const progress =
    placement ?
      Math.min(session.exerciseNumber, PLACEMENT_MAX_EXERCISES) / PLACEMENT_MAX_EXERCISES
    : Math.min(1, session.elapsedMs / SESSION_LENGTH_MS);
  const timingScale = pass ? Math.max(pass.totalMs, pass.targetMs) * TIMING_HEADROOM : 1;
  const fluent = pass?.performance === 'fluent';

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <span className={styles.barTitle}>{placement ? 'Placement' : 'Practice'}</span>
          <span className={styles.barCount}>
            {placement ?
              `${Math.min(session.exerciseNumber, PLACEMENT_MAX_EXERCISES)} of up to ${PLACEMENT_MAX_EXERCISES}`
            : `#${session.exerciseNumber}`}
          </span>
          {!placement && (
            <span className={styles.clock}>
              {remaining > 0 ?
                <>
                  {clockTime(remaining)} <span>left</span>
                </>
              : <span>last exercise</span>}
              {paused && <span> · paused</span>}
            </span>
          )}
          <span className={styles.barEnd}>
            {session.canPause && (
              <button
                className={styles.iconButton}
                aria-label="Pause"
                title="Pause"
                onClick={session.pause}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M9 5v14M15 5v14" />
                </svg>
              </button>
            )}
            <button
              className="link"
              onClick={session.end}
            >
              End session
            </button>
          </span>
        </div>
        <span
          className={styles.progress}
          style={{ width: `${progress * 100}%` }}
          aria-hidden="true"
        />
      </header>

      <div className={styles.main}>
        {session.error && <p className={styles.error}>{session.error}</p>}

        {!current && !session.error && <p className={styles.loading}>Starting Python…</p>}

        {paused && (
          <section
            className={styles.paused}
            role="status"
          >
            <div>
              <strong>Paused</strong>
              <span>The session clock is stopped. The next exercise starts when you continue.</span>
            </div>
            <button
              ref={resumeButton}
              className="primary"
              onClick={session.resume}
            >
              Resume <kbd>↵</kbd>
            </button>
          </section>
        )}

        {current && (
          <main
            className={`${styles.exercise} ${paused ? styles.exercisePaused : ''}`}
            inert={paused}
          >
            <div className={styles.intro}>
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
            </div>

            <section
              className={`${styles.panel} ${failed ? styles.panelError : ''}`}
              aria-label="Code"
            >
              {current.exercise.setup && (
                <div className={styles.given}>
                  <span className={styles.label}>Given</span>
                  <CodeEditor
                    key={`setup-${current.editorKey}`}
                    languageId={content.languageId}
                    initialCode={current.exercise.setup}
                    readOnly
                  />
                </div>
              )}

              {(current.exercise.scaffold === 'copy' || retyping) && (
                <div className={styles.given}>
                  <span className={styles.label}>Type this</span>
                  <CodeEditor
                    key={`ref-${current.editorKey}`}
                    languageId={content.languageId}
                    initialCode={current.exercise.referenceCode}
                    readOnly
                  />
                </div>
              )}

              <div className={styles.yours}>
                <span className={`${styles.label} ${styles.labelStrong}`}>
                  Your code
                  {phase === 'working' && current.submissions > 0 && (
                    <span className={styles.tries}>
                      Try {current.submissions + 1} of {MAX_SUBMISSIONS}
                    </span>
                  )}
                </span>
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
              </div>
            </section>

            {failed && (
              <section
                className={styles.feedbackError}
                role="alert"
              >
                <div className={styles.feedbackHead}>
                  <strong>
                    {OUTCOME_LABEL[result.outcome]}
                    {result.line ? ` on line ${result.line}` : ''}
                  </strong>
                  {result.errorClass && (
                    <span className={styles.errorClass}>{errorLabel(result.errorClass)}</span>
                  )}
                </div>
                {result.message && <pre className={styles.message}>{result.message}</pre>}
              </section>
            )}

            {phase === 'passed' && pass && (
              <section
                className={fluent ? styles.feedbackFluent : styles.feedbackPass}
                role="status"
              >
                <div className={styles.passRow}>
                  <span
                    className={styles.check}
                    aria-hidden="true"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <div className={styles.passText}>
                    <strong>
                      {current.submissions > 1 ?
                        `Correct on try ${current.submissions}`
                      : PERFORMANCE_LABEL[pass.performance]}
                    </strong>
                    <span>
                      {seconds(pass.totalMs)} (target {seconds(pass.targetMs)})
                    </span>
                  </div>
                  <div
                    className={styles.timing}
                    aria-hidden="true"
                  >
                    <span className={styles.timingTrack}>
                      <span
                        className={styles.timingFill}
                        style={{ width: `${(pass.totalMs / timingScale) * 100}%` }}
                      />
                      <span
                        className={styles.timingTarget}
                        style={{ left: `${(pass.targetMs / timingScale) * 100}%` }}
                      />
                    </span>
                    <span className={styles.timingScale}>
                      <span>0s</span>
                      <span>target {seconds(pass.targetMs)}</span>
                    </span>
                  </div>
                </div>
                {pass.idiomFlags.map((flag) => (
                  <div
                    key={flag}
                    className={styles.idiom}
                  >
                    <Prose
                      text={
                        content.idioms.find((i) => i.flag === flag)?.message ?? errorLabel(flag)
                      }
                    />
                  </div>
                ))}
                {pass.idiomFlags.length > 0 && (
                  <div className={styles.idiomatic}>
                    <span className={styles.label}>Idiomatic version</span>
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
                      {placement ? "Skip, I don't know this" : 'Show answer'}
                    </button>
                  )}
                </>
              }
              <span className={styles.keys}>Tab indents · ⌘↵ checks</span>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
