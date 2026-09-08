import type { Game } from "../store/useAppStore";

/**
 * Values the shell hands down through the router outlet.
 *
 * The theme travels this way rather than being read from the DOM, because the
 * play overlay has to forward it to a cross-origin iframe as a query
 * parameter - the embedded game cannot see the storefront's `.dark` class.
 */
export interface ShellContext {
  theme: "light" | "dark";
}

/** What the detail route adds for its nested play route. */
export interface GameContext extends ShellContext {
  game: Game;
}
