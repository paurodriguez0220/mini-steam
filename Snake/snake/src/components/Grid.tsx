import type { Point } from "../types";
import SnakeBlock from "./SnakeBlock";
import FoodBlock from "./FoodBlock";

type GridProps = {
  snake: Point[];
  food: Point;
  gridSize: number;
  cellSize: number;
};

export default function Grid({ snake, food, gridSize, cellSize }: GridProps) {
  // checkerboard colors
  const color1 = "#A8D070";
  const color2 = "#BCE588";

  return (
    <div
      style={{
        position: "relative",
        width: gridSize * cellSize,
        height: gridSize * cellSize,
        border: "2px solid #6C9C40",
      }}
    >
      {/* checkerboard */}
      {Array.from({ length: gridSize }).map((_, row) =>
        Array.from({ length: gridSize }).map((_, col) => (
          <div
            key={`${row}-${col}`}
            style={{
              position: "absolute",
              width: cellSize,
              height: cellSize,
              left: col * cellSize,
              top: row * cellSize,
              backgroundColor: (row + col) % 2 === 0 ? color1 : color2,
            }}
          />
        ))
      )}

      {/* Snake */}
      {snake.map((s, i) => (
        <SnakeBlock key={i} position={s} size={cellSize} isHead={i === 0} />
      ))}

      {/* Food */}
      <FoodBlock position={food} size={cellSize} />
    </div>
  );
}
