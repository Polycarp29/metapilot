<template>
  <div class="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700">
    <!-- Simple Header -->
    <nav class="bg-white border-b border-slate-200/50 py-6">
      <div class="max-w-4xl mx-auto px-6 flex justify-between items-center">
        <Link href="/" class="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          MetaPilot
        </Link>
        <div v-if="$page.props.auth.user" class="flex items-center gap-4">
          <span class="text-sm font-medium text-slate-500">Hi, {{ $page.props.auth.user.name }}</span>
          <Link href="/dashboard" class="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Go to Dashboard</Link>
        </div>
        <Link v-else href="/login" class="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Sign In</Link>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-16 md:py-24">
      <div class="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-premium border border-slate-100">
        <div class="prose prose-slate prose-blue max-w-none">
          <slot />
        </div>
      </div>
    </main>

    <!-- Simple Footer -->
    <footer class="py-12 border-t border-slate-200/50 mt-12">
      <div class="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-500 text-sm">© 2026 MetaPilot • AI-Powered SEO Management</p>
        <div class="flex items-center space-x-6 text-sm">
          <Link href="/privacy" class="text-slate-400 hover:text-blue-600 font-medium transition-colors">Privacy</Link>
          <Link href="/terms" class="text-slate-400 hover:text-blue-600 font-medium transition-colors">Terms</Link>
          <Link href="/cookies" class="text-slate-400 hover:text-blue-600 font-medium transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Link } from '@inertiajs/vue3'
</script>

<style scoped>
@reference "tailwindcss";

.prose h1 { @apply text-4xl font-black text-slate-900 tracking-tight mb-8; }
.prose h2 { @apply text-2xl font-bold text-slate-900 tracking-tight mt-12 mb-4; }
.prose h3 { @apply text-lg font-bold text-slate-900 mb-2; }
.prose p { @apply text-slate-600 leading-relaxed mb-6; }
.prose ul { @apply list-disc list-inside text-slate-600 mb-6 space-y-2; }
.prose a { @apply text-blue-600 font-bold no-underline hover:underline; }
</style>
