import type { Point } from "../types";
import SnakeSegment from "./SnakeSegment";
import SnakeHead from "./SnakeHead";
import FoodBlock from "./FoodBlock";
import { offsetTo } from "../utils/snake";

type GridProps = {
  snake: Point[];
  food: Point;
  gridSize: number;
  cellSize: number;
  /** Rotation of the head, in degrees clockwise from "facing right". */
  headAngle: number;
  /** One tick of travel, in ms. Zero disables the glide. */
  glideMs: number;
};

const BORDER_PX = 2;

/**
 * The board.
 *
 * The checkerboard is a single element painted with a repeating conic
 * gradient rather than `gridSize * gridSize` absolutely-positioned divs, so a
 * fast tick no longer re-renders 400 static nodes.
 *
 * Geometry stays in an inline `style` because it is computed from `cellSize`;
 * the colours come from the board tokens in `index.css` via var(), because an
 * inline `backgroundColor` would beat any `bg-*` utility.
 */
export default function Grid({
  snake,
  food,
  gridSize,
  cellSize,
  headAngle,
  glideMs,
}: GridProps) {
  const boardPx = gridSize * cellSize;
  // One gradient tile covers a 2x2 block of cells: light, dark, light, dark.
  const tilePx = cellSize * 2;

  const [head, ...body] = snake;

  return (
    <div
      className="relative overflow-hidden rounded-md shadow-soft-2"
      style={{
        // content-box so the 2px frame sits outside the 600x600 play area and
        // the gradient stays aligned with the absolutely-positioned pieces.
        boxSizing: "content-box",
        width: boardPx,
        height: boardPx,
        border: `${BORDER_PX}px solid var(--color-board-edge)`,
        backgroundColor: "var(--color-board-light)",
        backgroundImage:
          "repeating-conic-gradient(var(--color-board-light) 0% 25%, var(--color-board-dark) 0% 50%)",
        backgroundSize: `${tilePx}px ${tilePx}px`,
        backgroundPosition: "0 0",
      }}
    >
      {body.map((segment, i) => {
        // `i` indexes the body, so the segment's index in the whole snake is
        // i + 1: its head-side neighbour is snake[i] and its tail-side one is
        // snake[i + 2].
        const index = i + 1;
        const next = snake[index + 1];

        return (
          <SnakeSegment
            key={index}
            position={segment}
            size={cellSize}
            towardHead={offsetTo(segment, snake[index - 1])}
            towardTail={next ? offsetTo(segment, next) : null}
            indexFromTail={snake.length - 1 - index}
            // Banding is anchored to distance from the tail, not from the head,
            // because that is the one of the two that survives growth: eating
            // shifts every index up by one and the length by one, so the parity
            // of each segment is unchanged and the pattern does not flip.
            banded={(snake.length - index) % 2 === 0}
            glideMs={glideMs}
          />
        );
      })}

      <SnakeHead
        position={head}
        size={cellSize}
        towardTail={body[0] ? offsetTo(head, body[0]) : null}
        angle={headAngle}
        glideMs={glideMs}
      />

      <FoodBlock position={food} size={cellSize} />
    </div>
  );
}
