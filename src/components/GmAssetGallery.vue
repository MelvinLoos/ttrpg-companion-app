<template>
  <div class="gm-asset-gallery bg-stone-900 border border-stone-800 rounded-lg p-4 h-full max-h-[45vh] flex flex-col overflow-hidden">
    <header class="gallery-header flex justify-between items-center mb-3 w-full">
      <h4 class="text-white text-base font-semibold">Push Image to Screen</h4>
      <button 
        @click="refreshAssets" 
        :disabled="loading"
        class="refresh-btn border border-stone-700 text-stone-300 rounded px-2 py-1 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh assets"
      >
        🔄
      </button>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state text-center py-4 text-stone-300">
      <div class="loading-spinner animate-spin w-5 h-5 border-2 border-stone-400 border-t-white rounded-full mx-auto mb-2"></div>
      <p>Loading assets...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state text-center py-4 text-red-400">
      <p>{{ error }}</p>
      <button @click="refreshAssets" class="retry-btn bg-red-500 text-white rounded px-3 py-1 mt-2">Retry</button>
    </div>

    <!-- Asset Grid -->
    <div v-else-if="imageAssets.length > 0" class="asset-grid-wrapper flex-1 flex flex-col min-h-0 overflow-hidden w-full">
      <div class="asset-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 flex-1 overflow-y-auto min-h-0 pb-2 w-full grid-auto-rows-[1fr]">
        <div 
          v-for="asset in paginatedAssets" 
          :key="asset.id"
          class="asset-thumbnail relative aspect-video h-full min-w-[140px] rounded-md overflow-hidden border-2 border-transparent bg-stone-800 transition-all hover:border-stone-300 flex"
          :class="{ 'border-green-500 shadow-lg': asset.id === currentImageAssetId }"
        >
          <AssetPreview 
            :asset="asset" 
            :show-modal="true"
            :lazy="false"
          />
          <div class="thumbnail-overlay absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 transition-all z-10 hover:opacity-100">
            <div class="overlay-actions flex flex-col gap-2 items-center">
              <button 
                @click.stop="openPreview(asset)"
                class="preview-btn bg-linear-to-br from-green-500 to-emerald-700 text-white rounded-lg p-2 text-xl shadow hover:scale-110 transition"
                title="Preview Image"
              >
                🔍
              </button>
              <button 
                @click="pushToScreen(asset)"
                :disabled="pushing === asset.id"
                class="push-btn bg-linear-to-br from-blue-500 to-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow hover:translate-y-[-2px] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ pushing === asset.id ? '⏳' : '📺' }}
                {{ pushing === asset.id ? 'Pushing...' : 'Push to Screen' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="showPagination" class="pagination flex items-center justify-center gap-2 mt-auto pt-3 border-t border-stone-700 bg-stone-900 rounded-b-lg">
        <button 
          @click="prevPage"
          :disabled="currentPage === 1 || changingPage"
          class="pagination-btn border border-stone-700 bg-stone-800 text-white rounded px-2 py-1 text-sm transition hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous page"
        >
          ←
        </button>
        <div class="pagination-info flex items-center gap-1">
          <button v-if="currentPage > 3" @click="goToPage(1)" :disabled="changingPage" class="page-btn border border-stone-700 bg-stone-800 text-white rounded px-2 py-1 text-xs">1</button>
          <span v-if="currentPage > 4" class="pagination-ellipsis text-stone-400 px-2">...</span>
          <button 
            v-for="page in getPaginationRange()" 
            :key="page"
            @click="goToPage(page)"
            :disabled="changingPage"
            :class="['page-btn border border-stone-700 bg-stone-800 text-white rounded px-2 py-1 text-xs transition', { 'bg-blue-600 border-blue-700 font-bold': page === currentPage } ]"
          >
            {{ page }}
          </button>
          <span v-if="currentPage < totalPages - 3" class="pagination-ellipsis text-stone-400 px-2">...</span>
          <button v-if="currentPage < totalPages - 2 && totalPages > 5" @click="goToPage(totalPages)" :disabled="changingPage" class="page-btn border border-stone-700 bg-stone-800 text-white rounded px-2 py-1 text-xs">{{ totalPages }}</button>
        </div>
        <button 
          @click="nextPage"
          :disabled="currentPage === totalPages || changingPage"
          class="pagination-btn border border-stone-700 bg-stone-800 text-white rounded px-2 py-1 text-sm transition hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next page"
        >
          →
        </button>
        <span class="pagination-summary text-xs text-stone-400 ml-2">
          {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, imageAssets.length) }} 
          of {{ imageAssets.length }}
          <span v-if="changingPage" class="changing-indicator italic text-stone-400">...</span>
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state text-center py-8 text-stone-400">
      <div class="empty-icon text-3xl mb-2 opacity-50">📷</div>
      <p>No scene images available</p>
      <p class="empty-hint text-xs opacity-60">Upload some scene assets to get started</p>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <AssetPreviewModal
        v-if="previewAsset"
        :asset="previewAsset"
        :assets="paginatedAssets"
        :assetIndex="paginatedAssets.findIndex(a => a.id === previewAsset?.id)"
        :showPushButton="true"
        :pushToScreen="pushToScreen"
        @close="closePreview"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../plugins/supabase'
import { useAssetStore, type Asset } from '../stores/asset'
import AssetPreview from './AssetPreview.vue'
import AssetPreviewModal from './AssetPreviewModal.vue'

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