import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { SpecList } from "./spec-list";
import { Icon } from "./icon";
import { catalogueId, deriveMeta } from "./art";

export interface HeroPanelProps {
  game: Game;
  onSelect: (game: Game) => void;
  onPlay: (game: Game) => void;
}

/** Featured slot: full-bleed generated art beside a dense spec panel. */
export function HeroPanel({ game, onSelect, onPlay }: HeroPanelProps): JSX.Element {
  const meta = deriveMeta(game);

  return (
    <section className="ms-hero" aria-label={`Featured: ${game.title}`}>
      <div className="ms-hero__art">
        <GameCover game={game} variant="lg" />
        <div className="ms-hero__badge">
          <span className="ms-tag ms-tag--accent">
            <span className="ms-dot" />
            Featured
          </span>
          <span className="ms-tag">{catalogueId(game.id)}</span>
        </div>
      </div>

      <div className="ms-hero__panel">
        <div className="ms-price">
          <span className="ms-price__free">Free to play</span>
          <span className="ms-price__was">4.99</span>
        </div>

        <h2 className="ms-hero__title">{game.title}</h2>
        <p className="ms-hero__desc">{game.description}</p>

        <SpecList
          rows={[
            { key: "Category", value: game.category },
            { key: "Controls", value: meta.controls },
            { key: "Players", value: meta.players },
            { key: "Session", value: meta.mode },
            { key: "Runtime", value: meta.runtime },
          ]}
        />

        <div className="ms-hero__actions">
          <button
            type="button"
            className="ms-btn ms-btn--primary ms-btn--lg"
            onClick={() => onPlay(game)}
          >
            <Icon name="play" size={11} />
            Play now
          </button>
          <button
            type="button"
            className="ms-btn ms-btn--lg ms-btn--ghost"
            onClick={() => onSelect(game)}
          >
            Store page
          </button>
        </div>
      </div>
    </section>
  );
}
