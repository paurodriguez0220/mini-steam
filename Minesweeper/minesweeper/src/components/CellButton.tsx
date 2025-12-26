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
      onContextMenu={(e) => { e.preventDefault(); onFlag(); }}
      className={`
        aspect-square w-full flex items-center justify-center
        font-bold text-sm select-none transition-all
        ${revealed
          ? "bg-[#705438] border border-[#877A5C]"
          : "bg-[#556B2F] border border-[#454836] hover:brightness-110"}
        ${cell.isFlagged ? "text-red-600" : ""}
        ${revealed && cell.hasMine ? "bg-red-700 animate-pulse" : ""}
        ${revealed && !cell.hasMine && number === 1 ? "text-sky-400" : ""}
        ${revealed && !cell.hasMine && number === 2 ? "text-lime-300" : ""}
        ${revealed && !cell.hasMine && number === 3 ? "text-orange-400" : ""}
        ${revealed && !cell.hasMine && number === 4 ? "text-purple-400" : ""}
        ${revealed && !cell.hasMine && number >= 5 ? "text-red-400" : ""}
      `}
    >
      {revealed ? (cell.hasMine ? "💥" : number || "") : cell.isFlagged ? "🚩" : ""}
    </button>
  );
}
