import type { JSX } from "react";
import type { CoverKind } from "./art";

export interface CoverMotifProps {
  /** Which geometric motif to draw. */
  kind: CoverKind;
  /** Extra class applied to the root svg. */
  className?: string;
}

/**
 * Pure-geometry artwork used in place of the cover images the API does not
 * provide. Every motif is stroked in `currentColor` so the parent cover can
 * tint it from its generated hue.
 */
export function CoverMotif({ kind, className }: CoverMotifProps): JSX.Element {
  if (kind === "puzzle") {
    return (
      <svg
        className={className}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g stroke="currentColor" strokeWidth="1.5">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const filled = (row * 4 + col) % 5 === 0 || row + col === 3;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={6 + col * 27}
                  y={6 + row * 27}
                  width="24"
                  height="24"
                  rx="2"
                  fill={filled ? "currentColor" : "none"}
                  fillOpacity={filled ? 0.22 : 0}
                  strokeOpacity={filled ? 0.95 : 0.4}
                />
              );
            }),
          )}
        </g>
        <path
          d="M33 60h27M60 33v27"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
    );
  }

  if (kind === "arcade") {
    return (
      <svg
        className={className}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="currentColor" fillOpacity="0.28">
          {[0, 1, 2, 3, 4, 5].map((row) =>
            [0, 1, 2, 3, 4, 5].map((col) => (
              <circle key={`${row}-${col}`} cx={12 + col * 19} cy={12 + row * 19} r="1.6" />
            )),
          )}
        </g>
        <path
          d="M12 31h38v19H31v19h57v19H50"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeOpacity="0.9"
        />
        <rect x="82" y="12" width="12" height="12" rx="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6">
        <circle cx="60" cy="60" r="52" strokeDasharray="6 10" />
        <circle cx="60" cy="60" r="38" strokeDasharray="18 8" />
        <circle cx="60" cy="60" r="24" />
      </g>
      <circle cx="60" cy="60" r="9" fill="currentColor" fillOpacity="0.7" />
      <path d="M60 2v22M60 96v22M2 60h22M96 60h22" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
