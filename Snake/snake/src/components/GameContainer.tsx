import { useEffect, useRef, useState } from "react";
import Grid from "./Grid";
import type { Point } from "../types";
import {
  randomFood,
  isWallCollision,
  isSelfCollision,
  tickMsFor,
  nextHeadAngle,
} from "../utils/snake";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric } from "../../../../shared/game-score";

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const START_SNAKE: Point[] = [
  { x: 10, y: 5 }, { x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 },
  { x: 7, y: 6 }, { x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 },
  { x: 4, y: 7 }, { x: 3, y: 7 },
];
const START_DIRECTION: Point = { x: 1, y: 0 };

/**
 * How many turns may be held at once. One is not enough - a turn pressed
 * mid-tick would be dropped - and more than two lets a flurry of keypresses
 * queue up a path the player has stopped watching.
 */
const MAX_QUEUED_TURNS = 2;

const UP: Point = { x: 0, y: -1 };
const DOWN: Point = { x: 0, y: 1 };
const LEFT: Point = { x: -1, y: 0 };
const RIGHT: Point = { x: 1, y: 0 };

const ARROW_DIRECTIONS: Record<string, Point> = {
  ArrowUp: UP,
  ArrowDown: DOWN,
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
};

const WASD_DIRECTIONS: Record<string, Point> = {
  w: UP,
  s: DOWN,
  a: LEFT,
  d: RIGHT,
};

function directionForKey(key: string): Point | undefined {
  return ARROW_DIRECTIONS[key] ?? WASD_DIRECTIONS[key.toLowerCase()];
}

/** Snake reports the number of food items eaten; higher is better. */
function scoreMetric(value: number): GameMetric {
  return { kind: "points", value, betterIs: "higher", label: "Score" };
}

export default function GameContainer() {
  const [snake, setSnake] = useState<Point[]>(START_SNAKE);
  const [food, setFood] = useState<Point>(() => randomFood(START_SNAKE, GRID_SIZE));
  const [running, setRunning] = useState(true);
  const [headAngle, setHeadAngle] = useState(0);

  // The snake holds still until the first turn is queued. Without this the run
  // begins on mount and walks into the wall before the player has touched a
  // key - see docs/issues/defined/snake-ends-immediately-without-input.md.
  const [started, setStarted] = useState(false);

  // The tick loop reads the game state through refs and the render reads it
  // through state. That split is what keeps the loop stable: a turn no longer
  // writes React state, so it can no longer tear down and reschedule the tick
  // timer, which would break the glide by desyncing the transition from the
  // real gap between ticks.
  const snakeRef = useRef<Point[]>(START_SNAKE);
  const foodRef = useRef<Point>(food);
  const directionRef = useRef<Point>(START_DIRECTION);
  const queueRef = useRef<Point[]>([]);
  const runningRef = useRef(true);

  // The snake grows by exactly one segment per food item and starts one long,
  // so the score is derived rather than tracked. That removes the class of bug
  // where a `setScore` inside a `setSnake` updater double-counts under
  // React StrictMode, which invokes updaters twice in development.
  const score = snake.length - 1;

  const prefersReducedMotion = usePrefersReducedMotion();
  const glideMs = prefersReducedMotion ? 0 : tickMsFor(snake.length);

  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = directionForKey(e.key);
      if (!next) return;

      // The game owns the arrow keys - without this they scroll the embedding
      // page, because the board is taller than a short iframe viewport. WASD
      // carries no default worth suppressing.
      if (e.key in ARROW_DIRECTIONS) e.preventDefault();
      if (!runningRef.current) return;

      // Validate against the last turn already queued, not the direction the
      // snake is facing now: the queued one is what the snake will be facing
      // when this turn is applied. Checking the committed direction instead is
      // what let two quick presses double the snake back through its own neck.
      const facing = queueRef.current[queueRef.current.length - 1] ?? directionRef.current;
      if (next.x === -facing.x && next.y === -facing.y) return;
      if (next.x === facing.x && next.y === facing.y) return;
      if (queueRef.current.length >= MAX_QUEUED_TURNS) return;

      queueRef.current.push(next);
      setStarted(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // One tick = one move. The whole move is computed outside the state updaters
  // so that ending the run and placing new food are plain effects of the tick,
  // not side effects smuggled into a reducer. The chain reschedules itself with
  // a fresh delay each time rather than running on an interval, because the
  // snake speeds up as it grows.
  useEffect(() => {
    if (!running || !started) return;

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      // At most one turn per tick: applying two would let the snake round a
      // corner and come back into its own neck within a single cell.
      const turn = queueRef.current.shift();
      if (turn) {
        directionRef.current = turn;
        setHeadAngle(angle => nextHeadAngle(angle, turn));
      }

      const current = snakeRef.current;
      const direction = directionRef.current;
      const head = current[0];
      const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
      const willGrow = nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y;

      // The tail vacates its cell on every tick except the one the snake eats
      // on, so moving into the space the tail is leaving is only fatal while
      // the snake is growing.
      const body = willGrow ? current : current.slice(0, -1);

      if (isWallCollision(nextHead, GRID_SIZE) || isSelfCollision(nextHead, body)) {
        runningRef.current = false;
        setRunning(false);
        return;
      }

      const grown = [nextHead, ...current];
      const moved = willGrow ? grown : grown.slice(0, -1);

      if (willGrow) {
        const nextFood = randomFood(grown, GRID_SIZE);
        foodRef.current = nextFood;
        setFood(nextFood);
      }

      // Written eagerly so the next tick sees this move even if it fires before
      // React has committed the render.
      snakeRef.current = moved;
      setSnake(moved);

      timer = setTimeout(tick, tickMsFor(moved.length));
    };

    timer = setTimeout(tick, tickMsFor(snakeRef.current.length));
    return () => clearTimeout(timer);
  }, [running, started]);

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
    const nextFood = randomFood(START_SNAKE, GRID_SIZE);

    hasReportedFinal.current = false;
    queueRef.current = [];
    directionRef.current = START_DIRECTION;
    snakeRef.current = START_SNAKE;
    foodRef.current = nextFood;
    runningRef.current = true;

    setSnake(START_SNAKE);
    setFood(nextFood);
    setHeadAngle(0);
    setStarted(false);
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

        {running && !started && (
          <p
            role="status"
            className="rounded-lg bg-surface px-5 py-3 font-text text-ink-soft shadow-soft-1"
          >
            Press an arrow key or <span className="font-display text-ink">WASD</span> to start
          </p>
        )}

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

        <Grid
          snake={snake}
          food={food}
          gridSize={GRID_SIZE}
          cellSize={CELL_SIZE}
          headAngle={headAngle}
          glideMs={glideMs}
        />
      </div>
    </div>
  );
}
