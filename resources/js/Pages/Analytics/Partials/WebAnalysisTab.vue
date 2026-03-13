<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import { useToastStore } from '@/stores/useToastStore'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  LineElement, PointElement, LinearScale, CategoryScale, Filler,
  BarElement, BarController
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController)

const props = defineProps({
    organization: Object,
    properties: Array,
    propertyId: [Number, String]
})

const toast = useToastStore()

// ─── State ────────────────────────────────────────────────────────────────────
const pixelSites          = ref([])
const selectedSiteId      = ref(null)
const showSiteDropdown    = ref(false)
const siteSearchQuery     = ref('')
const expandedLink        = ref(null)
const activeSection       = ref('seo') // seo | sitemaps | health

const webAnalysisResponse = ref({
    sitemaps: [],
    analysis_links: [],
    error_summary: {},
    schema_stats: {},
    trends: { labels: [], errors: [], injections: [] }
})
const isLoadingWebAnalysis = ref(false)
let refreshInterval = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const selectedSite = computed(() =>
    pixelSites.value.find(s => s.id === selectedSiteId.value)
)

const filteredSiteOptions = computed(() => {
    if (!siteSearchQuery.value) return pixelSites.value
    const q = siteSearchQuery.value.toLowerCase()
    return pixelSites.value.filter(s => s.label.toLowerCase().includes(q))
})

const siteStatusInfo = computed(() => {
    const site = selectedSite.value
    if (!site) return { label: 'All Sites', color: 'slate', pulse: false }
    const map = {
        verified_active:   { label: 'Live', color: 'emerald', pulse: true },
        connected_inactive:{ label: 'Inactive', color: 'amber', pulse: false },
    }
    return map[site.status] || { label: 'Unverified', color: 'rose', pulse: false }
})

// Derived health score (0–100) from available signals
const overallHealthScore = computed(() => {
    const links = webAnalysisResponse.value.analysis_links || []
    if (!links.length) return null
    const avg = links.reduce((sum, l) => sum + (l.seo_score || 0), 0) / links.length
    return Math.round(avg)
})

const healthColor = computed(() => {
    const s = overallHealthScore.value
    if (s === null) return { ring: '#e2e8f0', text: 'slate' }
    if (s >= 80) return { ring: '#10b981', text: 'emerald' }
    if (s >= 50) return { ring: '#f59e0b', text: 'amber' }
    return { ring: '#f43f5e', text: 'rose' }
})

// SVG ring params
const RING_R = 44
const RING_CIRC = computed(() => 2 * Math.PI * RING_R)
const ringDash = computed(() => {
    const s = overallHealthScore.value
    if (s === null) return RING_CIRC.value
    return RING_CIRC.value * (1 - s / 100)
})

const topBottleneckPages = computed(() => {
    return (webAnalysisResponse.value.analysis_links || [])
        .filter(l => l.seo_bottlenecks?.length)
        .slice(0, 5)
})

const schemaUpgradePages = computed(() => {
    return (webAnalysisResponse.value.analysis_links || [])
        .filter(l => l.schema_suggestions?.length)
        .slice(0, 5)
})

// ─── Chart Data ───────────────────────────────────────────────────────────────
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { display: false },
        y: { display: false }
    },
    elements: {
        point: { radius: 0 },
        line: { tension: 0.4 }
    }
}

const errorChartData = computed(() => ({
    labels: webAnalysisResponse.value.trends?.labels || [],
    datasets: [{
        label: 'Errors',
        data: webAnalysisResponse.value.trends?.errors || [],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        borderWidth: 2
    }]
}))

const injectionChartData = computed(() => ({
    labels: webAnalysisResponse.value.trends?.labels || [],
    datasets: [{
        label: 'Injections',
        data: webAnalysisResponse.value.trends?.trends_injections || webAnalysisResponse.value.trends?.injections || [],
        backgroundColor: '#10b981',
        borderRadius: 4
    }]
}))

// ─── API calls ────────────────────────────────────────────────────────────────
const fetchConnectionStatus = async () => {
    try {
        const r = await axios.get(route('google-ads.connection-status'))
        pixelSites.value = r.data.pixel_sites || []
        if (!selectedSiteId.value && pixelSites.value.length > 0) {
            selectedSiteId.value = pixelSites.value[0].id
        }
    } catch (e) { /* silent */ }
}

