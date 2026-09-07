# Mini Steam

A personal portfolio "game store" - a Steam-like storefront that lists small browser games
and runs them in an embedded iframe. One repository, five independently deployable apps.

## Getting Started

### Prerequisites

- Docker Desktop (for the containerised stack), or
- .NET 9 SDK and Node.js >= 20.19 to run the pieces directly

No cloud account is required. The API uses SQLite and the stack ships a blob emulator.

### Run everything in Docker (recommended)

The fastest way to a working stack. Requires Docker Desktop.

```powershell
git clone https://github.com/paurodriguez0220/mini-steam.git
cd mini-steam
./scripts/up.ps1
```

That builds and starts the API, an Azurite blob emulator, the storefront and all three
games. On first start the API applies its EF Core migrations and seeds a development user
plus the three games, so the storefront has real content immediately - no Azure resources
and no firewall rules needed.

| Script | What it does |
| --- | --- |
| `./scripts/up.ps1` | Build and start everything (creates `.env` from `.env.example` if missing) |
| `./scripts/up.ps1 -Rebuild` | Same, ignoring the build cache |
| `./scripts/logs.ps1` | Tail all logs (`-Service api` for one service) |
| `./scripts/down.ps1` | Stop the stack, keeping data |
| `./scripts/down.ps1 -Purge` | Stop and delete the database and blob volumes |

| Service | URL |
| --- | --- |
| Storefront | http://localhost:5173 |
| API reference (Scalar) | http://localhost:8085/scalar/v1 |
| 2048 | http://localhost:5174 |
| Snake | http://localhost:5175 |
| Minesweeper | http://localhost:5176 |

Every port is configurable in `.env` - change it there if one clashes with something you
already run. `.env` holds local development values only and is git-ignored.

## Running Without Docker

### Clone and configure

```bash
git clone https://github.com/paurodriguez0220/mini-steam.git
cd mini-steam
```

The API reads every secret from configuration - nothing is committed. Set them locally with
user-secrets:

```bash
dotnet user-secrets set "Jwt:Key" "<at-least-32-character-signing-key>" --project MiniSteam
dotnet user-secrets set "AzureBlobStorage:ConnectionString" "<storage-connection-string>" --project MiniSteam
```

`ConnectionStrings:DefaultConnection` is optional. When unset the API creates
`ministeam.db` next to its binaries; set it to point elsewhere, for example
`Data Source=/data/ministeam.db`. A relative path is resolved against the application
directory, not the working directory.

The API fails fast at startup with a descriptive error if any of these is missing.

For the storefront, copy the example env file and fill it in:

```bash
cp MiniSteamUI/ministeamui/.env.example MiniSteamUI/ministeamui/.env.local
```

### Run

```bash
# API - http://localhost:5248 (https://localhost:7157)
dotnet run --project MiniSteam/MiniSteam.csproj

# Storefront - http://localhost:5173
cd MiniSteamUI/ministeamui && npm install && npm run dev
```

Each game runs the same way from its own folder (`2048/2048`, `Snake/snake`,
`Minesweeper/minesweeper`).

## Commands

| Command | What it does |
| --- | --- |
| `dotnet build MiniSteam/MiniSteam.csproj` | Build the API |
| `dotnet run --project MiniSteam/MiniSteam.csproj` | Start the API |
| `dotnet ef database update --project MiniSteam/MiniSteam.csproj` | Apply pending migrations |
| `dotnet ef migrations add <Name> --project MiniSteam/MiniSteam.csproj` | Add a migration |
| `npm run dev` | Start a Vite dev server (from an app folder) |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |

API reference is served by Scalar at `/scalar/v1`; the OpenAPI document is at `/openapi/v1.json`.

> **No test suite exists yet.** See `docs/tasks/queue/add-test-suites.md`.

## Architecture

The API is layered as `Domain` / `Application` / `Infrastructure` / `Controllers`, stores
its data in SQLite, and uses:

- **Generic Repository + Generic Service** - `IRepository<T>` and `IService<TEntity, TDto>`,
  registered as open generics so a new entity needs no new plumbing.
- **Generic Controller** - `GenericController<TEntity, TDto>` provides CRUD; concrete
  controllers inherit it and add only what is specific to them.
- **Mapper abstraction** - a hand-rolled `IMapper<TEntity, TDto>` per entity.
- **Options pattern** - `BlobStorageOptions` binds the `AzureBlobStorage` section and is
  injected via `IOptions<T>` rather than reading `IConfiguration` at the call site.
- **Extension-method composition** - each cross-cutting concern self-registers through an
  `Add*` extension in `Infrastructure/Extensions` (JWT, CORS, OpenAPI, Blob Storage, DI).
- **Middleware pipeline** - global exception handling (RFC 7807 ProblemDetails), base-path
  redirect, and a fixed-window rate limiter.

The storefront keeps all remote state in a single Zustand store, authenticates against the
API on mount, then loads the games catalogue and renders each game in an iframe.

## Dependencies

| Dependency | Purpose |
| --- | --- |
| SQLite | Games, users, profiles, ownership - a single file, see [ADR-001](docs/decisions/001-use-sqlite.md) |
| Azure Blob Storage | Game icons and user avatars (Azurite emulates it locally) |
| Azure App Service | Hosts the API |
| Azure Static Web Apps | Hosts the storefront and each game |
| `Microsoft.EntityFrameworkCore.Sqlite` | Data access and migrations |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT bearer validation |
| `BCrypt.Net-Next` | Password hashing |
| `Azure.Storage.Blobs` | Blob upload and delete |
| `Scalar.AspNetCore` / `Swashbuckle.AspNetCore` | API reference UI and OpenAPI document |
| `react`, `react-router-dom`, `zustand`, `tailwindcss` | Storefront and games |

## Configuration

Names only - never commit values.

| Setting | Purpose |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | SQLite file location. Optional; defaults beside the binaries |
| `Jwt:Key` / `Jwt:Issuer` / `Jwt:Audience` / `Jwt:DurationInMinutes` | Token signing and validation |
| `AzureBlobStorage:ConnectionString` | Blob account connection |
| `AzureBlobStorage:GameIconsContainer` / `UserAvatarsContainer` | Container names |
| `AzureBlobStorage:MaxFileSizeInMB` / `AllowedImageExtensions` | Upload limits |
| `Cors:AllowedOrigins` | Permitted storefront origins |
| `RateLimiting:WindowSeconds` / `MaxRequests` | Fixed-window rate limit |
| `VITE_API_URL` | Storefront API base URL |

CI additionally needs the repository variables `RESOURCE_GROUP`, `APP_NAME`,
`AZURE_SUBSCRIPTION_ID` and the secrets `AZURE_CREDENTIALS`, `SWA_MINISTEAM`, `SWA_2048`,
`SWA_SNAKE`, `SWA_MINESWEEPER`.

## Links

- Related repos: [standards-docs](https://github.com/paurodriguez0220/standards-docs)
- Standards: https://github.com/paurodriguez0220/standards-docs

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-07*
*Standards: https://github.com/paurodriguez0220/standards-docs*
