import { useEffect } from "react";
import type { JSX } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import { useTheme } from "./hooks/useTheme";
import { useGameScores } from "./hooks/useGameScores";
import { Nav } from "./components/Nav";
import type { NavKey } from "./components/Nav";
import { ControllerIcon } from "./components/icons";

/**
 * The storefront shell: nav, page background and footer around the routes.
 *
 * It owns the three app-wide concerns - bootstrapping the API, the theme, and
 * the listener for scores posted up by an embedded game - and nothing else.
 * The search query lives in the URL rather than in state here, because the nav
 * is in the shell while the results are on the store route, and a filtered
 * shelf should be shareable.
 */
function App(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { initApi } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    initApi();
  }, [initApi]);

  useGameScores();

  const query = params.get("q") ?? "";

  const setQuery = (value: string): void => {
    const next = new URLSearchParams(params);
    if (value.trim() === "") {
      next.delete("q");
    } else {
      next.set("q", value);
    }
    setParams(next, { replace: true });
  };

  const active: NavKey = location.hash === "#about" ? "about" : "store";

  const handleNavigate = (key: NavKey): void => {
    if (key === "about") {
      navigate("/#about");
      return;
    }
    navigate(key === "catalogue" ? "/#catalogue" : "/");
  };

  return (
    <div className="page-bg relative isolate min-h-dvh w-full overflow-x-clip">
      <span className="confetti" aria-hidden="true" />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Nav
          query={query}
          onQueryChange={setQuery}
          active={active}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-8">
          <Outlet context={{ theme }} />
        </main>

        <footer id="about" className="mt-10 border-t-2 border-line bg-surface/60">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 font-display text-xs font-extrabold tracking-widest text-primary uppercase">
                <ControllerIcon size={16} />
                MiniSteam Playroom
              </span>
              <span className="font-text text-sm text-ink-soft">
                Small browser games, no downloads, no accounts.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="font-display text-sm text-ink-soft transition hover:text-primary"
                onClick={() => handleNavigate("store")}
              >
                Store
              </button>
              <button
                type="button"
                className="font-display text-sm text-ink-soft transition hover:text-primary"
                onClick={() => handleNavigate("catalogue")}
              >
                All games
              </button>
              <button
                type="button"
                className="font-display text-sm text-ink-soft transition hover:text-primary"
                onClick={toggleTheme}
              >
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
