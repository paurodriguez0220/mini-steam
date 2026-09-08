import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { Icon } from "./icon";
import { catalogueId, deriveMeta } from "./art";

export interface GameCardProps {
  game: Game;
  /** Open the detail view for this game. */
  onSelect: (game: Game) => void;
  /** Launch the game straight into the iframe overlay. */
  onPlay: (game: Game) => void;
}

/** One catalogue tile: generated cover, title, and metadata revealed on hover. */
export function GameCard({ game, onSelect, onPlay }: GameCardProps): JSX.Element {
  const meta = deriveMeta(game);

  return (
    <article className="ms-card">
      <div className="ms-card__art">
        <GameCover game={game} variant="md" />
        <div className="ms-card__reveal">
          <span className="ms-card__reveal-text">{meta.controls}</span>
          <button
            type="button"
            className="ms-card__play"
            onClick={() => onPlay(game)}
            aria-label={`Play ${game.title}`}
          >
            <Icon name="play" size={9} />
            Play
          </button>
        </div>
      </div>

      <div className="ms-card__body">
        <h3 className="ms-card__title">
          <button
            type="button"
            className="ms-card__titlebtn"
            onClick={() => onSelect(game)}
          >
            {game.title}
          </button>
        </h3>
        <div className="ms-card__foot">
          <span className="ms-tag">{game.category}</span>
          <span className="ms-card__free">Free</span>
        </div>
        <span className="ms-mono">{catalogueId(game.id)}</span>
      </div>
    </article>
  );
}
