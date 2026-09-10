import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Board as BoardValue, Mark, RoundOutcome } from "../types";
import type { DifficultyKey } from "../utils/config";
import {
  AI_MOVE_DELAY_MS,
  MAX_MATCH_SCORE,
  POINTS_FOR_DRAW,
  POINTS_FOR_LOSS,
  POINTS_FOR_WIN,
  ROUNDS_PER_MATCH,
  ROUND_RESULT_MS,
} from "../utils/config";
import { chooseMove } from "../utils/ai";
import { emptyBoard, isFull, opponentOf, placeMark, winnerOf } from "../utils/game";
import { Board, BOARD_GAP_TOTAL_PX } from "./Board";
import { MatchBar } from "./MatchBar";
import { RoundResult } from "./RoundResult";
import { useBoardFit } from "../../../../shared/use-board-fit";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric, GameOutcome } from "../../../../shared/game-score";

const GAME_ID = "tictactoe";
const PLAYER_MARK: Mark = "X";
const AI_MARK: Mark = "O";
const INITIAL_DIFFICULTY: DifficultyKey = "medium";
const BOARD_SIZE = 3;

/**
 * Biggest cell worth drawing. Three columns clear a 44px tap target at any
 * phone width, so this board never has to pan - it only has to stop growing.
 */
const MAX_CELL_PX = 110;

/**
 * Who opens round n. Moving first is a real advantage, so it alternates.
 *
 * The player opens the odd rounds, which with five rounds leaves them the
 * extra one. That is the right way round for a game on a portfolio.
 */
function openerFor(round: number): Mark {
  return round % 2 === 1 ? PLAYER_MARK : AI_MARK;
}

function pointsFor(outcome: RoundOutcome): number {
  if (outcome === "won") return POINTS_FOR_WIN;
  if (outcome === "drawn") return POINTS_FOR_DRAW;
  return POINTS_FOR_LOSS;
}

/** Tic Tac Toe reports the match score out of 15; higher is better. */
function scoreMetric(value: number): GameMetric {
  return { kind: "points", value, betterIs: "higher", label: "Score" };
}

interface MatchState {
  /** 1-based. Stops at ROUNDS_PER_MATCH once the match is over. */
  round: number;
  score: number;
  playerWins: number;
  aiWins: number;
}

const INITIAL_MATCH: MatchState = { round: 1, score: 0, playerWins: 0, aiWins: 0 };

/** `playing` accepts moves; `round-over` and `match-over` show the overlay. */
type Phase = "playing" | "round-over" | "match-over";

