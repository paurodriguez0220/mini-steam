# 2048

The sliding-tile puzzle, rebuilt as a Mini Steam game: a 4×4 board, tiles that slide
and merge into powers of two, and a score that is the sum of every merge. It runs
standalone or embedded in the Mini Steam storefront's iframe.

## Getting Started

Prerequisites: Node 20.19+ and npm. Run every command from this folder
(`2048/2048`), **not** from `2048/`.

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

The whole stack (storefront + API + all three games) also runs in Docker from the
repository root — `./scripts/up.ps1` puts 2048 on http://localhost:5174.

> **Note:** this app imports from `shared/`, which sits *above* it in the repository.
> Its Docker image therefore builds with `context: .` from the repository root, never
> from this folder. See [ADR 003](../../docs/decisions/003-shared-design-tokens.md).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

There are no tests in this app yet — tracked in
[`docs/tasks/queue/add-test-suites.md`](../../docs/tasks/queue/add-test-suites.md).
The shared modules it depends on *are* tested: `npm test` from the repository root.

## Architecture

The board is **a flat list of tiles with stable ids**, not a 4×4 grid of values.
That is the central design decision and everything else follows from it: a tile keeps
its identity across a move, so React can animate it from its old cell to its new one
with a plain CSS transition instead of the board flickering out and back in.

Three patterns carry the rest:

- **Pure move logic.** `moveTiles` is a pure function of `(tiles, direction)`. It
  returns the new tiles and the points gained; it touches no state.
- **One input funnel.** Keyboard and swipe both call the same `applyMove`.
- **Derived geometry.** `boardLayout(cellSize)` is the single source of truth for
  every pixel on the board, and `cellSize` is measured by the shared `useBoardFit`.

```
App
└── GameContainer          state, move handling, input, score reporting
    └── Board              the frame, the empty wells, the tile layer
        └── Tile           one tile (× n), absolutely positioned
```

### Files

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | All state, `applyMove`, input handling, score messages |
| `src/components/Board.tsx` | The frame, the grid of empty wells, hosts the tiles |
| `src/components/Tile.tsx` | One tile — colour ramp, font scaling, position |
| `src/board-layout.ts` | `boardLayout(cellSize)`; all board geometry |
| `src/utils/board.ts` | Pure rules — slide, merge, spawn, change detection, game over |
| `src/types.ts` | `Tile` |
| `src/index.css` | The 2048 tile colour ramp, on top of the shared theme |

---

## How it works

### The tile model

```ts
type Tile = { id: number; value: number; row: number; col: number; spawn?: boolean };
```

Ids are handed out from a monotonically increasing `nextId`. Because React keys each
tile by `id`, a tile that moves from `(0,3)` to `(0,0)` is the *same* DOM node with
new coordinates — so `transition-all` slides it across. A grid-of-numbers model
would have to unmount and remount, and nothing could be animated.

`spawn` marks a freshly placed tile so it can play the pop-in animation once.

### A move

`moveTiles(tiles, direction)` is pure. It processes the board one line at a time —
rows for left/right, columns for up/down:

1. **Build the line.** Collect the tiles on that row or column into a 4-slot array
   indexed by position.
2. **Compact.** Drop the empty slots. For `right` and `down`, reverse first, so
   every direction can be handled by the same left-to-right logic and reversed back
   at the end.
3. **Merge.** Walk the compacted list; if the next tile has the same value, emit one
   tile of double the value, add that to `gained`, and skip the consumed one. The
   `skip` flag is what enforces the classic rule that **a tile may merge only once
   per move** — `[2,2,4]` becomes `[4,4]`, never `[8]`.
4. **Re-pad and un-reverse**, then write the final `row`/`col` back onto each tile.

The merged tile reuses the surviving tile's `id`, so it animates into place and then
changes value rather than appearing from nowhere.

### What counts as a move

A key or swipe only spawns a new tile if the board actually changed.
`boardChanged(before, after)` compares length and then every tile's row, column and
value. Pressing into a wall that cannot move anything is a no-op — no spawn, no
score, nothing.

If it did change, `addRandomTile` picks uniformly among the empty cells and places a
**2 with 90% probability, a 4 with 10%**.

### Game over

`isGameOver` short-circuits when the board is not full — if there is an empty cell
there is always a legal move. Once full, it rebuilds a value grid and checks each
cell against its right and down neighbours; one equal pair anywhere means a merge is
still available. Only when no pair exists is the run over.

Checking right and down only is sufficient — every adjacent pair is covered exactly
once from one side.

This app has **no win detection**. Reaching 2048 does not end the run, and a
finished run is always reported as a loss.

### Why the move is computed outside the updater

`applyMove` computes everything in its own body and then issues separate top-level
`setTiles` / `setNextId` / `setScore` calls.

React 19 StrictMode invokes state updaters **twice** in development. Any `setState`
nested inside another updater therefore runs twice — which would double-count the
score and double-advance `nextId`. Keeping the computation outside and each piece of
state in its own top-level update makes the double invocation harmless.

### Board geometry

`board-layout.ts` used to be a module of constants built on a fixed 80 px tile, with
the tile size, per-cell step and frame size hardcoded independently in `Tile.tsx` and
`Board.tsx` — so changing one silently broke the others. It is now one function:

```ts
boardLayout(cellSize) -> { tilePx, gapPx, stepPx, boardPx, paddingPx, framePx }
```

