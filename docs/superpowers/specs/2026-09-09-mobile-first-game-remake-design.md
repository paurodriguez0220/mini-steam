# Mobile-first remake of the three games

*Date: 2026-09-09*
*Status: approved, not yet implemented*

## Problem

None of the three games size themselves to the viewport they are given. Every
one lays out at a fixed pixel size inside a `min-h-screen` wrapper, so inside
the storefront's play modal — where the iframe viewport is roughly 620x460 —
the content overflows and the iframe grows a scrollbar.

Measured in the running stack on 2026-09-09:

| Game | Cause |
| --- | --- |
| Snake | Board is `GRID_SIZE 20 x CELL_SIZE 30` = 600px fixed. Title, score pill, hint pill and `py-8` bring the column to roughly 800px inside a ~460px viewport. |
| 2048 | `GameContainer` sets `style={{ width: BOARD_FRAME_PX }}`; `board-layout.ts` derives every dimension from a fixed `TILE_PX = 80`. |
| Minesweeper | `overflow-auto` plus `w-max min-w-full`, deliberately, so the 30-column `hard` board stays reachable rather than being clipped by centring. |

Touch is worse than the scrolling. Snake and 2048 bind only `keydown`, so on a
phone they cannot be played at all. Minesweeper reveals on click but flags on
`contextmenu` only, so a phone player can reveal cells and can never flag one.

## Scope

Layout and input only. Game rules, art direction and the playroom look stay
exactly as they are. No mechanics change, no new features, no visual redesign
of the in-game HUD beyond what fluid layout requires.

## Approach

CSS owns the box; JavaScript owns the pieces.

A pure-CSS solution was considered and rejected for Snake. Its pieces derive
all their geometry from `size` in JavaScript — `cornerRadii(towardHead,
towardTail, size)`, `taperInset(indexFromTail, size)`, `HEAD_SCALE`, eye
placement and tongue length. Expressing those as percentages would mean
rewriting the geometry code that carries the documented bug fixes in
`docs/issues/defined/`, for no gain.

A `transform: scale()` wrapper was also rejected: it scales text, borders and
tap targets along with everything else, which is a zoom rather than a
responsive layout and defeats the point of going mobile-first.

So:

1. The board's outer box sizes itself in **CSS** with `aspect-ratio` and
   `min(100%, 100cqh)` inside a container query. It is therefore correct on
   first paint, with no measure-then-resize flash.
2. A **`ResizeObserver`** reads that box and yields an integer pixel
   `cellSize`, which feeds the existing pixel-based render code unchanged.

### New shared modules

Both live in `shared/`, per
[ADR 003](../../decisions/003-shared-design-tokens.md): anything shared belongs
in `shared/` only, never duplicated into an app.

**`shared/board-fit.ts`** — framework-agnostic, no DOM:

```ts
export interface BoardFitInput {
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  /** Smallest acceptable cell, in px. Pass 0 to always shrink to fit. */
  min: number;
  /** Largest useful cell, in px, so a wide desktop frame does not inflate the board. */
  max: number;
}

/** Integer px, so a cell boundary always lands on a device pixel. */
export function fittedCellSize(input: BoardFitInput): number;
```

`min` is what makes one function serve both behaviours. The result is clamped
to `[min, max]`, so when the honest fit falls below `min` the function returns
`min` and the board is then wider than its frame — which is precisely the
condition the caller pans under. Snake and 2048 pass `min: 0`, so the fit
always wins and they never pan. Minesweeper passes `min: 32, max: 44`, so it
pans exactly when the board cannot be shown at a tappable size. There is one
sizing function and one rule; the two behaviours fall out of the arguments.

Integer output matters: Snake paints its checkerboard with a repeating conic
gradient whose `background-size` must line up with absolutely-positioned
pieces. A fractional cell size puts a visible seam between them.

**`shared/use-board-fit.ts`** — a thin React hook over the above:

```ts
export function useBoardFit(opts: Omit<BoardFitInput, "frameW" | "frameH">):
  [React.RefObject<HTMLDivElement>, number];
```

**`shared/use-swipe.ts`** — pointer-events swipe detection, returning a
cardinal direction once a minimum distance is passed on the dominant axis.
Used by Snake and 2048.

### Architectural consequence

`shared/` currently holds only framework-agnostic TypeScript and CSS. Adding
React hooks introduces React as a shared dependency for the first time. All
four front-ends are React 19 and each compiles `shared/` through its own Vite
build, so it resolves cleanly, but the dependency direction is new. This gets
its own ADR — `docs/decisions/004-shared-react-hooks.md` — written alongside
the code.

The pure maths is deliberately split from the hook so the shared surface stays
testable without a DOM, and so a future non-React consumer is not blocked.

## Per-game design

