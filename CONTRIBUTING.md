# Contributing to TTRPG Companion App

Thank you for contributing! This document covers how to set up your development environment
and the standards we follow.

## Getting Started

### One-Time Setup

```bash
# Clone and install
git clone git@github.com:MelvinLoos/ttrpg-companion-app.git
cd ttrpg-companion-app
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Generate AI agent instruction files
npm run ruler:apply
```

### AI Agent Setup (CRITICAL)

This project uses **[Ruler](https://github.com/intellectronica/ruler)** for agent-agnostic
AI coding instructions. **Every AI agent working on this project must run:**

```bash
npx @intellectronica/ruler apply
```

This generates agent-specific instruction files (`AGENTS.md`, `CLAUDE.md`, `.clinerules`)
from the single source of truth in `.ruler/`. These generated files are **gitignored**
and never committed.

If you're adding or updating AI guidance, edit the files in `.ruler/` and re-run the command.

## Development Workflow

```bash
npm run dev        # Start dev server on http://localhost:5173
npm run lint       # Check for code issues
npm run format     # Format code with Prettier
npm run typecheck  # TypeScript type checking
npm run build      # Full production build (includes type checking)
```

## Code Quality

All contributions must pass:
- **ESLint**: `npm run lint`
- **TypeScript**: `npm run typecheck`
- **Prettier**: Code must be formatted (`npm run format`)
- **Build**: `npm run build`

CI runs all of these automatically on pull requests.

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add monster template library
fix: resolve session subscription memory leak
docs: update architecture documentation
refactor: extract combat state into Pinia store
chore: update dependencies
```

## Pull Request Guidelines

1. One feature or bug fix per PR
2. Include database migrations for schema changes
3. Ensure real-time subscriptions are cleaned up in components (`onUnmounted`)
4. Test across all three views (GM, Screen, Join) when applicable
5. Add `@typescript-eslint/no-unused-vars` suppression only when necessary

## Project Structure

See `.ruler/architecture.md` for the complete project structure and data flow diagrams.
See `README.md` for an overview of features and routes.

## Questions?

- Check `.ruler/` for architecture, coding conventions, and database schema details
- Review existing components in `src/components/` for patterns to follow
- Open an issue for bugs or feature requests