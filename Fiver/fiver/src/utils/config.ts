export const DIFFICULTY_KEYS = ["easy", "medium", "hard"] as const;

export type DifficultyKey = (typeof DIFFICULTY_KEYS)[number];

export function isDifficultyKey(value: string): value is DifficultyKey {
  return (DIFFICULTY_KEYS as readonly string[]).includes(value);
}

export const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const WORD_LENGTH = 5;

/**
 * Guesses allowed per word - the difficulty knob.
 *
 * The cleanest one this game has: it changes how much deduction you can
 * afford without touching the word pool, so every tier is playing the same
 * game. Four is genuinely hard; a good player still fails often enough that a
 * hard streak stays short and the board keeps moving.
 */
export const GUESSES_FOR: Record<DifficultyKey, number> = {
  easy: 6,
  medium: 5,
  hard: 4,
};

/** How long the between-words result stays up before the next word starts. */
export const WORD_RESULT_MS = 1500;
