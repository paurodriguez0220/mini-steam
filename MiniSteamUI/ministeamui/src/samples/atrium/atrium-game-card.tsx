import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { AtriumGameMotif } from "./atrium-game-motif";

export interface AtriumGameCardProps {
  game: Game;
  /** Editorial catalogue number, already zero-padded. */
  number: string;
  onOpen: (game: Game) => void;
}

/**
 * One entry in the collection: motif panel, hairline rule, title, category.
 * The title carries the only button; it is stretched over the whole card so
 * the tap target is the card while the markup stays valid.
 */
export function AtriumGameCard({ game, number, onOpen }: AtriumGameCardProps): JSX.Element {
  return (
    <article className="at-card">
      <div className="at-card__art">
        <AtriumGameMotif game={game} />
      </div>

      <div className="at-card__body">
        <span className="at-card__num">{number}</span>
        <div className="at-card__main">
          <p className="at-eyebrow">{game.category}</p>
          <h3 className="at-card__title">
            <button
              type="button"
              className="at-plain at-card__link"
              onClick={() => onOpen(game)}
            >
              {game.title}
            </button>
          </h3>
          <p className="at-card__desc">{game.description}</p>
          <span className="at-card__cta" aria-hidden="true">
            View entry
          </span>
        </div>
      </div>
    </article>
  );
}
