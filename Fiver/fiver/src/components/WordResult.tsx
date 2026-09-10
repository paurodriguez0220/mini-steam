import type { JSX } from "react";
import type { WordOutcome } from "../types";

export interface WordResultProps {
  outcome: WordOutcome;
  /** Shown when the word was missed - otherwise the player never finds out. */
  answer: string;
  streak: number;
  /** True when this also ended the run. */
  runOver: boolean;
}

export function WordResult({ outcome, answer, streak, runOver }: WordResultProps): JSX.Element {
  const solved = outcome === "solved";

  return (
    <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-center">
      <div
        role="status"
        className="flex animate-pop-in flex-col items-center gap-1 rounded-lg bg-surface/95 px-6 py-4 text-center shadow-soft-2"
      >
        <span className={`font-display text-2xl ${solved ? "text-mint" : "text-primary"}`}>
          {solved ? "Solved" : "Missed"}
        </span>

        {!solved && (
          <span className="font-text text-sm text-ink-soft">
            It was <span className="font-display uppercase text-ink">{answer}</span>
          </span>
        )}

        <span className="font-text text-sm text-ink-soft">
          {runOver
            ? `Run over — ${streak} ${streak === 1 ? "word" : "words"}`
            : `Streak ${streak}`}
        </span>
      </div>
    </div>
  );
}
