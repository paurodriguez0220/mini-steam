import { useMemo } from "react";
import type { JSX } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { Game } from "../store/useAppStore";
import { HeroBanner } from "../components/HeroBanner";
import { GameCard } from "../components/GameCard";
import { NoticePanel } from "../components/NoticePanel";
import { LoadingSkeletons } from "../components/LoadingSkeletons";

const ALL_CATEGORIES = "All";

const CATEGORY_DOTS: Record<string, string> = {
  All: "var(--color-primary)",
  Puzzle: "var(--color-butter)",
  Arcade: "var(--color-mint)",
};

function dotColour(category: string): string {
  return CATEGORY_DOTS[category] ?? "var(--color-sky)";
}

/**
 * The shelf: a featured hero plus the filtered catalogue.
 *
 * Search and category live in the URL (`?q=`, `?category=`) so a filtered
 * shelf is shareable and Back steps through filter changes. The search box
 * itself is in the shell's nav, which writes the same `q` parameter.
 */
export default function StorePage(): JSX.Element {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const category = params.get("category") ?? ALL_CATEGORIES;

  const setCategory = (name: string): void => {
    const next = new URLSearchParams(params);
    if (name === ALL_CATEGORIES) {
      next.delete("category");
    } else {
      next.set("category", name);
    }
    setParams(next, { replace: true });
  };

  const resetFilters = (): void => setParams(new URLSearchParams(), { replace: true });

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

  const openDetail = (game: Game): void => {
    void navigate(`/games/${game.id}`);
  };
  const playGame = (game: Game): void => {
    void navigate(`/games/${game.id}/play`);
  };

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

  const featured = games[0];
  const isBrowsing = query.trim() === "" && category === ALL_CATEGORIES;

  return (
    <div className="flex flex-col gap-10">
      {isBrowsing ? <HeroBanner game={featured} onPlay={playGame} onOpen={openDetail} /> : null}

      <section id="catalogue" className="flex flex-col gap-5" aria-labelledby="catalogue-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xs font-extrabold tracking-widest text-primary uppercase">
              The shelf
            </span>
            <h2 className="text-3xl text-ink" id="catalogue-title">
              Every game, ready to go
            </h2>
          </div>
          <p className="font-text text-sm text-ink-soft" aria-live="polite">
            {filtered.length} of {games.length} games
            {query.trim() ? ` matching "${query.trim()}"` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((entry) => (
            <button
              key={entry.name}
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-line bg-surface px-4 font-display text-sm font-extrabold text-ink shadow-soft-1 transition ease-spring hover:-translate-y-0.5 aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-bg"
              aria-pressed={category === entry.name}
              onClick={() => setCategory(entry.name)}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: dotColour(entry.name) }}
                aria-hidden="true"
              />
              {entry.name}
              <span className="font-text text-xs text-ink-soft">{entry.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <NoticePanel
            tone="empty"
            title="No games found"
            message={`Nothing here matches ${
              query.trim() ? `"${query.trim()}"` : "that filter"
            }. Try a different word, or bring the whole shelf back.`}
            actionLabel="Show all games"
            onAction={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onOpen={openDetail}
                onPlay={playGame}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
