import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";

export interface ZinePlayerProps {
  /** The game to run. */
  game: Game;
  /** Close the overlay. */
  onClose: () => void;
}

/**
 * Full-screen cabinet. The iframe keeps a 4:3 stage at every width, and takes
 * keyboard focus as soon as it loads so arrow keys reach the game with no click.
 */
export function ZinePlayer({ game, onClose }: ZinePlayerProps): JSX.Element {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const handleLoad = (): void => {
    // Hand the keyboard to the game immediately - otherwise the player has to
    // click inside the frame before the arrow keys do anything.
    frameRef.current?.focus();
    setIsReady(true);
  };

  return (
    <div
      className="zine-player"
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${game.title}`}
    >
      <div className="zine-player__bar">
        <p className="zine-player__title">
          Now playing &mdash; {game.title}
        </p>
        <button
          ref={closeRef}
          type="button"
          className="zine-btn zine-player__close"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="zine-player__stage">
        <div className="zine-player__frame">
          <iframe
            ref={frameRef}
            src={game.url}
            title={`${game.title} - playable game`}
            onLoad={handleLoad}
            allow="fullscreen; gamepad; autoplay"
            // Each game is served from its own origin, so allow-same-origin only
            // grants the game access to its own storage, not the storefront's.
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      <p className="zine-player__foot">
        {isReady
          ? "Arrow keys are live / press esc or close to quit"
          : "Loading cabinet..."}
      </p>
    </div>
  );
}
