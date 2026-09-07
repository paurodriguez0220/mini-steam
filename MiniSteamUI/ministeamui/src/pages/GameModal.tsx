import { useEffect, useState } from "react";
import { GameFrame } from "../components/GameFrame";
import { GameHeader } from "../components/GameHeader";
import { GameIframe } from "../components/GameIframe";

export interface GameModalProps {
  gameName: string;
  /** Absolute URL of the game, as returned by the API. */
  src: string;
  onClose: () => void;
}

export function GameModal({ gameName, src, onClose }: GameModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Lock background scroll while the game is open.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Escape closes the modal.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={gameName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      // Clicking the backdrop closes; clicks inside the frame must not bubble to it.
      onClick={onClose}
    >
      <div className="w-full h-full" onClick={(event) => event.stopPropagation()}>
        <GameFrame isLoading={isLoading}>
          <GameHeader
            title={gameName}
            rightActions={
              <button
                type="button"
                aria-label={`Close ${gameName}`}
                className="px-2 text-xl leading-none"
                onClick={onClose}
              >
                &times;
              </button>
            }
          />
          <GameIframe
            src={src}
            title={gameName}
            onLoad={() => setIsLoading(false)}
          />
        </GameFrame>
      </div>
    </div>
  );
}

export default GameModal;
