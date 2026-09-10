import { describe, expect, it } from "vitest";
import { fittedCellSize } from "./board-fit";

describe("fittedCellSize", () => {
  it("divides the frame by the cell count", () => {
    expect(
      fittedCellSize({ frameW: 400, frameH: 400, cols: 20, rows: 20, min: 0, max: 100 }),
    ).toBe(20);
  });

  it("is limited by the shorter axis", () => {
    expect(
      fittedCellSize({ frameW: 800, frameH: 400, cols: 20, rows: 20, min: 0, max: 100 }),
    ).toBe(20);
    expect(
      fittedCellSize({ frameW: 400, frameH: 800, cols: 20, rows: 20, min: 0, max: 100 }),
    ).toBe(20);
  });

  it("floors to a whole pixel so cell edges land on device pixels", () => {
    expect(
      fittedCellSize({ frameW: 409, frameH: 409, cols: 20, rows: 20, min: 0, max: 100 }),
    ).toBe(20);
  });

  it("subtracts gapTotal before dividing", () => {
    // 420 - 20 = 400, over 4 columns = 100.
    expect(
      fittedCellSize({ frameW: 420, frameH: 420, cols: 4, rows: 4, gapTotal: 20, min: 0, max: 200 }),
    ).toBe(100);
  });

  it("clamps to max so a wide desktop frame does not inflate the board", () => {
    expect(
      fittedCellSize({ frameW: 4000, frameH: 4000, cols: 20, rows: 20, min: 0, max: 30 }),
    ).toBe(30);
  });

  it("clamps to min, which is the caller's signal to pan", () => {
    // 30 columns in 390px would be 13px; the floor holds it at 32.
    expect(
      fittedCellSize({ frameW: 390, frameH: 700, cols: 30, rows: 16, min: 32, max: 44 }),
    ).toBe(32);
  });

  it("returns min for a frame that has not been laid out yet", () => {
    expect(
      fittedCellSize({ frameW: 0, frameH: 0, cols: 20, rows: 20, min: 0, max: 30 }),
    ).toBe(0);
  });

  it("returns min rather than dividing by zero", () => {
    expect(
      fittedCellSize({ frameW: 400, frameH: 400, cols: 0, rows: 0, min: 5, max: 30 }),
    ).toBe(5);
  });

  it("never returns a value above max even when min exceeds it", () => {
    expect(
      fittedCellSize({ frameW: 10, frameH: 10, cols: 30, rows: 30, min: 50, max: 44 }),
    ).toBe(44);
  });
});
