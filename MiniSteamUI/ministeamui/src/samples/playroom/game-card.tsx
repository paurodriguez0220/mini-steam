import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { PlayIcon } from "./icons";

export interface GameCardProps {
  game: Game;
  /** Position in the grid - only used to stagger the entrance animation. */
  index?: number;
  onOpen: (game: Game) => void;
  onPlay: (game: Game) => void;
}

export function GameCard({ game, index = 0, onOpen, onPlay }: GameCardProps): JSX.Element {
  return (
    <article className="pr-card" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
      {/* The cover + title area is one big hit target: an overlay button keeps the
          heading a real heading instead of burying it inside a <button>. */}
      <div className="pr-card__media">
        <GameCover title={game.title} seed={game.id} />
        <div className="pr-card__body">
          <h3 className="pr-card__title">{game.title}</h3>
          <p className="pr-card__meta">
            <span>{game.category}</span>
            <span aria-hidden="true">&bull;</span>
            <span>Free to play</span>
          </p>
        </div>
        <button
          type="button"
          className="pr-card__overlay"
          onClick={() => onOpen(game)}
          aria-label={`Open details for ${game.title}`}
        />
      </div>

      <div className="pr-card__foot">
        <button type="button" className="pr-btn pr-btn--primary" onClick={() => onPlay(game)}>
          <PlayIcon size={16} />
          Play
        </button>
        <button type="button" className="pr-btn pr-btn--ghost" onClick={() => onOpen(game)}>
          Details
        </button>
      </div>
    </article>
  );
}
