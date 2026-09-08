import { Tile } from "./Tile";
import type { Tile as TileType } from "../types";
import { BOARD_FRAME_PX, BOARD_PADDING_PX } from "../board-layout";

export interface BoardProps {
  tiles: TileType[];
}

export function Board({ tiles }: BoardProps) {
  return (
    <div
      className="relative rounded-lg bg-board-frame shadow-soft-2"
      style={{
        width: BOARD_FRAME_PX,
        height: BOARD_FRAME_PX,
        padding: BOARD_PADDING_PX,
      }}
    >
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
