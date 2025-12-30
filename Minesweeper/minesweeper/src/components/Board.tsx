import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

type Props = {
  board: Cell[][];
  config: GameConfig;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
};

  const BASE_COLS = 9;
  const BASE_SIZE = 40;
  const MIN_SIZE = 18;

export function Board({ board, config, onReveal, onFlag }: Props) {
  const scale = BASE_COLS / config.cols;
  const cellPx = Math.max(MIN_SIZE, BASE_SIZE * scale);
  const cellSize = `${cellPx}px`;

  return (
    <div className="inline-block">
      <div
        className="inline-grid gap-1 p-1 rounded bg-[#7B6F4D]"
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${cellSize})` }}
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

