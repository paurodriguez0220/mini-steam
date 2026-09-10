/**
 * Mini Steam - swipe direction.
 *
 * Pure, so the threshold and dominant-axis rules can be tested without a DOM.
 * `use-swipe.ts` binds this to pointer events.
 */

export type SwipeDirection = "up" | "down" | "left" | "right";

/** Below this, a drag is a tap. Overridable per game. */
export const DEFAULT_SWIPE_MIN_PX = 24;

/**
 * The cardinal direction of a drag, or null if it was too short to be one.
 *
 * The dominant axis wins, and a perfect diagonal resolves to horizontal rather
 * than to nothing - a swipe the player clearly made should always do
 * something, even if they were sloppy about the angle.
 *
 * @param dx Horizontal travel in px, positive rightward.
 * @param dy Vertical travel in px, positive downward (client coordinates).
 */
export function swipeDirection(
  dx: number,
  dy: number,
  minDistance: number,
): SwipeDirection | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < minDistance && absY < minDistance) return null;

  if (absX >= absY) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
