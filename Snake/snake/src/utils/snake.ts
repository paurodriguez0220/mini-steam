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
