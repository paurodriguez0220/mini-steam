import type { JSX } from "react";

export type AtriumTheme = "auto" | "light" | "dark";

export interface AtriumThemeToggleProps {
  /** Current theme mode of the sample subtree. */
  theme: AtriumTheme;
  /** Called with the next mode in the auto -> light -> dark cycle. */
  onChange: (theme: AtriumTheme) => void;
}

const ORDER: readonly AtriumTheme[] = ["auto", "light", "dark"];

const LABEL: Record<AtriumTheme, string> = {
  auto: "Auto",
  light: "Day",
  dark: "Night",
};

/** Cycles the sample between system, light and dark without touching the host app. */
export function AtriumThemeToggle({
  theme,
  onChange,
}: AtriumThemeToggleProps): JSX.Element {
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className="at-theme"
      onClick={() => onChange(next)}
      aria-label={`Appearance: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
    >
      <ThemeGlyph theme={theme} />
      <span className="at-theme__label">{LABEL[theme]}</span>
    </button>
  );
}

function ThemeGlyph({ theme }: { theme: AtriumTheme }): JSX.Element {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {theme === "dark" ? (
        <path d="M13 9.6A5.4 5.4 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6Z" />
      ) : theme === "light" ? (
        <g>
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 1.4v1.4M8 13.2v1.4M1.4 8h1.4M13.2 8h1.4M3.3 3.3l1 1M11.7 11.7l1 1M12.7 3.3l-1 1M4.3 11.7l-1 1" />
        </g>
      ) : (
        <g>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2a6 6 0 0 0 0 12Z" fill="currentColor" stroke="none" />
        </g>
      )}
    </svg>
  );
}
