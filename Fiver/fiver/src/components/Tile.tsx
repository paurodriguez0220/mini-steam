import type { JSX } from "react";
import type { LetterMark } from "../types";

export interface TileProps {
  letter: string;
  /** null while the row is still being typed - the letter is not judged yet. */
  mark: LetterMark | null;
  size: number;
  /** The row currently being typed, so an empty tile still reads as active. */
  isCurrentRow: boolean;
}

const MARK_CLASSES: Record<LetterMark, string> = {
  correct: "bg-mark-correct text-mark-ink border-transparent",
  present: "bg-mark-present text-mark-ink border-transparent",
  absent: "bg-mark-absent text-mark-ink border-transparent",
};

export function Tile({ letter, mark, size, isCurrentRow }: TileProps): JSX.Element {
  const unjudged = letter
    ? "border-line-strong bg-surface text-ink"
    : isCurrentRow
      ? "border-line-strong bg-surface text-ink"
      : "border-line bg-surface text-ink";

  return (
    <div
      className={`grid place-items-center rounded-sm border-2 font-display uppercase leading-none transition-colors duration-200 ${
        mark === null ? unjudged : MARK_CLASSES[mark]
      }`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}
