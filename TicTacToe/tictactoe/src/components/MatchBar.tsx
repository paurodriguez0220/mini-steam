import type { JSX } from "react";
import type { DifficultyKey } from "../utils/config";
import {
  DIFFICULTY_KEYS,
  DIFFICULTY_LABELS,
  MAX_MATCH_SCORE,
  ROUNDS_PER_MATCH,
  isDifficultyKey,
} from "../utils/config";

export interface MatchBarProps {
  /** 1-based, and clamped to ROUNDS_PER_MATCH once the match is over. */
  round: number;
  score: number;
  difficulty: DifficultyKey;
  matchOver: boolean;
  onDifficultyChange: (key: DifficultyKey) => void;
  onNewMatch: () => void;
}

const READOUT =
  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm bg-ink px-3 font-display text-lg tabular-nums text-bg";

export function MatchBar({
  round,
  score,
  difficulty,
  matchOver,
  onDifficultyChange,
  onNewMatch,
}: MatchBarProps): JSX.Element {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2 p-2 shadow-soft-1">
      <span className={READOUT} aria-label={`Round ${round} of ${ROUNDS_PER_MATCH}`}>
        Round {round}/{ROUNDS_PER_MATCH}
      </span>

      <span
        className={READOUT}
        aria-live="polite"
        aria-label={`Score ${score} of ${MAX_MATCH_SCORE}`}
      >
        {score}/{MAX_MATCH_SCORE}
      </span>

      <label htmlFor="difficulty" className="sr-only">
        Difficulty
      </label>
      <select
        id="difficulty"
        value={difficulty}
        onChange={(event) => {
          if (isDifficultyKey(event.target.value)) onDifficultyChange(event.target.value);
        }}
        className="min-h-11 shrink-0 rounded-sm border-2 border-line bg-surface px-2 font-display text-sm uppercase tracking-wide text-ink"
      >
        {DIFFICULTY_KEYS.map((key) => (
          <option key={key} value={key}>
            {DIFFICULTY_LABELS[key]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onNewMatch}
        className="min-h-11 shrink-0 rounded-full bg-primary px-4 font-display text-sm text-primary-ink shadow-soft-1 transition-transform duration-150 ease-spring hover:scale-105 active:scale-95 active:shadow-soft-press"
      >
        {matchOver ? "Play again" : "Restart"}
      </button>
    </div>
  );
}
