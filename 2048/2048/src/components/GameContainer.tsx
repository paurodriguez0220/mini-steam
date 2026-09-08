import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "./Board";
import type { Tile } from "../types";
import { addRandomTile, moveTiles, boardChanged, isGameOver } from "../utils/board";
import { BOARD_FRAME_PX, TILE_SPAWN_ANIMATION_MS } from "../board-layout";
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

  // Keyboard controls. The move is computed here in the handler body, not
  // inside a setTiles updater: React 19 StrictMode invokes updaters twice, so
  // any setState nested in one double-counts the score and double-advances
  // nextId. Each piece of state gets its own top-level update instead.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;

      // Stop the arrow keys scrolling the page the game is embedded in.
      e.preventDefault();
      if (isOver) return;

      const { tiles: moved, gained } = moveTiles(tiles, direction);
      if (!boardChanged(tiles, moved)) return;

      const spawned = addRandomTile(moved, nextId);
      setTiles(spawned.tiles);
      setNextId(spawned.nextId);
      if (gained > 0) {
        setScore((current) => current + gained);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [tiles, nextId, isOver]);

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
    <div className="page-bg relative isolate flex min-h-screen w-full items-center justify-center px-4 py-8">
      <span className="confetti" aria-hidden="true" />

      <main
        className="relative z-10 flex animate-pop-in flex-col items-center gap-5"
        style={{ width: BOARD_FRAME_PX }}
      >
        <header className="flex w-full items-end justify-between gap-4">
          <h1 className="font-display text-4xl text-ink">2048</h1>

          <div className="rounded-sm bg-surface px-5 py-2 text-center shadow-soft-1">
            <p className="font-text text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              Score
            </p>
            <p className="font-display text-2xl leading-none text-ink tabular-nums" aria-live="polite">
              {score.toLocaleString("en-US")}
            </p>
          </div>
        </header>

        <Board tiles={tiles} />

        <div className="flex w-full items-center justify-between gap-4">
          {/* Always in the DOM so it is a live region, but empty until the run
              ends - an always-rendered, visually hidden message gets announced. */}
          <p role="status" className="flex min-h-11 items-center font-display text-lg text-primary">
            {isOver && <span className="animate-pop-in">Game Over</span>}
          </p>

          <button
            type="button"
            onClick={startNewGame}
            className="min-h-11 rounded-full bg-primary px-6 font-display text-base text-primary-ink shadow-soft-2 transition-transform duration-200 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-press"
          >
            New Game
          </button>
        </div>
      </main>
    </div>
  );
}
