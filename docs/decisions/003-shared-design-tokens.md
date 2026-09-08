# ADR-003: One shared token file, imported across app boundaries

**Date:** 2026-09-08
**Status:** Accepted

## Context

The storefront adopted the "playroom" design direction, and the three games were to adopt
the same look so the store and the games it embeds stop looking like four unrelated sites.

The four front-ends are four independent npm projects with no workspace configuration.
Each has its own `package.json`, its own `index.css`, its own Dockerfile and its own deploy
workflow. All four were already on Tailwind 4 with **zero configuration** - no
`tailwind.config`, no `@theme` block, no design tokens, and no dark mode anywhere.

The design direction existed only as a 1360-line stylesheet scoped to `.playroom-sample`,
using `--pr-*` custom properties, inside the storefront's sample folder.

Three ways to share it: copy the tokens into each app, introduce an npm workspace package,
or keep one file at the repository root that each app imports.

## Decision

**One `shared/theme.css` at the repository root, imported by each app's `index.css` via a
relative path.** The same approach is used for `shared/game-score.ts` (the score envelope,
see ADR-002) and `shared/game-theme.ts`.

The tokens are declared with Tailwind 4's `@theme`, so they generate utilities rather than
being referenced by hand: `bg-primary`, `text-ink-soft`, `rounded-lg`, `shadow-soft-2`,
`font-display`, `ease-spring`, `animate-pop-in`. Dark mode is a single `.dark` block
overriding the same variables, which means components use plain token utilities and need
almost no `dark:` prefixes.

An npm workspace was rejected as too much structural change for the benefit: it would
rewrite four Dockerfiles, four deploy workflows and the local dev commands, to solve a
problem that one file solves. Copying the tokens three times was rejected because they
will drift the first time a colour changes.

**This forced a build-context change.** A relative import that climbs above the app folder
is outside a folder-scoped Docker build context, so every SPA image failed to build. All
four SPAs now build with `context: .` and an explicit `dockerfile:` path, matching what the
API already did, and each Dockerfile copies `shared/` alongside its own app folder. The
per-app `.dockerignore` files are now inert - the root one applies.

Two smaller findings worth recording, because both fail silently:

- **The Google Fonts `@import` cannot live in `shared/theme.css`.** CSS requires `@import`
  to precede all other rules, and by the time the shared file is inlined Tailwind has
  already emitted its own, so the browser drops it and the fonts never load. It lives at
  the top of each app's `index.css` instead.
- **A `/* ... */` comment inside a comment** ends it early. The first version of the shared
  file documented its own usage with a nested comment and failed to parse.

## Consequences

**Easier.** One place to change a colour, a radius or a shadow, and all four apps follow.
Dark mode arrived in the three games for free, having never existed in any of them. Each
game keeps its own identity by defining game-specific tokens in its own `index.css` on top
of the shared layer - 2048's tile ramp, Minesweeper's bevel, Snake's checkerboard - so
coherence did not cost recognisability.

**Harder.** The apps are no longer independently buildable from their own folder: `docker
build` must run from the repository root, and anything that copies a single app directory
elsewhere will break. The relative import depth (`../../../shared/...`) is identical for
all four apps today only because they all sit two levels deep; a new app at a different
depth needs a different path. TypeScript and Vite both resolve these paths correctly, which
was verified with a deliberate type error to confirm `tsc` really checks the shared module
rather than skipping it.

**Escape route.** If the repository ever gains a workspace, `shared/` becomes a package
with no change to its contents - only the import specifiers change, from a relative path to
a package name.

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-08*
*Standards: https://github.com/paurodriguez0220/standards-docs*
