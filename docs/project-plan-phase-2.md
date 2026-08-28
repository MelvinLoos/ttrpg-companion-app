# **TTRPG Companion App: Feature Plan (Phase 2\)**

This document outlines the next set of major features for the TTRPG Companion App, focusing on moving from the "Lobby" state to an active "In-Play" session with combat tracking and scene/audio management.

## **Feature 1: Session State Management ("Lobby" vs. "In-Play")**

Overview:  
Introduce a state machine for sessions. A session should no longer just be a "lobby." It needs to transition to an "In-Play" mode. This change will be triggered by the GM and will alter the layout of the Player Screen to a "presentation" view and notify players on the Join screen.

### **Data Model Changes (Supabase)**

1. **sessions Table:**  
   * Add a new column: state (type: text, default: 'LOBBY').  
   * This column will hold the current session state. Suggested values:  
     * 'LOBBY': The default state. Player Screen shows the QR code and large party bar.  
     * 'IN\_PLAY': The "presentation" mode. Player Screen shows a main asset and smaller sidebar elements.  
     * 'PAUSED': (Optional) A state for breaks, etc.

### **GM View (/gm/\*)**

1. **LobbyView.vue Component:**  
   * When a session is active (e.g., /gm/session/SESSION\_ID), this view should subscribe to the *current session's* state.  
   * If state is 'LOBBY', show a prominent button: **"Start Session"**.  
   * Clicking "Start Session" updates the sessions table, setting state to 'IN\_PLAY' for that session row.  
2. **New Component: GmSessionControl.vue**  
   * When the session state is 'IN\_PLAY', the GM's view should transition from the "Lobby" view to this new "Session Control" component.  
   * This component will be the GM's main dashboard for running the game. It will house the "Scene Management" (Feature 3), "Audio Management" (Feature 4), and "Combat Tracker" (Feature 2\) controls.  
   * It should also have a **"End Session"** button, which updates the state back to 'LOBBY'.

### **Player Screen View (/screen/:id)**

This is the most critical part of your request.

1. **ScreenLayout.vue (or parent component):**  
   * This component *must* subscribe to the current session's state from the sessions table.  
2. **PlayerScreenLobby.vue:**  
   * This component should *only* be shown if the session state is 'LOBBY'.  
3. **New Component: PlayerScreenInPlay.vue**  
   * This component should be shown if the session state is 'IN\_PLAY'.  
   * **Layout:** This view will have a new two-column layout:  
     * **Main Content Area (approx. 80% width):** This area will display the "active scene" (e.g., a map, a monster portrait, a location image). It will show the asset linked in sessions.current\_asset\_id.  
     * **Sidebar (approx. 20% width):** This sidebar will contain:  
       * **PartyBar.vue:** The existing component, but styled to fit the sidebar (e.g., smaller portraits, vertical layout).  
       * **QR Code:** A smaller version of the QR code for late-joining players.  
       * **Session Title:** The name of the session.

### **Player Join View (/join/:id)**

1. **PlayerJoinView.vue:**  
   * This component should also subscribe to the session state.  
   * If state is 'IN\_PLAY', display a message at the top: **"Session is already in progress, but you can still join\!"**  
   * This confirms to the player that the game has started, but their join action is still valid.

### **Real-Time Sync**

* **Trigger:** The GM clicks "Start Session" (updates sessions.state).  
* **Event:** A Supabase broadcast on the sessions table for the specific session ID.  
* **Listeners:**  
  * ScreenLayout.vue receives the event and switches from showing PlayerScreenLobby.vue to PlayerScreenInPlay.vue.  
  * PlayerJoinView.vue receives the event and displays the "In Progress" message.  
  * LobbyView.vue (GM) receives the event and switches to the GmSessionControl.vue view.

### **Actionable Issues / Tasks**

