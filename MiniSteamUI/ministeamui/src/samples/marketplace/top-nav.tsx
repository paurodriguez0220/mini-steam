import type { JSX, RefObject } from "react";
import { Icon } from "./icon";
import { SearchField } from "./search-field";

export type NavSection = "store" | "library" | "community";

export interface TopNavProps {
  query: string;
  onQueryChange: (value: string) => void;
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  onOpenDrawer: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

const SECTIONS: NavSection[] = ["store", "library", "community"];

/** Fixed storefront chrome: brand, sections, catalogue search, account. */
export function TopNav({
  query,
  onQueryChange,
  activeSection,
  onSectionChange,
  onOpenDrawer,
  theme,
  onToggleTheme,
  searchRef,
}: TopNavProps): JSX.Element {
  return (
    <header className="ms-nav">
      <button
        type="button"
        className="ms-icon-btn ms-burger"
        onClick={onOpenDrawer}
        aria-label="Open browse menu"
      >
        <Icon name="menu" size={15} />
      </button>

      <button type="button" className="ms-brand" onClick={() => onSectionChange("store")}>
        <span className="ms-brand__mark" />
        <span className="ms-brand__word">
          Mini<span>Steam</span>
        </span>
      </button>

      <nav className="ms-nav__links" aria-label="Storefront sections">
        {SECTIONS.map((section) => (
          <button
            key={section}
            type="button"
            className="ms-nav__link"
            aria-current={section === activeSection ? "page" : undefined}
            onClick={() => onSectionChange(section)}
          >
            {section}
          </button>
        ))}
      </nav>

      <span className="ms-nav__spacer" />

      <SearchField value={query} onChange={onQueryChange} inputRef={searchRef} />

      <button
        type="button"
        className="ms-icon-btn"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
      </button>

      <div className="ms-account">
        <span className="ms-account__avatar">PR</span>
        <span className="ms-account__meta">
          <span className="ms-account__name">guest_01</span>
          <span className="ms-account__wallet">0.00 credits</span>
        </span>
      </div>
    </header>
  );
}
