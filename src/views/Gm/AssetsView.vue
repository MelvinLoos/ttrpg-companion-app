<template>
  <div class="min-h-screen w-full h-full p-1">
    <header class="assets-header bg-stone-900 text-stone-100 border-b p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Asset Library</h1>
          <p class="text-stone-400 mt-1">Manage your collection of scenes, maps, and portraits</p>
        </div>
        <div class="flex gap-2">
          <button 
            v-for="type in assetTypes" 
            :key="type.value"
            @click="activeType = type.value"
            :class="[
              'px-4 py-2 rounded border font-medium text-sm transition',
              activeType === type.value
                ? 'bg-blue-200/20 border-blue-400/40 text-blue-300'
                : 'bg-white/10 border-white/20 text-inherit hover:bg-white/20',
            ]"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </header>

    <div class="flex flex-col gap-8">
      <!-- Uploader -->
      <AssetUploader 
        :accept="uploadAccept"
        :hint="uploaderHint"
        @upload="handleUpload"
      />

      <!-- Asset Grid -->
      <div v-if="store.state.loading" class="text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/20">
        <p>Loading assets...</p>
      </div>
      <div v-else-if="store.state.error" class="text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/20">
        <p>{{ store.state.error }}</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto max-h-140">
        <div 
          v-for="(asset, idx) in filteredAssets" 
          :key="asset.id" 
          class="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden transition duration-300 hover:bg-white/8 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl mb-6"
        >
          <AssetPreview 
            :asset="asset" 
            :show-info="true"
            :show-modal="true"
            :assets-list="filteredAssets"
            :asset-index="idx"
          />
          <div class="absolute top-3 right-3 z-10">
            <button 
              class="px-2 py-2 bg-red-600/90 rounded text-white text-lg shadow hover:bg-red-700/95 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md border border-red-700"
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

</style>