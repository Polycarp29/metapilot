<template>
  <Head>
    <title>Metapilot | Next-Gen AI SEO Automation & Structured Data</title>
    <meta name="description" content="Metapilot is the most advanced AI SEO platform. Automate JSON-LD structured data, monitor sitemaps, and get AI-driven insights to dominate search engine results." />
    <meta property="og:title" content="Metapilot | AI-Powered SEO Automation" />
    <meta property="og:description" content="Automate your technical SEO with Metapilot. Structured data, sitemaps, and intelligence insights driven by AI." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="/" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Metapilot",
        "operatingSystem": "Web",
        "applicationCategory": "SEO Software",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Metapilot is an AI-powered SEO automation platform that handles structured data, sitemaps, and technical SEO health."
      }
    </script>
  </Head>

  <div class="min-h-screen bg-[hsl(var(--color-background))] font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
    <!-- Navigation -->
    <nav 
      class="fixed top-0 w-full z-50 transition-all duration-500 border-b"
      :class="[scrolled ? 'bg-white/90 backdrop-blur-xl border-slate-200/60 py-4 shadow-lg shadow-slate-900/5' : 'bg-transparent border-transparent py-6']"
    >
      <div class="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <BrandLogo />

          <div class="hidden lg:flex items-center gap-10">
            <a href="#solutions" class="text-sm font-bold text-slate-500 hover:text-blue-600 transition-all duration-300">Solutions</a>
            <a href="#features" class="text-sm font-bold text-slate-500 hover:text-blue-600 transition-all duration-300">Features</a>
            <a href="/terms" class="text-sm font-bold text-slate-500 hover:text-blue-600 transition-all duration-300">Enterprise</a>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <Link
            v-if="canLogin"
            :href="route('login')"
            class="hidden sm:block text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            v-if="canRegister"
            :href="route('register')"
            class="bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl text-sm font-bold shadow-2xl shadow-slate-900/10 transition-all duration-300 active:scale-95 hover:shadow-slate-900/20"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-48 pb-32 px-6 overflow-hidden">
      <!-- Ambient Background -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[160px] animate-blob"></div>
        <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[140px] animate-blob animation-delay-2000"></div>
      </div>

      <div class="max-w-7xl mx-auto relative z-10">
        <div class="grid lg:grid-cols-12 gap-16 items-center">
          <div class="lg:col-span-7 space-y-10">
            <div class="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 text-xs font-black uppercase tracking-[0.2em] animate-fade-in">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              v2.0: The AI SEO Evolution
            </div>
            
            <h1 class="text-6xl lg:text-[5.5rem] font-black text-slate-900 tracking-tight leading-[0.95] animate-slide-up">
              Own the First Page with <span class="bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-500">Autonomous</span> SEO.
            </h1>
            
            <p class="text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl animate-slide-up animation-delay-300">
              Metapilot automates complex technical SEO, structured data, and content intelligence so you can focus on scale, not maintenance.
            </p>

            <div class="flex flex-wrap gap-6 animate-slide-up animation-delay-500">
              <Link
                :href="route('register')"
                class="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-[2rem] font-black text-xl transition-all duration-300 shadow-2xl shadow-blue-500/30 active:scale-95 flex items-center gap-4"
              >
                Launch Your Campaign
                <svg class="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#solutions"
                class="glass hover:bg-white text-slate-700 px-10 py-6 rounded-[2rem] font-bold text-xl transition-all duration-300 border-slate-200 border-2 active:scale-95"
              >
                See it in Action
              </a>
            </div>

            <div class="pt-12 flex flex-col gap-6 animate-fade-in animation-delay-700">
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Integrated with the ecosystems you trust</p>
              <div class="flex flex-wrap gap-10 items-center grayscale opacity-60">
                <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
                <div class="h-8 w-28 bg-slate-200 rounded-lg"></div>
                <div class="h-8 w-20 bg-slate-200 rounded-lg"></div>
                <div class="h-8 w-32 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 relative animate-float">
            <div class="relative bg-slate-900 rounded-[3.5rem] p-4 shadow-4xl aspect-[4/5] overflow-hidden border-[12px] border-slate-800/50 group">
              <div class="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent z-10 pointer-events-none"></div>
              <div class="relative h-full w-full rounded-[2.5rem] bg-slate-950 p-8 flex flex-col justify-between overflow-hidden shadow-inner">
                <div class="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/0 transition-colors duration-500"></div>
                <img 
                  src="/images/dashboard-mockup.png" 
                  alt="Metapilot Analytics Dashboard"
                  class="w-full h-auto rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-700 z-10"
                />
                
                <!-- Floating Badge remains as a dynamic element -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
                <div class="self-end bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 space-y-2 animate-bounce-slow z-20 mt-4">
                   <div class="text-3xl font-black text-white tracking-tighter cursor-default">98.2</div>
                   <div class="text-[10px] font-black text-blue-200 uppercase tracking-widest">Visibility Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Solutions Section -->
    <section id="solutions" class="py-32 px-6 bg-white overflow-hidden relative">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-24 items-end mb-20">
          <div class="space-y-6">
            <h2 class="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              One Platform. <br/>Infinite <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Organic Growth</span>.
            </h2>
            <p class="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
              We've automated the tedious parts of SEO so you can focus on building products people love.
            </p>
          </div>
        </div>

        <!-- Solutions Grid -->
        <div class="grid md:grid-cols-2 gap-10">
          <div 
            v-for="(sol, idx) in solutions" 
            :key="idx"
            class="group p-1 bg-slate-50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-indigo-600 rounded-[3rem] transition-all duration-500 cursor-default"
          >
            <div class="bg-white p-12 rounded-[2.8rem] h-full flex flex-col justify-between items-start space-y-8 group-hover:bg-white/95 transition-colors">
              <div class="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <component :is="Icons[sol.icon]" class="w-8 h-8" />
              </div>
              <div class="space-y-4">
                <h3 class="text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{{ sol.name }}</h3>
                <p class="text-slate-500 font-medium leading-relaxed text-lg">{{ sol.description }}</p>
              </div>
              <ul class="space-y-3 w-full">
                <li v-for="feat in sol.features" :key="feat" class="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <div class="w-5 h-5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {{ feat }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-950 py-32 text-slate-400 relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px]"></div>
      
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid md:grid-cols-12 gap-16 mb-24">
          <div class="md:col-span-5 space-y-8">
             <BrandLogo />
            <p class="text-xl leading-relaxed font-medium">
              Join the new era of search. We're building the infrastructure that powers the most visible sites on the internet.
            </p>
            <div class="flex gap-4">
              <a href="#" class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300">X</a>
              <a href="#" class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300">In</a>
            </div>
          </div>
          
          <div class="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div class="space-y-6">
              <h4 class="text-white font-black uppercase tracking-widest text-xs">Product</h4>
              <ul class="space-y-4 text-sm font-bold">
                <li><a href="#" class="hover:text-blue-500 transition-colors">Solutions</a></li>
                <li><a href="#" class="hover:text-blue-500 transition-colors">Pricing</a></li>
                <li><a href="#" class="hover:text-blue-500 transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div class="space-y-6">
              <h4 class="text-white font-black uppercase tracking-widest text-xs">Company</h4>
              <ul class="space-y-4 text-sm font-bold">
                <li><a href="#" class="hover:text-blue-500 transition-colors">About Us</a></li>
                <li><a href="#" class="hover:text-blue-500 transition-colors">Blog</a></li>
                <li><a href="#" class="hover:text-blue-500 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div class="space-y-6">
              <h4 class="text-white font-black uppercase tracking-widest text-xs">Legal</h4>
              <ul class="space-y-4 text-sm font-bold">
                <li><a href="/privacy" class="hover:text-blue-500 transition-colors">Privacy</a></li>
                <li><a href="/terms" class="hover:text-blue-500 transition-colors">Terms</a></li>
                <li><a href="/cookies" class="hover:text-blue-500 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
          <p>© 2026 Metapilot. Built for the future of search.</p>
          <div class="flex gap-10">
             <span>System Status: <span class="text-emerald-500">Operational</span></span>
             <span>Network: Global Edge</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { Head, Link } from '@inertiajs/vue3'
