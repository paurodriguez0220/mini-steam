import type { KeyState, LetterMark, ScoredGuess } from "../types";

/**
 * Fiver - marking a guess.
 *
 * Pure and DOM-free. This is the piece of the game that is genuinely easy to
 * get wrong, so it is the piece with the most tests.
 */

/**
 * Mark each letter of `guess` against `answer`.
 *
 * Two passes, and the order is the whole point. Exact matches are taken first
 * and each one consumes an instance of that letter from the answer; only then
 * are the remaining letters considered, against what is left.
 *
 * A single left-to-right pass gets repeated letters wrong. Guessing ALLOY
 * against LLAMA must mark only as many L's as LLAMA still has once the
 * correctly-placed one has been accounted for - a naive pass marks both,
 * telling the player the answer has two L's in the wrong place when it does
 * not.
 *
 * Both words are assumed the same length; the caller validates that.
 */
export function markGuess(guess: string, answer: string): LetterMark[] {
  const marks: LetterMark[] = Array<LetterMark>(guess.length).fill("absent");

  // How many of each letter the answer still has to give out.
  const remaining = new Map<string, number>();
  for (const letter of answer) {
    remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  }

  // Pass 1 - exact positions, consuming from the pool.
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] !== answer[i]) continue;
    marks[i] = "correct";
    remaining.set(guess[i], (remaining.get(guess[i]) ?? 0) - 1);
  }

  // Pass 2 - everything else, against what pass 1 left behind.
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === "correct") continue;

    const left = remaining.get(guess[i]) ?? 0;
    if (left > 0) {
      marks[i] = "present";
      remaining.set(guess[i], left - 1);
    }
  }

  return marks;
}

/** Higher wins. A letter known to be correct must never fall back to present. */
const KEY_RANK: Record<KeyState, number> = {
  unknown: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

/**
 * Fold every guess so far into one state per letter, keeping the best.
 *
 * The ranking must not regress: a letter shown green in the first guess and
 * then played in the wrong place in the third is still green. Recomputing the
 * whole map from all guesses (rather than mutating as we go) means the
 * keyboard cannot drift out of step with the board.
 */
export function keyboardStateFor(guesses: readonly ScoredGuess[]): Map<string, KeyState> {
  const states = new Map<string, KeyState>();

  for (const { word, marks } of guesses) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const current = states.get(letter) ?? "unknown";
      if (KEY_RANK[marks[i]] > KEY_RANK[current]) states.set(letter, marks[i]);
    }
  }

  return states;
}
