# **TTRPG Sound Module: Feature 4 Plan & Definition**

This document defines the core features and user-centric goals for the audio module of your TTRPG management app, based on the existing "Phase 2" project plan.

**Primary Goal:** To provide a Game Master (GM) with a fast, intuitive, and non-distracting interface to control background music and ambiance, enhancing immersion without breaking the flow of the game.

**Tech Stack:**

* **Frontend:** Vue.js 3 (w/ Pinia for state management)  
* **Backend:** Supabase (Database, Storage, and Realtime)

## **1\. Core User Stories (The "Why")**

### **Job 1: Ambiance & Music (Phase 2 Goal)**

This is for setting a persistent scene.

* **As a GM,** I want to see my audio tracks organized in my GmSessionControl.vue view, loaded from my session\_assets table.  
* **As a GM,** I want to click a "Play" button next to a track (e.g., "Tavern Ambiance") so that it starts playing and looping on the PlayerScreenInPlay.vue.  
* **As a GM,** I want to click "Play" on a *new* track (e.g., "Combat Music") so that the "Tavern Ambiance" track stops and the new track begins.  
* **As a GM,** I want master "Pause Audio" and "Stop Audio" buttons so I can quickly control the playback for all players.  
* **As a GM,** I want a master volume slider for my music/ambiance (this can be a future enhancement, as the sessions table doesn't have a volume column yet).  
* **As a GM,** I want to easily see which track is currently playing.

### **Job 2: Library Management (The "Prep")**

This is for the GM during prep time, using the existing asset system.

* **As a GM,** I want to go to my existing **AssetsView.vue** page.  
* **As a GM,** I want to be able to upload my .mp3 or .wav files.  
* **As a GM,** I want to categorize my uploaded file with type: 'AUDIO' so it appears in my new sound module. This data will be saved in my **session\_assets** table.  
* **As a GM,** I want my app to automatically build the GmAudioControl.vue UI by fetching this library information from the **useAssetStore**.

### **Job 3: One-Shot Sound Effects (Future Work \- Phase 3\)**

* **As a GM,** I want a grid of "SFX" buttons (e.g., "Sword Hit," "Dragon Roar") that I can press to play a sound *immediately* over the top of any playing ambiance.  
  * *Note: This requires a different technical approach (client-side audio pool or dedicated real-time messages) and is a good candidate for a separate feature after ambiance is working.*

## **2\. Feature Definition (The "How")**

This plan integrates directly with your existing components and data model as defined in Project-Plan-Phase-2.md.

### **Module 1: GM Audio Control (The Vue Component)**

This will be a new component, **GmAudioControl.vue**, which is then placed inside your existing **GmSessionControl.vue** component.

* **UI:**  
  * Fetches all assets from useAssetStore() where asset\_type \=== 'AUDIO'.  
  * Renders a list of these assets using v-for.  
  * Each item in the list has a **"Play"** button.  
  * The component also has global **"Pause Audio"** and **"Stop Audio"** buttons.  
* **GM Control Logic (Methods):**  
  * playAudio(asset: Asset):  
    * Calls await supabase.from('sessions').update({ current\_audio\_asset\_id: asset.id, audio\_state: 'PLAYING' }).eq('id', currentSession.id)  
  * pauseAudio():  
    * Calls await supabase.from('sessions').update({ audio\_state: 'PAUSED' }).eq('id', currentSession.id)  
  * stopAudio():  
    * Calls await supabase.from('sessions').update({ audio\_state: 'STOPPED', current\_audio\_asset\_id: null }).eq('id', currentSession.id)

### **Module 2: Backend & Player Screen**

This involves updating your existing Supabase schema and PlayerScreenInPlay.vue component.

* **Supabase Table Updates:**  
  1. **session\_assets** (Table):  
     * The asset\_type column (enum) needs to be updated in your migration files to accept 'AUDIO'.  
  2. **sessions** (Table):  
     * Add column: current\_audio\_asset\_id (uuid, nullable, foreign key to session\_assets.id).  
     * Add column: audio\_state (text, default: 'STOPPED'). Recommended values: 'PLAYING', 'PAUSED', 'STOPPED'.  
* **Supabase Storage Updates:**  
  1. A new **audio** bucket should be created.  
  2. scripts/create-buckets.ts should be updated to create this bucket.  
  3. Storage RLS policies should be updated to allow public read access to the audio bucket.  
* **Player Screen Logic (PlayerScreenInPlay.vue):**  
  1. **Add Audio Element:** Add a hidden \<audio ref="audioPlayer" loop\>\</audio\> element to the component's template.  
  2. **Subscribe to State:** The component *already* subscribes to the sessions table for state changes. This subscription will now also receive updates for current\_audio\_asset\_id and audio\_state.  
  3. **Implement watchEffect:** Add a watchEffect that tracks the session's audio state:  
     import { ref, watchEffect } from 'vue'  
     // ...  
     const audioPlayer \= ref\<HTMLAudioElement | null\>(null)  
     const session \= ref\<GameSession | null\>(null) // (This is already loaded in your component)

     watchEffect(async () \=\> {  
       if (\!audioPlayer.value || \!session.value) return;

       const player \= audioPlayer.value;  
       const { audio\_state, current\_audio\_asset\_id } \= session.value;

       // 1\. Handle Audio Source Change  
       if (current\_audio\_asset\_id) {  
         // Fetch the asset details (public\_url) from the session\_assets table  
         const { data: asset } \= await supabase  
           .from('session\_assets')  
           .select('public\_url')  
           .eq('id', current\_audio\_asset\_id)  
           .single();

         if (asset?.public\_url && player.src \!== asset.public\_url) {  
           player.src \= asset.public\_url;  
         }  
       } else {  
         player.src \= '';  
       }

       // 2\. Handle Playback State  
       switch (audio\_state) {  
         case 'PLAYING':  
           if (player.src && player.paused) {  
             player.play().catch(e \=\> console.error("Audio play failed:", e));  
           }  
           break;  
         case 'PAUSED':  
           if (\!player.paused) {  
             player.pause();  
           }  
           break;  
         case 'STOPPED':  
           if (\!player.paused) {  
             player.pause();  
           }  
           player.currentTime \= 0;  
           break;  
       }  
     });

## **3\. Development Roadmap (Actionable Tasks)**

This is the task list from your Project-Plan-Phase-2.md (Feature 4), integrated with your file structure.

* **Task 4.1 (Database):** Add current\_audio\_asset\_id (uuid, nullable) to sessions table.  
* **Task 4.2 (Database):** Add audio\_state (text, default 'STOPPED') to sessions table.  
* **Task 4.3 (Database):** Update session\_assets table (asset\_type enum) to allow 'AUDIO'.  
* **Task 4.4 (Database):** Create new audio bucket in Supabase Storage (update scripts/create-buckets.ts and storage policies).  
* **Task 4.5 (GM View):** In src/stores/asset.ts and src/views/Gm/AssetsView.vue, update the asset uploader logic and UI to allow uploading files with asset\_type: 'AUDIO' to the new audio bucket.  
* **Task 4.6 (GM View):** Create src/components/GmAudioControl.vue component shell.  
* **Task 4.7 (GM View):** In GmAudioControl.vue, fetch and display all assets from useAssetStore() where asset\_type \=== 'AUDIO'.  
* **Task 4.8 (GM View):** In GmAudioControl.vue, add a "Play" button to each audio asset.  
* **Task 4.9 (GM View):** In GmAudioControl.vue, add global "Pause" and "Stop" buttons.  
* **Task 4.10 (GM View):** Implement "Play" logic (updates sessions.current\_audio\_asset\_id and sessions.audio\_state).  
* **Task 4.11 (GM View):** Implement "Pause" / "Stop" logic (updates sessions.audio\_state).  
* **Task 4.12 (GM View):** Add the new GmAudioControl.vue component to the src/components/GmSessionControl.vue layout.  
* **Task 4.13 (Player Screen):** In src/views/Screen/PlayerScreenInPlay.vue, add a hidden \<audio ref="audioPlayer" loop\> element.  
* **Task 4.14 (Player Screen):** In PlayerScreenInPlay.vue, implement the watchEffect logic to subscribe to current\_audio\_asset\_id and audio\_state.  
* **Task 4.15 (Player Screen):** Implement the play(), pause(), or stop() logic on the \<audio\> element when the session state changes.