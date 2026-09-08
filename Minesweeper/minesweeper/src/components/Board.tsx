import type { JSX } from "react";
import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

/**
 * Fixed cell size. 30 columns on `hard` is a known constraint - responsive
 * cell sizing is deliberately out of scope, the wrapper scrolls instead.
 */
const CELL_SIZE_PX = 30;

export interface BoardProps {
  board: Cell[][];
  config: GameConfig;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
}

export function Board({ board, config, onReveal, onFlag }: BoardProps): JSX.Element {
  return (
    <div className="inline-block">
      <div
        className="inline-grid bg-bevel-face bevel-inset"
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${CELL_SIZE_PX}px)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellButton
              key={`${r}-${c}`}
              cell={cell}
              onReveal={() => onReveal(r, c)}
              onFlag={() => onFlag(r, c)}
            />
          ))
        )}
      </div>
    </div>
  );
}
