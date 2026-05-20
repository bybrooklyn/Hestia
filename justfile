# Jellyfin Vue — development tasks. Run `just` to list recipes.

# pnpm is pinned by package.json; `corepack` ensures the right version is used.
pm := "corepack pnpm"
frontend := pm + " -C packages/frontend"
tauri := pm + " -C packaging/tauri"

# List all available recipes
default:
    @just --list

# Install all workspace dependencies
install:
    {{pm}} install

# Install dependencies from the lockfile only (CI-style, no updates)
ci-install:
    {{pm}} ci

# Run the frontend dev server (Vite, http://localhost:3000)
dev:
    {{frontend}} start

# Build the frontend for production
build:
    {{frontend}} build

# Preview the production build locally
serve:
    {{frontend}} serve

# Build then preview the production frontend
prod:
    {{frontend}} prod

# Run the Tauri desktop app in dev mode
tauri:
    {{tauri}} start

# Build the Tauri desktop app
tauri-build:
    {{tauri}} build

# Run Storybook (component explorer, port 6006)
storybook:
    {{frontend}} storybook

# Lint every package
lint:
    {{pm}} lint

# Lint and auto-fix every package
fix:
    {{pm}} lint:fix

# Type-check every package with vue-tsc
types:
    {{pm}} check:types

# Run the test suites
test:
    {{pm}} test

# Detect circular imports
cycles:
    {{pm}} analyze:cycles

# Analyze the frontend production bundle size
analyze:
    {{frontend}} analyze:bundle

# Lint + type-check the frontend (matches its `check` script)
check:
    {{frontend}} check

# Full pre-push gate: lint, type-check, and test everything
verify: lint types test

# Remove all git-ignored build artifacts from the frontend
clean:
    {{frontend}} clean
