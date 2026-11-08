import { DefaultScheduler, Rating, type DefaultSchedulerCard } from 'ts-fsrs';

/*
 * Thin wrapper over ts-fsrs so the rest of the engine never touches the library directly.
 * One review card per skill decides when that skill is next due.
 */

export type ReviewCard = DefaultSchedulerCard;
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export type ReviewScheduler = {
  /** The card id is the skill id, so replays produce identical state. */
  newCard(skillId: string, now: Date): ReviewCard;
  review(card: ReviewCard, grade: ReviewGrade, now: Date): ReviewCard;
};

const RATINGS = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const;

export async function createReviewScheduler(): Promise<ReviewScheduler> {
  /* No fuzz keeps replays deterministic; no short-term steps because sessions handle retries. */
  const scheduler = await DefaultScheduler({ enableFuzz: false, enableShortTerm: false });
  return {
    newCard: (skillId, now) => scheduler.newCard({ now, cardId: skillId }),
    review: (card, grade, now) => scheduler.review({ card, grade: RATINGS[grade], now }).card,
  };
}

/** Pulls a card's due date forward to `now`, leaving its memory state alone. */
export function makeDueNow(card: ReviewCard, now: Date): ReviewCard {
  return card.dueAt <= now ? card : { ...card, dueAt: now };
}
