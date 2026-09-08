import { useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Game } from "../../store/useAppStore";
import { PlayroomNav } from "./playroom-nav";
import type { NavKey } from "./playroom-nav";
import { HeroBanner } from "./hero-banner";
import { GameCard } from "./game-card";
import { GameDetail } from "./game-detail";
import { PlayOverlay } from "./play-overlay";
import { LoadingSkeletons } from "./loading-skeletons";
import { NoticePanel } from "./notice-panel";
import { ControllerIcon } from "./icons";
import "./playroom.css";

const ALL_CATEGORIES = "All";

const CATEGORY_DOTS: Record<string, string> = {
  All: "var(--pr-primary)",
  Puzzle: "var(--pr-butter)",
  Arcade: "var(--pr-mint)",
};

function dotColour(category: string): string {
  return CATEGORY_DOTS[category] ?? "var(--pr-sky)";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function scrollTo(element: HTMLElement | null): void {
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  if (element) {
    element.scrollIntoView({ behavior, block: "start" });
    return;
  }
  window.scrollTo({ top: 0, behavior });
}

export default function PlayroomSample(): JSX.Element {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);

  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<NavKey>("store");

  const catalogueRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const game of games ?? []) {
      counts.set(game.category, (counts.get(game.category) ?? 0) + 1);
    }
    return [
      { name: ALL_CATEGORIES, count: games?.length ?? 0 },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
    ];
  }, [games]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (games ?? []).filter((game) => {
      const matchesTitle = needle === "" || game.title.toLowerCase().includes(needle);
      const matchesCategory = category === ALL_CATEGORIES || game.category === category;
      return matchesTitle && matchesCategory;
    });
  }, [games, query, category]);

  const selectedGame = games?.find((game) => game.id === selectedId) ?? null;
  const playingGame = games?.find((game) => game.id === playingId) ?? null;
  const featured = games && games.length > 0 ? games[0] : null;
  const isBrowsing = query.trim() === "" && category === ALL_CATEGORIES;

  const openDetail = (game: Game): void => {
    setSelectedId(game.id);
    setActiveNav("store");
    scrollTo(null);
  };

  const closeDetail = (): void => {
    setSelectedId(null);
    scrollTo(null);
  };

  const handleNavigate = (key: NavKey): void => {
    setActiveNav(key);
    if (key === "store") {
      setSelectedId(null);
      scrollTo(null);
      return;
    }
    if (key === "catalogue") {
      setSelectedId(null);
      // Wait for the catalogue to be back in the DOM before scrolling to it.
      window.requestAnimationFrame(() => scrollTo(catalogueRef.current));
      return;
    }
    scrollTo(aboutRef.current);
  };

  const resetFilters = (): void => {
    setQuery("");
    setCategory(ALL_CATEGORIES);
  };

  function renderBody(): JSX.Element {
    if (loading && !games) {
      return <LoadingSkeletons />;
    }

    if (!games) {
      return (
        <NoticePanel
          tone="error"
          title="The shelf came up empty"
          message="We could not reach the games service. Give it a moment and try again - your save data is safe."
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      );
    }

    if (games.length === 0) {
      return (
        <NoticePanel
          tone="empty"
          title="Nothing on the shelf yet"
          message="No games have been published to this storefront. Check back soon."
        />
      );
    }

    if (selectedGame) {
      return (
        <GameDetail
          game={selectedGame}
          related={games.filter((game) => game.id !== selectedGame.id)}
          onBack={closeDetail}
          onPlay={(game) => setPlayingId(game.id)}
          onOpen={openDetail}
        />
      );
    }

    return (
      <div className="pr-main-stack">
        {isBrowsing && featured ? (
          <HeroBanner game={featured} onPlay={(game) => setPlayingId(game.id)} onOpen={openDetail} />
        ) : null}

        <section className="pr-section" ref={catalogueRef} aria-labelledby="pr-catalogue-title">
          <div className="pr-section__head">
            <div className="pr-section__titles">
              <span className="pr-eyebrow">The shelf</span>
              <h2 className="pr-h2" id="pr-catalogue-title">
                Every game, ready to go
              </h2>
            </div>
            <p className="pr-sub" aria-live="polite">
              {filtered.length} of {games.length} games
              {query.trim() ? ` matching "${query.trim()}"` : ""}
            </p>
          </div>

          <div className="pr-filters" role="group" aria-label="Filter by category">
            {categories.map((entry) => (
              <button
                key={entry.name}
                type="button"
                className="pr-chip"
                aria-pressed={category === entry.name}
                onClick={() => setCategory(entry.name)}
              >
                <span
                  className="pr-chip__dot"
                  style={{ background: dotColour(entry.name) }}
                  aria-hidden="true"
                />
                {entry.name}
                <span className="pr-chip__count">{entry.count}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <NoticePanel
              tone="empty"
              title="No games found"
              message={`Nothing here matches ${query.trim() ? `"${query.trim()}"` : "that filter"}. Try a different word, or bring the whole shelf back.`}
              actionLabel="Show all games"
              onAction={resetFilters}
            />
          ) : (
            <div className="pr-grid">
              {filtered.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  onOpen={openDetail}
                  onPlay={(item) => setPlayingId(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="playroom-sample" data-pr-theme={theme}>
      <span className="pr-confetti" aria-hidden="true" />

      <div className="pr-shell">
        <PlayroomNav
          query={query}
          onQueryChange={setQuery}
          active={activeNav}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        />

        <main className="pr-main pr-wrap">{renderBody()}</main>

        <footer className="pr-footer" ref={aboutRef}>
          <div className="pr-wrap pr-footer__inner">
            <div className="pr-meta-row">
              <span className="pr-eyebrow">
                <ControllerIcon size={16} />
                MiniSteam Playroom
              </span>
              <span className="pr-footer__note">
                Small browser games, no downloads, no accounts.
              </span>
            </div>
            <div className="pr-footer__links">
              <button type="button" className="pr-navlink" onClick={() => handleNavigate("store")}>
                Store
              </button>
              <button type="button" className="pr-navlink" onClick={() => handleNavigate("catalogue")}>
                All games
              </button>
              <button
                type="button"
                className="pr-navlink"
                onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              >
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {playingGame ? <PlayOverlay game={playingGame} onClose={() => setPlayingId(null)} /> : null}
    </div>
  );
}
