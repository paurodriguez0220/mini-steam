import { useEffect, useState } from "react";
import { Board } from "./Board";
import type { Tile } from "../types";
import { addRandomTile, moveTiles, boardChanged, isGameOver } from "../utils/board";

export function GameContainer() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [nextId, setNextId] = useState(1);
  const [score, setScore] = useState(0);

  // Initialize 2 tiles
  useEffect(() => {
    let t: Tile[] = [];
    let id = 1;

    let r = addRandomTile(t, id);
    t = r.tiles;
    id = r.nextId;

    r = addRandomTile(t, id);
    t = r.tiles;
    id = r.nextId;

    setTiles(t);
    setNextId(id);
  }, []);

  // Clear spawn after animation
  useEffect(() => {
    if (tiles.some((t) => t.spawn)) {
      const timeout = setTimeout(() => {
        setTiles((prev) => prev.map((t) => ({ ...t, spawn: false })));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [tiles]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = map[e.key];
      if (!dir) return;

      setTiles((prevTiles) => {
        const { tiles: moved, gained } = moveTiles(prevTiles, dir);
        if (!boardChanged(prevTiles, moved)) {
          return prevTiles;
        }
        const spawn = addRandomTile(moved, nextId);
        setNextId(spawn.nextId);
        setScore((s) => s + gained);
        return spawn.tiles;
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextId]);

  return (
    <div className="flex w-full min-h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Score above the board */}
        <div className="text-[#5D564D] text-2xl mb-2">Score: {score}</div>

        {/* The game board */}
        <Board tiles={tiles} />

        {/* Game over message */}
        {isGameOver(tiles) && (
          <div className="text-red-500 text-xl mb-2 font-bold">
            Game Over!
          </div>
        )}
      </div>
    </div>
  );
}