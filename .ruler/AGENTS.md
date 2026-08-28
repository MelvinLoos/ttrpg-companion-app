<!-- Source: .ruler/AGENTS.md -->

# ⚠️ READ THIS FIRST — Agent Setup Instructions

> **For ALL AI coding agents (Claude, Copilot, Cline, Cursor, Windsurf, Aider, etc.):**
>
> Before making **any** changes to this project, you MUST run:
>
> ```bash
> npx @intellectronica/ruler apply
> ```
>
> This generates the agent-specific instruction files (`AGENTS.md`, `CLAUDE.md`, `.clinerules`,
> etc.) from the **single source of truth** in `.ruler/`. These generated files are
> **gitignored and NOT committed** to the repository.
>
> **CRITICAL RULES:**
> - **NEVER** edit the generated agent files directly
> - **ALWAYS** modify the source files in `.ruler/` and re-run `ruler apply`
> - All `.ruler/*.md` files are concatenated together to form the final instructions
> - Run `ruler apply` at the start of EVERY session — generated files may be stale or missing

---

## Project Overview

This is the **TTRPG Companion App** — a Vue 3 web application for managing tabletop RPG sessions
with real-time synchronization between GM controls, player views, and shared screens.

### Three Frontends (sharing core code)
1. **GM Control Panel** — Full app at `/gm/*` for session management, player administration,
   asset uploads, combat tracking
2. **Player Screen** — Read-only display at `/screen/:session_id` for TV/projector view
3. **Player Join** — Mobile-first interface at `/join/:session_id` for session participants

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Styling**: Tailwind CSS v4
- **State Management**: Pinia stores
- **Routing**: Vue Router 4
- **Package Manager**: npm

### Key Routes
| Route | View |
|-------|------|
| `/gm/` | GM Lobby (session management) |
| `/gm/sessions` | Session CRUD |
| `/gm/characters` | Character management |
| `/gm/monsters` | Monster template library |
| `/gm/encounters` | Encounter management |
| `/gm/combat` | Combat tracker |
| `/gm/assets` | Asset/image gallery |
| `/screen/:session_id` | Player screen (lobby/in-play states) |
| `/join/:session_id` | Player join form |
| `/join/:session_id/success` | Join confirmation |