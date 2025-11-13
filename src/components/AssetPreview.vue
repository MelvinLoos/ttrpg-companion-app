<template>
  <div class="asset-preview" :class="{ 'clickable': showModal && clickable }" @click="handlePreviewClick">
    <!-- Image Preview -->
    <div v-if="isImage" class="image-preview">
      <img 
        v-if="asset.public_url"
        :src="asset.public_url"
        :alt="asset.friendly_name || 'Asset preview'"
        :loading="lazy ? 'lazy' : 'eager'"
        class="preview-image"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="no-preview">
        <span class="preview-icon">🖼️</span>
        <span class="preview-text">No Image</span>
      </div>
    </div>

    <!-- Audio Preview -->
    <div v-else-if="isAudio" class="audio-preview">
      <div class="audio-icon">
        <span class="preview-icon">🎵</span>
        <span class="preview-text">Audio File</span>
      </div>
      <div v-if="asset.friendly_name" class="audio-name">
        {{ getFileExtension(asset.friendly_name) }}
      </div>
    </div>

    <!-- Generic File Preview -->
    <div v-else class="generic-preview">
      <span class="preview-icon">📄</span>
      <span class="preview-text">{{ asset.asset_type }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="preview-loading">
      <div class="loading-spinner"></div>
    </div>

    <!-- Asset Info Overlay -->
    <div v-if="showInfo" class="preview-info">
      <div class="asset-title">{{ asset.friendly_name || 'Unnamed' }}</div>
      <div class="asset-meta">
        <span class="asset-type">{{ asset.asset_type }}</span>
        <span class="asset-date">{{ formatDate(asset.created_at) }}</span>
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div 
        v-if="showModal && modalOpen" 
        class="simple-modal-backdrop"
        @click="modalOpen = false"
      >
        <div class="simple-modal-container" @click.stop>
          <div class="simple-modal-header">
            <h3>{{ asset.friendly_name || 'Asset Preview' }}</h3>
            <button @click="modalOpen = false" class="simple-modal-close">×</button>
          </div>
          <div class="simple-modal-content">
            <img 
              v-if="asset.public_url"
              :src="asset.public_url"
              :alt="asset.friendly_name || 'Asset preview'"
              class="simple-modal-image"
            />
          </div>
          <div class="simple-modal-footer">
            <p><strong>Type:</strong> {{ asset.asset_type || asset.type }}</p>
            <p><strong>Created:</strong> {{ formatDate(asset.created_at) }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Asset } from '../stores/asset'

interface Props {
  asset: Asset
  showInfo?: boolean
  showModal?: boolean
  lazy?: boolean
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false,
  showModal: true,
  lazy: true,
  size: 'medium',
  clickable: true
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

<style scoped>
.asset-preview {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.asset-preview.clickable {
  cursor: pointer;
}

.asset-preview.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Image Preview */
.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.2s ease;
}

.no-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

/* Audio Preview */
.audio-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.audio-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.audio-name {
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}

/* Generic Preview */
.generic-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

/* Preview Icons */
.preview-icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.preview-text {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}

/* Loading State */
.preview-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Asset Info Overlay */
.preview-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem 0.75rem 0.5rem;
  color: white;
}

.asset-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  opacity: 0.8;
}

.asset-type {
  text-transform: uppercase;
  font-weight: 500;
}

.asset-date {
  opacity: 0.7;
}

/* Simple Modal Styles */
.simple-modal-backdrop {
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

.simple-modal-container {
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

.simple-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.simple-modal-header h3 {
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

.simple-modal-close {
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

.simple-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.simple-modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.simple-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: rgba(255, 255, 255, 0.8);
}

.simple-modal-footer p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.simple-modal-footer strong {
  color: white;
  margin-right: 0.5rem;
}

/* Size Variants */
.asset-preview {
  aspect-ratio: 16/9;
}

/* Responsive */
@media (max-width: 768px) {
  .preview-icon {
    font-size: 1.5rem;
  }
  
  .preview-text {
    font-size: 0.7rem;
  }
  
  .asset-title {
    font-size: 0.7rem;
  }
  
  .asset-meta {
    font-size: 0.6rem;
  }

  /* Mobile Modal Styles */
  .simple-modal-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .simple-modal-header,
  .simple-modal-content,
  .simple-modal-footer {
    padding: 1rem;
  }
  
  .simple-modal-header h3 {
    font-size: 1rem;
  }
  
  .simple-modal-image {
    max-height: 50vh;
  }
}
</style>