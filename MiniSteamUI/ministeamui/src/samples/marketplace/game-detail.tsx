import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { SpecList } from "./spec-list";
import { Icon } from "./icon";
import { catalogueId, deriveMeta } from "./art";

export interface GameDetailProps {
  game: Game;
  /** Return to the catalogue. */
  onBack: () => void;
  onPlay: (game: Game) => void;
}

/** Store page for a single game. Rendered in-sample, not behind a route. */
export function GameDetail({ game, onBack, onPlay }: GameDetailProps): JSX.Element {
  const meta = deriveMeta(game);

  return (
    <div>
      <nav className="ms-crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={onBack}>
          <Icon name="arrow-left" size={11} /> Store
        </button>
        <span>/</span>
        <span>{game.category}</span>
        <span>/</span>
        <span>{game.title}</span>
      </nav>

      <div className="ms-detail">
        <div>
          <div className="ms-detail__stage">
            <GameCover game={game} variant="lg" />
          </div>

          <h2 className="ms-detail__title">{game.title}</h2>

          <div className="ms-detail__tags">
            <span className="ms-tag ms-tag--accent">{game.category}</span>
            <span className="ms-tag">Single player</span>
            <span className="ms-tag">Browser</span>
            <span className="ms-tag">{catalogueId(game.id)}</span>
          </div>

          <div className="ms-panel">
            <div className="ms-panel__head">About this game</div>
            <p className="ms-detail__desc">{game.description}</p>
          </div>

          <div className="ms-panel">
            <div className="ms-panel__head">System requirements</div>
            <SpecList
              rows={[
                { key: "Platform", value: "Any modern browser" },
                { key: "Input", value: meta.controls },
                { key: "Runtime", value: meta.runtime },
                { key: "Source", value: meta.source },
                { key: "Install size", value: "0 MB - streamed" },
              ]}
            />
          </div>
        </div>

        <aside>
          <div className="ms-panel ms-buy">
            <div className="ms-panel__head">Play {game.title}</div>
            <div className="ms-price">
              <span className="ms-price__free">Free</span>
              <span className="ms-price__was">4.99</span>
            </div>
            <button
              type="button"
              className="ms-btn ms-btn--primary ms-btn--lg ms-buy__cta"
              onClick={() => onPlay(game)}
            >
              <Icon name="play" size={11} />
              Play in browser
            </button>
            <button type="button" className="ms-btn ms-buy__cta" onClick={onBack}>
              Back to catalogue
            </button>
          </div>

          <div className="ms-panel">
            <div className="ms-panel__head">Details</div>
            <SpecList
              rows={[
                { key: "Category", value: game.category },
                { key: "Players", value: meta.players },
                { key: "Session", value: meta.mode },
                { key: "Catalogue id", value: catalogueId(game.id) },
              ]}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
