<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100">
        <div class="flex flex-col items-center text-center">
          <!-- Icon -->
          <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 class="text-2xl font-bold text-slate-900 mb-2">{{ title }}</h3>
          <p class="text-slate-500 mb-8 leading-relaxed">{{ message }}</p>

          <div class="flex gap-4 w-full">
            <button 
              type="button" 
              @click="$emit('close')"
              class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-standard"
            >
              {{ cancelText }}
            </button>
            <button 
              type="button" 
              @click="$emit('confirm')"
              class="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-red-500/20 active:scale-95"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

defineEmits(['close', 'confirm'])
</script>
