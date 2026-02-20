<template>
  <AppLayout title="Dashboard">
    <div class="space-y-12">
      <!-- Welcome Hero -->
      <div class="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-2xl">
        <!-- Background Orbs -->
        <!-- <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px]"></div> -->
        
        <div class="relative z-10 max-w-3xl">
          <span class="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            {{ organizationName }} Overview
          </span>
          <h1 class="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            SEO Performance <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Command Center</span>
          </h1>
          <p class="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
            Monitor sitemap health, track search visibility, and ensure 100% structured data coverage across your digital properties.
          </p>
          <div class="flex flex-wrap gap-4">
            <Link
              href="/schemas/create"
              class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Quick Create
            </Link>
            <Link
              href="/analytics"
              class="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold transition-standard border border-white/10 active:scale-95"
            >
              Analytics Deep Dive
            </Link>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-standard">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEO Coverage</span>
          </div>
          <div>
            <div class="flex items-end gap-2 mb-1">
              <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ stats.seoCoverage }}%</p>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-blue-600 h-full transition-all duration-1000" :style="{ width: `${stats.seoCoverage}%` }"></div>
            </div>
            <p class="text-slate-400 text-xs mt-2 font-medium">{{ stats.totalLinks }} pages monitored</p>
          </div>
        </div>

        <div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-standard">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">30D Impressions</span>
          </div>
          <div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter mb-1">{{ formatNumber(stats.totalImpressions) }}</p>
            <p class="text-slate-500 text-xs font-medium">Search Visibility</p>
          </div>
        </div>

        <div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-standard">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">30D Clicks</span>
          </div>
          <div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter mb-1">{{ formatNumber(stats.totalClicks) }}</p>
            <p class="text-slate-500 text-xs font-medium">Organic Growth</p>
          </div>
        </div>

        <div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-standard">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Managed Schemas</span>
          </div>
          <div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter mb-1">{{ stats.totalSchemas }}</p>
            <p class="text-slate-500 text-xs font-medium">Configured Items</p>
          </div>
        </div>
      </div>

      <!-- Main Activity Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Recent Schemas -->
        <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-10">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Active Configurations</h2>
            <Link href="/schemas" class="text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors">View All</Link>
          </div>

          <div class="space-y-4">
            <div v-for="schema in recentSchemas" :key="schema.id" class="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <p class="font-bold text-slate-900 text-sm">{{ schema.name }}</p>
                  <p class="text-xs text-slate-500">{{ schema.schema_type.name }} • Updated {{ formatDate(schema.updated_at) }}</p>
                </div>
              </div>
              <Link :href="`/schemas/${schema.id}/edit`" class="text-slate-300 hover:text-blue-600 p-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div v-if="recentSchemas.length === 0" class="py-12 text-center text-slate-400 text-sm italic">
              No schemas configured yet.
            </div>
          </div>
        </div>

        <!-- Right: AI Strategic Insights & Sitemap Health -->
        <div class="space-y-8">
          <!-- AI Insights -->
          <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-6 opacity-10">
              <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-6">
                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <span class="text-xs font-bold uppercase tracking-widest text-blue-400">AI Strategy</span>
              </div>
              
              <div v-if="recentInsights.length > 0" class="space-y-6">
                <div v-for="insight in recentInsights" :key="insight.id" class="space-y-2">
                  <h4 class="font-bold text-sm text-slate-100">{{ insight.title }}</h4>
                  <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 italic">"{{ insight.body }}"</p>
                </div>
                <Link href="/analytics" class="inline-block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors mt-2">Explore Full Analysis →</Link>
              </div>
              <div v-else class="space-y-4">
                <p class="text-sm text-slate-400 leading-relaxed italic">"Gathering data to formulate your customized SEO strategy. Connect GA4 & GSC to unlock AI insights."</p>
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-full w-1/3 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sitemap Health -->
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-slate-900">Sitemap Health</h3>
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            </div>
            
            <div class="space-y-6">
              <div v-for="sitemap in sitemaps" :key="sitemap.id" class="space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-700 truncate max-w-[150px]">{{ sitemap.name }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full font-bold uppercase"
                    :class="{
                      'bg-emerald-50 text-emerald-600': sitemap.last_crawl_status === 'completed',
                      'bg-amber-50 text-amber-600': sitemap.last_crawl_status === 'running' || sitemap.last_crawl_status === 'queued',
                      'bg-slate-50 text-slate-400': !sitemap.last_crawl_status
                    }"
                  >
                    {{ sitemap.last_crawl_status || 'Pending' }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-3 bg-slate-50 rounded-xl">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Links</p>
                    <p class="font-bold text-slate-900">{{ sitemap.links_count }}</p>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl">
                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Scan</p>
                    <p class="font-bold text-slate-900">{{ sitemap.last_generated_at ? formatDate(sitemap.last_generated_at) : 'N/A' }}</p>
                  </div>
                </div>
              </div>
              <div v-if="sitemaps.length === 0" class="py-4 text-center text-xs text-slate-400 italic">
                No active sitemaps configured.
              </div>
              <Link href="/sitemaps" class="block w-full text-center py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors">
                Manage Monitoring
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../Layouts/AppLayout.vue'

defineProps({
  stats: Object,
  recentSchemas: Array,
  sitemaps: Array,
  recentInsights: Array,
  organizationName: String
})

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date)
}
</script>