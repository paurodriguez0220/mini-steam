# Mobile-First Game Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all three games size themselves to any viewport with no scrollbar, and give each one real touch controls, without changing game rules or art.

**Architecture:** CSS sizes the board box (`aspect-ratio` + `min(100%, 100cqh)`), so first paint is already correct. A `ResizeObserver` then measures that box and hands an integer pixel `cellSize` to the existing pixel-based render code, which is left intact. Snake's piece geometry is all derived from `size` in JavaScript, so it needs no rewrite — only a different source for that number.

**Tech Stack:** React 19, TypeScript 5.9 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Tailwind 4, rolldown-vite 7.2.5, Vitest 3 (added by Task 1).

**Spec:** [`docs/superpowers/specs/2026-09-09-mobile-first-game-remake-design.md`](../specs/2026-09-09-mobile-first-game-remake-design.md)

## Global Constraints

- TypeScript is strict with `verbatimModuleSyntax` and `erasableSyntaxOnly`. Type-only imports **must** use `import type { X } from "..."`. No enums, no parameter properties.
- `noUnusedLocals` and `noUnusedParameters` are on. An unused import fails the build.
- Every app imports `shared/` by relative path (`../../../../shared/x`). Never copy a shared file into an app — see `docs/decisions/003-shared-design-tokens.md`.
- Never put a font `@import` in `shared/theme.css`.
- Game-specific design tokens live in that app's `index.css`; anything shared lives in `shared/theme.css` only.
- Verify a front-end change with `npm run build` from the **inner** app folder (`Snake/snake`, not `Snake`). This runs `tsc -b`, so it is a real type check.
- Commit messages follow the repo style (`feat:`, `fix:`, `docs:`, `refactor(ui):`) and end with:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- Do not push. The user pushes.

## Deviations from the spec — read before starting

1. **Vitest is added (Task 1).** The spec put tests out of scope. This plan adds a root Vitest harness anyway, because `fittedCellSize` is clamping-and-flooring maths that the entire remake depends on, and it is pure. If the user strikes this, Task 1 still creates `shared/board-fit.ts` — drop only its test steps.
2. **Minesweeper cells grow on desktop, 30px → up to 44px.** The spec's 44px target is a visible change at desktop width, not just on phones. Intentional and on-message for mobile-first, but a reviewer should know.
3. **Pan and pinch are separate tasks (8 and 9).** Panning is plain `overflow: auto`. Pinch-zoom needs a custom two-pointer gesture and a transform layer — real work, and worth being separately acceptable or rejectable.

---

### Task 1: Vitest harness and `shared/board-fit.ts`

The one piece of pure logic the whole remake rests on. `min` is what makes a single function serve both behaviours: the result is clamped to `[min, max]`, so when the honest fit falls below `min` the function returns `min` and the board ends up wider than its frame — which is exactly the condition the caller pans under. Snake and 2048 pass `min: 0` and never pan; Minesweeper passes `min: 32` and pans when it must.

**Files:**
- Create: `package.json` (repo root)
- Create: `vitest.config.ts` (repo root)
- Create: `shared/board-fit.ts`
- Create: `shared/board-fit.test.ts`
- Modify: `.gitignore` (repo root)

**Interfaces:**
- Consumes: nothing.
- Produces: `fittedCellSize(input: BoardFitInput): number` and `interface BoardFitInput { frameW, frameH, cols, rows, gapTotal?, min, max }`, all exported from `shared/board-fit.ts`. Tasks 2, 4, 6 and 8 depend on these exact names.

- [ ] **Step 1: Create the root package.json**

`shared/` has no package for the games — each app compiles it through its own Vite build. This root package exists only to test `shared/`, so it declares nothing the apps consume.

```json
{
  "name": "mini-steam-shared",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create the root vitest.config.ts**

Scoped to `shared/` so it never tries to collect the apps' sources.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["shared/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Confirm the root node_modules is already ignored**

No edit needed — `.gitignore:17` is a bare `node_modules/`, which matches at every depth including the root. Confirm it is still there:

```bash
grep -n 'node_modules' .gitignore
```

Expected: `17:node_modules/`. If that line has gone, add it back rather than adding a second, narrower rule.

- [ ] **Step 4: Install**

Run from the repo root:

```bash
npm install
```

Expected: creates `/node_modules` and `package-lock.json`, no errors.

- [ ] **Step 5: Write the failing tests**

Create `shared/board-fit.test.ts`:

```ts
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
```

- [ ] **Step 6: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "./board-fit"`.

- [ ] **Step 7: Write the implementation**

Create `shared/board-fit.ts`:

```ts
/**
 * Mini Steam - board sizing.
 *
 * Every game lays its board out in pixels derived from one cell size. This
 * turns "how much room have I got" into that number, so the games stay
 * pixel-based - which matters, because Snake's corner radii, taper and head
 * geometry are all computed from it in JavaScript.
 *
 * Pure, and deliberately DOM-free, so it can be tested without a browser.
 * `use-board-fit.ts` is the React wrapper.
 */

export interface BoardFitInput {
  /** Width of the box the board must fit inside, in px. */
  frameW: number;
  /** Height of the box the board must fit inside, in px. */
  frameH: number;
  cols: number;
  rows: number;
  /**
   * Pixels consumed along each axis by gutters, padding and borders - anything
   * that is not cell. Subtracted from the frame before dividing.
   */
  gapTotal?: number;
  /**
   * Smallest acceptable cell, in px. Pass 0 to always shrink to fit.
   *
   * Above 0 this is a floor rather than a fit: the board may come out larger
   * than its frame, which is the caller's cue to pan instead of shrink.
   */
  min: number;
  /** Largest useful cell, in px, so a wide desktop frame does not inflate the board. */
  max: number;
}

/**
 * The largest whole-pixel cell that fits, clamped to [min, max].
 *
 * Whole pixels matter: Snake paints its checkerboard with a repeating conic
 * gradient whose background-size has to line up with absolutely-positioned
 * pieces, and a fractional cell puts a visible seam between them.
 */
export function fittedCellSize(input: BoardFitInput): number {
  const { frameW, frameH, cols, rows, gapTotal = 0, min, max } = input;

  // A frame that has not been laid out yet, or a board with no cells. Both
  // resolve to min: the caller renders nothing until it gets a real number.
  if (cols <= 0 || rows <= 0 || frameW <= 0 || frameH <= 0) {
    return Math.min(min, max);
  }

  const byWidth = (frameW - gapTotal) / cols;
  const byHeight = (frameH - gapTotal) / rows;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  // max wins over min, so a caller that asks for a floor above its own ceiling
  // gets the ceiling rather than an impossible board.
  return Math.min(max, Math.max(min, fitted));
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — 9 tests in `shared/board-fit.test.ts`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts shared/board-fit.ts shared/board-fit.test.ts
git commit -m "$(cat <<'EOF'
feat(shared): add board-fit, the one sizing rule for every game

Turns available space into an integer cell size. Whole pixels because
Snake's conic-gradient checkerboard has to line up with absolutely
positioned pieces, and a fractional cell leaves a seam.

`min` is what lets one function serve both behaviours: clamped to
[min, max], so a floor above the honest fit returns the floor and the
board overflows its frame - which is the caller's cue to pan. Snake and
2048 pass min 0 and never pan; Minesweeper passes 32 and pans when it
must.

Brings the first test runner into the repository, scoped to shared/.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `shared/use-board-fit.ts` and ADR 004

**Files:**
- Create: `shared/use-board-fit.ts`
- Create: `docs/decisions/004-shared-react-hooks.md`

**Interfaces:**
- Consumes: `fittedCellSize`, `BoardFitInput` from Task 1.
- Produces: `useBoardFit<T extends HTMLElement>(options: BoardFitOptions): [RefObject<T | null>, number]` and `type BoardFitOptions = Omit<BoardFitInput, "frameW" | "frameH">`. Tasks 4, 6 and 8 call this.

- [ ] **Step 1: Write the hook**

Create `shared/use-board-fit.ts`:

```ts
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { fittedCellSize } from "./board-fit";
import type { BoardFitInput } from "./board-fit";

