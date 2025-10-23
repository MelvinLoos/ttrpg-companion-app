# Database Management

This project uses Supabase for database management. The schema is managed through migration files in the `supabase/migrations` directory.

## Structure

- `migrations/`: Contains timestamped SQL migration files
- `schemas/`: Contains schema definitions split by domain
  - `extensions.sql`: Database extensions
  - `sessions.sql`: Core session management tables
  - `characters.sql`: Character-related tables
  - `assets.sql`: Asset management tables
  - `policies.sql`: Row Level Security policies

## Local Development

To run migrations locally:

```bash
# Reset database to a clean state (WARNING: Destroys all data)
supabase db reset

# Push new migrations to remote database
supabase db push
```

## Tables

### sessions
Core table for game sessions. Contains:
- Basic session info (name, current state)
- Active displays (images, text)
- Turn management

### premade_characters
Template characters that GMs can create and reuse:
- Character details
- Portrait links
- Stats in JSON format

### session_characters
Active characters in a session:
- Player characters
- NPCs and monsters
- Initiative tracking
- Hand raising for questions

### session_assets
Manages uploaded files:
- Images for scenes
- Character portraits
- Maps and other visuals

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- GMs can only access their own content
- Players can read but not modify most content
- Asset access is controlled per session