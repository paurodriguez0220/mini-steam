# Fiver — Design

**Goal:** Add a fifth Mini Steam game — a five-letter word deduction game — at full parity
with the other four. It opens a new **Word** category and is the first game with an
on-screen keyboard and a bundled data set.

**Date:** 2026-09-10

---

## Naming

The game is called **Fiver**. It is deliberately *not* called Wordle, which is a
New York Times trademark. No NYT word list, styling or branding is used; the word data
comes from SCOWL (see below) and the visual design is the existing playroom system.

## The problem this design has to solve

Same shape as tic-tac-toe: the obvious version of the game is unrankable. A single
puzzle scores 1–6, which is a wall of ties.

**A run is a streak.** The player solves words back to back until they fail one. The
score is the number of words solved — `points`, higher is better.

**Difficulty is the number of guesses allowed**, which is the cleanest knob this game
has:

| Difficulty | Guesses per word |
| --- | --- |
| `easy` | 6 |
| `medium` | 5 |
| `hard` | 4 |

Each tier ranks separately, so a streak of 3 on hard never has to compete with 20 on
easy.

### The banking problem

A streak only ends when the player fails a word — but on `easy` a strong player may
simply never fail. They would close the tab mid-streak and record **nothing**, so the
leaderboard would systematically under-report the best players.

The game therefore has an explicit **"End run"** control that banks the current streak
as the final score. A run ends in exactly one of two ways: a failed word, or the player
banking it. Both post `final`.

## Word data

**Source:** SCOWL 2020.12.07, Kevin Atkinson — `http://wordlist.aspell.net/`.

**Licence:** permission to "use, copy, modify, distribute and sell these word lists […]
for any purpose is hereby granted without fee, provided that the above copyright notice
appears in all copies". The notice is vendored at `src/data/SCOWL-COPYRIGHT.txt` and
credited in the README.

SCOWL grades words into frequency buckets, which is exactly what separates a fair answer
from an obscure one:

| Pool | Size | Derived from |
| --- | --- | --- |
| Answers | ~2,261 | buckets 10/20/35 (common), five letters, minus inflections |
| Valid guesses | ~16,971 | all buckets, five letters |

For reference, the original game uses roughly 2,315 answers, so the pool is comparable.

**The inflection filter.** A word is dropped from the *answers* pool if it ends in `s`
and its stem is itself a word — `aches`, `acids`, `films`. Guessing a trailing S is a
cheap, uninteresting strategy and the original game excludes plurals for the same reason.
Testing the stem rather than just the final letter is what keeps `atlas`, `chess`,
`bliss`, `bonus` and `class` in the pool. The heuristic is not perfect — it drops a
small number of legitimate words whose stem happens to appear in SCOWL — but it errs
toward a smaller, better answer pool, and inflected words remain **valid guesses**.

Every answer is guaranteed to be in the guess list; this is asserted in a test, not
assumed.

**Payload:** ~113 KB raw, ~40 KB gzipped, shipped as a generated TypeScript module. The
generator lives at `scripts/build-words.mjs` so the derivation is reproducible rather
than a mystery blob.

## The marking algorithm

The one genuinely subtle piece, and the reason this game is worth having in a repo with
a test harness. Marking a guess needs **two passes**:

1. Mark every exact-position match `correct`, and decrement that letter's remaining
   count in the answer.
2. Only then, walk the unmarked letters; a letter is `present` if the answer still has
   an unconsumed instance of it, otherwise `absent`.

A single pass gets repeated letters wrong. Guessing `ALLOY` against `LLAMA` must mark
only as many `L`s as `LLAMA` actually has left after the greens are taken.

```ts
markGuess(guess: string, answer: string): LetterMark[]   // "correct" | "present" | "absent"
```

Pure, DOM-free, and the core of the test suite:

- both words free of repeats — the easy case
- a letter repeated in the guess but appearing once in the answer
- a letter repeated in the answer but once in the guess
- repeats on both sides
- an exact match marks all five `correct`
- greens are always allocated before yellows

## Keyboard state

