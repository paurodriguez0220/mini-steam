import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import type { ScoredGuess, WordOutcome } from "../types";
import type { DifficultyKey } from "../utils/config";
import { GUESSES_FOR, WORD_LENGTH, WORD_RESULT_MS } from "../utils/config";
import { keyboardStateFor, markGuess } from "../utils/marking";
import { randomAnswer, rejectGuess } from "../utils/words";
import { GRID_GAP_TOTAL_PX, TileGrid } from "./TileGrid";
import { Keyboard } from "./Keyboard";
import { RunBar } from "./RunBar";
import { WordResult } from "./WordResult";
import { useBoardFit } from "../../../../shared/use-board-fit";
import { postGameScore } from "../../../../shared/game-score";
import type { GameMetric, GameOutcome } from "../../../../shared/game-score";

const GAME_ID = "fiver";
const INITIAL_DIFFICULTY: DifficultyKey = "easy";

/** Biggest tile worth drawing; past this the board dwarfs the keyboard. */
const MAX_TILE_PX = 62;

/** How long the "not a word" nudge stays up. Long enough to read, not to nag. */
const REJECTION_MS = 1200;

/** Fiver reports the streak - how many words were solved before the run ended. */
function scoreMetric(value: number): GameMetric {
  return { kind: "points", value, betterIs: "higher", label: "Streak" };
}

/** `playing` accepts letters; `word-over` shows the overlay; `run-over` is terminal. */
type Phase = "playing" | "word-over" | "run-over";

