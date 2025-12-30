import { useState, useEffect } from "react";
import { Board } from "./Board";
import { TopBar } from "./TopBar";
import type { GameConfig } from "../types";
import { DIFFICULTIES } from "../utils/config";
import {
  createEmptyBoard,
  placeMines,
  calculateNumbers,
  revealFlood,
} from "../utils/board";
import bgImage from "../assets/background-1.svg";

export function GameContainer() {
  const [config, setConfig] = useState<GameConfig>(DIFFICULTIES.easy);
  const [board, setBoard] = useState(() => createEmptyBoard(config));
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(config.mines);
  const [difficulty, setDifficulty] = useState("easy");

  const restart = (newConfig = config, newDifficulty = difficulty) => {
    setDifficulty(newDifficulty);
    setConfig(newConfig);
    setBoard(createEmptyBoard(newConfig));
    setFlagsLeft(newConfig.mines);
    setStarted(false);
    setGameOver(false);
    setWon(false);
 };

  const handleReveal = (r: number, c: number) => {
    if (gameOver || won) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));

    if (!started) {
      placeMines(newBoard, config, r, c);
      calculateNumbers(newBoard, config);
      setStarted(true);
    }

    const cell = newBoard[r][c];
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.hasMine) {
      cell.isRevealed = true;
      setBoard(newBoard);
      setGameOver(true);
      return;
    }

    revealFlood(newBoard, config, r, c);
    setBoard(newBoard);
  };

  const handleFlag = (r: number, c: number) => {
    if (gameOver || won) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[r][c];
    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    setFlagsLeft(f => f + (cell.isFlagged ? -1 : 1));
    setBoard(newBoard);
  };

  useEffect(() => {
    if (gameOver) return;
    const revealed = board.flat().filter(c => c.isRevealed).length;
    if (revealed === config.rows * config.cols - config.mines) {
      setWon(true);
      setStarted(false);
    }
  }, [board, gameOver, config]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center  p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* 🎮 GAME CARD */}
      <div className="inline-flex flex-col items-center gap-4 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#c4bba3]">
        <h1 className="text-3xl font-bold">Minesweeper</h1>

        <TopBar
            flagsLeft={flagsLeft}
            gameOver={gameOver}
            won={won}
            difficulty={difficulty}
            onRestart={() => restart()}
            onDifficultyChange={(key) =>
                restart(DIFFICULTIES[key], key)
        }
        />
        <Board
          board={board}
          config={config}
          onReveal={handleReveal}
          onFlag={handleFlag}
        />

        {gameOver && (
          <p className="text-xl font-bold text-red-700">💥 Game Over</p>
        )}
        {won && (
          <p className="text-xl font-bold text-green-700">🎉 You Won!</p>
        )}
      </div>
    </div>
  );
}
