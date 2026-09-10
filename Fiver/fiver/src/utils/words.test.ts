import { describe, expect, it } from "vitest";
import { ANSWERS, GUESSES } from "../data/words";
import { WORD_LENGTH } from "./config";
import { randomAnswer, rejectGuess } from "./words";

describe("the generated word pools", () => {
  it("are non-trivially sized", () => {
    // Guard against a regenerate that silently produces an empty or tiny pool.
    expect(ANSWERS.length).toBeGreaterThan(1500);
    expect(GUESSES.length).toBeGreaterThan(10000);
  });

  it("contain only lower-case words of the right length", () => {
    for (const list of [ANSWERS, GUESSES]) {
      for (const word of list) {
        expect(word).toMatch(new RegExp(`^[a-z]{${WORD_LENGTH}}$`));
      }
    }
  });

  /**
   * The pools are generated separately, so nothing structural stops an answer
   * being absent from the guess list. If that happened the game would reject
   * the correct word as "not a word", which is unlosable-in-the-worst-way.
   */
  it("guarantee every answer is itself a legal guess", () => {
    const guesses = new Set(GUESSES);
    const orphans = ANSWERS.filter((w) => !guesses.has(w));
    expect(orphans).toEqual([]);
  });

  it("hold no duplicates", () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length);
    expect(new Set(GUESSES).size).toBe(GUESSES.length);
  });

  it("exclude inflected plurals from the answers", () => {
    // The filter drops a plural whose stem is a word, and keeps a word that
    // merely ends in s. Both halves matter.
    expect(ANSWERS).not.toContain("aches");
    expect(ANSWERS).toContain("chess");
  });
});

describe("rejectGuess", () => {
  it("accepts a real word", () => {
    expect(rejectGuess("crane")).toBeNull();
  });

  it("rejects a short entry without calling it a non-word", () => {
    expect(rejectGuess("cran")).toBe("too-short");
    expect(rejectGuess("")).toBe("too-short");
  });

  it("rejects letters that are not a word", () => {
    expect(rejectGuess("qqqqq")).toBe("not-a-word");
  });

  it("is case-insensitive", () => {
    expect(rejectGuess("CRANE")).toBeNull();
  });
});

describe("randomAnswer", () => {
  it("returns a word from the answer pool", () => {
    for (let i = 0; i < 25; i++) {
      expect(ANSWERS).toContain(randomAnswer());
    }
  });

  it("avoids words already used", () => {
    const used = new Set(ANSWERS.slice(0, ANSWERS.length - 1));
    expect(randomAnswer(used)).toBe(ANSWERS[ANSWERS.length - 1]);
  });

  it("still returns a word when everything has been used", () => {
    expect(ANSWERS).toContain(randomAnswer(new Set(ANSWERS)));
  });
});
