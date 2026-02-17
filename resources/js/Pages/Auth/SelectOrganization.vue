<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden font-sans py-12">
    <!-- Background Accents -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

    <div class="relative z-10 w-full max-w-2xl mx-auto px-6">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Select Workspace</h1>
        <p class="text-slate-500 font-medium">Which workspace would you like to access today?</p>
      </div>

      <!-- Organizations Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          v-for="org in organizations"
          :key="org.id"
          @click="select(org.id)"
          class="glass p-6 rounded-3xl shadow-premium border border-white/40 cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ org.name }}</h3>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">{{ org.pivot.role }}</p>
            </div>
          </div>
          <p class="text-sm text-slate-500 line-clamp-2 mb-4">{{ org.description || 'No description available' }}</p>
          <div class="flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Enter Workspace
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center mt-12 text-sm font-medium text-slate-500">
        Need to join another organization?
        <a href="#" class="text-primary hover:text-primary-hover font-bold transition-all">Contact your administrator</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { router } from '@inertiajs/vue3';

defineProps({
  organizations: Array,
});

function select(id) {
  router.post(route('organizations.select.store'), {
    organization_id: id
  });
}
</script>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
</style>
