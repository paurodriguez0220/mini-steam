import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the player has asked for reduced motion.
 *
 * The snake glides continuously while a run is in progress, which is exactly
 * the kind of persistent movement this setting exists to switch off, so the
 * board falls back to snapping one whole cell per tick.
 */
export default function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setPrefersReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
