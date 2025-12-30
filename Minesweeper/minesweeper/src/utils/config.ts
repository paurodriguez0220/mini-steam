import type { GameConfig } from "../types";

export const DIFFICULTIES: Record<string, GameConfig> = {
  easy: {
    rows: 9,
    cols: 9,
    mines: 10,
  },
  medium: {
    rows: 12,
    cols: 12,
    mines: 20,
  },
  hard: {
    rows: 16,
    cols: 16,
    mines: 30,
  },
};


 export const BASE_COLS = 9;
 export const BASE_SIZE = 40;
 export const MIN_SIZE = 18;