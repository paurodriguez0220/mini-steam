import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Game } from "../../store/useAppStore";
import { Icon } from "./icon";
import { catalogueId, deriveMeta } from "./art";

export interface PlayOverlayProps {
  game: Game;
  onClose: () => void;
}

/**
 * Full-screen player. The iframe is focused as soon as it loads so arrow keys
 * reach the game without a click, and the frame is sized from the viewport
 * height so it stays fully visible on a 360px phone.
 */
export function PlayOverlay({ game, onClose }: PlayOverlayProps): JSX.Element {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const meta = deriveMeta(game);

  // Escape closes while focus is still in the storefront chrome.
  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Stop the page behind the overlay from scrolling on touch devices.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function handleLoad(): void {
    setIsLoaded(true);
    // Move keyboard focus into the game so arrow keys work immediately.
    frameRef.current?.focus();
  }

  function handleReload(): void {
    setIsLoaded(false);
    setReloadKey((key) => key + 1);
  }

  return (
    <div
      className="ms-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${game.title}`}
    >
      <div className="ms-overlay__shell">
        <div className="ms-overlay__bar">
          <span className="ms-tag ms-tag--accent">
            <span className="ms-dot" />
            Running
          </span>
          <h2 className="ms-overlay__title">{game.title}</h2>
          <span className="ms-overlay__spacer" />
          <button
            type="button"
            className="ms-icon-btn"
            onClick={handleReload}
            aria-label="Restart game"
            title="Restart"
          >
            <Icon name="grid" size={13} />
          </button>
          <button
            type="button"
            className="ms-icon-btn"
            onClick={onClose}
            aria-label="Close player"
            title="Close (Esc)"
          >
            <Icon name="close" size={13} />
          </button>
        </div>

        <div className="ms-stage">
          <div className="ms-frame">
            {!isLoaded && (
              <div className="ms-frame__loading">
                <span className="ms-dot" />
                <span className="ms-mono">Loading {game.title}</span>
              </div>
            )}
            <iframe
              key={reloadKey}
              ref={frameRef}
              src={game.url}
              title={`${game.title} - playable build`}
              onLoad={handleLoad}
              allow="fullscreen; gamepad; autoplay"
              // Each game is served from its own origin, so allow-same-origin only
              // grants the game access to its own storage, never the storefront's.
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        <div className="ms-overlay__foot">
          <span className="ms-mono">{catalogueId(game.id)}</span>
          <span className="ms-mono">Controls: {meta.controls}</span>
          <span className="ms-overlay__spacer" />
          <span className="ms-mono">Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
