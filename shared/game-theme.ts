/**
 * Mini Steam - theme for an embedded game.
 *
 * A game runs in a cross-origin iframe, so it cannot see the storefront's
 * `.dark` class and the storefront cannot reach in to set one. The storefront
 * therefore passes the theme on the iframe URL as `?theme=dark|light`, and the
 * game applies it to its own document here.
 *
 * Opened standalone there is no parameter, so the game follows the operating
 * system preference instead of defaulting to light.
 *
 */

/** True when this document is running inside the storefront's iframe. */
export function isEmbedded(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

/**
 * Apply the requested theme, and record whether we are embedded.
 *
 * Call this once, before React renders, so the first paint is already correct.
 */
export function applyThemeFromUrl(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const requested = new URLSearchParams(window.location.search).get("theme");

  const isDark =
    requested === "dark" ||
    (requested === null && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true);

  document.documentElement.classList.toggle("dark", isDark);

  // Embedded, the storefront already supplies the page: its own background,
  // confetti and modal surface sit directly behind this document. Painting our
  // own page chrome on top of that stacks two identical surfaces, which reads
  // as a flat box inside a box. The `embedded` class turns ours off - see
  // shared/theme.css.
  document.documentElement.classList.toggle("embedded", isEmbedded());
}
