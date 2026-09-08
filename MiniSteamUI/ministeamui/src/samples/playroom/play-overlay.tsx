import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { CloseIcon } from "./icons";

export interface PlayOverlayProps {
  /** The game to run. Its `url` is loaded straight into the iframe. */
  game: Game;
  onClose: () => void;
}

export function PlayOverlay({ game, onClose }: PlayOverlayProps): JSX.Element {
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
      className="pr-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${game.title} - now playing`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pr-dialog">
        <div className="pr-dialog__head">
          <div className="pr-dialog__titles">
            <h2 className="pr-dialog__title">{game.title}</h2>
          </div>
          <span className="pr-tag">{game.category}</span>
          <button
            ref={closeRef}
            type="button"
            className="pr-iconbtn"
            onClick={onClose}
            aria-label="Close game"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="pr-frame">
          <iframe
            ref={frameRef}
            src={game.url}
            title={`${game.title} game`}
            onLoad={handleLoad}
            allow="fullscreen; gamepad; autoplay"
            // Each game is served from its own origin, so allow-same-origin only lets the
            // game reach its own storage - never the storefront's.
            sandbox="allow-scripts allow-same-origin"
          />
          {isReady ? null : (
            <div className="pr-frame__loading">
              <span className="pr-spinner" aria-hidden="true" />
              <span>Warming up {game.title}...</span>
            </div>
          )}
        </div>

        <p className="pr-dialog__hint">Arrow keys are already pointed at the game. Press Esc to leave.</p>
      </div>
    </div>
  );
}
