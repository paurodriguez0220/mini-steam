import { BOARD_SIZE } from "./utils/board";

/**
 * Board geometry - the single source of truth.
 *
 * The tile size, the per-cell step and the frame size used to be hardcoded
 * independently in Tile.tsx and Board.tsx, so changing one silently broke the
 * others. Everything here derives from TILE_PX and TILE_GAP_PX.
 *
 * The board is deliberately a fixed pixel size; a responsive board is a
 * separate piece of work.
 */

/** Edge length of a single tile. */
export const TILE_PX = 80;

/** Gutter between adjacent tiles, and the inset around the whole grid. */
export const TILE_GAP_PX = 4;

/** Distance from one cell's origin to the next. */
export const TILE_STEP_PX = TILE_PX + TILE_GAP_PX;

/** Inner grid: BOARD_SIZE cells with a gap between each, but not after the last. */
export const BOARD_PX = TILE_STEP_PX * BOARD_SIZE - TILE_GAP_PX;

/** Inset between the grid and the frame edge, so every gutter reads the same. */
export const BOARD_PADDING_PX = TILE_GAP_PX;

/** Outer size of the frame - used to line the header and controls up with the board. */
export const BOARD_FRAME_PX = BOARD_PX + BOARD_PADDING_PX * 2;

/**
 * How long a freshly spawned tile animates for.
 *
 * Must match `--animate-pop-in` in `shared/theme.css` (460ms): the spawn flag
 * is cleared on this timer, and clearing it early cuts the animation short.
 */
export const TILE_SPAWN_ANIMATION_MS = 460;
