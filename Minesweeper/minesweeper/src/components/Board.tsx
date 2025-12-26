import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

type Props = {
  board: Cell[][];
  config: GameConfig;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
};

export function Board({ board, config, onReveal, onFlag }: Props) {
  const cellSize = `clamp(18px, ${90 / config.cols}vw, 40px)`;
  return (
    <div className="flex justify-center w-full">
        <div className="grid gap-1 p-1 rounded w-full bg-[#7B6F4D]"
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