export function GameContainer(): JSX.Element {
  const [difficulty, setDifficulty] = useState<DifficultyKey>(INITIAL_DIFFICULTY);
  const [match, setMatch] = useState<MatchState>(INITIAL_MATCH);
  const [board, setBoard] = useState<BoardValue>(emptyBoard);
  const [turn, setTurn] = useState<Mark>(() => openerFor(1));
  const [phase, setPhase] = useState<Phase>("playing");
  const [roundOutcome, setRoundOutcome] = useState<RoundOutcome | null>(null);
  const [winningLine, setWinningLine] = useState<readonly number[] | null>(null);

  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: BOARD_SIZE,
    rows: BOARD_SIZE,
    gapTotal: BOARD_GAP_TOTAL_PX,
    // Three columns always fit, so the fit always wins and it never pans.
    min: 0,
    max: MAX_CELL_PX,
  });

  // StrictMode mounts effects twice in development. These latches make each
  // score message fire exactly once per real transition.
  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);
  const reportedScore = useRef(0);

  /**
   * Close the round and bank its points.
   *
   * Both the player's move and the AI's funnel through here, so the scoring
   * table is applied in exactly one place.
   */
  const endRound = useCallback(
    (outcome: RoundOutcome, line: readonly number[] | null): void => {
      setWinningLine(line);
      setRoundOutcome(outcome);
      setPhase("round-over");
      setMatch((current) => ({
        ...current,
        score: current.score + pointsFor(outcome),
        playerWins: current.playerWins + (outcome === "won" ? 1 : 0),
        aiWins: current.aiWins + (outcome === "lost" ? 1 : 0),
      }));
    },
    [],
  );

  /**
   * Place a mark and decide what the board means.
   *
   * The whole consequence of a move is worked out here rather than in an
   * effect watching the board, so a move has one obvious outcome and the
   * round cannot be closed twice by a re-render.
   */
  const applyMove = useCallback(
    (index: number, mark: Mark): void => {
      if (board[index] !== null) return;

      const next = placeMark(board, index, mark);
      const win = winnerOf(next);

      // Every one of these is a top-level update. Nesting them inside a
      // setBoard updater would be the same trap 2048 documents: React 19
      // StrictMode invokes updaters twice, so a setState called from within
      // one is enqueued twice and the round would bank its points twice.
      setBoard(next);

      if (win !== null) {
        endRound(win.mark === PLAYER_MARK ? "won" : "lost", win.line);
      } else if (isFull(next)) {
        endRound("drawn", null);
      } else {
        setTurn(opponentOf(mark));
      }
    },
    [board, endRound],
  );

  const handlePlay = (index: number): void => {
    if (phase !== "playing" || turn !== PLAYER_MARK) return;
    if (board[index] !== null) return;
    applyMove(index, PLAYER_MARK);
  };

  // The AI's turn. Delayed so the player sees their own mark land first, and
  // cleared on unmount so a pending reply cannot arrive on a new board.
  useEffect(() => {
    if (phase !== "playing" || turn !== AI_MARK) return;

    const timer = window.setTimeout(() => {
      applyMove(chooseMove(board, AI_MARK, difficulty), AI_MARK);
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [phase, turn, board, difficulty, applyMove]);

  // Hold the result up, then start the next round or end the match.
  useEffect(() => {
    if (phase !== "round-over") return;

    const timer = window.setTimeout(() => {
      if (match.round >= ROUNDS_PER_MATCH) {
        setPhase("match-over");
        return;
      }

      const nextRound = match.round + 1;
      setMatch((current) => ({ ...current, round: nextRound }));
      setBoard(emptyBoard());
      setWinningLine(null);
      setRoundOutcome(null);
      setTurn(openerFor(nextRound));
      setPhase("playing");
    }, ROUND_RESULT_MS);

    return () => window.clearTimeout(timer);
  }, [phase, match.round]);

  const startNewMatch = useCallback((nextDifficulty: DifficultyKey = difficulty): void => {
    setDifficulty(nextDifficulty);
    setMatch(INITIAL_MATCH);
    setBoard(emptyBoard());
    setTurn(openerFor(1));
    setPhase("playing");
    setRoundOutcome(null);
    setWinningLine(null);
    // Re-arm the terminal message so the next match can report its own final.
    hasReportedFinal.current = false;
  }, [difficulty]);

  useEffect(() => {
    if (hasAnnouncedReady.current) return;
    hasAnnouncedReady.current = true;

    postGameScore({
      type: "ready",
      game: GAME_ID,
      metric: scoreMetric(0),
      difficulty: INITIAL_DIFFICULTY,
    });
  }, []);

  // "progress" - only when the running score actually moved.
  useEffect(() => {
    if (reportedScore.current === match.score) return;
    reportedScore.current = match.score;

    postGameScore({
      type: "progress",
      game: GAME_ID,
      metric: scoreMetric(match.score),
      difficulty,
    });
  }, [match.score, difficulty]);

  // "final" - once per match. A match is won by taking more rounds than the
  // AI; five draws is a respectable 5 points but it is not a win.
  useEffect(() => {
    if (phase !== "match-over" || hasReportedFinal.current) return;
    hasReportedFinal.current = true;

    const outcome: GameOutcome = match.playerWins > match.aiWins ? "won" : "lost";
    postGameScore({
      type: "final",
      game: GAME_ID,
      metric: scoreMetric(match.score),
      difficulty,
      outcome,
    });
  }, [phase, match.playerWins, match.aiWins, match.score, difficulty]);

  const matchOver = phase === "match-over";
  const boardLocked = phase !== "playing" || turn !== PLAYER_MARK;

  const statusLine = matchOver
    ? `Final score ${match.score} of ${MAX_MATCH_SCORE}`
    : turn === PLAYER_MARK
      ? "Your turn"
      : "Thinking…";

  return (
    // h-dvh, not min-h-screen: inside the storefront iframe the viewport IS
    // the iframe. grid-cols-1 resolves to minmax(0, 1fr) and pairs with the
    // min-w-0/min-h-0 below, so the board can never prop its own frame open.
    <div className="page-bg relative isolate grid h-dvh grid-cols-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 mx-auto w-full max-w-[520px]">
        <MatchBar
          round={match.round}
          score={match.score}
          difficulty={difficulty}
          matchOver={matchOver}
          onDifficultyChange={(key) => startNewMatch(key)}
          onNewMatch={() => startNewMatch()}
        />
      </header>

      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 min-w-0 place-items-center"
      >
        {cellSize > 0 && (
          <div className="relative animate-pop-in">
            <Board
              board={board}
              cellSize={cellSize}
              winningLine={winningLine}
              disabled={boardLocked}
              onPlay={handlePlay}
            />

            {roundOutcome !== null && (phase === "round-over" || matchOver) && (
              <RoundResult
                outcome={roundOutcome}
                matchOver={matchOver}
                score={match.score}
              />
            )}
          </div>
        )}
      </div>

      <p
        className="relative z-10 text-center font-text text-sm text-ink-soft"
        aria-live="polite"
      >
        {statusLine}
      </p>
    </div>
  );
}
