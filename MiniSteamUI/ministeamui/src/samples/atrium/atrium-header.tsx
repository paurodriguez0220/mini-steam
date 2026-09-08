import type { JSX } from "react";
import { AtriumThemeToggle, type AtriumTheme } from "./atrium-theme-toggle";

export interface AtriumHeaderProps {
  /** Small right-aligned editorial note, hidden on phones. */
  note: string;
  theme: AtriumTheme;
  onThemeChange: (theme: AtriumTheme) => void;
  /** Returns to the catalogue when the wordmark is used as a home link. */
  onHome: () => void;
}

/** Sticky, translucent masthead: wordmark, issue note, appearance control. */
export function AtriumHeader({
  note,
  theme,
  onThemeChange,
  onHome,
}: AtriumHeaderProps): JSX.Element {
  return (
    <header className="at-header">
      <div className="at-shell at-header__inner">
        <button
          type="button"
          className="at-plain at-wordmark"
          onClick={onHome}
          aria-label="Atrium home"
        >
          <span className="at-wordmark__mark">Atrium</span>
          <span className="at-wordmark__sub">MiniSteam</span>
        </button>

        <div className="at-header__actions">
          <span className="at-header__note">{note}</span>
          <AtriumThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
