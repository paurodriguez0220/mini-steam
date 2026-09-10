# Tic Tac Toe — Design

**Goal:** Add a fourth Mini Steam game — tic-tac-toe against an AI — at full parity with
the existing three: its own deployable Vite app, a compose service, a storefront listing
and a real leaderboard entry.

**Date:** 2026-09-10

---

## The problem this design has to solve

Tic-tac-toe has no natural score, and against a perfect opponent every game is a draw.
A naive port would put an unrankable game on a leaderboard. Two decisions fix that:

1. **A run is a best-of-5 match, not a single game.** Win = 3, draw = 1, loss = 0, so a
   match scores 0–15 and terminates naturally, which gives an honest `final` message.
2. **A draw is worth a point.** This is what keeps `hard` meaningful: against unbeatable
   minimax the ceiling is 5 draws = 5 points, and since the score contract already ranks
   per `difficulty`, that sits on its own board rather than competing with a 15 on easy.

## Game rules

- 3×3 board. The player is X, the AI is O.
- A match is **5 rounds**. The match score is `wins * 3 + draws * 1`.
- **The opening move alternates by round** — the player opens rounds 1, 3 and 5; the AI
  opens 2 and 4. Moving first is a real advantage and alternating shares it. The odd
  round count leaves a slight edge with the player, which is the right way round for a
  friendly portfolio game.
- Difficulty is chosen before the match and locked for its duration. Changing it starts
  a fresh match.
- After round 5 the match is over and the run is reported.

## The AI

One interface, three strategies, in a pure `src/utils/ai.ts` with no React import:

```ts
chooseMove(board: Board, aiMark: Mark, difficulty: DifficultyKey): number
```

| Difficulty | Strategy |
| --- | --- |
| `easy` | Uniform random choice among empty cells. |
| `medium` | Take an immediate win; otherwise block an immediate loss; otherwise random. Beatable by a fork. |
| `hard` | Full minimax, depth-preferring so it wins as early and loses as late as possible. Unbeatable. |

Minimax over 3×3 is cheap enough to run unmemoised — the empty board is the worst case
and is still well under a frame.

`medium` is deliberately one ply deep. It is the tier that should feel like a careless
human: it never hangs a win, but it walks into forks.

## Testing

The AI and the win detection are pure functions, which makes this **the first app logic
in the repository that is genuinely unit-testable**. The root Vitest harness currently
only collects `shared/**/*.test.ts`; its `include` is extended to also collect
`TicTacToe/tictactoe/src/**/*.test.ts`.

Tests to write:

- `winnerOf` finds all eight lines, reports a draw on a full board, and `null` while the
  game is live.
- `hard` never loses: play it against every legal opponent sequence from an empty board
  and assert the player never wins.
- `hard` takes an immediate win when one exists, and blocks one when it must.
- `medium` blocks an immediate threat and takes an immediate win.
- `easy` only ever returns an empty cell.

## Scoring contract

`shared/game-score.ts` — `GameId` is a closed union and gains `"tictactoe"`.

| Field | Value |
| --- | --- |
| `metric.kind` | `"points"` |
| `metric.betterIs` | `"higher"` |
| `metric.label` | `"Score"` |
| `difficulty` | `"easy" \| "medium" \| "hard"` |

| Message | When |
| --- | --- |
| `ready` | Once on mount |
| `progress` | After each round, with the running match score |
| `final` | Once, after round 5 |

`outcome` on the final is `"won"` when the player won more rounds than the AI, otherwise
`"lost"`. Draws count toward neither.

All emitters are latched behind refs — StrictMode mounts effects twice in development.

## Layout

The same mobile-first shape the other three now use:

- `h-dvh` three-row grid — HUD, board, controls — where only the board row flexes.
- `grid-cols-1` on the outer grid (resolves to `minmax(0, 1fr)`) plus `min-h-0` and
  `min-w-0` on the board row, so a board sized at a wide viewport cannot prop its own
  frame open and fail to re-fit when the window narrows.
- `useBoardFit({ cols: 3, rows: 3, min: 0, max: 110 })`. Three columns are comfortably
  past a 44px tap target at any phone width, so it never needs to pan.
- Cells are held back until `cellSize > 0`.

Input is tap only. No swipe and no D-pad — the shared `use-swipe` module is not used.

## Components

```
App
└── GameContainer      match state, round flow, AI turn, score reporting
    ├── MatchBar       round counter, running score, difficulty select, new match
    ├── Board          the 3x3 grid
    │   └── Cell       one square (x 9)
    └── RoundResult    the between-rounds overlay
```

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | Match and round state, AI scheduling, score messages |
| `src/components/MatchBar.tsx` | Round `n/5`, running score, difficulty, new match |
| `src/components/Board.tsx` | The grid; takes `cellSize` |
| `src/components/Cell.tsx` | One square — mark, win highlight, tap |
| `src/components/RoundResult.tsx` | Overlay between rounds and at match end |
| `src/utils/game.ts` | `emptyBoard`, `winnerOf`, `isFull`, `WINNING_LINES` |
| `src/utils/ai.ts` | `chooseMove` and the three strategies |
| `src/utils/config.ts` | Difficulty keys, `ROUNDS_PER_MATCH`, points table |
| `src/types.ts` | `Mark`, `Cell`, `Board`, `RoundOutcome` |
| `src/index.css` | X/O mark colours on top of the shared theme |

The AI's move is scheduled on a short timer rather than applied synchronously, so the
player sees their own mark land before the reply. The timer is cleared on unmount and on
a new match, and the board is locked while it is pending so a fast tap cannot move twice.

## Integration

| Surface | Change |
| --- | --- |
| `docker-compose.yml` | `game-tictactoe`, root build context, port `${GAME_TICTACTOE_PORT:-5177}` |
| `.env.example` | `GAME_TICTACTOE_PORT=5177` |
| `TicTacToe/tictactoe/Dockerfile` | Mirrors Snake's — root context, `npm ci` layer first |
| `TicTacToe/tictactoe/nginx-spa.conf` | Copied from Snake |
| `DevelopmentSeeder.cs` | Game row, URL from `Seed:GameUrls:TicTacToe`, plus seed scores |
| `GameCover.tsx` | A `grid` cover scene, so it is not the only game on the `initials` fallback |
| `vitest.config.ts` | `include` extended to the app's tests |
| `.github/workflows/deploy-tictactoe.yml` | Mirrors `deploy-snake.yml` |
| `CLAUDE.md` | Architecture table, structure tree, ports |
| `TicTacToe/tictactoe/README.md` | Same shape as the other three game READMEs |

**Out of scope:** the `.sln` / `.esproj` Visual Studio scaffolding the other games carry.
It is not needed to build, test or deploy.

**Deployment is written but not live.** The workflow cannot run until an Azure Static Web
App exists and its deployment token is added as a repository secret. The exact names
required are recorded in the README and reported at the end of the work.

## Consequences

- `shared/game-score.ts` becomes a four-member union. Any exhaustive `switch` over
  `GameId` elsewhere must handle the new member — `tsc` will find them.
- The repository gains its first app-level tests, which slightly widens what `npm test`
  at the root covers. The other three apps remain untested.
- A fourth game means a fourth image in the compose build, so a cold
  `./scripts/up.ps1` gets marginally slower.

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-10*
*Standards: https://github.com/paurodriguez0220/standards-docs*
