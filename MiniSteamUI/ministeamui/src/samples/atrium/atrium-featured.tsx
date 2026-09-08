import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { factsFor } from "./atrium-data";
import { AtriumFactList } from "./atrium-fact-list";
import { AtriumGameMotif } from "./atrium-game-motif";
import { revealStyle } from "./atrium-reveal";

export interface AtriumFeaturedProps {
  game: Game;
  /** Small kicker above the title, e.g. "Featured - Volume One". */
  kicker: string;
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
}

/** Full-bleed cinematic treatment for the one game we are putting forward. */
export function AtriumFeatured({
  game,
  kicker,
  onPlay,
  onOpen,
}: AtriumFeaturedProps): JSX.Element {
  const facts = factsFor(game);

  return (
    <section className="at-hero" aria-labelledby="at-featured-title">
      <div className="at-shell at-hero__grid">
        <div className="at-hero__text">
          <p className="at-eyebrow at-reveal" style={revealStyle(0)}>
            {kicker}
          </p>

          <h1 className="at-hero__title at-reveal" id="at-featured-title" style={revealStyle(1)}>
            {game.title}
            <em>.</em>
          </h1>

          <p className="at-hero__lead at-reveal" style={revealStyle(2)}>
            {game.description}
          </p>

          <div className="at-hero__meta at-reveal" style={revealStyle(3)}>
            <button type="button" className="at-btn at-btn--solid" onClick={() => onPlay(game)}>
              Play now
            </button>
            <button type="button" className="at-btn at-btn--quiet" onClick={() => onOpen(game)}>
              Read the entry
            </button>
          </div>

          <div className="at-reveal" style={revealStyle(4)}>
            <AtriumFactList facts={facts} />
          </div>
        </div>

        <div className="at-hero__art at-reveal" style={revealStyle(2)}>
          <AtriumGameMotif game={game} variant="hero" />
        </div>
      </div>
    </section>
  );
}
