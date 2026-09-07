# Issue: Admin-only endpoints always return 403

**Status:** Fix planned

## What Happens

Any endpoint guarded by an authorization policy is unreachable, even for a correctly
authenticated administrator. `DELETE /api/games/{id}/icon` returns 403 for every caller.

## Context

`JwtExtensions.AddJwtAuthentication` registers three policies, all keyed on a `role` claim:

```csharp
options.AddPolicy("GameReader", policy => policy.RequireClaim("role", "User", "Admin"));
options.AddPolicy("GameWriter", policy => policy.RequireClaim("role", "Admin"));
options.AddPolicy("AdminOnly",  policy => policy.RequireClaim("role", "Admin"));
```

But `AuthService.AuthenticateAsync` issues tokens carrying only two claims:

```csharp
new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
new Claim(ClaimTypes.Name, user.UserName)
```

No `role` claim is ever emitted, so `RequireClaim("role", ...)` can never be satisfied.
The `User` entity also has no role or admin field to populate one from.

Root cause: the authorization model was designed but the corresponding role storage and
claim emission were never implemented.

## Possible Fix

1. Add a role to the `User` entity (an enum or a `Roles` join table) plus a migration.
2. Emit the role as a `role` claim in `AuthService.AuthenticateAsync`.
3. Add an integration test asserting an admin token reaches an `AdminOnly` endpoint and a
   user token does not.

Note that `ClaimTypes.Role` maps to the long-form URI claim type, which will *not* match
`RequireClaim("role", ...)`. Emit the short `"role"` name explicitly, or change the policies
to use `RequireRole`.

## Acceptance Criteria

- [x] Root cause identified and documented
- [ ] Role stored on the user
- [ ] `role` claim emitted on the token
- [ ] Test covering admin vs non-admin access

---
*Added: 2026-09-07*
