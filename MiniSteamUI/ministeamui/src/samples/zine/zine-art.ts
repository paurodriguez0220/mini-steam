/**
 * Art helpers for the Arcade Zine sample.
 *
 * The API returns an empty `iconPath` for every game, so there is no cover art
 * to render. Instead the title itself is the cover: it gets chopped into
 * poster lines and printed enormous in one of three flat ink pairings.
 */

/** Number of flat ink pairings available to `.zine-poster--ink*`. */
export const INK_COUNT = 3;

/** Deterministically pick an ink pairing so a game always prints the same way. */
export function inkFor(id: number): number {
  return Math.abs(Math.trunc(id)) % INK_COUNT;
}

/**
 * Break a title into poster lines.
 *
 * Words are kept intact where possible; anything longer than `maxWordLength`
 * is chopped near the middle, which is the deliberate letter-splitting you see
 * on riso gig posters (MINESWEEPER prints as MINES / WEEPER).
 */
export function posterLines(title: string, maxWordLength = 7): string[] {
  const words = title.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["???"];

  const lines: string[] = [];
  for (const word of words) {
    if (word.length <= maxWordLength) {
      lines.push(word);
      continue;
    }
    const cut = Math.floor(word.length / 2);
    lines.push(word.slice(0, cut), word.slice(cut));
  }
  return lines;
}

/** Zero-padded issue number, e.g. 3 -> "03". */
export function issueNumber(value: number): string {
  return String(Math.abs(Math.trunc(value))).padStart(2, "0");
}

/** Host of a game URL, or the raw string if it will not parse. */
export function urlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url || "unknown";
  }
}
