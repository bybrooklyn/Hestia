# Target full capability parity with jellyfin-web

The fork's goal is **capability parity** with the jellyfin-web client: every user-accomplishable capability in jellyfin-web — both the client surface and the server-administration surface — is reachable through jellyfin-vue's own UI. Parity is measured against a pinned **baseline**, jellyfin-web `10.11.8`, enumerated from its source (`apps/stable`, `apps/dashboard`, `apps/wizard`; `apps/experimental` excluded). Re-baselining to a newer jellyfin-web release is a deliberate, separate decision.

This is recorded because it **contradicts upstream's stated position**: the jellyfin-vue README explicitly says the client is "not feature-complete" and "not planned to replace jellyfin-web." Without this ADR a future reader would reasonably wonder why this fork enumerates and chases full parity.

## Considered options

- **Focused daily-driver client** (rejected) — finish only the playback/library experience plus the already-surfaced (disabled/stubbed) features, and leave the rest. Smaller, faster, and aligned with upstream's intent — but it leaves capabilities missing versus jellyfin-web, which the fork owner explicitly does not want.
- **Full capability parity** (chosen) — no capability missing relative to the baseline.

## Consequences

- The server-administration dashboard is in scope. Its information architecture mirrors jellyfin-web's, rendered in jellyfin-vue's own components and theme (see `CONTEXT.md`).
- UI parity is **not** a goal; jellyfin-vue keeps its own design language (the dashboard IA being the single deliberate exception).
- Parity progress is tracked capability-by-capability in `PARITY.md`.
- The baseline is frozen at 10.11.8 — new jellyfin-web releases do not automatically expand scope.
