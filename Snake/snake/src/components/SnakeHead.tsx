import type { CSSProperties } from "react";
import type { Point } from "../types";
import { cornerRadii } from "../utils/snake";

type SnakeHeadProps = {
  position: Point;
  size: number;
  /** Offset to the first body segment, or null while the snake is one cell long. */
  towardTail: Point | null;
  /**
   * Rotation in degrees clockwise from "facing right". Accumulates rather than
   * wrapping, so the head always swivels the short way into a turn.
   */
  angle: number;
  /** One tick of travel, in ms. Zero disables the glide and the swivel. */
  glideMs: number;
};

/** The head sits slightly proud of its cell so it reads as a head, not a body cell. */
const HEAD_SCALE = 1.12;

/**
 * The head: a domed snout, two eyes and a tongue that flicks.
 *
 * Two nested transforms, deliberately: the outer element glides between cells
 * and the inner one rotates to face the direction of travel. Keeping them
 * separate means the swivel can share the tick duration without the two
 * transforms fighting, and the eyes and tongue can be laid out once in
 * "facing right" space instead of four times.
 */
export default function SnakeHead({
  position,
  size,
  towardTail,
  angle,
  glideMs,
}: SnakeHeadProps) {
  const headSize = size * HEAD_SCALE;
  const overhang = (headSize - size) / 2;

  const eyeSize = headSize * 0.26;
  const eyeFromFront = headSize * 0.48;

  const eye = (top: number): CSSProperties => ({
    position: "absolute",
    width: eyeSize,
    height: eyeSize,
    left: eyeFromFront,
    top,
    backgroundColor: "var(--color-snake-eye)",
    borderRadius: "50%",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: headSize,
        height: headSize,
        transform: `translate3d(${position.x * size - overhang}px, ${position.y * size - overhang}px, 0)`,
        transition: `transform ${glideMs}ms linear`,
        backgroundColor: "var(--color-snake)",
        borderRadius: cornerRadii(null, towardTail, headSize),
        // The head overlaps the neck, so it has to paint on top of it.
        zIndex: 1,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: `rotate(${angle}deg)`,
          transition: `transform ${glideMs}ms linear`,
        }}
      >
        <div style={eye(headSize * 0.14)}>
          <div
            style={{
              position: "absolute",
              width: "50%",
              height: "50%",
              left: "38%",
              top: "28%",
              backgroundColor: "var(--color-snake-pupil)",
              borderRadius: "50%",
            }}
          />
        </div>
        <div style={eye(headSize * 0.6)}>
          <div
            style={{
              position: "absolute",
              width: "50%",
              height: "50%",
              left: "38%",
              top: "22%",
              backgroundColor: "var(--color-snake-pupil)",
              borderRadius: "50%",
            }}
          />
        </div>

        <div
          className="snake-tongue"
          style={{
            position: "absolute",
            left: "96%",
            top: "50%",
            width: headSize * 0.42,
            height: headSize * 0.13,
            backgroundColor: "var(--color-snake-tongue)",
          }}
        />
      </div>
    </div>
  );
}
