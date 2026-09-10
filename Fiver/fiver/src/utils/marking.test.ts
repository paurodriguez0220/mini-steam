import { describe, expect, it } from "vitest";
import { keyboardStateFor, markGuess } from "./marking";
import type { ScoredGuess } from "../types";

/** "cpa" reads far better than ["correct","present","absent"] in a failure. */
const short = (marks: string[]): string =>
  marks.map((m) => (m === "correct" ? "c" : m === "present" ? "p" : "a")).join("");

const mark = (guess: string, answer: string): string => short(markGuess(guess, answer));

describe("markGuess - the straightforward cases", () => {
  it("marks an exact match all correct", () => {
    expect(mark("crane", "crane")).toBe("ccccc");
  });

  it("marks a guess sharing no letters all absent", () => {
    expect(mark("bhijk", "crane")).toBe("aaaaa");
  });

  it("marks right letter, wrong place as present", () => {
    // a c n r e  vs  c r a n e - every letter is in the answer, and only the
    // final e is in its own position.
    expect(mark("acnre", "crane")).toBe("ppppc");
  });
});

describe("markGuess - repeated letters", () => {
  /**
   * The case a single pass gets wrong. LLAMA has two L's; ALLOY's first L is
   * not in position, its second is. Only the positional one may be correct,
   * and the remaining L is then available for the other.
   */
  it("allocates greens before yellows", () => {
    // A L L O Y  vs  L L A M A
    //   guess[1]='L' matches answer[1]='L' -> correct
    //   guess[0]='A' -> answer has A's left -> present
    //   guess[2]='L' -> the one remaining L was not consumed -> present
    expect(mark("alloy", "llama")).toBe("pcpaa");
  });

  it("does not over-mark a letter repeated in the guess but rare in the answer", () => {
    // "geese" has three e's; "abide" has exactly one, in the last position.
    // Only one of the guess's e's may be marked, and the positional one wins.
    expect(mark("geese", "abide")).toBe("aaaac");
  });

  it("marks only as many as the answer holds when the guess repeats", () => {
    // s a s s y  vs  b a s i c - the answer holds one s, at index 2, and the
    // guess offers three. Index 2 matches exactly and consumes it, so the s's
    // at 0 and 3 have nothing left to claim. (The a at index 1 also matches.)
    expect(mark("sassy", "basic")).toBe("accaa");
  });

  it("handles a letter repeated in the answer but once in the guess", () => {
    // b l a n d  vs  a b b e y - nothing lines up. The answer has two b's for
    // the guess's one, and one a, so both b and a come back present.
    expect(mark("bland", "abbey")).toBe("papaa");
  });

  it("handles repeats on both sides", () => {
    // e e r i e  vs  s e v e r - guess e's at 0, 1, 4; answer e's at 1 and 3.
    //   index 1 matches exactly -> correct, consuming one e (one left)
    //   index 0 -> one e left    -> present, consuming the last one
    //   index 2 r -> answer has r at 4 -> present
    //   index 3 i -> absent
    //   index 4 e -> nothing left -> absent
    expect(mark("eerie", "sever")).toBe("pcpaa");
  });

  it("never marks more letters than the answer contains", () => {
    for (const [guess, answer] of [
      ["aaaaa", "crane"],
      ["eeeee", "geese"],
      ["sassy", "sassy"],
    ] as const) {
      const marks = markGuess(guess, answer);
      for (const letter of new Set(guess)) {
        const claimed = marks.filter(
          (m, i) => guess[i] === letter && m !== "absent",
        ).length;
        const available = [...answer].filter((a) => a === letter).length;
        expect(claimed).toBeLessThanOrEqual(available);
      }
    }
  });
});

describe("keyboardStateFor", () => {
  const scored = (word: string, answer: string): ScoredGuess => ({
    word,
    marks: markGuess(word, answer),
  });

  it("is empty before anything is guessed", () => {
    expect(keyboardStateFor([]).size).toBe(0);
  });

  it("keeps the best state a letter has ever had", () => {
    // First guess puts C correctly at index 0 of "crane". A later guess plays
    // C in the wrong place - the key must stay green.
    const guesses = [scored("crane", "crane"), scored("choke", "crane")];
    expect(keyboardStateFor(guesses).get("c")).toBe("correct");
  });

  it("promotes absent to present to correct, never the reverse", () => {
    const answer = "abbey";
    const afterAbsent = keyboardStateFor([scored("crime", answer)]);
    expect(afterAbsent.get("e")).toBe("present");

    const afterCorrect = keyboardStateFor([scored("crime", answer), scored("abbey", answer)]);
    expect(afterCorrect.get("e")).toBe("correct");
  });

  it("records letters the answer does not contain as absent", () => {
    expect(keyboardStateFor([scored("crane", "spilt")]).get("c")).toBe("absent");
  });
});
