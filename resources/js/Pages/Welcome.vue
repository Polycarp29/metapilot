<template>
  <Head title="Welcome" />

  <div class="min-h-screen bg-[hsl(var(--color-background))] font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-10">
          <Link href="/" class="flex items-center gap-2 group">
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-standard">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-xl font-black tracking-tight text-slate-900">METAPILOT</span>
          </Link>

          <div class="hidden md:flex items-center gap-8">
            <a href="#solutions" class="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#features" class="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="/terms" class="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Enterprise</a>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <Link
            v-if="canLogin"
            :href="route('login')"
            class="hidden sm:block text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link
            v-if="canRegister"
            :href="route('register')"
            class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 transition-standard active:scale-95"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-40 pb-24 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 md:p-24 shadow-2xl">
          <!-- Background Orbs -->
          <div class="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div class="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s"></div>
          
          <div class="relative z-10 max-w-3xl">
            <span class="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold uppercase tracking-widest mb-8">
              The Next Gen SEO Engine
            </span>
            <h1 class="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.05]">
              Master Your Search <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Visibility</span> with AI
            </h1>
            <p class="text-xl text-slate-400 leading-relaxed mb-12 max-w-2xl">
              Metapilot automates structured data, monitors your technical SEO health, and provides AI-driven insights to dominate search results.
            </p>
            <div class="flex flex-wrap gap-6">
              <Link
                :href="route('register')"
                class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-standard shadow-xl shadow-blue-900/40 active:scale-95 flex items-center gap-3"
              >
                Get Started for Free
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#solutions"
                class="bg-white/5 hover:bg-white/10 text-white backdrop-blur-md px-10 py-5 rounded-2xl font-bold text-lg transition-standard border border-white/10 active:scale-95"
              >
                Explore Solutions
              </a>
            </div>
            
            <div class="mt-16 flex items-center gap-8 grayscale opacity-50 contrast-125">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Trusted by builders at</span>
              <div class="flex gap-8 items-center">
                <div class="w-24 h-6 bg-slate-700 rounded-md"></div>
                <div class="w-20 h-6 bg-slate-700 rounded-md"></div>
                <div class="w-28 h-6 bg-slate-700 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Solutions Section (Tabbed) -->
    <section id="solutions" class="py-24 px-6 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="text-center max-w-3xl mx-auto mb-20">
          <h2 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Innovative Solutions for Modern SEO</h2>
          <p class="text-lg text-slate-500 leading-relaxed">Everything you need to scale your organic presence without the manual grind.</p>
        </div>

        <!-- Tab Controls -->
        <div class="flex flex-wrap justify-center gap-2 mb-12">
          <button 
            v-for="(tab, index) in solutions" 
            :key="index"
            @click="activeTab = index"
            class="px-8 py-4 rounded-2xl font-bold transition-standard text-sm flex items-center gap-2 border-2"
            :class="activeTab === index 
              ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-lg shadow-blue-600/5' 
              : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            {{ tab.name }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="relative min-h-[500px]">
          <transition 
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <div :key="activeTab" class="grid lg:grid-cols-2 gap-12 items-center">
              <div class="space-y-8">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest">
                  <component :is="solutions[activeTab].icon" class="w-4 h-4" />
                  {{ solutions[activeTab].badge }}
                </div>
                <h3 class="text-4xl font-extrabold text-slate-900 leading-tight">
                  {{ solutions[activeTab].title }}
                </h3>
                <p class="text-xl text-slate-500 leading-relaxed">
                  {{ solutions[activeTab].description }}
                </p>
                <ul class="space-y-4">
                  <li v-for="feature in solutions[activeTab].features" :key="feature" class="flex items-center gap-3 text-slate-700 font-medium">
                    <div class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {{ feature }}
                  </li>
                </ul>
                <Link 
                  :href="route('register')"
                  class="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all"
                >
                  Start using this feature 
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7-7 7" /></svg>
                </Link>
              </div>

              <div class="relative group">
                <div class="absolute inset-0 bg-blue-600/10 rounded-[2.5rem] blur-3xl group-hover:bg-blue-600/20 transition-standard"></div>
                <div class="relative bg-slate-900 rounded-[2.5rem] p-8 aspect-square flex items-center justify-center overflow-hidden border border-slate-800 shadow-2xl">
                  <!-- Abstract Visualization -->
                  <div class="grid grid-cols-2 gap-4 w-full h-full opacity-40">
                    <div v-for="i in 4" :key="i" class="bg-blue-500/20 rounded-2xl animate-pulse" :style="{ animationDelay: `${i * 0.5}s` }"></div>
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <component :is="solutions[activeTab].icon" class="w-32 h-32 text-blue-500 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-50 py-20 border-t border-slate-200">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-12">
          <div class="col-span-2">
            <Link href="/" class="flex items-center gap-2 mb-8">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <span class="text-xl font-black text-slate-900 tracking-tight">METAPILOT</span>
            </Link>
            <p class="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Empowering digital teams with the most advanced SEO automation and analytics platform. Build for speed, optimized for search.
            </p>
            <div class="flex gap-4">
              <a href="#" class="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-standard"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
              <a href="#" class="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-standard"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.166.054 1.8.249 2.223.414.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.223.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.166-.249 1.8-.413 2.223-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.223.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.166-.054-1.8-.249-2.223-.414-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.223-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.166.249-1.8.414-2.223.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.223-.413 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.303.058-2.193.265-2.972.568-.806.313-1.488.733-2.169 1.413-.68.681-1.1 1.363-1.413 2.169-.304.779-.51 1.669-.569 2.972-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.059 1.303.265 2.193.569 2.972.313.806.733 1.488 1.413 2.169.681.68 1.363 1.1 2.169 1.413.779.304 1.669.51 2.972.569 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.303-.059 2.193-.265 2.972-.569.806-.313 1.488-.733 2.169-1.413.68-.681 1.1-1.363 1.413-2.169.304-.779.51-1.669.569-2.972.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.303-.265-2.193-.569-2.972-.313-.806-.733-1.488-1.413-2.169-.681-.68-1.363-1.1-2.169-1.413-.779-.304-1.669-.51-2.972-.569-1.28-.058-1.688-.072-4.947-.072z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
            </div>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 mb-6">Product</h4>
            <ul class="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="#solutions" class="hover:text-blue-600 transition-colors">Solutions</a></li>
              <li><a href="#" class="hover:text-blue-600 transition-colors">Pricing</a></li>
              <li><a href="#" class="hover:text-blue-600 transition-colors">Integrations</a></li>
              <li><a href="#" class="hover:text-blue-600 transition-colors">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 mb-6">Resources</h4>
            <ul class="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="/privacy" class="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" class="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="/cookies" class="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
              <li><a href="#" class="hover:text-blue-600 transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <p>© 2026 Metapilot SEO. All rights reserved.</p>
          <div class="flex gap-8">
            <span>Status: Healthy</span>
            <span>Region: Global</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Head, Link } from '@inertiajs/vue3'

