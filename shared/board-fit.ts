/**
 * Mini Steam - board sizing.
 *
 * Every game lays its board out in pixels derived from one cell size. This
 * turns "how much room have I got" into that number, so the games stay
 * pixel-based - which matters, because Snake's corner radii, taper and head
 * geometry are all computed from it in JavaScript.
 *
 * Pure, and deliberately DOM-free, so it can be tested without a browser.
 * `use-board-fit.ts` is the React wrapper.
 */

export interface BoardFitInput {
  /** Width of the box the board must fit inside, in px. */
  frameW: number;
  /** Height of the box the board must fit inside, in px. */
  frameH: number;
  cols: number;
  rows: number;
  /**
   * Pixels consumed along each axis by gutters, padding and borders - anything
   * that is not cell. Subtracted from the frame before dividing.
   */
  gapTotal?: number;
  /**
   * Smallest acceptable cell, in px. Pass 0 to always shrink to fit.
   *
   * Above 0 this is a floor rather than a fit: the board may come out larger
   * than its frame, which is the caller's cue to pan instead of shrink.
   */
  min: number;
  /** Largest useful cell, in px, so a wide desktop frame does not inflate the board. */
  max: number;
}

/**
 * The largest whole-pixel cell that fits, clamped to [min, max].
 *
 * Whole pixels matter: Snake paints its checkerboard with a repeating conic
 * gradient whose background-size has to line up with absolutely-positioned
 * pieces, and a fractional cell puts a visible seam between them.
 */
export function fittedCellSize(input: BoardFitInput): number {
  const { frameW, frameH, cols, rows, gapTotal = 0, min, max } = input;

  // A frame that has not been laid out yet, or a board with no cells. Both
  // resolve to min: the caller renders nothing until it gets a real number.
  if (cols <= 0 || rows <= 0 || frameW <= 0 || frameH <= 0) {
    return Math.min(min, max);
  }

  const byWidth = (frameW - gapTotal) / cols;
  const byHeight = (frameH - gapTotal) / rows;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  // max wins over min, so a caller that asks for a floor above its own ceiling
  // gets the ceiling rather than an impossible board.
  return Math.min(max, Math.max(min, fitted));
}
