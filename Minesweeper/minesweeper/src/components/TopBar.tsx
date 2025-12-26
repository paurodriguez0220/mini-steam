import { DIFFICULTIES } from "../utils/config";

type Props = {
  flagsLeft: number;
  gameOver: boolean;
  won: boolean;
  difficulty: string;
  onRestart: () => void;
  onDifficultyChange: (key: string) => void;
};

export function TopBar({
  flagsLeft,
  gameOver,
  won,
  difficulty,
  onRestart,
  onDifficultyChange,
}: Props) {
  return (
    <div className="flex w-full items-center justify-between gap-3 mb-2">
      {/* Left: flags */}
      <div className="bg-gray-800 text-white px-3 py-1 rounded font-mono shrink-0">
        💣 {flagsLeft}
      </div>

      {/* Center: difficulty */}
      <select
        value={difficulty}
        onChange={(e) => onDifficultyChange(e.target.value)}
        className="px-3 py-1 rounded bg-gray-200 text-black shadow border focus:outline-none focus:ring"
      >
        {Object.keys(DIFFICULTIES).map((key) => (
          <option key={key} value={key}>
            {key.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Right: restart */}
      <button
        onClick={onRestart}
        className="bg-gray-300 px-3 py-1 rounded shadow hover:bg-gray-400 shrink-0"
      >
        {gameOver ? "😵" : won ? "😎" : "🙂"}
      </button>
    </div>
  );
}
