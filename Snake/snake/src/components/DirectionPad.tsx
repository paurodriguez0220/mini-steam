import type { JSX, PointerEvent as ReactPointerEvent } from "react";
import type { SwipeDirection } from "../../../../shared/swipe";

interface DirectionPadProps {
  onTurn: (direction: SwipeDirection) => void;
}

const BUTTON =
  "grid h-12 w-12 place-items-center rounded-sm border-2 border-line bg-surface " +
  "font-display text-xl text-ink shadow-soft-1 select-none " +
  "transition-transform duration-150 ease-spring active:scale-90 active:shadow-soft-press";

/**
 * Thumb controls for Snake.
 *
 * Hidden wherever a real pointer is available, in CSS rather than in
 * JavaScript: a media query re-evaluates when the user plugs in a mouse or
 * rotates a hybrid device, and it costs no render.
 *
 * `onPointerDown` rather than `onClick`, because at 80ms per tick the ~100ms a
 * click waits to settle is most of a cell.
 */
export default function DirectionPad({ onTurn }: DirectionPadProps): JSX.Element {
  const press = (direction: SwipeDirection) => (event: ReactPointerEvent) => {
    // Stop the press becoming a text selection or a scroll gesture.
    event.preventDefault();
    onTurn(direction);
  };

  return (
    <div
      className="mx-auto grid w-max grid-cols-3 grid-rows-3 gap-1.5 [@media(pointer:fine)]:hidden"
      style={{ touchAction: "none" }}
      role="group"
      aria-label="Direction controls"
    >
      <button
        type="button"
        className={`${BUTTON} col-start-2 row-start-1`}
        onPointerDown={press("up")}
        aria-label="Turn up"
      >
        ↑
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-1 row-start-2`}
        onPointerDown={press("left")}
        aria-label="Turn left"
      >
        ←
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-3 row-start-2`}
        onPointerDown={press("right")}
        aria-label="Turn right"
      >
        →
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-2 row-start-3`}
        onPointerDown={press("down")}
        aria-label="Turn down"
      >
        ↓
      </button>
    </div>
  );
}
