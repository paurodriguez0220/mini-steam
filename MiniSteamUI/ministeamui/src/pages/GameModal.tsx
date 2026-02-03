import { useEffect } from "react";
import { GameFrame } from "../components/GameFrame";
import { GameHeader } from "../components/GameHeader";
import { GameIframe } from "../components/GameIframe";

type Props = {
  gameName: string;
  src: string;
  onClose: () => void;
};

export default function GameModal({ gameName, src, onClose }: Props) {
  useEffect(() => {
    // Lock scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Restore scroll when modal unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-100/30 backdrop-blur-sm">
      <div className="w-full h-full">
        <GameFrame>
          <GameHeader
            title={gameName}
            rightActions={
              <button className="px-2" onClick={onClose}>
                ×
              </button>
            }
          />
          <GameIframe src={src} />
        </GameFrame>
      </div>
    </div>
  );
}
