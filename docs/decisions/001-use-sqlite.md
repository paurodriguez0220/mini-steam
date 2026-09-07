# ADR-001: Use SQLite instead of Azure SQL

**Date:** 2026-09-07
**Status:** Accepted

## Context

MiniSteam stored its catalogue, users and ownership records in an Azure SQL database.
That created three problems out of proportion to what the app actually does.

**It could not be run.** Azure SQL rejects any client whose public IP is not on the server
firewall. A fresh clone therefore failed on first run with a networking error rather than
a setup message, and every developer machine needed a firewall rule that goes stale
whenever their address changes.

**It forced a credential to exist.** The connection string carried an administrator
password. That password was hardcoded in `DependencyInjection.cs`, committed, and pushed -
see `docs/runbooks/rotate-secrets.md`. Any cloud database implies a credential that must be
stored, rotated and kept out of source control.

**The workload does not need it.** The catalogue is three rows. Reads dominate almost
entirely; writes are occasional icon uploads by a single administrator. There is no
concurrent write load, no reporting, and no data volume worth speaking of. Azure SQL was
solving problems this application does not have, while charging real operational cost in
setup friction.

## Decision

Use SQLite via `Microsoft.EntityFrameworkCore.Sqlite`, with the database file on a Docker
volume at `/data/ministeam.db`.

The existing SQL Server migrations were deleted and replaced with a single SQLite
`InitialCreate`. They referenced provider-specific APIs and would not compile against the
new provider, and no SQLite database existed yet, so there was no history worth preserving.

An `IDesignTimeDbContextFactory` was added so `dotnet ef` builds the model without booting
the application host, which previously required JWT and blob settings to be present just to
scaffold a migration.

Data in the Azure SQL instance was **not** migrated. It held only seed-equivalent rows, and
the server was unreachable from the development network at the time of the change.

## Consequences

**Easier.** The stack runs with no cloud account, no firewall rule and no database
credential. The SQL Server container is gone: the API is ready in about 2 seconds rather
than roughly 40, because it no longer waits on a SQL Server healthcheck. One fewer secret
exists to leak. `down --volumes` resets to a clean, re-seeded database in one command.

**Harder.** SQLite allows one writer at a time, so this rules out concurrent write
workloads. It also rules out scaling the API beyond a single instance while it owns a local
file - App Service scale-out would need a shared volume or a different engine. Some
server-side features are gone: no stored procedures, no server-side computed columns, and
looser type affinity, so schema mistakes surface later than they would on SQL Server.

**If the workload changes,** the escape route is Postgres. The EF Core model is
provider-agnostic - the entities carry no provider-specific annotations - so moving means
swapping the provider package and regenerating migrations, exactly as this change did.
Choose Postgres over returning to Azure SQL: it runs locally in a container as well as
hosted, which keeps the "no cloud dependency for local development" property that motivated
this decision.

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-07*
*Standards: https://github.com/paurodriguez0220/standards-docs*
