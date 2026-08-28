<!-- Source: .ruler/database.md -->

## Database & Supabase

### Supabase Client

The shared Supabase client lives in `src/plugins/supabase.ts`. Always import it from there:
```typescript
import { supabase } from '@/plugins/supabase'
```

Environment variables required (in `.env`):
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `sessions` | Game session data (name, state, active image, showing mode) |
| `session_characters` | Players joined to sessions (join via QR code) |
| `session_assets` | Uploaded images and files (portraits, scenes, maps) |
| `monster_templates` | Reusable monster stat blocks |
| `encounters` | Pre-planned combat encounters |
| `encounter_monsters` | Monsters assigned to encounters (junction table) |
| `active_combats` | Running combat instances linked to sessions |
| `combat_participants` | Monsters and characters in active combat |
| `premade_characters` | Pre-built characters available for quick join |

### Storage Buckets

- `portraits` — Character and monster portrait images
- `scenes` — Background/scene images
- `maps` — Battle map images

### RLS Policies

- All tables have Row Level Security enabled
- **Public read** for session data (anyone with session ID can view)
- **Authenticated writes** for GM operations
- Asset storage: public read, authenticated write
- Premade characters: public read (anonymous access for character selection)

### Realtime

Realtime is enabled on key tables. Components should subscribe to relevant channels:

```typescript
// Example: Subscribe to session changes
supabase
  .channel('session-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sessions',
    filter: `id=eq.${sessionId}`
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
  })
  .subscribe()
```

### Migrations

Located in `supabase/migrations/`. Naming convention:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

When adding new features:
1. Create a new migration file
2. Test with local Supabase
3. Include RLS policies in the same migration
4. Reference migration in PR description

### Local Development

For local Supabase development, use the Supabase CLI:
```bash
supabase start     # Start local Supabase
supabase stop      # Stop local Supabase
supabase status    # Check status
```
