import type { JSX } from "react";
import type { DifficultyKey } from "../utils/config";
import { DIFFICULTY_KEYS, DIFFICULTY_LABELS, GUESSES_FOR, isDifficultyKey } from "../utils/config";

export interface RunBarProps {
  streak: number;
  guessesLeft: number;
  difficulty: DifficultyKey;
  runOver: boolean;
  /** Only offered once there is something worth banking. */
  canBank: boolean;
  onDifficultyChange: (key: DifficultyKey) => void;
  onEndRun: () => void;
  onNewRun: () => void;
}

const READOUT =
  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm bg-ink px-3 font-display text-lg tabular-nums text-bg";

export function RunBar({
  streak,
  guessesLeft,
  difficulty,
  runOver,
  canBank,
  onDifficultyChange,
  onEndRun,
  onNewRun,
}: RunBarProps): JSX.Element {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2 p-2 shadow-soft-1">
      <span className={READOUT} aria-label={`Streak ${streak}`} aria-live="polite">
        🔥 {streak}
      </span>

      <span
        className={READOUT}
        aria-label={`${guessesLeft} of ${GUESSES_FOR[difficulty]} guesses left`}
      >
        {guessesLeft}/{GUESSES_FOR[difficulty]}
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
            {DIFFICULTY_LABELS[key]} · {GUESSES_FOR[key]}
          </option>
        ))}
      </select>

      {/* Banking is the only way a strong player on easy ever records a score:
          they may simply never fail a word, and a closed tab reports nothing. */}
      {runOver ? (
        <button
          type="button"
          onClick={onNewRun}
          className="min-h-11 shrink-0 rounded-full bg-primary px-4 font-display text-sm text-primary-ink shadow-soft-1 transition-transform duration-150 ease-spring hover:scale-105 active:scale-95"
        >
          New run
        </button>
      ) : (
        <button
          type="button"
          onClick={onEndRun}
          disabled={!canBank}
          className="min-h-11 shrink-0 rounded-full bg-surface px-4 font-display text-sm text-ink shadow-soft-1 transition-transform duration-150 ease-spring hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          End run
        </button>
      )}
    </div>
  );
}
