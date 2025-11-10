# TTRPG Companion App

A Vue.js application for managing tabletop RPG sessions with real-time synchronization between GM controls, player views, and shared screens.

## Features

- **GM Control Panel**: Session management, player administration, asset uploads
- **Player Screen**: Read-only display view for TV/projector
- **Player Join**: Mobile-friendly interface for session participants
- **Real-time Sync**: All views update automatically via Supabase Realtime
- **Asset Management**: Image uploads for portraits, scenes, and maps
- **QR Code Join**: Easy session joining with generated QR codes

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Styling**: CSS with Vue SFC styles
- **State Management**: Pinia stores

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key to .env
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # or use VS Code task: Ctrl+Shift+P → "Run Task" → "start-dev-server"
   ```

4. **Access the application**:
   - GM Control: http://localhost:5173/gm/
   - Player Screen: http://localhost:5173/screen/:session_id
   - Player Join: http://localhost:5173/join/:session_id

## Project Structure

```
├── src/
│   ├── components/       # Shared Vue components
│   ├── views/           # Route components
│   │   ├── Gm/         # GM control panel views
│   │   ├── Screen/     # Player screen views  
│   │   └── Join/       # Player join views
│   ├── stores/         # Pinia state stores
│   ├── plugins/        # Vue plugins (router, supabase)
│   └── types/          # TypeScript type definitions
├── supabase/           # Database schema and migrations
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run create-buckets` - Create Supabase storage buckets

## Database

The app uses Supabase with the following key tables:
- `sessions` - Game session data
- `session_characters` - Players joined to sessions
- `session_assets` - Uploaded images and files

See `supabase/migrations/` for the complete schema.
