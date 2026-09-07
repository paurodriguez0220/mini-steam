# CLAUDE.md

## Project

Mini Steam is a personal portfolio "game store" — a Steam-like storefront that lists small
browser games and runs them in an embedded iframe. It is one repository containing five
independently deployable apps: a .NET 9 REST API and four React + Vite front-ends
(the storefront plus three games).

## Architecture

| App | Stack | Role |
| --- | --- | --- |
| `MiniSteam` | .NET 9 Web API, EF Core 9, SQLite | Games/users/auth API, JWT issuance, blob uploads |
| `MiniSteamUI` | React 19, Vite, Tailwind 4, Zustand, React Router | Storefront; lists games, embeds them via `<iframe>` |
| `2048`, `Snake`, `Minesweeper` | React 19, Vite, Tailwind 4 | Standalone games, each its own Static Web App |

The API follows a layered structure (`Domain` / `Application` / `Infrastructure` / `Controllers`):

- **Generic Repository + Generic Service** — `IRepository<T>` / `IService<TEntity, TDto>` with
  a single open-generic implementation registered per entity.
- **Generic Controller** — `GenericController<TEntity, TDto>` supplies CRUD; concrete
  controllers inherit and add only what is specific (e.g. `GamesController` icon upload).
- **Mapper abstraction** — a hand-rolled `IMapper<TEntity, TDto>` per entity.
- **Options pattern** — `BlobStorageOptions` binds the `AzureBlobStorage` config section and
  is injected as `IOptions<T>`; don't read `IConfiguration` at the call site.
- **Extension-method composition** — each cross-cutting concern registers itself via an
  `Add*` extension in `Infrastructure/Extensions` (JWT, CORS, OpenAPI, Blob Storage, DI).
- **Custom middleware pipeline** — global exception handling (RFC 7807 ProblemDetails,
  details gated to Development), base-path redirect, and a fixed-window rate limiter.

The storefront holds all remote state in a single Zustand store (`useAppStore`), which
authenticates against the API on mount and then fetches the games list.

## Structure

```
mini-steam/
|-- .github/workflows/     # one deploy workflow per app (Azure SWA / App Service)
|-- MiniSteam/             # .NET 9 API
|   |-- Application/       # interfaces only (IRepository, IService, IMapper, IAuthService)
|   |-- Domain/            # Entities + Dtos
|   |-- Infrastructure/    # Data, Repositories, Services, Mappers, Extensions, Configuration
|   |-- Controllers/
|   |-- Middleware/
|   `-- Migrations/        # EF Core migrations
|-- docker/                # shared nginx config for the SPA images
|-- docs/                  # decisions (ADRs), runbooks, tasks, issues
|-- scripts/               # up / down / logs, secret rotation, SQL firewall
|-- docker-compose.yml     # full local stack
|-- MiniSteamUI/ministeamui/   # storefront React app
|-- 2048/2048/                 # game
|-- Snake/snake/               # game
`-- Minesweeper/minesweeper/   # game
```

Note the doubled folder names (`2048/2048`, `Snake/snake`): the outer folder holds the
Visual Studio `.sln` / `.esproj`, the inner folder is the actual Vite app. All npm commands
run from the **inner** folder.

## Commands

The whole stack runs in Docker - prefer it over starting services by hand.

| Command | What it does |
| --- | --- |
| `./scripts/up.ps1` | Build and start the full stack (API, Azurite, storefront, games) |
| `./scripts/up.ps1 -Rebuild` | Same, ignoring the build cache |
| `./scripts/logs.ps1 -Service api` | Tail one service's logs |
| `./scripts/down.ps1` | Stop the stack (`-Purge` also drops the volumes) |

Compose reads `.env` (created from `.env.example` on first run). Ports live there; the API
defaults to 8085 because 8080 is commonly taken. In Development the API applies migrations
and seeds a dev user plus the three games on startup - see `DevelopmentSeeder`.

Run from the repo root unless noted.

