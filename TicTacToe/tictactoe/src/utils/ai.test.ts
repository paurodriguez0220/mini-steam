import { describe, expect, it } from "vitest";
import type { Board, Mark } from "../types";
import { chooseMove } from "./ai";
import { emptyBoard, emptyCells, isFull, placeMark, winnerOf } from "./game";

/** Build a board from a 9-character string: "X", "O" or "." per cell. */
function boardOf(spec: string): Board {
  return spec
    .replace(/\s/g, "")
    .split("")
    .map((c) => (c === "X" ? "X" : c === "O" ? "O" : null));
}

describe("chooseMove - easy", () => {
  it("only ever returns an empty cell", () => {
    const board = boardOf("XOX .O. X.O");
    const legal = emptyCells(board);

    // Random, so sample it rather than trusting one call.
    for (let i = 0; i < 50; i++) {
      expect(legal).toContain(chooseMove(board, "O", "easy"));
    }
  });
});

describe("chooseMove - medium", () => {
  it("takes an immediate win", () => {
    // O has two in the top row and cell 2 finishes it.
    expect(chooseMove(boardOf("OO. XX. ..."), "O", "medium")).toBe(2);
  });

  it("blocks an immediate loss", () => {
    // X threatens the top row; O has nothing better to do than block.
    expect(chooseMove(boardOf("XX. O.. ..."), "O", "medium")).toBe(2);
  });

  it("prefers its own win over blocking one", () => {
    // Both sides are one move from winning. Taking the win ends it first.
    expect(chooseMove(boardOf("OO. XX. ..."), "O", "medium")).toBe(2);
  });

  it("returns a legal cell when there is no tactic", () => {
    const board = boardOf("X.. ... ...");
    for (let i = 0; i < 50; i++) {
      expect(emptyCells(board)).toContain(chooseMove(board, "O", "medium"));
    }
  });
});

describe("chooseMove - hard", () => {
  it("takes an immediate win", () => {
    expect(chooseMove(boardOf("OO. XX. ..."), "O", "hard")).toBe(2);
  });

  it("blocks an immediate loss when it has no win of its own", () => {
    // X threatens the top row at 2, and O's lone centre mark threatens nothing.
    expect(chooseMove(boardOf("XX. .O. ..."), "O", "hard")).toBe(2);
  });

  it("prefers its own win over blocking one", () => {
    // X threatens 2, but O completes the middle row at 4. Winning ends the
    // game, so the block never has to happen.
    expect(chooseMove(boardOf("XX. O.O ..."), "O", "hard")).toBe(4);
  });

  /**
   * The property that matters: hard is unbeatable.
   *
   * Exhaustive, not sampled. Every legal sequence the player can play is
   * explored against the AI's chosen reply, and the player must never reach a
   * won position from any of them. A draw is the best result available, which
   * is exactly what makes a drawn round worth a point.
   */
  it("never loses, against every legal line of play", () => {
    let positions = 0;

    const playerToMove = (board: Board): void => {
      positions++;
      if (winnerOf(board) !== null || isFull(board)) return;

      for (const move of emptyCells(board)) {
        const afterPlayer = placeMark(board, move, "X");

        const result = winnerOf(afterPlayer);
        expect(result?.mark, "the player reached a win against hard").not.toBe("X");
        if (result !== null || isFull(afterPlayer)) continue;

        aiToMove(afterPlayer);
      }
    };

    const aiToMove = (board: Board): void => {
      const reply = chooseMove(board, "O", "hard");
      expect(board[reply], "hard played an occupied cell").toBeNull();
      playerToMove(placeMark(board, reply, "O"));
    };

    // The player opens.
    playerToMove(emptyBoard());
    // And the AI opens - the match alternates, so both have to hold.
    aiToMove(emptyBoard());

    expect(positions).toBeGreaterThan(100);
  });

  it("returns a legal cell for either mark", () => {
    for (const mark of ["X", "O"] as Mark[]) {
      const board = boardOf("X.O ... ...");
      expect(emptyCells(board)).toContain(chooseMove(board, mark, "hard"));
    }
  });
});
