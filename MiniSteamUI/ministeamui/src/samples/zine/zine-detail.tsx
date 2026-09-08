import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { issueNumber, posterLines, urlHost } from "./zine-art";
import { ZinePoster } from "./zine-poster";

export interface ZineDetailProps {
  /** The game being read. */
  game: Game;
  /** Return to the catalogue. */
  onBack: () => void;
  /** Open the full-screen player. */
  onPlay: (game: Game) => void;
}

/** The centre-spread page for a single game. In-sample view, not a route. */
export function ZineDetail({ game, onBack, onPlay }: ZineDetailProps): JSX.Element {
  const lines = posterLines(game.title);

  return (
    <section className="zine-detail" aria-labelledby="zine-detail-title">
      <button
        type="button"
        className="zine-btn zine-btn--ghost zine-detail__back"
        onClick={onBack}
      >
        &larr; Back to the index
      </button>

      <div className="zine-detail__grid">
        <div className="zine-detail__art">
          <ZinePoster
            title={game.title}
            category={game.category}
            id={game.id}
            size="card"
          />
        </div>

        <div>
          <div className="zine-hero__eyebrow">
            <span className="zine-sticker zine-sticker--blue">{game.category}</span>
            <span className="zine-kicker">Page {issueNumber(game.id)}</span>
          </div>

          <h2 className="zine-display zine-detail__title" id="zine-detail-title">
            {lines.map((line, index) => (
              <span key={`${line}-${index}`} style={{ display: "block" }}>
                {line}
              </span>
            ))}
          </h2>

          <p className="zine-detail__body">{game.description}</p>

          <ul className="zine-detail__meta">
            <li>
              <b>Filed under</b>
              <span>{game.category}</span>
            </li>
            <li>
              <b>Catalogue no.</b>
              <span>MS-{issueNumber(game.id)}</span>
            </li>
            <li>
              <b>Served from</b>
              <span>{urlHost(game.url)}</span>
            </li>
            <li>
              <b>Price</b>
              <span>Free</span>
            </li>
          </ul>

          <div className="zine-detail__actions">
            <button
              type="button"
              className="zine-btn zine-btn--big zine-btn--play"
              onClick={() => onPlay(game)}
            >
              Play {game.title}
            </button>
            <button type="button" className="zine-btn zine-btn--big" onClick={onBack}>
              More games
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
