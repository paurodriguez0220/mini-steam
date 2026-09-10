import type { JSX } from "react";
import type { ScoredGuess } from "../types";
import { WORD_LENGTH } from "../utils/config";
import { Tile } from "./Tile";

export interface TileGridProps {
  submitted: readonly ScoredGuess[];
  /** What the player is typing now, un-judged. */
  draft: string;
  /** Total rows - the difficulty's guess allowance. */
  rows: number;
  cellSize: number;
  /** Set briefly when a guess is refused, to shake the active row. */
  invalid: boolean;
  /** Read out to assistive tech instead of the tiles, which are decorative. */
  label: string;
}

const GAP_PX = 6;

export function TileGrid({
  submitted,
  draft,
  rows,
  cellSize,
  invalid,
  label,
}: TileGridProps): JSX.Element {
  const rowIndexes = Array.from({ length: rows }, (_, i) => i);
  const columns = Array.from({ length: WORD_LENGTH }, (_, i) => i);

  return (
    <div
      className="grid"
      style={{ gap: GAP_PX }}
      role="img"
      aria-label={label}
    >
      {rowIndexes.map((row) => {
        const guess = submitted[row];
        const isCurrentRow = guess === undefined && row === submitted.length;
        const letters = guess?.word ?? (isCurrentRow ? draft : "");

        return (
          <div
            key={row}
            className={`grid ${isCurrentRow && invalid ? "animate-shake" : ""}`}
            style={{ gridTemplateColumns: `repeat(${WORD_LENGTH}, ${cellSize}px)`, gap: GAP_PX }}
          >
            {columns.map((col) => (
              <Tile
                key={col}
                letter={letters[col] ?? ""}
                mark={guess ? guess.marks[col] : null}
                size={cellSize}
                isCurrentRow={isCurrentRow}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Pixels along each axis that are gutter rather than tile. */
export const GRID_GAP_TOTAL_PX = GAP_PX * (WORD_LENGTH - 1);
