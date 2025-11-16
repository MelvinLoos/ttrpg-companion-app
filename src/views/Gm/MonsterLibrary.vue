<template>
  <div class="gm-monster-library monster-library">
    <header class="library-header">
      <div class="header-row">
        <h2>Monster Library</h2>
        <button @click="showUploadModal = true" class="add-monster-btn">+ Add Monster</button>
      </div>
      <div class="search-filter-row">
        <div class="search-bar-wrapper">
          <input v-model="search" placeholder="Search monsters..." class="search-bar" />
          <div class="icon-wrapper">
            <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option v-for="type in monsterTypes" :key="type" :value="type">{{ type }}</option>
        </select>
        <button @click="showUploadModal = true" class="add-monster-btn">
          <div class="icon-wrapper">
            <svg class="add-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          Add Monster
        </button>
      </div>
    </header>

    <!-- Monster grid/list -->
    <div class="monster-grid">
      <div v-for="monster in filteredMonsters" :key="monster.id" class="monster-card">
        <img v-if="monster.image_url" :src="monster.image_url" class="monster-image" @click="selectMonster(monster)" />
        <div class="monster-info" @click="selectMonster(monster)">
          <h3>{{ monster.name }}</h3>
          <p class="monster-type">{{ monster.type }}</p>
          <p class="monster-hp">HP: {{ monster.hit_points }}</p>
        </div>
        <div class="monster-actions">
          <div class="icon-wrapper">
            <button @click.stop="editMonster(monster)" class="edit-btn" title="Edit">
              <svg class="action-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
          </div>
          <div class="icon-wrapper">
            <button @click.stop="deleteMonster(monster.id)" class="delete-btn" title="Delete">
              <svg class="action-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v12zm2-10V7m0 0V7m0 0V7"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="encounter-actions">
          <input type="number" min="1" v-model.number="monster.quantity" class="quantity-input" placeholder="Qty" />
          <button @click.stop="addToEncounter(monster)" class="add-btn">Add to Encounter</button>
          <button @click.stop="addToCombat(monster)" class="add-btn">Add to Combat</button>
        </div>
      </div>
    </div>

    <!-- Monster details modal -->
    <div v-if="selectedMonster" class="monster-modal">
      <div class="modal-content">
        <button class="close-btn" @click="selectedMonster = null">✕</button>
        <h2>{{ selectedMonster.name }}</h2>
        <img v-if="selectedMonster.image_url" :src="selectedMonster.image_url" class="modal-image" />
        <p><strong>Type:</strong> {{ selectedMonster.type }}</p>
        <p><strong>HP:</strong> {{ selectedMonster.hit_points }}</p>
        <p><strong>Description:</strong> {{ selectedMonster.description }}</p>
        <div v-if="selectedMonster.abilities && selectedMonster.abilities.length">
          <h4>Abilities</h4>
          <ul>
            <li v-for="ability in selectedMonster.abilities" :key="ability.name">
              <strong>{{ ability.name }}:</strong> {{ ability.description }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Upload monster modal -->
    <div v-if="showUploadModal" class="upload-modal">
      <div class="modal-content">
        <button class="close-btn" @click="showUploadModal = false">✕</button>
        <h2>Upload New Monster</h2>
        <form @submit.prevent="uploadMonster">
          <input v-model="newMonster.name" placeholder="Name" required />
          <input v-model="newMonster.type" placeholder="Type" required />
          <input v-model.number="newMonster.hit_points" placeholder="Hit Points" required type="number" />
          <textarea v-model="newMonster.description" placeholder="Description"></textarea>
          <input v-model="newMonster.image_url" placeholder="Image URL" />
          <button type="submit" class="submit-btn">Upload</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../plugins/supabase'

const monsters = ref<any[]>([])
const search = ref('')
const filterType = ref('')
const selectedMonster = ref<any | null>(null)
const showUploadModal = ref(false)
const newMonster = ref({ name: '', type: '', hit_points: 0, description: '', image_url: '' })
const monsterTypes = ref<string[]>([])

const filteredMonsters = computed(() => {
  let result = monsters.value.map(m => ({ ...m, quantity: m.quantity || 1 }))
  if (search.value) {
    result = result.filter(m => m.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  if (filterType.value) {
    result = result.filter(m => m.type === filterType.value)
  }
  return result
})

function editMonster(monster: any) {
  selectedMonster.value = { ...monster }
  showUploadModal.value = true
}

async function deleteMonster(monsterId: string) {
  if (confirm('Delete this monster?')) {
    await supabase.from('monster_templates').delete().eq('id', monsterId)
    loadMonsters()
  }
}

function selectMonster(monster: any) {
  selectedMonster.value = monster
}

function addToEncounter(monster: any) {
  // TODO: Implement logic to add monster to encounter
  alert(`Added ${monster.name} to encounter!`)
}

function addToCombat(monster: any) {
  // TODO: Implement logic to add monster to combat
  alert(`Added ${monster.name} to combat!`)
}

async function uploadMonster() {
  // TODO: Implement upload logic
  alert(`Monster '${newMonster.value.name}' uploaded!`)
  showUploadModal.value = false
  newMonster.value = { name: '', type: '', hit_points: 0, description: '', image_url: '' }
}

async function loadMonsters() {
  const { data, error } = await supabase.from('monster_templates').select('*')
  if (!error && data) {
    monsters.value = data
    monsterTypes.value = Array.from(new Set(data.map((m: any) => m.type))).sort()
  }
}

onMounted(() => {
  loadMonsters()
})
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  margin-bottom: 0.5rem;
}
.add-monster-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 60%, #2563eb 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59,130,246,0.08);
  transition: background 0.2s;
}
.add-monster-btn:hover {
  background: linear-gradient(135deg, #2563eb 60%, #3b82f6 100%);
}
.monster-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
}
.edit-btn, .delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.2rem 0.4rem;
  border-radius: 0.3rem;
  transition: background 0.2s;
}
.edit-btn:hover {
  background: #e0e7ef;
  color: #3b82f6;
}
.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}
.encounter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
}
.quantity-input {
  width: 50px;
  padding: 0.3rem 0.5rem;
  border-radius: 0.4rem;
  border: 1px solid #bfc4ce;
  font-size: 0.95rem;
  background: #f4f6fb;
}
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 24px;
}
.search-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 300px;
}
.search-bar {
  flex: 1;
  padding-left: 2rem;
}
.search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}
.add-icon {
  vertical-align: middle;
  margin-right: 6px;
}
.action-icon {
  vertical-align: middle;
  display: inline-block;
}
/* Monster Library Enhanced Styles */
.gm-monster-library {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
  padding: 2rem 0 4rem 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
}
.gm-monster-library .library-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}
.gm-monster-library h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #22223b;
  margin-bottom: 0.5rem;
}
.gm-monster-library .search-filter-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 600px;
}
.gm-monster-library .search-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 300px;
}
.gm-monster-library .search-bar {
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #bfc4ce;
  font-size: 1.05rem;
  background: #f4f6fb;
  transition: border 0.2s;
}
.gm-monster-library .search-bar:focus {
  border-color: #3b82f6;
  outline: none;
}
.gm-monster-library .search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}
.gm-monster-library .filter-select {
  padding: 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #bfc4ce;
  font-size: 1.05rem;
  background: #f4f6fb;
}
.gm-monster-library .upload-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #10b981 60%, #059669 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16,185,129,0.08);
  transition: background 0.2s;
}
.gm-monster-library .upload-btn:hover {
  background: linear-gradient(135deg, #059669 60%, #10b981 100%);
}
.gm-monster-library .monster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2.2rem;
  margin-top: 1.5rem;
  padding: 0 2rem;
}
.gm-monster-library .monster-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px rgba(59,130,246,0.08);
  padding: 1.4rem 1.1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  border: 1px solid #e5e7eb;
}
.gm-monster-library .monster-card:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.15);
  transform: translateY(-2px) scale(1.04);
  border-color: #3b82f6;
}
.gm-monster-library .monster-image {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 0.8rem;
  margin-bottom: 0.7rem;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  box-shadow: 0 2px 8px rgba(59,130,246,0.07);
}
.gm-monster-library .monster-info {
  text-align: center;
  width: 100%;
}
.gm-monster-library .monster-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #22223b;
  margin-bottom: 0.2rem;
}
.gm-monster-library .monster-type {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 0.2rem;
}
.gm-monster-library .monster-hp {
  font-size: 1rem;
  color: #059669;
  margin-bottom: 0.2rem;
  font-weight: 500;
}
.gm-monster-library .add-btn {
  margin: 0.5rem 0.25rem;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 60%, #2563eb 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(59,130,246,0.08);
}
.gm-monster-library .add-btn:hover {
  background: linear-gradient(135deg, #2563eb 60%, #3b82f6 100%);
}
.gm-monster-library .monster-modal, .gm-monster-library .upload-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.gm-monster-library .modal-content {
  background: #fff;
  border-radius: 1.2rem;
  padding: 2.2rem 1.5rem 1.5rem 1.5rem;
  max-width: 420px;
  width: 100%;
  position: relative;
  box-shadow: 0 12px 48px rgba(59,130,246,0.12);
  border: 1px solid #e5e7eb;
}
.gm-monster-library .close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.7rem;
  cursor: pointer;
  color: #6b7280;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.gm-monster-library .close-btn:hover {
  opacity: 1;
}
.gm-monster-library .modal-image {
  width: 130px;
  height: 130px;
  object-fit: cover;
  border-radius: 0.8rem;
  margin-bottom: 1rem;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  box-shadow: 0 2px 8px rgba(59,130,246,0.07);
}
.gm-monster-library .submit-btn {
  margin-top: 1rem;
  padding: 0.6rem 1.3rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #10b981 60%, #059669 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(16,185,129,0.08);
}
.gm-monster-library .submit-btn:hover {
  background: linear-gradient(135deg, #059669 60%, #10b981 100%);
}
@media (max-width: 768px) {
  .gm-monster-library {
    padding: 1rem 0 2rem 0;
  }
  .gm-monster-library .monster-grid {
    padding: 0 0.5rem;
    gap: 1.2rem;
  }
  .gm-monster-library .modal-content {
    padding: 1rem;
    max-width: 98vw;
  }
}
</style>
