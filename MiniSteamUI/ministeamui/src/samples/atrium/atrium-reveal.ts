import type { CSSProperties } from "react";

/**
 * Feeds the stagger index to CSS. `.at-reveal` turns it into an animation
 * delay, and the whole effect is switched off under prefers-reduced-motion.
 */
export function revealStyle(index: number): CSSProperties {
  return { "--at-i": index } as CSSProperties;
}
