<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <TransitionGroup
        enter-active-class="transform transition duration-300 ease-out"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transform transition duration-200 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto bg-white rounded-xl shadow-2xl border border-slate-100 p-4 flex items-start gap-4 overflow-hidden relative group"
          :class="{
            'border-l-4 border-l-blue-500': toast.type === 'success',
            'border-l-4 border-l-red-500': toast.type === 'error',
            'border-l-4 border-l-amber-500': toast.type === 'warning',
          }"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <svg v-if="toast.type === 'success'" class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-grow min-w-0">
            <p class="text-sm font-semibold text-slate-900 leading-tight">{{ toast.title }}</p>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          <button
            @click="toastStore.remove(toast.id)"
            class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Progress Bar -->
          <div 
            class="absolute bottom-0 left-0 h-1 bg-slate-100 group-hover:bg-slate-200 transition-colors"
            style="width: 100%"
          >
            <div 
              class="h-full bg-slate-300 transition-all duration-linear"
              :style="{ width: `${toast.progress}%` }"
              :class="{
                'bg-blue-400': toast.type === 'success',
                'bg-red-400': toast.type === 'error',
                'bg-amber-400': toast.type === 'warning',
              }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToastStore } from '../stores/useToastStore'

const toastStore = useToastStore()
const page = usePage()

// Track last handled flash message to prevent loops during router reloads
let lastFlashMessage = null
let lastFlashSuccess = null
let lastFlashError = null

// Watch Inertia flash messages
watch(() => page.props.flash, (flash) => {
  if (flash.message && flash.message !== lastFlashMessage) {
    toastStore.success(flash.message)
    lastFlashMessage = flash.message
  } else if (!flash.message) {
    lastFlashMessage = null
  }

  if (flash.success && flash.success !== lastFlashSuccess) {
    toastStore.success(flash.success)
    lastFlashSuccess = flash.success
  } else if (!flash.success) {
    lastFlashSuccess = null
  }

  if (flash.error && flash.error !== lastFlashError) {
    toastStore.error(flash.error)
    lastFlashError = flash.error
  } else if (!flash.error) {
    lastFlashError = null
  }
}, { deep: true })

onMounted(() => {
  // Check if there's an initial flash
  if (page.props.flash.success) {
    toastStore.success(page.props.flash.success)
    lastFlashSuccess = page.props.flash.success
  }
  if (page.props.flash.error) {
    toastStore.error(page.props.flash.error)
    lastFlashError = page.props.flash.error
  }
})
</script>

<style scoped>
.duration-linear {
  transition-timing-function: linear;
}
</style>
