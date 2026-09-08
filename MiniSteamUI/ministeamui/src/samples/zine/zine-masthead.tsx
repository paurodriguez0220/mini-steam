import type { JSX } from "react";

export interface ZineMastheadProps {
  /** Number of games currently in the catalogue, printed in the top rail. */
  gameCount: number;
  /** Shown when a detail spread is open, so the reader can get back. */
  onHome?: () => void;
  /** True when a detail spread is open. */
  isDetailOpen: boolean;
}

const TICKER = [
  "three games",
  "zero downloads",
  "arrow keys ready",
  "printed on demand",
  "issue no. 03",
  "browser only",
];

/** Top-of-page masthead: rail, wordmark lockup and a scrolling ticker. */
export function ZineMasthead({
  gameCount,
  onHome,
  isDetailOpen,
}: ZineMastheadProps): JSX.Element {
  return (
    <header className="zine-masthead">
      <div className="zine-masthead__top">
        <span className="zine-kicker">Ministeam / vol. 1 / free forever</span>
        <span className="zine-kicker">
          {gameCount} {gameCount === 1 ? "game" : "games"} in this issue
        </span>
      </div>

      <div className="zine-masthead__lockup">
        <h1 className="zine-wordmark">
          <span>Mini</span>
          <span>Steam</span>
        </h1>

        <p className="zine-masthead__blurb">
          A cut-and-paste storefront for small browser games. No launcher, no
          patch notes, no 90&nbsp;GB download &mdash; press play and it runs.
        </p>

        {isDetailOpen && onHome ? (
          <button type="button" className="zine-btn zine-btn--acid" onClick={onHome}>
            All games
          </button>
        ) : (
          <span className="zine-sticker zine-sticker--flame zine-masthead__stamp">
            Issue no. 03
          </span>
        )}
      </div>

      <div className="zine-marquee">
        <div className="zine-marquee__track">
          {TICKER.map((item) => (
            <span key={item}>{item} &#9679;</span>
          ))}
          {TICKER.map((item) => (
            <span key={`${item}-b`}>{item} &#9679;</span>
          ))}
        </div>
      </div>
    </header>
  );
}
