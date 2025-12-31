import { Link } from "react-router-dom";

const games = [
  { id: "minesweeper", name: "Minesweeper", desc: "Classic Minesweeper" },
  { id: "2048", name: "2048", desc: "Classic 2048" },
  { id: "snake", name: "Snake", desc: "Grow your snake!" },
];

export default function GamesList() {
  return (
    <div className="min-h-screen bg-[#0e141b] text-[#c7d5e0] p-6">
      <h1 className="text-2xl font-bold mb-6">My Games</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {games.map((game) => (
          <Link
            to={`/games/${game.id}`}
            key={game.id}
            className="bg-[#1b2838] p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{game.name}</h2>
            <p className="text-sm mt-2 text-[#9aa5b1]">{game.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
