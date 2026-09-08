import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { issueNumber, posterLines } from "./zine-art";
import { ZinePoster } from "./zine-poster";

export interface ZineHeroProps {
  /** The game given the cover spread. */
  game: Game;
  /** Open the full-screen player. */
  onPlay: (game: Game) => void;
  /** Open the in-sample detail spread. */
  onOpen: (game: Game) => void;
}

/** Cover spread: oversized title on the left, typographic poster taped on the right. */
export function ZineHero({ game, onPlay, onOpen }: ZineHeroProps): JSX.Element {
  const lines = posterLines(game.title);
  const headLines = lines.length > 1 ? lines : [lines[0], game.category];

  return (
    <section className="zine-hero" aria-labelledby="zine-hero-title">
      <div className="zine-hero__copy">
        <div className="zine-hero__eyebrow">
          <span className="zine-sticker">Cover story</span>
          <span className="zine-kicker">No. {issueNumber(game.id)} / picked by hand</span>
        </div>

        <h2 className="zine-display zine-hero__title" id="zine-hero-title">
          {headLines.map((line, index) =>
            index === 0 ? (
              <span key={`${line}-${index}`}>{line}</span>
            ) : (
              <em key={`${line}-${index}`}>{line}</em>
            ),
          )}
        </h2>

        <p className="zine-hero__desc">{game.description}</p>

        <div className="zine-hero__actions">
          <button
            type="button"
            className="zine-btn zine-btn--big zine-btn--play"
            onClick={() => onPlay(game)}
          >
            Play now
          </button>
          <button
            type="button"
            className="zine-btn zine-btn--big"
            onClick={() => onOpen(game)}
          >
            Read the page
          </button>
        </div>

        <p className="zine-hero__stats">
          <span>{game.category}</span>
          <span>Loads in one click</span>
          <span>Keyboard ready</span>
        </p>
      </div>

      <div className="zine-hero__art">
        <span className="zine-hero__tape" aria-hidden="true" />
        <ZinePoster
          title={game.title}
          category={game.category}
          id={game.id}
          size="hero"
        />
      </div>
    </section>
  );
}
