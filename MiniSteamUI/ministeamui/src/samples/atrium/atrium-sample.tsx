import { useEffect, useMemo, useState, type JSX } from "react";
import { useAppStore, type Game } from "../../store/useAppStore";
import { catalogueNumber, categoriesFrom, filterGames } from "./atrium-data";
import { AtriumDetail } from "./atrium-detail";
import { AtriumFeatured } from "./atrium-featured";
import { AtriumFilterBar } from "./atrium-filter-bar";
import { AtriumFooter } from "./atrium-footer";
import { AtriumGameCard } from "./atrium-game-card";
import { AtriumHeader } from "./atrium-header";
import { AtriumPlayer } from "./atrium-player";
import { revealStyle } from "./atrium-reveal";
import { AtriumCardSkeleton, AtriumHeroSkeleton } from "./atrium-skeletons";
import { AtriumState } from "./atrium-state";
import type { AtriumTheme } from "./atrium-theme-toggle";
import "./atrium.css";

const SETTLE_MS = 1500;
const EMPTY_GAMES: readonly Game[] = [];

/**
 * Design direction D - "Atrium": a quiet-luxury, editorial storefront for the
 * MiniSteam catalogue. Self-contained: all state lives here, all styling is
 * scoped to `.atrium-sample`.
 */
export default function AtriumSample(): JSX.Element {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);
  const fetchGames = useAppStore((state) => state.fetchGames);

  const [theme, setTheme] = useState<AtriumTheme>("auto");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [hasSettled, setHasSettled] = useState(false);

  // The store exposes no error flag, so treat "nothing yet, after a beat, with
  // no request in flight" as an unavailable collection rather than leaving a
  // skeleton spinning forever.
  useEffect(() => {
    if (games) return;
    const timer = window.setTimeout(() => setHasSettled(true), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [games]);

  const catalogue = games ?? EMPTY_GAMES;
  const isLoading = loading || (games === null && !hasSettled);
  const hasError = !loading && games === null && hasSettled;

  const categories = useMemo(() => categoriesFrom(catalogue), [catalogue]);
  const results = useMemo(
    () => filterGames(catalogue, query, category),
    [catalogue, query, category],
  );

  const featured = catalogue.length > 0 ? catalogue[0] : null;
  const selected = catalogue.find((game) => game.id === selectedId) ?? null;
  const playing = catalogue.find((game) => game.id === playingId) ?? null;

  const openDetail = (game: Game) => {
    setSelectedId(game.id);
    scrollToTop();
  };

  const backToCatalogue = () => {
    setSelectedId(null);
    scrollToTop();
  };

  const resetIndex = () => {
    setQuery("");
    setCategory(null);
  };

  const handleRetry = () => {
    setHasSettled(false);
    fetchGames().catch(() => setHasSettled(true));
  };

  const headerNote = selected
    ? "Entry"
    : catalogue.length > 0
      ? `Vol. 01 \u00b7 ${catalogue.length} titles`
      : "Vol. 01";

  function renderCatalogueBody(): JSX.Element {
    if (isLoading) {
      return (
        <div className="at-grid" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div className="at-grid__item" key={index}>
              <AtriumCardSkeleton index={index} />
            </div>
          ))}
        </div>
      );
    }

    if (hasError) {
      return (
        <AtriumState
          kicker="Out of print"
          title="The collection is unavailable."
          description="We could not reach the catalogue service. Nothing is lost - it is only a moment away."
        >
          <button type="button" className="at-btn at-btn--solid" onClick={handleRetry}>
            Try again
          </button>
        </AtriumState>
      );
    }

    if (catalogue.length === 0) {
      return (
        <AtriumState
          kicker="In preparation"
          title="No titles are published yet."
          description="The first volume is being set. Do come back shortly."
        />
      );
    }

    if (results.length === 0) {
      return (
        <AtriumState
          kicker="No match"
          title={
            query.trim().length > 0
              ? `Nothing here is called \u201c${query.trim()}\u201d.`
              : "Nothing in this category."
          }
          description="Try a shorter title, or bring the whole collection back into view."
        >
          <button type="button" className="at-btn at-btn--ghost" onClick={resetIndex}>
            Reset the index
          </button>
        </AtriumState>
      );
    }

    return (
      <ul className="at-grid">
        {results.map((game, index) => (
          <li className="at-grid__item at-reveal" key={game.id} style={revealStyle(index + 1)}>
            <AtriumGameCard game={game} number={catalogueNumber(index)} onOpen={openDetail} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="atrium-sample" data-at-theme={theme}>
      <AtriumHeader
        note={headerNote}
        theme={theme}
        onThemeChange={setTheme}
        onHome={backToCatalogue}
      />

      <main key={selected ? `detail-${selected.id}` : "browse"}>
        {selected ? (
          <AtriumDetail
            game={selected}
            related={catalogue.filter((game) => game.id !== selected.id)}
            onPlay={(game) => setPlayingId(game.id)}
            onOpen={openDetail}
            onBack={backToCatalogue}
          />
        ) : (
          <>
            {isLoading ? <AtriumHeroSkeleton label="Loading the featured title" /> : null}

            {!isLoading && featured ? (
              <AtriumFeatured
                game={featured}
                kicker={"Featured \u00b7 Volume One"}
                onPlay={(game) => setPlayingId(game.id)}
                onOpen={openDetail}
              />
            ) : null}

            <section className="at-section" aria-labelledby="at-collection-title">
              <div className="at-shell">
                <div className="at-section__head at-reveal" style={revealStyle(0)}>
                  <div>
                    <p className="at-eyebrow">The collection</p>
                    <h2 className="at-section__title" id="at-collection-title">
                      Everything, quietly
                    </h2>
                  </div>
                  <p className="at-section__count" aria-live="polite">
                    {isLoading
                      ? "Setting the page"
                      : hasError
                        ? "Unavailable"
                        : `${results.length} of ${catalogue.length} shown`}
                  </p>
                </div>

                {hasError || (!isLoading && catalogue.length === 0) ? null : (
                  <AtriumFilterBar
                    query={query}
                    onQueryChange={setQuery}
                    categories={categories}
                    activeCategory={category}
                    onCategoryChange={setCategory}
                  />
                )}

                {renderCatalogueBody()}
              </div>
            </section>
          </>
        )}
      </main>

      <AtriumFooter titleCount={catalogue.length} categories={categories} />

      {playing ? <AtriumPlayer game={playing} onClose={() => setPlayingId(null)} /> : null}
    </div>
  );
}

function scrollToTop(): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}