Every `GameContainer` loses `min-h-screen` / `min-h-dvh` and becomes `h-dvh`
with `overflow: hidden` and a `grid-rows-[auto_1fr_auto]` layout — HUD, board,
controls. The board row is the only flexible one, so the game cannot exceed its
viewport by construction rather than by tuning.

### Snake

- Square board, `min(100%, 100cqh)`, `cellSize = floor(board / 20)`.
- The `CELL_SIZE` constant is deleted. `GRID_SIZE` stays 20 — the grid is part
  of the game's difficulty, not its layout.
- The board element is sized to exactly `cellSize * 20`, not to the raw frame,
  so the conic gradient stays aligned with the pieces.
- `Grid`, `SnakeSegment`, `SnakeHead` and `FoodBlock` are unchanged. `Grid`
  already accepts `cellSize` as a prop; only its source changes.
- The title, score pill and hint pill collapse into one compact HUD row so the
  board keeps the majority of the height on a phone.

### 2048

- Same fit rule, `cellSize = floor((board - 5 * gap) / 4)`.
- `board-layout.ts` changes from a module of constants to a
  `boardLayout(cellSize)` function returning the same derived values. Its
  current comment — *"The board is deliberately a fixed pixel size; a
  responsive board is a separate piece of work"* — is deleted, because this is
  that work.
- `Tile.valueTextClass` currently switches font size against an assumed 80px
  tile. It becomes a ratio of `cellSize` so four- and five-digit values still
  fit at any board size.

### Minesweeper

Minesweeper reaches a different outcome from the other two, through the same
function. Snake and 2048 must always show the whole board; Minesweeper must
always keep cells tappable. The `hard` board is 30 columns, which on a 390px
phone would mean ~12px cells — far below the ~44px minimum tap target.

- `useBoardFit({ cols, rows, min: 32, max: 44 })`, so cells sit at 44px where
  there is room and never shrink past 32px.
- Board width is `cellSize * cols`. When that exceeds the frame — which the
  container can test directly — the board sits inside a frame that **pans and
  pinch-zooms**. The page itself never scrolls.
- All three difficulties stay available on every device.

## Touch input

| Game | Touch |
| --- | --- |
| Snake | Swipe anywhere on the board, plus a D-pad below it rendered only when `(pointer: coarse)` matches. Both feed the existing `queueRef`, so the two-turn queue and the anti-reversal check are untouched. |
| 2048 | Swipe only, routed into the existing `KEY_TO_DIRECTION` handler path. |
| Minesweeper | Tap reveals. Long-press (450ms) flags, with `navigator.vibrate(30)` where supported. `contextmenu` keeps working on desktop. |

Snake's and 2048's boards get `touch-action: none` so a swipe never scrolls
anything. Minesweeper's pan surface gets `touch-action: pan-x pan-y
pinch-zoom`, which does not suppress the `pointerdown`/`pointerup` pair the
long-press timer needs, so panning and flagging do not fight.

Keyboard input keeps working everywhere and is not deprioritised — the D-pad
and swipe are additions, not replacements.

## Storefront changes

Two contained changes in `MiniSteamUI/ministeamui`:

- `PlayOverlay`'s `FRAME` constant becomes `aspect-3/4` below the `sm`
  breakpoint and keeps `aspect-4/3` at `sm` and above, so a phone in portrait
  gets a tall play area instead of a 4:3 letterbox. The existing height caps
  (`calc(100dvh - 136px)` and the `sm` variant) stay as they are — they are
  what keeps the whole dialog on screen.
- The footer hint stops claiming *"Arrow keys are already pointed at the
  game"* on touch devices, where it is untrue and unhelpful.

## Verification

This repository has no test suite; that is tracked separately in
`docs/tasks/queue/add-test-suites.md`. Verification for this work is therefore:

1. `npm run build` in all four front-end folders — this runs `tsc -b`, so it is
   a real type check, not just a bundle.
2. `./scripts/up.ps1 -Rebuild`, then drive each game in the browser:
   - embedded in the storefront modal and standalone,
   - at a desktop viewport and at a 390x844 phone viewport,
   - confirming no scrollbar appears in either context,
   - confirming swipe, the Snake D-pad, and Minesweeper long-press-to-flag.
3. Confirm the games still post `ready` / `progress` / `final` score messages,
   since the containers that own that logic are being restructured.

`shared/board-fit.ts` is a pure function with no DOM dependency, which makes it
the natural place for the repository's first unit tests. Adding them is not
part of this scope, but the module is deliberately shaped so they can be added
without refactoring.

## Out of scope

- Game rules, difficulty and features.
- Visual redesign of the in-game HUD beyond what fluid layout requires.
- The API, the leaderboard and the store pages.
- Building out the test suite.
