import type { Point } from "../types";
import { cornerRadii, taperInset } from "../utils/snake";

type SnakeSegmentProps = {
  position: Point;
  size: number;
  /** Offset to the neighbour on the head side, or null for the head itself. */
  towardHead: Point | null;
  /** Offset to the neighbour on the tail side, or null for the tail tip. */
  towardTail: Point | null;
  /** Distance from the tail tip, used to taper the last few segments. */
  indexFromTail: number;
  /** Alternating shade, so the body reads as scaled rather than as a plain tube. */
  banded: boolean;
  /** One tick of travel, in ms. Zero disables the glide. */
  glideMs: number;
};

/**
 * One cell of the body.
 *
 * Positioned with `transform` rather than `left`/`top` so the glide between
 * cells stays on the compositor. The glide is a plain CSS transition because of
 * a property of the render: the element at index i takes over the cell that
 * index i-1 held on the previous tick, which is always adjacent. So one
 * transition per segment *is* the correct one-cell step, and no per-frame
 * animation loop is needed. Linear easing, matched to the tick, keeps the
 * motion continuous across cell boundaries.
 */
export default function SnakeSegment({
  position,
  size,
  towardHead,
  towardTail,
  indexFromTail,
  banded,
  glideMs,
}: SnakeSegmentProps) {
  // The taper pulls in across the body, not along it, so which axis it applies
  // to depends on which way this segment lies.
  const axis = towardHead ?? towardTail;
  const isHorizontal = axis !== null && axis.x !== 0;
  const inset = taperInset(indexFromTail, size);

  const insetX = isHorizontal ? 0 : inset;
  const insetY = isHorizontal ? inset : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size - insetX * 2,
        height: size - insetY * 2,
        transform: `translate3d(${position.x * size + insetX}px, ${position.y * size + insetY}px, 0)`,
        transition: `transform ${glideMs}ms linear`,
        // Tokens, not literals - see the @theme block in index.css for why the
        // colour comes through var() while the geometry stays inline.
        backgroundColor: banded ? "var(--color-snake-deep)" : "var(--color-snake)",
        borderRadius: cornerRadii(towardHead, towardTail, size),
      }}
    />
  );
}
