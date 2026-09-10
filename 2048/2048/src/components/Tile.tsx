import type { Tile as TileType } from "../types";
import type { BoardLayout } from "../board-layout";

export interface TileProps {
  tile: TileType;
  layout: BoardLayout;
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

/**
 * Font size as a fraction of the tile, stepped down as digits are added.
 *
 * This used to be four Tailwind size classes chosen against an assumed 80px
 * tile. With a measured tile the ratio has to be the constant, not the pixel
 * size, or five digits overflow a small board.
 */
function valueFontPx(value: number, tilePx: number): number {
  if (value >= 16384) return Math.round(tilePx * 0.24);
  if (value >= 1024) return Math.round(tilePx * 0.3);
  if (value >= 128) return Math.round(tilePx * 0.375);
  return Math.round(tilePx * 0.45);
}

export function Tile({ tile, layout }: TileProps) {
  const palette = TILE_PALETTE[tile.value] ?? TILE_PALETTE_MAX;

  return (
    <div
      className={`absolute flex items-center justify-center rounded-sm font-display font-bold tabular-nums transition-all duration-300 ease-spring ${palette} ${
        tile.spawn ? "animate-pop-in" : ""
      }`}
      style={{
        width: layout.tilePx,
        height: layout.tilePx,
        top: tile.row * layout.stepPx,
        left: tile.col * layout.stepPx,
        fontSize: `${valueFontPx(tile.value, layout.tilePx)}px`,
        lineHeight: 1,
      }}
    >
      {tile.value}
    </div>
  );
}
