import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Game } from "../../store/useAppStore";
import { TopNav } from "./top-nav";
import type { NavSection } from "./top-nav";
import { SidebarRail } from "./sidebar-rail";
import type { CategoryFacet } from "./sidebar-rail";
import { HeroPanel } from "./hero-panel";
import { GameCard } from "./game-card";
import { GameDetail } from "./game-detail";
import { PlayOverlay } from "./play-overlay";
import { CatalogueSkeleton } from "./catalogue-skeleton";
import { SearchField } from "./search-field";
import { Icon } from "./icon";
import { coverHue } from "./art";
import "./marketplace.css";

type SortKey = "title" | "category" | "id";

const SORT_LABEL: Record<SortKey, string> = {
  title: "Title A-Z",
  category: "Category",
  id: "Recently added",
};

/**
 * Offline preview catalogue. Used only when the API cannot be reached, so the
 * storefront can still be reviewed; the URLs match the local Docker ports the
 * API seeder uses, so the games play if the stack is running.
 */
const PREVIEW_GAMES: Game[] = [
  {
    id: 1,
    title: "2048",
    description:
      "Slide the numbered tiles, merge the matching pairs and keep the board alive long enough to reach 2048. One rule, one board, no luck to hide behind.",
    category: "Puzzle",
    iconPath: "",
    url: "http://localhost:5174",
  },
  {
    id: 2,
    title: "Snake",
    description:
      "Steer the snake, eat, grow, and try not to eat yourself. The arcade classic, rebuilt for the browser with keyboard and swipe controls.",
    category: "Arcade",
    iconPath: "",
    url: "http://localhost:5175",
  },
  {
    id: 3,
    title: "Minesweeper",
    description:
      "Clear the field without detonating a mine. Every number is a clue; the only tools you need are logic and a steady hand.",
    category: "Puzzle",
    iconPath: "",
    url: "http://localhost:5176",
  },
];

/**
 * Design sample A - "Marketplace".
 *
 * A complete, self-contained storefront subtree: shell, featured slot,
 * catalogue grid with live search + category filter, an in-sample detail view
 * and an iframe player overlay. All state lives here; no routes are added.
 */