const fetchWebAnalysis = async (isManual = false) => {
    isLoadingWebAnalysis.value = true
    try {
        const { data } = await axios.get(route('google-ads.web-analysis'), {
            params: { pixel_site_id: selectedSiteId.value }
        })
        webAnalysisResponse.value = data
        if (isManual) {
            toast.add('Analysis data updated.', 'success')
        }
    } catch (e) {
        toast.add('Failed to fetch web analysis', 'error')
    } finally {
        isLoadingWebAnalysis.value = false
    }
}

const safeHostname = (url) => {
    if (!url) return ''
    try {
        const m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im)
        return m ? m[1] : url
    } catch { return url }
}

const safePath = (url) => {
    if (!url) return '/'
    try { return new URL(url).pathname } catch { return url }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    fetchConnectionStatus()
    fetchWebAnalysis()
    refreshInterval = setInterval(fetchWebAnalysis, 60000)
})

onUnmounted(() => clearInterval(refreshInterval))

watch(selectedSiteId, () => fetchWebAnalysis())
</script>

<template>
    <div class="pb-24 space-y-0">

        <!-- ─── Command Bar ─────────────────────────────────────────────── -->
        <div class="relative overflow-hidden rounded-[2.5rem] bg-slate-900 mb-10 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <!-- Ambient glow blobs -->
            <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <!-- Left: Title + meta -->
            <div class="relative">
                <!-- live pulse if verified -->
                <div class="flex items-center gap-3 mb-3">
                    <span class="w-2 h-2 rounded-full"
                        :class="siteStatusInfo.color === 'emerald' ? 'bg-emerald-400 animate-pulse' : siteStatusInfo.color === 'amber' ? 'bg-amber-400' : 'bg-slate-500'">
                    </span>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em]"
                        :class="siteStatusInfo.color === 'emerald' ? 'text-emerald-400' : siteStatusInfo.color === 'amber' ? 'text-amber-400' : 'text-slate-400'">
                        {{ siteStatusInfo.label }}
                    </span>
                </div>
                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight">Web Analysis</h1>
                <p class="text-slate-400 text-sm font-medium mt-1.5">Sitemap coverage · SEO intelligence · Schema health</p>
            </div>

            <!-- Right: Controls -->
            <div class="flex flex-wrap items-center gap-3 relative">
                <!-- Section Pills -->
                <div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
                    <button v-for="s in [{ id:'seo', label:'SEO Insights' }, { id:'sitemaps', label:'Sitemaps' }, { id:'health', label:'Health' }]"
                        :key="s.id"
                        @click="activeSection = s.id"
                        class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap"
                        :class="activeSection === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'">
                        {{ s.label }}
                    </button>
                </div>

                <!-- Site Switcher -->
                <div class="relative">
                    <button @click="showSiteDropdown = !showSiteDropdown"
                        class="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-white transition-all">
                        <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                        {{ selectedSite ? selectedSite.label : 'All Sites' }}
                        <svg class="w-2.5 h-2.5 opacity-60 transition-transform" :class="{ 'rotate-180': showSiteDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                    </button>

                    <div v-if="showSiteDropdown"
                        class="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div class="p-3 border-b border-white/5">
                            <input v-model="siteSearchQuery" placeholder="Search sites…"
                                class="w-full bg-white/5 border-none rounded-xl text-[11px] font-bold text-slate-200 placeholder-slate-500 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-white/20" />
                        </div>
                        <div class="max-h-60 overflow-y-auto p-1.5">
                            <button @click="selectedSiteId = null; showSiteDropdown = false"
                                class="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2.5">
                                <span class="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> All Sites
                            </button>
                            <button v-for="site in filteredSiteOptions" :key="site.id"
                                @click="selectedSiteId = site.id; showSiteDropdown = false; siteSearchQuery = ''"
                                class="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black hover:bg-white/10 transition-all flex items-center justify-between group"
                                :class="selectedSiteId === site.id ? 'text-white bg-white/5' : 'text-slate-400'">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-1.5 h-1.5 rounded-full"
                                        :class="site.status === 'verified_active' ? 'bg-emerald-400' : site.status === 'connected_inactive' ? 'bg-amber-400' : 'bg-slate-500'"></span>
                                    <span>{{ site.label }}</span>
                                </div>
                                <svg v-if="selectedSiteId === site.id" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Refresh -->
                <button @click="fetchWebAnalysis(true)"
                    class="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl transition-all text-white"
                    :class="{ 'opacity-50 cursor-not-allowed': isLoadingWebAnalysis }">
                    <svg class="w-4 h-4" :class="{ 'animate-spin': isLoadingWebAnalysis }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
            </div>
        </div>

        <!-- ─── Score + Stat Strip ────────────────────────────────────────── -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
            <!-- Health Ring -->
            <div class="md:col-span-1 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm gap-2 group hover:shadow-md transition-all">
                <div class="relative w-28 h-28">
                    <svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" :r="RING_R" fill="none" stroke="#f1f5f9" stroke-width="8"/>
                        <circle cx="50" cy="50" :r="RING_R" fill="none"
                            :stroke="healthColor.ring"
                            stroke-width="8"
                            stroke-linecap="round"
                            :stroke-dasharray="RING_CIRC"
                            :stroke-dashoffset="ringDash"
                            class="transition-all duration-700"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-2xl font-black tracking-tight leading-none"
                            :class="`text-${healthColor.text}-600`">
                            {{ overallHealthScore ?? '—' }}
                        </span>
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                    </div>
                </div>
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Avg SEO Health</p>
            </div>

            <!-- 4 Stat Cards -->
            <div v-for="stat in [
                { label: 'Sitemaps', value: webAnalysisResponse.sitemaps?.length || 0, color: 'indigo', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', sub: 'Indexed coverage' },
                { label: 'AI Injections', value: webAnalysisResponse.schema_stats?.total_injections || 0, color: 'emerald', icon: 'M13 10V3L4 14h7v7l9-11h-7z', sub: 'JSON-LD served' },
                { label: 'JS Events', value: webAnalysisResponse.error_summary?.total || 0, color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', sub: '7-day window' },
                { label: 'SEO Conflicts', value: webAnalysisResponse.schema_stats?.conflicts || 0, color: 'rose', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', sub: 'Duplicate schema' },
            ]" :key="stat.label"
                class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-5 opacity-40 group-hover:opacity-80 transition-all">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="`bg-${stat.color}-50`">
                        <svg class="w-5 h-5" :class="`text-${stat.color}-500`" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="stat.icon"/>
                        </svg>
                    </div>
                </div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ stat.label }}</p>
                <p class="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{{ stat.value }}</p>
                <p class="text-[10px] text-slate-400 font-medium">{{ stat.sub }}</p>
            </div>
        </div>

        <!-- ─── SECTION: SEO Insights ─────────────────────────────────────── -->
        <div v-show="activeSection === 'seo'" class="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <!-- SEO Page Table (2/3) -->
            <div class="xl:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <!-- Table header -->
                <div class="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <div class="flex items-center gap-3">
                        <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Page SEO Report</h3>
                    </div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {{ webAnalysisResponse.analysis_links?.length || 0 }} pages
                    </span>
                </div>

                <!-- Loading skeleton -->
                <div v-if="isLoadingWebAnalysis" class="p-8 space-y-4">
                    <div v-for="n in 5" :key="n" class="h-12 bg-slate-50 rounded-2xl animate-pulse"></div>
                </div>

                <!-- Empty state -->
                <div v-else-if="!webAnalysisResponse.analysis_links?.length" class="flex flex-col items-center justify-center py-24 px-8 text-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200">
                        <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    </div>
                    <p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">No Pages Crawled</p>
                    <p class="text-xs text-slate-400 font-medium max-w-xs">Crawl a sitemap to populate SEO intelligence and AI-driven growth suggestions.</p>
                </div>

                <!-- Data rows -->
                <div v-else class="overflow-y-auto max-h-[520px]">
                    <table class="w-full text-left">
                        <thead class="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
                            <tr>
                                <th class="py-3 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Page</th>
                                <th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Score</th>
                                <th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="link in webAnalysisResponse.analysis_links" :key="link.id"
                                @click="expandedLink = expandedLink === link.id ? null : link.id"
                                class="border-t border-slate-50 hover:bg-slate-50/60 transition-all cursor-pointer group">
                                <td class="py-4 px-8">
                                    <p class="text-xs font-black text-slate-800 leading-tight">{{ safePath(link.url) }}</p>
                                    <p class="text-[10px] text-slate-400 font-mono truncate max-w-[260px]">{{ safeHostname(link.url) }}</p>
                                    <!-- Expanded detail -->
                                    <div v-if="expandedLink === link.id" class="mt-3 space-y-2 animate-fade-in">
                                        <div v-if="link.seo_bottlenecks?.length">
                                            <p class="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Bottlenecks</p>
                                            <div class="flex flex-wrap gap-1.5">
                                                <span v-for="b in link.seo_bottlenecks" :key="b"
                                                    class="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black rounded-lg border border-rose-100">{{ b }}</span>
                                            </div>
                                        </div>
                                        <div v-if="link.schema_suggestions?.length">
                                            <p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 mt-2">Schema Upgrades</p>
                                            <div class="flex flex-wrap gap-1.5">
                                                <span v-for="s in link.schema_suggestions" :key="s"
                                                    class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100">{{ s }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-4 px-4 text-center">
                                    <div class="inline-flex items-center justify-center w-10 h-10 rounded-2xl border-2 font-black text-xs leading-none mx-auto transition-transform group-hover:scale-110"
                                        :class="link.seo_score >= 80 ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                                                link.seo_score >= 50 ? 'border-amber-400 bg-amber-50 text-amber-600' :
                                                'border-rose-400 bg-rose-50 text-rose-600'">
                                        {{ link.seo_score ?? '—' }}
                                    </div>
                                </td>
                                <td class="py-4 px-4 pr-8 text-right">
                                    <div class="flex items-center justify-end gap-1.5 flex-wrap">
                                        <span v-if="link.is_ad_ready" class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md uppercase border border-indigo-100">Ad Ready</span>
                                        <span v-if="link.seo_bottlenecks?.length" class="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-md uppercase border border-rose-100">
                                            {{ link.seo_bottlenecks.length }} Issues
                                        </span>
                                        <span v-if="link.schema_suggestions?.length" class="px-2 py-0.5 bg-blue-50 text-blue-500 text-[8px] font-black rounded-md uppercase border border-blue-100">
                                            Schema+
                                        </span>
                                        <svg class="w-3 h-3 text-slate-300 group-hover:text-slate-500 ml-1 flex-shrink-0 transition-all" :class="{ 'rotate-90': expandedLink === link.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right panels (1/3) -->
            <div class="space-y-5">
                <!-- Top Bottleneck pages -->
                <div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50">
                        <span class="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                        <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">Top Bottleneck Pages</h3>
                    </div>
                    <div class="p-5 space-y-3">
                        <div v-if="!topBottleneckPages.length" class="text-center py-8">
                            <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">No bottlenecks ✓</p>
                        </div>
                        <div v-for="(link, i) in topBottleneckPages" :key="link.id"
                            class="flex items-center gap-4 group">
                            <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 text-[10px] font-black">{{ i+1 }}</span>
                            <div class="flex-1 min-w-0">
                                <p class="text-[11px] font-black text-slate-800 truncate">{{ safePath(link.url) }}</p>
                                <div class="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
                                        :style="{ width: (100 - (link.seo_score || 0)) + '%' }">
                                    </div>
                                </div>
                            </div>
                            <span class="text-[10px] font-black text-rose-500 flex-shrink-0">{{ link.seo_bottlenecks?.length }} issues</span>
                        </div>
                    </div>
                </div>

                <!-- Schema Upgrade Opportunities -->
                <div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50">
                        <span class="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">Schema Opportunities</h3>
                    </div>
                    <div class="p-5 space-y-3">
                        <div v-if="!schemaUpgradePages.length" class="text-center py-8">
                            <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">All schemas optimal</p>
                        </div>
                        <div v-for="(link, i) in schemaUpgradePages" :key="link.id" class="flex items-center gap-4">
                            <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-[10px] font-black">{{ i+1 }}</span>
                            <div class="flex-1 min-w-0">
                                <p class="text-[11px] font-black text-slate-800 truncate">{{ safePath(link.url) }}</p>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                    <span v-for="s in (link.schema_suggestions || []).slice(0,2)" :key="s"
                                        class="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">{{ s }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── SECTION: Sitemaps ──────────────────────────────────────────── -->
        <div v-show="activeSection === 'sitemaps'" class="space-y-5">
            <div v-if="!webAnalysisResponse.sitemaps?.length" class="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200">
                    <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">No Sitemaps Configured</p>
                <p class="text-xs text-slate-400 max-w-xs">Add a sitemap in your site settings to start crawling and tracking index coverage.</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <div v-for="sitemap in webAnalysisResponse.sitemaps" :key="sitemap.id"
                    class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                    <div class="flex items-start justify-between mb-6">
                        <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter">
                            {{ sitemap.links_count || 0 }} URLs
                        </span>
                    </div>
                    <h4 class="text-sm font-black text-slate-900 mb-1">{{ sitemap.name }}</h4>
                    <p class="text-[10px] text-slate-400 font-mono truncate mb-4">{{ sitemap.site_url }}</p>
                    <div class="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Last crawled: {{ sitemap.last_generated_at || 'Never' }}
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── SECTION: Health ────────────────────────────────────────────── -->
        <div v-show="activeSection === 'health'" class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- Field Health Panel -->
            <div class="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-xl">
                <div class="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-[80px]"></div>
                <div class="flex items-center gap-3 mb-8">
                    <span class="w-1.5 h-6 bg-indigo-400 rounded-full"></span>
                    <h3 class="text-sm font-black uppercase tracking-tight">Field Health Signals</h3>
                </div>
                <div class="grid grid-cols-2 gap-4 relative">
                    <div v-for="item in [
                        { label: 'Unique Errors', value: webAnalysisResponse.error_summary?.unique_messages || 0, color: 'rose', chart: true },
                        { label: 'Affected URLs', value: webAnalysisResponse.error_summary?.unique_urls || 0, color: 'amber' },
                        { label: 'Total Events', value: webAnalysisResponse.error_summary?.total || 0, color: 'indigo' },
                        { label: 'JS Warnings', value: webAnalysisResponse.error_summary?.warnings || 0, color: 'slate' },
                    ]" :key="item.label"
                        class="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between overflow-hidden group">
                        <div>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ item.label }}</p>
                            <p class="text-3xl font-black leading-none">{{ item.value }}</p>
                        </div>
                        
                        <!-- Mini sparkline for errors -->
                        <div v-if="item.chart" class="h-8 mt-3 -mx-5 -mb-5 opacity-40 group-hover:opacity-100 transition-all">
                            <Line :data="errorChartData" :options="chartOptions" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Schema Stats Panel -->
            <div class="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm flex flex-col">
                <div class="flex items-center gap-3 mb-8">
                    <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Schema Performance</h3>
                </div>
                
                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-5">
                        <div v-for="item in [
                            { label: 'Total AI Injections', value: webAnalysisResponse.schema_stats?.total_injections || 0, max: 1000, color: 'emerald' },
                            { label: 'Active Schemas', value: webAnalysisResponse.schema_stats?.active || 0, max: 500, color: 'indigo' },
                            { label: 'Detected Conflicts', value: webAnalysisResponse.schema_stats?.conflicts || 0, max: 50, color: 'rose' },
                        ]" :key="item.label">
                            <div class="flex items-center justify-between mb-1.5">
                                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ item.label }}</p>
                                <p class="text-sm font-black text-slate-900">{{ item.value }}</p>
                            </div>
                            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-700"
                                    :class="`bg-${item.color}-500`"
                                    :style="{ width: Math.min(100, (item.value / item.max) * 100) + '%' }">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- injection bar chart -->
                    <div class="h-32 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">7D Injection Trend</p>
                        <div class="h-full pb-4">
                            <Bar :data="injectionChartData" :options="chartOptions" />
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3">
                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Schema Engine Running</p>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
</style>
