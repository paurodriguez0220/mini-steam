import type { Board, Mark } from "../types";
import type { DifficultyKey } from "./config";
import { emptyCells, isFull, opponentOf, placeMark, winnerOf } from "./game";

/**
 * Tic Tac Toe - the opponent.
 *
 * Three strategies behind one function. Pure, DOM-free and deterministic
 * apart from the explicit random picks, so every tier can be tested directly.
 *
 * The tiers are meant to feel like three different people:
 *
 * - `easy`   plays anywhere. It will hand you a win.
 * - `medium` never hangs an immediate win and never misses an immediate
 *            block, but sees exactly one ply - so it walks into forks.
 * - `hard`   is full minimax. It cannot be beaten; a draw is the best result
 *            available against it, which is why a draw scores a point.
 */

function randomCell(board: Board): number {
  const cells = emptyCells(board);
  return cells[Math.floor(Math.random() * cells.length)];
}

/** The cell that completes a line for `mark` right now, or null. */
function immediateWin(board: Board, mark: Mark): number | null {
  for (const index of emptyCells(board)) {
    if (winnerOf(placeMark(board, index, mark))?.mark === mark) return index;
  }
  return null;
}

/**
 * Take the win, else block theirs, else play anywhere.
 *
 * Deliberately one ply deep. Looking two ahead would let it see forks, which
 * is what `hard` is for - medium has to be beatable or the ladder has no
 * middle rung.
 */
function mediumMove(board: Board, aiMark: Mark): number {
  const win = immediateWin(board, aiMark);
  if (win !== null) return win;

  const block = immediateWin(board, opponentOf(aiMark));
  if (block !== null) return block;

  return randomCell(board);
}

/**
 * Minimax score for a finished or ongoing position, from `aiMark`'s side.
 *
 * `depth` is subtracted from a win and added to a loss so the AI prefers to
 * win as early as possible and lose as late as possible. Without that it
 * treats all wins as equal and will idle instead of finishing, which looks
 * like a bug even though the result is the same.
 *
 * 3x3 is small enough that this runs unmemoised: the empty board is the worst
 * case and still resolves well inside a frame.
 */
function minimax(board: Board, aiMark: Mark, turn: Mark, depth: number): number {
  const win = winnerOf(board);
  if (win !== null) return win.mark === aiMark ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;

  const maximising = turn === aiMark;
  let best = maximising ? -Infinity : Infinity;

  for (const index of emptyCells(board)) {
    const score = minimax(
      placeMark(board, index, turn),
      aiMark,
      opponentOf(turn),
      depth + 1,
    );
    best = maximising ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
}

function hardMove(board: Board, aiMark: Mark): number {
  let bestScore = -Infinity;
  let bestIndex = -1;

  for (const index of emptyCells(board)) {
    const score = minimax(placeMark(board, index, aiMark), aiMark, opponentOf(aiMark), 1);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

/**
 * The AI's move, as a board index.
 *
 * The caller must not ask for a move on a finished or full board; there is no
 * legal answer and the return would be meaningless.
 */
export function chooseMove(board: Board, aiMark: Mark, difficulty: DifficultyKey): number {
  switch (difficulty) {
    case "easy":
      return randomCell(board);
    case "medium":
      return mediumMove(board, aiMark);
    case "hard":
      return hardMove(board, aiMark);
  }
}
