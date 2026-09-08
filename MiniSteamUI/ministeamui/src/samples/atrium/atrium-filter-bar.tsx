import type { JSX } from "react";

export interface AtriumFilterBarProps {
  /** Live search text. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Every category present in the catalogue. */
  categories: readonly string[];
  /** `null` means "All". */
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

/** Search field plus category chips. Both filter the grid immediately. */
export function AtriumFilterBar({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
}: AtriumFilterBarProps): JSX.Element {
  return (
    <div className="at-index">
      <div className="at-search">
        <svg
          className="at-search__icon"
          width="17"
          height="17"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="7.6" cy="7.6" r="5.4" />
          <path d="M11.6 11.6 16 16" strokeLinecap="round" />
        </svg>

        <label className="at-sr" htmlFor="at-search-input">
          Search the collection by title
        </label>
        <input
          id="at-search-input"
          className="at-search__input"
          type="search"
          value={query}
          placeholder="Search titles"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        {query.length > 0 ? (
          <button
            type="button"
            className="at-search__clear"
            onClick={() => onQueryChange("")}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="at-chips" role="group" aria-label="Filter by category">
        <button
          type="button"
          className="at-chip"
          aria-pressed={activeCategory === null}
          onClick={() => onCategoryChange(null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="at-chip"
            aria-pressed={activeCategory === category}
            onClick={() => onCategoryChange(activeCategory === category ? null : category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
