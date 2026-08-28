# TTRPG Companion App

A Vue.js application for managing tabletop RPG sessions with real-time synchronization between
GM controls, player views, and shared screens.

## Features

- **GM Control Panel**: Session management, player administration, asset uploads, combat tracking
- **Player Screen**: Read-only display view for TV/projector
- **Player Join**: Mobile-friendly interface for session participants
- **Real-time Sync**: All views update automatically via Supabase Realtime
- **Asset Management**: Image uploads for portraits, scenes, and maps
- **QR Code Join**: Easy session joining with generated QR codes

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Styling**: Tailwind CSS v4
- **State Management**: Pinia stores
- **Agent Instructions**: [Ruler](https://github.com/intellectronica/ruler) (agent-agnostic AI guidance)

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
   This also runs `npx @intellectronica/ruler apply` automatically (via `postinstall`)
   to generate agent-specific instruction files from `.ruler/`.

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key to .env
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - GM Control: http://localhost:5173/gm/
   - Player Screen: http://localhost:5173/screen/:session_id
   - Player Join: http://localhost:5173/join/:session_id

## Project Structure

```
├── .github/
│   └── workflows/          # CI pipelines (lint, typecheck, build, ruler validation)
├── .ruler/                 # Single source of truth for AI agent instructions
│   ├── AGENTS.md           # Primary rules and agent setup instructions
│   ├── architecture.md     # Project architecture & data flow
│   ├── coding-conventions.md # Coding standards & patterns
│   ├── database.md         # Supabase schema & real-time patterns
│   └── ruler.toml          # Ruler configuration
├── docs/                   # Project documentation
│   ├── project-plan.md
│   └── testing/
├── public/                 # Static assets (favicons, manifest)
├── scripts/
│   ├── db/                 # Database utility scripts
│   └── tests/              # Manual test scripts
│       └── browser/        # Browser-based test pages
├── src/
│   ├── assets/             # Global styles
│   ├── components/         # Shared Vue components
│   ├── plugins/            # Vue plugins (router, supabase)
│   ├── stores/             # Pinia state stores
│   ├── types/              # TypeScript type definitions
│   └── views/              # Route components
│       ├── Gm/             # GM control panel views
│       ├── Screen/         # Player screen views
│       └── Join/           # Player join views
├── supabase/               # Database schema and migrations
├── .editorconfig           # Editor configuration
├── .prettierrc             # Code formatter config
├── eslint.config.js        # ESLint flat config
├── CONTRIBUTING.md         # Contribution guidelines
└── README.md               # This file
```

## AI Agent Workflow

This project uses **[Ruler](https://github.com/intellectronica/ruler)** for vendor-agnostic
AI coding instructions. All agent guidance lives in `.ruler/` as a single source of truth.

### For Human Developers

- Modify AI instructions by editing files in `.ruler/`
- Run `npm run ruler:apply` (or `npx @intellectronica/ruler apply`) to regenerate agent files
- Generated files (`AGENTS.md`, `CLAUDE.md`, `.clinerules`, etc.) are **gitignored**

### For AI Agents

**⚠️ Before making any changes, you MUST run:**
```bash
npx @intellectronica/ruler apply
```
This generates your agent-specific instruction files from `.ruler/`. These files are
gitignored and may be missing or stale. Do NOT edit generated files directly.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking only |
| `npm run create-buckets` | Create Supabase storage buckets |
| `npm run ruler:apply` | Generate AI agent instruction files from `.ruler/` |

## Database

The app uses Supabase with the following key tables:
- `sessions` — Game session data
- `session_characters` — Players joined to sessions
- `session_assets` — Uploaded images and files
- `monster_templates` — Reusable monster stat blocks
- `encounters` / `encounter_monsters` — Pre-planned combat encounters
- `active_combats` / `combat_participants` — Running combat state
- `premade_characters` — Pre-built characters for quick join

See `supabase/migrations/` for the complete schema and `.ruler/database.md` for database patterns.