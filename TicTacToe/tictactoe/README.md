# Tic Tac Toe

Noughts and crosses against the machine, as a Mini Steam game: three AI difficulties, a
best-of-five match, and a score where **a draw is still worth a point**. It runs
standalone or embedded in the Mini Steam storefront's iframe.

## Getting Started

Prerequisites: Node 20.19+ and npm. Run every command from this folder
(`TicTacToe/tictactoe`), **not** from `TicTacToe/`.

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

The whole stack (storefront + API + all four games) also runs in Docker from the
repository root — `./scripts/up.ps1` puts Tic Tac Toe on http://localhost:5177.

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
| `npm test` (repo root) | Run this app's unit tests, plus `shared/`'s |

**This is the only game in the repository with tests.** Its rules and AI are pure
functions, so they are tested directly — see [Testing](#testing). Tests live beside the
code in `src/utils/*.test.ts` but are collected and run by the **root** Vitest harness,
not from this folder.

## Architecture

The interesting problems here are not the rules — tic-tac-toe is nine squares — they are
the two design problems that stand between "nine squares" and "a game that belongs on a
leaderboard":

1. **A single game is unrankable.** It scores 0, 1 or 3 and nothing else, so a
   leaderboard of single games is a wall of ties. A run is therefore a **best-of-five
   match** scoring 0–15.
2. **A perfect opponent can never be beaten.** So `hard` would be worth nothing if only
   wins scored. **A draw scores a point**, which makes 5/15 on hard a real result, and
   the score contract's per-difficulty ranking keeps it off easy's board.

Everything else follows from those two.

```
App
└── GameContainer      match state, round flow, the AI's turn, score reporting
    ├── MatchBar       round counter, running score, difficulty, restart
    ├── Board          the 3x3 grid
    │   └── Cell       one square (x 9)
    └── RoundResult    the between-rounds overlay
```

### Files

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | Match and round state, AI scheduling, score messages |
| `src/components/MatchBar.tsx` | Round `n/5`, running score, difficulty, restart |
| `src/components/Board.tsx` | The grid; takes `cellSize` |
| `src/components/Cell.tsx` | One square — mark, win highlight, tap |
| `src/components/RoundResult.tsx` | The overlay between rounds and at match end |
| `src/utils/game.ts` | Pure rules — `winnerOf`, `isFull`, `placeMark`, `WINNING_LINES` |
| `src/utils/ai.ts` | `chooseMove` and the three strategies |
| `src/utils/config.ts` | Difficulties, rounds per match, the points table, timings |
| `src/types.ts` | `Mark`, `Cell`, `Board`, `RoundOutcome` |
| `src/index.css` | Mark colours and the grid frame, on top of the shared theme |

---

## How it works

### A match, not a game

| | |
| --- | --- |
| Rounds per match | 5 |
| Win | 3 points |
| Draw | **1 point** |
| Loss | 0 points |
| Maximum | 15 |

**The opening move alternates by round.** The player opens rounds 1, 3 and 5; the AI
opens 2 and 4. Moving first in tic-tac-toe is a real advantage, and alternating shares
it. Five rounds means someone gets the extra opening — it is the player, which is the
right way round for a game on a portfolio.

Difficulty is chosen before a match and locked for its duration. Changing it starts a
fresh match, because a score made across two different opponents would mean nothing.

### The AI

`chooseMove(board, aiMark, difficulty)` is a pure function in `src/utils/ai.ts`. The
three tiers are meant to feel like three different people:

| Difficulty | Strategy | How it loses |
| --- | --- | --- |
| `easy` | Uniform random empty cell | Constantly. It will hand you a line. |
| `medium` | Take the win → block the loss → else random | To forks. It sees exactly one ply. |
| `hard` | Full minimax | It doesn't. |

`medium` is **deliberately one ply deep**. Looking two ahead would let it see forks,
which is what `hard` is for — the middle rung has to be beatable or the ladder has no
middle.

`hard` is plain minimax with no memoisation and no alpha-beta pruning. 3×3 is small
enough that the empty board — the worst case — still resolves well inside a frame, and
the unpruned version is markedly easier to read.

Its score is **depth-adjusted**: a win is `10 - depth` and a loss is `depth - 10`. That
makes it prefer to win as early as possible and lose as late as possible. Without it,
minimax treats every win as equal and will idle around a won position instead of
finishing — which looks like a bug even though the result is identical.

### Testing

The rules and the AI are pure and DOM-free, which is what makes them testable at all.

The load-bearing test is the one that asserts the whole premise of the scoring design:

> **`hard` never loses, against every legal line of play.**

It is exhaustive, not sampled — it walks every sequence the player can play against the
AI's chosen reply, from both openings, and asserts the player never reaches a won
position. If that test ever fails, a draw being worth a point stops being a design
decision and becomes a bug.

The rest cover `winnerOf` across all eight lines, draw-vs-live detection, and that each
tier takes an immediate win, blocks an immediate loss, and only ever returns a legal cell.

> **Note on the build.** `tsconfig.app.json` **excludes** `src/**/*.test.ts`. `vitest` is
> a dependency of the repository root, not of this app, and the deploy workflow only ever
> installs this folder — so type-checking the tests here would make `tsc -b` fail in CI on
> an import it cannot resolve.

### The round and match loop

State lives in `GameContainer` as a small machine:

| Phase | Meaning |
| --- | --- |
| `playing` | Accepting moves |
| `round-over` | Showing the round result; a timer starts the next round |
| `match-over` | Showing the final score; the run has been reported |

`applyMove` places a mark and decides what the board now means — win, draw, or carry on —
and both the player's move and the AI's go through it, so the scoring table is applied in
exactly one place.

**Every state update in `applyMove` is top-level.** Nesting them inside a `setBoard`
updater is the same trap [2048 documents](../../2048/2048/README.md#why-the-move-is-computed-outside-the-updater):
React 19 StrictMode invokes updaters twice, so a `setState` called from inside one is
enqueued twice and the round would bank its points twice.

The AI's reply is scheduled on a short timer rather than applied synchronously, so the
player sees their own mark land first — an instant reply reads as though the tap placed
both marks. The timer is cleared on unmount, and the board is locked while it is pending,
so a fast tap cannot move twice or land on a board that is about to be replaced.

### Fitting the viewport

The same mobile-first shape as the other three games: an `h-dvh` three-row grid — HUD,
board, status — where only the board row flexes.

`h-dvh` rather than `min-h-screen` matters because inside the storefront's iframe **the
viewport is the iframe**. The outer grid uses `grid-cols-1` (which resolves to
`minmax(0, 1fr)`) and the board row carries `min-h-0` and `min-w-0` — a grid item's
automatic minimum is its content, so without all three a board sized at a wide viewport
props its own frame open and never re-fits when the window narrows.

`useBoardFit` returns an integer `cellSize` capped at 110 px. Three columns clear a 44 px
tap target at any phone width, so this board passes `min: 0` and never needs to pan — it
only needs to stop growing on a desktop. Cells are held back until `cellSize > 0`.

Input is tap only. There is no swipe and no D-pad, so `shared/use-swipe.ts` is not used.

### Colour

X is the playroom red and O is the mint, so the two marks never rely on glyph shape
alone. Unlike Snake's board — which is deliberately identical in both themes — these
tokens **do** flip in `.dark`, because the marks sit on `surface`, which flips.

`--color-grid-frame` is this app's own token rather than 2048's `board-frame`. That token
is defined in 2048's `index.css` and does not exist here; game tokens are per-app on top
of the shared layer and are never borrowed across apps.

### Talking to the storefront

| Message | When | Recorded? |
| --- | --- | --- |
| `ready` | Once on mount | No |
| `progress` | After each round, with the running match score | No |
| `final` | Once, after round 5 | Yes |

The metric is `{ kind: "points", betterIs: "higher", label: "Score" }` plus the
`difficulty`, so each tier ranks on its own board.

`outcome` on the final is `"won"` when the player took more rounds than the AI, otherwise
`"lost"`. Five draws is a respectable 5 points on hard, but it is not a win.

Every emitter is latched behind a ref, because StrictMode mounts effects twice in
development. `progress` additionally compares against the last reported score, so a
re-render with an unchanged score posts nothing.

Theme arrives as `?theme=dark|light` on the iframe URL and is applied by
`shared/game-theme.ts` before React renders. Opened standalone there is no parameter, so
it follows the OS preference.

## Dependencies

| Dependency | Purpose |
| --- | --- |
| `react`, `react-dom` 19 | UI |
| `tailwindcss` 4 + `@tailwindcss/vite` | Styling, via the CSS-first `@theme` block |
| `../../shared/theme.css` | The playroom design tokens |
| `../../shared/game-score.ts` | The score envelope posted to the storefront |
| `../../shared/game-theme.ts` | Applies `?theme=` inside the iframe |
| `../../shared/use-board-fit.ts` | Measures the frame, returns an integer cell size |

## Configuration

| Setting | Where | Purpose |
| --- | --- | --- |
| `VITE_STOREFRONT_ORIGIN` | Build arg / SWA config | Origin the score messages are posted to. Falls back to `*` so the game still works standalone. |
| `GAME_TICTACTOE_PORT` | `.env` | Host port for the compose service. Defaults to 5177. |
| `Seed:GameUrls:TicTacToe` | API config | URL the storefront embeds. Defaults to `http://localhost:5177`. |

## Deployment

`.github/workflows/deploy-tictactoe.yml` exists but **cannot run until the Azure resource
is created**. To enable it:

1. Create an Azure Static Web App for this game.
2. Add its deployment token to the repository as the secret **`SWA_TICTACTOE`**, in the
   `dev` environment (the workflow declares `environment: dev`, matching the other games).

Unlike the other four workflows, this one also triggers on changes to `shared/**`, since
the app compiles those files into its bundle.

## Links

- [Mini Steam repository README](../../README.md)
- [Design spec](../../docs/superpowers/specs/2026-09-10-tic-tac-toe-design.md)
- [ADR 002 — unified game scoring](../../docs/decisions/002-unified-game-scoring.md)
- [ADR 003 — shared design tokens](../../docs/decisions/003-shared-design-tokens.md)
- [ADR 004 — React hooks in `shared/`](../../docs/decisions/004-shared-react-hooks.md)
- Standards: https://github.com/paurodriguez0220/standards-docs

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-10*
*Standards: https://github.com/paurodriguez0220/standards-docs*
