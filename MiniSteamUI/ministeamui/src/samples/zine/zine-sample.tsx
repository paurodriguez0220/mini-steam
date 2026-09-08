import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { useAppStore } from "../../store/useAppStore";
import { ZineCard } from "./zine-card";
import { ZineColophon } from "./zine-colophon";
import { ZineDetail } from "./zine-detail";
import { ALL_CATEGORIES, ZineFilters } from "./zine-filters";
import { ZineHero } from "./zine-hero";
import { ZineMasthead } from "./zine-masthead";
import { ZinePlayer } from "./zine-player";
import { ZineNotice, ZineSkeletonGrid } from "./zine-states";
import "./zine.css";

/** How long to wait before deciding that "no games and not loading" is a failure. */
const ERROR_GRACE_MS = 2500;

/**
 * Design sample C - "Arcade Zine".
 *
 * A complete storefront in one subtree: masthead, cover spread, filterable
 * catalogue, in-sample detail page and a full-screen iframe player. All state
 * is local; the games come from the shared store and are never re-fetched here.
 */
export default function ZineSample(): JSX.Element {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);
  const fetchToken = useAppStore((state) => state.fetchToken);
  const fetchGames = useAppStore((state) => state.fetchGames);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [openGameId, setOpenGameId] = useState<number | null>(null);
  const [playingGameId, setPlayingGameId] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | undefined>();
  const [hasWaited, setHasWaited] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  // Only call the load a failure once the app has had a fair chance to fetch.
  useEffect(() => {
    const timer = window.setTimeout(() => setHasWaited(true), ERROR_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const game of games ?? []) found.add(game.category);
    return [ALL_CATEGORIES, ...Array.from(found).sort()];
  }, [games]);

  const visibleGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (games ?? []).filter((game) => {
      const matchesTitle = needle === "" || game.title.toLowerCase().includes(needle);
      const matchesCategory =
        category === ALL_CATEGORIES || game.category === category;
      return matchesTitle && matchesCategory;
    });
  }, [games, query, category]);

  const openGame = games?.find((game) => game.id === openGameId) ?? null;
  const playingGame = games?.find((game) => game.id === playingGameId) ?? null;
  const featured = games?.[0] ?? null;

  const isEmptyResult = !loading && (games?.length ?? 0) > 0 && visibleGames.length === 0;
  const hasFailed = !loading && hasWaited && games === null;

  // Jump back to the top of the sample when the reader turns to a new page.
  useEffect(() => {
    if (openGameId === null) return;
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [openGameId]);

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    setRetryError(undefined);
    try {
      await fetchToken();
      await fetchGames();
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : "The press jammed again.",
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClearFilters = (): void => {
    setQuery("");
    setCategory(ALL_CATEGORIES);
  };

  return (
    <div className="zine-sample" ref={rootRef}>
      <ZineMasthead
        gameCount={games?.length ?? 0}
        isDetailOpen={openGame !== null}
        onHome={() => setOpenGameId(null)}
      />

      <main className="zine-shell">
        {openGame ? (
          <ZineDetail
            game={openGame}
            onBack={() => setOpenGameId(null)}
            onPlay={(game) => setPlayingGameId(game.id)}
          />
        ) : (
          <>
            {loading || !featured ? (
              <HeroPlaceholder hasFailed={hasFailed} />
            ) : (
              <ZineHero
                game={featured}
                onPlay={(game) => setPlayingGameId(game.id)}
                onOpen={(game) => setOpenGameId(game.id)}
              />
            )}

            <hr className="zine-rule" />

            <div className="zine-section-head">
              <h2 className="zine-display">The index</h2>
              <span className="zine-count">
                {loading
                  ? "Setting type..."
                  : `${visibleGames.length} of ${games?.length ?? 0} listed`}
              </span>
            </div>

            <ZineFilters
              query={query}
              onQueryChange={setQuery}
              categories={categories}
              activeCategory={category}
              onCategoryChange={setCategory}
            />

            {loading ? (
              <ZineSkeletonGrid count={3} />
            ) : hasFailed ? (
              <ZineNotice
                kicker="Print run failed"
                title="Nothing came off the press"
                message={
                  retryError ??
                  "We could not reach the catalogue. The games are fine - the connection is not."
                }
                actionLabel="Run it again"
                onAction={handleRetry}
                isBusy={isRetrying}
              />
            ) : isEmptyResult ? (
              <ZineNotice
                kicker="Empty box"
                title="No such game"
                message={`Nothing here matches "${query.trim() || category}". Try a shorter word, or take the filters off.`}
                actionLabel="Clear the filters"
                onAction={handleClearFilters}
              />
            ) : (games?.length ?? 0) === 0 ? (
              <ZineNotice
                kicker="Blank issue"
                title="The shelf is bare"
                message="No games have been published to this storefront yet. Check back for the next issue."
              />
            ) : (
              <div className="zine-grid">
                {visibleGames.map((game) => (
                  <ZineCard
                    key={game.id}
                    game={game}
                    onOpen={(picked) => setOpenGameId(picked.id)}
                    onPlay={(picked) => setPlayingGameId(picked.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ZineColophon
        categories={categories.filter((item) => item !== ALL_CATEGORIES)}
      />

      {playingGame ? (
        <ZinePlayer game={playingGame} onClose={() => setPlayingGameId(null)} />
      ) : null}
    </div>
  );
}

interface HeroPlaceholderProps {
  hasFailed: boolean;
}

/** Cover spread stand-in while the catalogue loads (or fails to). */
function HeroPlaceholder({ hasFailed }: HeroPlaceholderProps): JSX.Element {
  return (
    <section className="zine-hero" aria-label="Cover story">
      <div className="zine-hero__copy">
        <div className="zine-hero__eyebrow">
          <span className="zine-sticker">Cover story</span>
          <span className="zine-kicker">
            {hasFailed ? "Press jammed" : "Inking the plate"}
          </span>
        </div>
        <h2 className="zine-display zine-hero__title">
          <span>Mini</span>
          <em>Steam</em>
        </h2>
        <p className="zine-hero__desc">
          {hasFailed
            ? "The catalogue did not arrive. Everything below is waiting on a reprint."
            : "Three small games, printed one at a time. Hold tight."}
        </p>
      </div>
      <div className="zine-hero__art">
        <div className="zine-skeleton">
          <div className="zine-skeleton__art" />
        </div>
      </div>
    </section>
  );
}
