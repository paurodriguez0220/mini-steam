import { useState } from "react";
import type { JSX } from "react";
import { SearchIcon, CloseIcon, MenuIcon, SunIcon, MoonIcon } from "./icons";

export type NavKey = "store" | "catalogue" | "about";

export interface NavItem {
  key: NavKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "store", label: "Store" },
  { key: "catalogue", label: "All games" },
  { key: "about", label: "About" },
];

export interface PlayroomNavProps {
  /** Current search text (controlled by the sample). */
  query: string;
  onQueryChange: (value: string) => void;
  /** Which top-level destination is highlighted. */
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function PlayroomNav({
  query,
  onQueryChange,
  active,
  onNavigate,
  theme,
  onToggleTheme,
}: PlayroomNavProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (key: NavKey): void => {
    setIsMenuOpen(false);
    onNavigate(key);
  };

  return (
    <header className="pr-nav">
      <div className="pr-wrap">
        <div className="pr-nav__bar">
          <button type="button" className="pr-brand" onClick={() => handleNavigate("store")}>
            <span className="pr-brand__mark" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="8" height="8" rx="2.6" fill="#fff" />
                <rect x="13" y="4" width="8" height="8" rx="2.6" fill="#fff" opacity="0.55" />
                <rect x="3" y="14" width="8" height="6" rx="2.6" fill="#fff" opacity="0.55" />
                <circle cx="17" cy="17" r="3.6" fill="#fff" />
              </svg>
            </span>
            <span className="pr-brand__word">
              <b>MiniSteam</b>
              <span>Playroom</span>
            </span>
          </button>

          <nav className="pr-nav__links" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="pr-navlink"
                aria-current={active === item.key ? "page" : undefined}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pr-search">
            <span className="pr-search__icon">
              <SearchIcon />
            </span>
            <label className="pr-sr" htmlFor="pr-search-desktop">
              Search games by title
            </label>
            <input
              id="pr-search-desktop"
              className="pr-search__input"
              type="search"
              placeholder="Search games..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="pr-search__clear"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
              >
                <CloseIcon size={15} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="pr-iconbtn"
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            type="button"
            className="pr-iconbtn pr-nav__burger"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="pr-nav-panel"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon />}
          </button>
        </div>

        {isMenuOpen ? (
          <nav className="pr-nav__panel" id="pr-nav-panel" aria-label="Primary, mobile">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="pr-navlink"
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
