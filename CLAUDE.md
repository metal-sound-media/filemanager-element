# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run inside the Docker container:

```bash
docker compose run --rm -p 3000:3000 dev npm run dev   # Vite dev server on port 3000
docker compose run --rm dev npm run build              # Build library (ES module + standalone bundle)
docker compose run --rm test                           # Playwright E2E tests (headless, CI mode)
docker compose run --rm dev npm run test:api           # Node.js API unit tests (server/api.test.js)
```

Run a single Playwright test by title:
```bash
docker compose run --rm test npx playwright test tests/file-manager.test.ts --grep "sidebar"
```

## Architecture

This is a **vanilla JS Web Component** (`<file-manager>`) with zero runtime dependencies. The component is registered via `FileManager.register()` or auto-registered on import.

**Source language rule:** All files under `src/` must be plain `.js` — no TypeScript. Type definitions live in `src/types/` for IDE support only. Tests under `tests/` may use TypeScript.

### Key layers

- **`src/FileManager.js`** — Custom element entry point. Handles HTML lifecycle (`connectedCallback`, `attributeChangedCallback`), creates context, mounts UI.
- **`src/state/`** — Lightweight pub/sub stores (`store.js`) and a `QueryClient` for data fetching with caching. Pattern mirrors Svelte stores + React Query.
- **`src/store/`** — Business logic: file upload, delete, folder create/delete, flash messages. Operations do optimistic cache updates.
- **`src/ui/`** — Vanilla JS UI components. Each component is a function that appends to a container element and returns a cleanup function.
- **`src/config.js`** — Default REST API configuration. Consumers can override individual endpoints or replace handlers entirely with custom functions.
- **`src/lang.js`** + **`src/langs/`** — i18n (English and French).

### Data flow

Attribute changes → `FileManager.js` → `createContext()` (stores + QueryClient) → `createFileManagerUI()` → UI components subscribe to stores and query cache → mutations dispatch through `src/store/` business logic → QueryClient cache invalidation triggers re-renders.

### Build outputs

Two bundles are produced:
- `FileManager.js` — ES module, external dependencies (for bundler usage)
- `FileManager.standalone.js` — fully bundled, no external deps (for CDN/direct script tag)

Controlled by `STANDALONE=1` env var in `vite.config.js`.

### Server (dev/test only)

`server/api.js` is a Vite plugin providing an in-memory + filesystem REST API. It is used automatically during `npm run dev` and Playwright tests. Files are stored under `server/storage/`.

### Testing

E2E tests in `tests/file-manager.test.ts` use Playwright against the live dev server. The `tests/mockApi.ts` helper intercepts or stubs API responses. API unit tests in `tests/server/api.test.js` use Node's built-in `node:test` runner.
