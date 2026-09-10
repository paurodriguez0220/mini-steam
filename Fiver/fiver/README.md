# Fiver

Guess the five-letter word, then do it again. A run is a **streak** — keep solving until
you miss one. Three difficulties, and a draw-free scoreboard where the number that counts
is how many words you got. It runs standalone or embedded in the Mini Steam storefront's
iframe.

> Fiver is **not** Wordle. Wordle is a New York Times trademark; no NYT word list, styling
> or branding is used here. The word data comes from SCOWL — see
> [Word data](#word-data).

## Getting Started

Prerequisites: Node 20.19+ and npm. Run every command from this folder (`Fiver/fiver`),
**not** from `Fiver/`.

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

The whole stack also runs in Docker from the repository root — `./scripts/up.ps1` puts
Fiver on http://localhost:5178.

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
| `npm test` (repo root) | Run this app's unit tests, plus the others |
| `node scripts/build-words.mjs <scowl>/final` | Regenerate the word pools |

Tests live beside the code in `src/utils/*.test.ts` but are collected and run by the
**root** Vitest harness, not from this folder.

## Architecture

Two design problems sit between "guess a word" and "a game that belongs on a
leaderboard", and the whole design follows from them.

**A single puzzle is unrankable.** It scores 1–6 and nothing else, which is the same
wall-of-ties problem tic-tac-toe had. So **a run is a streak**: solve words back to back
until you miss one, and the score is how many you solved.

**A streak has an exit problem.** On easy, a strong player may simply never fail — they
close the tab mid-streak and record nothing, so the leaderboard would quietly
under-report exactly the people it should rank highest. Hence the explicit **End run**
button, which banks the current streak. A run ends in exactly one of two ways: a missed
word, or a banked one.

```
App
└── GameContainer      run state, current word, input, score reporting
    ├── RunBar         streak, guesses left, difficulty, End run
    ├── TileGrid       5 x N tiles
    │   └── Tile       one letter (x 5N)
    ├── Keyboard       on-screen QWERTY with per-letter state
    └── WordResult     the between-words overlay
```

### Files

| File | Responsibility |
| --- | --- |
| `src/components/GameContainer.tsx` | Run and word state, guess submission, score messages |
| `src/components/RunBar.tsx` | Streak, guesses remaining, difficulty, End run |
| `src/components/TileGrid.tsx` | The 5 × N board |
| `src/components/Tile.tsx` | One letter tile and its mark |
| `src/components/Keyboard.tsx` | On-screen QWERTY, Enter and Backspace |
| `src/components/WordResult.tsx` | The between-words overlay |
| `src/utils/marking.ts` | `markGuess`, `keyboardStateFor` |
| `src/utils/words.ts` | Answer selection and guess validation |
| `src/utils/config.ts` | Difficulties, guesses per tier, word length |
| `src/data/words.ts` | The two generated word pools (**generated — do not edit**) |
| `src/data/SCOWL-COPYRIGHT.txt` | The vendored licence notice |
| `scripts/build-words.mjs` | Regenerates `data/words.ts` from a SCOWL distribution |

### Difficulty

Difficulty is **the number of guesses you get per word** — the cleanest knob this game
has, because it changes how much deduction you can afford without touching the word pool.
Every tier is playing the same game.

| Difficulty | Guesses |
| --- | --- |
| `easy` | 6 |
| `medium` | 5 |
| `hard` | 4 |

Each tier ranks separately, so a streak of 3 on hard never competes with 20 on easy.

---

## How it works

### Marking a guess

This is the subtle part, and the reason the game earns its tests. Marking needs **two
passes**:

1. Mark every exact-position match `correct`, and **decrement that letter's remaining
   count** in the answer.
2. Only then walk the rest; a letter is `present` if the answer still has an unconsumed
   instance, otherwise `absent`.

A single left-to-right pass gets repeated letters wrong. Guessing `ALLOY` against `LLAMA`
must mark only as many `L`s as `LLAMA` still has once the correctly-placed one is
accounted for — a naive pass marks both and tells the player there are two misplaced
`L`s when there is one.

The tests cover the four repeat shapes: repeated in the guess only, repeated in the
answer only, repeated in both, and an exact match. There's also a property test asserting
no letter is ever marked non-absent more times than the answer actually contains it.

### The keyboard

Each key shows the **best** thing known about its letter, and that ranking never
regresses: `correct` > `present` > `absent` > unknown. A letter shown green in the first
guess must not drop back to grey because a later guess played it in the wrong place.

`keyboardStateFor` recomputes the whole map from all guesses rather than mutating as it
goes, so the keyboard cannot drift out of step with the board.

The keyboard is sized in `rem` and flex fractions, **not** from the measured board. A
keyboard that scaled with the tiles would shrink to unusable keys on a short viewport,
which is backwards: on a phone the keyboard is the floor and the board takes what's left.

A physical keyboard is also bound, so the game is fully playable on a desktop.

### A rejected guess never costs a turn

`rejectGuess` returns *why* a guess is invalid rather than a boolean, because "not enough
letters" and "not in word list" need different messages. Either way the guess is refused
before it is scored — the row shakes, a toast appears for 1.2s, and the guess counter does
not move. A typo is not a play.

### Word data

**Source:** SCOWL 2020.12.07 by Kevin Atkinson — http://wordlist.aspell.net/

**Licence:** permission to "use, copy, modify, distribute and sell these word lists […]
for any purpose is hereby granted without fee, provided that the above copyright notice
appears in all copies". The notice is vendored at `src/data/SCOWL-COPYRIGHT.txt`, beside
the data rather than only in this README, so it cannot be lost in a refactor.

SCOWL grades words into frequency buckets, which is exactly what separates a fair answer
from an obscure one:

| Pool | Size | Derived from |
| --- | --- | --- |
| Answers | 2,258 | buckets 10/20/35, five letters, minus inflections |
| Valid guesses | 16,915 | every bucket, five letters |

**The inflection filter.** A word is dropped from the *answers* if it ends in `s` and its
stem is itself a word — `aches`, `films`, `acids`. Guessing a trailing S is a cheap,
uninteresting strategy. Testing the stem rather than the final letter is what keeps
`atlas`, `chess`, `bliss`, `bonus` and `class` as answers. The heuristic isn't perfect and
drops a few legitimate words whose stem happens to be in SCOWL, but it errs toward a
smaller, better answer pool — and every dropped word is still a **valid guess**.

A test asserts every answer is in the guess list. Without it, the game could reject the
correct word as "not a word", which is the worst possible bug this game could have.

The pools are committed. `scripts/build-words.mjs` exists so the derivation is
reproducible and reviewable rather than an opaque blob.

### Fitting the viewport

The same mobile-first shape as the rest: `h-dvh` three-row grid — run bar, board,
keyboard — where only the board row flexes. `grid-cols-1` (which resolves to
`minmax(0, 1fr)`) plus `min-h-0` and `min-w-0` on that row, so a board sized at a wide
viewport can't prop its own frame open and fail to re-fit when the window narrows.

The board is 5 columns by *N* rows, where N is the guess allowance — so it is **not
square**. `useBoardFit` already takes independent `cols` and `rows`, so it needed no
change. Tiles cap at 62 px.

### Talking to the storefront

| Message | When | Recorded? |
| --- | --- | --- |
| `ready` | Once on mount | No |
| `progress` | After each solved word | No |
| `final` | Once, when the run ends — missed or banked | Yes |

The metric is `{ kind: "points", betterIs: "higher", label: "Streak" }` plus the
`difficulty`. `outcome` is `"won"` when the run was banked, `"lost"` when it ended on a
missed word.

Every emitter is latched behind a ref, because StrictMode mounts effects twice in
development.

Theme arrives as `?theme=dark|light` on the iframe URL and is applied by
`shared/game-theme.ts` before React renders.

## Dependencies

| Dependency | Purpose |
| --- | --- |
| `react`, `react-dom` 19 | UI |
| `tailwindcss` 4 + `@tailwindcss/vite` | Styling, via the CSS-first `@theme` block |
| SCOWL 2020.12.07 (vendored data) | The answer and guess word pools |
| `../../shared/theme.css` | The playroom design tokens |
| `../../shared/game-score.ts` | The score envelope posted to the storefront |
| `../../shared/game-theme.ts` | Applies `?theme=` inside the iframe |
| `../../shared/use-board-fit.ts` | Measures the frame, returns an integer cell size |

Mark colours, the key surface and the strong tile border live in `src/index.css` on top
of the shared layer. The greens and ambers are pulled from the shared mint and butter
rather than invented, so the board still belongs to the playroom.

## Configuration

| Setting | Where | Purpose |
| --- | --- | --- |
| `VITE_STOREFRONT_ORIGIN` | Build arg / SWA config | Origin score messages are posted to. Falls back to `*` so the game works standalone. |
| `GAME_FIVER_PORT` | `.env` | Host port for the compose service. Defaults to 5178. |
| `Seed:GameUrls:Fiver` | API config | URL the storefront embeds. Defaults to `http://localhost:5178`. |

## Deployment

`.github/workflows/deploy-fiver.yml` exists but **cannot run until the Azure resource is
created**:

1. Create an Azure Static Web App for this game.
2. Add its deployment token as the repository secret **`SWA_FIVER`**, in the `dev`
   environment.

Like the Tic Tac Toe workflow, this one also triggers on `shared/**`, since the app
compiles those files into its bundle.

## Links

- [Mini Steam repository README](../../README.md)
- [Design spec](../../docs/superpowers/specs/2026-09-10-fiver-word-game-design.md)
- [ADR 002 — unified game scoring](../../docs/decisions/002-unified-game-scoring.md)
- [ADR 003 — shared design tokens](../../docs/decisions/003-shared-design-tokens.md)
- [ADR 004 — React hooks in `shared/`](../../docs/decisions/004-shared-react-hooks.md)
- SCOWL: http://wordlist.aspell.net/
- Standards: https://github.com/paurodriguez0220/standards-docs

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-10*
*Standards: https://github.com/paurodriguez0220/standards-docs*
