# UPSTREAM_PR_PLAN.md

How to contribute fork work back to `jellyfin/jellyfin-vue` cleanly, and how to keep fork-only changes from leaking into upstream PRs.

Companion to `FORK_ROADMAP.md` (numbered `PR-n` tasks) and `PERFORMANCE_NOTES.md`.

---

## 1. Rules for upstreamable branches

An upstreamable branch must:

- **Do exactly one thing.** One feature or one fix per branch. If a sentence describing it needs an "and", split it.
- **Branch from a fresh upstream `master`.** Always `git fetch upstream && git switch -c <branch> upstream/master`. Never branch upstream work from `develop` or `brook` (those carry fork-only commits).
- **Contain zero fork-only changes.** No `FORK_ROADMAP.md`, `PERFORMANCE_NOTES.md`, `CLAUDE.md`, `justfile`, devcontainer tweaks, or remote/tooling config.
- **Not touch generated files.** `types/global/routes.d.ts` and locale data regenerate; revert incidental changes (`git checkout -- <file>`).
- **Not reformat untouched code.** No editor-wide reformat, no import reordering in files you did not otherwise change.
- **Keep API compatibility.** No server API changes, no assumption of a custom backend or third-party service.
- **Pass local checks** (`pnpm -C packages/frontend check`) — see §9 on the current pre-existing CI breakage.
- **Stay recognisably jellyfin-vue.** No rebrand, rename, redesign, or architecture rewrite in an upstream PR.

---

## 2. Branch naming

