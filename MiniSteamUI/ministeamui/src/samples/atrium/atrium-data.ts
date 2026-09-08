import type { Game } from "../../store/useAppStore";

/**
 * Every game in the catalogue is drawn, never photographed: the API returns an
 * empty `iconPath`, so each title is represented by a geometric motif derived
 * from its own mechanics.
 */
export type AtriumMotifKind = "grid" | "coil" | "lattice" | "arc";

export interface AtriumFacts {
  /** Short editorial label, e.g. "Puzzle". */
  category: string;
  /** How the game is played. */
  controls: string;
  /** Typical length of one run. */
  session: string;
  /** Where it runs. */
  format: string;
}

const MOTIF_RULES: ReadonlyArray<{ test: RegExp; kind: AtriumMotifKind }> = [
  { test: /2048|tile|merge/i, kind: "grid" },
  { test: /snake|serpent/i, kind: "coil" },
  { test: /mine|sweep/i, kind: "lattice" },
];

/** Chooses the motif for a game from its title, falling back to a neutral arc. */
export function motifKindFor(game: Game): AtriumMotifKind {
  const rule = MOTIF_RULES.find((candidate) => candidate.test.test(game.title));
  return rule ? rule.kind : "arc";
}

const PLATE: Record<AtriumMotifKind, string> = {
  grid: "Tile grid",
  coil: "Coiled path",
  lattice: "Minefield lattice",
  arc: "Concentric",
};

/** Plate caption printed under each drawn motif, magazine-style. */
export function plateCaptionFor(game: Game): string {
  return PLATE[motifKindFor(game)];
}

const CONTROLS: Record<AtriumMotifKind, string> = {
  grid: "Arrow keys / swipe",
  coil: "Arrow keys",
  lattice: "Point and click",
  arc: "Keyboard and pointer",
};

const SESSION: Record<AtriumMotifKind, string> = {
  grid: "5 - 20 min",
  coil: "2 - 10 min",
  lattice: "3 - 15 min",
  arc: "A few minutes",
};

/** Editorial fact list shown beside the featured game and on the detail view. */
export function factsFor(game: Game): AtriumFacts {
  const kind = motifKindFor(game);
  return {
    category: game.category,
    controls: CONTROLS[kind],
    session: SESSION[kind],
    format: "Plays in browser",
  };
}

/** Unique categories, alphabetical, ready for the filter row. */
export function categoriesFrom(games: readonly Game[]): string[] {
  const seen = new Set<string>();
  for (const game of games) {
    if (game.category) seen.add(game.category);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

/** Case-insensitive title search plus an exact category match. */
export function filterGames(
  games: readonly Game[],
  query: string,
  category: string | null,
): Game[] {
  const needle = query.trim().toLowerCase();
  return games.filter((game) => {
    const matchesQuery =
      needle.length === 0 || game.title.toLowerCase().includes(needle);
    const matchesCategory = category === null || game.category === category;
    return matchesQuery && matchesCategory;
  });
}

/** Zero-padded index used as the editorial catalogue number ("01", "02"...). */
export function catalogueNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
