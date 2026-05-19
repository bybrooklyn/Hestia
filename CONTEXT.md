# Jellyfin Vue Fork

Personal fork of Jellyfin Vue — a browser-based Vue 3 client for a Jellyfin media server. This glossary fixes the language used when planning the fork's feature work, especially work aimed at matching the jellyfin-web client.

## Language

### Parity

**Parity feature**:
A user-accomplishable capability that exists in the jellyfin-web client.
_Avoid_: bare "feature" (ambiguous with fork-only features)

**Capability parity**:
The state in which a parity feature is fully usable through jellyfin-vue's own UI; concerns capability only, never visual resemblance to jellyfin-web.
_Avoid_: "exact parity", "feature complete" used loosely, "UI parity"

**Parity gap**:
A parity feature that jellyfin-vue lacks entirely or delivers only partially.

**Surfaced gap**:
A parity gap whose UI element exists in jellyfin-vue but is disabled, stubbed, or nonfunctional.

**Absent gap**:
A parity gap with no jellyfin-vue UI at all.

**Parity baseline**:
The frozen jellyfin-web reference the fork measures parity against — version **10.11.8**, its `stable` + `dashboard` + `wizard` apps (the `experimental` app excluded). Re-baselining to a newer jellyfin-web is a deliberate, separate step.
_Avoid_: "latest jellyfin-web", unqualified "jellyfin-web"

## Relationships

- A **parity gap** is defined relative to the **parity baseline**.
- A **parity gap** is either a **surfaced gap** or an **absent gap**.
- Closing a **parity gap** achieves **capability parity** for that **parity feature**.
- **Capability parity** never implies UI parity — jellyfin-vue keeps its own design language — **except the admin dashboard**, whose information architecture deliberately mirrors jellyfin-web's, rendered in jellyfin-vue's own components and theme.

## Example dialogue

> **Planner:** "Is the metadata editor a parity gap?"
> **Maintainer:** "The editor screen exists but has unfinished validation — so it's a surfaced gap, not an absent gap. Closing it means the edit *capability* works, through our editor, not jellyfin-web's."

## Flagged ambiguities

- "exact parity" / "feature complete" were used loosely to mean full capability parity with jellyfin-web. Resolved: the goal is **capability parity** across all **parity features**; UI parity is explicitly out of scope.
- The jellyfin-vue README states the client is "not feature-complete" and "not planned to replace jellyfin-web." Resolved for this fork only: that position is superseded — the fork's goal *is* full capability parity. Upstream's stated position is unchanged.
- "reimagined" admin dashboard: resolved — jellyfin-vue's own component system and theme, following jellyfin-web's dashboard information architecture (same pages, groupings, navigation). Not a visual port of jellyfin-web, not a free redesign.