`upstream/master`-based branches, lowercase kebab-case, no prefix slashes (the repo's own history uses bare descriptive branch names):

```
playback-quality-selector
transcode-visibility
fix-duplicate-index-fetch
playback-settings-page
```

Use the exact branch name from the `FORK_ROADMAP.md` PR table where one is given.

Fork-only branches stay clearly separate: `develop` (integration line), `brook` (personal), and feature branches prefixed `fork/` (e.g. `fork/debug-overlay`) so they are never confused with upstreamable ones.

---

## 3. Commit style

The repo enforces **Conventional Commits** (CI `commits_checks` + the existing `feat(...)`, `fix(...)`, `chore(...)` history).

- Format: `type(scope): summary` — imperative mood, lower-case, no trailing period.
- Types: `feat`, `fix`, `perf`, `chore`, `refactor`, `docs`, `test`.
- Suggested scopes: `playback`, `subtitles`, `settings`, `router`, `performance`, `i18n`, `ui`.
- Body (optional): wrap prose, explain *why*, reference issues. Keep it short.
- **No AI / tooling attribution** in commit messages, branch names, or PR text — no `Co-Authored-By` for assistants, no "generated with" footers.
- **No merge commits** on upstream branches — CI rejects them. Rebase onto `upstream/master` instead.
- Prefer one commit per PR; squash noise before pushing.

Examples:
```
feat(playback): enable streaming quality selector
fix(performance): share home page data between layout and route
perf(home): render home sections as their data resolves
```

---

## 4. What NOT to include in upstream PRs

- Fork planning docs (`FORK_ROADMAP.md`, `UPSTREAM_PR_PLAN.md`, `PERFORMANCE_NOTES.md`).
- `CLAUDE.md`, `justfile`, `.devcontainer/` edits, editor settings, local git/remote config.
- Fork-only features (debug overlays, Alchemist/Bazarr hooks, server diagnostics, network-based presets).
- Behavior-changing performance toggles before they are proven — land the Experimental scaffolding upstream only once a toggle has a real, measured win.
- Unrelated dependency bumps (Renovate owns those upstream).
- Drive-by refactors, renames, or "tidy-ups" of code the PR does not functionally change.
- Regenerated `routes.d.ts` / locale files.

---

## 5. Keeping fork changes separate from upstream

Branch model:

```
upstream/master ── pristine mirror (local `master` tracks it)
        │
        ├── <feature-branch>   off upstream/master → PR to jellyfin  (clean, single-purpose)
        │
        └── develop            fork integration line; periodically `git merge upstream/master`
                └── brook      personal daily-driver branch
```

Principles:

- **`master`** stays a pure mirror of `upstream/master`. Never commit to it.
- **`develop`** is the fork's running build: it merges in every upstreamable feature branch *plus* fork-only work. Pull `upstream/master` into it regularly (see §7 of nothing — just `git merge upstream/master`) to stay mergeable.
- **Upstream feature branches** are cut from `upstream/master`, never from `develop`. This guarantees no fork-only commit can ride along.
- Fork-only docs live on `develop`/`brook` only. They must never appear in an `upstream/master`-based branch.
- Remotes: `origin` = the fork (`bybrooklyn/jellyfin-vue`), `upstream` = `jellyfin/jellyfin-vue`. Upstream PRs are opened fork→upstream.

---

## 6. Avoiding "while I'm here" diffs

- Before committing: `git diff --stat` — every changed file must be explained by the PR's one purpose. Unexplained file? Revert it.
- Resist reformatting, renaming, and "tidying" code you are only reading. Note it in `FORK_ROADMAP.md` instead and let it be its own PR.
- Keep `feat` and `perf` separate; keep safe and risky changes separate (a rule from the project brief).
- If a prerequisite cleanup is genuinely needed, land it as its own small PR *first*, then build on it.
- Review the final diff as if you were the maintainer: would an unrelated hunk make you ask "why is this here?". If yes, remove it.

---

## 7. Extracting a clean PR from the fork

When a feature was prototyped on `develop`/`brook` and needs to become an upstream PR:

1. `git fetch upstream`
2. `git switch -c <feature-branch> upstream/master`
3. Bring over **only** the relevant change:
   - cherry-pick the specific commit(s): `git cherry-pick <sha>`, or
   - if commits are mixed, re-apply by hand / `git checkout develop -- <specific files>` then review every hunk.
4. `git diff upstream/master --stat` — confirm only intended files changed; revert generated/incidental files.
5. Run `pnpm -C packages/frontend check` and a build.
6. Commit with a Conventional Commit message; no attribution footers.
7. `git push origin <feature-branch>` and open the PR against `jellyfin/jellyfin-vue:master`.
8. Merge the same branch into `develop` so the fork and the PR do not diverge.

Keep prototype commits small and single-purpose *on the fork* too — it makes cherry-picking trivial later.

---

## 8. Recommended first 5 upstream PRs

Ordered for low risk, high visible value, and minimal review friction. (Full details in `FORK_ROADMAP.md` §7.)

1. **PR-1 — `playback-quality-selector` — `feat(playback)`** Enable the disabled streaming-quality selector. *Already open as #2815.* Smallest, highest-demand, additive.
2. **PR-3 — `fix-duplicate-index-fetch` — `fix(performance)`** Stop fetching the home page data twice (layout + route). Pure win, no behavior change, easy to review.
3. **PR-4 — `transcode-visibility` — `feat(playback)`** Show whether playback is direct play vs. transcode. Read-only, self-contained, addresses a real parity gap.
4. **PR-10 — `scroll-after-suspense` — `fix(router)`** Resolve the existing `scrollBehavior` TODO so routes scroll to top only after content resolves. Tiny, fixes a documented TODO.
5. **PR-8 — `queue-save-as-playlist` — `feat(playback)`** Implement the disabled "Save as playlist" queue button. Finishes a visibly broken control; isolated to one component.

Hold PR-2 (disabled-label polish) and PR-6 (playback settings page) as the next wave — both are fine upstream but slightly larger or more design-sensitive.

---

## 9. Note on current upstream CI

At the time of this audit, `jellyfin/jellyfin-vue` `master` has **failing `check:types` and `lint`** in CI from pre-existing dependency drift (e.g. `sonarjs.configs` possibly-undefined, `Set.difference`/`es2025` lib, `RolldownLog` typings) — unrelated to feature work. Implications:

- A feature PR will likely show those same red checks. State plainly in the PR description that the failures pre-date the change and are reproducible on a clean `master`.
- Do **not** "fix" them inside a feature PR — that is a separate, dedicated cleanup PR.
- Always confirm your branch does not *add* new type/lint errors (compare error counts against `upstream/master`).
