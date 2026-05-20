# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Jellyfin Vue is an experimental, browser-based web client for a Jellyfin media server, written in Vue 3. It is a pure frontend: it only ever talks to the Jellyfin server the user points it at. It is *not* meant to replace the main `jellyfin-web` client and is not feature-complete.

## Repository layout

pnpm workspace (`pnpm@11.1.2`, Node `>=24.11.0 <25`). `engineStrict` is on — use the exact versions. Packages:

- `packages/frontend` — the actual SPA (`@jellyfin-vue/frontend`). Vite + Vuetify 3 + vue-router. This is where almost all app code lives.
- `packages/ui-toolkit` — base components (all prefixed `J`, e.g. `JImg`, `JVirtual`), composables, and a global store. Auto-resolved into the frontend via `unplugin-vue-components`.
- `packages/shared` — framework-agnostic helpers, split into `src/universal/` (browser+node safe) and `src/node/`. Imported as `@jellyfin-vue/shared/<file>` and `@jellyfin-vue/shared/node/<file>`.
- `packages/i18n` — i18next setup; locale files are generated into virtual modules at build time (`@jellyfin-vue/i18n/vite`).
- `packages/configs` — shared ESLint flat config, TypeScript base config, UnoCSS preset, Storybook config. Consumed by every other package's `devDependencies`.
- `packages/vite-plugins` — internal Vite plugins (`JBundle`, `JMonorepo`) and bundle analysis.
- `packages/tauri-runtime` + `packaging/tauri` — desktop builds; `tauri-runtime` re-bundles the frontend with Tauri-specific runtime code.

Dependency versions shared across packages are pinned in `pnpm-workspace.yaml` `catalogs` (`catalog:runtime`, `catalog:development`) — change versions there, not in individual `package.json` files.

## Commands

Root scripts fan out to every package with `pnpm -r --if-present --no-bail`:

- `pnpm lint` / `pnpm lint:fix` — ESLint across all packages
- `pnpm check:types` — `vue-tsc` type-check across all packages
- `pnpm test` — Vitest (only `packages/shared` currently has tests)
- `pnpm analyze:cycles` — detect circular imports

Run a single package's script with `pnpm -C <dir>`, e.g.:

- `pnpm -C packages/frontend start` — dev server (Vite, port 3000)
- `pnpm -C packages/frontend build` — production build
- `pnpm -C packages/frontend check` — lint + type-check for that package
- `pnpm -C packages/frontend storybook` — Storybook on port 6006
- `pnpm -C packages/shared test` — run the shared package's Vitest suite
- `pnpm -C packaging/tauri start` — Tauri desktop dev build

Vite configs are loaded with `--configLoader runner` so the TS config files can import workspace code.

## Architecture

### `remote` plugin — the server connection
`packages/frontend/src/plugins/remote/` is the single gateway to the Jellyfin server. It is a `@sealed` class exported as the `remote` singleton (also installed as `$remote`) with four parts:

- `remote.auth` — authentication / current user / current server, persisted
- `remote.sdk` — the `@jellyfin/sdk` client; call APIs via `remote.sdk.newUserApi(getSomeApi)`
- `remote.socket` — the Jellyfin WebSocket
- `remote.axios` — the underlying request performer

Always go through `remote` to reach the server; do not instantiate SDK/axios clients directly.

### Store hierarchy — `packages/frontend/src/store/super/`
There is no Pinia. Stores are plain classes extending a three-level hierarchy:

1. `BaseState` — reactive state with a `defaultState`, reset, and optional `localStorage`/`sessionStorage` persistence. For plugins/abstract use only (no auth dependency).
2. `CommonStore extends BaseState` — adds automatic state reset on logout (`resetOnLogout`). Base class for normal stores.
3. `SyncedStore extends CommonStore` — additionally syncs selected keys to the server's `DisplayPreferences`.

A store's generic params are `<StateShape, ExposedKeys>`: keys listed in `ExposedKeys` become public and writable; everything else is private. Stores are exported as singletons. Notable stores: `playback-manager.ts`, `player-element.ts`, `task-manager.ts`, `dbs/` (Dexie/IndexedDB-backed item cache, with a worker).

### Routing — file-based
Routes are generated from `packages/frontend/src/pages/` by `vue-router/vite` (`unplugin-vue-router`). `<route>` blocks in `.vue` files are YAML. Routes are registered in `main.ts` (not the router plugin) to avoid circular imports. `router.currentRoute.value.meta.layout` drives layout selection (see `src/layouts/`).

### Components & styling
- UI-toolkit components (`J*` prefix) are auto-imported — no explicit import needed; the `JellyfinVueUIToolkit` resolver matches `/^J[A-Z]/`. Vuetify components are auto-imported via `Vuetify3Resolver`.
- Styling is UnoCSS (preset in `@jellyfin-vue/configs/uno`) plus Vuetify; CSS is processed with Lightning CSS, browser targets from `browserslist`.
- provide/inject keys are centralised as typed `InjectionKey` symbols in `store/keys.ts` files.

### Build-time targets
`main.ts` relies on top-level `await` (ES2022) and `Object.groupBy` (ES2024) — keep the TS `target` in sync if touching `tsconfig.json`.

## Conventions

- TypeScript `import` statements must use explicit extensions (`.ts`, `.vue`) — see existing imports like `#/store/index.ts`.
- Path aliases: `#/*` maps to a package's `src/` (configured per-package in `package.json` `imports`).
- Commits follow Conventional Commits (enforced; see the `chore(i18n):`, `chore(deps):` history).
- i18n strings are managed through Weblate — do not hand-edit generated locale data.
