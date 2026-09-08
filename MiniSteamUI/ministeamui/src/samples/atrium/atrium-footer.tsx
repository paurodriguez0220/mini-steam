import type { JSX } from "react";

export interface AtriumFooterProps {
  /** Number of titles currently published in the collection. */
  titleCount: number;
  /** Categories to list in the index column. */
  categories: readonly string[];
}

/** Hairline-ruled colophon closing the page. */
export function AtriumFooter({ titleCount, categories }: AtriumFooterProps): JSX.Element {
  return (
    <footer className="at-footer">
      <div className="at-shell">
        <div className="at-footer__grid">
          <div>
            <p className="at-eyebrow">Colophon</p>
            <p className="at-footer__lede">
              Atrium is a small, slowly assembled reading room for browser games. Everything
              here runs in a tab, needs no account, and is over before your coffee is.
            </p>
          </div>

          <div>
            <p className="at-eyebrow">Index</p>
            <ul className="at-footer__list">
              <li className="at-footer__item">{titleCount} titles in print</li>
              {categories.map((category) => (
                <li className="at-footer__item" key={category}>
                  {category}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="at-eyebrow">Set in</p>
            <ul className="at-footer__list">
              <li className="at-footer__item">Instrument Serif</li>
              <li className="at-footer__item">Manrope</li>
            </ul>
          </div>
        </div>

        <div className="at-footer__base">
          <span>MiniSteam &middot; Atrium</span>
          <span>Direction D</span>
        </div>
      </div>
    </footer>
  );
}
