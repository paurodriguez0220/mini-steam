# Promote the Playroom design to the storefront

*Date: 2026-09-08 - Status: approved - Branch: `feat/playroom-storefront`*

## Context

A previous session built four candidate design directions for the storefront under
`MiniSteamUI/ministeamui/src/samples/` (`marketplace`, `playroom`, `zine`, `atrium`),
each reachable at `/samples/:slug` through a `SampleChooser`. The root route `/` still
renders the original UI (`App` + `Sidebar` / `Header` / `MainContent`).

`playroom` is the chosen direction. This spec covers promoting it to the real storefront
and removing everything the choice makes redundant.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope | Full promotion, clean sweep | One UI, no dead code. Samples and the superseded components are deleted. |
| Styling | Rewrite `playroom.css` as Tailwind utilities | Matches the project's stated stack (Tailwind 4). Accepted cost: a large rewrite with visual-drift risk, mitigated below. |
| Navigation | Real routes | Detail pages and running games become shareable links; browser Back behaves as users expect. |

## Target structure

```
src/
  index.css              # Tailwind + @theme tokens + keyframes/gradient layer
  main.tsx               # /  /games/:id  /games/:id/play
  App.tsx                # shell: Nav + <Outlet/> + Footer, initApi on mount
  routes/
    StorePage.tsx        # hero + catalogue (search, category chips)
    GameDetailPage.tsx   # detail + related, hosts the play overlay
  components/
    Nav.tsx  HeroBanner.tsx  GameCard.tsx  GameCover.tsx
    GameDetail.tsx  PlayOverlay.tsx  NoticePanel.tsx
    LoadingSkeletons.tsx  icons.tsx
  hooks/                 # useTheme, useApi, useEnv - unchanged
  store/                 # useAppStore - unchanged
```

Each component keeps one job and a props-only interface, as it has in the sample:
`GameCard` renders one game, `GameCover` generates its cover art from `(title, id)`,
`PlayOverlay` owns the iframe and its focus/scroll side effects, `NoticePanel` renders
the error and empty states. `StorePage` and `GameDetailPage` are the only files that
read the store.

### Deleted

- `src/samples/` in full - all four directions, including `playroom` once its components
  have been converted (see *Migration order*).
- `src/pages/SampleBoot.tsx`, `src/pages/SampleChooser.tsx`, `src/pages/GameModal.tsx`
- `src/components/Sidebar.tsx`, `Header.tsx`, `Hero.tsx`, `MainContent.tsx`,
  `GameCard.tsx`, `GameFrame.tsx`, `GameIframe.tsx`, `GameHUD.tsx`, `GameHeader.tsx`
- Any file in `src/assets/` left unreferenced once those components are gone
  (`2048.jpg`, `nintendobackground.png`, `react.svg` are candidates - verify each with a
  grep before deleting).

## Styling

The sample's `--pr-*` custom properties move into an `@theme` block in `index.css` as
Tailwind theme variables, so they generate utilities rather than being referenced by hand:

| Sample token | Tailwind theme variable | Generated utility |
| --- | --- | --- |
| `--pr-primary` | `--color-primary` | `bg-primary`, `text-primary` |
| `--pr-ink`, `--pr-ink-soft` | `--color-ink`, `--color-ink-soft` | `text-ink-soft` |
| `--pr-surface`, `--pr-line` | `--color-surface`, `--color-line` | `bg-surface`, `border-line` |
| `--pr-r-md`, `--pr-r-lg` | `--radius-md`, `--radius-lg` | `rounded-lg` |
| `--pr-sh-1` .. `--pr-sh-3` | `--shadow-soft-1` .. `--shadow-soft-3` | `shadow-soft-2` |
| `--pr-display`, `--pr-text` | `--font-display`, `--font-text` | `font-display` |
| `--pr-spring`, `--pr-ease` | `--ease-spring`, `--ease-soft` | `ease-spring` |
| `pr-pop-in` and friends | `--animate-pop-in` and friends | `animate-pop-in` |