defineProps({
  canLogin: Boolean,
  canRegister: Boolean,
  laravelVersion: String,
  phpVersion: String,
})

const activeTab = ref(0)

const Icons = {
  Code: defineAsyncComponent(() => import('./Icons/Code.vue')),
  Search: defineAsyncComponent(() => import('./Icons/Search.vue')),
  Cpu: defineAsyncComponent(() => import('./Icons/Cpu.vue')),
  Zap: defineAsyncComponent(() => import('./Icons/Zap.vue')),
}

const solutions = [
  {
    name: 'Automated JSON-LD',
    badge: 'Automation',
    icon: 'Code',
    title: 'Zero-Code Structured Data Implementation',
    description: 'Stop manually writing schema. Our crawler identifies content types and automatically generates perfectly valid JSON-LD for your entire site.',
    features: ['Auto-generation for 80+ types', 'Google Schema Validator sync', 'Real-time drift detection']
  },
  {
    name: 'Sitemap Monitoring',
    badge: 'Monitoring',
    icon: 'Search',
    title: 'Proactive Sitemap & Indexing Health',
    description: 'Monitor your sitemap in real-time. Get alerted before indexing issues affect your traffic or rankings.',
    features: ['Dynamic sitemap generation', 'Broken link identification', 'Coverage trend analysis']
  },
  {
    name: 'AI Strategy Insights',
    badge: 'Intelligence',
    icon: 'Cpu',
    title: 'Data-Driven Actionable SEO Strategy',
    description: 'Our AI analyzes your GA4 and GSC data to propose high-impact keywords and content optimizations tailored to your domain.',
    features: ['Keyword opportunity scoring', 'Competitor gap analysis', 'Automated campaign proposals']
  },
  {
    name: 'Keyword Analysis',
    badge: 'Research',
    icon: 'Zap',
    title: 'Lightning Fast Keyword Research',
    description: 'Discover what your audience is searching for with real-time trending data and comprehensive research tools.',
    features: ['Global search volume', 'Difficulty scoring', 'Trending topic identification']
  }
]
</script>

<style scoped>
.transition-standard {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