export type BoardFitOptions = Omit<BoardFitInput, "frameW" | "frameH">;

/**
 * Measure a frame and report the cell size a board should use inside it.
 *
 * Attach the returned ref to the element the board must fit *into*, not to the
 * board itself - observing the board would feed its own size back in.
 *
 * The returned size is 0 until the first measurement lands. Callers render the
 * frame immediately and hold the pieces back until it is above 0, so nothing
 * is ever painted at a wrong size and then corrected.
 */
export function useBoardFit<T extends HTMLElement>(
  options: BoardFitOptions,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [cellSize, setCellSize] = useState(0);

  // Destructured so the effect depends on the values rather than on the
  // options object, which callers construct inline on every render.
  const { cols, rows, gapTotal = 0, min, max } = options;

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const measure = (): void => {
      const { width, height } = element.getBoundingClientRect();
      setCellSize(fittedCellSize({ frameW: width, frameH: height, cols, rows, gapTotal, min, max }));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cols, rows, gapTotal, min, max]);

  return [ref, cellSize];
}
```

- [ ] **Step 2: Write ADR 004**

Create `docs/decisions/004-shared-react-hooks.md`:

```markdown
# 4. React hooks may live in shared/

Date: 2026-09-09

## Status

Accepted

## Context

`shared/` began as framework-agnostic code: `theme.css`, `game-score.ts` and
`game-theme.ts` are CSS and plain TypeScript, importable by anything.

Making the games fit their viewport needs a `ResizeObserver` bound to a React
ref, and swipe input needs pointer handlers bound to React state. All three
games need both. Under
[ADR 003](003-shared-design-tokens.md) anything shared belongs in `shared/`
only, so duplicating a hook into each game is not an option.

## Decision

React hooks may live in `shared/`. `shared/` is no longer framework-agnostic.

Where a module has logic that does not need React, that logic is split into a
plain `.ts` file and the hook wraps it - `board-fit.ts` beside
`use-board-fit.ts`, `swipe.ts` beside `use-swipe.ts`. The pure half stays
testable without a DOM, and a future non-React consumer is not blocked.

## Consequences

- All four front-ends are React 19 and each compiles `shared/` through its own
  Vite build, so React resolves to the importing app's copy. No new dependency
  is installed and no bundling changes.
- `shared/` now has a peer expectation of React 19. A non-React consumer can
  still import the plain modules, but not the hooks.
- Docker is unaffected: every image already builds with `context: .` from the
  repository root and copies `shared/` in.
```

- [ ] **Step 3: Type-check through a consumer**

`shared/` has no build of its own, so it is checked by the apps that import it. Nothing imports the hook yet, so confirm the tests still pass and the file parses:

```bash
npm test
npx tsc --noEmit --jsx react-jsx --module esnext --moduleResolution bundler --strict shared/use-board-fit.ts
```

Expected: tests PASS. `tsc` may report it cannot find `react` types from the root (the root package has no React installed) — that is expected and harmless; the real check happens in Task 4 when Snake imports it. If `tsc` reports any error *other* than a missing `react` module, fix it.

- [ ] **Step 4: Commit**

```bash
git add shared/use-board-fit.ts docs/decisions/004-shared-react-hooks.md
git commit -m "$(cat <<'EOF'
feat(shared): add useBoardFit, and allow React hooks in shared/

Observes the frame a board has to fit into and reports the cell size for
it. Returns 0 until the first measurement so callers can hold pieces
back rather than paint them at the wrong size and correct.

ADR 004 records the architecture change: shared/ was framework-agnostic
and now has a peer expectation of React 19. Pure logic stays split into
a plain module beside each hook so it remains testable without a DOM.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `shared/swipe.ts` and `shared/use-swipe.ts`

**Files:**
- Create: `shared/swipe.ts`
- Create: `shared/swipe.test.ts`
- Create: `shared/use-swipe.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type SwipeDirection = "up" | "down" | "left" | "right"`, `swipeDirection(dx: number, dy: number, minDistance: number): SwipeDirection | null` from `shared/swipe.ts`; `useSwipe(onSwipe: (d: SwipeDirection) => void, minDistance?: number): { onPointerDown; onPointerUp; onPointerCancel }` from `shared/use-swipe.ts`. Tasks 5 and 7 use these.

- [ ] **Step 1: Write the failing tests**

Create `shared/swipe.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Failed to resolve import "./swipe"`.

- [ ] **Step 3: Write the pure module**

Create `shared/swipe.ts`:

```ts
/**
 * Mini Steam - swipe direction.
 *
 * Pure, so the threshold and dominant-axis rules can be tested without a DOM.
 * `use-swipe.ts` binds this to pointer events.
 */

export type SwipeDirection = "up" | "down" | "left" | "right";

/** Below this, a drag is a tap. Overridable per game. */
export const DEFAULT_SWIPE_MIN_PX = 24;

/**
 * The cardinal direction of a drag, or null if it was too short to be one.
 *
 * The dominant axis wins, and a perfect diagonal resolves to horizontal rather
 * than to nothing - a swipe the player clearly made should always do
 * something, even if they were sloppy about the angle.
 *
 * @param dx Horizontal travel in px, positive rightward.
 * @param dy Vertical travel in px, positive downward (client coordinates).
 */
export function swipeDirection(
  dx: number,
  dy: number,
  minDistance: number,
): SwipeDirection | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < minDistance && absY < minDistance) return null;

  if (absX >= absY) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — 16 tests across `board-fit.test.ts` and `swipe.test.ts`.

- [ ] **Step 5: Write the hook**

Create `shared/use-swipe.ts`:

```ts
import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { DEFAULT_SWIPE_MIN_PX, swipeDirection } from "./swipe";
import type { SwipeDirection } from "./swipe";

export interface SwipeHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: () => void;
}

/**
 * Turn drags on an element into cardinal directions.
 *
 * Pointer events rather than touch events, so a mouse drag and a stylus work
 * the same way as a finger and there is one code path to reason about.
 *
 * The start point is held in a ref rather than in state: a swipe in progress
 * must not re-render the board, which for Snake is mid-tick.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  minDistance: number = DEFAULT_SWIPE_MIN_PX,
): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: ReactPointerEvent): void => {
    startRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent): void => {
      const start = startRef.current;
      startRef.current = null;
      if (start === null) return;

      const direction = swipeDirection(
        event.clientX - start.x,
        event.clientY - start.y,
        minDistance,
      );
      if (direction !== null) onSwipe(direction);
    },
    [onSwipe, minDistance],
  );

  const onPointerCancel = useCallback((): void => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
```

- [ ] **Step 6: Commit**

```bash
git add shared/swipe.ts shared/swipe.test.ts shared/use-swipe.ts
git commit -m "$(cat <<'EOF'
feat(shared): add swipe direction detection

Pointer events rather than touch events, so finger, stylus and mouse
drag all take one code path. The start point lives in a ref because a
swipe in progress must not re-render the board - for Snake that would
land mid-tick.

A perfect diagonal resolves to horizontal rather than to null: a swipe
the player clearly made should always do something.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Snake — fluid layout

Snake's pieces already derive every dimension from `size`, so `Grid`, `SnakeSegment`, `SnakeHead` and `FoodBlock` are not touched. Only the source of that number changes, plus the container that holds it.

**Files:**
- Modify: `Snake/snake/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: `useBoardFit` from Task 2.
- Produces: nothing new. Task 5 modifies the same file.

- [ ] **Step 1: Replace the CELL_SIZE constant with a max**

In `Snake/snake/src/components/GameContainer.tsx`, replace:

```ts
const GRID_SIZE = 20;
const CELL_SIZE = 30;
```

with:

```ts
const GRID_SIZE = 20;

/**
 * Biggest cell worth drawing. 30px is what the board used to be pinned at, so
 * a desktop board comes out exactly the size it always was; anything narrower
 * now shrinks to fit instead of overflowing.
 */
