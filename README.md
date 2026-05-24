<h1 align="center">Hestia</h1>
<h3 align="center">A Jellyfin Vue fork for Jellyfin media servers</h3>

---

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
<a href="https://github.com/bybrooklyn/Hestia">
<img alt="Repository" src="https://img.shields.io/badge/repo-bybrooklyn%2FHestia-blue">
</a>
<a href="https://github.com/bybrooklyn/Hestia">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/bybrooklyn/Hestia.svg"/>
</a>
<a href="https://github.com/bybrooklyn/Hestia/releases">
<img alt="Fork Release" src="https://img.shields.io/github/release/bybrooklyn/Hestia.svg"/>
</a>
<a href="https://github.com/bybrooklyn/Hestia/actions/workflows/build_binary.yml">
<img alt="Server Binary" src="https://img.shields.io/github/actions/workflow/status/bybrooklyn/Hestia/build_binary.yml?branch=develop&label=server%20binary">
</a>
<a href="https://github.com/bybrooklyn/Hestia/actions/workflows/build_docker.yml">
<img alt="Docker Image" src="https://img.shields.io/github/actions/workflow/status/bybrooklyn/Hestia/build_docker.yml?branch=develop&label=docker">
</a>
<a href="https://conventionalcommits.org">
<img alt="Conventional Commits" src="https://img.shields.io/badge/Conventional%20Commits-%23FE5196?logo=conventionalcommits&logoColor=white" />
</a>
<a href="https://github.com/jellyfin/jellyfin-vue">
<img alt="Based on Jellyfin Vue" src="https://img.shields.io/badge/based%20on-jellyfin--vue-00a4dc">
</a>
<a href="https://translate.jellyfin.org/projects/jellyfin-vue/jellyfin-vue/">
<img alt="Upstream translations" src="https://translate.jellyfin.org/widgets/jellyfin-vue/-/jellyfin-vue/svg-badge.svg">
</a>
<a href="https://opencollective.com/jellyfin">
<img alt="Donate" src="https://img.shields.io/opencollective/all/jellyfin.svg?label=backers"/>
</a>
<a href="https://www.reddit.com/r/jellyfin">
<img alt="Join our Subreddit" src="https://img.shields.io/badge/reddit-r%2Fjellyfin-%23FF5700.svg"/>
</a>
</p>

---

