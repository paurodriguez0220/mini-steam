import type { JSX } from "react";

export const ALL_CATEGORIES = "All";

export interface ZineFiltersProps {
  /** Current search text. */
  query: string;
  /** Called on every keystroke. */
  onQueryChange: (query: string) => void;
  /** Category chips to offer, already including the "All" option. */
  categories: string[];
  /** Currently selected category. */
  activeCategory: string;
  /** Called when a chip is pressed. */
  onCategoryChange: (category: string) => void;
}

/** Search field plus category stickers. Both filter the catalogue live. */
export function ZineFilters({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
}: ZineFiltersProps): JSX.Element {
  return (
    <div className="zine-filters">
      <div className="zine-field">
        <label className="zine-field__label" htmlFor="zine-search">
          Search the index
        </label>
        <input
          id="zine-search"
          className="zine-field__input"
          type="search"
          value={query}
          placeholder="Type a title..."
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="zine-field">
        <span className="zine-field__label" id="zine-cat-label">
          Filed under
        </span>
        <div className="zine-chips" role="group" aria-labelledby="zine-cat-label">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="zine-chip"
              aria-pressed={category === activeCategory}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
