import type { Point } from "../types";

// Generate random food not overlapping the snake
export function randomFood(snake: Point[], gridSize: number): Point {
  while (true) {
    const f = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    if (!snake.some(s => s.x === f.x && s.y === f.y)) return f;
  }
}

// Check wall collision
export function isWallCollision(head: Point, gridSize: number): boolean {
  return head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize;
}

// Check self collision
export function isSelfCollision(head: Point, snake: Point[]): boolean {
  return snake.some(s => s.x === head.x && s.y === head.y);
}

/** How long one cell of travel takes, in ms, for a snake of this length. */
const BASE_TICK_MS = 140;
const TICK_STEP_MS = 3;
const MIN_TICK_MS = 80;

export function tickMsFor(length: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - (length - 1) * TICK_STEP_MS);
}

/**
 * The offset from one cell to an adjacent one, or null when there is no
 * neighbour. Two segments never share a cell (the collision check forbids it),
 * so a zero offset means "no neighbour" rather than "neighbour here".
 */
export function offsetTo(from: Point, to: Point): Point | null {
  const offset = { x: to.x - from.x, y: to.y - from.y };
  return offset.x === 0 && offset.y === 0 ? null : offset;
}

/**
 * The border-radius for one segment, in CSS `top-left top-right bottom-right
 * bottom-left` order.
 *
 * A corner is rounded only when neither of the two edges meeting there touches
 * a neighbour. That single rule produces the whole body shape: a straight run
 * comes out square on all four corners and so reads as one seamless tube, the
 * head is domed on its leading edge, an elbow is rounded on the outside of the
 * bend and sharp on the inside, and the tail closes into a capsule.
 */
export function cornerRadii(
  towardHead: Point | null,
  towardTail: Point | null,
  size: number,
): string {
  const neighbours = [towardHead, towardTail].filter(Boolean) as Point[];
  const has = (x: number, y: number) => neighbours.some(n => n.x === x && n.y === y);

  const up = has(0, -1);
  const down = has(0, 1);
  const left = has(-1, 0);
  const right = has(1, 0);

  const radius = size / 2;
  const corner = (a: boolean, b: boolean) => (a || b ? 0 : radius);

  return [
    corner(up, left),
    corner(up, right),
    corner(down, right),
    corner(down, left),
  ]
    .map(px => `${px}px`)
    .join(" ");
}

/**
 * How far the last few segments pull in from the edge of their cell, per side,
 * so the body narrows to a point instead of stopping square.
 */
const TAPER_FRACTIONS = [0.26, 0.15, 0.06];

export function taperInset(indexFromTail: number, size: number): number {
  const fraction = TAPER_FRACTIONS[indexFromTail];
  return fraction === undefined ? 0 : fraction * size;
}

/** Degrees clockwise from "facing right" for a direction of travel. */
function baseAngle(direction: Point): number {
  if (direction.x === 1) return 0;
  if (direction.y === 1) return 90;
  if (direction.x === -1) return 180;
  return 270;
}

/**
 * The head's next rotation, expressed as a continuous angle rather than one
 * wrapped to 0-359. Turning right from "facing up" has to read as +90deg, not
 * as a 270deg spin the long way round, so we keep accumulating and always pick
 * the equivalent of the target nearest to where the head already points.
 */
export function nextHeadAngle(currentAngle: number, direction: Point): number {
  const target = baseAngle(direction);
  const delta = ((((target - currentAngle) % 360) + 540) % 360) - 180;
  return currentAngle + delta;
}
