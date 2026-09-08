import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { GameCard } from "./game-card";
import { BackIcon, PlayIcon } from "./icons";

export interface GameDetailProps {
  game: Game;
  /** Everything else in the catalogue, shown as a "more to play" shelf. */
  related: Game[];
  onBack: () => void;
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
}

export function GameDetail({ game, related, onBack, onPlay, onOpen }: GameDetailProps): JSX.Element {
  return (
    <div className="pr-detail">
      <button type="button" className="pr-btn pr-btn--ghost pr-detail__back" onClick={onBack}>
        <BackIcon />
        Back to the store
      </button>

      <section className="pr-detail__panel" aria-labelledby="pr-detail-title">
        <div className="pr-detail__art">
          <GameCover title={game.title} seed={game.id} ribbon={game.category} isHero />
        </div>

        <div className="pr-detail__copy">
          <span className="pr-eyebrow">{game.category}</span>
          <h2 className="pr-detail__title" id="pr-detail-title">
            {game.title}
          </h2>
          <p className="pr-detail__desc">{game.description}</p>

          <dl className="pr-facts">
            <div className="pr-fact">
              <dt>Category</dt>
              <dd>{game.category}</dd>
            </div>
            <div className="pr-fact">
              <dt>Players</dt>
              <dd>1</dd>
            </div>
            <div className="pr-fact">
              <dt>Controls</dt>
              <dd>Keys / touch</dd>
            </div>
            <div className="pr-fact">
              <dt>Price</dt>
              <dd>Free</dd>
            </div>
          </dl>

          <button type="button" className="pr-btn pr-btn--primary pr-btn--big" onClick={() => onPlay(game)}>
            <PlayIcon size={20} />
            Play {game.title}
          </button>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="pr-section" aria-labelledby="pr-related-title">
          <div className="pr-section__head">
            <div className="pr-section__titles">
              <h2 className="pr-h2" id="pr-related-title">
                More to play
              </h2>
            </div>
          </div>
          <div className="pr-grid">
            {related.map((item, index) => (
              <GameCard key={item.id} game={item} index={index} onOpen={onOpen} onPlay={onPlay} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
