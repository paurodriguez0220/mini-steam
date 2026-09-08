import type { JSX } from "react";
import { inkFor, issueNumber, posterLines } from "./zine-art";

export type ZinePosterSize = "card" | "hero" | "tile";

export interface ZinePosterProps {
  /** Game title - printed enormous, it *is* the cover art. */
  title: string;
  /** Category, printed on the black edge strip. */
  category: string;
  /** Game id; decides which flat ink pairing is used. */
  id: number;
  /** Aspect ratio preset. */
  size?: ZinePosterSize;
  /** Extra class from the caller, e.g. to drop the border inside a card. */
  className?: string;
}

/**
 * A typographic cover. No image, no grey placeholder box: a flat ink field,
 * a halftone dot screen, a faint print-registration grid and the title set
 * as large as the container allows with a hard-edged overprint shadow.
 */
export function ZinePoster({
  title,
  category,
  id,
  size = "card",
  className = "",
}: ZinePosterProps): JSX.Element {
  const lines = posterLines(title);
  const ink = inkFor(id);

  return (
    <div
      className={`zine-poster zine-poster--ink${ink} zine-poster--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="zine-poster__grid" />
      <span className="zine-poster__halftone" />
      <div className="zine-poster__type">
        {lines.map((line, index) => (
          <span className="zine-poster__line" key={`${line}-${index}`}>
            {line}
          </span>
        ))}
      </div>
      <span className="zine-poster__corner">{issueNumber(id)}</span>
      <span className="zine-poster__edge">
        {category} / play free / no install
      </span>
    </div>
  );
}