Each letter on the on-screen keyboard shows the **best** thing known about it, and that
ranking never regresses: `correct` beats `present` beats `absent` beats unknown. A
letter marked green in one guess must not fall back to grey because a later guess placed
it wrong. `mergeKeyboardState` is pure and tested.

## Components

```
App
└── GameContainer      run state, the current word, input, score reporting
    ├── RunBar         streak, guesses left, difficulty, End run
    ├── TileGrid       5 x N tiles
    │   └── Tile       one letter (x 5N)
    ├── Keyboard       on-screen QWERTY with per-letter state
    └── RoundResult    the between-words overlay
```

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | Run/word state, guess submission, score messages |
| `src/components/RunBar.tsx` | Streak, guesses remaining, difficulty, End run |
| `src/components/TileGrid.tsx` | The 5 x N board |
| `src/components/Tile.tsx` | One letter tile and its mark |
| `src/components/Keyboard.tsx` | On-screen QWERTY, Enter and Backspace |
| `src/utils/marking.ts` | `markGuess`, `mergeKeyboardState` |
| `src/utils/words.ts` | Answer selection, guess validation |
| `src/utils/config.ts` | Difficulties, guesses per tier, word length |
| `src/data/words.ts` | The two generated word pools |
| `src/data/SCOWL-COPYRIGHT.txt` | The vendored licence notice |

## Layout

The same mobile-first shape as the rest: `h-dvh`, `grid-cols-1`, `min-h-0` / `min-w-0`
on the flexing row.

The board is 5 columns by *N* rows where N is the difficulty's guess count, so it is
**not square** — `useBoardFit` already takes independent `cols` and `rows`, so it needs
no change. Tiles are capped at 62 px.

The keyboard is the new layout problem. It is a fixed-height row group at the bottom of
the grid, sized in `rem` rather than measured, because a keyboard that resizes with the
board would produce 20 px keys on a short viewport. On a phone it is the widest element
and sets the floor for the layout.

Physical keyboard input is also bound, so the game is fully playable on a desktop.

## Scoring contract

`shared/game-score.ts` — `GameId` gains `"fiver"`.

| Field | Value |
| --- | --- |
| `metric.kind` | `"points"` |
| `metric.betterIs` | `"higher"` |
| `metric.label` | `"Streak"` |
| `difficulty` | `"easy" \| "medium" \| "hard"` |

| Message | When |
| --- | --- |
| `ready` | Once on mount |
| `progress` | After each solved word |
| `final` | Once, when the run ends — failed word or banked |

`outcome` is `"won"` when the run was banked with at least one word solved, `"lost"`
when it ended on a failure. All emitters latched behind refs.

## Integration

| Surface | Change |
| --- | --- |
| `docker-compose.yml` | `game-fiver`, root build context, `${GAME_FIVER_PORT:-5178}` |
| `.env.example` | `GAME_FIVER_PORT=5178` |
| `Fiver/fiver/Dockerfile`, `nginx-spa.conf` | Mirror Tic Tac Toe's |
| `DevelopmentSeeder.cs` | Game row, `Seed:GameUrls:Fiver`, seed scores, category `Word` |
| `GameCover.tsx` | A `letters` cover scene |
| `vitest.config.ts` | `include` extended to this app's tests |
| `.github/workflows/deploy-fiver.yml` | Mirrors the Tic Tac Toe one, incl. the `shared/**` trigger |
| `CLAUDE.md`, README | Updated |

**Out of scope:** `.sln` / `.esproj` scaffolding; a daily-puzzle mode; hard mode in the
original's sense (forced reuse of revealed letters).

**Deployment is written but not live** — it needs an Azure Static Web App and a
`SWA_FIVER` secret, exactly as Tic Tac Toe needs `SWA_TICTACTOE`.

## Consequences

- First game with a bundled data set. ~40 KB gzipped is real but acceptable against a
  ~200 KB bundle, and it is static so it caches indefinitely.
- First third-party asset in the repository, so the repo now carries an attribution
  obligation. The notice is vendored beside the data rather than only in the README, so
  it cannot be lost in a refactor.
- A new `Word` category appears in the storefront filters.
- `GameId` becomes a five-member union.

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-10*
*Standards: https://github.com/paurodriguez0220/standards-docs*
