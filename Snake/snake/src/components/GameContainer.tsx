import { useEffect, useRef, useState } from "react";
import Grid from "./Grid";
import type { Point } from "../types";
import { randomFood, isWallCollision, isSelfCollision } from "../utils/snake";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric } from "../../../../shared/game-score";

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const TICK_MS = 200;
const START_SNAKE: Point[] = [{ x: 0, y: 0 }];
const START_DIRECTION: Point = { x: 1, y: 0 };

const KEY_DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** Snake reports the number of food items eaten; higher is better. */
function scoreMetric(value: number): GameMetric {
  return { kind: "points", value, betterIs: "higher", label: "Score" };
}

export default function GameContainer() {
  const [snake, setSnake] = useState<Point[]>(START_SNAKE);
  const [direction, setDirection] = useState<Point>(START_DIRECTION);
  const [food, setFood] = useState<Point>(randomFood(START_SNAKE, GRID_SIZE));
  const [running, setRunning] = useState(true);

  // The snake grows by exactly one segment per food item and starts one long,
  // so the score is derived rather than tracked. That removes the class of bug
  // where a `setScore` inside a `setSnake` updater double-counts under
  // React StrictMode, which invokes updaters twice in development.
  const score = snake.length - 1;

  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = KEY_DIRECTIONS[e.key];
      if (!next) return;

      // The game owns the arrow keys - without this they scroll the embedding
      // page, because the board is taller than a short iframe viewport.
      e.preventDefault();
      if (!running) return;

      // No doubling back on yourself.
      if (next.x === -direction.x && next.y === -direction.y) return;
      // No redundant state write: a held key auto-repeats, and every write
      // reschedules the tick timer below, which would stall the snake.
      if (next.x === direction.x && next.y === direction.y) return;

      setDirection(next);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [direction, running]);

  // One tick = one move. The whole move is computed outside the state updaters
  // so that ending the run and placing new food are plain effects of the tick,
  // not side effects smuggled into a reducer.
  useEffect(() => {
    if (!running) return;

    const timer = setTimeout(() => {
      const head = snake[0];
      const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

      if (isWallCollision(nextHead, GRID_SIZE) || isSelfCollision(nextHead, snake)) {
        setRunning(false);
        return;
      }

      const grown = [nextHead, ...snake];
      const hasEaten = nextHead.x === food.x && nextHead.y === food.y;

      if (hasEaten) {
        setFood(randomFood(grown, GRID_SIZE));
        setSnake(grown);
      } else {
        setSnake(grown.slice(0, -1));
      }
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [direction, food, running, snake]);

  // Announce to the storefront that the game is up. Latched, because
  // StrictMode mounts effects twice in development.
  useEffect(() => {
    if (hasAnnouncedReady.current) return;
    hasAnnouncedReady.current = true;
    postGameScore({ type: "ready", game: "snake", metric: scoreMetric(0) });
  }, []);

  useEffect(() => {
    if (score === 0) return;
    postGameScore({ type: "progress", game: "snake", metric: scoreMetric(score) });
  }, [score]);

  // The run ended. Keyed on `running` and latched so it fires exactly once per
  // run, however many times React re-runs the effect; `restart` clears it.
  useEffect(() => {
    if (running || hasReportedFinal.current) return;
    hasReportedFinal.current = true;
    postGameScore({
      type: "final",
      game: "snake",
      metric: scoreMetric(score),
      outcome: "lost",
    });
  }, [running, score]);

  const restart = () => {
    hasReportedFinal.current = false;
    setSnake(START_SNAKE);
    setDirection(START_DIRECTION);
    setFood(randomFood(START_SNAKE, GRID_SIZE));
    setRunning(true);
  };

  return (
    <div className="page-bg relative isolate min-h-screen">
      <span className="confetti" aria-hidden="true" />

      <div className="relative z-10 flex animate-pop-in flex-col items-center gap-4 px-4 py-8">
        <h1 className="font-display text-4xl text-ink">Snake</h1>

        <p
          className="rounded-full bg-surface px-5 py-2 font-text text-lg text-ink-soft shadow-soft-1"
          aria-live="polite"
        >
          Score: <span className="font-display text-ink">{score}</span>
        </p>

        {!running && (
          <div
            role="status"
            className="flex animate-pop-in items-center gap-3 rounded-lg bg-surface px-5 py-4 shadow-soft-2"
          >
            <span className="font-display text-lg text-primary">Game Over</span>
            <button
              type="button"
              onClick={restart}
              className="min-h-11 rounded-full bg-primary px-5 font-display text-primary-ink shadow-soft-1 transition ease-spring hover:bg-primary-deep active:shadow-soft-press"
            >
              Restart
            </button>
          </div>
        )}

        <Grid snake={snake} food={food} gridSize={GRID_SIZE} cellSize={CELL_SIZE} />
      </div>
    </div>
  );
}
