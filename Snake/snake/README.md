# Snake

The classic snake, rebuilt as a Mini Steam game: a 20×20 board, a snake that glides
rather than jumps between cells, and a score that is simply how much food it has eaten.
It runs standalone or embedded in the Mini Steam storefront's iframe.

## Getting Started

Prerequisites: Node 20.19+ and npm. Run every command from this folder
(`Snake/snake`), **not** from `Snake/`.

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

The whole stack (storefront + API + all three games) also runs in Docker from the
repository root — `./scripts/up.ps1` puts Snake on http://localhost:5175.

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

One React component owns the game (`GameContainer`), and everything below it is a
pure render of the state it is handed. Three patterns carry most of the weight:

- **Refs for the loop, state for the render.** The tick loop reads the snake, the
  food and the pending turns through refs, and writes state only to paint. This is
  what keeps the loop stable — see [The tick loop](#the-tick-loop).
- **One input funnel.** Keyboard, swipe and the on-screen D-pad all call the same
  `queueTurn`, so the turn-queue and anti-reversal rules cannot diverge per input.
- **Measured geometry.** Every dimension — corner radii, taper, head size, eye
  placement — is derived in JavaScript from one measured `cellSize`, supplied by the
  shared `useBoardFit` hook.

```
App
└── GameContainer          state, tick loop, input, score reporting
    ├── Grid               the board; checkerboard + piece layout
    │   ├── SnakeSegment   one body cell (× n)
    │   ├── SnakeHead      domed snout, eyes, flicking tongue
    │   └── FoodBlock      the apple
    └── DirectionPad       thumb controls, touch devices only
```

### Files

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | All state, the tick loop, input handling, score messages |
| `src/components/Grid.tsx` | The board box and the checkerboard; positions the pieces |
| `src/components/SnakeSegment.tsx` | One body cell — shape, shade, glide |
| `src/components/SnakeHead.tsx` | The head — dome, eyes, tongue, swivel |
| `src/components/FoodBlock.tsx` | The apple |
| `src/components/DirectionPad.tsx` | On-screen D-pad, hidden on `pointer: fine` |
| `src/utils/snake.ts` | Pure geometry and rules — collisions, tick speed, corner radii, taper, head angle |
| `src/hooks/usePrefersReducedMotion.ts` | Tracks the reduced-motion media query |
| `src/types.ts` | `Point` |
| `src/index.css` | Snake-only design tokens, on top of the shared theme |

---

## How it works

### The tick loop

One tick is one move. The loop reschedules itself with `setTimeout` rather than
running on an interval, because the snake speeds up as it grows and each gap has to
be computed fresh.

The important structural decision is that **the loop reads through refs and the
render reads through state**. A turn only pushes onto `queueRef`; it never sets
state. If it did, the effect holding the timer would tear down and reschedule,
which would desync the CSS transition from the real gap between ticks and visibly
break the glide.

The whole move is computed in the tick body, outside any state updater. Ending the
run and placing new food are then plain consequences of the tick rather than side
effects smuggled into a reducer — which also avoids React 19 StrictMode's
double-invoked updaters double-counting anything.

```
tick:
  apply at most one queued turn        ← two would let the snake round a corner
  compute nextHead                        into its own neck within one cell
  willGrow = nextHead is on the food
  body = willGrow ? snake : snake without its tail
  if wall(nextHead) or self(nextHead, body): end the run
  move; if willGrow, place new food
  schedule the next tick at tickMsFor(newLength)
```

The tail is excluded from the self-collision check on any tick where the snake is
*not* growing, because that cell is being vacated on the same tick. Moving into it
is only fatal while growing.

**Speed.** `tickMsFor(length)` starts at 140 ms per cell and subtracts 3 ms per
segment, with a floor of 80 ms. A long snake moves nearly twice as fast as a fresh one.

**The snake holds still until the first turn is queued.** Without that it would
begin walking on mount and hit a wall before the player had touched anything —
see
[`docs/issues/defined/snake-ends-immediately-without-input.md`](../../docs/issues/defined/snake-ends-immediately-without-input.md).

### Turning

Turns are queued, at most two deep. One is not enough — a turn pressed mid-tick
would be dropped — and more than two lets a flurry of presses commit to a path the
player has stopped watching.

Each new turn is validated against **the last turn already queued**, not the
direction the snake is currently facing. The queued one is what the snake will be
facing when this turn is applied. Checking the committed direction instead is what
let two quick presses double the snake back through its own neck.

A turn is rejected if it is the reverse of that facing, the same as it, or if the
queue is already full.

### Scoring

The score is **derived, not tracked**: `snake.length - 1`. The snake grows by
exactly one segment per apple and starts one segment long, so there is nothing to
keep in sync — and no way for a `setScore` nested in a `setSnake` updater to
double-count under StrictMode.

### Rendering the snake

The body is not a row of squares. Each segment computes its own corner radii from
one rule:

> A corner is rounded only when neither of the two edges meeting there touches a
> neighbour.

That single rule produces the entire body shape. A straight run comes out square on
all four corners and reads as one seamless tube; an elbow rounds on the outside of
the bend and stays sharp on the inside; the tail closes into a capsule; the head is
domed on its leading edge.

**Taper.** The last three segments pull in from the edges of their cells (26%, 15%,
6% per side) so the body narrows to a point. The inset is applied *across* the
segment, not along it, so which axis it affects depends on how that segment lies.

**Banding.** Alternating segments take a slightly deeper blue. The parity is
anchored to distance from the **tail**, not the head — that is the one of the two
that survives growth. Eating shifts every index up by one *and* the length by one,
so tail-relative parity is unchanged and the pattern does not flip.

**The head** is drawn at 1.12× the cell so it sits proud of the neck, and uses two
nested transforms on purpose: the outer element glides between cells, the inner one
rotates to face the direction of travel. Keeping them separate lets the swivel share
the tick duration without the two transforms fighting, and lets the eyes and tongue
be laid out once in "facing right" space instead of four times.

**Head angle** accumulates instead of wrapping to 0–359. Turning right from "facing
up" has to read as +90°, not as a 270° spin the long way round, so `nextHeadAngle`
always picks the equivalent of the target nearest to where the head already points.

**The checkerboard** is a single element painted with a repeating conic gradient,
not `gridSize²` positioned divs — a fast tick no longer re-renders 400 static nodes.
This is also why the cell size must be a whole number of pixels: a fractional cell
puts a visible seam between the gradient and the absolutely-positioned pieces.

### The glide

Movement is a plain CSS `transform` transition, with no animation loop. That works
because of a property of the render: the segment at index *i* takes over the cell
that index *i−1* held on the previous tick, and those are always adjacent. So one
transition per segment *is* exactly the correct one-cell step. Linear easing matched
to the tick duration keeps motion continuous across cell boundaries, and
`translate3d` keeps it on the compositor.

Under `prefers-reduced-motion: reduce` the tick duration is passed in as `0`, so the
snake snaps a whole cell per tick and the tongue stops flicking (a matching media
query in `index.css`).

### Fitting the viewport

The page is a three-row grid — HUD, board, controls — inside `h-dvh`, where only
the board row flexes. The game cannot outgrow its viewport by construction.

`h-dvh` rather than `min-h-screen` matters specifically because inside the
storefront's iframe **the viewport is the iframe**; a min-height taller than it was
what grew a scrollbar.

The board row carries `min-h-0` and `min-w-0`, and the outer grid uses `grid-cols-1`
(which resolves to `minmax(0, 1fr)`). A grid item's automatic minimum is its
content, so without all three a board sized at a wide viewport props its own frame
open and never re-fits when the window narrows.

`useBoardFit` measures that row and returns an integer `cellSize`, capped at 30 px —
what the board used to be pinned at, so a desktop board is exactly the size it
always was. Snake passes `min: 0`: it must always show the whole board, so the fit
always wins and it never pans.

Pieces are held back until `cellSize > 0`, so nothing is ever painted at the wrong
size and then corrected.

The status and game-over messages are overlaid **on** the board rather than stacked
above it. Stacked, they were part of what overflowed a short iframe; overlaid they
cost no layout height. Each sits in a wrapper that carries the inset as a
max-width bound, with the card itself shrink-wrapped — pinning both edges of the
card stretched it into a full-width banner.

### Input

| Input | Notes |
| --- | --- |
| Arrow keys | `preventDefault`, or they scroll the embedding page |
| WASD | No default worth suppressing |
| Swipe | Anywhere on the board, via shared `useSwipe` |
| D-pad | Touch only, hidden by `[@media(pointer:fine)]:hidden` |

All four funnel into `queueTurn`.

The D-pad hides itself in **CSS rather than JavaScript**, so it re-evaluates when a
mouse is plugged in or a hybrid device is rotated, and costs no render. It fires on
`pointerdown`, not `click`: at 80 ms per tick, the ~100 ms a click waits to settle
is most of a cell.

### Talking to the storefront

Snake posts three kinds of message up through `shared/game-score.ts`:

| Message | When | Recorded? |
| --- | --- | --- |
| `ready` | Once on mount | No |
| `progress` | Whenever the score changes | No |
| `final` | Once when the run ends, `outcome: "lost"` | Yes |

Snake reports `{ kind: "points", betterIs: "higher", label: "Score" }`. It has no
win state, so a finished run is always a loss.

Every emitter is latched behind a ref, because StrictMode mounts effects twice in
development and each message must fire exactly once per real transition.

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

Snake-specific colour tokens (snake blue, board greens, apple red) live in
`src/index.css` on top of the shared layer. Never duplicate a shared token here.

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
