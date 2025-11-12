<template>
  <div class="gm-asset-gallery">
    <header class="gallery-header">
      <h4>Push Image to Screen</h4>
      <button 
        @click="refreshAssets" 
        :disabled="loading"
        class="refresh-btn"
        title="Refresh assets"
      >
        🔄
      </button>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading assets...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="refreshAssets" class="retry-btn">Retry</button>
    </div>

    <!-- Asset Grid -->
    <div v-else-if="imageAssets.length > 0" class="asset-grid">
      <div 
        v-for="asset in imageAssets" 
        :key="asset.id"
        class="asset-thumbnail"
        :class="{ active: asset.id === currentImageAssetId }"
      >
        <div class="thumbnail-image">
          <img 
            v-if="asset.public_url"
            :src="asset.public_url"
            :alt="asset.friendly_name || 'Scene asset'"
            loading="lazy"
          />
          <div v-else class="no-image">
            📷
          </div>
        </div>
        <div class="thumbnail-overlay">
          <button 
            @click="pushToScreen(asset)"
            :disabled="pushing === asset.id"
            class="push-btn"
          >
            {{ pushing === asset.id ? '⏳' : '📺' }}
            {{ pushing === asset.id ? 'Pushing...' : 'Push to Screen' }}
          </button>
        </div>
        <div class="thumbnail-info">
          <span class="asset-name">{{ asset.friendly_name || 'Unnamed' }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📷</div>
      <p>No scene images available</p>
      <p class="empty-hint">Upload some scene assets to get started</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../plugins/supabase'
import { useAssetStore, type Asset } from '../stores/asset'

interface Props {
  sessionId: string
  currentImageAssetId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'image-pushed': [assetId: string]
}>()

const assetStore = useAssetStore()

// Component state
const loading = ref(false)
const error = ref<string | null>(null)
const pushing = ref<string | null>(null)

// Computed properties
const imageAssets = computed(() => {
  // Filter assets to only show IMAGE type scene assets
  return assetStore.assetsByType.scenes.filter(asset => 
    !asset.type || asset.type === 'IMAGE' // Include assets without type for backward compatibility
  )
})

// Methods
async function refreshAssets() {
  loading.value = true
  error.value = null
  try {
    await assetStore.fetchAssets()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load assets'
  } finally {
    loading.value = false
  }
}

async function pushToScreen(asset: Asset) {
  if (!asset.id || pushing.value) return
  
  pushing.value = asset.id
  
  try {
    // Update session's current_image_asset_id
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        current_image_asset_id: asset.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', props.sessionId)

    if (updateError) throw updateError

    console.log(`Pushed asset ${asset.friendly_name} to screen`)
    emit('image-pushed', asset.id)
  } catch (err) {
    console.error('Failed to push image to screen:', err)
    error.value = err instanceof Error ? err.message : 'Failed to push image'
  } finally {
    pushing.value = null
  }
}

// Lifecycle
onMounted(async () => {
  // Load assets if not already loaded
  if (assetStore.state.assets.length === 0) {
    await refreshAssets()
  }

  // Subscribe to asset changes
  const unsubscribe = assetStore.subscribeToChanges()
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.gm-asset-gallery {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.gallery-header h4 {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.refresh-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #ff6b6b;
}

.retry-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.empty-state {
  padding: 2rem 1rem;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.6;
}

/* Asset Grid */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.asset-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.3);
}

.asset-thumbnail:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.asset-thumbnail.active {
  border-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  position: relative;
}

.thumbnail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.asset-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.push-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}

.push-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

.push-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.thumbnail-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 0.5rem 0.25rem 0.25rem;
  color: white;
}

.asset-name {
  font-size: 0.7rem;
  line-height: 1.2;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 768px) {
  .asset-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }
  
  .push-btn {
    font-size: 0.7rem;
    padding: 0.375rem 0.5rem;
  }
}
</style>