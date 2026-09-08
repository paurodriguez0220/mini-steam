# ADR-002: Unified game scoring by native metric, not a normalised number

**Date:** 2026-09-08
**Status:** Accepted

## Context

The three games each run in their own cross-origin iframe inside the storefront. Before
this change none of them had any connection to it: `postMessage` appeared nowhere in the
repository, the storefront had no message listener, and no game persisted anything. There
was no leaderboard, and no contract to retrofit.

The obstacle to a single leaderboard is that the three metrics are not comparable, and not
merely differently scaled.

| Game | Metric | Typical range | Direction |
| --- | --- | --- | --- |
| Snake | food eaten | 0-50 | higher is better |
| 2048 | sum of merged tile values | 1,000-20,000 | higher is better |
| Minesweeper | elapsed seconds | 20-600 | **lower is better** |

Minesweeper drives most of the difficulty. Its natural metric runs the opposite direction
to the other two, it is stratified across three presets whose boards differ by a factor of
almost six in cell count (9x9/10 mines, 16x16/40, 16x30/99), and it had **no score and no
timer at all** - the metric did not exist in code and had to be built.

Two of the three games also computed their score inside a `setState` updater, which React
19 StrictMode invokes twice in development. Any score read out of those games was liable to
be double-counted, so this had to be fixed before a score was worth recording.

## Decision

**A score reports its own metric, its own direction and its own difficulty. Nothing is
normalised.** Leaderboards are per game, and per difficulty where the game has them.

The envelope lives in `shared/game-score.ts`, imported directly by all four apps via a
relative path so it cannot drift between them:

```ts
{ source: "ministeam-game", version: 1,
  type: "ready" | "progress" | "final",
  game: "2048" | "snake" | "minesweeper",
  metric: { kind: "points" | "seconds", value: number,
            betterIs: "higher" | "lower", label: string },
  difficulty?: string,
  outcome?: "won" | "lost" }
```

Only `final` is persisted. `ready` and `progress` drive the live HUD and are discarded.

The API stores these fields as short lowercase strings rather than C# enums. The reason is
concrete rather than stylistic: the API registers no `JsonStringEnumConverter`, so an enum
would serialise as an integer and silently break the TypeScript union above.

Two rules are enforced server-side. `points` must arrive with `higher` and `seconds` with
`lower`, so a client cannot invert a board by mislabelling a metric. And on a
lower-is-better board the query filters to wins - otherwise stepping on a mine after three
seconds would permanently outrank every genuine Minesweeper win.

Trust boundaries: a game posts to the origin in `VITE_STOREFRONT_ORIGIN`, and the
storefront validates `event.origin` against the origins of the games in its own catalogue,
so the allow-list cannot drift from the iframe sources. Submission requires the JWT the
storefront already holds.

`ScoresController` deliberately does **not** inherit `GenericController<TEntity, TDto>`,
which the rest of the API uses. A score is an append-only historical fact, and the generic
surface would publish `PUT` and `DELETE` over anyone's score with no ownership check, an
uncapped dump of the whole table, and a `POST` taking the read DTO that lets the caller set
`UserId` and `AchievedAt` directly. `IService<Score, ScoreDto>` is intentionally left
unregistered, because that registration is what invites the generic controller back.

## Consequences

**Easier.** Each game reports the truth about itself, so nothing needs re-tuning when a
game's scoring changes. Minesweeper's three difficulties rank separately, which is both
correct and what players expect. Adding a fourth game means implementing one interface and
adding a slug - no normalisation curve to invent or justify.

**Harder.** There is no single cross-game "top players" board, which was the explicit
trade. If one is ever wanted, the raw native values are all stored, so a normalisation can
be derived server-side later without touching the games.

**Known gaps, deliberately not solved here.**

- Metric kind and direction arguably belong on `Game` rather than on every `Score` row.
  Storing them per row lets rows for one game disagree, and forces the leaderboard to read
  the newest row to learn how to sort. Worth revisiting.
- The board returns the best N *runs*, so one strong player can occupy several rows.
  Steam-style "best per user" needs a group-by.
- The API cannot distinguish a real run from a fabricated `POST`. Rate limiting is global,
  with no per-user submission throttle. Anti-cheat is out of scope for a portfolio app, but
  the leaderboard should not be read as tamper-proof.
- Leaderboards require authentication, consistent with the rest of the API. A public board
  would be a one-attribute change, but it should be a deliberate one.

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-08*
*Standards: https://github.com/paurodriguez0220/standards-docs*
