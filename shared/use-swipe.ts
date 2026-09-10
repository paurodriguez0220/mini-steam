import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { DEFAULT_SWIPE_MIN_PX, swipeDirection } from "./swipe";
import type { SwipeDirection } from "./swipe";

export interface SwipeHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: () => void;
}

/**
 * Turn drags on an element into cardinal directions.
 *
 * Pointer events rather than touch events, so a mouse drag and a stylus work
 * the same way as a finger and there is one code path to reason about.
 *
 * The start point is held in a ref rather than in state: a swipe in progress
 * must not re-render the board, which for Snake is mid-tick.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  minDistance: number = DEFAULT_SWIPE_MIN_PX,
): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: ReactPointerEvent): void => {
    startRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent): void => {
      const start = startRef.current;
      startRef.current = null;
      if (start === null) return;

      const direction = swipeDirection(
        event.clientX - start.x,
        event.clientY - start.y,
        minDistance,
      );
      if (direction !== null) onSwipe(direction);
    },
    [onSwipe, minDistance],
  );

  const onPointerCancel = useCallback((): void => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