* **Task 1.1 (Database):** Add state column (text, default 'LOBBY') to sessions table.  
* **Task 1.2 (GM View):** Create GmSessionControl.vue component shell.  
* **Task 1.3 (GM View):** In LobbyView.vue, add "Start Session" button (visible if state is 'LOBBY') that updates sessions.state to 'IN\_PLAY'.  
* **Task 1.4 (GM View):** In LobbyView.vue, render GmSessionControl.vue component if state is 'IN\_PLAY'.  
* **Task 1.5 (GM View):** In GmSessionControl.vue, add "End Session" button that updates sessions.state to 'LOBBY'.  
* **Task 1.6 (Player Screen):** Create PlayerScreenInPlay.vue component shell.  
* **Task 1.7 (Player Screen):** In ScreenLayout.vue, subscribe to session state and render PlayerScreenLobby.vue or PlayerScreenInPlay.vue based on the value.  
* **Task 1.8 (Player Screen):** Implement 2-column layout in PlayerScreenInPlay.vue (Main Content \+ Sidebar).  
* **Task 1.9 (Player Screen):** Add styled PartyBar.vue component to the sidebar in PlayerScreenInPlay.vue.  
* **Task 1.10 (Player Screen):** Add smaller QR code and Session Title to the sidebar in PlayerScreenInPlay.vue.  
* **Task 1.11 (Player Join):** In PlayerJoinView.vue, subscribe to session state and show "Session is in progress" message if state is 'IN\_PLAY'.

## **Feature 2: Combat Tracker & Initiative Management**

Overview:  
A comprehensive system for the GM to prepare and run combat encounters. The GM will manage a list of combatants (players and monsters), track initiative order, and manage monster health. The Player Screen will display a simplified, public-facing version of this tracker.

### **Data Model Changes (Supabase)**

