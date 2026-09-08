import type { JSX } from "react";
import type { DifficultyKey } from "../utils/config";
import { DIFFICULTY_KEYS, isDifficultyKey } from "../utils/config";

/**
 * The two readouts. `bg-ink`/`text-bg` is an inverted playroom chip - it
 * reads as an LED panel in light mode and inverts cleanly in dark mode,
 * which the old off-system `bg-gray-800 text-white` could not do.
 */
const READOUT_CLASSES =
  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm bg-ink px-3 font-display text-lg tabular-nums text-bg";

export interface TopBarProps {
  flagsLeft: number;
  /** Whole seconds since the first reveal. Frozen once the run ends. */
  elapsedSeconds: number;
  gameOver: boolean;
  won: boolean;
  difficulty: DifficultyKey;
  onRestart: () => void;
  onDifficultyChange: (key: DifficultyKey) => void;
}

export function TopBar({
  flagsLeft,
  elapsedSeconds,
  gameOver,
  won,
  difficulty,
  onRestart,
  onDifficultyChange,
}: TopBarProps): JSX.Element {
  const face = gameOver ? "😵" : won ? "😎" : "🙂";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-md bg-surface-2 p-2 shadow-soft-1">
      <span className={READOUT_CLASSES} aria-label={`${flagsLeft} flags left`}>
        💣 {flagsLeft}
      </span>

      <span className={READOUT_CLASSES} aria-label={`${elapsedSeconds} seconds elapsed`}>
        ⏱ {elapsedSeconds}
      </span>

      <button
        type="button"
        onClick={onRestart}
        aria-label="Restart game"
        className="min-h-11 min-w-11 shrink-0 rounded-sm bg-primary px-3 text-xl text-primary-ink shadow-soft-1 transition-transform duration-150 ease-spring hover:scale-105 active:scale-95 active:shadow-soft-press"
      >
        {face}
      </button>

      <label htmlFor="difficulty" className="sr-only">
        Difficulty
      </label>
      <select
        id="difficulty"
        value={difficulty}
        onChange={(event) => {
          if (isDifficultyKey(event.target.value)) {
            onDifficultyChange(event.target.value);
          }
        }}
        className="min-h-11 shrink-0 rounded-sm border border-line bg-surface px-3 font-text font-bold text-ink shadow-soft-1"
      >
        {DIFFICULTY_KEYS.map((key) => (
          <option key={key} value={key}>
            {key.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
