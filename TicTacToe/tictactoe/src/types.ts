/** X is always the player, O is always the AI. */
export type Mark = "X" | "O";

/** One square: a mark, or null while it is empty. */
export type Cell = Mark | null;

/** Nine squares in reading order — index 0 is top-left, 8 is bottom-right. */
export type Board = Cell[];

/** How a finished round ended, from the player's point of view. */
export type RoundOutcome = "won" | "lost" | "drawn";
