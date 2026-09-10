import { BOARD_SIZE } from "./utils/board";

/**
 * Board geometry - the single source of truth.
 *
 * The tile size, the per-cell step and the frame size used to be hardcoded
 * independently in Tile.tsx and Board.tsx, so changing one silently broke the
 * others. Everything here still derives from one number; that number is now
 * measured rather than fixed.
 */

/** Gutter between adjacent tiles, and the inset around the whole grid. */
export const TILE_GAP_PX = 4;

/**
 * Biggest tile worth drawing. 80px is what the board used to be pinned at, so
 * a desktop board comes out exactly the size it always was.
 */
export const MAX_TILE_PX = 80;

/**
 * Pixels along each axis that are gutter rather than tile: one between each
 * pair of tiles, plus the inset on both edges.
 */
export const BOARD_GAP_TOTAL_PX = TILE_GAP_PX * (BOARD_SIZE + 1);

export interface BoardLayout {
  /** Edge length of a single tile. */
  tilePx: number;
  gapPx: number;
  /** Distance from one cell's origin to the next. */
  stepPx: number;
  /** Inner grid: BOARD_SIZE cells with a gap between each, but not after the last. */
  boardPx: number;
  /** Inset between the grid and the frame edge, so every gutter reads the same. */
  paddingPx: number;
  /** Outer size of the frame - used to line the header and controls up with the board. */
  framePx: number;
}

export function boardLayout(cellSize: number): BoardLayout {
  const stepPx = cellSize + TILE_GAP_PX;
  const boardPx = stepPx * BOARD_SIZE - TILE_GAP_PX;

  return {
    tilePx: cellSize,
    gapPx: TILE_GAP_PX,
    stepPx,
    boardPx,
    paddingPx: TILE_GAP_PX,
    framePx: boardPx + TILE_GAP_PX * 2,
  };
}

/**
 * How long a freshly spawned tile animates for.
 *
 * Must match `--animate-pop-in` in `shared/theme.css` (460ms): the spawn flag
 * is cleared on this timer, and clearing it early cuts the animation short.
 */
export const TILE_SPAWN_ANIMATION_MS = 460;
