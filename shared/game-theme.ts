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
}
