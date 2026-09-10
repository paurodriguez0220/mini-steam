import { useCallback, useEffect, useRef, useState } from "react";
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
import { useBoardFit } from "../../../../shared/use-board-fit";
import { useSwipe } from "../../../../shared/use-swipe";
import type { SwipeDirection } from "../../../../shared/swipe";
import DirectionPad from "./DirectionPad";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric } from "../../../../shared/game-score";

const GRID_SIZE = 20;

/**
 * Biggest cell worth drawing. 30px is what the board used to be pinned at, so
 * a desktop board comes out exactly the size it always was; anything narrower
 * now shrinks to fit instead of overflowing.
 */
const MAX_CELL_PX = 30;

/** The board's 2px frame, both sides. Not cell, so it comes off the fit. */
const BOARD_BORDER_TOTAL_PX = 4;
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

const SWIPE_DIRECTIONS: Record<SwipeDirection, Point> = {
  up: UP,
  down: DOWN,
  left: LEFT,
  right: RIGHT,
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

  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: GRID_SIZE,
    rows: GRID_SIZE,
    gapTotal: BOARD_BORDER_TOTAL_PX,
    // Snake must always show the whole board, so the fit always wins.
    min: 0,
    max: MAX_CELL_PX,
  });

  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);

  /**
   * The one way a turn enters the game, whichever input asked for it.
   *
   * Validates against the last turn already queued rather than the direction
   * the snake is facing now: the queued one is what the snake will be facing
   * when this turn is applied. Checking the committed direction instead is
   * what let two quick presses double the snake back through its own neck.
   */
  const queueTurn = useCallback((next: Point): void => {
    if (!runningRef.current) return;

    const facing = queueRef.current[queueRef.current.length - 1] ?? directionRef.current;
    if (next.x === -facing.x && next.y === -facing.y) return;
    if (next.x === facing.x && next.y === facing.y) return;
    if (queueRef.current.length >= MAX_QUEUED_TURNS) return;

    queueRef.current.push(next);
    setStarted(true);
  }, []);

  const handleSwipe = useCallback(
    (direction: SwipeDirection): void => queueTurn(SWIPE_DIRECTIONS[direction]),
    [queueTurn],
  );

  const swipeHandlers = useSwipe(handleSwipe);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = directionForKey(e.key);
      if (!next) return;

      // The game owns the arrow keys - without this they scroll the embedding
      // page. WASD carries no default worth suppressing.
      if (e.key in ARROW_DIRECTIONS) e.preventDefault();

      queueTurn(next);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [queueTurn]);

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
    // h-dvh, not min-h-screen: inside the storefront iframe the viewport IS
    // the iframe, and a min-height taller than it is what grew the scrollbar.
    // Three rows - HUD, board, controls - and only the board row flexes, so
    // the game cannot outgrow its viewport by construction.
    <div className="page-bg relative isolate grid h-dvh grid-cols-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 flex animate-pop-in flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl text-ink sm:text-4xl">Snake</h1>

        <p
          className="rounded-full bg-surface px-4 py-1 font-text text-base text-ink-soft shadow-soft-1 sm:px-5 sm:py-2 sm:text-lg"
          aria-live="polite"
        >
          Score: <span className="font-display text-ink">{score}</span>
        </p>
      </header>

      {/* min-h-0 is what lets this row shrink. A grid row is min-content by
          default, which would let the board push the container taller than
          the viewport - the exact bug being fixed. min-w-0 is the same rule on
          the other axis, and grid-cols-1 above resolves to minmax(0, 1fr) so
          the column cannot be stretched to the board's width either. Without
          both, a board sized at a wide viewport props its own frame open and
          never re-fits when the viewport narrows. */}
      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 min-w-0 place-items-center"
      >
        {cellSize > 0 && (
          <div className="relative" style={{ touchAction: "none" }} {...swipeHandlers}>
            <Grid
              snake={snake}
              food={food}
              gridSize={GRID_SIZE}
              cellSize={cellSize}
              headAngle={headAngle}
              glideMs={glideMs}
            />

            {running && !started && (
              <p
                role="status"
                className="absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-lg bg-surface/95 px-4 py-3 text-center font-text text-sm text-ink-soft shadow-soft-2 sm:text-base"
              >
                Swipe, or press an arrow key or{" "}
                <span className="font-display text-ink">WASD</span>, to start
              </p>
            )}

            {!running && (
              <div
                role="status"
                className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 animate-pop-in flex-col items-center gap-3 rounded-lg bg-surface/95 px-5 py-4 shadow-soft-2"
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
          </div>
        )}
      </div>

      <div className="relative z-10">
        <DirectionPad onTurn={handleSwipe} />
      </div>
    </div>
  );
}