1. **New Table: monster\_templates** (GM's private library of monsters)  
   * id (uuid, primary key)  
   * user\_id (uuid, foreign key to auth.users)  
   * name (text)  
   * max\_health (integer)  
   * portrait\_asset\_id (uuid, nullable, foreign key to session\_assets.id)  
   * stats\_json (jsonb, optional, for other data)  
2. **New Table: combat\_encounters** (GM's "prepared lists")  
   * id (uuid, primary key)  
   * user\_id (uuid)  
   * name (text, e.g., "Goblin Ambush," "Orc Camp")  
3. **New Table: combat\_encounter\_monsters** (Join table for encounters)  
   * id (uuid, primary key)  
   * encounter\_id (uuid, foreign key to combat\_encounters.id)  
   * monster\_template\_id (uuid, foreign key to monster\_templates.id)  
   * quantity (integer, default: 1\)  
4. **New Table: active\_combats** (A combat currently in progress)  
   * id (uuid, primary key)  
   * session\_id (uuid, foreign key to sessions.id)  
   * is\_active (boolean, default: true)  
   * current\_turn\_id (uuid, nullable, foreign key to combat\_participants.id)  
5. **New Table: combat\_participants** (The live initiative list)  
   * id (uuid, primary key)  
   * active\_combat\_id (uuid, foreign key to active\_combats.id)  
   * name (text, e.g., "Goblin 1," "Player Name")  
   * initiative (integer, nullable)  
   * current\_health (integer)  
   * max\_health (integer)  
   * is\_monster (boolean, default: true)  
   * session\_character\_id (uuid, nullable, foreign key to session\_characters.id) \- *Links to a player*  
   * monster\_template\_id (uuid, nullable, foreign key to monster\_templates.id) \- *Links to a monster type*

### **GM View (/gm/\*)**

1. **New Page: /gm/monsters**  
   * A CRUD interface for the GM to create, read, update, and delete their monster\_templates.  
2. **New Page: /gm/encounters**  
   * A CRUD interface to create combat\_encounters.  
   * In this view, the GM can add monster\_templates to an encounter (creating combat\_encounter\_monsters rows), specifying quantity (e.g., 5x "Goblins").  
3. **GmSessionControl.vue (from Feature 1):**  
   * Add a "Start Combat" button.  
   * **Workflow:**  
     1. GM clicks "Start Combat."  
     2. A modal opens, letting the GM select a prepared combat\_encounter.  
     3. On selection, the app:  
        * Creates a new active\_combats row linked to the session.  
        * Fetches all players from session\_characters for the current session.  
        * Fetches all monsters from combat\_encounter\_monsters for the selected encounter.  
        * **Crucially:** Creates a new combat\_participants row for *every single player* and *every single monster* (e.g., "Goblin 1", "Goblin 2", "Player A"). Player rows are linked via session\_character\_id; monster rows are linked via monster\_template\_id and given names like "Goblin 1," "Goblin 2," etc.  
4. **New Component: GmCombatTracker.vue**  
   * This component displays inside GmSessionControl.vue when a combat is active.  
   * It fetches all combat\_participants for the active\_combat\_id and displays them as a list.  
   * **Sorting:** The list is automatically sorted by initiative (DESC).  
   * **Initiative:** The GM can input the initiative value for each participant. This updates the DB and the list auto-sorts.  
   * **Health:** The GM can see and update the current\_health for all participants (but especially monsters).  
   * **Turn Tracking:** A "Next Turn" button highlights the current participant and advances active\_combats.current\_turn\_id.

### **Player Screen View (/screen/:id)**

1. **PlayerScreenInPlay.vue (from Feature 1):**  
   * This component must subscribe to the active\_combats table for the session.  
   * If is\_active is true for a combat, it will render the PublicCombatTracker.vue component.  
2. **New Component: PublicCombatTracker.vue**  
   * This component renders in the sidebar of PlayerScreenInPlay.vue (likely replacing the PartyBar.vue during combat).  
   * It subscribes to combat\_participants for the active combat, sorted by initiative (DESC).  
   * It displays:  
     * Participant Name  
     * Participant Initiative  
     * **Monster Health (as requested):** For participants where is\_monster is true, it displays a *status* based on current\_health / max\_health:  
       * 100%: "Unharmed"  
       * 50-99%: "Injured"  
       * 25-49%: "Bloodied"  
       * 1\_24%: "Near Death"  
       * 0%: "Defeated"  
   * It should highlight the participant whose turn it is (based on active\_combats.current\_turn\_id).

### **Real-Time Sync**

* **Events:** Broadcasts on active\_combats (to start/end combat) and combat\_participants (to update initiative order, health status, and current turn).  
* **Listeners:**  
  * GmCombatTracker.vue listens to combat\_participants to reflect changes made by other GMs (if co-GMing is ever a feature) or by the system.  
  * PublicCombatTracker.vue listens to *all* changes to combat\_participants and active\_combats to update the list, sorting, health status, and current turn highlight in real-time.

### **Actionable Issues / Tasks**

* **Task 2.1 (Database):** Create monster\_templates table.  
* **Task 2.2 (Database):** Create combat\_encounters table.  
* **Task 2.3 (Database):** Create combat\_encounter\_monsters table.  
* **Task 2.4 (Database):** Create active\_combats table.  
* **Task 2.5 (Database):** Create combat\_participants table.  
* **Task 2.6 (GM View):** Create new route /gm/monsters and a page component for monster\_templates CRUD.  
* **Task 2.7 (GM View):** Create new route /gm/encounters and a page component for combat\_encounters CRUD.  
* **Task 2.8 (GM View):** Add "Manage Monsters" and "Manage Encounters" links to GmLayout.vue.  
* **Task 2.9 (GM View):** In GmSessionControl.vue, add a "Start Combat" button.  
* **Task 2.10 (GM View):** Implement "Start Combat" workflow: modal, active\_combats creation, and combat\_participants generation from players \+ encounter.  
* **Task 2.11 (GM View):** Create GmCombatTracker.vue component shell.  
* **Task 2.12 (GM View):** In GmCombatTracker.vue, fetch and display combat\_participants sorted by initiative.  
* **Task 2.13 (GM View):** In GmCombatTracker.vue, implement initiative number input and real-time update/sorting.  
* **Task 2.14 (GM View):** In GmCombatTracker.vue, implement current\_health input for monster participants.  
* **Task 2.15 (GM View):** In GmCombatTracker.vue, implement "Next Turn" button logic (updates active\_combats.current\_turn\_id).  
* **Task 2.16 (Player Screen):** Create PublicCombatTracker.vue component shell.  
* **Task 2.17 (Player Screen):** In PlayerScreenInPlay.vue, subscribe to active\_combats and render PublicCombatTracker.vue if active.  
* **Task 2.18 (Player Screen):** In PublicCombatTracker.vue, fetch and display combat\_participants sorted by initiative.  
* **Task 2.19 (Player Screen):** In PublicCombatTracker.vue, implement display logic for monster health status (e.g., "Injured", "Bloodied").  
* **Task 2.20 (Player Screen):** In PublicCombatTracker.vue, implement real-time highlighting for current\_turn\_id.

## **Feature 3: Scene & Asset Management**

Overview:  
Feature 1 creates a "presentation" view, but the GM has no way to control that presentation. This feature gives the GM a control panel to push images (maps, scenes, monster art) to the Player Screen.

### **Data Model Changes (Supabase)**

* **session\_assets Table:**  
  * Add a type column (text) to session\_assets (e.g., 'IMAGE', 'AUDIO') to help the GM filter their library.  
* **sessions Table:**  
  * The current\_asset\_id column will be re-purposed to current\_image\_asset\_id (uuid, nullable) to be specific.

### **GM View (/gm/\*)**

1. **New Component: GmAssetGallery.vue**  
   * This component lives inside GmSessionControl.vue.  
   * It fetches all assets from session\_assets where type is 'IMAGE' and displays them as a thumbnail gallery.  
   * Each asset thumbnail has a button: **"Push to Screen"**.  
   * **Workflow:**  
     1. GM clicks "Push to Screen" on an asset (e.g., "Cave Map").  
     2. The app updates the *current session's* row in the sessions table, setting current\_image\_asset\_id to the ID of the clicked asset.

### **Player Screen View (/screen/:id)**

1. **PlayerScreenInPlay.vue (from Feature 1):**  
   * The main content area of this component *must* be subscribed to the sessions table.  
   * When it detects a change to current\_image\_asset\_id, it will:  
     1. Fetch the asset URL from the session\_assets table (or its Supabase Storage path).  
     2. Update the \<img\> tag in the main content area to display the new image.

### **Real-Time Sync**

* **Trigger:** The GM clicks "Push to Screen."  
* **Event:** A broadcast on the sessions table (because current\_image\_asset\_id changed).  
* **Listeners:**  
  * PlayerScreenInPlay.vue receives the event, sees the new current\_image\_asset\_id, and immediately loads the new image, creating a real-time "slideshow" effect controlled by the GM.

### **Actionable Issues / Tasks**

* **Task 3.1 (Database):** Add type column (text) to session\_assets table.  
* **Task 3.2 (Database):** Rename current\_asset\_id on sessions table to current\_image\_asset\_id. (This might require a migration script).  
* **Task 3.3 (GM View):** In AssetsView.vue, update the asset uploader to set type: 'IMAGE' by default.  
* **Task 3.4 (GM View):** Create GmAssetGallery.vue component shell.  
* **Task 3.5 (GM View):** In GmAssetGallery.vue, fetch and display all assets where type is 'IMAGE'.  
* **Task 3.6 (GM View):** In GmAssetGallery.vue, add "Push to Screen" button to each asset.  
* **Task 3.7 (GM View):** Implement "Push to Screen" logic (updates sessions.current\_image\_asset\_id for the active session).  
* **Task 3.8 (GM View):** Add GmAssetGallery.vue component to the GmSessionControl.vue layout.  
* **Task 3.9 (Player Screen):** In PlayerScreenInPlay.vue, subscribe to current\_image\_asset\_id from the sessions table.  
* **Task 3.10 (Player Screen):** In PlayerScreenInPlay.vue, display the image corresponding to current\_image\_asset\_id in the main content area.

## **Feature 4: Ambiance & Audio Management**

Overview:  
This feature extends the Scene Management concept to audio. The GM will be able to select background music or ambiance tracks and play them on the Player Screen.

### **Data Model Changes (Supabase)**

* **sessions Table:**  
  * Add a new column: current\_audio\_asset\_id (uuid, nullable).  
  * Add a new column: audio\_state (text, default: 'STOPPED'). Values: 'PLAYING', 'PAUSED', 'STOPPED'.  
* **session\_assets Table:**  
  * The type column (from Feature 3\) will be used to identify 'AUDIO' assets.

### **GM View (/gm/\*)**

1. **New Component: GmAudioControl.vue**  
   * This component lives inside GmSessionControl.vue.  
   * It fetches all assets from session\_assets where type is 'AUDIO' and displays them as a list.  
   * For each audio asset, the GM has a **"Play"** button.  
   * There should also be global controls: **"Pause Audio"** and **"Stop Audio"**.  
   * **Play Workflow:**  
     1. GM clicks "Play" on "Tavern Ambiance."  
     2. The app updates the sessions table, setting current\_audio\_asset\_id to the track's ID and audio\_state to 'PLAYING'.  
   * **Pause/Stop Workflow:**  
     1. GM clicks "Pause Audio."  
     2. The app updates sessions.audio\_state to 'PAUSED'.  
     3. GM clicks "Stop Audio."  
     4. The app updates sessions.audio\_state to 'STOPPED'.

### **Player Screen View (/screen/:id)**

1. **PlayerScreenInPlay.vue (from Feature 1):**  
   * This component must subscribe to current\_audio\_asset\_id and audio\_state on the sessions table.  
   * It will contain a hidden \<audio\> element.  
   * **Event Handling Logic:**  
     * If current\_audio\_asset\_id changes: Fetch the new audio file URL and set it as the \<audio\> element's src. If audio\_state is 'PLAYING', start playing.  
     * If audio\_state changes:  
       * 'PLAYING': Call .play() on the audio element.  
       * 'PAUSED': Call .pause() on the audio element.  
       * 'STOPPED': Call .pause() and set currentTime \= 0.

### **Real-Time Sync**

* **Trigger:** The GM clicks "Play," "Pause," or "Stop."  
* **Event:** A broadcast on the sessions table (because current\_audio\_asset\_id or audio\_state changed).  
* **Listeners:**  
  * PlayerScreenInPlay.vue receives the event and uses the new state to control its internal \<audio\> element, starting, stopping, or changing tracks instantly.

### **Actionable Issues / Tasks**

* **Task 4.1 (Database):** Add current\_audio\_asset\_id (uuid, nullable) to sessions table.  
* **Task 4.2 (Database):** Add audio\_state (text, default 'STOPPED') to sessions table.  
* **Task 4.3 (GM View):** In AssetsView.vue, update asset uploader to allow type: 'AUDIO'.  
* **Task 4.4 (GM View):** Create GmAudioControl.vue component shell.  
* **Task 4.5 (GM View):** In GmAudioControl.vue, fetch and display all assets where type is 'AUDIO'.  
* **Task 4.6 (GM View):** In GmAudioControl.vue, add "Play" button to each audio asset.  
* **Task 4.7 (GM View):** In GmAudioControl.vue, add global "Pause" and "Stop" buttons.  
* **Task 4.8 (GM View):** Implement "Play" logic (updates sessions.current\_audio\_asset\_id and sessions.audio\_state).  
* **Task 4.9 (GM View):** Implement "Pause" / "Stop" logic (updates sessions.audio\_state).  
* **Task 4.10 (GM View):** Add GmAudioControl.vue component to the GmSessionControl.vue layout.  
* **Task 4.11 (Player Screen):** In PlayerScreenInPlay.vue, add a hidden \<audio\> element.  
* **Task 4.12 (Player Screen):** In PlayerScreenInPlay.vue, subscribe to current\_audio\_asset\_id and audio\_state.  
* **Task 4.13 (Player Screen):** Implement logic to change \<audio\> src when current\_audio\_asset\_id changes.  
* **Task 4.14 (Player Screen):** Implement logic to .play(), .pause(), or .stop() the \<audio\> element when audio\_state changes.