export default function MarketplaceSample(): JSX.Element {
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [section, setSection] = useState<NavSection>("store");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("title");
  const [selected, setSelected] = useState<Game | null>(null);
  const [playing, setPlaying] = useState<Game | null>(null);
  const [previewGames, setPreviewGames] = useState<Game[] | null>(null);
  const [hasSettled, setHasSettled] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const navSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Give the store a beat to resolve before deciding the API is unreachable.
  useEffect(() => {
    const timer = window.setTimeout(() => setHasSettled(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const catalogue = games ?? previewGames;
  const isBusy = loading || isRetrying || (!hasSettled && catalogue === null);
  const hasFailed = !isBusy && hasSettled && catalogue === null;

  const facets = useMemo<CategoryFacet[]>(() => {
    const list = catalogue ?? [];
    const counts = new Map<string, { count: number; hue: number }>();
    for (const game of list) {
      const current = counts.get(game.category);
      counts.set(game.category, {
        count: (current?.count ?? 0) + 1,
        hue: current?.hue ?? coverHue(game),
      });
    }
    return [
      { value: "all", label: "All titles", count: list.length, hue: null },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, entry]) => ({
          value: label,
          label,
          count: entry.count,
          hue: entry.hue,
        })),
    ];
  }, [catalogue]);

  const visible = useMemo<Game[]>(() => {
    const list = catalogue ?? [];
    const needle = query.trim().toLowerCase();
    const filtered = list.filter((game) => {
      const matchesQuery = needle.length === 0 || game.title.toLowerCase().includes(needle);
      const matchesCategory = category === "all" || game.category === category;
      return matchesQuery && matchesCategory;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "category") return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
      return b.id - a.id;
    });
  }, [catalogue, query, category, sort]);

  const isFilterActive = query.trim().length > 0 || category !== "all";
  const featured = (catalogue ?? [])[0] ?? null;

  function scrollMainToTop(): void {
    mainRef.current?.scrollTo({ top: 0 });
  }

  function handleSelect(game: Game): void {
    setSelected(game);
    setSection("store");
    setIsDrawerOpen(false);
    scrollMainToTop();
  }

  function handleBack(): void {
    setSelected(null);
    scrollMainToTop();
  }

  function handleSectionChange(next: NavSection): void {
    setSection(next);
    setSelected(null);
    setIsDrawerOpen(false);
    scrollMainToTop();
  }

  function handleCategoryChange(next: string): void {
    setCategory(next);
    setSelected(null);
    setIsDrawerOpen(false);
    scrollMainToTop();
  }

  function focusSearch(): void {
    const mobile = mobileSearchRef.current;
    // offsetParent is null while the field is display:none at desktop widths.
    if (mobile && mobile.offsetParent !== null) {
      mobile.focus();
      return;
    }
    navSearchRef.current?.focus();
  }

  async function handleRetry(): Promise<void> {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const store = useAppStore.getState();
      await store.fetchToken();
      if (!useAppStore.getState().token) {
        throw new Error("The API did not return a token.");
      }
      await store.fetchGames();
      if (!useAppStore.getState().games) {
        throw new Error("The API returned no games.");
      }
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "Connection failed.");
    } finally {
      setIsRetrying(false);
    }
  }

  function renderCatalogue(): JSX.Element {
    return (
      <>
        {!isFilterActive && featured !== null && (
          <HeroPanel game={featured} onSelect={handleSelect} onPlay={setPlaying} />
        )}

        <div className={`ms-sect-head${isFilterActive ? " ms-sect-head--first" : ""}`}>
          <h2 className="ms-sect-title">
            {category === "all" ? "All titles" : category}
          </h2>
          <div className="ms-sect-meta">
            <span className="ms-mono">
              {visible.length} of {(catalogue ?? []).length} shown
            </span>
            {isFilterActive && (
              <button
                type="button"
                className="ms-btn"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Reset filters
              </button>
            )}
            <label className="ms-mono" htmlFor="ms-sort">
              Sort
            </label>
            <select
              id="ms-sort"
              className="ms-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABEL[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="ms-empty">
            <Icon name="search" size={22} />
            <h3 className="ms-empty__title">No titles match "{query.trim()}"</h3>
            <p className="ms-empty__body">
              Nothing in {category === "all" ? "the catalogue" : category} matches that
              search. Try a shorter term or clear the filters.
            </p>
            <div className="ms-empty__actions">
              <button
                type="button"
                className="ms-btn ms-btn--primary"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div className="ms-grid">
            {visible.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={handleSelect}
                onPlay={setPlaying}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  function renderLibrary(): JSX.Element {
    const owned = catalogue ?? [];
    return (
      <>
        <div className="ms-sect-head ms-sect-head--first">
          <h2 className="ms-sect-title">Library</h2>
          <span className="ms-mono">{owned.length} installed - 0 MB on disk</span>
        </div>
        {owned.length === 0 ? (
          <div className="ms-empty">
            <Icon name="library" size={22} />
            <h3 className="ms-empty__title">Your library is empty</h3>
            <p className="ms-empty__body">
              Everything in this store is free. Open any store page and press play to
              add it here.
            </p>
          </div>
        ) : (
          <div className="ms-grid">
            {owned.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={handleSelect}
                onPlay={setPlaying}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  function renderCommunity(): JSX.Element {
    return (
      <>
        <div className="ms-sect-head ms-sect-head--first">
          <h2 className="ms-sect-title">Community</h2>
          <span className="ms-mono">Read only</span>
        </div>
        <div className="ms-empty">
          <Icon name="alert" size={22} />
          <h3 className="ms-empty__title">Community hub is offline</h3>
          <p className="ms-empty__body">
            Discussions, guides and screenshots are not part of this build. The
            catalogue and the player are.
          </p>
          <div className="ms-empty__actions">
            <button
              type="button"
              className="ms-btn ms-btn--primary"
              onClick={() => handleSectionChange("store")}
            >
              Back to store
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderBody(): JSX.Element {
    if (isBusy) return <CatalogueSkeleton />;

    if (hasFailed) {
      return (
        <div className="ms-empty ms-error">
          <Icon name="alert" size={22} />
          <h3 className="ms-empty__title">Catalogue unavailable</h3>
          <p className="ms-empty__body">
            The storefront could not reach the games API.
            {retryError !== null ? ` ${retryError}` : ""}
          </p>
          <div className="ms-empty__actions">
            <button type="button" className="ms-btn ms-btn--primary" onClick={handleRetry}>
              Retry connection
            </button>
            <button
              type="button"
              className="ms-btn"
              onClick={() => setPreviewGames(PREVIEW_GAMES)}
            >
              Load offline preview
            </button>
          </div>
        </div>
      );
    }

    if (selected !== null) {
      return <GameDetail game={selected} onBack={handleBack} onPlay={setPlaying} />;
    }

    if (section === "library") return renderLibrary();
    if (section === "community") return renderCommunity();
    return renderCatalogue();
  }

  return (
    <div
      className="marketplace-sample"
      data-theme={theme}
      data-drawer={isDrawerOpen ? "open" : "closed"}
    >
      <TopNav
        query={query}
        onQueryChange={setQuery}
        activeSection={section}
        onSectionChange={handleSectionChange}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        searchRef={navSearchRef}
      />

      <div className="ms-searchrow">
        <SearchField
          value={query}
          onChange={setQuery}
          inputRef={mobileSearchRef}
          hint=""
        />
        <button
          type="button"
          className="ms-icon-btn"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open filters"
        >
          <Icon name="filter" size={15} />
        </button>
      </div>

      <div className="ms-body">
        <SidebarRail
          facets={facets}
          activeCategory={category}
          onCategoryChange={handleCategoryChange}
          library={catalogue ?? []}
          onSelectGame={handleSelect}
          onCloseDrawer={() => setIsDrawerOpen(false)}
          status={isBusy ? "loading" : hasFailed ? "offline" : "online"}
        />

        <button
          type="button"
          className="ms-scrim"
          aria-label="Close browse menu"
          tabIndex={isDrawerOpen ? 0 : -1}
          onClick={() => setIsDrawerOpen(false)}
        />

        <main className="ms-main" ref={mainRef}>
          <div className="ms-page">{renderBody()}</div>
        </main>
      </div>

      <footer className="ms-foot">
        <span className="ms-mono">MiniSteam - sample A / marketplace</span>
        <span className="ms-mono">{(catalogue ?? []).length} titles indexed</span>
        <span className="ms-nav__spacer" />
        <span className="ms-mono">
          {previewGames !== null && games === null ? "Offline preview data" : "Live API data"}
        </span>
      </footer>

      <nav className="ms-tabbar" aria-label="Primary">
        <button
          type="button"
          className="ms-tabbar__btn"
          aria-pressed={section === "store" && selected === null}
          onClick={() => handleSectionChange("store")}
        >
          <Icon name="grid" size={16} />
          Store
        </button>
        <button type="button" className="ms-tabbar__btn" onClick={focusSearch}>
          <Icon name="search" size={16} />
          Search
        </button>
        <button
          type="button"
          className="ms-tabbar__btn"
          aria-pressed={isDrawerOpen}
          onClick={() => setIsDrawerOpen(true)}
        >
          <Icon name="filter" size={16} />
          Filters
        </button>
        <button
          type="button"
          className="ms-tabbar__btn"
          aria-pressed={section === "library"}
          onClick={() => handleSectionChange("library")}
        >
          <Icon name="library" size={16} />
          Library
        </button>
      </nav>

      {playing !== null && (
        <PlayOverlay game={playing} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
