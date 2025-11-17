<template>
  <div class="asset-preview relative w-full h-full rounded-lg overflow-hidden bg-stone-900 transition-all aspect-video" :class="{ 'cursor-pointer': showModal && clickable, 'hover:-translate-y-0.5 shadow-lg': showModal && clickable }" @click="handlePreviewClick">
    <!-- Image Preview -->
    <div v-if="isImage" class="image-preview w-full h-full relative">
      <img 
        v-if="asset.public_url"
        :src="asset.public_url"
        :alt="asset.friendly_name || 'Asset preview'"
        :loading="lazy ? 'lazy' : 'eager'"
        class="preview-image w-full h-full object-cover transition-all"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="no-preview w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800">
        <span class="preview-icon text-2xl mb-1">🖼️</span>
        <span class="preview-text text-xs font-medium opacity-80">No Image</span>
      </div>
    </div>

    <!-- Audio Preview -->
    <div v-else-if="isAudio" class="audio-preview w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-purple-600 to-purple-300 text-white">
      <div class="audio-icon flex flex-col items-center gap-2">
        <span class="preview-icon text-2xl mb-1">🎵</span>
        <span class="preview-text text-xs font-medium opacity-80">Audio File</span>
      </div>
      <div v-if="asset.friendly_name" class="audio-name text-xs font-semibold bg-black/20 px-2 py-1 rounded mt-2">{{ getFileExtension(asset.friendly_name) }}</div>
    </div>

    <!-- Generic File Preview -->
    <div v-else class="generic-preview w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-stone-600 to-stone-400 text-white">
      <span class="preview-icon text-2xl mb-1">📄</span>
      <span class="preview-text text-xs font-medium opacity-80">{{ asset.asset_type }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="preview-loading absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div class="loading-spinner animate-spin w-5 h-5 border-2 border-stone-400 border-t-white rounded-full"></div>
    </div>

    <!-- Asset Info Overlay -->
    <div v-if="showInfo" class="preview-info absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 pb-2 pt-4 text-white">
      <div class="asset-title text-xs font-semibold mb-1 truncate">{{ asset.friendly_name || 'Unnamed' }}</div>
      <div class="asset-meta flex justify-between text-xs opacity-80">
        <span class="asset-type uppercase font-medium">{{ asset.asset_type }}</span>
        <span class="asset-date opacity-70">{{ formatDate(asset.created_at) }}</span>
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <AssetPreviewModal
        v-if="showModal && modalOpen"
        :asset="asset"
        :assets="assetsList"
        :assetIndex="assetIndex"
        @close="modalOpen = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Asset } from '../stores/asset'
import AssetPreviewModal from './AssetPreviewModal.vue'

interface Props {
  asset: Asset
  showInfo?: boolean
  showModal?: boolean
  lazy?: boolean
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
  assetsList?: Asset[]
  assetIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false,
  showModal: true,
  lazy: true,
  size: 'medium',
  clickable: true,
  assetsList: undefined,
  assetIndex: undefined
})

const loading = ref(false)
const modalOpen = ref(false)

// Computed properties
const isImage = computed(() => {
  return props.asset.asset_type === 'scene' || 
         props.asset.asset_type === 'map' || 
         props.asset.asset_type === 'portrait' ||
         (props.asset.type === 'IMAGE')
})

const isAudio = computed(() => {
  return props.asset.type === 'AUDIO'
})

// Methods
function handlePreviewClick() {
  if (props.showModal && props.clickable && isImage.value) {
    modalOpen.value = true
  }
}

function handleImageError() {
  loading.value = false
}

function handleImageLoad() {
  loading.value = false
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'FILE'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && modalOpen.value) {
    modalOpen.value = false
  }
}

// Lifecycle - manage ESC key listener when modal is open
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>