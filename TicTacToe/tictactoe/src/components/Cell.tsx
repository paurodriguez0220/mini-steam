import type { JSX } from "react";
import type { Cell as CellValue } from "../types";

export interface CellProps {
  value: CellValue;
  /** Edge length in px. Measured - see useBoardFit in the container. */
  size: number;
  /** Part of the winning line, so it lifts out of the board. */
  isWinning: boolean;
  /** Nothing can be played right now - the AI is thinking, or the round is over. */
  disabled: boolean;
  onPlay: () => void;
  label: string;
}

/**
 * One square.
 *
 * The mark is drawn as text rather than SVG: at this size the display font
 * carries the playroom look better than a hand-built glyph would, and it
 * scales with the measured cell for free.
 */
export function Cell({
  value,
  size,
  isWinning,
  disabled,
  onPlay,
  label,
}: CellProps): JSX.Element {
  const markColor = value === "X" ? "text-mark-x" : "text-mark-o";

  return (
    <button
      type="button"
      onClick={onPlay}
      // An occupied square is not a disabled control - it is simply not a
      // move. Leaving it enabled but inert keeps it in the tab order and
      // readable, and avoids the greyed-out look on a board that is fine.
      aria-disabled={disabled || value !== null}
      aria-label={label}
      className={`grid place-items-center rounded-md font-display leading-none transition-all duration-200 ease-spring ${
        isWinning ? "bg-mark-win shadow-soft-2" : "bg-surface shadow-soft-1"
      } ${value === null && !disabled ? "hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-press" : ""} ${markColor}`}
      style={{ width: size, height: size, fontSize: size * 0.56 }}
    >
      {value}
    </button>
  );
}
