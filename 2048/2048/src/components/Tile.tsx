import type { Tile as TileType } from "../types";
import { TILE_PX, TILE_STEP_PX } from "../board-layout";

export interface TileProps {
  tile: TileType;
}

/**
 * The 2048 colour ramp, as shared-theme tokens (see the @theme block in
 * index.css). Light beige through orange into gold, with the ink flipping from
 * dark to light at the 8-tile.
 */
const TILE_PALETTE: Record<number, string> = {
  2: "bg-tile-2 text-tile-2-ink",
  4: "bg-tile-4 text-tile-4-ink",
  8: "bg-tile-8 text-tile-8-ink",
  16: "bg-tile-16 text-tile-16-ink",
  32: "bg-tile-32 text-tile-32-ink",
  64: "bg-tile-64 text-tile-64-ink",
  128: "bg-tile-128 text-tile-128-ink",
  256: "bg-tile-256 text-tile-256-ink",
  512: "bg-tile-512 text-tile-512-ink",
  1024: "bg-tile-1024 text-tile-1024-ink",
  2048: "bg-tile-2048 text-tile-2048-ink",
};

/** Anything past 2048 - reachable in real play, so it gets a real token. */
const TILE_PALETTE_MAX = "bg-tile-max text-tile-max-ink";

/** Four- and five-digit values overflow an 80px tile at the base size. */
function valueTextClass(value: number): string {
  if (value >= 16384) return "text-xl";
  if (value >= 1024) return "text-2xl";
  if (value >= 128) return "text-3xl";
  return "text-4xl";
}

export function Tile({ tile }: TileProps) {
  const palette = TILE_PALETTE[tile.value] ?? TILE_PALETTE_MAX;

  return (
    <div
      className={`absolute flex items-center justify-center rounded-sm font-display font-bold tabular-nums transition-all duration-300 ease-spring ${palette} ${valueTextClass(
        tile.value,
      )} ${tile.spawn ? "animate-pop-in" : ""}`}
      style={{
        width: TILE_PX,
        height: TILE_PX,
        top: tile.row * TILE_STEP_PX,
        left: tile.col * TILE_STEP_PX,
      }}
    >
      {tile.value}
    </div>
  );
}
