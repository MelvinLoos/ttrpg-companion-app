<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ asset.friendly_name || 'Asset Preview' }}</h3>
        <button @click="$emit('close')" class="modal-close">
          <span>×</span>
        </button>
      </div>

      <div class="modal-content">
        <!-- Image Preview -->
        <div v-if="isImage" class="image-modal">
          <img 
            v-if="asset.public_url"
            :src="asset.public_url"
            :alt="asset.friendly_name || 'Asset preview'"
            class="modal-image"
            @error="imageError = true"
          />
          <div v-else-if="imageError" class="image-error">
            <span class="error-icon">⚠️</span>
            <p>Failed to load image</p>
          </div>
          <div v-else class="image-loading">
            <div class="loading-spinner"></div>
            <p>Loading image...</p>
          </div>
        </div>

        <!-- Audio Preview -->
        <div v-else-if="isAudio" class="audio-modal">
          <div class="audio-player">
            <audio 
              v-if="asset.public_url"
              :src="asset.public_url" 
              controls
              class="audio-controls"
              preload="metadata"
            >
              Your browser does not support audio playback.
            </audio>
            <div v-else class="audio-error">
              <span class="error-icon">⚠️</span>
              <p>Audio file not available</p>
            </div>
          </div>
          
          <div class="audio-info">
            <div class="audio-icon-large">🎵</div>
            <div class="audio-details">
              <h4>{{ asset.friendly_name || 'Untitled Audio' }}</h4>
              <p class="audio-type">{{ getFileExtension(asset.friendly_name) }} Audio</p>
            </div>
          </div>
        </div>

        <!-- Generic File Preview -->
        <div v-else class="generic-modal">
          <div class="generic-icon">📄</div>
          <h4>{{ asset.friendly_name || 'Untitled File' }}</h4>
          <p class="generic-type">{{ asset.asset_type || asset.type }} File</p>
          <a 
            v-if="asset.public_url" 
            :href="asset.public_url" 
            target="_blank"
            class="download-link"
          >
            View/Download File
          </a>
        </div>
      </div>

      <div class="modal-footer">
        <div class="asset-metadata">
          <div class="metadata-item">
            <span class="metadata-label">Type:</span>
            <span class="metadata-value">{{ asset.asset_type || asset.type }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Created:</span>
            <span class="metadata-value">{{ formatDate(asset.created_at) }}</span>
          </div>
          <div v-if="asset.friendly_name" class="metadata-item">
            <span class="metadata-label">Filename:</span>
            <span class="metadata-value">{{ asset.friendly_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Asset } from '../stores/asset'

interface Props {
  asset: Asset
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const imageError = ref(false)

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

<style scoped>
.modal-backdrop {
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

.modal-container {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.modal-title {
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

.modal-close {
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

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Image Modal */
.image-modal {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.image-error,
.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  gap: 1rem;
}

.error-icon {
  font-size: 3rem;
}

/* Audio Modal */
.audio-modal {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.audio-player {
  width: 100%;
  max-width: 400px;
}

.audio-controls {
  width: 100%;
  height: 3rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.audio-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
}

.audio-icon-large {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.audio-details h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.audio-type {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
}

.audio-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  gap: 1rem;
}

/* Generic Modal */
.generic-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
  gap: 1rem;
}

.generic-icon {
  font-size: 4rem;
  opacity: 0.7;
}

.generic-modal h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.generic-type {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
}

.download-link {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.download-link:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
}

/* Loading Spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.asset-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metadata-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metadata-value {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1rem;
  }
  
  .modal-image {
    max-height: 50vh;
  }
  
  .audio-icon-large,
  .generic-icon {
    font-size: 3rem;
  }
  
  .asset-metadata {
    gap: 1rem;
  }
}
</style>