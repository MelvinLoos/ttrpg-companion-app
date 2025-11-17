<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label for="character-name" class="block text-sm font-semibold mb-2">Character Name</label>
      <input id="character-name" v-model="localName" type="text" required
        class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
        placeholder="Enter character name" />
    </div>
    <!-- Tabs -->
    <div class="mb-4">
      <div class="flex gap-2 border-b border-stone-700 mb-2">
        <button type="button" @click="activeTab = 'appearance'" :class="['px-4 py-2 rounded-t-lg font-semibold', activeTab === 'appearance' ? 'bg-stone-700 text-white' : 'bg-stone-800 text-stone-400']">Appearance</button>
        <button type="button" @click="activeTab = 'stats'" :class="['px-4 py-2 rounded-t-lg font-semibold', activeTab === 'stats' ? 'bg-stone-700 text-white' : 'bg-stone-800 text-stone-400']">Stats</button>
      </div>
      <div v-if="activeTab === 'appearance'">
        <label class="block text-sm font-semibold mb-2">Portrait Image</label>
        <div class="flex flex-col gap-4 items-center">
          <img v-if="portraitPreview" :src="portraitPreview" alt="Portrait preview" class="w-32 h-32 rounded-lg object-cover bg-stone-900" />
          <img v-else-if="localPortraitUrl" :src="localPortraitUrl" alt="Current portrait" class="w-32 h-32 rounded-lg object-cover bg-stone-900" />
          <div v-else class="w-32 h-32 rounded-lg bg-stone-900 flex items-center justify-center text-stone-500 text-sm">No portrait selected</div>
          <!-- Portrait Picker Grid -->
          <div v-if="portraitAssets.length > 0" class="portrait-picker-grid grid grid-cols-3 gap-2 mt-2 overflow-y-auto" style="max-height: 240px;">
            <button v-for="portrait in portraitAssets" :key="portrait.id"
              type="button"
              @click="selectPortrait(portrait)"
              :class="['w-20 h-20 rounded-lg overflow-hidden border-2 transition', localPortraitUrl === portrait.public_url ? 'border-blue-500 ring-2 ring-blue-400' : 'border-stone-700 hover:border-blue-400']"
              title="Select portrait">
              <img :src="portrait.public_url || ''" alt="Portrait" class="w-full h-full object-cover" />
            </button>
          </div>
          <!-- Portrait Upload (drag-and-drop) -->
          <div class="w-full mt-4">
            <AssetUploader
              accept="image/*"
              hint="Upload a new portrait (drag & drop or browse)"
              @upload="handlePortraitUpload"
            />
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'stats'">
        <label class="block text-sm font-semibold mb-2">Character Stats</label>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="stat in statKeys" :key="stat" class="flex flex-col gap-1">
            <label :for="'stat-' + stat" class="text-xs">{{ stat }}</label>
            <input :id="'stat-' + stat" v-model.number="localStats[stat]" type="number" min="0"
              class="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white text-center"
              placeholder="10" />
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-4 pt-4 border-t border-stone-700 mt-6">
      <button type="button" @click="$emit('cancel')"
        class="flex-1 bg-stone-600 hover:bg-stone-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">Cancel</button>
      <button type="submit"
        class="flex-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors font-medium">{{ submitLabel }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">

import { ref, reactive, computed, watch } from 'vue'
import AssetUploader from './AssetUploader.vue'
import { useAssetStore } from '../stores/asset'
import type { Asset } from '../stores/asset'
import type { CharacterStats } from '../types/character'

const props = defineProps<{
  name?: string
  portraitUrl?: string | null
  stats?: CharacterStats
  submitLabel?: string
}>()
const emit = defineEmits(['submit', 'cancel'])

const assetStore = useAssetStore()
const portraitAssets = computed(() => assetStore.assetsByType.portraits)

const localName = ref(props.name || '')
const localPortraitUrl = ref(props.portraitUrl || null)
const portraitPreview = ref<string | null>(null)
const defaultStats: CharacterStats = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
const localStats = reactive<CharacterStats>(props.stats ? { ...props.stats } : { ...defaultStats })
const statKeys: (keyof CharacterStats)[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
const activeTab = ref('appearance')

function selectPortrait(portrait: Asset) {
  localPortraitUrl.value = portrait.public_url ?? null
  portraitPreview.value = null
}
async function handlePortraitUpload(file: File) {
  const asset = await assetStore.uploadAsset(file, 'portrait', file.name)
  if (asset && asset.public_url) {
    localPortraitUrl.value = asset.public_url
    portraitPreview.value = asset.public_url
  }
}
function handleSubmit() {
  emit('submit', {
    name: localName.value,
    portrait_url: localPortraitUrl.value,
    stats: localStats
  })
}
watch(() => props.name, (val) => { localName.value = val || '' })
watch(() => props.portraitUrl, (val) => { localPortraitUrl.value = val || null })
watch(() => props.stats, (val) => {
  localStats.STR = val?.STR ?? 10
  localStats.DEX = val?.DEX ?? 10
  localStats.CON = val?.CON ?? 10
  localStats.INT = val?.INT ?? 10
  localStats.WIS = val?.WIS ?? 10
  localStats.CHA = val?.CHA ?? 10
})
</script>
