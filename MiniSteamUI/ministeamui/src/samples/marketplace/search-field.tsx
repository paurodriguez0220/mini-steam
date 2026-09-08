import type { JSX, RefObject } from "react";
import { Icon } from "./icon";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Shown only when the field is empty and wide enough. */
  hint?: string;
}

/** Title search box. Filtering happens live in the parent as you type. */
export function SearchField({
  value,
  onChange,
  inputRef,
  hint = "/",
}: SearchFieldProps): JSX.Element {
  return (
    <div className="ms-search">
      <span className="ms-search__glyph">
        <Icon name="search" size={13} />
      </span>
      <input
        ref={inputRef}
        className="ms-search__input"
        type="search"
        value={value}
        placeholder="Search titles"
        aria-label="Search the catalogue by title"
        onChange={(event) => onChange(event.target.value)}
      />
      {value.length > 0 ? (
        <button
          type="button"
          className="ms-search__clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <Icon name="close" size={10} />
        </button>
      ) : (
        <span className="ms-search__kbd">{hint}</span>
      )}
    </div>
  );
}
