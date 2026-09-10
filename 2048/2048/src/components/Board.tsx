import { Tile } from "./Tile";
import type { Tile as TileType } from "../types";
import type { BoardLayout } from "../board-layout";
import { BOARD_SIZE } from "../utils/board";

export interface BoardProps {
  tiles: TileType[];
  layout: BoardLayout;
}

/** One well per cell, so an empty board still reads as a grid. */
const CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  row: Math.floor(index / BOARD_SIZE),
  col: index % BOARD_SIZE,
}));

export function Board({ tiles, layout }: BoardProps) {
  return (
    <div
      className="rounded-lg bg-board-frame shadow-soft-2"
      style={{
        width: layout.framePx,
        height: layout.framePx,
        padding: layout.paddingPx,
      }}
    >
      {/* The tiles position themselves absolutely, and an absolute box resolves
          against its ancestor's PADDING box - so offsetting from the frame
          would ignore the frame's padding and leave the gutter only on the
          right and bottom. This inner box is exactly the grid, so every gutter
          is equal. */}
      <div className="relative" style={{ width: layout.boardPx, height: layout.boardPx }}>
        {CELLS.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            className="absolute rounded-sm bg-board-well"
            style={{
              width: layout.tilePx,
              height: layout.tilePx,
              top: cell.row * layout.stepPx,
              left: cell.col * layout.stepPx,
            }}
            aria-hidden="true"
          />
        ))}

        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} layout={layout} />
        ))}
      </div>
    </div>
  );
}
