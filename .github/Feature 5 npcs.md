## **Feature 5: NPC Presentation**

User Story:  
As a GM, when my players are interacting with an NPC, I want to show that NPC's full-size portrait prominently on the Player Screen, temporarily hiding the party bar, to create a focused, story-game-like interaction.  
Overview:  
This feature provides a "presentation mode" for storytelling. Instead of small icons, the GM can select one or two NPCs to be displayed in large-format overlays (e.g., on the left or right of the screen) on top of the background scene. When an NPC is being presented, the standard party bar will be hidden to focus attention.

### **Data Model Changes (Supabase)**

1. **New Table: npc\_templates** (GM's private library of NPCs)  
   * id (uuid, primary key)  
   * user\_id (uuid, foreign key to auth.users)  
   * name (text)  
   * description (text, GM-facing notes)  
   * social\_info\_json (jsonb, optional, for ideals, bonds, flaws, etc.)  
   * portrait\_asset\_id (uuid, nullable, foreign key to session\_assets.id) \- *This should be a full-size, transparent-bg image.*  
   * linked\_monster\_template\_id (uuid, nullable, foreign key to monster\_templates.id) \- ***The bridge\!** Connects this NPC to a statblock for combat.*  
2. **sessions Table:**  
   * Add new column: current\_left\_npc\_id (uuid, nullable, foreign key to npc\_templates.id)  
   * Add new column: current\_right\_npc\_id (uuid, nullable, foreign key to npc\_templates.id)  
   * *This simple approach allows for showing one NPC (left), or two NPCs in a conversation (left and right).*

### **GM View (/gm/\*)**

1. **New Page: /gm/npcs**  
   * A new route and page for full CRUD (Create, Read, Update, Delete) management of the npc\_templates table.  
   * This interface should let the GM add a name, notes, portrait (from session\_assets), and optionally link a monster from monster\_templates.  
2. **GmSessionControl.vue (from Feature 1):**  
   * Add a new major tab/section for "NPCs."  
3. **New Component: GmNpcControl.vue**  
   * This component will live inside the "NPCs" tab of GmSessionControl.vue.  
   * It displays a list of all npc\_templates.  
   * Each NPC in the list has two buttons: **"Show Left"** and **"Show Right"**.  
   * It also subscribes to the session's current\_left\_npc\_id and current\_right\_npc\_id to show which NPC is currently active.  
   * **Workflow:**  
     1. GM clicks "Show Left" on "Baron von Hess."  
     2. The app updates sessions.current\_left\_npc\_id to the Baron's ID.  
     3. If the Baron is *already* on the left, the button text changes to "Hide Left," and clicking it sets sessions.current\_left\_npc\_id to NULL.  
   * This component should also have a **"Clear All NPCs"** button that sets both columns to NULL.

### **Player Screen View (/screen/:id)**

1. **PlayerScreenInPlay.vue (from Feature 1):**  
   * This component *must* subscribe to sessions.current\_left\_npc\_id and sessions.current\_right\_npc\_id.  
   * It will have a new layout layer (e.g., z-20, position: absolute) for NPC overlays.  
   * **Conditional Rendering:**  
     * If *both* current\_left\_npc\_id and current\_right\_npc\_id are NULL, the PartyBar.vue component (in the sidebar) is visible.  
     * If *either* ID is not NULL, the PartyBar.vue component is hidden (display: none or v-if="false").  
2. **New Component: NpcDisplay.vue**  
   * PlayerScreenInPlay.vue will render this component.  
   * It will render one instance inside a container (e.g., absolute left-0 bottom-0 h-full w-1/3) if current\_left\_npc\_id is set, passing the ID as a prop.  
   * It will render a second instance inside a container (e.g., absolute right-0 bottom-0 h-full w-1/3) if current\_right\_npc\_id is set, passing that ID.  
   * The component itself will:  
     1. Fetch the npc\_template using the prop ID.  
     2. Fetch the portrait URL from session\_assets using the portrait\_asset\_id.  
     3. Display the large portrait image (e.g., h-full object-contain).

### **Real-Time Sync**

* **Trigger:** The GM clicks "Show Left," "Show Right," or "Clear All NPCs."  
* **Event:** A broadcast on the sessions table (an UPDATE to the current\_...\_npc\_id columns).  
* **Listeners:**  
  * PlayerScreenInPlay.vue receives the event, sees the new IDs, and instantly shows/hides the NpcDisplay.vue components and the PartyBar.vue component.  
  * GmNpcControl.vue (on the GM Screen) also listens to update its own button states ("Show Left" vs. "Hide Left").

### **Actionable Issues / Tasks**

* **Task 5.1 (Database):** Create npc\_templates table with all fields (name, description, social\_info\_json, portrait\_asset\_id, linked\_monster\_template\_id).  
* **Task 5.2 (Database):** Add current\_left\_npc\_id (uuid, nullable) to sessions table.  
* **Task 5.3 (Database):** Add current\_right\_npc\_id (uuid, nullable) to sessions table.  
* **Task 5.4 (GM View):** Create new route /gm/npcs and a page component for npc\_templates CRUD.  
* **Task 5.5 (GM View):** Add "Manage NPCs" link to GmLayout.vue.  
* **Task 5.6 (GM View):** Create GmNpcControl.vue component shell.  
* **Task 5.7 (GM View):** In GmNpcControl.vue, fetch and display the list of all npc\_templates.  
* **Task 5.8 (GM View):** In GmNpcControl.vue, implement "Show Left" / "Hide Left" button logic (updates sessions.current\_left\_npc\_id).  
* **Task 5.9 (GM View):** In GmNpcControl.vue, implement "Show Right" / "Hide Right" button logic (updates sessions.current\_right\_npc\_id).  
* **Task 5.10 (GM View):** Implement "Clear All NPCs" button logic.  
* **Task 5.11 (GM View):** Add GmNpcControl.vue component to a new "NPCs" tab in GmSessionControl.vue.  
* **Task 5.12 (Player Screen):** Create NpcDisplay.vue component shell.  
* **Task 5.13 (Player Screen):** In PlayerScreenInPlay.vue, add new layout containers for left and right NPCs (e.g., absolute left-0... and absolute right-0...).  
* **Task 5.14 (Player Screen):** In PlayerScreenInPlay.vue, subscribe to current\_left\_npc\_id and current\_right\_npc\_id.  
* **Task 5.15 (Player Screen):** In PlayerScreenInPlay.vue, implement conditional logic:  
  * If Left/Right ID exists, render NpcDisplay.vue in the correct container.  
  * If *any* ID exists, *hide* PartyBar.vue.  
  * If *both* IDs are null, *show* PartyBar.vue.  
* **Task 5.16 (Player Screen):** In NpcDisplay.vue, accept an npcId prop, fetch the npc\_template data, and render the portrait image.  
* **Task 5.17 (Combat Tracker):** *Future Task*: When implementing Feature 2, modify the "Start Combat" logic to check npc\_templates for any linked\_monster\_template\_ids if an NPC is present.