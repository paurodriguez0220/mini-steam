import type { Cell, GameConfig } from "../types";

export function createEmptyBoard(config: GameConfig): Cell[][] {
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => ({
      hasMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

export function placeMines(
  board: Cell[][],
  config: GameConfig,
  safeRow: number,
  safeCol: number
) {
  let placed = 0;
  while (placed < config.mines) {
    const r = Math.floor(Math.random() * config.rows);
    const c = Math.floor(Math.random() * config.cols);
    if ((r === safeRow && c === safeCol) || board[r][c].hasMine) continue;
    board[r][c].hasMine = true;
    placed++;
  }
}

export function calculateNumbers(board: Cell[][], config: GameConfig) {
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (board[r][c].hasMine) continue;
      let count = 0;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < config.rows &&
          nc >= 0 && nc < config.cols &&
          board[nr][nc].hasMine
        ) count++;
      }
      board[r][c].adjacentMines = count;
    }
  }
}

export function revealFlood(
  board: Cell[][],
  config: GameConfig,
  row: number,
  col: number
) {
  const stack = [[row, col]];
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  while (stack.length) {
    const [r, c] = stack.pop()!;
    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) continue;

    cell.isRevealed = true;

    if (cell.adjacentMines === 0) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
          stack.push([nr, nc]);
        }
      }
    }
  }
}
