import { useRef } from "react";
import bgImage from "../assets/nintendobackground.png";

export interface GameIframeProps {
  /** Absolute URL of the game, as returned by the API. */
  src: string;
  /** Accessible title for the embedded document. */
  title: string;
  onLoad?: () => void;
}

export function GameIframe({ src, title, onLoad }: GameIframeProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    // Move keyboard focus into the game as soon as it loads, so arrow keys work
    // immediately instead of requiring the player to click inside the frame first.
    frameRef.current?.focus();
    onLoad?.();
  };

  return (
    <div
      className="relative w-full aspect-[4/3] bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        onLoad={handleLoad}
        className="absolute inset-0 w-full h-full border-0"
        allow="fullscreen; gamepad; autoplay"
        // Each game is served from its own origin, so allow-same-origin only grants the
        // game access to its own storage - it cannot reach the storefront's.
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