import BrandLogo from '@/Components/BrandLogo.vue'

defineProps({
  canLogin: Boolean,
  canRegister: Boolean,
})

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const Icons = {
  Code: defineAsyncComponent(() => import('./Icons/Code.vue')),
  Search: defineAsyncComponent(() => import('./Icons/Search.vue')),
  Cpu: defineAsyncComponent(() => import('./Icons/Cpu.vue')),
  Zap: defineAsyncComponent(() => import('./Icons/Zap.vue')),
}

const solutions = [
  {
    name: 'Autonomous JSON-LD',
    icon: 'Code',
    description: 'Stop manually writing schema. Our AI identifies content types and automatically generates perfectly valid JSON-LD for your entire site.',
    features: ['Auto-generation for 80+ types', 'Real-time drift detection', 'Validator sync']
  },
  {
    name: 'Sitemap Intelligence',
    icon: 'Search',
    description: 'Monitor your sitemap in real-time. Get active alerts before indexing issues affect your traffic or rankings.',
    features: ['Dynamic generation', 'Broken link identification', 'Coverage trend analysis']
  },
  {
    name: 'AI Strategy Engine',
    icon: 'Cpu',
    description: 'Our AI analyzes your search console data to propose high-impact keywords and content optimizations.',
    features: ['Keyword opportunity scoring', 'Competitor gap analysis', 'Campaign proposals']
  },
  {
    name: 'Real-time Keyword Lab',
    icon: 'Zap',
    description: 'Discover what your audience is searching for with real-time trending data and comprehensive research tools.',
    features: ['Global search volume', 'Difficulty scoring', 'Trending topic ID']
  }
]
</script>

<style>
@keyframes blob {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 1s ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-bounce-slow {
  animation: bounce-slow 4s ease-in-out infinite;
}

.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-300 { animation-delay: 0.3s; }
.animation-delay-500 { animation-delay: 0.5s; }
.animation-delay-700 { animation-delay: 0.7s; }

.shadow-4xl {
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25);
}
</style>
