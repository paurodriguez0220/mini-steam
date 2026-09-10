import { useCallback, useRef } from "react";
import type { JSX, PointerEvent as ReactPointerEvent } from "react";
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

/** Hold this long to flag. Long enough not to fire on a slow tap. */
const LONG_PRESS_MS = 450;

/** Move further than this and it was a pan, not a press. */
const MOVE_TOLERANCE_PX = 10;

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
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  /**
   * Set when the hold fires, so the click that follows the release is
   * swallowed - otherwise a long press would flag the cell and then reveal it.
   */
  const didLongPressRef = useRef(false);

  const cancel = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent): void => {
      // Mouse right-click still goes through onContextMenu; only a primary
      // press arms the hold.
      if (event.button !== 0) return;

      didLongPressRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };

      timerRef.current = window.setTimeout(() => {
        didLongPressRef.current = true;
        timerRef.current = null;
        // Confirms the flag without the player having to look up. Absent on
        // iOS, where it is a no-op rather than an error.
        navigator.vibrate?.(30);
        onFlag();
      }, LONG_PRESS_MS);
    },
    [onFlag],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent): void => {
      const start = startRef.current;
      if (start === null) return;

      // Panning the board must not flag whatever cell the finger started on.
      if (
        Math.abs(event.clientX - start.x) > MOVE_TOLERANCE_PX ||
        Math.abs(event.clientY - start.y) > MOVE_TOLERANCE_PX
      ) {
        cancel();
      }
    },
    [cancel],
  );

  const onClick = useCallback((): void => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    onReveal();
  }, [onReveal]);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(event) => {
        event.preventDefault();
        // A long press on a touch device also raises contextmenu in some
        // browsers. The timer has already flagged by then, so suppress the
        // duplicate rather than toggling the flag straight back off.
        if (didLongPressRef.current) return;
        onFlag();
      }}
      className={`${BASE_CLASSES} ${surfaceClasses(cell)}`}
    >
      {cellContent(cell)}
    </button>
  );
}
