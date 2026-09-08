import { Tile } from "./Tile";
import type { Tile as TileType } from "../types";
import { BOARD_PX, BOARD_FRAME_PX, BOARD_PADDING_PX, TILE_PX, TILE_STEP_PX } from "../board-layout";
import { BOARD_SIZE } from "../utils/board";

export interface BoardProps {
  tiles: TileType[];
}

/** One well per cell, so an empty board still reads as a grid. */
const CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  row: Math.floor(index / BOARD_SIZE),
  col: index % BOARD_SIZE,
}));

export function Board({ tiles }: BoardProps) {
  return (
    <div
      className="rounded-lg bg-board-frame shadow-soft-2"
      style={{
        width: BOARD_FRAME_PX,
        height: BOARD_FRAME_PX,
        padding: BOARD_PADDING_PX,
      }}
    >
      {/* The tiles position themselves absolutely, and an absolute box resolves
          against its ancestor's PADDING box - so offsetting from the frame
          would ignore the frame's padding and leave the gutter only on the
          right and bottom. This inner box is exactly the grid, so every gutter
          is equal. */}
      <div className="relative" style={{ width: BOARD_PX, height: BOARD_PX }}>
        {CELLS.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            className="absolute rounded-sm bg-board-well"
            style={{
              width: TILE_PX,
              height: TILE_PX,
              top: cell.row * TILE_STEP_PX,
              left: cell.col * TILE_STEP_PX,
            }}
            aria-hidden="true"
          />
        ))}

        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}
