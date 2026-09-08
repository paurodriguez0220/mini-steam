import { useEffect, useRef, type JSX } from "react";
import type { Game } from "../../store/useAppStore";

export interface AtriumPlayerProps {
  game: Game;
  onClose: () => void;
}

/**
 * Full-screen player. The iframe keeps its 4:3 board on a 360px phone by
 * deriving its width from the available height, and takes keyboard focus as
 * soon as it loads so arrow keys reach the game without a click.
 */
export function AtriumPlayer({ game, onClose }: AtriumPlayerProps): JSX.Element {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape only reaches us while focus is still on the overlay chrome; once
    // the cross-origin game has focus the Close button is the reliable exit.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleFrameLoad = () => {
    // Arrow keys must reach the game immediately, not after a click inside it.
    frameRef.current?.focus();
  };

  return (
    <div className="at-player" role="dialog" aria-modal="true" aria-label={`${game.title} player`}>
      <div className="at-player__bar">
        <div className="at-player__id">
          <p className="at-player__eyebrow">Now playing &middot; {game.category}</p>
          <p className="at-player__title">{game.title}</p>
        </div>

        <button ref={closeRef} type="button" className="at-player__close" onClick={onClose}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
          <span className="at-player__close-label">Close</span>
        </button>
      </div>

      <div className="at-player__stage">
        <div className="at-player__frame">
          <iframe
            ref={frameRef}
            className="at-player__iframe"
            src={game.url}
            title={`${game.title} - playable`}
            onLoad={handleFrameLoad}
            allow="fullscreen; gamepad; autoplay"
            // Each game is served from its own origin, so allow-same-origin only
            // grants the game access to its own storage, never the storefront's.
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      <p className="at-player__hint">
        <span className="at-player__hint-long">Arrow keys go straight to the game &middot; </span>
        Close to return to the collection
      </p>
    </div>
  );
}
