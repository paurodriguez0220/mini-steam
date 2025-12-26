import { useState, useEffect } from "react";

type Cell = {
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const ROWS = 9;
const COLS = 9;
const MINES = 10;

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      hasMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

export default function App() {
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard());
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(MINES);

  // ----------------- LOGIC -----------------

  const restart = () => {
    setBoard(createEmptyBoard());
    setStarted(false);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(MINES);
  };

  function placeMines(board: Cell[][], safeRow: number, safeCol: number) {
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if ((r === safeRow && c === safeCol) || board[r][c].hasMine) continue;
      board[r][c].hasMine = true;
      placed++;
    }
  }

  function calculateNumbers(board: Cell[][]) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c].hasMine) continue;
        let count = 0;
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < ROWS &&
            nc >= 0 &&
            nc < COLS &&
            board[nr][nc].hasMine
          ) count++;
        }
        board[r][c].adjacentMines = count;
      }
    }
  }

  function revealFlood(board: Cell[][], row: number, col: number) {
    const stack = [[row, col]];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const cell = board[r][c];
      if (cell.isRevealed || cell.isFlagged) continue;
      cell.isRevealed = true;

      if (cell.adjacentMines === 0) {
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }

  const handleReveal = (row: number, col: number) => {
    if (gameOver || won) return;
    let newBoard = board.map((r) => r.map((c) => ({ ...c })));

    if (!started) {
      placeMines(newBoard, row, col);
      calculateNumbers(newBoard);
      setStarted(true);
    }

    const cell = newBoard[row][col];
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.hasMine) {
      cell.isRevealed = true;
      setBoard(newBoard);
      setGameOver(true);
      return;
    }

    revealFlood(newBoard, row, col);
    setBoard(newBoard);
  };

  const handleFlag = (row: number, col: number) => {
    if (gameOver || won) return;
    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    const cell = newBoard[row][col];
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    setFlagsLeft(flagsLeft + (cell.isFlagged ? -1 : 1));
    setBoard(newBoard);
  };

  // ----------------- WIN CHECK -----------------
  useEffect(() => {
    if (gameOver) return;
    let revealedCount = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell.isRevealed) revealedCount++;
      })
    );
    if (revealedCount === ROWS * COLS - MINES) {
      setWon(true);
      setStarted(false);
    }
  }, [board, gameOver]);

  // ----------------- RENDER -----------------
  return (
<div
  className="grid gap-1 p-2 w-full max-w-md rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-green-800"
  style={{
    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
    background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)", // green grass gradient
  }}
>
      <h1 className="text-3xl font-bold mb-4">Minesweeper</h1>

      {/* Top bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gray-800 text-white px-3 py-1 rounded font-mono">
          💣 {flagsLeft} 
        </div>
        <button
          className="bg-gray-300 px-3 py-1 rounded shadow hover:bg-gray-400"
          onClick={restart}
        >
          {gameOver ? "😵" : won ? "😎" : "🙂"}
        </button>
      </div>

      {/* Board */}
      <div
        className="grid gap-1 bg-gray-600 p-2"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          width: "100%",
          maxWidth: "400px", // optional max width
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const revealed = cell.isRevealed;
            const number = cell.adjacentMines;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleReveal(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleFlag(r, c);
                }}
                className={`
                  aspect-square w-full flex items-center justify-center
                  font-bold text-sm select-none transition
                  ${revealed
                    ? "bg-[#705438] border border-[#604020]" // dirt
                    : "bg-green-500 border border-green-700 shadow-inner hover:brightness-110" // grass
                  }
                  ${cell.isFlagged ? "text-red-600" : ""}
                  ${revealed && cell.hasMine ? "bg-red-700 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.8)]" : ""}
                  ${revealed && number === 1 ? "text-sky-400" : ""}
                  ${revealed && number === 2 ? "text-lime-300" : ""}
                  ${revealed && number === 3 ? "text-orange-400" : ""}
                  ${revealed && number === 4 ? "text-purple-400" : ""}
                  ${revealed && number >= 5 ? "text-red-400" : ""}
                `}
              >
                {revealed ? (cell.hasMine ? "💥" : number || "") : cell.isFlagged ? "🚩" : ""}
              </button>
            );
          })
        )}
      </div>
      {/* Game over / win message */}
      {gameOver && (
        <p className="mt-4 text-xl font-bold text-red-700">💥 Game Over</p>
      )}
      {won && (
        <p className="mt-4 text-xl font-bold text-green-700">🎉 You Won!</p>
      )}
    </div>
  );
}

