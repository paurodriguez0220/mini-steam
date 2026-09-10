import { describe, expect, it } from "vitest";
import type { Board } from "../types";
import {
  WINNING_LINES,
  emptyBoard,
  emptyCells,
  isFull,
  isGameOver,
  opponentOf,
  placeMark,
  winnerOf,
} from "./game";

/** Build a board from a 9-character string: "X", "O" or "." per cell. */
function boardOf(spec: string): Board {
  return spec
    .replace(/\s/g, "")
    .split("")
    .map((c) => (c === "X" ? "X" : c === "O" ? "O" : null));
}

describe("emptyBoard", () => {
  it("is nine empty cells", () => {
    expect(emptyBoard()).toHaveLength(9);
    expect(emptyCells(emptyBoard())).toHaveLength(9);
  });
});

describe("winnerOf", () => {
  it("finds every one of the eight lines", () => {
    for (const line of WINNING_LINES) {
      const board = emptyBoard();
      for (const index of line) board[index] = "X";

      const result = winnerOf(board);
      expect(result?.mark).toBe("X");
      expect(result?.line).toEqual(line);
    }
  });

  it("reports the mark that actually won", () => {
    expect(winnerOf(boardOf("OOO XX. ..."))?.mark).toBe("O");
  });

  it("is null while the game is still live", () => {
    expect(winnerOf(boardOf("XO. ... ..."))).toBeNull();
  });

  it("is null on a full board with no line - a draw is not a win", () => {
    const drawn = boardOf("XXO OOX XOX");
    expect(isFull(drawn)).toBe(true);
    expect(winnerOf(drawn)).toBeNull();
  });

  it("does not read a line across three empty cells", () => {
    expect(winnerOf(emptyBoard())).toBeNull();
  });
});

describe("isGameOver", () => {
  it("is true on a win and on a full board, false while playable", () => {
    expect(isGameOver(boardOf("XXX ... ..."))).toBe(true);
    expect(isGameOver(boardOf("XXO OOX XOX"))).toBe(true);
    expect(isGameOver(boardOf("XO. ... ..."))).toBe(false);
  });
});

describe("placeMark", () => {
  it("does not mutate the board it is given", () => {
    const before = emptyBoard();
    const after = placeMark(before, 4, "X");

    expect(before[4]).toBeNull();
    expect(after[4]).toBe("X");
  });
});

describe("opponentOf", () => {
  it("flips the mark", () => {
    expect(opponentOf("X")).toBe("O");
    expect(opponentOf("O")).toBe("X");
  });
});
