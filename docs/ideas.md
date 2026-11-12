# Ideas

Improvements to consider later. Nothing here is planned or built yet.

## Pausing a session between exercises

A pause button, usable only between exercises: after a pass or a reveal, before the
learner moves on to the next exercise.

- Cheap and safe for the data: each exercise's timing starts from `shownAt`, so a pause
  before the next exercise is shown can't affect fluency. Only the session countdown cares,
  and it's wall-clock time from `startedAt` (`useDrillSession.ts`). Add up paused time and
  subtract it.
- Allow it after a reveal as well as after a pass. After a miss is when the learner is
  most likely to want to stop and look something up.
- Keep it off the fast path. The median gap between exercises is about 2 seconds, so pause
  is a separate control and Enter still means Next.
- Open question: if the tab closes or reloads while paused, can the session be resumed?
  Probably not at first, but decide on purpose.

## Skill overviews (a reference section)

A short write-up of the syntax for each skill, each with its own view, in a reference
section linked from the home screen next to Skills / Export History / Import History. A
sub-nav lists the skills so the learner can read one overview at a time. This replaces the
earlier "explanations in prose" idea, which pointed at external docs.

- Shape: cheat-sheet cards, not tutorials. The forms of the syntax, 2–4 small examples,
  and a "common slips" list built from the error classes and style checks the harness
  already flags. About 30 seconds to read.
- Storage: one Markdown file per skill in the content pack, e.g.
  `content/python/core/overviews/<skill-id>.md`.
- Validation: `scripts/validate-content.ts` checks that every skill has an overview and
  runs each code example through Python, so a card can't teach wrong syntax.
- Sub-nav grouped by each skill's `group`, in `skills.yaml` order, like the Skills screen.
- Show every skill, including ones not reached yet (maybe marked as such). It's a
  reference, so locking it would only get in the way.
- Once the cards exist, link to them from Skills screen rows and from the feedback after a
  miss.

## Priming a session with overviews

Show the relevant overviews before a session starts, so the learner is primed for it.
Depends on the skill overviews above.

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
- Suggested build order: pause, then overviews and the reference section, then this
  priming screen, which reuses the cards.

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
