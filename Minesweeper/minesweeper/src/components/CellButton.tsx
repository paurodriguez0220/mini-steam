import type { JSX } from "react";
import type { Cell } from "../types";

/**
 * Canonical Minesweeper number colours, 1-8, as theme tokens.
 *
 * This replaces a chain of five inline ternaries in which everything from 5
 * upward collapsed to `text-black` - wrong (canonical is 5=maroon, 6=teal,
 * 7=black, 8=grey) and invisible on a dark surface. The tokens are defined,
 * with dark values, in src/index.css.
 */
const NUMBER_COLORS: Record<number, string> = {
  1: "text-num-1",
  2: "text-num-2",
  3: "text-num-3",
  4: "text-num-4",
  5: "text-num-5",
  6: "text-num-6",
  7: "text-num-7",
  8: "text-num-8",
};

const BASE_CLASSES =
  "flex aspect-square w-full select-none items-center justify-center font-text text-sm font-bold leading-none";

/**
 * The cell's surface, as three explicit branches.
 *
 * A tripped mine is its own branch rather than a `bg-primary` appended after
 * `bg-bevel-face` - the old code relied on class-string order to win that
 * override, which is fragile. The bevel utilities deliberately set no
 * background, so the background is always stated exactly once.
 */
function surfaceClasses(cell: Cell): string {
  if (!cell.isRevealed) {
    // Raised, and presses in on `:active`, the same as the original.
    return "bg-bevel-face bevel-raised active:bevel-inset text-primary";
  }

  if (cell.hasMine) {
    return "bg-primary text-primary-ink bevel-inset [--bevel-width:1px]";
  }

  const numberColor = NUMBER_COLORS[cell.adjacentMines] ?? "";
  return `bg-bevel-face bevel-inset [--bevel-width:1px] ${numberColor}`;
}

function cellContent(cell: Cell): string | number {
  if (!cell.isRevealed) {
    return cell.isFlagged ? "🚩" : "";
  }

  if (cell.hasMine) {
    return "💥";
  }

  return cell.adjacentMines === 0 ? "" : cell.adjacentMines;
}

export interface CellButtonProps {
  cell: Cell;
  onReveal: () => void;
  onFlag: () => void;
}

export function CellButton({ cell, onReveal, onFlag }: CellButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onReveal}
      onContextMenu={(event) => {
        event.preventDefault();
        onFlag();
      }}
      className={`${BASE_CLASSES} ${surfaceClasses(cell)}`}
    >
      {cellContent(cell)}
    </button>
  );
}
