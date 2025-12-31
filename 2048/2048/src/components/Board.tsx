import { Tile } from "./Tile";
import type { Tile as TileType } from "../types";

export function Board({ tiles }: { tiles: TileType[] }) {
  return (
    <div className="bg-[#776E66] p-2">
        <div className="relative w-[336px] h-[336px] bg-[#776E66] rounded">
        {tiles.map((t) => (
            <Tile key={t.id} tile={t} />
        ))}
        </div>
    </div>

  );
}
