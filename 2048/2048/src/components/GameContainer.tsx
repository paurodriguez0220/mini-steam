import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "./Board";
import type { Tile } from "../types";
import { addRandomTile, moveTiles, boardChanged, isGameOver, BOARD_SIZE } from "../utils/board";
import {
  BOARD_GAP_TOTAL_PX,
  MAX_TILE_PX,
  TILE_SPAWN_ANIMATION_MS,
  boardLayout,
} from "../board-layout";
import { useBoardFit } from "../../../../shared/use-board-fit";
import { useSwipe } from "../../../../shared/use-swipe";
import type { SwipeDirection } from "../../../../shared/swipe";
import { postGameScore, type GameMetric } from "../../../../shared/game-score";

type Direction = "up" | "down" | "left" | "right";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Builds the opening board: an empty grid seeded with two random tiles.
// Kept outside the component so it can be used as a lazy useState initializer -
// seeding state in a mount effect causes an extra render pass.
function createInitialBoard(): { tiles: Tile[]; nextId: number } {
  let t: Tile[] = [];
  let id = 1;

  let r = addRandomTile(t, id);
  t = r.tiles;
  id = r.nextId;

  r = addRandomTile(t, id);
  return { tiles: r.tiles, nextId: r.nextId };
}

/** The metric shape the storefront ranks 2048 by. No difficulty - 2048 has one mode. */
function scoreMetric(value: number): GameMetric {
  return { kind: "points", value, betterIs: "higher", label: "Score" };
}

export function GameContainer() {
  const [initialBoard] = useState(createInitialBoard);
  const [tiles, setTiles] = useState<Tile[]>(initialBoard.tiles);
  const [nextId, setNextId] = useState(initialBoard.nextId);
  const [score, setScore] = useState(0);

  // Derived once per render rather than re-evaluated inline in JSX, so the
  // game-over effect below has a stable value to react to.
  const isOver = isGameOver(tiles);

  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: BOARD_SIZE,
    rows: BOARD_SIZE,
    gapTotal: BOARD_GAP_TOTAL_PX,
    // 2048 must always show the whole board, so the fit always wins.
    min: 0,
    max: MAX_TILE_PX,
  });

  const layout = boardLayout(cellSize);

  // StrictMode invokes effects twice in development. These latches make each
  // score message fire exactly once per real transition.
  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);
  const reportedScore = useRef(0);

  const startNewGame = useCallback(() => {
    const fresh = createInitialBoard();
    setTiles(fresh.tiles);
    setNextId(fresh.nextId);
    setScore(0);
    // Re-arm the terminal message so a second run can report its own final.
    hasReportedFinal.current = false;
  }, []);

  // Clear spawn once the pop-in animation has finished.
  useEffect(() => {
    if (!tiles.some((t) => t.spawn)) return;

    const timeout = setTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, spawn: false })));
    }, TILE_SPAWN_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [tiles]);

  /**
   * The one way a move enters the game, whichever input asked for it.
   *
   * The move is computed here rather than inside a setTiles updater: React 19
   * StrictMode invokes updaters twice, so any setState nested in one
   * double-counts the score and double-advances nextId. Each piece of state
   * gets its own top-level update instead.
   */
  const applyMove = useCallback(
    (direction: Direction): void => {
      if (isOver) return;

      const { tiles: moved, gained } = moveTiles(tiles, direction);
      if (!boardChanged(tiles, moved)) return;

      const spawned = addRandomTile(moved, nextId);
      setTiles(spawned.tiles);
      setNextId(spawned.nextId);
      if (gained > 0) {
        setScore((current) => current + gained);
      }
    },
    [tiles, nextId, isOver],
  );

  // SwipeDirection and Direction have the same four members, so a swipe maps
  // straight through with no lookup table to keep in sync.
  const handleSwipe = useCallback(
    (direction: SwipeDirection): void => applyMove(direction),
    [applyMove],
  );

  const swipeHandlers = useSwipe(handleSwipe);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;

      // Stop the arrow keys scrolling the page the game is embedded in.
      e.preventDefault();
      applyMove(direction);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [applyMove]);

  // "ready" - once, on mount.
  useEffect(() => {
    if (hasAnnouncedReady.current) return;
    hasAnnouncedReady.current = true;

    postGameScore({ type: "ready", game: "2048", metric: scoreMetric(0) });
  }, []);

  // "progress" - whenever the score actually changes, including the reset to 0
  // on a new game so the storefront HUD follows along.
  useEffect(() => {
    if (reportedScore.current === score) return;
    reportedScore.current = score;

    postGameScore({ type: "progress", game: "2048", metric: scoreMetric(score) });
  }, [score]);

  // "final" - exactly once per run. 2048 has no win detection in this
  // codebase, so a finished run is always a loss.
  useEffect(() => {
    if (!isOver || hasReportedFinal.current) return;
    hasReportedFinal.current = true;

    postGameScore({
      type: "final",
      game: "2048",
      metric: scoreMetric(score),
      outcome: "lost",
    });
  }, [isOver, score]);

  return (
    <div className="page-bg relative isolate grid h-dvh grid-cols-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-[520px] items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-4xl">2048</h1>

        <div className="rounded-sm bg-surface px-4 py-1 text-center shadow-soft-1 sm:px-5 sm:py-2">
          <p className="font-text text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            Score
          </p>
          <p className="font-display text-xl leading-none text-ink tabular-nums sm:text-2xl" aria-live="polite">
            {score.toLocaleString("en-US")}
          </p>
        </div>
      </header>

      {/* min-h-0 lets this row shrink; without it the grid row is min-content
          and the board pushes the page taller than the viewport. min-w-0 and
          the grid-cols-1 above (which resolves to minmax(0, 1fr)) do the same
          on the other axis, or a board sized at a wide viewport props its own
          frame open and never re-fits when the viewport narrows. */}
      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 min-w-0 place-items-center"
        style={{ touchAction: "none" }}
        {...swipeHandlers}
      >
        {cellSize > 0 && (
          <div className="relative animate-pop-in">
            <Board tiles={tiles} layout={layout} />

            {isOver && (
              <div className="absolute inset-0 grid animate-pop-in place-content-center rounded-lg bg-surface/85">
                <p role="status" className="font-display text-2xl text-primary">
                  Game Over
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <button
          type="button"
          onClick={startNewGame}
          className="min-h-11 rounded-full bg-primary px-6 font-display text-base text-primary-ink shadow-soft-2 transition-transform duration-200 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-press"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