Hestia is an independent fork of [Jellyfin Vue](https://github.com/jellyfin/jellyfin-vue), a browser-based web client for [Jellyfin](https://jellyfin.org/) written with Vue 3.

The goal of this fork is a fuller, daily-driver browser client for Jellyfin: broad capability parity with the main Jellyfin Web client, richer playback controls, stronger admin coverage, and practical self-hosting builds while staying compatible with Jellyfin servers and the upstream Jellyfin Vue architecture.

![](https://raw.githubusercontent.com/jellyfin/jellyfin.org/refs/heads/master/blog/2023/04-03-vue_vue3/vue-homepage.png)

> [!NOTE]
> Hestia is not an official Jellyfin project. It is based on Jellyfin Vue and keeps upstream Jellyfin compatibility as a core constraint.

# Usage instructions for end users 👨‍👩‍👧‍👦

*Hestia builds are currently preview builds from the fork's `develop` branch.
There are no stable Hestia releases yet.*

## Try it 🌍

There is not a separate hosted Hestia instance documented in this repository yet. For a hosted upstream Jellyfin Vue build, use [jf-vue.pages.dev](https://jf-vue.pages.dev/) and enter your Jellyfin server address when prompted. If you do not have a Jellyfin server, try the Jellyfin demo server: `https://demo.jellyfin.org/stable`

⚠️ **This only works for Jellyfin servers that [are behind a reverse proxy and have HTTPS set up correctly](https://jellyfin.org/docs/general/networking/#running-jellyfin-behind-a-reverse-proxy)**. If your server runs over HTTP, you must host it yourself.

The upstream hosted instance is provided by the upstream Jellyfin Vue project, not this fork.

## Host it yourself 💽

Hestia can be built and hosted like any static frontend, or packaged with the fork's Docker and server-binary workflows.

- **Build locally:** run `just setup` once, then `just build`.
- **Docker:** see [packaging/docker/README.md](packaging/docker/README.md). The Dockerfile must be built with the repository root as its context.
- **Single Linux server binary:** see [packaging/binary/README.md](packaging/binary/README.md). CI builds static Linux binaries for `x86-64` and `aarch64` that serve the production frontend.
- **Fork artifacts:** check the [Server Binary workflow](https://github.com/bybrooklyn/Hestia/actions/workflows/build_binary.yml) and [Docker Image workflow](https://github.com/bybrooklyn/Hestia/actions/workflows/build_docker.yml) for artifacts from `develop`.

The upstream Jellyfin Vue deployment resources are still useful for comparison:
[upstream deployment wiki](https://github.com/jellyfin/jellyfin-vue/wiki/Deployment),
[upstream GHCR images](https://github.com/jellyfin/jellyfin-vue/pkgs/container/jellyfin-vue),
and [upstream DockerHub images](https://hub.docker.com/r/jellyfin/jellyfin-vue).

Common runtime configuration variables for the Docker and server-binary paths:

- `PORT`: HTTP port, defaults to `3000`
- `HOST`: listen address, defaults to `0.0.0.0`
- `DEFAULT_SERVERS`: comma-separated Jellyfin server URLs
- `DISABLE_SERVER_SELECTION`: set to `1` to hide server selection
- `HISTORY_ROUTER_MODE`: set to `0` for hash routing; otherwise history routing is used

## Project status 🧭

The fork tracks planning and release-readiness in repository documents:

- [PARITY.md](PARITY.md) — capability parity tracker against the pinned jellyfin-web baseline
- [KNOWN_BUGS.md](KNOWN_BUGS.md) — product defects that are not parity work
- [PERFORMANCE_NOTES.md](PERFORMANCE_NOTES.md) — measured startup and rendering performance notes
- [UPSTREAM_PR_PLAN.md](UPSTREAM_PR_PLAN.md) — rules for extracting clean upstream PRs from fork work
- [FORK_ROADMAP.md](FORK_ROADMAP.md) — broader fork strategy and future ideas

## Privacy disclaimer 🕵🏻

Hestia is just a GUI *(Graphical User Interface)* for a Jellyfin server. It only establishes application connections to the Jellyfin server that you point it to, **nothing else**.

<details>
<summary><strong>Read more</strong></summary>

- **Local instances** _Examples: a desktop app, a local web server, etc_: All the necessary assets for the frontend to work
  are available locally (in your device) or bundled into the underlying environment (Tauri, Electron, etc) where it is running.
  No assets need to be fetched remotely.
- **Remote instances** _Examples: A hosted instance, an admin hosting Hestia and sharing the URL
  (which is in a different domain from the Jellyfin Server), etc_: This probably comprises most cases.
  Here, all the frontend assets are not locally available, but somewhere else. When you access the remotely hosted frontend
  (normally using a web browser like Firefox or Microsoft Edge),
  all the frontend assets are loaded/cached into your device. Once the load has finished,
  **the connection will exclusively be between your device and the Jellyfin server(s)** ¹². Whoever is serving the frontend
  is never in the middle. ³

¹ _Assuming that the hosted version has not been altered (by adding trackers, beacons...) in any way from the sources provided in this repository
and you trust the person/people behind it to not have done so_.

² _Some features that need access to remote resources that are not controlled by you and/or the person hosting Hestia might be added in the future
(such as Google Cast support for Chromecasts). These will always be **opt in** and toggleable through configuration._

³ _We assume standard networks here, no special configurations or policies that your ISP/Workplace/University/etc might apply._

[Jellyfin Web](https://github.com/jellyfin/jellyfin-web) works in a similar way:
It connects by default to the Jellyfin server that is running alongside,
but it's also capable to connect to other Jellyfin servers [like can be tested in our demo](https://demo.jellyfin.org/) and [the hosted instance](https://jellyfin-web.pages.dev/).
By inspecting the network requests, you will find that only connections to fetch its own assets are made to the server distributing the client, but connections to your own Jellyfin server will not go through it.

The same principle applies to Hestia. Note that Jellyfin Web can also be hosted standalone, just like Hestia and Jellyfin Vue.

- _Relevant links_: [Community standards](https://jellyfin.org/docs/general/community-standards) and [Social Contract](https://github.com/jellyfin/jellyfin-meta/blob/master/policies-and-procedures/jellyfin-social-contract.md)
</details>

# Usage instructions for developers 🛠

Hestia uses Node `>=24.11.0 <25.0.0` and `pnpm@11.1.2`.

The fork includes a `justfile` for the common development tasks:

```sh
just setup      # install dependencies and print toolchain versions
just dev        # run the frontend dev server on http://localhost:3000
just build      # production frontend build
just verify     # lint, type-check, and test
```

Direct `pnpm` commands are also available:

```sh
corepack pnpm install
corepack pnpm -C packages/frontend start
corepack pnpm -C packages/frontend build
corepack pnpm lint
corepack pnpm check:types
corepack pnpm test
```

The upstream Jellyfin Vue [development setup](https://github.com/jellyfin/jellyfin-vue/wiki/Contributing#development-setup) is still useful background, but this fork's local commands and planning docs are the source of truth for Hestia work.

# Contributing 🤝

For fork work, open issues and pull requests against [bybrooklyn/Hestia](https://github.com/bybrooklyn/Hestia).

For changes intended for upstream Jellyfin Vue, follow [UPSTREAM_PR_PLAN.md](UPSTREAM_PR_PLAN.md): branch from a fresh `upstream/master`, keep one feature or fix per branch, and do not include fork-only planning docs in upstream PRs.

For upstream project norms, see the Jellyfin Vue [Contributing](https://github.com/jellyfin/jellyfin-vue/wiki/Contributing) guide.