- `stepPx` = tile + 4 px gutter — the distance from one cell's origin to the next.
- `boardPx` = four steps minus the trailing gutter — the inner grid.
- `framePx` = the grid plus a 4 px inset on both sides.

`Board` renders the frame, then an **inner box that is exactly the grid**. That
inner box exists for a specific reason: absolutely-positioned children resolve
against their ancestor's *padding* box, so offsetting the tiles from the frame
directly would ignore the frame's padding and leave the gutter only on the right and
bottom. With the inner box, every gutter is equal.

### Tile appearance

The colour ramp is eleven theme tokens (`bg-tile-2` … `bg-tile-2048`) plus a
`tile-max` for anything beyond 2048, which is reachable in real play. They are
defined in `src/index.css`, not duplicated from the shared theme.

Font size is a **ratio of the tile**, not a Tailwind size class:

| Value | Font size |
| --- | --- |
| < 128 | 45% of the tile |
| 128 – 1023 | 37.5% |
| 1024 – 16383 | 30% |
| ≥ 16384 | 24% |

It used to be four fixed classes chosen against an assumed 80 px tile. Once the tile
is measured, the *ratio* has to be the constant or five digits overflow a small board.

### Fitting the viewport

The page is a three-row grid — HUD, board, New Game — inside `h-dvh`, where only the
board row flexes. The game cannot outgrow its viewport by construction.

`h-dvh` rather than `min-h-screen` matters specifically because inside the
storefront's iframe **the viewport is the iframe**; a min-height taller than it was
what grew a scrollbar.

The board row carries `min-h-0` and `min-w-0`, and the outer grid uses `grid-cols-1`
(which resolves to `minmax(0, 1fr)`). A grid item's automatic minimum is its
content, so without all three a board sized at a wide viewport props its own frame
open and never re-fits when the window narrows.

`useBoardFit` measures that row and returns an integer `cellSize`, capped at 80 px —
what the board used to be pinned at, so a desktop board is exactly the size it always
was. It is told the gutters via `gapTotal: TILE_GAP_PX * (BOARD_SIZE + 1)` — one
between each pair of tiles plus the inset on both edges. 2048 passes `min: 0`: it
must always show the whole board, so the fit always wins and it never pans.

Tiles are held back until `cellSize > 0`, so nothing is painted at the wrong size and
then corrected.

Game over is an overlay **on** the board — a translucent scrim with the message
centred — rather than a row beneath it. The old layout kept an always-mounted empty
`role="status"` paragraph so the live region existed before the message arrived; an
overlay that mounts on game over is announced by `role="status"` on mount just as
well, and it no longer reserves a row of height.

### Input

| Input | Notes |
| --- | --- |
| Arrow keys | `preventDefault`, or they scroll the embedding page |
| Swipe | Anywhere on the board frame, via shared `useSwipe` |

Both funnel into `applyMove`. `SwipeDirection` and this app's `Direction` have the
same four members, so a swipe maps straight through with no lookup table to keep in
sync.

The board frame carries `touchAction: "none"` so a swipe is not stolen by the
browser's own scroll gesture.

### Talking to the storefront

2048 posts three kinds of message up through `shared/game-score.ts`:

| Message | When | Recorded? |
| --- | --- | --- |
| `ready` | Once on mount | No |
| `progress` | Whenever the score changes, including the reset to 0 on a new game | No |
| `final` | Once when the board locks up, `outcome: "lost"` | Yes |

2048 reports `{ kind: "points", betterIs: "higher", label: "Score" }`.

Every emitter is latched behind a ref, because StrictMode mounts effects twice in
development and each message must fire exactly once per real transition. `progress`
additionally compares against the last reported score, so a re-render with an
unchanged score posts nothing.

Theme arrives as `?theme=dark|light` on the iframe URL and is applied by
`shared/game-theme.ts` before React renders — a cross-origin iframe cannot see the
storefront's `.dark` class. Opened standalone there is no parameter, so it follows
the OS preference.

## Dependencies

| Dependency | Purpose |
| --- | --- |
| `react`, `react-dom` 19 | UI |
| `tailwindcss` 4 + `@tailwindcss/vite` | Styling, via the CSS-first `@theme` block |
| `../../shared/theme.css` | The playroom design tokens |
| `../../shared/game-score.ts` | The score envelope posted to the storefront |
| `../../shared/game-theme.ts` | Applies `?theme=` inside the iframe |
| `../../shared/use-board-fit.ts` | Measures the frame, returns an integer cell size |
| `../../shared/use-swipe.ts` | Turns drags into cardinal directions |

The tile colour ramp lives in `src/index.css` on top of the shared layer. Never
duplicate a shared token here.

## Configuration

| Setting | Where | Purpose |
| --- | --- | --- |
| `VITE_STOREFRONT_ORIGIN` | Build arg / SWA config | Origin the score messages are posted to. Falls back to `*` so the game still works standalone. |

## Links

- [Mini Steam repository README](../../README.md)
- [ADR 002 — unified game scoring](../../docs/decisions/002-unified-game-scoring.md)
- [ADR 003 — shared design tokens](../../docs/decisions/003-shared-design-tokens.md)
- [ADR 004 — React hooks in `shared/`](../../docs/decisions/004-shared-react-hooks.md)
- Standards: https://github.com/paurodriguez0220/standards-docs

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-10*
*Standards: https://github.com/paurodriguez0220/standards-docs*
