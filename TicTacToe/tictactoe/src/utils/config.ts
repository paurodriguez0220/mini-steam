export const DIFFICULTY_KEYS = ["easy", "medium", "hard"] as const;

export type DifficultyKey = (typeof DIFFICULTY_KEYS)[number];

/** Narrows the raw string a `<select>` hands back into a difficulty key. */
export function isDifficultyKey(value: string): value is DifficultyKey {
  return (DIFFICULTY_KEYS as readonly string[]).includes(value);
}

export const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * One run is a match, not a single game.
 *
 * A single game of tic-tac-toe scores 0, 1 or 3 and nothing else, which makes
 * a leaderboard of nothing but ties. Five rounds spreads the result across
 * 0-15 and gives the run a natural end.
 */
export const ROUNDS_PER_MATCH = 5;

/**
 * A draw is worth a point, and that is what keeps `hard` playable.
 *
 * Hard is unbeatable minimax, so the ceiling there is five draws - five
 * points. The score message carries its difficulty and the storefront ranks
 * each tier separately, so that never has to compete with a 15 on easy.
 */
export const POINTS_FOR_WIN = 3;
export const POINTS_FOR_DRAW = 1;
export const POINTS_FOR_LOSS = 0;

/** The best score a match can produce. Used by the HUD, not by the rules. */
export const MAX_MATCH_SCORE = ROUNDS_PER_MATCH * POINTS_FOR_WIN;

/**
 * How long the AI "thinks" before replying, in ms.
 *
 * Not a difficulty knob - it is there so the player sees their own mark land
 * before the reply appears. Instant replies read as though the tap placed both.
 */
export const AI_MOVE_DELAY_MS = 420;

/** How long the between-rounds result stays up before the next round starts. */
export const ROUND_RESULT_MS = 1100;
