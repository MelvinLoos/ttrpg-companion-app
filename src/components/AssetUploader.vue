<template>
  <div 
    class="asset-uploader"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    :class="{ 'dragging': isDragging }"
  >
    <div class="upload-content">
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p class="upload-text">
        Drop files here or <button class="browse-button" @click="triggerFileInput">browse</button>
      </p>
      <p class="upload-hint" v-if="hint">{{ hint }}</p>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileSelect"
        class="hidden"
      />
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadProgress.length > 0" class="upload-progress">
      <div v-for="item in uploadProgress" :key="item.file.name" class="progress-item">
        <div class="progress-info">
          <span class="filename">{{ item.file.name }}</span>
          <span class="status">{{ item.status }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :class="{ error: item.error }"
            :style="{ width: item.progress + '%' }"
          ></div>
        </div>
        <p v-if="item.error" class="error-message">{{ item.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  accept?: string
  hint?: string
}>()

const emit = defineEmits<{
  (e: 'upload', file: File): void
}>()

interface ProgressItem {
  file: File
  progress: number
  status: string
  error?: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadProgress = ref<ProgressItem[]>([])

function handleDragOver(event: DragEvent) {
  isDragging.value = true
  event.dataTransfer!.dropEffect = 'copy'
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    handleFiles(Array.from(files))
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    handleFiles(Array.from(input.files))
    input.value = '' // Reset input
  }
}

function handleFiles(files: File[]) {
  files.forEach(file => {
    // Add file to progress tracking
    const progressItem: ProgressItem = {
      file,
      progress: 0,
      status: 'Starting upload...'
    }
    uploadProgress.value.push(progressItem)

    // Simulate progress (in real app, this would come from upload progress events)
    const interval = setInterval(() => {
      const item = uploadProgress.value.find(i => i.file === file)
      if (item && item.progress < 100) {
        item.progress += 10
        item.status = 'Uploading...'
      } else {
        clearInterval(interval)
      }
    }, 100)

    // Emit the file for parent to handle
    emit('upload', file)
  })
}
</script>

<style scoped>
.asset-uploader {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
}

.asset-uploader.dragging {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.icon {
  color: rgba(255, 255, 255, 0.5);
}

.upload-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.upload-hint {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.browse-button {
  background: none;
  border: none;
  color: rgb(59, 130, 246);
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-decoration: underline;
}

.browse-button:hover {
  color: rgb(96, 165, 250);
}

.hidden {
  display: none;
}

.upload-progress {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.filename {
  color: rgba(255, 255, 255, 0.8);
}

.status {
  color: rgba(255, 255, 255, 0.5);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgb(59, 130, 246);
  transition: width 0.2s ease;
}

.progress-fill.error {
  background: rgb(239, 68, 68);
}

.error-message {
  margin: 0.5rem 0 0;
  color: rgb(239, 68, 68);
  font-size: 0.9rem;
}
</style>