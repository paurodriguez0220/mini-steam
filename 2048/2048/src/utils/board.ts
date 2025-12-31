import type { Tile } from "../types";

const SIZE = 4;

// Add random tile
export function addRandomTile(tiles: Tile[], nextId: number): { tiles: Tile[]; nextId: number } {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!tiles.some((t) => t.row === r && t.col === c)) empty.push([r, c]);
    }
  }

  if (empty.length === 0) return { tiles, nextId };

  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  return {
    tiles: [
      ...tiles,
      { id: nextId, value: Math.random() < 0.9 ? 2 : 4, row, col, spawn: true },
    ],
    nextId: nextId + 1,
  };
}

export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map((t) => ({ ...t }));
}

export function moveTiles(
  tiles: Tile[],
  direction: "up" | "down" | "left" | "right"
): { tiles: Tile[]; gained: number } {
  let gained = 0;
  const newTiles: Tile[] = [];

  for (let i = 0; i < SIZE; i++) {
    // Build line of SIZE cells
    const line: (Tile | null)[] = Array(SIZE).fill(null);
    for (const t of tiles) {
      if (direction === "left" || direction === "right") {
        if (t.row === i) line[t.col] = { ...t };
      } else {
        if (t.col === i) line[t.row] = { ...t };
      }
    }

    // Slide and merge
    let compacted = line.filter(Boolean) as Tile[];
    if (direction === "right" || direction === "down") compacted.reverse();

    const merged: Tile[] = [];
    let skip = false;
    for (let j = 0; j < compacted.length; j++) {
      if (skip) {
        skip = false;
        continue;
      }
      const t = compacted[j];
      const next = compacted[j + 1];
      if (next && next.value === t.value) {
        merged.push({ ...t, value: t.value * 2 });
        gained += t.value * 2;
        skip = true;
      } else {
        merged.push({ ...t });
      }
    }

    while (merged.length < SIZE) merged.push(null as any);
    if (direction === "right" || direction === "down") merged.reverse();

    // Assign exact positions; **don’t change row/col if already correct**
    for (let j = 0; j < SIZE; j++) {
      const t = merged[j];
      if (!t) continue;
      const row = direction === "left" || direction === "right" ? i : j;
      const col = direction === "left" || direction === "right" ? j : i;

      // Only update if position changed
      if (t.row !== row || t.col !== col) {
        t.row = row;
        t.col = col;
      }
      newTiles.push(t);
    }
  }

  return { tiles: newTiles, gained };
}

export const boardChanged = (a: Tile[], b: Tile[]) => {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].row !== b[i].row ||
      a[i].col !== b[i].col ||
      a[i].value !== b[i].value
    ) return true;
  }
  return false;
};


export const isGameOver = (tiles: Tile[], size = 4): boolean => {
  if (tiles.length < size * size) return false;

  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (const t of tiles) {
    grid[t.row][t.col] = t.value;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];

      // Check right
      if (c < size - 1 && grid[r][c + 1] === val) return false;
      // Check down
      if (r < size - 1 && grid[r + 1][c] === val) return false;
    }
  }

  return true;
};