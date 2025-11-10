# Testing Premade Character Availability Feature

## Overview
When players join a session using premade characters, those characters become unavailable to other players joining the same session. This prevents multiple players from having identical characters.

## How to Test

### Setup
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5173/gm`
3. Sign in to the GM panel

### Create Test Data
1. **Create Premade Characters**
   - Go to "Characters" tab in GM panel
   - Create 2-3 premade characters with different names (e.g., "Aragorn", "Gandalf", "Legolas")
   - Add portraits and stats for visual testing

2. **Create a Session**
   - Go to "Sessions" tab
   - Create a new session (e.g., "Test Adventure")
   - Go to "Lobby" tab and select the session

3. **Get Join URL**
   - Copy the join URL from the lobby view
   - Example: `http://localhost:5173/join/abc123-def456`

### Test the Feature

#### Test 1: Initial State
1. Open join URL in **incognito/private browser window**
2. ✅ Verify you see both radio options:
   - "Create New Character" 
   - "Choose Premade Character"
3. Select "Choose Premade Character"
4. ✅ Verify all premade characters are visible and selectable

#### Test 2: Character Becomes Unavailable
1. Select a premade character (e.g., "Aragorn") and join session
2. Open join URL in **another incognito window**
3. Select "Choose Premade Character"
4. ✅ Verify "Aragorn" is NO LONGER visible in the list
5. ✅ Verify remaining characters are still available

#### Test 3: All Characters Taken
1. Repeat process until all premade characters are taken
2. Open join URL in new incognito window
3. Select "Choose Premade Character"
4. ✅ Verify you see the message:
   > "All premade characters are currently being used by other players in this session.
   > Please create a new character instead."

#### Test 4: Real-time Updates
1. Have join page open with premade character selection
2. In another window, have someone join with a premade character
3. ✅ Verify the character disappears from the selection in real-time
4. ✅ If you had that character selected, verify selection resets

## Expected Behavior

### UI States
- **Available Characters**: Show as normal character cards, clickable
- **No Available Characters**: Show yellow warning message
- **Real-time Removal**: Characters disappear when taken by others
- **Selection Reset**: If your selected character gets taken, selection clears

### Data Flow
1. `premadeCharacters` computed property filters out used characters
2. Watcher resets selection if chosen character becomes unavailable  
3. Real-time subscription updates player list when others join
4. UI reactively updates based on availability

## Implementation Details

### Key Components Modified
- `src/views/Join/PlayerJoinView.vue`: Main join form logic
- `supabase/migrations/20251110225457_allow_anonymous_premade_characters_read.sql`: Anonymous access policy

### Database Logic
- Query `session_characters` table for current session players
- Filter where `is_premade = true` to find taken characters  
- Match by `name` field to determine availability
- Real-time subscriptions keep data synchronized

## Success Criteria
✅ Premade characters disappear when selected by other players  
✅ Real-time updates work across multiple browser windows  
✅ Clear messaging when no characters are available  
✅ Selection resets if chosen character becomes unavailable  
✅ Anonymous users can view premade characters for joining