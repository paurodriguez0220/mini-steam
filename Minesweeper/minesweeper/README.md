# Minesweeper

The Win95 classic, rebuilt as a Mini Steam game: three difficulties, a first click
that is always safe, and a score measured in **elapsed seconds, where lower is
better**. It runs standalone or embedded in the Mini Steam storefront's iframe.

## Getting Started

Prerequisites: Node 20.19+ and npm. Run every command from this folder
(`Minesweeper/minesweeper`), **not** from `Minesweeper/`.

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

The whole stack (storefront + API + all three games) also runs in Docker from the
repository root — `./scripts/up.ps1` puts Minesweeper on http://localhost:5176.

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

Minesweeper is the odd one out of the three games in two ways, and both are
deliberate:

- **It measures time, not points.** Its metric is `seconds` with
  `betterIs: "lower"`, and it is the only game that reports a `difficulty` — a
  40-second win on easy and on hard are not the same achievement.
- **It never shrinks the board to fit.** Snake and 2048 always show the whole board;
  Minesweeper holds a tappable cell size and **pans** instead. See
  [Fitting the viewport](#fitting-the-viewport).

The board is a mutable `Cell[][]`, cloned on each interaction. The pure rules live in
`utils/board.ts` and mutate the array they are handed; the container clones first, so
state is never mutated in place.

```
App
└── GameContainer          state, reveal/flag handlers, clock, score reporting
    ├── TopBar             flag counter, timer, face button, difficulty select
    └── Board              the cell grid
        └── CellButton     one cell (× rows × cols)
```

### Files

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | All state, reveal/flag, the clock, score messages, the pan frame |
| `src/components/TopBar.tsx` | Readouts, restart face, difficulty `<select>` |
| `src/components/Board.tsx` | The cell grid; takes `cellSize` as a prop |
| `src/components/CellButton.tsx` | One cell — surface, content, click, right-click, long-press |
| `src/hooks/usePinchZoom.ts` | Two-finger zoom, app-local |
| `src/utils/board.ts` | Pure rules — create, place mines, count neighbours, flood reveal |
| `src/utils/config.ts` | The three difficulties and a type guard for the `<select>` |
| `src/types.ts` | `Cell`, `GameConfig` |
| `src/index.css` | The bevel tokens and `bevel-raised` / `bevel-inset` utilities |

### Difficulties

| Key | Grid | Mines |
| --- | --- | --- |
| `easy` | 9 × 9 | 10 |
| `medium` | 16 × 16 | 40 |
| `hard` | 16 × 30 | 99 |

`difficulty` is the single source of truth and `config` is derived from it. They used
to be two pieces of state kept in sync only by every caller remembering to pass both,
which let a score message disagree with the board it described.

---

## How it works

### Mines are placed on the first click, not on mount

An empty board is created up front with no mines at all. The first reveal calls
`placeMines(board, config, safeRow, safeCol)`, which rejects the clicked cell as a
candidate, then `calculateNumbers` fills in every neighbour count.

This is what makes **the first click always safe** — you can never lose on move one.

Two subtleties in `handleReveal`:

- The run starts only once we know the click actually reveals something. Doing it
  before the flag/already-revealed guard started the clock and placed mines on a
  board that was then discarded, whenever the first click landed on a flag.
- `placeMines` loops until it has placed `config.mines`, skipping duplicates and the
  safe cell. At the densest difficulty that is 99 mines in 480 cells, so rejection
  sampling is comfortably cheap.

### Revealing

`revealFlood` is an iterative flood fill over an explicit stack — not recursion,
which on a 16×30 board of zeros could nest deeply.

For each popped cell: skip it if it is already revealed or flagged, mark it revealed,
and **only if it has zero adjacent mines**, push all eight neighbours. That is the
classic cascade: clicking an empty region opens the whole region and stops at the
ring of numbered cells that borders it.

Flagged cells act as a wall, so a cascade will not blow past a flag you have planted.

Hitting a mine reveals that one cell, freezes the clock and ends the run.

### Winning

The win condition is `revealed === rows * cols - mines` — every non-mine cell
uncovered. Flags are irrelevant to it; you win by revealing, not by flagging
correctly.

This check currently lives in a `useEffect` keyed on the board, which re-runs on
every board change and re-sets `won` idempotently. That is why `final` is latched
behind `hasSentFinalRef` — emitting from there without a latch posts duplicates.

> **Known wart.** Deriving a terminal transition from an effect that watches the
> whole board is indirect: the reveal handler already knows it revealed something,
> so it could decide the win there and drop both the latch and the re-runs. Planned
> in [`docs/tasks/queue/fix-minesweeper-win-detection-effect.md`](../../docs/tasks/queue/fix-minesweeper-win-detection-effect.md).

### The clock

The displayed timer is **display-only**. A 250 ms interval (faster than 1 s, so the
whole second shown is never visibly stale) updates `elapsedSeconds` for the readout.

The reported time is never taken from that counter — it is always recomputed from
`startedAtRef`, the wall-clock moment of the first reveal. A throttled or
background-suspended interval therefore cannot lose seconds off a score.

### Flagging

| Input | Behaviour |
| --- | --- |
| Right-click | Toggles a flag (`contextmenu`, `preventDefault`ed) |
| Long press (450 ms) | Toggles a flag, with a 30 ms vibration where the API exists |

Flagging was originally bound to `contextmenu` alone — which a touch device has no
way to fire — so on a phone the game could be revealed but never flagged, and was
therefore unwinnable.

The long press handles three collisions carefully:

- **The click after the release is swallowed.** Otherwise a long press would flag the
  cell and then immediately reveal it.
- **Moving more than 10 px cancels the timer**, so panning the board does not flag
  whatever cell your finger started on.
- **A duplicate `contextmenu` is suppressed.** Some browsers raise it on a touch
  long-press too; the timer has already flagged by then, so firing again would toggle
  the flag straight back off.

Only a primary press arms the hold, so mouse right-click still takes the
`contextmenu` path untouched.

The flag counter is `mines − flags placed`. It is a counter, not a validator: it can
go negative-ish in spirit if you over-flag, and it never tells you whether a flag is
correct.

### The cells

`CellButton` is `aspect-square w-full`, so it takes its size entirely from the grid
column — `Board` sets `gridTemplateColumns: repeat(cols, ${cellSize}px)` and the
cells follow.

The Win95 look comes from two Tailwind utilities defined in `src/index.css`:

- `bevel-raised` — light top/left, dark bottom/right. An unrevealed cell.
- `bevel-inset` — the reverse. A revealed cell, and the board frame.

Neither sets a background; the caller pairs it with `bg-bevel-face`, so the
background is stated exactly once. `--bevel-width` lets a small cell wear a 1 px
version of the same bevel instead of the default 4 px.

The surface is chosen in three explicit branches (unrevealed / tripped mine /
revealed) rather than by appending an override class and relying on class-string
order to win — which is fragile.

Numbers 1–8 use the canonical Minesweeper colours as theme tokens with dark-mode
values. This replaced a chain of ternaries in which everything from 5 upward
collapsed to `text-black` — both wrong (canonical is 5 = maroon, 6 = teal, 7 = black,
8 = grey) and invisible on a dark surface.

### Fitting the viewport

This is where Minesweeper diverges from the other two games. All three call the same
`useBoardFit`; the different behaviour comes entirely from passing a **non-zero
`min`**:

```ts
useBoardFit({ cols, rows, gapTotal: BOARD_CHROME_PX, min: 32, max: 44 })
```

`fittedCellSize` clamps its result to `[min, max]`. When the honest fit falls below
`min`, it returns `min` — and the board ends up **wider than its frame**, which is
precisely the caller's cue to pan. A 30-column hard board on a 390 px phone would
otherwise mean ~13 px cells, far below a usable tap target.

So:

- **Easy on a phone** → the fit lands around 36 px, inside the range, and the whole
  board is visible.
- **Hard on a phone** → the fit would be ~11 px, so it clamps to the 32 px floor and
  the board pans inside its frame. The page itself never scrolls.

`gapTotal` accounts for the pan frame's and the card's padding — pixels that are not
cell. Without subtracting them, a 9-column easy board comes out a few pixels too wide
for a phone and pans when it did not need to.

The page is a two-row `h-dvh` grid: a fixed top bar and a flexing board frame. The
frame carries `overflow-auto`, `min-h-0` and `min-w-0`, and the outer grid uses
`grid-cols-1` (resolving to `minmax(0, 1fr)`). A grid item's automatic minimum is its
content, so without those a board sized at a wide viewport props its own frame open
and never re-fits when the window narrows.

The inner wrapper uses `py-1` rather than `p-1` deliberately: horizontal padding on
the element that also carries `min-w-full` rounds it a fraction past the frame's
client width, which is enough to show a horizontal scrollbar permanently on a board
that otherwise fits.

Cells are held back until `cellSize > 0`, so nothing is painted at the wrong size and
then corrected.

**Cells grow on desktop.** The 44 px ceiling is above the old fixed 30 px, so a
desktop board is visibly larger than it used to be. That is intentional and
on-message for mobile-first, but it is a real visual change.

### Pinch to zoom

The browser's own pinch zooms the whole page, which inside the storefront's iframe is
the wrong target and is blocked anyway. `usePinchZoom` therefore tracks the gesture
from raw pointer events and applies it as a `scale` transform on the board, clamped
to 0.6× – 2×.

Active pointers live in a **ref**, not state: a pinch fires `pointermove`
continuously, and re-rendering a 480-cell board on every one of those would drop
frames. Only the resulting scale is state.

The spread and scale at the moment the second finger lands are recorded as the
origin, and each move sets `scale = originScale × currentSpread / originSpread`.
Lifting a finger ends the pinch; the next one starts a fresh gesture from the scale
you finished at, so the zoom does not jump.

The hook stays in this app rather than `shared/` because only Minesweeper pans a
board. ADR 003 forbids *duplicating* it, not siting it locally while it has one
consumer — if a second game ever needs it, move it then.

### Talking to the storefront

Minesweeper posts messages up through `shared/game-score.ts`:

| Message | When | Recorded? |
| --- | --- | --- |
| `ready` | Once on mount, with the initial difficulty | No |
| `final` | Once per run, `outcome: "won"` or `"lost"` | Yes |

It reports `{ kind: "seconds", betterIs: "lower", label: "Time" }` plus the
`difficulty`, so the storefront ranks each difficulty separately. It is the only game
of the three that can report a win.

Unlike the other two, it posts no `progress` — a running clock is not a meaningful
mid-run score to broadcast.

Both emitters are latched behind refs, because StrictMode mounts effects twice in
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

Minesweeper does not use `shared/use-swipe.ts` — it has no swipe gesture; a drag
pans the board.

The bevel tokens and the number colours live in `src/index.css` on top of the shared
layer. Never duplicate a shared token here.

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
