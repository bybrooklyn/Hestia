# Jellyfin Vue — development tasks. Run `just` to list recipes.
#
# Node ≥24.11 is required (see `engines` in package.json). If your active
# shell Node is older, the justfile transparently prepends the highest
# satisfying nvm-installed version to PATH. With no usable Node found,
# every recipe still runs and pnpm prints a clear engine error.

set shell := ["bash", "-cu"]

# Highest installed `~/.nvm/versions/node/v24.11+` (or v25+) — empty
# string if nvm isn't present or no satisfying version is installed.
nvm_bin := `v=$(ls "$HOME/.nvm/versions/node" 2>/dev/null \
  | grep -E '^v(24\.(1[1-9]|[2-9][0-9])|2[5-9])' \
  | sort -V \
  | tail -1); \
  [ -n "$v" ] && echo "$HOME/.nvm/versions/node/$v/bin" || true`

# Prepend the selected Node to PATH for every recipe.
export PATH := if nvm_bin == "" { env_var('PATH') } else { nvm_bin + ":" + env_var('PATH') }

# pnpm is pinned by package.json; `corepack` ensures the right version is used.
pm := "corepack pnpm"
frontend := pm + " -C packages/frontend"
tauri := pm + " -C packaging/tauri"

# List all available recipes
default:
    @just --list

# One-shot project bootstrap — installs deps, prints toolchain versions.
setup: install
    @echo
    @echo "  node: $(node --version)"
    @echo "  pnpm: $({{pm}} --version)"
    @echo "  ready — try \`just dev\`."

# Install all workspace dependencies
install:
    {{pm}} install

# Install dependencies from the lockfile only (CI-style, no updates)
ci-install:
    {{pm}} install --frozen-lockfile

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

# Nuke node_modules across the workspace (mixed package managers, stale cache). Follow with `just install`.
clean-modules:
    find . -name node_modules -type d -prune -exec rm -rf '{}' +

# Print the resolved Node version + path the justfile is using.
which-node:
    @echo "PATH selection: {{ if nvm_bin == '' { '(system PATH only)' } else { nvm_bin } }}"
    @echo "node:           $(command -v node) — $(node --version)"
    @echo "pnpm (corepack): $({{pm}} --version)"
