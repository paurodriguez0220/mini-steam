import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { Board } from "./Board";
import { TopBar } from "./TopBar";
import type { DifficultyKey } from "../utils/config";
import { DIFFICULTIES } from "../utils/config";
import {
  createEmptyBoard,
  placeMines,
  calculateNumbers,
  revealFlood,
} from "../utils/board";
import { useBoardFit } from "../../../../shared/use-board-fit";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric, GameOutcome } from "../../../../shared/game-score";

const GAME_ID = "minesweeper";
const METRIC_LABEL = "Time";
const INITIAL_DIFFICULTY: DifficultyKey = "easy";

/** Faster than 1s so the displayed whole second is never visibly stale. */
const TICK_MS = 250;

/**
 * Cell sizing. Unlike Snake and 2048, Minesweeper does not shrink to fit: a
 * 30-column `hard` board on a 390px phone would mean ~13px cells, far below a
 * usable tap target. It holds a tappable size and pans instead.
 */
const MIN_CELL_PX = 32;
const MAX_CELL_PX = 44;

function elapsedSecondsSince(startedAt: number | null): number {
  return startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
}

/**
 * Minesweeper is the only game on the `lower` end of the scale: its metric is
 * elapsed time, so a smaller number is the better run.
 */
function timeMetric(seconds: number): GameMetric {
  return { kind: "seconds", value: seconds, betterIs: "lower", label: METRIC_LABEL };
}

export function GameContainer(): JSX.Element {
  // `difficulty` is the single source of truth and `config` is derived from
  // it. They used to be two pieces of state kept in sync only by every caller
  // remembering to pass both, so the score message could disagree with the
  // board it described.
  const [difficulty, setDifficulty] = useState<DifficultyKey>(INITIAL_DIFFICULTY);
  const config = DIFFICULTIES[difficulty];

  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: config.cols,
    rows: config.rows,
    min: MIN_CELL_PX,
    max: MAX_CELL_PX,
  });

  const [board, setBoard] = useState(() => createEmptyBoard(DIFFICULTIES[INITIAL_DIFFICULTY]));
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(config.mines);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isClockRunning, setIsClockRunning] = useState(false);

  /** Wall-clock start of the current run, or null before the first reveal. */
  const startedAtRef = useRef<number | null>(null);
  /**
   * `final` must fire exactly once per run. The win check lives in an effect
   * keyed on the board, which re-runs on every board change and re-sets
   * `won` idempotently - emitting from there without a latch posts duplicates.
   */
  const hasSentFinalRef = useRef(false);
  /** Survives StrictMode's dev-only double effect invocation. */
  const hasSentReadyRef = useRef(false);

  const sendFinal = useCallback(
    (outcome: GameOutcome, seconds: number): void => {
      if (hasSentFinalRef.current) return;
      hasSentFinalRef.current = true;

      postGameScore({
        type: "final",
        game: GAME_ID,
        metric: timeMetric(seconds),
        difficulty,
        outcome,
      });
    },
    [difficulty]
  );

  useEffect(() => {
    if (hasSentReadyRef.current) return;
    hasSentReadyRef.current = true;

    postGameScore({
      type: "ready",
      game: GAME_ID,
      metric: timeMetric(0),
      difficulty: INITIAL_DIFFICULTY,
    });
  }, []);

  // Display-only ticker. It never decides the reported time - that is always
  // read back off `startedAtRef` so a throttled interval cannot lose seconds.
  useEffect(() => {
    if (!isClockRunning) return;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(elapsedSecondsSince(startedAtRef.current));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isClockRunning]);

  const restart = (nextDifficulty: DifficultyKey = difficulty): void => {
    const nextConfig = DIFFICULTIES[nextDifficulty];

    setDifficulty(nextDifficulty);
    setBoard(createEmptyBoard(nextConfig));
    setFlagsLeft(nextConfig.mines);
    setStarted(false);
    setGameOver(false);
    setWon(false);
    setElapsedSeconds(0);
    setIsClockRunning(false);
    startedAtRef.current = null;
    hasSentFinalRef.current = false;
  };

  const handleReveal = (r: number, c: number): void => {
    if (gameOver || won) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

    const cell = newBoard[r][c];
    if (cell.isFlagged || cell.isRevealed) return;

    // Start the run only once we know the click actually reveals something.
    // Doing this before the guard above started the clock (and placed mines on
    // a board that was then discarded) when the first click landed on a flag.
    if (!started) {
      placeMines(newBoard, config, r, c);
      calculateNumbers(newBoard, config);
      startedAtRef.current = Date.now();
      setStarted(true);
      setIsClockRunning(true);
    }

    if (cell.hasMine) {
      cell.isRevealed = true;
      setBoard(newBoard);
      setGameOver(true);

      const seconds = elapsedSecondsSince(startedAtRef.current);
      setElapsedSeconds(seconds);
      setIsClockRunning(false);
      sendFinal("lost", seconds);
      return;
    }

    revealFlood(newBoard, config, r, c);
    setBoard(newBoard);
  };

  const handleFlag = (r: number, c: number): void => {
    if (gameOver || won) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newBoard[r][c];
    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    setFlagsLeft((f) => f + (cell.isFlagged ? -1 : 1));
    setBoard(newBoard);
  };

  useEffect(() => {
    if (gameOver || hasSentFinalRef.current) return;

    const revealed = board.flat().filter((cell) => cell.isRevealed).length;
    if (revealed !== config.rows * config.cols - config.mines) return;

    const seconds = elapsedSecondsSince(startedAtRef.current);
    setElapsedSeconds(seconds);
    setWon(true);
    setStarted(false);
    setIsClockRunning(false);
    sendFinal("won", seconds);
  }, [board, gameOver, config, sendFinal]);

  return (
    <div className="page-bg relative isolate grid h-dvh grid-rows-[auto_1fr] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[560px]">
        <TopBar
          flagsLeft={flagsLeft}
          elapsedSeconds={elapsedSeconds}
          gameOver={gameOver}
          won={won}
          difficulty={difficulty}
          onRestart={() => restart()}
          onDifficultyChange={(key) => restart(key)}
        />
      </div>

      {/* The frame is what is measured and what pans. The board inside it is
          whatever size a tappable cell makes it - which on a phone is wider
          than this frame, and that is the point: the page never scrolls, the
          board does. */}
      <div
        ref={boardFrameRef}
        className="relative z-10 min-h-0 overflow-auto overscroll-contain"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div className="grid min-h-full w-max min-w-full place-items-center p-1">
          {cellSize > 0 && (
            <div className="inline-flex animate-pop-in flex-col items-center gap-3 rounded-lg bg-surface p-3 shadow-soft-2">
              <Board
                board={board}
                config={config}
                cellSize={cellSize}
                onReveal={handleReveal}
                onFlag={handleFlag}
              />

              {gameOver && (
                <p className="font-display text-xl font-bold text-primary">💥 Game Over</p>
              )}
              {won && <p className="font-display text-xl font-bold text-mint">🎉 You Won!</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
