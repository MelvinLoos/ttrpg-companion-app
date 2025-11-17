<template>
  <div class="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-1000 p-4" @click="handleBackdropClick">
    <div class="modal-container bg-linear-to-br from-stone-900 to-stone-700 rounded-xl shadow-2xl w-full max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden" @click.stop>
      <div class="modal-header flex justify-between items-center p-6 border-b border-stone-800 bg-linear-to-br from-stone-900 to-stone-800">
        <h3 class="modal-title text-white text-lg font-semibold truncate flex-1 mr-4">{{ asset.friendly_name || 'Asset Preview' }}</h3>
        <button @click="$emit('close')" class="modal-close text-stone-300 text-2xl rounded-lg w-8 h-8 flex items-center justify-center hover:bg-stone-800 transition">
          <span>×</span>
        </button>
      </div>

      <div class="modal-content flex-1 p-6 flex items-center justify-center overflow-auto">
        <!-- Image Preview -->
        <div v-if="isImage" class="image-modal relative w-full flex flex-col items-center justify-center">
          <img v-if="currentAsset.public_url" :src="currentAsset.public_url"
            :alt="currentAsset.friendly_name || 'Asset preview'" class="modal-image max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" @error="imageError = true" />
          <div v-else-if="imageError" class="image-error flex flex-col items-center justify-center text-red-400">
            <span class="error-icon text-2xl mb-2">⚠️</span>
            <p>Failed to load image</p>
          </div>
          <div v-else class="image-loading flex flex-col items-center justify-center text-stone-400">
            <div class="loading-spinner animate-spin w-6 h-6 border-2 border-stone-400 border-t-white rounded-full mb-2"></div>
            <p>Loading image...</p>
          </div>
          <div v-if="props.assets && props.assets.length > 1" class="absolute inset-0 flex items-center justify-between pointer-events-none">
            <button @click="goToPrev" :disabled="currentIndex === 0"
              class="pointer-events-auto bg-stone-800/80 hover:bg-stone-900 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl absolute left-4 top-1/2 -translate-y-1/2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous asset">
              &#8592;
            </button>
            <span class="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-4 text-sm text-stone-300 bg-stone-900/80 px-3 py-1 rounded">{{ currentIndex + 1 }} / {{ props.assets.length }}</span>
            <button @click="goToNext" :disabled="currentIndex === props.assets.length - 1"
              class="pointer-events-auto bg-stone-800/80 hover:bg-stone-900 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl absolute right-4 top-1/2 -translate-y-1/2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next asset">
              &#8594;
            </button>
          </div>
        </div>

        <!-- Audio Preview -->
        <div v-else-if="isAudio" class="audio-modal flex flex-col items-center justify-center w-full">
          <div class="audio-player mb-4">
            <audio v-if="currentAsset.public_url" :src="currentAsset.public_url" controls class="audio-controls w-full max-w-md" preload="metadata">
              Your browser does not support audio playback.
            </audio>
            <div v-else class="audio-error flex flex-col items-center justify-center text-red-400">
              <span class="error-icon text-2xl mb-2">⚠️</span>
              <p>Audio file not available</p>
            </div>
          </div>
          <div class="audio-info flex flex-col items-center">
            <div class="audio-icon-large text-4xl mb-2">🎵</div>
            <div class="audio-details text-center">
              <h4 class="text-white text-base font-semibold">{{ currentAsset.friendly_name || 'Untitled Audio' }}</h4>
              <p class="audio-type text-stone-400 text-sm">{{ getFileExtension(currentAsset.friendly_name) }} Audio</p>
            </div>
          </div>
          <div v-if="props.assets && props.assets.length > 1" class="flex justify-between items-center mt-4 w-full max-w-md mx-auto">
            <button @click="goToPrev" :disabled="currentIndex === 0"
              class="px-4 py-2 rounded bg-stone-700 text-white disabled:opacity-50">Previous</button>
            <span class="text-sm text-stone-300">{{ currentIndex + 1 }} / {{ props.assets.length }}</span>
            <button @click="goToNext" :disabled="currentIndex === props.assets.length - 1"
              class="px-4 py-2 rounded bg-stone-700 text-white disabled:opacity-50">Next</button>
          </div>
        </div>

        <!-- Generic File Preview -->
        <div v-else class="generic-modal flex flex-col items-center justify-center w-full">
          <div class="generic-icon text-4xl mb-2">📄</div>
          <h4 class="text-white text-base font-semibold">{{ currentAsset.friendly_name || 'Untitled File' }}</h4>
          <p class="generic-type text-stone-400 text-sm">{{ currentAsset.asset_type || currentAsset.type }} File</p>
          <a v-if="currentAsset.public_url" :href="currentAsset.public_url" target="_blank" class="download-link text-blue-500 underline mt-2">View/Download File</a>
          <div v-if="props.assets && props.assets.length > 1" class="flex justify-between items-center mt-4 w-full max-w-md mx-auto">
            <button @click="goToPrev" :disabled="currentIndex === 0"
              class="px-4 py-2 rounded bg-stone-700 text-white disabled:opacity-50">Previous</button>
            <span class="text-sm text-stone-300">{{ currentIndex + 1 }} / {{ props.assets.length }}</span>
            <button @click="goToNext" :disabled="currentIndex === props.assets.length - 1"
              class="px-4 py-2 rounded bg-stone-700 text-white disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <div class="modal-footer p-6 border-t border-stone-800 bg-linear-to-br from-stone-900 to-stone-800 flex flex-col gap-4">
        <div class="asset-metadata flex flex-wrap gap-6">
          <div class="metadata-item flex flex-col">
            <span class="metadata-label text-stone-400 text-xs">Type:</span>
            <span class="metadata-value text-white text-sm">{{ asset.asset_type || asset.type }}</span>
          </div>
          <div class="metadata-item flex flex-col">
            <span class="metadata-label text-stone-400 text-xs">Created:</span>
            <span class="metadata-value text-white text-sm">{{ formatDate(asset.created_at) }}</span>
          </div>
          <div v-if="asset.friendly_name" class="metadata-item flex flex-col">
            <span class="metadata-label text-stone-400 text-xs">Filename:</span>
            <span class="metadata-value text-white text-sm">{{ asset.friendly_name }}</span>
          </div>
        </div>
        <div v-if="props.showPushButton && props.pushToScreen" class="push-to-screen flex justify-center">
          <button class="push-btn-modal bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold text-base transition shadow-lg" @click="handlePushToScreen">
            📺 Push to Player Screen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