export function GameContainer(): JSX.Element {
  const [difficulty, setDifficulty] = useState<DifficultyKey>(INITIAL_DIFFICULTY);
  const [answer, setAnswer] = useState<string>(() => randomAnswer());
  const [submitted, setSubmitted] = useState<ScoredGuess[]>([]);
  const [draft, setDraft] = useState("");
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [wordOutcome, setWordOutcome] = useState<WordOutcome | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  /** Words already served this run, so a streak never repeats one. */
  const usedRef = useRef<Set<string>>(new Set());
  const guessAllowance = GUESSES_FOR[difficulty];

  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: WORD_LENGTH,
    rows: guessAllowance,
    gapTotal: GRID_GAP_TOTAL_PX,
    // The whole board must always be visible; the keyboard takes priority for
    // space and the tiles shrink into what is left.
    min: 0,
    max: MAX_TILE_PX,
  });

  // StrictMode mounts effects twice in development. Latched so each score
  // message fires exactly once per real transition.
  const hasAnnouncedReady = useRef(false);
  const hasReportedFinal = useRef(false);
  const reportedStreak = useRef(0);

  const keyStates = useMemo(() => keyboardStateFor(submitted), [submitted]);

  /** Close the run and report it. Both endings - failure and banking - land here. */
  const endRun = useCallback(
    (finalStreak: number, outcome: GameOutcome): void => {
      setPhase("run-over");

      if (hasReportedFinal.current) return;
      hasReportedFinal.current = true;
      postGameScore({
        type: "final",
        game: GAME_ID,
        metric: scoreMetric(finalStreak),
        difficulty,
        outcome,
      });
    },
    [difficulty],
  );

  const startWord = useCallback((): void => {
    setAnswer(randomAnswer(usedRef.current));
    setSubmitted([]);
    setDraft("");
    setWordOutcome(null);
    setPhase("playing");
  }, []);

  const startRun = useCallback((nextDifficulty: DifficultyKey): void => {
    usedRef.current = new Set();
    hasReportedFinal.current = false;
    reportedStreak.current = 0;

    setDifficulty(nextDifficulty);
    setStreak(0);
    setAnswer(randomAnswer());
    setSubmitted([]);
    setDraft("");
    setWordOutcome(null);
    setPhase("playing");
  }, []);

  const submitGuess = useCallback((): void => {
    if (phase !== "playing") return;

    const guess = draft.toLowerCase();
    const reason = rejectGuess(guess);
    if (reason !== null) {
      // A refused guess must never cost a turn - it is a typo, not a play.
      setRejection(reason === "too-short" ? "Not enough letters" : "Not in word list");
      return;
    }

    const scored: ScoredGuess = { word: guess, marks: markGuess(guess, answer) };
    const nextSubmitted = [...submitted, scored];

    setSubmitted(nextSubmitted);
    setDraft("");
    usedRef.current.add(answer);

    if (guess === answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setWordOutcome("solved");
      setPhase("word-over");
      return;
    }

    if (nextSubmitted.length >= guessAllowance) {
      setWordOutcome("failed");
      setPhase("word-over");
    }
  }, [phase, draft, answer, submitted, streak, guessAllowance]);

  const typeLetter = useCallback(
    (letter: string): void => {
      if (phase !== "playing") return;
      setDraft((current) => (current.length >= WORD_LENGTH ? current : current + letter));
    },
    [phase],
  );

  const backspace = useCallback((): void => {
    if (phase !== "playing") return;
    setDraft((current) => current.slice(0, -1));
  }, [phase]);

  // Physical keyboard, so the game is fully playable on a desktop.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        typeLetter(event.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [submitGuess, backspace, typeLetter]);

  // Clear the "not a word" nudge on its own timer.
  useEffect(() => {
    if (rejection === null) return;
    const timer = window.setTimeout(() => setRejection(null), REJECTION_MS);
    return () => window.clearTimeout(timer);
  }, [rejection]);

  // Hold the word result up, then move on - or end the run if it was missed.
  useEffect(() => {
    if (phase !== "word-over") return;

    const timer = window.setTimeout(() => {
      if (wordOutcome === "failed") {
        endRun(streak, "lost");
        return;
      }
      startWord();
    }, WORD_RESULT_MS);

    return () => window.clearTimeout(timer);
  }, [phase, wordOutcome, streak, endRun, startWord]);

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

  // "progress" - each solved word, and the reset to 0 on a new run.
  useEffect(() => {
    if (reportedStreak.current === streak) return;
    reportedStreak.current = streak;

    postGameScore({
      type: "progress",
      game: GAME_ID,
      metric: scoreMetric(streak),
      difficulty,
    });
  }, [streak, difficulty]);

  const runOver = phase === "run-over";
  const guessesLeft = Math.max(0, guessAllowance - submitted.length);

  const boardLabel = runOver
    ? `Run over. ${streak} words solved.`
    : `Guess ${submitted.length + 1} of ${guessAllowance}. ${streak} solved so far.`;

  return (
    // h-dvh, not min-h-screen: inside the storefront iframe the viewport IS the
    // iframe. grid-cols-1 resolves to minmax(0, 1fr) and pairs with min-w-0
    // below so the board can never prop its own frame open.
    <div className="page-bg relative isolate grid h-dvh grid-cols-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 mx-auto w-full max-w-[520px]">
        <RunBar
          streak={streak}
          guessesLeft={guessesLeft}
          difficulty={difficulty}
          runOver={runOver}
          canBank={streak > 0}
          onDifficultyChange={startRun}
          onEndRun={() => endRun(streak, "won")}
          onNewRun={() => startRun(difficulty)}
        />
      </header>

      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 min-w-0 place-items-center"
      >
        {cellSize > 0 && (
          <div className="relative">
            <TileGrid
              submitted={submitted}
              draft={draft}
              rows={guessAllowance}
              cellSize={cellSize}
              invalid={rejection !== null}
              label={boardLabel}
            />

            {rejection !== null && (
              <p
                role="status"
                className="absolute inset-x-0 -top-1 mx-auto w-max -translate-y-full rounded-full bg-ink px-4 py-1.5 font-display text-sm text-bg shadow-soft-2"
              >
                {rejection}
              </p>
            )}

            {wordOutcome !== null && (phase === "word-over" || runOver) && (
              <WordResult
                outcome={wordOutcome}
                answer={answer}
                streak={streak}
                runOver={runOver}
              />
            )}

            {runOver && wordOutcome === null && (
              <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-center">
                <div
                  role="status"
                  className="flex animate-pop-in flex-col items-center gap-1 rounded-lg bg-surface/95 px-6 py-4 text-center shadow-soft-2"
                >
                  <span className="font-display text-2xl text-mint">Run banked</span>
                  <span className="font-text text-sm text-ink-soft">
                    {streak} {streak === 1 ? "word" : "words"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <Keyboard
          states={keyStates}
          disabled={phase !== "playing"}
          onLetter={typeLetter}
          onEnter={submitGuess}
          onBackspace={backspace}
        />
      </div>
    </div>
  );
}
