import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { PlayIcon } from "./icons";

export interface HeroBannerProps {
  /** The featured game. */
  game: Game;
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
}

export function HeroBanner({ game, onPlay, onOpen }: HeroBannerProps): JSX.Element {
  return (
    <section className="pr-hero" aria-labelledby="pr-hero-title">
      <div className="pr-hero__copy">
        <span className="pr-eyebrow">Playing today</span>
        <h1 className="pr-hero__title" id="pr-hero-title">
          {game.title}
        </h1>
        <p className="pr-hero__desc">{game.description}</p>
        <div className="pr-meta-row">
          <span className="pr-tag">{game.category}</span>
          <span className="pr-tag">Runs in your browser</span>
          <span className="pr-tag">Nothing to install</span>
        </div>
        <div className="pr-hero__actions">
          <button type="button" className="pr-btn pr-btn--primary pr-btn--big" onClick={() => onPlay(game)}>
            <PlayIcon size={20} />
            Play now
          </button>
          <button type="button" className="pr-btn pr-btn--ghost pr-btn--big" onClick={() => onOpen(game)}>
            More about it
          </button>
        </div>
      </div>

      <div className="pr-hero__art">
        <GameCover title={game.title} seed={game.id} ribbon={game.category} isHero />
      </div>
    </section>
  );
}
