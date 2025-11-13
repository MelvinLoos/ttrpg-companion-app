<template>
  <div class="assets-view">
    <header class="assets-header">
      <h2>Asset Library</h2>
      <div class="asset-filters">
        <button 
          v-for="type in assetTypes" 
          :key="type.value"
          :class="{ active: activeType === type.value }"
          @click="activeType = type.value"
        >
          {{ type.label }}
        </button>
      </div>
    </header>

    <div class="assets-content">
      <!-- Uploader -->
      <AssetUploader 
        :accept="uploadAccept"
        :hint="uploaderHint"
        @upload="handleUpload"
      />

      <!-- Asset Grid -->
      <div v-if="store.state.loading" class="loading">
        <p>Loading assets...</p>
      </div>
      <div v-else-if="store.state.error" class="error">
        <p>{{ store.state.error }}</p>
      </div>
      <div v-else class="asset-grid">
        <div 
          v-for="asset in filteredAssets" 
          :key="asset.id" 
          class="asset-card"
        >
          <AssetPreview 
            :asset="asset" 
            :show-info="true"
            :show-modal="true"
          />
          <div class="asset-actions">
            <button 
              class="delete-btn" 
              @click="handleDelete(asset)"
              :disabled="store.state.loading"
              title="Delete Asset"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAssetStore, type Asset } from '../../stores/asset'
import AssetUploader from '../../components/AssetUploader.vue'
import AssetPreview from '../../components/AssetPreview.vue'

const store = useAssetStore()
const activeType = ref<Asset['asset_type']>('scene')

const assetTypes = [
  { value: 'scene', label: 'Scenes', accept: 'image/*' },
  { value: 'map', label: 'Maps', accept: 'image/*' },
  { value: 'portrait', label: 'Portraits', accept: 'image/*' }
] as const

const filteredAssets = computed(() => 
  store.assetsByType[`${activeType.value}s` as keyof typeof store.assetsByType]
)

const uploadAccept = computed(() => 
  assetTypes.find(t => t.value === activeType.value)?.accept || ''
)

const uploaderHint = computed(() => 
  `Upload ${activeType.value} images`
)

async function handleUpload(file: File) {
  try {
    await store.uploadAsset(file, activeType.value)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

async function handleDelete(asset: Asset) {
  if (confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
    try {
      await store.deleteAsset(asset)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  store.fetchAssets()
  const unsubscribe = store.subscribeToChanges()
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.assets-view {
  padding: 0.25rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.assets-header {
  margin-bottom: 2rem;
}

.assets-header h2 {
  margin: 0 0 1rem;
}

.asset-filters {
  display: flex;
  gap: 0.5rem;
}

.asset-filters button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.asset-filters button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.asset-filters button.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.assets-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.asset-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.asset-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.asset-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  opacity: 0;
  transition: all 0.2s ease;
}

.asset-card:hover .asset-actions {
  opacity: 1;
}

.delete-btn {
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.delete-btn:hover {
  background: rgba(220, 38, 38, 0.95);
  transform: scale(1.1);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>