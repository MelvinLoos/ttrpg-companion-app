<!-- Source: .ruler/coding-conventions.md -->

## Coding Conventions

### TypeScript

- **Strict mode** enabled (`tsconfig.app.json`: `"strict": true`)
- **No unused locals/parameters** enforced
- Use `interface` for object shapes, `type` for unions/intersections
- Always type function return values for exported functions
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Vue 3 (Composition API)

- Use `<script setup lang="ts">` syntax exclusively
- Prefer `ref()` for primitives, `reactive()` for objects
- Use `computed()` for derived state, not watchers
- Use `defineProps<T>()` with TypeScript generic for typed props
- Use `defineEmits<T>()` for typed emits
- Components use PascalCase filenames (e.g., `PartyBar.vue`)
- Single-file components only — one component per `.vue` file
- Use `<style scoped>` for component-specific styles (Tailwind classes are preferred)

### Pinia Stores

- Use Composition API store syntax: `defineStore('name', () => { ... })`
- Export composable functions (e.g., `useCombatStore`)
- Keep stores focused on a single domain (session, combat, character, asset, auth)
- Store actions should handle Supabase queries directly
- Use `readonly()` on state that should not be mutated externally

### Supabase

- Always use the shared client from `src/plugins/supabase.ts`
- Handle errors explicitly — check `{ data, error }` on every query
- Use RLS-compatible queries — never bypass row-level security
- Always provide `.select()` when inserting/updating to get returned data
- Channel names should be descriptive: `'session-updates'`, `'character-changes'`

### Naming

- **Files**: kebab-case for utilities, PascalCase for components
- **Variables/Functions**: camelCase
- **Interfaces/Types**: PascalCase, prefixed with domain (e.g., `SessionCharacter`, `CombatEncounter`)
- **Pinia stores**: camelCase, prefixed with `use` (e.g., `useSessionStore`)
- **Supabase tables**: snake_case (`session_characters`, `monster_templates`)

### Styling

- **Tailwind CSS v4** is the primary styling system
- Use Tailwind utility classes directly in templates
- Avoid inline styles unless dynamically computed
- Use `class` attribute, not `:class` when classes are static
- Component-specific overrides via `<style scoped>` when Tailwind can't express it

### Git Commits

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- One logical change per commit
- Reference Linear/GitHub issues in commit body when applicable

### Project Tooling

| Tool | Purpose |
|------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint across the project |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Run Vue TypeScript compiler check only |
| `npm run ruler:apply` | Generate agent files from `.ruler/` |