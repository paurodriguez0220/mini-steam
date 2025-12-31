import { useParams } from "react-router-dom";
import { useState } from "react";
import GameModal from "./GameModal";

const games = {
  minesweeper: { id: "minesweeper", name: "Minesweeper", src: "https://happy-mud-060686d00.4.azurestaticapps.net/" },
  snake: { id: "snake", name: "Snake", src: "http://localhost:5174/snake" },
};

export default function GameDetails() {
  const { id } = useParams();
  const game = games[id as keyof typeof games];
  const [isOpen, setIsOpen] = useState(false);

  if (!game) return <div className="p-6 text-white">Game not found</div>;

  return (
    <div className="min-h-screen bg-[#ff4b5c] text-white p-6 font-poppins">
      <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
      <p className="mb-6 text-[#ffe066]">Here is some info about {game.name}.</p>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#f9c74f] hover:bg-[#fbc531] px-4 py-2 rounded text-[#2d0c0c] font-semibold shadow-lg transition"
      >
        Play Game
      </button>

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