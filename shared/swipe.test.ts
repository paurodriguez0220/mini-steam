import { describe, expect, it } from "vitest";
import { swipeDirection } from "./swipe";

describe("swipeDirection", () => {
  it("reads a clear horizontal drag", () => {
    expect(swipeDirection(60, 5, 30)).toBe("right");
    expect(swipeDirection(-60, 5, 30)).toBe("left");
  });

  it("reads a clear vertical drag", () => {
    // Positive y is downward in client coordinates.
    expect(swipeDirection(5, 60, 30)).toBe("down");
    expect(swipeDirection(5, -60, 30)).toBe("up");
  });

  it("picks the dominant axis on a diagonal", () => {
    expect(swipeDirection(60, 40, 30)).toBe("right");
    expect(swipeDirection(40, 60, 30)).toBe("down");
  });

  it("ignores a drag shorter than minDistance on both axes", () => {
    expect(swipeDirection(10, 10, 30)).toBeNull();
  });

  it("accepts a drag that clears minDistance on one axis only", () => {
    expect(swipeDirection(2, 40, 30)).toBe("down");
  });

  it("treats a perfect diagonal as horizontal rather than dropping it", () => {
    expect(swipeDirection(50, 50, 30)).toBe("right");
  });

  it("returns null for a tap", () => {
    expect(swipeDirection(0, 0, 30)).toBeNull();
  });
});
