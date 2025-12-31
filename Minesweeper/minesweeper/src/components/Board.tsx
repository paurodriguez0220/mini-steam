import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

type Props = {
  board: Cell[][];
  config: GameConfig;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
};

export function Board({ board, config, onReveal, onFlag }: Props) {
  const CELL_SIZE = `30px`;

  return (
    <div className="inline-block">
      <div
      className="
        inline-grid
        bg-[#c0c0c0]
        border-[4px]
        border-t-[#7b7b7b]
        border-l-[#7b7b7b]
        border-b-[#ffffff]
        border-r-[#ffffff]
      "
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${CELL_SIZE})` }}
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

