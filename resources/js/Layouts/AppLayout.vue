<template>
  <div id="app" class="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700">

    <Head :title="title" />
    <WorkspaceLoader :show="isLoading" />
    <Toaster ref="toaster" />

    <!-- Navigation -->
    <nav class="sticky top-0 z-40 glass border-b border-slate-200/50">
      <div class="max-w-[1440px] mx-auto px-6">
        <div class="flex justify-between items-center h-20">
          <!-- Brand/Logo -->
          <BrandLogo></BrandLogo>

          <!-- Navigation Links -->
          <div
            class="hidden md:flex items-center space-x-1 lg:space-x-4 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/30">
            <Link href="/" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component === 'Dashboard'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Dashboard
            </Link>

            <Link href="/analytics" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component.startsWith('Analytics/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Analytics
            </Link>

            <Link href="/sitemaps" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component.startsWith('Sitemaps/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Sitemaps
            </Link>

            <Link href="/schemas" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component.startsWith('Schemas/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Schemas
            </Link>

            <Link href="/campaigns" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component.startsWith('Campaigns/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Campaigns
            </Link>

            <Link href="/keywords/trending" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard"
              :class="$page.component.startsWith('Keywords/')
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Keywords
            </Link>

            <Link href="/content" class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard" :class="$page.component.startsWith('Content/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              Content
            </Link>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <div class="relative group hidden sm:flex">
              <Link
                class="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95">

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>

                <span>Pique</span>
              </Link>

              <!-- Tooltip -->
              <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap
              bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md
              opacity-0 group-hover:opacity-100 transition duration-200
              shadow-lg">
                Speak to Pique — your AI SEO specialist
              </div>
            </div>

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
        <p class="text-slate-500 text-sm font-medium">© 2026 {{ $page.props.branding?.site_name || 'MetaPilot' }} •
          AI-Powered SEO Management</p>
        <div class="flex items-center space-x-6">
          <Link :href="route('privacy')"
            class="text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest">
            Privacy</Link>
          <Link :href="route('terms')"
            class="text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest">
            Terms</Link>
          <Link :href="route('cookies')"
            class="text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest">
            Cookies</Link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Link, usePage, Head } from '@inertiajs/vue3'
import Toaster from '../Components/Toaster.vue'
import WorkspaceLoader from '../Components/WorkspaceLoader.vue'
import UserDropdown from '../Components/UserDropdown.vue'
import BrandLogo from '../Components/BrandLogo.vue'

const props = defineProps({
  title: String,
})


// const props = definrPros({
//   logo : String
// });

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

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>