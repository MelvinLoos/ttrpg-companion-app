# Copilot instructions (concise & actionable)

This document provides essential guidance for AI coding agents working on the TTRPG Companion App. Reference `.github/Project-Plan.md` for complete product goals.

## 1. Architecture Overview
- **Three Vue 3 Frontends** (all sharing core code):
  - GM Control Panel: Main app for session management
  - Player Screen: Read-only display (TV/projector view)
  - Player App: Mobile-first interface for participants
- **Real-time State Flow**: All views sync via Supabase Realtime subscriptions
- **Key Routes**: `/gm/*`, `/screen/:session_id`, `/join/:session_id`

## 2. Critical Files & Patterns
- **Entry Points**: `src/main.ts` (Vite + Vue entry)
- **Views**: `src/views/{Gm,Screen,Join}/*` (route components)
- **Components**: `src/components/{PartyBar,LobbyView,CombatView}.vue`
- **State**: `src/stores/*` (Pinia stores for session/character caches)
- **Backend**: `src/plugins/supabase.ts` (shared Supabase client)

## 3. Database & Real-time Patterns
```sql
-- Example: GM updates screen state
UPDATE sessions 
SET active_image_url = '...', showing = 'combat' 
WHERE id = '...'

-- Example: Player joins session
INSERT INTO session_characters (session_id, name, ...) 
VALUES ('...', '...')
```
- Components MUST subscribe to `sessions` row + `session_characters`
- ALWAYS unsubscribe in `onUnmounted()` to prevent duplicate events

## 4. Development Workflow
```bash
# Initial setup
npm create vite@latest companion-app -- --template vue
npm install
npm run dev

# Required dependencies
npm i @supabase/supabase-js pinia vue-router
```

## 5. Integration Points
- **Supabase Storage**: Use buckets `portraits`, `scenes`, `maps`
- **Asset Management**: Record all uploads in `session_assets` table
- **Security**: RLS policies - public read for assets, restricted writes

## 6. Common Code Patterns
```vue
<!-- Dynamic view switching (screen) -->
<component :is="currentView" v-bind="viewProps" />

<!-- Real-time subscription setup -->
onMounted(async () => {
  const subscription = supabase
    .channel('session-updates')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'sessions'
    }, handleUpdate)
    .subscribe()

  onUnmounted(() => subscription.unsubscribe())
})
```

## 7. PR Guidelines
- One feature/bug per PR
- Include SQL migrations for schema changes
- Add subscription cleanup in components
- Test real-time sync across all three views

## 8. If Blocked
- Supabase project URL needed for local dev
- RLS policy drafts in Project-Plan.md
- Ask if monorepo or separate repos for views
