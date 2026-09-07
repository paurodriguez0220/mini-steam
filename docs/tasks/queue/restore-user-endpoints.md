# Task: Implement the User and UserGame endpoints

**Status:** Planned

## Goal

Expose the user and library endpoints the domain model already supports.

## Context

`UserController` and `UserGameController` existed only as empty classes with commented-out
constructors - no routes, no actions. They were deleted in the 2026-09-07 cleanup under the
"no commented-out code" rule. The intent is captured here so it is not lost.

The `User`, `UserProfile` and `UserGame` entities, their relationships and their migrations
all exist, so the data model is ready.

## Proposed Design

Follow the existing pattern: a `UserDto` and `UserGameDto`, an `IMapper` implementation for
each, and controllers inheriting `GenericController<TEntity, TDto>` - the same shape as
`GamesController`.

Authorize at the resource level, not just the route: a user must only be able to read and
modify their own profile and library. Never return `PasswordHash` in a DTO.

Depends on `docs/issues/defined/admin-endpoints-always-return-403.md` - the role claim must
work before admin-scoped user management is meaningful.

## Acceptance Criteria

- [ ] `UserDto` / `UserGameDto` with no secret fields
- [ ] Controllers registered and documented in OpenAPI
- [ ] A user cannot read or modify another user's data
- [ ] Tests covering the ownership check
