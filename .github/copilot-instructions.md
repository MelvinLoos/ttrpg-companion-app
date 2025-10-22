<!--
  .github/copilot-instructions.md
  Purpose: concise, project-specific guidance for AI coding agents working on the
  TTRPG Companion App. This merges the generic starter checklist with concrete
  patterns discovered in the project plan (`.github/Project-Plan.md`).
-->

# Copilot instructions (concise & actionable)

Follow these steps when making edits or implementing features in this repo. Read
the linked `./.github/Project-Plan.md` for full product goals; the bullets below
highlight the patterns and workflows agents must follow.

1) Big-picture architecture (what you'll see)
   - Three frontends (all Vue 3 + Vite): `GM Control Panel`, `Player Screen`, `Player App`.
   - Real-time state is via Supabase (Postgres + Realtime + Storage). The Player Screen and Player App subscribe to session rows and session_characters changes.
   - Key routes (expected): `/gm`, `/screen/:session_id`, `/join/:session_id`.

2) Critical files & recommended locations
   - Frontend entry: `src/main.ts` (Vite + Vue).
   - Views: `src/views/Gm/*`, `src/views/Screen/*`, `src/views/Join/*`.
   - Components: `src/components/PartyBar.vue`, `src/components/LobbyView.vue`, `src/components/CombatView.vue`.
   - State: `src/stores/*` (Pinia). Use stores for session and character caches.
   - Plugins: `src/plugins/supabase.ts` (single Supabase client used across apps).

3) Database and realtime patterns (explicit)
   - Core tables: `sessions`, `premade_characters`, `session_characters`, `session_assets`.
   - Typical workflow examples:
     - GM pushes an image to screen: UPDATE sessions SET active_image_url='…', showing='lobby' WHERE id='…'.
     - Player join: INSERT INTO session_characters (session_id, name, ...) VALUES (...).
   - Subscriptions: components subscribe to the single `sessions` row for the session and to `session_characters` for live lists. Use Supabase Realtime for inserts/updates/deletes.

4) Supabase specifics & conventions
   - Use `@supabase/supabase-js` client in a global plugin (`src/plugins/supabase.ts`).
   - Storage bucket names: `portraits`, `scenes`, `maps` (per project plan). Uploaded assets should record `storage_bucket`, `storage_path`, and `public_url` in `session_assets`.
   - Security: anticipate Row-Level Security (RLS). Expect policies: public read for assets, full access only for owning `gm_id` on session-owned rows.

5) Developer workflows (how to build/run)
   - Typical frontend setup (Vue + Vite):
     - Create project: `npm create vite@latest companion-app -- --template vue`
     - Install deps: `npm install`
     - Dev server: `npm run dev` (check `package.json` scripts if present and use exact commands found there).
   - Supabase setup: create project, run SQL migrations for the schema in `Project-Plan.md`, enable RLS, create storage buckets.

6) Code style & PR rules (project-specific)
   - Keep changes small and focused: one feature/bug per PR.
   - If adding or changing stores, update corresponding view components that rely on them.
   - When touching Realtime subscriptions, ensure components unsubscribe on unmount to avoid duplicate events.

7) Useful examples (copyable patterns to match project)
   - Dynamic view switching (screen):
     - <component :is="currentView" /> where `currentView` is determined by `session.showing`.
   - Initiative flow (combat): sort `session_characters` by `initiative_roll` desc and highlight `sessions.active_turn_character_id`.

8) When the repo is empty or missing files
   - Start by adding a focused README and the three app scaffolds under `src/`.
   - Provide a `scripts` section in `package.json` with `dev`, `build`, `preview`, and `test` if applicable.

9) Where to look for verification
   - The full product plan: `./.github/Project-Plan.md` (attached in this repo).
   - When implementing DB changes, include a SQL migration and a short test script that demonstrates basic inserts/updates and a real-time subscription (can be a tiny Node script or unit tests).

10) If you're blocked / need more context
    - Ask the repo owner for the Supabase project URL, the RLS policy drafts, or which folder is the intended monorepo root if multiple apps will be added.

-----
If you'd like, I can now scaffold the initial Vue + Vite frontend (three basic routes, a `supabase` plugin, and Pinia store templates) and a SQL migration file for the tables listed in `./.github/Project-Plan.md`. Tell me which you'd prefer and I'll start the next change.
<!--
  .github/copilot-instructions.md
  Purpose: concise, project-specific guidance for AI coding agents working in this repo.
  NOTE: This repository currently contains no source files (checked 2025-10-23). This
  document is a practical starter template — update it after the codebase is added so
  the examples below reference real files.
-->

# Copilot instructions (short & actionable)

If you're an automated coding assistant operating on this repository, follow these steps
in order. This file is intentionally short — prefer exact file checks and concrete
changes over generic suggestions.

1. Repository health check (required)
   - If the workspace is empty, report that to the human and request the code or a path
     to inspect. (As of 2025-10-23 this repo appears empty.)
   - Otherwise locate these files (stop when you find one): `README.md`, `package.json`,
     `pyproject.toml`, `go.mod`, `Cargo.toml`, `Makefile`, `Dockerfile`, `.github/workflows/`.

2. Identify the build/test commands (exact)
   - Read `package.json` -> `scripts` for `build`, `test`, `start` and use those exact
     commands. Example: if `package.json` has "build": "tsc -p .", use `npm run build`.
   - If `pyproject.toml` or `requirements.txt` exists, prefer `python -m pip install -r requirements.txt` and `pytest` for tests.
   - If there is a `Makefile`, prefer invoking `make <target>` only after reading the file.

3. Entrypoints and service boundaries
   - Look for `src/main.*`, `src/index.*`, `cmd/`, `server/`, `app/` or `services/` to
     discover individual services or binaries. Treat each top-level folder with a
     `main`/`index` as a separate service unless the README says otherwise.

4. Config, secrets, infra integrations
   - Search for `Dockerfile`, `docker-compose.yml`, `terraform/`, `infra/`, `.github/workflows`.
   - Expect environment configuration via `.env` or a `config/` directory. Never auto-commit secrets — if you detect secrets, report and stop.

5. Tests and CI
   - Locate `test`, `tests`, or `__tests__` folders. Use the project test runner found in step 2.
   - For CI behavior, read `.github/workflows/*` to mirror exact commands in PR checks.

6. Code style and conventions (how to make edits)
   - Prefer small, targeted changes and include/modify existing scripts and docs rather than creating new ones unless the repo is empty.
   - If the repo uses TypeScript, follow existing tsconfig settings; if ESLint or Prettier configs are present, run lint fixes before committing.

7. When creating the first actionable edits (empty repo case)
   - Add a short `README.md` describing languages and top-level commands.
   - Add basic CI (one workflow) that runs the project's build and test commands.
   - Add a minimal `./.github/copilot-instructions.md` (this file) and reference which files the AI used to infer behavior.

8. Examples & references
   - Replace these placeholders with concrete references after code appears. Example patterns to reference when present:
     - `package.json` scripts used by CI: `build`, `test`, `lint`
     - Service entrypoints: `src/server.ts`, `cmd/api/main.go`, `app.py`
     - Integration manifests: `docker-compose.yml`, `terraform/`, `k8s/` manifests

9. Safety and commit policy
   - Make one small change per PR with a clear title and description linking to the issue or ticket if present.
   - Do not modify credentials, secrets, or production infra files without explicit human approval.

10. If you need more context
    - Ask the repo owner for the primary language and the path to the main service or README.

-----
Please update this file with concrete examples once the repository contains code. If you'd like, I can re-run discovery and produce a merged, project-specific version as soon as the files are available.
