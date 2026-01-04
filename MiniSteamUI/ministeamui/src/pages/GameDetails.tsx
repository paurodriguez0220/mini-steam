import { useParams } from "react-router-dom";
import { useState } from "react";
import GameModal from "./GameModal";

import img2048 from "../assets/2048.jpg";

const games = {
  minesweeper: { id: "minesweeper", name: "Minesweeper", src: "https://happy-mud-060686d00.4.azurestaticapps.net/", img: img2048, release: "27/2/2026", description: "Tales of Berseria returns with enhanced graphics and optimised gameplay!" },
  "2048": { id: "2048", name: "2048", src: "https://ambitious-sea-0aff5e300.2.azurestaticapps.net", img: img2048, release: "27/2/2026", description: "Tales of Berseria returns with enhanced graphics and optimised gameplay!" },
  snake: { id: "snake", name: "Snake", src: "http://localhost:5174/snake", img: img2048, release: "27/2/2026", description: "Tales of Berseria returns with enhanced graphics and optimised gameplay!" },
};

export default function GameDetails() {
  const { id } = useParams();
  const game = games[id as keyof typeof games];
  const [isOpen, setIsOpen] = useState(false);

  if (!game) return <div className="p-6 text-white">Game not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 max-w-7xl mx-auto">
        <div className="flex-shrink-0 w-full md:w-2/3">
          <img
            src={game.img}
            alt={game.name}
            className="w-full h-auto rounded-lg object-cover"
          />
        </div>

        <div className="flex flex-col items-start md:items-start w-full md:w-1/3 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{game.name}</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition"
          >
            Play now
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 text-gray-700 whitespace-pre-line">
        {game.description}
      </div>

      {isOpen && (
        <GameModal
          gameName={game.name}
          src={game.src}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}