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
    <div v-else-if="imageAssets.length > 0" class="asset-grid-wrapper">
      <div class="asset-grid">
        <div 
          v-for="asset in paginatedAssets" 
          :key="asset.id"
          class="asset-thumbnail"
          :class="{ active: asset.id === currentImageAssetId }"
        >
          <AssetPreview 
            :asset="asset" 
            :show-modal="true"
            :lazy="false"
          />
          <div class="thumbnail-overlay">
            <div class="overlay-actions">
              <button 
                @click.stop="openPreview(asset)"
                class="preview-btn"
                title="Preview Image"
              >
                🔍
              </button>
              <button 
                @click="pushToScreen(asset)"
                :disabled="pushing === asset.id"
                class="push-btn"
              >
                {{ pushing === asset.id ? '⏳' : '📺' }}
                {{ pushing === asset.id ? 'Pushing...' : 'Push to Screen' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="showPagination" class="pagination">
        <button 
          @click="prevPage"
          :disabled="currentPage === 1 || changingPage"
          class="pagination-btn"
          title="Previous page"
        >
          ←
        </button>
        
        <div class="pagination-info">
          <!-- Show first page if not in range -->
          <button v-if="currentPage > 3" @click="goToPage(1)" :disabled="changingPage" class="page-btn">1</button>
          <span v-if="currentPage > 4" class="pagination-ellipsis">...</span>
          
          <!-- Show pages around current page -->
          <button 
            v-for="page in getPaginationRange()" 
            :key="page"
            @click="goToPage(page)"
            :disabled="changingPage"
            :class="['page-btn', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
          
          <!-- Show last page if not in range -->
          <span v-if="currentPage < totalPages - 3" class="pagination-ellipsis">...</span>
          <button v-if="currentPage < totalPages - 2 && totalPages > 5" @click="goToPage(totalPages)" :disabled="changingPage" class="page-btn">{{ totalPages }}</button>
        </div>
        
        <button 
          @click="nextPage"
          :disabled="currentPage === totalPages || changingPage"
          class="pagination-btn"
          title="Next page"
        >
          →
        </button>
        
        <span class="pagination-summary">
          {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, imageAssets.length) }} 
          of {{ imageAssets.length }}
          <span v-if="changingPage" class="changing-indicator">...</span>
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📷</div>
      <p>No scene images available</p>
      <p class="empty-hint">Upload some scene assets to get started</p>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div 
        v-if="previewAsset" 
        class="gallery-modal-backdrop"
        @click="closePreview"
      >
        <div class="gallery-modal-container" @click.stop>
          <div class="gallery-modal-header">
            <h3>{{ previewAsset.friendly_name || 'Asset Preview' }}</h3>
            <button @click="closePreview" class="gallery-modal-close">×</button>
          </div>
          <div class="gallery-modal-content">
            <img 
              v-if="previewAsset.public_url"
              :src="previewAsset.public_url"
              :alt="previewAsset.friendly_name || 'Asset preview'"
              class="gallery-modal-image"
            />
          </div>
          <div class="gallery-modal-footer">
            <button 
              @click="pushToScreen(previewAsset); closePreview()"
              :disabled="pushing === previewAsset.id"
              class="gallery-push-btn"
            >
              {{ pushing === previewAsset.id ? 'Pushing...' : 'Push to Player Screen' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../plugins/supabase'
import { useAssetStore, type Asset } from '../stores/asset'
import AssetPreview from './AssetPreview.vue'

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
const previewAsset = ref<Asset | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(12) // Increased to better utilize full width
const changingPage = ref(false)

// Computed properties
const imageAssets = computed(() => {
  // Filter assets to only show IMAGE type scene assets
  return assetStore.assetsByType.scenes.filter(asset => 
    !asset.type || asset.type === 'IMAGE' // Include assets without type for backward compatibility
  )
})

const totalPages = computed(() => 
  Math.ceil(imageAssets.value.length / itemsPerPage.value)
)

const paginatedAssets = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return imageAssets.value.slice(startIndex, endIndex)
})

const showPagination = computed(() => totalPages.value > 1)

// Methods
function openPreview(asset: Asset) {
  previewAsset.value = asset
}

function closePreview() {
  previewAsset.value = null
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    changingPage.value = true
    setTimeout(() => {
      currentPage.value++
      changingPage.value = false
    }, 150)
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    changingPage.value = true
    setTimeout(() => {
      currentPage.value--
      changingPage.value = false
    }, 150)
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    changingPage.value = true
    setTimeout(() => {
      currentPage.value = page
      changingPage.value = false
    }, 150)
  }
}

function getPaginationRange() {
  const range = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  
  return range
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && previewAsset.value) {
    closePreview()
  } else if (event.key === 'ArrowLeft' && currentPage.value > 1) {
    prevPage()
  } else if (event.key === 'ArrowRight' && currentPage.value < totalPages.value) {
    nextPage()
  }
}

async function refreshAssets() {
  loading.value = true
  error.value = null
  currentPage.value = 1 // Reset pagination
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

  // Add ESC key listener
  document.addEventListener('keydown', handleKeydown)

  // Subscribe to asset changes
  const unsubscribe = assetStore.subscribeToChanges()
  onUnmounted(() => {
    unsubscribe()
    document.removeEventListener('keydown', handleKeydown)
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
  height: 100%;
  max-height: 45vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  width: 100%;
  flex-shrink: 0;
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
.asset-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 0.5rem;
  width: 100%;
}

.asset-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
  width: 100%;
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
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: auto;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 0.5rem 0.5rem;
  margin: 0 -0.75rem -0.75rem -0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  flex-shrink: 0;
}

.pagination-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.25rem;
  padding: 0.375rem 0.625rem;
  cursor: pointer;
  font-size: 0.8rem;
  min-width: 2rem;
  transition: all 0.2s ease;
}

.page-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.page-btn.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
  font-weight: 600;
}

.pagination-ellipsis {
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
}

.pagination-summary {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 0.5rem;
}

.changing-indicator {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
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
  transition: all 0.2s ease;
  z-index: 5;
}

.asset-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.preview-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: scale(1.1);
}

.push-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.push-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.push-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Gallery Modal Styles */
.gallery-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.gallery-modal-container {
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 1rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gallery-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.gallery-modal-header h3 {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 1rem;
}

.gallery-modal-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.gallery-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.gallery-modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.gallery-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
  display: flex;
  justify-content: center;
}

.gallery-push-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  min-width: 200px;
}

.gallery-push-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.gallery-push-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .gm-asset-gallery {
    max-height: 50vh;
  }

  .asset-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.25rem;
  }

  .asset-grid-container {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.25rem;
  }
  
  .push-btn {
    font-size: 0.7rem;
    padding: 0.5rem 0.75rem;
  }

  .preview-btn {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .pagination-btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
  }

  .page-btn {
    padding: 0.25rem 0.5rem;
    min-width: 1.75rem;
  }

  .pagination-summary {
    flex-basis: 100%;
    text-align: center;
    margin: 0.5rem 0 0 0;
  }

  /* Gallery Modal Mobile */
  .gallery-modal-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .gallery-modal-header,
  .gallery-modal-content,
  .gallery-modal-footer {
    padding: 1rem;
  }
  
  .gallery-modal-header h3 {
    font-size: 1rem;
  }
  
  .gallery-modal-image {
    max-height: 50vh;
  }

  .gallery-push-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
    min-width: 150px;
  }
}
</style>