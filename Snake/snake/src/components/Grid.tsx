import type { Point } from "../types";
import SnakeBlock from "./SnakeBlock";
import FoodBlock from "./FoodBlock";

type GridProps = {
  snake: Point[];
  food: Point;
  gridSize: number;
  cellSize: number;
};

const BORDER_PX = 2;

/**
 * The board.
 *
 * The checkerboard is a single element painted with a repeating conic
 * gradient rather than `gridSize * gridSize` absolutely-positioned divs, so a
 * 200ms tick no longer re-renders 400 static nodes.
 *
 * Geometry stays in an inline `style` because it is computed from `cellSize`;
 * the colours come from the board tokens in `index.css` via var(), because an
 * inline `backgroundColor` would beat any `bg-*` utility.
 */
export default function Grid({ snake, food, gridSize, cellSize }: GridProps) {
  const boardPx = gridSize * cellSize;
  // One gradient tile covers a 2x2 block of cells: light, dark, light, dark.
  const tilePx = cellSize * 2;

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
      {snake.map((segment, i) => (
        <SnakeBlock key={i} position={segment} size={cellSize} isHead={i === 0} />
      ))}

      <FoodBlock position={food} size={cellSize} />
    </div>
  );
}
