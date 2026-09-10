import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Game } from "../store/useAppStore";
import { CloseIcon } from "./icons";

export interface PlayOverlayProps {
  /** The game to run. Its `url` is loaded straight into the iframe. */
  game: Game;
  onClose: () => void;
  /** Forwarded to the game as `?theme=` - it cannot read the parent's DOM. */
  theme?: "light" | "dark";
}

const ICON_BUTTON =
  "grid h-[46px] w-[46px] min-h-11 min-w-11 flex-none cursor-pointer place-items-center " +
  "rounded-sm border-2 border-line bg-surface text-ink shadow-soft-1 " +
  "transition-[translate,scale,box-shadow,background-color] " +
  "duration-[320ms,320ms,220ms,180ms] " +
  "ease-[var(--ease-spring),var(--ease-spring),var(--ease-soft),var(--ease-soft)] " +
  "hover:-translate-y-[3px] hover:shadow-soft-2 " +
  "active:translate-y-0 active:scale-90 active:shadow-soft-press";

/**
 * A 4:3 box on anything wider than a phone, and 3:4 below that - a phone in
 * portrait gets a tall play area instead of a letterbox. Capped so the whole
 * dialog still fits the viewport; the two heights account for the different
 * dialog padding on phones and on everything else.
 */
const FRAME =
  "relative mx-auto aspect-3/4 w-auto max-w-full overflow-hidden rounded-sm bg-bg-2 " +
  "[box-shadow:inset_0_0_0_2px_var(--color-line)] " +
  "h-[min(calc((100vw_-_42px)*1.3333),calc(100dvh_-_136px))] " +
  "sm:aspect-4/3 sm:rounded-md sm:h-[min(calc((100vw_-_66px)*0.75),780px,calc(100dvh_-_154px))]";

/**
 * The game is on its own origin and cannot see the storefront's `.dark` class, so
 * the current theme rides along in the query string. `game.url` may already carry
 * one, which is why this goes through the URL API instead of concatenating.
 */
function frameSrc(url: string, theme: "light" | "dark"): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("theme", theme);
    return parsed.toString();
  } catch {
    // Not an absolute URL - load it as given and let the game pick its own theme.
    return url;
  }
}

export function PlayOverlay({ game, onClose, theme = "light" }: PlayOverlayProps): JSX.Element {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleLoad = (): void => {
    setIsReady(true);
    // Push keyboard focus into the game so arrow keys reach it without a click first.
    frameRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex bg-[rgba(34,26,22,0.62)] p-2 backdrop-blur-[8px] animate-fade sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${game.title} - now playing`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative m-auto flex w-full flex-col gap-3 rounded-md border-2 border-line bg-surface p-2.5 shadow-soft-3 animate-[pop-in_360ms_var(--ease-spring)_both] sm:w-[min(1100px,100%)] sm:rounded-lg sm:p-3.5">
        <div className="flex items-center gap-3 pl-1.5">
          <div className="mr-auto min-w-0">
            <h2 className="truncate text-[17px] sm:text-[20px]">{game.title}</h2>
          </div>
          <span className="inline-flex items-center gap-[7px] rounded-full border-2 border-line bg-surface-2 px-3.5 py-[7px] text-[13px] font-extrabold text-ink-soft">
            {game.category}
          </span>
          <button
            ref={closeRef}
            type="button"
            className={ICON_BUTTON}
            onClick={onClose}
            aria-label="Close game"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={FRAME}>
          <iframe
            ref={frameRef}
            src={frameSrc(game.url, theme)}
            title={`${game.title} game`}
            onLoad={handleLoad}
            className="absolute inset-0 block h-full w-full border-0"
            allow="fullscreen; gamepad; autoplay"
            // Each game is served from its own origin, so allow-same-origin only lets the
            // game reach its own storage - never the storefront's.
            sandbox="allow-scripts allow-same-origin"
          />
          {isReady ? null : (
            <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 font-extrabold text-ink-soft">
              <span className="h-[42px] w-[42px] rounded-sm bg-primary animate-boing" aria-hidden="true" />
              <span>Warming up {game.title}...</span>
            </div>
          )}
        </div>

        {/* Two messages, picked in CSS rather than JS, so the hint follows a
            device that gains a mouse or is rotated without a re-render. */}
        <p className="text-center text-[13px] font-bold text-ink-soft">
          <span className="[@media(pointer:coarse)]:hidden">
            Arrow keys are already pointed at the game. Press Esc to leave.
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">
            Swipe to play. Tap outside to leave.
          </span>
        </p>
      </div>
    </div>
  );
}
