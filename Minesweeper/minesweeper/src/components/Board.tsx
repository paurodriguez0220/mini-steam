import type { JSX } from "react";
import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

export interface BoardProps {
  board: Cell[][];
  config: GameConfig;
  /** Edge length of one cell, in px. Measured - see useBoardFit in the container. */
  cellSize: number;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
}

export function Board({ board, config, cellSize, onReveal, onFlag }: BoardProps): JSX.Element {
  return (
    <div className="inline-block">
      <div
        className="inline-grid bg-bevel-face bevel-inset"
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)` }}
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
