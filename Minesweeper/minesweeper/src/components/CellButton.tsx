import type { Cell } from "../types";

type Props = {
  cell: Cell;
  onReveal: () => void;
  onFlag: () => void;
};

export function CellButton({ cell, onReveal, onFlag }: Props) {
  const revealed = cell.isRevealed;
  const number = cell.adjacentMines;

  return (
    <button
      onClick={onReveal}
      onContextMenu={(e) => {
        e.preventDefault();
        onFlag();
      }}
      className={`
        aspect-square w-full
        flex items-center justify-center
        font-bold text-sm select-none

        ${revealed
          ? `
            bg-[#c0c0c0]
            border
            border-t-[#7b7b7b]
            border-l-[#7b7b7b]
            border-b-[#ffffff]
            border-r-[#ffffff]
          `
          : `
            bg-[#c0c0c0]
            border-[4px]
            border-t-[#ffffff]
            border-l-[#ffffff]
            border-b-[#7b7b7b]
            border-r-[#7b7b7b]
            active:border-t-[#7b7b7b]
            active:border-l-[#7b7b7b]
            active:border-b-[#ffffff]
            active:border-r-[#ffffff]
          `
        }

        ${cell.isFlagged ? "text-red-600" : ""}
        ${revealed && cell.hasMine ? "bg-red-600" : ""}
        ${revealed && !cell.hasMine && number === 1 ? "text-blue-600" : ""}
        ${revealed && !cell.hasMine && number === 2 ? "text-green-600" : ""}
        ${revealed && !cell.hasMine && number === 3 ? "text-red-600" : ""}
        ${revealed && !cell.hasMine && number === 4 ? "text-purple-700" : ""}
        ${revealed && !cell.hasMine && number >= 5 ? "text-black" : ""}
      `}
    >
      {revealed ? (cell.hasMine ? "💥" : number || "") : cell.isFlagged ? "🚩" : ""}
    </button>
  );
}
