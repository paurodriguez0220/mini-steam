import type { CSSProperties, JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { GameCover } from "./game-cover";
import { Icon } from "./icon";
import { catalogueId } from "./art";

export interface CategoryFacet {
  /** Filter value: "all" or the exact category string from the API. */
  value: string;
  label: string;
  count: number;
  /** Swatch hue, or null for the "all" row. */
  hue: number | null;
}

export interface SidebarRailProps {
  facets: CategoryFacet[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  /** Games shown under "Library". */
  library: Game[];
  onSelectGame: (game: Game) => void;
  /** Closes the drawer on tablet and mobile. */
  onCloseDrawer: () => void;
  status: "online" | "loading" | "offline";
}

type SwatchStyle = CSSProperties & Record<"--ms-h", string>;

const STATUS_LABEL: Record<SidebarRailProps["status"], string> = {
  online: "Catalogue - connected",
  loading: "Catalogue - syncing",
  offline: "Catalogue - unreachable",
};

/** Left rail: category facets, library shortcuts and the connection readout. */
export function SidebarRail({
  facets,
  activeCategory,
  onCategoryChange,
  library,
  onSelectGame,
  onCloseDrawer,
  status,
}: SidebarRailProps): JSX.Element {
  return (
    <aside className="ms-rail" aria-label="Browse and library">
      <div className="ms-rail__drawer-close">
        <span className="ms-mono">Browse</span>
        <button
          type="button"
          className="ms-icon-btn"
          onClick={onCloseDrawer}
          aria-label="Close browse menu"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="ms-rail__section">
        <div className="ms-rail__head">
          <span>Browse</span>
          <span>{facets.length - 1} cat</span>
        </div>
        {facets.map((facet) => {
          const style: SwatchStyle = { "--ms-h": String(facet.hue ?? 210) };
          return (
            <button
              key={facet.value}
              type="button"
              className="ms-rail__item"
              aria-pressed={facet.value === activeCategory}
              onClick={() => onCategoryChange(facet.value)}
            >
              <span className="ms-rail__swatch" style={style} />
              <span className="ms-rail__label">{facet.label}</span>
              <span className="ms-rail__count">{facet.count}</span>
            </button>
          );
        })}
      </div>

      <div className="ms-rail__section">
        <div className="ms-rail__head">
          <span>Library</span>
          <span>{library.length}</span>
        </div>
        {library.length === 0 ? (
          <p className="ms-mono" style={{ padding: "6px 8px" }}>
            Nothing installed
          </p>
        ) : (
          library.map((game) => (
            <button
              key={game.id}
              type="button"
              className="ms-rail__lib"
              onClick={() => onSelectGame(game)}
            >
              <GameCover game={game} variant="sm" />
              <span className="ms-rail__lib-text">
                <span className="ms-rail__lib-title">{game.title}</span>
                <span className="ms-rail__lib-sub">
                  {catalogueId(game.id)} - ready
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="ms-rail__status">
        <span className="ms-dot" />
        <span className="ms-mono">{STATUS_LABEL[status]}</span>
      </div>
    </aside>
  );
}
