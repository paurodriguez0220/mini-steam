import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface PinchHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

export interface PinchZoomOptions {
  min?: number;
  max?: number;
}

interface Pointers {
  [pointerId: number]: { x: number; y: number };
}

function spread(pointers: Pointers): number | null {
  const points = Object.values(pointers);
  if (points.length < 2) return null;

  const [a, b] = points;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Two-finger zoom for an element inside an iframe.
 *
 * The browser's own pinch zooms the whole page, which inside the storefront's
 * iframe is the wrong target and is blocked anyway. So the gesture is tracked
 * here from raw pointer events and applied as a scale the caller transforms
 * with.
 *
 * Active pointers live in a ref, not in state: a pinch fires pointermove
 * continuously, and re-rendering the board on each one would drop frames.
 * Only the resulting scale is state.
 */
export function usePinchZoom(options: PinchZoomOptions = {}): {
  scale: number;
  handlers: PinchHandlers;
} {
  const { min = 0.5, max = 2 } = options;

  const [scale, setScale] = useState(1);
  const pointersRef = useRef<Pointers>({});
  /** Spread and scale at the moment the second finger landed. */
  const originRef = useRef<{ spread: number; scale: number } | null>(null);

  const onPointerDown = useCallback((event: ReactPointerEvent): void => {
    pointersRef.current[event.pointerId] = { x: event.clientX, y: event.clientY };

    const current = spread(pointersRef.current);
    if (current !== null) {
      originRef.current = { spread: current, scale };
    }
  }, [scale]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent): void => {
      if (pointersRef.current[event.pointerId] === undefined) return;
      pointersRef.current[event.pointerId] = { x: event.clientX, y: event.clientY };

      const origin = originRef.current;
      const current = spread(pointersRef.current);
      if (origin === null || current === null || origin.spread === 0) return;

      // A pinch is a scroll gesture as far as the browser is concerned; this
      // stops the pan container fighting the zoom.
      event.preventDefault();

      const next = (origin.scale * current) / origin.spread;
      setScale(Math.min(max, Math.max(min, next)));
    },
    [min, max],
  );

  const release = useCallback((event: ReactPointerEvent): void => {
    delete pointersRef.current[event.pointerId];
    // Lifting one finger ends the pinch. The next one down starts a new one
    // from the scale we finished at, so the zoom does not jump.
    if (spread(pointersRef.current) === null) originRef.current = null;
  }, []);

  return {
    scale,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
