<!-- Source: .ruler/architecture.md -->

## Architecture & Critical Patterns

### Code Organization

```
src/
├── main.ts                   # App entry point, Pinia + Vue Router setup
├── App.vue                   # Root component
├── assets/
│   └── style.css             # Global styles (Tailwind directives)
├── components/               # Shared/reusable Vue components
│   ├── AssetPreview.vue      # Image preview with zoom
│   ├── AssetPreviewModal.vue # Modal wrapper for asset preview
│   ├── AssetUploader.vue     # Drag-and-drop file upload
│   ├── CharacterForm.vue     # Character creation/editing form
│   ├── GmAssetGallery.vue    # GM asset browser and manager
│   ├── GmCombatTracker.vue   # GM combat management interface
│   ├── GmSessionControl.vue  # Session state controls
│   ├── PartyBar.vue          # Party member list sidebar
│   └── PublicCombatTracker.vue # Read-only combat display
├── plugins/
│   ├── router.ts             # Vue Router configuration
│   └── supabase.ts           # Supabase client singleton
├── stores/                   # Pinia state stores
│   ├── asset.ts              # Asset management store
│   ├── auth.ts               # Authentication store
│   ├── character.ts          # Character CRUD store
│   ├── combat.ts             # Combat state store
│   └── session.ts            # Session management store
├── types/                    # TypeScript interfaces
│   ├── character.ts
│   ├── combat.ts
│   ├── session.ts
│   └── supabase.ts
└── views/                    # Route-level components
    ├── SignInView.vue
    ├── Gm/                   # GM control panel views
    │   ├── GmLayout.vue      # GM layout wrapper with nav
    │   ├── LobbyView.vue     # Main GM dashboard
    │   ├── SessionsView.vue
    │   ├── CharactersView.vue
    │   ├── MonstersView.vue  # Monster template CRUD
    │   ├── MonsterLibrary.vue # Monster browser
    │   ├── EncountersView.vue
    │   ├── CombatView.vue    # Active combat tracker
    │   └── AssetsView.vue    # Asset management
    ├── Screen/               # Player screen (TV display)
    │   ├── ScreenLayout.vue
    │   ├── PlayerScreenLobby.vue
    │   └── PlayerScreenInPlay.vue
    └── Join/                 # Player join interface
        ├── JoinLayout.vue
        ├── PlayerJoinView.vue
        └── JoinSuccessView.vue
```

### Data Flow

1. **Supabase as single source of truth** — All state lives in the database
2. **Realtime subscriptions** — Components subscribe to Postgres changes via
   `supabase.channel().on('postgres_changes', ...).subscribe()`
3. **Pinia stores** cache data locally and expose reactive state to components
4. **Writes flow**: Component → Pinia action → Supabase query → DB
5. **Reads flow**: DB change → Supabase Realtime → Pinia store mutation → Component re-render

### Real-time Pattern (CRITICAL)

```typescript
// ALWAYS unsubscribe in onUnmounted to prevent memory leaks
onMounted(async () => {
  const subscription = supabase
    .channel('session-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${sessionId}`
    }, handleUpdate)
    .subscribe()

  onUnmounted(() => {
    subscription.unsubscribe()
  })
})
```

### View Switching Pattern

The Screen views use dynamic component switching:
```vue
<component :is="currentView" v-bind="viewProps" />
```

### Three-Frontend Architecture

All three "frontends" share the same Vue app — they're just different routes:
- GM: Full CRUD access, requires authentication
- Screen: Read-only, public access via session ID
- Join: Public form, no auth required