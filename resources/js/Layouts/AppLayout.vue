<template>
  <div id="app" class="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700">
    <WorkspaceLoader :show="isLoading" />
    <Toaster ref="toaster" />
    
    <!-- Navigation -->
    <nav class="sticky top-0 z-40 glass border-b border-slate-200/50">
      <div class="max-w-[1440px] mx-auto px-6">
        <div class="flex justify-between items-center h-20">
          <!-- Brand/Logo -->
          <div class="flex items-center space-x-3 group">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-standard">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <Link href="/" class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
              JSON-LD Manager
            </Link>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-1 lg:space-x-4 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/30">
            <Link
              href="/"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component === 'Dashboard' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Dashboard
            </Link>
            
            <Link
              href="/analytics"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Analytics/') 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Analytics
            </Link>

            <Link
              href="/sitemaps"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Sitemaps/') 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Sitemaps
            </Link>

            <Link
              href="/schemas"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Schemas/') 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Schemas
            </Link>

            <Link
              href="/campaigns"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Campaigns/') 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Campaigns
            </Link>

            <Link
              href="/keywords/trending"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Keywords/') 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'"
            >
              Keywords
            </Link>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <Link
              href="/schemas/create"
              class="hidden sm:flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Schema</span>
            </Link>
            
            <div class="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            
            <UserDropdown />
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-[1440px] mx-auto px-6 py-10">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-200/50 py-10 px-6">
      <div class="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-500 text-sm">© 2026 Admin Panel • JSON-LD Management System</p>
        <div class="flex items-center space-x-6">
          <a href="#" class="text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest">Documentation</a>
          <a href="#" class="text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest">Support</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'
import Toaster from '../Components/Toaster.vue'
import WorkspaceLoader from '../Components/WorkspaceLoader.vue'
import UserDropdown from '../Components/UserDropdown.vue'

const toaster = ref(null)
const isLoading = ref(false)
const page = usePage()

onMounted(() => {
  // Show loader only when visiting the dashboard and it's likely a fresh load/login
  // For simplicity, we show it on dashboard mount if not previously shown in session
  if (page.component === 'Dashboard' && !sessionStorage.getItem('workspace_loaded')) {
    isLoading.value = true
    setTimeout(() => {
      isLoading.value = false
      sessionStorage.setItem('workspace_loaded', 'true')
    }, 2000)
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

#app {
  font-family: 'Outfit', 'Inter', sans-serif;
}

.page-enter-active, .page-leave-active {
  transition: opacity 0.3s ease;
}
.page-enter-from, .page-leave-to {
  opacity: 0;
}
</style>