Dark mode moves from the sample's `data-pr-theme="dark"` attribute to the `.dark` class
that `useTheme` already sets on `<html>` - the variant `index.css` is already configured
for. The dark palette becomes a single `.dark` block overriding the same theme variables,
so components use plain token utilities and need no `dark:` prefixes, exactly as the
stylesheet works today.

Kept as hand-written CSS in `index.css`, because utilities cannot express them cleanly:

- the five `@keyframes` (`pop-in`, `fade`, `boing`, `shimmer`, `drop`)
- the two radial-gradient page backgrounds and the confetti layer
- the `prefers-reduced-motion: reduce` block
- iframe sizing inside the play frame

The four `@media (max-width: ...)` breakpoints become `sm:` / `md:` / `lg:` variants
(mobile-first, so the conditions invert). Font imports become Bricolage Grotesque and
Nunito; the unused Fredoka / Oswald / Poppins imports are removed.

## Routing and state

`App` is the persistent shell - `Nav`, `<main><Outlet /></main>`, footer - and owns
`initApi()` on mount and `useTheme`. Remote state stays in `useAppStore`; the store and
the API do not change.

| Route | Renders | Notes |
| --- | --- | --- |
| `/` | `StorePage` | Hero (first game) when unfiltered, plus the catalogue. |
| `/games/:id` | `GameDetailPage` | Unknown or non-numeric `id` renders a "game not found" `NoticePanel`, not a redirect. |
| `/games/:id/play` | `PlayOverlay`, nested in `GameDetailPage` | Close button and Esc call `navigate(-1)`, returning to the detail page. Playing from a card navigates straight here. |

Search and category filters live in the URL as `?q=` and `?category=` on `/`, so a
filtered shelf is shareable and Back steps through filter changes. The nav's "All games"
link scrolls to the catalogue section on `/`.

Local component state is limited to what is genuinely ephemeral: the iframe's `isReady`
flag and the nav's mobile-menu open state.

## Behaviour carried over from the sample

- Three body states: skeletons while `loading && !games`, an error `NoticePanel` with a
  retry action when `games` is null, an empty-shelf panel when `games` is empty.
- Overlay accessibility: `role="dialog"`, `aria-modal`, Esc to close, focus moved into
  the iframe on load, body scroll lock restored on unmount, and
  `sandbox="allow-scripts allow-same-origin"` so a game reaches only its own storage.
- Filter chips keep `aria-pressed`; the result count keeps `aria-live="polite"`.
- Staggered card entrance animation, capped at eight cards, disabled under reduced motion.

## Migration order

Convert one component at a time, leaf-first, so each step type-checks on its own:

1. `index.css` - `@theme` tokens, `.dark` overrides, keyframes, fonts.
2. Leaves: `icons`, `GameCover`, `NoticePanel`, `LoadingSkeletons`.
3. `GameCard`, `HeroBanner`, `GameDetail`, `PlayOverlay`, `Nav`.
4. `App`, `StorePage`, `GameDetailPage`, `main.tsx` routes.
5. Delete the superseded components, pages and assets.
6. Delete `src/samples/` and the `/samples` routes.

**`src/samples/playroom` and its stylesheet stay on disk until step 6.** Keeping the
`/samples/playroom` route alive through the rewrite makes the original and the converted
UI viewable side by side, which is the only practical check against visual drift.

## Verification

There is no test suite in this repository (tracked in `docs/tasks/queue/add-test-suites.md`),
so this work is verified by:

- `npm run build` (runs `tsc -b`) - clean, after every step in the migration order.
- `npm run lint` - clean.
- Running the app and comparing `/` against `/samples/playroom` before step 6.

Tests will not be run, and the completion report must say so plainly.

## Out of scope

- Any change to the .NET API, the store, or the three game apps.
- Adding a test suite.
- New features. The promoted UI does what the sample does, plus real URLs.
