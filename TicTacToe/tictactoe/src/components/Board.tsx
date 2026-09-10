import type { JSX } from "react";
import type { Board as BoardValue } from "../types";
import { BOARD_SIZE } from "../utils/game";
import { Cell } from "./Cell";

export interface BoardProps {
  board: BoardValue;
  /** Edge length of one cell, in px. Measured - see useBoardFit in the container. */
  cellSize: number;
  /** The three indices that won, or null while the round is live or drawn. */
  winningLine: readonly number[] | null;
  disabled: boolean;
  onPlay: (index: number) => void;
}

const GAP_PX = 8;

/** Reading order, so index 4 is "middle centre" rather than "cell 4". */
const POSITION_NAMES = [
  "top left",
  "top centre",
  "top right",
  "middle left",
  "centre",
  "middle right",
  "bottom left",
  "bottom centre",
  "bottom right",
];

export function Board({
  board,
  cellSize,
  winningLine,
  disabled,
  onPlay,
}: BoardProps): JSX.Element {
  return (
    <div
      className="grid rounded-lg bg-grid-frame p-2 shadow-soft-2"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
        gap: GAP_PX,
      }}
      role="group"
      aria-label="Tic Tac Toe board"
    >
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          size={cellSize}
          isWinning={winningLine?.includes(index) ?? false}
          disabled={disabled}
          onPlay={() => onPlay(index)}
          label={
            value === null
              ? `Play ${POSITION_NAMES[index]}`
              : `${POSITION_NAMES[index]}, ${value}`
          }
        />
      ))}
    </div>
  );
}

/** Pixels along each axis that are gutter or padding rather than cell. */
export const BOARD_GAP_TOTAL_PX = GAP_PX * (BOARD_SIZE - 1) + GAP_PX * 2;
