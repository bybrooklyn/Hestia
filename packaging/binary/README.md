# Jellyfin Vue server binary

This package is used by GitHub Actions to build single-file Linux and macOS
executables that embed the production frontend and a Node.js runtime. Each
binary serves the Vite `dist` output directly and has the same runtime
configuration environment variables as the Docker image:

- `PORT`: HTTP port, defaults to `3000`
- `HOST`: listen address, defaults to `0.0.0.0`
- `DEFAULT_SERVERS`: comma-separated Jellyfin server URLs
- `DISABLE_SERVER_SELECTION`: set to `1` to hide server selection
- `HISTORY_ROUTER_MODE`: set to `0` for hash routing; otherwise history routing is used

The workflow copies `packages/frontend/dist` into this directory before running
`pkg`, so the generated `dist` directory is intentionally ignored. Release
builds currently publish:

- `jellyfin-vue-linux-x86_64`
- `jellyfin-vue-linux-aarch64`
- `jellyfin-vue-macos-x86_64`
- `jellyfin-vue-macos-aarch64`
