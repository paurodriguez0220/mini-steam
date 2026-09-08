import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { factsFor } from "./atrium-data";
import { AtriumFactList } from "./atrium-fact-list";
import { AtriumGameMotif } from "./atrium-game-motif";
import { revealStyle } from "./atrium-reveal";

export interface AtriumDetailProps {
  game: Game;
  /** The rest of the catalogue, offered underneath. */
  related: readonly Game[];
  onPlay: (game: Game) => void;
  onOpen: (game: Game) => void;
  onBack: () => void;
}

/** The single-entry view: large motif, description, facts, and the play action. */
export function AtriumDetail({ game, related, onPlay, onOpen, onBack }: AtriumDetailProps): JSX.Element {
  const facts = factsFor(game);

  return (
    <article className="at-detail" aria-labelledby="at-detail-title">
      <div className="at-shell">
        <div className="at-detail__nav at-reveal" style={revealStyle(0)}>
          <button type="button" className="at-btn at-btn--quiet" onClick={onBack}>
            &larr; The collection
          </button>
        </div>

        <div className="at-detail__grid">
          <div className="at-reveal" style={revealStyle(1)}>
            <AtriumGameMotif game={game} variant="hero" />
          </div>

          <div>
            <p className="at-eyebrow at-eyebrow--accent at-reveal" style={revealStyle(2)}>
              {game.category}
            </p>
            <h2 className="at-detail__title at-reveal" id="at-detail-title" style={revealStyle(3)}>
              {game.title}
            </h2>
            <p className="at-detail__body at-reveal" style={revealStyle(4)}>
              {game.description}
            </p>

            <div className="at-detail__actions at-reveal" style={revealStyle(5)}>
              <button type="button" className="at-btn at-btn--solid" onClick={() => onPlay(game)}>
                Play {game.title}
              </button>
              <span className="at-eyebrow">No install &middot; No account</span>
            </div>

            <div className="at-reveal" style={revealStyle(6)}>
              <AtriumFactList facts={facts} />
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="at-detail__more at-reveal" style={revealStyle(7)}>
            <p className="at-eyebrow">Also in the collection</p>
            <ul className="at-more">
              {related.map((other) => (
                <li key={other.id}>
                  <button type="button" className="at-more__btn" onClick={() => onOpen(other)}>
                    <span className="at-more__glyph" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                        <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" />
                      </svg>
                    </span>
                    {other.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
