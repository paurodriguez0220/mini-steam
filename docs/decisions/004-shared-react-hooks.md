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