function handlePushToScreen() {
  if (props.pushToScreen) {
    props.pushToScreen(currentAsset.value)
  }
  emit('close')
}
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Asset } from '../stores/asset'

interface Props {
  asset: Asset
  assets?: Asset[]
  assetIndex?: number
  showPushButton?: boolean
  pushToScreen?: (asset: Asset) => void
}

const props = withDefaults(defineProps<Props>(), {
  showPushButton: false,
  pushToScreen: undefined
})
const emit = defineEmits(['close'])

function goToPrev() {
  if (props.assets && currentIndex.value > 0) {
    currentIndex.value--
    currentAsset.value = props.assets[currentIndex.value] ?? currentAsset.value
    imageError.value = false
  }
}
function goToNext() {
  if (props.assets && currentIndex.value < props.assets.length - 1) {
    currentIndex.value++
    currentAsset.value = props.assets[currentIndex.value] ?? currentAsset.value
    imageError.value = false
  }
}

const imageError = ref(false)
const currentIndex = ref(props.assetIndex ?? 0)
const currentAsset = ref(props.asset)

watch(() => props.asset, (val) => {
  currentAsset.value = val
})
watch(() => props.assetIndex, (val) => {
  if (typeof val === 'number') currentIndex.value = val
})

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
function handleBackdropClick() {
  emit('close')
}

function getFileExtension(filename?: string | null): string {
  if (!filename) return 'UNKNOWN'
  return filename.split('.').pop()?.toUpperCase() || 'FILE'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  } else if (event.key === 'ArrowLeft' && props.assets && currentIndex.value > 0) {
    goToPrev()
  } else if (event.key === 'ArrowRight' && props.assets && currentIndex.value < props.assets.length - 1) {
    goToNext()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>