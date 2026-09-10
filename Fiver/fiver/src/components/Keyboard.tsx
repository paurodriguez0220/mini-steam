import type { JSX } from "react";
import type { KeyState } from "../types";

export interface KeyboardProps {
  /** Best-known state per letter. Absent from the map means untried. */
  states: ReadonlyMap<string, KeyState>;
  disabled: boolean;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

const STATE_CLASSES: Record<KeyState, string> = {
  unknown: "bg-key text-ink",
  absent: "bg-mark-absent text-mark-ink",
  present: "bg-mark-present text-mark-ink",
  correct: "bg-mark-correct text-mark-ink",
};

const KEY_BASE =
  "grid h-11 min-w-0 flex-1 place-items-center rounded-sm font-display text-sm uppercase " +
  "shadow-soft-1 select-none transition-transform duration-100 ease-spring " +
  "active:scale-95 active:shadow-soft-press sm:h-12 sm:text-base";

/**
 * The on-screen keyboard.
 *
 * Sized in rem and flex fractions rather than from the measured board. A
 * keyboard that scaled with the tiles would shrink to unusable keys on a short
 * viewport, which is the opposite of what should give: on a phone the keyboard
 * is the floor, and the board takes whatever is left.
 *
 * `onPointerDown` with preventDefault rather than onClick - it keeps focus off
 * the buttons, so the physical keyboard handler on window stays the single
 * path for hardware keys and a tapped key never gets replayed by Enter.
 */
export function Keyboard({
  states,
  disabled,
  onLetter,
  onEnter,
  onBackspace,
}: KeyboardProps): JSX.Element {
  const press = (run: () => void) => (event: React.PointerEvent) => {
    event.preventDefault();
    if (!disabled) run();
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[520px] flex-col gap-1.5"
      style={{ touchAction: "manipulation" }}
      role="group"
      aria-label="Keyboard"
    >
      {ROWS.map((row, index) => (
        <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
          {index === 2 && (
            <button
              type="button"
              onPointerDown={press(onEnter)}
              aria-label="Submit guess"
              className={`${KEY_BASE} bg-primary text-primary-ink grow-[1.6] px-1 text-xs sm:text-sm`}
            >
              Enter
            </button>
          )}

          {[...row].map((letter) => (
            <button
              key={letter}
              type="button"
              onPointerDown={press(() => onLetter(letter))}
              aria-label={letter}
              className={`${KEY_BASE} ${STATE_CLASSES[states.get(letter) ?? "unknown"]}`}
            >
              {letter}
            </button>
          ))}

          {index === 2 && (
            <button
              type="button"
              onPointerDown={press(onBackspace)}
              aria-label="Delete letter"
              className={`${KEY_BASE} bg-key text-ink grow-[1.6] px-1 text-base`}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
