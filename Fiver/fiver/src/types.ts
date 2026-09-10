/**
 * What a guess said about one letter position.
 *
 * `correct` - right letter, right place.
 * `present` - the answer contains this letter, but not here.
 * `absent`  - the answer has no unaccounted-for instance of this letter.
 */
export type LetterMark = "correct" | "present" | "absent";

/** A submitted guess and how each of its letters marked. */
export interface ScoredGuess {
  word: string;
  marks: LetterMark[];
}

/** The best thing known about a letter, for the keyboard. `unknown` = untried. */
export type KeyState = LetterMark | "unknown";

/** How the current word ended. */
export type WordOutcome = "solved" | "failed";
