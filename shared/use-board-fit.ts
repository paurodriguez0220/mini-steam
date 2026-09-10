import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { fittedCellSize } from "./board-fit";
import type { BoardFitInput } from "./board-fit";

export type BoardFitOptions = Omit<BoardFitInput, "frameW" | "frameH">;

/**
 * Measure a frame and report the cell size a board should use inside it.
 *
 * Attach the returned ref to the element the board must fit *into*, not to the
 * board itself - observing the board would feed its own size back in.
 *
 * The returned size is 0 until the first measurement lands. Callers render the
 * frame immediately and hold the pieces back until it is above 0, so nothing
 * is ever painted at a wrong size and then corrected.
 */
export function useBoardFit<T extends HTMLElement>(
  options: BoardFitOptions,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [cellSize, setCellSize] = useState(0);

  // Destructured so the effect depends on the values rather than on the
  // options object, which callers construct inline on every render.
  const { cols, rows, gapTotal = 0, min, max } = options;

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const measure = (): void => {
      const { width, height } = element.getBoundingClientRect();
      setCellSize(fittedCellSize({ frameW: width, frameH: height, cols, rows, gapTotal, min, max }));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cols, rows, gapTotal, min, max]);

  return [ref, cellSize];
}
