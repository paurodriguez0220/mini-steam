import { useEffect, useState } from "react";
import Grid from "./Grid";
import type { Point } from "../types";
import { randomFood, isWallCollision, isSelfCollision } from "../utils/snake";

const GRID_SIZE = 20;
const CELL_SIZE = 30; // bigger so it's more visual like your screenshot

export default function GameContainer() {
  const [snake, setSnake] = useState<Point[]>([{ x: 0, y: 0 }]);
  const [direction, setDirection] = useState<{ x: number; y: number }>({ x: 1, y: 0 });
  const [food, setFood] = useState<Point>(randomFood([{ x: 0, y: 0 }], GRID_SIZE));
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!running) return;
      if (e.key === "ArrowUp" && direction.y !== 1) setDirection({ x: 0, y: -1 });
      if (e.key === "ArrowDown" && direction.y !== -1) setDirection({ x: 0, y: 1 });
      if (e.key === "ArrowLeft" && direction.x !== 1) setDirection({ x: -1, y: 0 });
      if (e.key === "ArrowRight" && direction.x !== -1) setDirection({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [direction, running]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (isWallCollision(newHead, GRID_SIZE) || isSelfCollision(newHead, prev)) {
          setRunning(false);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(randomFood(newSnake, GRID_SIZE));
          setScore(prev => prev + 1);
        } else {
          newSnake.pop();
        }

        return [...newSnake];
      });
    }, 200);

    return () => clearInterval(interval);
  }, [direction, food, running]);

  const restart = () => {
    setSnake([{ x: 0, y: 0 }]);
    setDirection({ x: 1, y: 0 });
    setFood(randomFood([{ x: 0, y: 0 }], GRID_SIZE));
    setRunning(true);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Snake</h1>
      <p className="mb-4 text-gray-700 text-lg">Score: {score}</p>

      {!running && (
        <div className="mb-4 text-red-600 text-lg">
          Game Over
          <button
            onClick={restart}
            className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Restart
          </button>
        </div>
      )}

      <Grid snake={snake} food={food} gridSize={GRID_SIZE} cellSize={CELL_SIZE} />
    </div>
  );
}
