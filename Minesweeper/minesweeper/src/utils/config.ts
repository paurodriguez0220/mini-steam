import type { GameConfig } from "../types";

export const DIFFICULTY_KEYS = ["easy", "medium", "hard"] as const;

export type DifficultyKey = (typeof DIFFICULTY_KEYS)[number];

export const DIFFICULTIES: Record<DifficultyKey, GameConfig> = {
  easy: {
    rows: 9,
    cols: 9,
    mines: 10,
  },
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
  },
};

/** Narrows the raw string a `<select>` hands back into a difficulty key. */
export function isDifficultyKey(value: string): value is DifficultyKey {
  return (DIFFICULTY_KEYS as readonly string[]).includes(value);
}
