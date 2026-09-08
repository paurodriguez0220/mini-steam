import { useState } from "react";
import type { JSX } from "react";
import { SearchIcon, CloseIcon, MenuIcon, SunIcon, MoonIcon } from "./icons";

export type NavKey = "store" | "catalogue" | "about";

interface NavItem {
  key: NavKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "store", label: "Store" },
  { key: "catalogue", label: "All games" },
  { key: "about", label: "About" },
];

export interface NavProps {
  /** Current search text (controlled by the page). */
  query: string;
  onQueryChange: (value: string) => void;
  /** Which top-level destination is highlighted. */
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

/** Dark mode reaches for the lighter primary here: `primary-deep` on `primary-soft`
 *  is two dark reds stacked, so the sample swapped the token rather than the value. */
const NAV_LINK =
  "min-h-11 cursor-pointer rounded-full border-0 bg-transparent px-3.5 py-[11px] " +
  "font-text text-[15px] font-extrabold text-ink-soft " +
  "transition-[background-color,color,translate] " +
  "duration-[180ms,180ms,320ms] " +
  "ease-[var(--ease-soft),var(--ease-soft),var(--ease-spring)] " +
  "hover:-translate-y-[2px] hover:bg-surface hover:text-ink " +
  "aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-deep " +
  "dark:aria-[current=page]:text-primary";

const ICON_BUTTON =
  "grid h-[46px] w-[46px] min-h-11 min-w-11 flex-none cursor-pointer place-items-center " +
  "rounded-sm border-2 border-line bg-surface text-ink shadow-soft-1 " +
  "transition-[translate,scale,box-shadow,background-color] " +
  "duration-[320ms,320ms,220ms,180ms] " +
  "ease-[var(--ease-spring),var(--ease-spring),var(--ease-soft),var(--ease-soft)] " +
  "hover:-translate-y-[3px] hover:shadow-soft-2 " +
  "active:translate-y-0 active:scale-90 active:shadow-soft-press";

/** Full-width row of its own until 900px, then it shares the bar with the links. */
const SEARCH =
  "relative order-5 mt-1 flex min-w-0 max-w-none flex-[1_0_100%] items-center " +
  "min-[901px]:order-none min-[901px]:mt-0 min-[901px]:max-w-[260px] min-[901px]:flex-[1_1_auto] " +
  "lg:max-w-[340px]";

const SEARCH_INPUT =
  "w-full min-h-[50px] rounded-full border-2 border-line bg-surface py-2.5 pr-[54px] pl-[42px] " +
  "text-[15px] font-bold text-ink shadow-soft-1 " +
  "placeholder:font-semibold placeholder:text-ink-soft " +
  "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none " +
  "transition-[border-color,box-shadow,translate] " +
  "duration-[180ms,220ms,320ms] " +
  "ease-[var(--ease-soft),var(--ease-soft),var(--ease-spring)] " +
  "focus:-translate-y-[1px] focus:border-primary focus:shadow-soft-2 focus:outline-none " +
  "sm:min-h-[46px] sm:pr-[46px]";

const SEARCH_CLEAR =
  "absolute right-[3px] grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 " +
  "bg-primary-soft text-primary-deep dark:text-primary " +
  "transition-transform duration-[320ms] ease-spring hover:scale-[1.14] hover:rotate-90 " +
  "sm:right-[7px] sm:h-[34px] sm:w-[34px]";

export function Nav({
  query,
  onQueryChange,
  active,
  onNavigate,
  theme,
  onToggleTheme,
}: NavProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (key: NavKey): void => {
    setIsMenuOpen(false);
    onNavigate(key);
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-[color-mix(in_srgb,var(--color-bg)_84%,transparent)] py-2.5 backdrop-blur-[14px] backdrop-saturate-[1.3]">
      <div className="mx-auto w-full max-w-[1200px] px-[14px] sm:px-5 lg:px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            className="group mr-auto inline-flex min-h-11 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-1 text-inherit [font:inherit]"
            onClick={() => handleNavigate("store")}
          >
            <span
              className="relative grid h-11 w-11 flex-none place-items-center rounded-[15px] bg-primary shadow-soft-1 transition-transform duration-[320ms] ease-spring group-hover:-rotate-8 group-hover:scale-[1.06] group-active:-rotate-8 group-active:scale-90"
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="8" height="8" rx="2.6" fill="#fff" />
                <rect x="13" y="4" width="8" height="8" rx="2.6" fill="#fff" opacity="0.55" />
                <rect x="3" y="14" width="8" height="6" rx="2.6" fill="#fff" opacity="0.55" />
                <circle cx="17" cy="17" r="3.6" fill="#fff" />
              </svg>
            </span>
            <span className="flex flex-col items-start leading-none">
              <b className="font-display text-[19px] font-extrabold tracking-[-0.03em]">MiniSteam</b>
              <span className="text-[10px] font-black tracking-[0.18em] uppercase text-ink-soft">
                Playroom
              </span>
            </span>
          </button>

          {/* Below 1024px only the first two links fit; the rest live in the burger menu. */}
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            {NAV_ITEMS.map((item, index) => (
              <button
                key={item.key}
                type="button"
                className={index >= 2 ? `${NAV_LINK} max-lg:hidden` : NAV_LINK}
                aria-current={active === item.key ? "page" : undefined}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className={SEARCH}>
            <span className="pointer-events-none absolute left-[15px] grid place-items-center text-ink-soft">
              <SearchIcon />
            </span>
            <label className="sr-only" htmlFor="nav-search">
              Search games by title
            </label>
            <input
              id="nav-search"
              className={SEARCH_INPUT}
              type="search"
              placeholder="Search games..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className={SEARCH_CLEAR}
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
              >
                <CloseIcon size={15} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={ICON_BUTTON}
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            type="button"
            className={`${ICON_BUTTON} sm:hidden`}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="nav-panel"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon />}
          </button>
        </div>

        {isMenuOpen ? (
          <nav
            className="mt-2.5 grid gap-1.5 rounded-lg border-2 border-line bg-surface p-2.5 shadow-soft-2 animate-drop sm:hidden"
            id="nav-panel"
            aria-label="Primary, mobile"
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${NAV_LINK} w-full text-left`}
                aria-current={active === item.key ? "page" : undefined}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
