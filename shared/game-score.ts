/**
 * Mini Steam - the game/storefront score channel.
 *
 * One source of truth for the message a game iframe posts up to the
 * storefront. Imported directly by all four apps via a relative path, the
 * same way `shared/theme.css` is, so the envelope cannot drift between them.
 * Each app's Dockerfile must COPY this file alongside its source.
 *
 * Design notes:
 *
 * - The games are not comparable to one another. Snake counts food (~0-50),
 *   2048 sums merged tiles (~1k-20k) and Minesweeper measures elapsed
 *   seconds, where LOWER is better. So a message carries its own metric
 *   kind, its own direction (`betterIs`) and an optional `difficulty`, and
 *   the storefront ranks per game rather than pretending one number fits all.
 * - `difficulty` matters for Minesweeper and Tic Tac Toe: a 40-second win on
 *   `easy` and on `hard` are not the same achievement, and neither is a 15 on
 *   easy Tic Tac Toe and the 5 that unbeatable minimax caps you at. Both rank
 *   per difficulty.
 * - Scores are not sensitive, but the storefront still validates
 *   `event.origin` against its own allow-list, because anything embedded or
 *   opened can post to it.
 */

export const GAME_SCORE_SOURCE = "ministeam-game";
export const GAME_SCORE_VERSION = 1;

/** Matches the game slugs the storefront serves. */
export type GameId = "2048" | "snake" | "minesweeper" | "tictactoe";

/** `points` accumulate upward; `seconds` measure elapsed time. */
export type MetricKind = "points" | "seconds";

/** Which end of the scale wins. Minesweeper is the only `lower` today. */
export type BetterIs = "higher" | "lower";

export type GameOutcome = "won" | "lost";

export interface GameMetric {
  kind: MetricKind;
  /** Non-negative integer. Seconds for `kind: "seconds"`. */
  value: number;
  betterIs: BetterIs;
  /** Shown in the storefront HUD, e.g. "Score" or "Time". */
  label: string;
}

export interface GameScoreMessage {
  source: typeof GAME_SCORE_SOURCE;
  version: typeof GAME_SCORE_VERSION;
  /**
   * `ready`    - the game mounted; the storefront can show its HUD.
   * `progress` - the metric changed mid-run. Never persisted.
   * `final`    - the run ended. This is the only kind that gets recorded.
   */
  type: "ready" | "progress" | "final";
  game: GameId;
  metric: GameMetric;
  /** Minesweeper only: "easy" | "medium" | "hard". */
  difficulty?: string;
  /** Present on `final`. Minesweeper distinguishes these; 2048 and Snake only ever lose. */
  outcome?: GameOutcome;
}

/** What a caller supplies - `source` and `version` are stamped on for them. */
export type GameScorePayload = Omit<GameScoreMessage, "source" | "version">;

/**
 * The storefront origin a game posts to.
 *
 * Set `VITE_STOREFRONT_ORIGIN` per environment. It falls back to "*" so the
 * games still work standalone (opened directly, or with no parent), which is
 * acceptable only because a score carries nothing private. Never widen a
 * message with user data without pinning this first.
 */
function storefrontOrigin(): string {
  const configured =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_STOREFRONT_ORIGIN
      : undefined;

  return configured && configured.trim() !== "" ? configured : "*";
}

/**
 * Post a score message to the embedding storefront.
 *
 * A no-op when the game is not embedded, so callers need no guard.
 */
export function postGameScore(payload: GameScorePayload): void {
  if (typeof window === "undefined" || window.parent === window) {
    return;
  }

  const message: GameScoreMessage = {
    source: GAME_SCORE_SOURCE,
    version: GAME_SCORE_VERSION,
    ...payload,
  };

  window.parent.postMessage(message, storefrontOrigin());
}

/**
 * Narrow an untrusted `MessageEvent.data` to a score message.
 *
 * The storefront must ALSO check `event.origin` - this only validates shape.
 */
export function isGameScoreMessage(data: unknown): data is GameScoreMessage {
  if (typeof data !== "object" || data === null) return false;

  const candidate = data as Partial<GameScoreMessage>;
  if (candidate.source !== GAME_SCORE_SOURCE) return false;
  if (candidate.version !== GAME_SCORE_VERSION) return false;
  if (candidate.type !== "ready" && candidate.type !== "progress" && candidate.type !== "final") {
    return false;
  }
  if (candidate.game !== "2048" && candidate.game !== "snake" && candidate.game !== "minesweeper") {
    return false;
  }

  const metric = candidate.metric;
  if (typeof metric !== "object" || metric === null) return false;
  if (metric.kind !== "points" && metric.kind !== "seconds") return false;
  if (typeof metric.value !== "number" || !Number.isFinite(metric.value) || metric.value < 0) {
    return false;
  }
  if (metric.betterIs !== "higher" && metric.betterIs !== "lower") return false;
  if (typeof metric.label !== "string" || metric.label === "") return false;

  return true;
}

/** Format a metric for display, e.g. `1:07` for seconds or `2,048` for points. */
export function formatMetric(metric: GameMetric): string {
  if (metric.kind === "seconds") {
    const total = Math.floor(metric.value);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  return metric.value.toLocaleString("en-US");
}
