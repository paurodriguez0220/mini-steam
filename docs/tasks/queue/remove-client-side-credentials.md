# Task: Remove service-account credentials from the storefront bundle

**Status:** Planned

## Goal

Stop shipping API credentials to the browser.

## Context

`MiniSteamUI` authenticates by posting `VITE_API_AUTH_USERNAME` / `VITE_API_AUTH_PASSWORD`
to `/api/auth/login` on mount. Vite inlines every `VITE_*` variable into the production
bundle, so those credentials are readable by anyone who opens the deployed site - moving
them out of git (done on 2026-09-07) does not make them private.

The 2026-09-07 cleanup fixed the transport (credentials now travel in a POST body rather
than the URL path) but did not change this design, because doing so alters the API's
authorization model and is beyond a cleanup.

## Proposed Design

Preferred: make the games catalogue genuinely public. Mark `GET /api/games` and
`GET /api/games/{id}` with `[AllowAnonymous]`, keep every mutating endpoint behind
`[Authorize]`, and delete the storefront's bootstrap login entirely. The catalogue is not
sensitive - it is a public shop window.

Alternative, if per-user features (wishlist, library) are wanted: add a real sign-in screen
and store the token per user. No shared service account in the client either way.

## Acceptance Criteria

- [ ] No `VITE_API_AUTH_*` variable remains in the storefront
- [ ] Anonymous visitors can browse the catalogue
- [ ] Mutating endpoints still reject anonymous callers
- [ ] `.env.example` no longer lists credentials
