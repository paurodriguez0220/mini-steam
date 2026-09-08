import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { ZinePoster } from "./zine-poster";

export interface ZineCardProps {
  /** The game printed on this card. */
  game: Game;
  /** Open the in-sample detail spread. */
  onOpen: (game: Game) => void;
  /** Open the full-screen player straight away. */
  onPlay: (game: Game) => void;
}

/** One catalogue entry: typographic poster, title, blurb, play action. */
export function ZineCard({ game, onOpen, onPlay }: ZineCardProps): JSX.Element {
  return (
    <article className="zine-card">
      <ZinePoster
        title={game.title}
        category={game.category}
        id={game.id}
        className="zine-card__poster"
      />

      <div className="zine-card__body">
        <h3 className="zine-card__title">
          {/* The ::after on this button stretches over the whole card. */}
          <button
            type="button"
            className="zine-card__link"
            onClick={() => onOpen(game)}
          >
            {game.title}
          </button>
        </h3>

        <p className="zine-card__desc">{game.description}</p>

        <div className="zine-card__foot">
          <span className="zine-sticker zine-sticker--paper">{game.category}</span>
          <button
            type="button"
            className="zine-btn zine-btn--play zine-card__play"
            onClick={() => onPlay(game)}
          >
            Play
            <span className="zine-visually-hidden"> {game.title}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
