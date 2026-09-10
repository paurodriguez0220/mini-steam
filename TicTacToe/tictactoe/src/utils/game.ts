import type { Board, Cell, Mark } from "../types";

/**
 * Tic Tac Toe - the rules.
 *
 * Pure and DOM-free, so the whole rule set can be tested without a browser.
 * `ai.ts` is built on top of this; the React components only render what these
 * functions decide.
 */

export const BOARD_SIZE = 3;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

/**
 * The eight ways to win, as index triples.
 *
 * Written out rather than generated. There are only eight, they never change,
 * and a literal list is impossible to get subtly wrong - a loop that builds
 * rows, columns and diagonals is not.
 */
export const WINNING_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function emptyBoard(): Board {
  return Array<Cell>(CELL_COUNT).fill(null);
}

export function emptyCells(board: Board): number[] {
  const cells: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) cells.push(i);
  }
  return cells;
}

export function isFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export interface WinResult {
  mark: Mark;
  /** The three indices that won, so the board can highlight them. */
  line: readonly [number, number, number];
}

/**
 * The winning mark and its line, or null if nobody has won yet.
 *
 * "Nobody has won" covers both a live game and a full board; ask `isFull` to
 * tell those apart. Keeping the two questions separate is what lets the caller
 * distinguish a draw from a game still in progress without a third state.
 */
export function winnerOf(board: Board): WinResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark !== null && mark === board[b] && mark === board[c]) {
      return { mark, line };
    }
  }
  return null;
}

/** True once neither player can move again - somebody won, or the board filled. */
export function isGameOver(board: Board): boolean {
  return winnerOf(board) !== null || isFull(board);
}

export function opponentOf(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}

/** A copy of the board with `mark` placed at `index`. Never mutates the input. */
export function placeMark(board: Board, index: number, mark: Mark): Board {
  const next = board.slice();
  next[index] = mark;
  return next;
}
