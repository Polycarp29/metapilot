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

          <div
            class="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/30">
            <Link href="/" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component === 'Dashboard'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Dashboard
            </Link>

            <Link href="/analytics" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component.startsWith('Analytics/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              Analytics
            </Link>

            <Link href="/sitemaps" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component.startsWith('Sitemaps/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-10.5v.008m0 2.242v.008m0 2.242v.008m0 2.242v.008m0 2.242v.008m0 2.242v.008M12 3v18m-4.5-9H21m-16.5 0H3" />
              </svg>
              Sitemaps
            </Link>

            <Link href="/schemas" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component.startsWith('Schemas/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              Schemas
            </Link>

            <Link href="/campaigns" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component.startsWith('Campaigns/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a13.247 13.247 0 0 1-1.022-2.89m2.684-1.331A13.13 13.13 0 0 1 12 12c0-1.847.383-3.593 1.076-5.18m-3.416 9.02c.254-.962.584-1.892.985-2.783m-2.684 1.331c-.139-.244-.265-.494-.378-.75M12 12a13.13 13.13 0 0 1-1.076-5.18m3.416 9.02c.254-.962.584-1.892.985-2.783M12 12c0-1.847.383-3.593 1.076-5.18m-3.416 9.02c.254-.962.584-1.892.985-2.783" />
              </svg>
              Campaigns
            </Link>

            <Link href="/keywords/trending" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard"
              :class="$page.component.startsWith('Keywords/')
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Keywords
            </Link>

            <Link href="/content" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-standard" :class="$page.component.startsWith('Content/')
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              Content
            </Link>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <div class="relative group hidden sm:flex">
              <Link href="/pique"
                class="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
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