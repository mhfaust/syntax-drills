# Ideas

Improvements to consider later. Nothing here is planned or built yet.

## Resuming a session after a reload

A session lives only in memory, so closing or reloading the tab (paused or not) loses the
rest of it. Recorded attempts are kept. Resuming would mean storing the session id, its
entries and the session clock, and picking up at the next exercise.

## Priming a session with overviews

Show the relevant overviews before a session starts, so the learner is primed for it.
Reuses the skill overview cards (`content/python/core/overviews/`, rendered by
`src/app/reference/Markdown.tsx`).

- Prime the new skill, not the review skills. Reviews only strengthen memory when the
  learner has to pull the syntax out of their own head. Reading the card a minute before a
  review turns recall into copying from short-term memory: pass rates go up, the scheduler
  wrongly concludes the skill is well known, and it spaces it out too far.
- The session's skills aren't fully known up front, since `pickNext` chooses one exercise
  at a time. But the new skill can be predicted from the learner's state at session start,
  and so can the most overdue reviews.
- Likely UI: a "today's session" screen before the clock starts, rather than a panel
  during the session (that would compete with the editor and use up session time). It
  shows the new skill's overview in full and lists review skills by name only. Start
  begins the countdown.
- Show review skills' overviews after an attempt instead, especially after a miss or
  reveal, when they help most and don't spoil recall.
- Maybe keep the new skill's card open during its first copy/fill exercises, then hide it
  once the intro exercises are done.
- Evidence from use so far: the session that introduced string methods had 5 reveals in
  19 exercises, the most of any session. Method names are pure recall, which is where a
  primer helps most.

## Choosing a session length

Let the learner pick a 5-, 10- or 20-minute practice session instead of the fixed 10.

- Cheap to build: `SESSION_LENGTH_MS` in `src/core/engine/engine.ts` is read only by
  `useDrillSession.ts` (to end the session) and `SessionScreen.tsx` (for the countdown).
  Pass the length in from the home screen, and fix the "10-minute" copy in
  `HomeScreen.tsx`, the README and `docs/architecture.md`.
- The scheduler and exercise selection don't depend on session length, so nothing in the
  learning model has to change.
- Open question: `MAX_NEW_SKILLS_PER_SESSION` counts per session, so two 5-minute
  sessions would introduce two new skills a day. A per-day cap would keep new material
  arriving at the same pace however the time is split.
- Tradeoffs: in 5 minutes the two warm-ups and a new skill's intro (up to 6 exercises)
  leave little time for review. In 20 minutes the due reviews may run out, and the
  session falls back to "ahead" practice, which is worth less.

## Weekly activity on home

The redesign mockup (canvas "Syntax Drills Redesign") has a "This week" card on home: a
bar per day of how many exercises were done, plus streak and fluent rate. All of it can be
derived from the attempt log (`attempts.listAll`), so no new storage is needed; it only
needs a small summary function in `src/core/engine/` and a card on the home screen.

## Per-exercise strip in a session

The mockup also shows a strip of segments under the practice exercise, one per exercise
done this session, colored by result (fluent, correct but slow, missed). The session hook
already sees each result; it would need to keep the list and expose it to the screen.
