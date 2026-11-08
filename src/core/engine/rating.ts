import type { Performance } from '@/core/engine/fluency';

/*
 * Elo-style ratings: each skill has a rating, each template a difficulty, on one scale.
 * They only change on compose attempts, where success says something about recall.
 */

export const INITIAL_SKILL_RATING = 1000;
/** Rating given to skills a placement pass shows you already know. */
export const PLACED_SKILL_RATING = 1100;
/** Templates are chosen so the predicted chance of success is close to this. */
export const TARGET_SUCCESS = 0.85;
const SKILL_K = 40;
const TEMPLATE_K = 16;

export const PERFORMANCE_SCORE: Record<Performance, number> = {
  fail: 0,
  slow: 0.5,
  pass: 0.85,
  fluent: 1,
};

export function expectedSuccess(skillRating: number, difficulty: number): number {
  return 1 / (1 + 10 ** ((difficulty - skillRating) / 400));
}

export function meanRating(ratings: number[]): number {
  if (ratings.length === 0) return INITIAL_SKILL_RATING;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

/** Returns how much to add to each skill's rating and to the template's difficulty. */
export function ratingDeltas(
  skillRatings: number[],
  difficulty: number,
  performance: Performance,
): { skill: number; template: number } {
  const surprise =
    PERFORMANCE_SCORE[performance] - expectedSuccess(meanRating(skillRatings), difficulty);
  return { skill: SKILL_K * surprise, template: -TEMPLATE_K * surprise };
}
