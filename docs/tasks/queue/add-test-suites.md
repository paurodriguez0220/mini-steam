# Task: Add test suites

**Status:** Planned

## Goal

Give the API and the storefront a test suite so changes can be verified before they ship.

## Context

The repository has no tests of any kind. `ai-workflow.md` requires the test suite to run
before any push, and `testing.md` defines the expected approach - neither can be honoured
today. This was flagged during the 2026-09-07 standards cleanup.

## Proposed Design

- `MiniSteam.Tests` (xUnit) covering `AuthService`, the generic `Service<T, TDto>`, the
  upload validation in `GamesController`, and `RateLimitMiddleware`.
- Integration tests over `WebApplicationFactory` with an in-memory or containerised SQL
  provider, covering the auth flow and the games CRUD surface.
- Vitest + Testing Library for the storefront store and components, per `web-components.md`.
- Wire all of it into the deploy workflows so a red suite blocks deployment.

## Acceptance Criteria

- [ ] `dotnet test` runs and passes
- [ ] `npm test` runs and passes in `MiniSteamUI/ministeamui`
- [ ] CI fails the build on a failing test
