import type { Game } from "../../store/useAppStore";

/**
 * Deterministic art + metadata helpers for the Marketplace sample.
 *
 * The API returns an empty `iconPath` for every game, so every cover in this
 * sample is generated from the game's own data. Everything here is pure and
 * stable: the same game always produces the same hue, monogram and motif.
 */

export type CoverKind = "puzzle" | "arcade" | "other";

export interface GameMeta {
  /** Primary input the game expects. */
  controls: string;
  players: string;
  mode: string;
  runtime: string;
  /** Host of the game URL, or "local" when it cannot be parsed. */
  source: string;
}

const CATEGORY_HUES: Record<string, number> = {
  puzzle: 254,
  arcade: 344,
  strategy: 190,
  action: 22,
  board: 158,
};

/** Small, stable string hash (djb2 variant) used to derive art parameters. */
export function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function categoryKind(category: string): CoverKind {
  const key = category.trim().toLowerCase();
  if (key.includes("puzzle")) return "puzzle";
  if (key.includes("arcade")) return "arcade";
  return "other";
}

/** Hue (0-360) for a game's generated cover. Known categories are pinned. */
export function coverHue(game: Game): number {
  const key = game.category.trim().toLowerCase();
  const pinned = CATEGORY_HUES[key];
  if (pinned !== undefined) {
    // Nudge per title so two games in the same category never look identical.
    return (pinned + (hashString(game.title) % 18) - 9 + 360) % 360;
  }
  return hashString(`${game.category}:${game.title}`) % 360;
}

/** Two-glyph monogram for compact covers. Digits keep their first two chars. */
export function monogram(title: string): string {
  const cleaned = title.trim();
  if (cleaned.length === 0) return "??";
  const words = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/** Font-size step for the typographic cover: shorter titles are set larger. */
export function titleScale(title: string): "xl" | "lg" | "md" {
  const longest = title
    .split(/[\s_-]+/)
    .reduce((max, word) => Math.max(max, word.length), 0);
  if (longest <= 4) return "xl";
  if (longest <= 6) return "lg";
  return "md";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "local";
  }
}

/** Plausible spec-sheet metadata derived from what the API actually gives us. */
export function deriveMeta(game: Game): GameMeta {
  const title = game.title.toLowerCase();
  const kind = categoryKind(game.category);

  let controls = "Keyboard / Touch";
  if (title.includes("minesweeper")) controls = "Mouse / Tap + long-press";
  else if (title.includes("snake") || kind === "arcade") controls = "Arrow keys / Swipe";
  else if (title.includes("2048") || kind === "puzzle") controls = "Arrow keys / Swipe";

  return {
    controls,
    players: "1",
    mode: kind === "arcade" ? "Endless run" : "Single session",
    runtime: "Web - React 19",
    source: hostOf(game.url),
  };
}

/** Zero-padded catalogue id, e.g. "MS-004". */
export function catalogueId(id: number): string {
  return `MS-${String(id).padStart(3, "0")}`;
}
