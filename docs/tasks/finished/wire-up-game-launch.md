# Task: Wire up the game launch flow

**Status:** Done - 2026-09-07

## Goal

Make clicking a game in the storefront open and play it in an iframe.

## Context

The storefront listed games but nothing opened one:

1. `GameCard` took only `title`, `price`, `discount` and `imageUrl` - no click handler, and
   it never received the game's `url`. Its only button was a non-functional "Buy".
2. No router was mounted, so `GameFrame`, `GameIframe`, `GameDetails` and `GameModal` were
   all written but unreachable.
3. `GameDetails` carried a **hardcoded map of Azure Static Web App URLs**, duplicating and
   shadowing the `url` the API already returns per game.

## What Was Done

Used the existing modal chain rather than introducing routing - `GameModal` ->
`GameFrame` -> `GameHeader` + `GameIframe` was already written and only needed wiring.

- `GameCard` takes an optional `onPlay` callback; the card and its button both trigger it.
  A game with no `url` renders as "Unavailable" instead of a dead button.
- `MainContent` holds the active game and renders `GameModal` with `src={game.url}` taken
  straight from the API. No game URL exists in the front-end source any more.
- Deleted `pages/GameDetails.tsx` and `pages/GamesList.tsx` - unreachable, and the only
  remaining source of hardcoded game URLs. `react-router-dom` is now unused.
- `GameFrame` previously located its iframe child by `type.name === "GameIframe"` to inject
  `onLoad`. Function names are mangled by minification, so that match would fail in a
  production build and the spinner would only clear via its 1s fallback timer. Replaced
  with an explicit `isLoading` prop owned by `GameModal`.
- `GameIframe` now takes a required `title` for accessibility and sets
  `sandbox="allow-scripts allow-same-origin"`. Each game is on its own origin, so
  `allow-same-origin` grants it only its own storage, not the storefront's.
- `GameIframe` focuses itself once the game loads. Without this the player had to click
  inside the frame before arrow keys reached the game, because keyboard events go to
  whichever document holds focus and that was still the storefront. `loading="lazy"` was
  removed at the same time - a deferred frame has nothing to focus.

## Verified

- [x] Clicking a card opens that game in an iframe over the storefront
- [x] 2048 is playable inside the frame (score reached 68 via arrow keys)
- [x] Arrow keys reach the game immediately after opening, with no click inside the frame
- [x] Minesweeper is playable inside the frame (cells revealed, mine counter decremented)
- [x] Snake loads inside the frame
- [x] Close button returns to the catalogue; backdrop click also closes
- [x] `npm run build` and `npm run lint` pass

## Known Limitation

Escape does not close the modal once the game has loaded. Focus is deliberately handed to
the iframe so the game receives arrow keys, and a parent page cannot observe key events
inside a cross-origin frame - that is a browser security boundary, not a bug. It is a
straight trade: either the game gets the keyboard, or the storefront does.

The close button and the backdrop click always work, so there is always a way out. If
Escape is wanted later it needs the games to forward the key via `postMessage` to the
parent, which means changing all three games.

---
*Added: 2026-09-07 | Completed: 2026-09-07*
