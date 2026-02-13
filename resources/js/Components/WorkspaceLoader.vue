<template>
  <Transition
    enter-active-class="transition duration-1000 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-1000 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
      <div class="relative flex flex-col items-center">
        <!-- Animated Orbs -->
        <div class="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse delay-75"></div>
        
        <!-- Loading Content -->
        <div class="relative z-10 flex flex-col items-center space-y-8">
          <!-- Logo Animation -->
          <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-bounce-gentle">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>

          <!-- Text Animation -->
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-bold text-white tracking-tight animate-fade-in-up">
              Preparing Workspace
            </h2>
            <div class="flex items-center justify-center gap-1.5 h-6">
              <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-0"></div>
              <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: Boolean
})
</script>

<style scoped>
.animate-bounce-gentle {
  animation: bounce-gentle 3s infinite ease-in-out;
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(5%); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
