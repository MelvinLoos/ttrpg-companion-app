# **Project Plan: TTRPG Companion App**

This document outlines the features, technology stack, and development roadmap for the TTRPG Session Companion, a web-based application to enhance in-person TTRPG sessions.

## **1\. Core Concept**

The application consists of three "views" that communicate in real-time via a central database:

1. **GM Control Panel:** A Vue.js app for the GM to manage the session, characters, assets, and game state.  
2. **Player Screen:** A read-only Vue.js app (displayed on a TV) that subscribes to game state changes and shows the relevant view (lobby, combat, map, etc.).  
3. **Player App:** A simple mobile-first Vue.js app (accessed via QR code) for players to join the session and interact.

## **2\. Technology Stack**

* **Frontend:** [Vue.js 3](https://vuejs.org/) (using Vite)  
* **State Management:** [Pinia](https://pinia.vuejs.org/)  
* **Routing:** [Vue Router](https://router.vuejs.org/)  
* **Backend (BaaS):** [Supabase](https://supabase.com/)  
  * **Database:** Supabase Postgres  
  * **Real-time:** Supabase Realtime Subscriptions  
  * **File Storage:** Supabase Storage (for images, portraits, etc.)  
  * **Auth:** Supabase Auth (for GM login)

## **3\. Database Schema (Initial)**

* **sessions**  
  * id (uuid, primary key)  
  * gm\_id (foreign key to auth.users)  
  * name (text)  
  * showing (text, default: 'lobby') \- *Controls the Player Screen view. e.g., 'lobby', 'combat', 'map'.*  
  * active\_image\_url (text) \- *The main image shown on screen.*  
  * teaser\_text (text) \- *Text overlay for the lobby.*  
  * active\_turn\_character\_id (uuid, foreign key to session\_characters)  
* **premade\_characters**  
  * id (uuid, primary key)  
  * gm\_id (foreign key to auth.users)  
  * name (text)  
  * portrait\_url (text)  
  * stats\_json (jsonb) \- *Flexible field for modifiers, etc.*  
* **session\_characters**  
  * id (uuid, primary key)  
  * session\_id (foreign key to sessions)  
  * name (text)  
  * portrait\_url (text)  
  * is\_premade (boolean)  
  * character\_type (text, default: 'player') \- *e.g., 'player', 'enemy', 'ally', 'neutral'.*  
  * initiative\_modifier (integer, default: 0\)  
  * initiative\_roll (integer)  
  * hand\_raised (boolean, default: false)  
* **session\_assets**  
  * id (uuid, primary key)  
  * gm\_id (foreign key to auth.users)  
  * asset\_type (text) \- *e.g., 'portrait', 'map', 'scene'.*  
  * storage\_bucket (text)  
  * storage\_path (text)  
  * public\_url (text)  
  * friendly\_name (text)

## **4\. Development Roadmap (Github Issues)**

### **Epic 1: Foundation & Core Setup**

*Goal: Initialize the project, set up the database, and get the three main app "views" communicating.*

* **\[Issue\]** **Project: Set up Supabase**  
  * Create the Supabase project.  
  * Write and run the initial SQL migration script to create the tables defined in Database Schema.  
  * Enable Row Level Security (RLS) on all tables, setting default "allow read" policies for public assets and "allow full access" for the owning gm\_id.  
* **\[Issue\]** **Project: Set up Vue.js**  
  * Initialize a new Vue.js 3 project using Vite.  
  * Install and configure vue-router, pinia, and @supabase/supabase-js.  
  * Create a global Supabase client plugin.  
* **\[Issue\]** **UI: Create Core App Routes & Components**  
  * Create the three main routes:  
    1. /gm: The GM Control Panel (will be a layout with nested routes).  
    2. /screen/:session\_id: The read-only Player Screen.  
    3. /join/:session\_id: The Player Join page.  
  * Create placeholder components for each route.

### **Epic 2: GM Session & Character Management**

*Goal: Allow the GM to prepare for a session by creating premade characters and managing session assets.*

* **\[Issue\]** **GM: Build "Premade Characters" Manager**  
  * Create a page in the GM view (/gm/characters).  
  * Build a full CRUD (Create, Read, Update, Delete) interface for the premade\_characters table.  
  * The "Create/Edit" form must include a file upload for the portrait.  
* **\[Issue\]** **GM: Build "Asset Library"**  
  * Create Supabase Storage buckets: portraits, scenes, and maps.  
  * Create a page in the GM view (/gm/assets) to manage session\_assets.  
  * This component will allow uploading files to the correct bucket and save the metadata to the session\_assets table.  
* **\[Issue\]** **GM: Build "Sessions" Manager**  
  * Create a page in the GM view (/gm/sessions).  
  * Build a CRUD interface for the sessions table.  
  * This is where the GM sets the initial name, teaser\_text, and active\_image\_url (by selecting from the Asset Library).

### **Epic 3: Player Join & Lobby (The MVP)**

*Goal: Implement the core loop: Players join a session from their phone and appear on the main Player Screen lobby.*

* **\[Issue\]** **Player Screen: Build Lobby View (showing='lobby')**  
  * Create the LobbyView component.  
  * The main /screen/:session\_id component will fetch the session data and use Supabase Realtime to subscribe to its row in the sessions table.  
  * It will use a dynamic component (\<component :is="currentView"\>) based on the session.showing value.  
  * The LobbyView will display the active\_image\_url and teaser\_text.  
  * It will also display a large QR code pointing to the /join/:session\_id URL.  
* **\[Issue\]** **Player Phone: Build Join Page**  
  * The component for /join/:session\_id should:  
    1. Fetch all premade\_characters from the database.  
    2. Display two options: "Choose Premade" (shows a list) and "Create Custom" (form with name, initiative\_modifier, and optional portrait upload).  
    3. On submit, this page INSERTs the new character into the session\_characters table (with session\_id from the URL).  
* **\[Issue\]** **Player Screen: Implement Real-Time "Party Bar"**  
  * Create a "Party Bar" component that is part of the LobbyView.  
  * This component uses Supabase Realtime to **subscribe** to changes in the session\_characters table (for the current session\_id).  
  * When a new player is inserted, the subscription fires, and the component automatically adds their name and portrait\_url to the bar.

### **Epic 4: Image/View Broadcaster**

*Goal: Allow the GM to change the main view and image on the Player Screen in real-time.*

* **\[Issue\]** **GM: Build "Push to Screen" Controls**  
  * In the "Asset Library," each image should have a "Show on Screen" button.  
  * When clicked, this button fires an UPDATE command: UPDATE sessions SET active\_image\_url \= 'new\_url', showing \= 'lobby' WHERE id \= 'session\_id'.  
  * (In the future, a "Show Map" button could set showing \= 'map' and pass the URL).  
* **\[Issue\]** **Player Screen: Implement Real-Time View Updates**  
  * This is handled by the main /screen component's subscription (from Epic 3).  
  * When active\_image\_url changes, the LobbyView (or MapView) will reactively display the new image.  
  * When showing changes, the dynamic component will switch to the new view (e.g., CombatView).

### **Epic 5: Combat Mode & Initiative Tracker**

*Goal: Implement the "Combat" view to show a real-time initiative tracker.*

* **\[Issue\]** **GM: Implement "View Toggle"**  
  * Add a dropdown/button group to the main GM Control Panel to change the sessions.showing value.  
  * Options: "Lobby", "Combat", "Map" (future).  
  * Setting this to 'combat' will trigger the view switch on the Player Screen.  
* **\[Issue\]** **UI: Build CombatView Component**  
  * This component is shown when sessions.showing is 'combat'.  
  * It subscribes to session\_characters (just like the Party Bar).  
  * It displays them as a *vertical list*, sorted by initiative\_roll (descending).  
  * It should highlight the character whose ID matches sessions.active\_turn\_character\_id.  
* **\[Issue\]** **Flow: Implement "Roll Initiative"**  
  * GM Control Panel needs a form to quickly add non-player characters (enemies, allies) to the session\_characters table, including their name, character\_type, and initiative\_modifier.  
  * GM clicks "Request Initiative." (This could set a status on the sessions table).  
  * Player Phones (which should be subscribed to their *own* character row) see this new state and pop up a simple form: "Enter your d20 roll: \[\_\_\]".  
  * Player submits, which UPDATEs their initiative\_roll (the app will add the initiative\_modifier).  
  * The CombatView (listening to all changes) automatically re-sorts the list as the rolls come in.  
  * The GM Control Panel shows who has/hasn't rolled and lets the GM manually enter d20 rolls for enemies/allies (the app will add their modifier).  
* **\[Issue\]** **GM: Implement "Next Turn" Button**  
  * Add a "Next Turn" button to the GM Control Panel.  
  * This button gets the sorted list, finds the *next* character's ID, and UPDATEs the active\_turn\_character\_id in the sessions table.  
  * The CombatView (listening to sessions) sees the change and moves its "highlight" to the new character.

### **Epic 6: Player Feedback Features**

*Goal: Add small, interactive features for players.*

* **\[Issue\]** **Feature: Implement "Raise Hand" Toggle**  
  * Add a "Raise Hand" button to the Player Phone UI.  
  * This button will be a **toggle**.  
  * On click, it fetches the *current* hand\_raised value and UPDATEs their row with the opposite (e.g., SET hand\_raised \= NOT hand\_raised).  
  * The GM Control Panel (which should have its own list of players) subscribes to session\_characters and displays a bright icon next to any player with hand\_raised \= true.  
  * The GM also needs a "Lower Hand" button as an override.

### **Epic 7: Backlog & Future Features**

*Goal: Park good ideas that are not part of the MVP.*

* **\[Issue\]** **Auth: GM Account Login**  
  * Implement Supabase Auth (email/password) for the /gm route.  
  * Secure all database tables with RLS policies so GMs can only see/edit their *own* data.  
* **\[Issue\]** **Feature: Soundboard & Music**  
  * *Note:* Supabase Storage can host the audio files. The GM app would UPDATE a current\_track\_url in the sessions table, and the Player Screen (listening) would use an \<audio\> tag to play it.  
* **\[Issue\]** **Feature: Player Portrait Upload**  
  * *Note:* The "doodle" idea. This requires giving the Player Phone page file-upload permissions and access to Supabase Storage.  
* **\[Issue\]** **Feature: Player Polling**  
  * *Note:* Re-evaluate for a better use case. A *secret* poll could be interesting (e.g., "Who do you secretly vote to be the leader?") where the results are only shown to the GM or the group.  
* **\[Issue\]** **UI: Build MapView Component**  
  * Create a new view for showing \= 'map'.  
  * This view would show the active\_image\_url but add features like "pan" and "zoom."