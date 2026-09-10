import { ANSWERS, GUESSES } from "../data/words";
import { WORD_LENGTH } from "./config";

/**
 * Fiver - the word pools.
 *
 * The data module is two plain arrays; this wraps them in the two questions
 * the game actually asks. The guess list becomes a Set once, at module load,
 * because it is ~17,000 entries and is consulted on every submission.
 */

const GUESS_SET: ReadonlySet<string> = new Set(GUESSES);

export type GuessRejection = "too-short" | "not-a-word";

/**
 * Why this guess cannot be submitted, or null if it can.
 *
 * Returning the reason rather than a boolean lets the caller say something
 * useful - "not a word" and "not finished" need different messages, and
 * neither should cost the player a turn.
 */
export function rejectGuess(guess: string): GuessRejection | null {
  if (guess.length !== WORD_LENGTH) return "too-short";
  if (!GUESS_SET.has(guess.toLowerCase())) return "not-a-word";
  return null;
}

/**
 * A random answer, optionally avoiding words already used this run.
 *
 * A run can outlast the pool only in principle - it is ~2,250 words deep - but
 * the exclusion still matters within a session, because drawing the same word
 * twice in one streak reads as a bug. If everything has somehow been used the
 * exclusion is dropped rather than returning nothing.
 */
export function randomAnswer(exclude: ReadonlySet<string> = new Set()): string {
  const pool = exclude.size >= ANSWERS.length ? ANSWERS : ANSWERS.filter((w) => !exclude.has(w));
  return pool[Math.floor(Math.random() * pool.length)];
}

export const ANSWER_COUNT = ANSWERS.length;
export const GUESS_COUNT = GUESSES.length;