const MAX_CELL_PX = 30;

/** The board's 2px frame, both sides. Not cell, so it comes off the fit. */
const BOARD_BORDER_TOTAL_PX = 4;
```

- [ ] **Step 2: Add the imports**

Add to the import block at the top of the same file:

```ts
import { useBoardFit } from "../../../../shared/use-board-fit";
```

- [ ] **Step 3: Call the hook**

Inside `GameContainer`, directly after the `prefersReducedMotion` / `glideMs` lines, add:

```ts
  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: GRID_SIZE,
    rows: GRID_SIZE,
    gapTotal: BOARD_BORDER_TOTAL_PX,
    // Snake must always show the whole board, so the fit always wins.
    min: 0,
    max: MAX_CELL_PX,
  });
```

- [ ] **Step 4: Replace the JSX return**

Replace the whole `return (...)` block at the end of `GameContainer` with:

```tsx
  return (
    // h-dvh, not min-h-screen: inside the storefront iframe the viewport IS
    // the iframe, and a min-height taller than it is what grew the scrollbar.
    // Three rows - HUD, board, controls - and only the board row flexes, so
    // the game cannot outgrow its viewport by construction.
    <div className="page-bg relative isolate grid h-dvh grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 flex animate-pop-in flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl text-ink sm:text-4xl">Snake</h1>

        <p
          className="rounded-full bg-surface px-4 py-1 font-text text-base text-ink-soft shadow-soft-1 sm:px-5 sm:py-2 sm:text-lg"
          aria-live="polite"
        >
          Score: <span className="font-display text-ink">{score}</span>
        </p>
      </header>

      {/* min-h-0 is what lets this row shrink. A grid row is min-content by
          default, which would let the board push the container taller than
          the viewport - the exact bug being fixed. */}
      <div ref={boardFrameRef} className="relative z-10 grid min-h-0 place-items-center">
        {cellSize > 0 && (
          <div className="relative">
            <Grid
              snake={snake}
              food={food}
              gridSize={GRID_SIZE}
              cellSize={cellSize}
              headAngle={headAngle}
              glideMs={glideMs}
            />

            {running && !started && (
              <p
                role="status"
                className="absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-lg bg-surface/95 px-4 py-3 text-center font-text text-sm text-ink-soft shadow-soft-2 sm:text-base"
              >
                Swipe, or press an arrow key or{" "}
                <span className="font-display text-ink">WASD</span>, to start
              </p>
            )}

            {!running && (
              <div
                role="status"
                className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 animate-pop-in flex-col items-center gap-3 rounded-lg bg-surface/95 px-5 py-4 shadow-soft-2"
              >
                <span className="font-display text-lg text-primary">Game Over</span>
                <button
                  type="button"
                  onClick={restart}
                  className="min-h-11 rounded-full bg-primary px-5 font-display text-primary-ink shadow-soft-1 transition ease-spring hover:bg-primary-deep active:shadow-soft-press"
                >
                  Restart
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task 5 puts the D-pad here. Empty until then, but the row exists so
          adding it does not re-flow the board. */}
      <div className="relative z-10" />
    </div>
  );
```

The status and game-over messages moved from *above* the board to *over* it. Stacked above, they were two of the roughly 800px that overflowed a 460px iframe; overlaid, they cost no layout height at all.

- [ ] **Step 5: Build**

```bash
cd Snake/snake && npm run build
```

Expected: PASS. If `tsc` reports `'CELL_SIZE' is declared but its value is never read`, the constant was left behind — delete it.

- [ ] **Step 6: Look at it**

Run `./scripts/up.ps1 -Rebuild` from the repo root, open `http://localhost:5173/games/2/play`, and confirm the iframe has **no scrollbar** and the whole board is visible. Then open `http://localhost:5175` standalone and resize the window narrow — the board should shrink with it.

- [ ] **Step 7: Commit**

```bash
git add Snake/snake/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
fix(snake): fit the board to its viewport instead of 600px

The board was pinned at GRID_SIZE * CELL_SIZE = 600px inside a
min-h-screen column, so in the storefront's ~460px iframe the content
overflowed and the iframe grew a scrollbar.

h-dvh with three rows - HUD, board, controls - where only the board row
flexes, and cellSize now comes from useBoardFit. Capped at the old 30px
so a desktop board is exactly the size it always was.

The status and game-over messages move over the board rather than above
it; stacked, they were part of what overflowed.

Grid and the piece components are untouched: they already derive every
dimension from the cell size they are handed.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Snake — swipe and D-pad

**Files:**
- Create: `Snake/snake/src/components/DirectionPad.tsx`
- Modify: `Snake/snake/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: `useSwipe`, `SwipeDirection` from Task 3.
- Produces: `DirectionPad` (default export), props `{ onTurn: (direction: SwipeDirection) => void }`.

- [ ] **Step 1: Write the D-pad**

Create `Snake/snake/src/components/DirectionPad.tsx`:

```tsx
import type { JSX } from "react";
import type { SwipeDirection } from "../../../../shared/swipe";

interface DirectionPadProps {
  onTurn: (direction: SwipeDirection) => void;
}

const BUTTON =
  "grid h-12 w-12 place-items-center rounded-sm border-2 border-line bg-surface " +
  "font-display text-xl text-ink shadow-soft-1 select-none " +
  "transition-transform duration-150 ease-spring active:scale-90 active:shadow-soft-press";

/**
 * Thumb controls for Snake.
 *
 * Hidden wherever a real pointer is available, in CSS rather than in
 * JavaScript: a media query re-evaluates when the user plugs in a mouse or
 * rotates a hybrid device, and it costs no render.
 *
 * `onPointerDown` rather than `onClick`, because at 80ms per tick the ~100ms a
 * click waits to settle is most of a cell.
 */
export default function DirectionPad({ onTurn }: DirectionPadProps): JSX.Element {
  const press = (direction: SwipeDirection) => (event: React.PointerEvent) => {
    // Stop the press becoming a text selection or a scroll gesture.
    event.preventDefault();
    onTurn(direction);
  };

  return (
    <div
      className="mx-auto grid w-max grid-cols-3 grid-rows-3 gap-1.5 [@media(pointer:fine)]:hidden"
      style={{ touchAction: "none" }}
      role="group"
      aria-label="Direction controls"
    >
      <button
        type="button"
        className={`${BUTTON} col-start-2 row-start-1`}
        onPointerDown={press("up")}
        aria-label="Turn up"
      >
        ↑
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-1 row-start-2`}
        onPointerDown={press("left")}
        aria-label="Turn left"
      >
        ←
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-3 row-start-2`}
        onPointerDown={press("right")}
        aria-label="Turn right"
      >
        →
      </button>
      <button
        type="button"
        className={`${BUTTON} col-start-2 row-start-3`}
        onPointerDown={press("down")}
        aria-label="Turn down"
      >
        ↓
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Extract the turn logic in GameContainer**

The keyboard handler currently holds the queue rules inline. Both inputs need them, so lift them into one function. In `Snake/snake/src/components/GameContainer.tsx`, add these imports:

```ts
import { useCallback } from "react";
import DirectionPad from "./DirectionPad";
import { useSwipe } from "../../../../shared/use-swipe";
import type { SwipeDirection } from "../../../../shared/swipe";
```

`useCallback` goes into the existing `import { useEffect, useRef, useState } from "react";` line rather than a second import.

Then add, above the component, beside the other direction maps:

```ts
const SWIPE_DIRECTIONS: Record<SwipeDirection, Point> = {
  up: UP,
  down: DOWN,
  left: LEFT,
  right: RIGHT,
};
```

- [ ] **Step 3: Add the shared queueTurn function**

Inside `GameContainer`, above the keyboard effect, add:

```ts
  /**
   * The one way a turn enters the game, whichever input asked for it.
   *
   * Validates against the last turn already queued rather than the direction
   * the snake is facing now: the queued one is what the snake will be facing
   * when this turn is applied. Checking the committed direction instead is
   * what let two quick presses double the snake back through its own neck.
   */
  const queueTurn = useCallback((next: Point): void => {
    if (!runningRef.current) return;

    const facing = queueRef.current[queueRef.current.length - 1] ?? directionRef.current;
    if (next.x === -facing.x && next.y === -facing.y) return;
    if (next.x === facing.x && next.y === facing.y) return;
    if (queueRef.current.length >= MAX_QUEUED_TURNS) return;

    queueRef.current.push(next);
    setStarted(true);
  }, []);

  const handleSwipe = useCallback(
    (direction: SwipeDirection): void => queueTurn(SWIPE_DIRECTIONS[direction]),
    [queueTurn],
  );

  const swipeHandlers = useSwipe(handleSwipe);
```

- [ ] **Step 4: Point the keyboard handler at it**

Replace the body of the keyboard `useEffect` with:

```ts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = directionForKey(e.key);
      if (!next) return;

      // The game owns the arrow keys - without this they scroll the embedding
      // page. WASD carries no default worth suppressing.
      if (e.key in ARROW_DIRECTIONS) e.preventDefault();

      queueTurn(next);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [queueTurn]);
```

- [ ] **Step 5: Wire swipe onto the board and drop in the D-pad**

In the JSX from Task 4, change the board wrapper from:

```tsx
          <div className="relative">
```

to:

```tsx
          <div className="relative" style={{ touchAction: "none" }} {...swipeHandlers}>
```

and replace the empty controls row:

```tsx
      <div className="relative z-10" />
```

with:

```tsx
      <div className="relative z-10">
        <DirectionPad onTurn={handleSwipe} />
      </div>
```

- [ ] **Step 6: Build**

```bash
cd Snake/snake && npm run build
```

Expected: PASS.

- [ ] **Step 7: Drive it**

Standalone at `http://localhost:5175` in a phone-sized window: the D-pad is visible, tapping a direction starts and steers the snake, and swiping on the board turns it. On desktop the D-pad is hidden and the arrow keys still work. Confirm the snake still cannot reverse into its own neck by pressing two opposite directions fast.

- [ ] **Step 8: Commit**

```bash
git add Snake/snake/src/components/DirectionPad.tsx Snake/snake/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
feat(snake): add swipe and an on-screen D-pad

Snake bound keydown only, so on a phone it could not be played at all.

Both inputs go through one queueTurn function, so the two-turn queue and
the anti-reversal check that stops the snake doubling through its own
neck apply to a swipe exactly as they do to a key.

The D-pad hides itself with a pointer:fine media query rather than a JS
check, so it re-evaluates when a mouse is plugged in. It fires on
pointerdown, not click: at 80ms per tick, the delay a click settles for
is most of a cell.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 2048 — fluid layout

**Files:**
- Modify: `2048/2048/src/board-layout.ts`
- Modify: `2048/2048/src/components/Board.tsx`
- Modify: `2048/2048/src/components/Tile.tsx`
- Modify: `2048/2048/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: `useBoardFit` from Task 2.
- Produces: `boardLayout(cellSize: number): BoardLayout` from `board-layout.ts`, where `interface BoardLayout { tilePx; gapPx; stepPx; boardPx; paddingPx; framePx }`. `Board` and `Tile` gain a `layout: BoardLayout` prop. Task 7 modifies `GameContainer` again.

- [ ] **Step 1: Turn board-layout.ts into a function**

Replace the whole of `2048/2048/src/board-layout.ts` with:

```ts
import { BOARD_SIZE } from "./utils/board";

/**
 * Board geometry - the single source of truth.
 *
 * The tile size, the per-cell step and the frame size used to be hardcoded
 * independently in Tile.tsx and Board.tsx, so changing one silently broke the
 * others. Everything here still derives from one number; that number is now
 * measured rather than fixed.
 */

/** Gutter between adjacent tiles, and the inset around the whole grid. */
export const TILE_GAP_PX = 4;

/**
 * Biggest tile worth drawing. 80px is what the board used to be pinned at, so
 * a desktop board comes out exactly the size it always was.
 */
export const MAX_TILE_PX = 80;

/**
 * Pixels along each axis that are gutter rather than tile: one between each
 * pair of tiles, plus the inset on both edges.
 */
export const BOARD_GAP_TOTAL_PX = TILE_GAP_PX * (BOARD_SIZE + 1);

export interface BoardLayout {
  /** Edge length of a single tile. */
  tilePx: number;
  gapPx: number;
  /** Distance from one cell's origin to the next. */
  stepPx: number;
  /** Inner grid: BOARD_SIZE cells with a gap between each, but not after the last. */
  boardPx: number;
  /** Inset between the grid and the frame edge, so every gutter reads the same. */
  paddingPx: number;
  /** Outer size of the frame - used to line the header and controls up with the board. */
  framePx: number;
}

export function boardLayout(cellSize: number): BoardLayout {
  const stepPx = cellSize + TILE_GAP_PX;
  const boardPx = stepPx * BOARD_SIZE - TILE_GAP_PX;

  return {
    tilePx: cellSize,
    gapPx: TILE_GAP_PX,
    stepPx,
    boardPx,
    paddingPx: TILE_GAP_PX,
    framePx: boardPx + TILE_GAP_PX * 2,
  };
}

/**
 * How long a freshly spawned tile animates for.
 *
 * Must match `--animate-pop-in` in `shared/theme.css` (460ms): the spawn flag
 * is cleared on this timer, and clearing it early cuts the animation short.
 */
export const TILE_SPAWN_ANIMATION_MS = 460;
```

- [ ] **Step 2: Take the layout as a prop in Board**

Replace the whole of `2048/2048/src/components/Board.tsx` with:

```tsx
import { Tile } from "./Tile";
import type { Tile as TileType } from "../types";
import type { BoardLayout } from "../board-layout";
import { BOARD_SIZE } from "../utils/board";

export interface BoardProps {
  tiles: TileType[];
  layout: BoardLayout;
}

/** One well per cell, so an empty board still reads as a grid. */
const CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  row: Math.floor(index / BOARD_SIZE),
  col: index % BOARD_SIZE,
}));

export function Board({ tiles, layout }: BoardProps) {
  return (
    <div
      className="rounded-lg bg-board-frame shadow-soft-2"
      style={{
        width: layout.framePx,
        height: layout.framePx,
        padding: layout.paddingPx,
      }}
    >
      {/* The tiles position themselves absolutely, and an absolute box resolves
          against its ancestor's PADDING box - so offsetting from the frame
          would ignore the frame's padding and leave the gutter only on the
          right and bottom. This inner box is exactly the grid, so every gutter
          is equal. */}
      <div className="relative" style={{ width: layout.boardPx, height: layout.boardPx }}>
        {CELLS.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            className="absolute rounded-sm bg-board-well"
            style={{
              width: layout.tilePx,
              height: layout.tilePx,
              top: cell.row * layout.stepPx,
              left: cell.col * layout.stepPx,
            }}
            aria-hidden="true"
          />
        ))}

        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} layout={layout} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Scale the tile font with the tile**

In `2048/2048/src/components/Tile.tsx`, replace the import line:

```ts
import { TILE_PX, TILE_STEP_PX } from "../board-layout";
```

with:

```ts
import type { BoardLayout } from "../board-layout";
```

Replace `valueTextClass` with a pixel calculation — a Tailwind size class cannot follow a measured tile:

```ts
/**
 * Font size as a fraction of the tile, stepped down as digits are added.
 *
 * This used to be four Tailwind size classes chosen against an assumed 80px
 * tile. With a measured tile the ratio has to be the constant, not the pixel
 * size, or five digits overflow a small board.
 */
function valueFontPx(value: number, tilePx: number): number {
  if (value >= 16384) return Math.round(tilePx * 0.24);
  if (value >= 1024) return Math.round(tilePx * 0.3);
  if (value >= 128) return Math.round(tilePx * 0.375);
  return Math.round(tilePx * 0.45);
}
```

Replace the component with:

```tsx
export interface TileProps {
  tile: TileType;
  layout: BoardLayout;
}

export function Tile({ tile, layout }: TileProps) {
  const palette = TILE_PALETTE[tile.value] ?? TILE_PALETTE_MAX;

  return (
    <div
      className={`absolute flex items-center justify-center rounded-sm font-display font-bold tabular-nums transition-all duration-300 ease-spring ${palette} ${
        tile.spawn ? "animate-pop-in" : ""
      }`}
      style={{
        width: layout.tilePx,
        height: layout.tilePx,
        top: tile.row * layout.stepPx,
        left: tile.col * layout.stepPx,
        fontSize: `${valueFontPx(tile.value, layout.tilePx)}px`,
        lineHeight: 1,
      }}
    >
      {tile.value}
    </div>
  );
}
```

- [ ] **Step 4: Fit the board in GameContainer**

In `2048/2048/src/components/GameContainer.tsx`, replace the import:

```ts
import { BOARD_FRAME_PX, TILE_SPAWN_ANIMATION_MS } from "../board-layout";
```

with:

```ts
import { BOARD_GAP_TOTAL_PX, MAX_TILE_PX, TILE_SPAWN_ANIMATION_MS, boardLayout } from "../board-layout";
import { BOARD_SIZE } from "../utils/board";
import { useBoardFit } from "../../../../shared/use-board-fit";
```

If `BOARD_SIZE` is already imported in that file from `../utils/board`, extend the existing import rather than adding a second one.

Inside the component, after the `isOver` line, add:

```ts
  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: BOARD_SIZE,
    rows: BOARD_SIZE,
    gapTotal: BOARD_GAP_TOTAL_PX,
    // 2048 must always show the whole board, so the fit always wins.
    min: 0,
    max: MAX_TILE_PX,
  });

  const layout = boardLayout(cellSize);