| Command | What it does |
| --- | --- |
| `dotnet build MiniSteam/MiniSteam.csproj` | Build the API |
| `dotnet run --project MiniSteam/MiniSteam.csproj` | Start the API (http://localhost:5248, https://localhost:7157) |
| `dotnet ef database update --project MiniSteam/MiniSteam.csproj` | Apply pending migrations |
| `dotnet ef migrations add <Name> --project MiniSteam/MiniSteam.csproj` | Add a migration |
| `npm install` (in each app folder) | Install front-end dependencies |
| `npm run dev` | Start a Vite dev server (storefront defaults to http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |

API docs are served by Scalar at `/scalar/v1` and the OpenAPI document at `/openapi/v1.json`.

There is **no test suite in this repository yet** — tracked in
`docs/tasks/queue/add-test-suites.md`. Until it exists, verify changes with
`dotnet build` and `npm run build`, and say plainly that tests were not run.

The API stores data in SQLite. In Docker the file lives on the `api-data` volume at
`/data/ministeam.db`; run `./scripts/down.ps1 -Purge` to reset to a clean, re-seeded
database. See `docs/decisions/001-use-sqlite.md` for why.

## Configuration

Names only — never commit values.

| Setting | Where | Purpose |
| --- | --- | --- |
| `ConnectionStrings:DefaultConnection` | env / App Service config | SQLite file location; optional, defaults beside the binaries |
| `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:DurationInMinutes` | user-secrets / App Service config | Token signing |
| `AzureBlobStorage:ConnectionString` | user-secrets / App Service config | Game icon + avatar uploads |
| `Cors:AllowedOrigins` | `appsettings.json` | Allowed storefront origins |
| `RateLimiting:WindowSeconds`, `RateLimiting:MaxRequests` | `appsettings.json` | Fixed-window rate limit |
| `VITE_API_URL` | `MiniSteamUI/ministeamui/.env.local` | API base URL for the storefront |

Secrets committed before 2026-09-07 are in git history and are considered compromised.
Rotation procedure: `docs/runbooks/rotate-secrets.md`.

## Conventions

All work follows the standards repo: https://github.com/paurodriguez0220/standards-docs
(local copy: `C:\Users\paulo.rodriguez\Paulo\standards-docs\`).

Read the relevant file **before** writing code:

| File | When it applies |
| --- | --- |
| `code-style.md` | Any code change - naming, EF Core, async, NuGet, decimals |
| `design-patterns.md` | New services, abstractions, architecture decisions |
| `web-components.md` | React components, Storybook stories, component tests |
| `api-design.md` | New or changed endpoints |
| `security.md` | Auth, secrets, uploads, CORS, rate limiting |
| `testing.md` | Any test work |
| `docker-compose.md` | Compose, Dockerfiles, the local dev stack |
| `github-actions.md` | Workflow changes |
| `documentation.md` | README, CLAUDE.md, ADRs |
| `git-workflow.md` | Branching, commits, PRs |

## Never Do

- **Never commit secrets.** No connection strings, account keys, JWT signing keys, passwords,
  or API tokens in `appsettings*.json`, `.env`, or C# source. Use user-secrets locally and
  App Service / Static Web App configuration in Azure.
- **Never hardcode a connection string in C#.** It must come from `IConfiguration`.
- **Never reintroduce a cloud database for local development.** The stack must run with
  no cloud account - see `docs/decisions/001-use-sqlite.md`.
- **Never push to a remote outside the `paurodriguez0220` GitHub account.**
- **Never commit build or IDE artifacts** - `bin/`, `obj/`, `dist/`, `node_modules/`, `.vs/`,
  `*.suo`, `.vite/`.
- **Never claim work is done without running the build.** `dotnet build` for the API and
  `npm run build` for every front-end touched.
- **Never leave commented-out attributes as access control.** If an endpoint should be
  authorized, add `[Authorize]`; if it should be public, delete the comment.
- **Never accept credentials as URL path or query parameters.** Auth takes a POST body.
- **Never widen CORS to `AllowAnyOrigin`.** Add the specific origin to `Cors:AllowedOrigins`.
- **Never run `DevelopmentSeeder` outside Development.** Production migrations are
  deliberate and reviewed, never applied automatically at startup.
- **Never commit `.env`.** Only `.env.example`, with names and safe local defaults.

---
*Maintained by paurodriguez0220 - Last updated: 2026-09-07*
*Standards: https://github.com/paurodriguez0220/standards-docs*