```

- [ ] **Step 5: Replace the JSX return**

Replace the whole `return (...)` block with:

```tsx
  return (
    <div className="page-bg relative isolate grid h-dvh grid-rows-[auto_1fr_auto] gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-[520px] items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-4xl">2048</h1>

        <div className="rounded-sm bg-surface px-4 py-1 text-center shadow-soft-1 sm:px-5 sm:py-2">
          <p className="font-text text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            Score
          </p>
          <p className="font-display text-xl leading-none text-ink tabular-nums sm:text-2xl" aria-live="polite">
            {score.toLocaleString("en-US")}
          </p>
        </div>
      </header>

      {/* min-h-0 lets this row shrink; without it the grid row is min-content
          and the board pushes the page taller than the viewport. */}
      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 place-items-center"
        style={{ touchAction: "none" }}
      >
        {cellSize > 0 && (
          <div className="relative animate-pop-in">
            <Board tiles={tiles} layout={layout} />

            {isOver && (
              <div className="absolute inset-0 grid animate-pop-in place-content-center rounded-lg bg-surface/85">
                <p role="status" className="font-display text-2xl text-primary">
                  Game Over
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <button
          type="button"
          onClick={startNewGame}
          className="min-h-11 rounded-full bg-primary px-6 font-display text-base text-primary-ink shadow-soft-2 transition-transform duration-200 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-press"
        >
          New Game
        </button>
      </div>
    </div>
  );
```

The always-mounted empty `role="status"` paragraph is gone. It existed so the live region was in the DOM before the message arrived, but an overlay that mounts on game over is announced by `role="status"` on mount just as well, and it no longer reserves a row of height.

- [ ] **Step 6: Build**

```bash
cd 2048/2048 && npm run build
```

Expected: PASS. `tsc` will flag any leftover reference to `TILE_PX`, `TILE_STEP_PX`, `BOARD_PX` or `BOARD_FRAME_PX` — those constants no longer exist. Fix each to read from `layout`.

- [ ] **Step 7: Look at it**

At `http://localhost:5173/games/1/play`: no scrollbar, whole board visible. Standalone at `http://localhost:5174`, narrow the window — the board and its digits shrink together.

- [ ] **Step 8: Commit**

```bash
git add 2048/2048/src/board-layout.ts 2048/2048/src/components/Board.tsx 2048/2048/src/components/Tile.tsx 2048/2048/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
fix(2048): derive board geometry from measured space

board-layout.ts was a module of constants built on a fixed TILE_PX of
80, with a comment noting a responsive board was separate work. This is
that work: it becomes boardLayout(cellSize), same derived values, and
cellSize now comes from useBoardFit. Capped at 80 so a desktop board is
exactly the size it always was.

Tile font size becomes a ratio of the tile rather than one of four
Tailwind classes picked against an assumed 80px tile - otherwise five
digits overflow a small board.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 2048 — swipe

**Files:**
- Modify: `2048/2048/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: `useSwipe`, `SwipeDirection` from Task 3.
- Produces: nothing.

- [ ] **Step 1: Lift the move out of the keyboard handler**

The move logic currently lives inside the `keydown` listener. Swipe needs the same logic, so extract it. In `2048/2048/src/components/GameContainer.tsx`, add to the React import:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
```

and add the swipe imports:

```ts
import { useSwipe } from "../../../../shared/use-swipe";
import type { SwipeDirection } from "../../../../shared/swipe";
```

- [ ] **Step 2: Add the shared applyMove function**

`Direction` and `SwipeDirection` have identical members, so a swipe needs no mapping table. Inside the component, above the keyboard effect, add:

```ts
  /**
   * The one way a move enters the game, whichever input asked for it.
   *
   * The move is computed here rather than inside a setTiles updater: React 19
   * StrictMode invokes updaters twice, so any setState nested in one
   * double-counts the score and double-advances nextId. Each piece of state
   * gets its own top-level update instead.
   */
  const applyMove = useCallback(
    (direction: Direction): void => {
      if (isOver) return;

      const { tiles: moved, gained } = moveTiles(tiles, direction);
      if (!boardChanged(tiles, moved)) return;

      const spawned = addRandomTile(moved, nextId);
      setTiles(spawned.tiles);
      setNextId(spawned.nextId);
      if (gained > 0) {
        setScore((current) => current + gained);
      }
    },
    [tiles, nextId, isOver],
  );

  // SwipeDirection and Direction have the same four members, so a swipe maps
  // straight through with no lookup table to keep in sync.
  const handleSwipe = useCallback(
    (direction: SwipeDirection): void => applyMove(direction),
    [applyMove],
  );

  const swipeHandlers = useSwipe(handleSwipe);
```

- [ ] **Step 3: Point the keyboard handler at it**

Replace the keyboard `useEffect` with:

```ts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;

      // Stop the arrow keys scrolling the page the game is embedded in.
      e.preventDefault();
      applyMove(direction);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [applyMove]);
```

- [ ] **Step 4: Wire swipe onto the board frame**

The board frame already carries `touchAction: "none"` from Task 6. Add the handlers to that same element:

```tsx
      <div
        ref={boardFrameRef}
        className="relative z-10 grid min-h-0 place-items-center"
        style={{ touchAction: "none" }}
        {...swipeHandlers}
      >
```

- [ ] **Step 5: Build**

```bash
cd 2048/2048 && npm run build
```

Expected: PASS.

- [ ] **Step 6: Drive it**

Standalone at `http://localhost:5174`: swipe in all four directions and confirm tiles move and merge, the score rises, and arrow keys still work. Confirm a swipe that changes nothing does not spawn a tile.

- [ ] **Step 7: Commit**

```bash
git add 2048/2048/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
feat(2048): add swipe controls

2048 bound keydown only, so on a phone it could not be played at all.

Both inputs go through one applyMove function, which keeps the move
computed outside the setTiles updater - React 19 StrictMode invokes
updaters twice, and a setState nested in one double-counts the score.

SwipeDirection and Direction have the same four members, so a swipe maps
straight through with no lookup table to keep in sync.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Minesweeper — fitted cells and a panning frame

Minesweeper reaches a different outcome from the other two through the same function. Snake and 2048 must always show the whole board; Minesweeper must always keep cells tappable. `hard` is 30 columns, which on a 390px phone would be ~13px cells — far below a usable tap target.

**Files:**
- Modify: `Minesweeper/minesweeper/src/components/Board.tsx`
- Modify: `Minesweeper/minesweeper/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: `useBoardFit` from Task 2.
- Produces: `Board` gains a `cellSize: number` prop.

- [ ] **Step 1: Take cellSize as a prop in Board**

Replace the whole of `Minesweeper/minesweeper/src/components/Board.tsx` with:

```tsx
import type { JSX } from "react";
import type { Cell, GameConfig } from "../types";
import { CellButton } from "./CellButton";

export interface BoardProps {
  board: Cell[][];
  config: GameConfig;
  /** Edge length of one cell, in px. Measured - see useBoardFit in the container. */
  cellSize: number;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
}

export function Board({ board, config, cellSize, onReveal, onFlag }: BoardProps): JSX.Element {
  return (
    <div className="inline-block">
      <div
        className="inline-grid bg-bevel-face bevel-inset"
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellButton
              key={`${r}-${c}`}
              cell={cell}
              onReveal={() => onReveal(r, c)}
              onFlag={() => onFlag(r, c)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

`CellButton` is unchanged — it is already `aspect-square w-full`, so it takes its size from the grid column.

- [ ] **Step 2: Fit and pan in GameContainer**

In `Minesweeper/minesweeper/src/components/GameContainer.tsx`, add the import:

```ts
import { useBoardFit } from "../../../../shared/use-board-fit";
```

and add these constants beside the other module constants:

```ts
/**
 * Cell sizing. Unlike Snake and 2048, Minesweeper does not shrink to fit: a
 * 30-column `hard` board on a 390px phone would mean ~13px cells, far below a
 * usable tap target. It holds a tappable size and pans instead.
 */
const MIN_CELL_PX = 32;
const MAX_CELL_PX = 44;
```

Inside the component, after the `config` line, add:

```ts
  const [boardFrameRef, cellSize] = useBoardFit<HTMLDivElement>({
    cols: config.cols,
    rows: config.rows,
    min: MIN_CELL_PX,
    max: MAX_CELL_PX,
  });
```

- [ ] **Step 3: Replace the JSX return**

Replace the whole `return (...)` block with:

```tsx
  return (
    <div className="page-bg relative isolate grid h-dvh grid-rows-[auto_1fr] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4">
      <span className="confetti" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[560px]">
        <TopBar
          flagsLeft={flagsLeft}
          elapsedSeconds={elapsedSeconds}
          gameOver={gameOver}
          won={won}
          difficulty={difficulty}
          onRestart={() => restart()}
          onDifficultyChange={(key) => restart(key)}
        />
      </div>

      {/* The frame is what is measured and what pans. The board inside it is
          whatever size a tappable cell makes it - which on a phone is wider
          than this frame, and that is the point: the page never scrolls, the
          board does. */}
      <div
        ref={boardFrameRef}
        className="relative z-10 min-h-0 overflow-auto overscroll-contain"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div className="grid min-h-full w-max min-w-full place-items-center p-1">
          {cellSize > 0 && (
            <div className="inline-flex animate-pop-in flex-col items-center gap-3 rounded-lg bg-surface p-3 shadow-soft-2">
              <Board
                board={board}
                config={config}
                cellSize={cellSize}
                onReveal={handleReveal}
                onFlag={handleFlag}
              />

              {gameOver && (
                <p className="font-display text-xl font-bold text-primary">💥 Game Over</p>
              )}
              {won && <p className="font-display text-xl font-bold text-mint">🎉 You Won!</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 4: Build**

```bash
cd Minesweeper/minesweeper && npm run build
```

Expected: PASS. If `tsc` reports `'CELL_SIZE_PX' is declared but its value is never read`, the old constant was left in `Board.tsx` — delete it.

- [ ] **Step 5: Look at it**

At `http://localhost:5173/games/3/play`: the page itself does not scroll; on Easy the whole board is visible; switching to Hard makes the board pan inside its frame while the top bar stays put.

- [ ] **Step 6: Commit**

```bash
git add Minesweeper/minesweeper/src/components/Board.tsx Minesweeper/minesweeper/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
fix(minesweeper): keep cells tappable and pan the board, not the page

The whole page scrolled, because the container was min-h-dvh with
overflow-auto and a fixed 30px cell.

Cells now come from useBoardFit with a 32px floor and a 44px ceiling, so
they are always a usable tap target. Where that makes the board wider
than its frame - 30 columns on a phone - the frame pans and the page
stays put. Same sizing function as Snake and 2048; the different
behaviour is entirely in passing a non-zero min.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Minesweeper — pinch to zoom

Panning alone is enough to play. This adds the second half of the chosen behaviour, and is deliberately its own task so it can be dropped without unpicking Task 8.

**Files:**
- Create: `Minesweeper/minesweeper/src/hooks/usePinchZoom.ts`
- Modify: `Minesweeper/minesweeper/src/components/GameContainer.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `usePinchZoom(options?: { min?: number; max?: number }): { scale: number; handlers: PinchHandlers }`.

This hook stays in the app rather than in `shared/`, because only Minesweeper pans a board. If a second game ever needs it, move it to `shared/` then — ADR 003 forbids duplicating it, not siting it locally while it has one consumer.

- [ ] **Step 1: Write the hook**

Create `Minesweeper/minesweeper/src/hooks/usePinchZoom.ts`:

```ts
import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface PinchHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

export interface PinchZoomOptions {
  min?: number;
  max?: number;
}

interface Pointers {
  [pointerId: number]: { x: number; y: number };
}

function spread(pointers: Pointers): number | null {
  const points = Object.values(pointers);
  if (points.length < 2) return null;

  const [a, b] = points;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Two-finger zoom for an element inside an iframe.
 *
 * The browser's own pinch zooms the whole page, which inside the storefront's
 * iframe is the wrong target and is blocked anyway. So the gesture is tracked
 * here from raw pointer events and applied as a scale the caller transforms
 * with.
 *
 * Active pointers live in a ref, not in state: a pinch fires pointermove
 * continuously, and re-rendering the board on each one would drop frames.
 * Only the resulting scale is state.
 */
export function usePinchZoom(options: PinchZoomOptions = {}): {
  scale: number;
  handlers: PinchHandlers;
} {
  const { min = 0.5, max = 2 } = options;

  const [scale, setScale] = useState(1);
  const pointersRef = useRef<Pointers>({});
  /** Spread and scale at the moment the second finger landed. */
  const originRef = useRef<{ spread: number; scale: number } | null>(null);

  const onPointerDown = useCallback((event: ReactPointerEvent): void => {
    pointersRef.current[event.pointerId] = { x: event.clientX, y: event.clientY };

    const current = spread(pointersRef.current);
    if (current !== null) {
      originRef.current = { spread: current, scale };
    }
  }, [scale]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent): void => {
      if (pointersRef.current[event.pointerId] === undefined) return;
      pointersRef.current[event.pointerId] = { x: event.clientX, y: event.clientY };

      const origin = originRef.current;
      const current = spread(pointersRef.current);
      if (origin === null || current === null || origin.spread === 0) return;

      // A pinch is a scroll gesture as far as the browser is concerned; this
      // stops the pan container fighting the zoom.
      event.preventDefault();

      const next = (origin.scale * current) / origin.spread;
      setScale(Math.min(max, Math.max(min, next)));
    },
    [min, max],
  );

  const release = useCallback((event: ReactPointerEvent): void => {
    delete pointersRef.current[event.pointerId];
    // Lifting one finger ends the pinch. The next one down starts a new one
    // from the scale we finished at, so the zoom does not jump.
    if (spread(pointersRef.current) === null) originRef.current = null;
  }, []);

  return {
    scale,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
```

- [ ] **Step 2: Apply it in GameContainer**

In `Minesweeper/minesweeper/src/components/GameContainer.tsx`, add:

```ts
import { usePinchZoom } from "../hooks/usePinchZoom";
```

and inside the component, after the `useBoardFit` call:

```ts
  const { scale, handlers: pinchHandlers } = usePinchZoom({ min: 0.6, max: 2 });
```

Change the pan frame's `touchAction` so the browser hands two-finger gestures to the handler, and attach them:

```tsx
      <div
        ref={boardFrameRef}
        className="relative z-10 min-h-0 overflow-auto overscroll-contain"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
        {...pinchHandlers}
      >
```

and wrap the board card in a scaling layer — put this between the `<div className="grid min-h-full ...">` and the `{cellSize > 0 && (` line, closing it after that block:

```tsx
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 80ms linear",
            }}
          >
```

- [ ] **Step 3: Build**

```bash
cd Minesweeper/minesweeper && npm run build
```

Expected: PASS.

- [ ] **Step 4: Drive it**

On a touch device or with Chrome DevTools device emulation: two-finger pinch scales the board between 0.6x and 2x, one-finger drag still pans, and a single tap still reveals a cell.

- [ ] **Step 5: Commit**

```bash
git add Minesweeper/minesweeper/src/hooks/usePinchZoom.ts Minesweeper/minesweeper/src/components/GameContainer.tsx
git commit -m "$(cat <<'EOF'
feat(minesweeper): pinch to zoom the board

The browser's own pinch zooms the page, which inside the storefront's
iframe is the wrong target, so the gesture is tracked from raw pointer
events and applied as a transform on the board.

Active pointers live in a ref rather than state: a pinch fires
pointermove continuously and re-rendering a 480-cell board on each one
drops frames. Only the resulting scale is state.

Kept in the app rather than shared/ - only Minesweeper pans a board.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Minesweeper — long-press to flag

The single change that makes Minesweeper playable on a phone. Flagging is bound to `contextmenu` only, which a touch device has no way to fire.

**Files:**
- Modify: `Minesweeper/minesweeper/src/components/CellButton.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. `CellButtonProps` is unchanged.

- [ ] **Step 1: Add long-press to CellButton**

In `Minesweeper/minesweeper/src/components/CellButton.tsx`, add to the imports:

```ts
import { useCallback, useRef } from "react";
import type { JSX, PointerEvent as ReactPointerEvent } from "react";
```

Replace the existing `import type { JSX } from "react";` line rather than adding a second import.

Add these constants below `BASE_CLASSES`:

```ts
/** Hold this long to flag. Long enough not to fire on a slow tap. */
const LONG_PRESS_MS = 450;

/** Move further than this and it was a pan, not a press. */
const MOVE_TOLERANCE_PX = 10;
```

Replace the `CellButton` component with:

```tsx
export function CellButton({ cell, onReveal, onFlag }: CellButtonProps): JSX.Element {
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  /**
   * Set when the hold fires, so the click that follows the release is
   * swallowed - otherwise a long press would flag the cell and then reveal it.
   */
  const didLongPressRef = useRef(false);

  const cancel = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent): void => {
      // Mouse right-click still goes through onContextMenu; only a primary
      // press arms the hold.
      if (event.button !== 0) return;

      didLongPressRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };

      timerRef.current = window.setTimeout(() => {
        didLongPressRef.current = true;
        timerRef.current = null;
        // Confirms the flag without the player having to look up. Absent on
        // iOS, where it is a no-op rather than an error.
        navigator.vibrate?.(30);
        onFlag();
      }, LONG_PRESS_MS);
    },
    [onFlag],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent): void => {
      const start = startRef.current;
      if (start === null) return;

      // Panning the board must not flag whatever cell the finger started on.
      if (
        Math.abs(event.clientX - start.x) > MOVE_TOLERANCE_PX ||
        Math.abs(event.clientY - start.y) > MOVE_TOLERANCE_PX
      ) {
        cancel();
      }
    },
    [cancel],
  );

  const onClick = useCallback((): void => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    onReveal();
  }, [onReveal]);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(event) => {
        event.preventDefault();
        // A long press on a touch device also raises contextmenu in some
        // browsers. The timer has already flagged by then, so suppress the
        // duplicate rather than toggling the flag straight back off.
        if (didLongPressRef.current) return;
        onFlag();
      }}
      className={`${BASE_CLASSES} ${surfaceClasses(cell)}`}
    >
      {cellContent(cell)}
    </button>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd Minesweeper/minesweeper && npm run build
```

Expected: PASS.

- [ ] **Step 3: Drive it**

With DevTools device emulation on `http://localhost:5176`:
- a quick tap reveals a cell,
- a ~half-second hold plants a flag and does **not** then reveal it,
- holding and dragging to pan does **not** flag,
- holding a flagged cell removes the flag,
- on desktop, right-click still flags and left-click still reveals.

- [ ] **Step 4: Commit**

```bash
git add Minesweeper/minesweeper/src/components/CellButton.tsx
git commit -m "$(cat <<'EOF'
feat(minesweeper): flag by long press

Flagging was bound to contextmenu only, which a touch device cannot
fire - so on a phone the game could be revealed but never flagged, and
was therefore unwinnable.

A 450ms hold flags, with a short vibration where the API exists. The
click that follows the release is swallowed, or a long press would flag
and then immediately reveal. Moving more than 10px cancels, so panning
the board does not flag the cell the finger started on. Right-click is
unchanged.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Storefront — portrait frame and honest hint text

**Files:**
- Modify: `MiniSteamUI/ministeamui/src/components/PlayOverlay.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Make the frame portrait on phones**

In `MiniSteamUI/ministeamui/src/components/PlayOverlay.tsx`, replace the `FRAME` constant:

```ts
/**
 * A 4:3 box on anything wider than a phone, and 3:4 below that - a phone in
 * portrait gets a tall play area instead of a letterbox. Capped so the whole
 * dialog still fits the viewport; the two heights account for the different
 * dialog padding on phones and on everything else.
 */
const FRAME =
  "relative mx-auto aspect-3/4 w-auto max-w-full overflow-hidden rounded-sm bg-bg-2 " +
  "[box-shadow:inset_0_0_0_2px_var(--color-line)] " +
  "h-[min(calc((100vw_-_42px)*1.3333),calc(100dvh_-_136px))] " +
  "sm:aspect-4/3 sm:rounded-md sm:h-[min(calc((100vw_-_66px)*0.75),780px,calc(100dvh_-_154px))]";
```

The phone height cap flips with the ratio: at 3:4 the height is width × 4/3, so the term that used to be `* 0.75` becomes `* 1.3333`.

- [ ] **Step 2: Tell the truth in the hint**

Replace the footer paragraph:

```tsx
        <p className="text-center text-[13px] font-bold text-ink-soft">
          Arrow keys are already pointed at the game. Press Esc to leave.
        </p>
```

with:

```tsx
        {/* Two messages, picked in CSS rather than JS, so the hint follows a
            device that gains a mouse or is rotated without a re-render. */}
        <p className="text-center text-[13px] font-bold text-ink-soft">
          <span className="[@media(pointer:coarse)]:hidden">
            Arrow keys are already pointed at the game. Press Esc to leave.
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">
            Swipe to play. Tap outside to leave.
          </span>
        </p>
```

- [ ] **Step 3: Build**

```bash
cd MiniSteamUI/ministeamui && npm run build
```

Expected: PASS.

- [ ] **Step 4: Look at it**

At `http://localhost:5173` in a phone-sized window, open a game: the play frame is taller than it is wide and the hint reads "Swipe to play". At desktop width it is 4:3 and the hint mentions arrow keys.

- [ ] **Step 5: Commit**

```bash
git add MiniSteamUI/ministeamui/src/components/PlayOverlay.tsx
git commit -m "$(cat <<'EOF'
fix(ui): give a phone a portrait play frame and an honest hint

The play frame was 4:3 at every width, which on a phone in portrait
wastes most of the screen on letterbox. It is 3:4 below sm and 4:3 from
sm up; the height cap flips with it.

The footer claimed arrow keys were pointed at the game, which on a touch
device is untrue and unhelpful. The two messages are picked in CSS, so
the hint follows a device that gains a mouse without a re-render.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Full verification pass

Nothing new is written here. This task exists because the individual tasks each verified one game, and the thing being claimed at the end is that **all four apps build and no game scrolls in any context**.

**Files:**
- Modify: `CLAUDE.md` (repo root) — the Commands table gains the new test command.

- [ ] **Step 1: Run the shared tests**

```bash
npm test
```

Expected: PASS, 16 tests.

- [ ] **Step 2: Build all four front-ends**

```bash
cd MiniSteamUI/ministeamui && npm run build
cd ../../2048/2048 && npm run build
cd ../../Snake/snake && npm run build
cd ../../Minesweeper/minesweeper && npm run build
```

Expected: four clean builds. `npm run build` runs `tsc -b` first, so this is a real type check across every app that imports `shared/`.

- [ ] **Step 3: Lint all four**

```bash
cd MiniSteamUI/ministeamui && npm run lint
cd ../../2048/2048 && npm run lint
cd ../../Snake/snake && npm run lint
cd ../../Minesweeper/minesweeper && npm run lint
```

Expected: no new errors. `eslint-plugin-react-hooks` is configured — if it flags an exhaustive-deps warning on any hook added by this plan, fix the dependency array rather than suppressing it.

- [ ] **Step 4: Rebuild the stack**

```bash
./scripts/up.ps1 -Rebuild
```

Expected: all six containers start.

- [ ] **Step 5: Check every game in every context**

For each of `http://localhost:5173/games/1/play`, `/games/2/play`, `/games/3/play` **and** standalone `http://localhost:5174`, `5175`, `5176`, at both a desktop window and a 390×844 window:

- [ ] no scrollbar appears on the page or in the iframe (Minesweeper's board frame may pan — the page must not)
- [ ] the whole board is visible for Snake and 2048 at every width
- [ ] Minesweeper cells stay large enough to tap at every difficulty
- [ ] swipe works in Snake and 2048; the Snake D-pad appears only at phone size
- [ ] Minesweeper long-press flags, and pinch zooms
- [ ] keyboard still works everywhere on desktop

- [ ] **Step 6: Confirm scoring still works**

The three `GameContainer` components were all restructured, and they own the `postGameScore` calls. In the storefront, play each game and confirm the leaderboard below the modal still updates: a `ready` on load, `progress` as the score changes, and a `final` when the run ends. Check the browser console for the messages if the UI is ambiguous.

- [ ] **Step 7: Document the test command**

In the root `CLAUDE.md`, in the Commands table, add a row after the `npm run lint` row:

```markdown
| `npm test` (repo root) | Run the `shared/` unit tests (Vitest) |
```

Then update the paragraph that reads *"There is **no test suite in this repository yet**"* to:

```markdown
`shared/` has unit tests (`npm test` from the repo root). The apps do not yet —
that is tracked in `docs/tasks/queue/add-test-suites.md`. Verify app changes
with `dotnet build` and `npm run build`, and say plainly that app tests were
not run.
```

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: record the shared test command

shared/ now has unit tests, so the blanket "no test suite in this
repository" line is no longer accurate. The apps still have none.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review

**Spec coverage.** Every section of the spec maps to a task: `board-fit.ts` → 1; `use-board-fit.ts` and ADR 004 → 2; `use-swipe.ts` → 3; Snake layout → 4; 2048 layout → 6; Minesweeper sizing and pan → 8; Snake touch → 5; 2048 touch → 7; Minesweeper long-press → 10; storefront `FRAME` and hint → 11; verification → 12. Pinch-zoom (9) is split out of the spec's single Minesweeper bullet.

**Naming consistency.** `fittedCellSize` / `BoardFitInput` / `gapTotal` / `min` / `max` are used identically in Tasks 1, 2, 4, 6 and 8. `useBoardFit` returns `[ref, cellSize]` in all four call sites. `SwipeDirection` is the same union in Tasks 3, 5 and 7. `boardLayout(cellSize)` returns `BoardLayout` with the same six fields in Tasks 6's three files.

**Known ordering constraint.** Tasks 5 and 7 edit files that Tasks 4 and 6 rewrite, so 4 must land before 5 and 6 before 7. Tasks 8, 9 and 10 all touch Minesweeper and must run in that order. Tasks 1→2→3 are prerequisites for everything. Task 11 is independent of everything except 12.

**One thing this plan does not do.** It does not rewrite Snake's piece geometry into CSS percentages, and it should not. `cornerRadii`, `taperInset` and the head's eye and tongue placement are all derived from `size` in JavaScript and carry documented bug fixes. Handing them a measured number instead of a constant is the whole change.
