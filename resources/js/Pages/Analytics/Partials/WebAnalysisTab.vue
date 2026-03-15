<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Link } from '@inertiajs/vue3'
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
const selectedSiteId      = ref(localStorage.getItem('mp_selected_site_id') ? parseInt(localStorage.getItem('mp_selected_site_id')) : null)
const showSiteDropdown    = ref(false)
const siteSearchQuery     = ref('')
const expandedLink        = ref(null)
const activeSection       = ref(localStorage.getItem('mp_active_section') || 'seo') // seo | sitemaps | health

const webAnalysisResponse = ref({
    sitemaps: [],
    analysis_links: [],
    error_summary: {},
    schema_stats: {},
    trends: { labels: [], errors: [], injections: [] },
    pagination: { current_page: 1, last_page: 1, total: 0 },
    sitemaps_pagination: { current_page: 1, last_page: 1, total: 0 }
})

const schemaDebugResponse = ref({
    schemas: [],
    pagination: { current_page: 1, last_page: 1, total: 0 }
})

const discoveredPagesResponse = ref({
    pages: [],
    pagination: { current_page: 1, last_page: 1, total: 0 }
})
const isLoadingWebAnalysis = ref(false)
const isExportingPdf       = ref(false)
const showSeoModal         = ref(false)
const selectedSeoLink      = ref(null)
const isValidatingLink     = ref(false)
const searchQuery          = ref('')
const searchInput          = ref('')
const currentPage = ref(1)
const sitemapsPage = ref(1)
const discoveredPage = ref(1)
const schemaDebugPage = ref(1)
const filterStatus         = ref('all') // all | ad_ready | has_issues
const minSeoScore          = ref(0)
const filterSitemapId      = ref('all')

// Terminal Modals
const showTerminalModal    = ref(false)
const terminalLogs         = ref([])
const isLoadingLogs        = ref(false)

const showSchemaTerminal   = ref(false)
const schemaTerminalLogs   = ref([])
const isLoadingSchemaLogs  = ref(false)

let refreshInterval = null

// Schema debug
const schemaDebugItems   = ref([])
const isLoadingSchemaDbg = ref(false)
const expandedSchema     = ref(null)

// CDN Discovery
const cdnDiscovery = ref({
    enabled: false,
    loading: false,
    sitemap_id: null,
    discovered_count: 0,
    pixel_domain: null,
    errorMsg: null,
})
const discoveredPages    = ref([])
const isLoadingDiscovered = ref(false)
const totalDiscovered     = ref(0)

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

const fetchWebAnalysis = async () => {
    isLoadingWebAnalysis.value = true
    try {
        const { data } = await axios.get(route('google-ads.web-analysis'), {
            params: { 
                pixel_site_id: selectedSiteId.value,
                search: searchQuery.value,
                page: currentPage.value,
                sitemaps_page: sitemapsPage.value,
                status: filterStatus.value !== 'all' ? filterStatus.value : null,
                min_score: minSeoScore.value > 0 ? minSeoScore.value : null,
                sitemap_id: filterSitemapId.value !== 'all' ? filterSitemapId.value : null
            }
        })
        webAnalysisResponse.value = data
    } catch (e) {
        console.error("Web analysis fetch failed", e)
    } finally {
        isLoadingWebAnalysis.value = false
    }
}

const handleSearch = () => {
    searchQuery.value = searchInput.value
    currentPage.value = 1
    fetchWebAnalysis()
}

const goToPage = (page) => {
    currentPage.value = page
    fetchWebAnalysis()
}

const goToSitemapsPage = (page) => {
    sitemapsPage.value = page
    fetchWebAnalysis()
}

const goToDiscoveredPage = (page) => {
    discoveredPage.value = page
    fetchDiscoveredPages()
}

const goToSchemaDebugPage = (page) => {
    schemaDebugPage.value = page
    fetchSchemaDebug()
}

const openTerminal = async () => {
    showTerminalModal.value = true
    isLoadingLogs.value = true
    try {
        const { data } = await axios.get(route('google-ads.pixel-events'), {
            params: { pixel_site_id: selectedSiteId.value, per_page: 50 }
        })
        terminalLogs.value = data.data || []
    } catch (e) {
        toast.add('Failed to fetch event logs', 'error')
    } finally {
        isLoadingLogs.value = false
    }
}

const openSchemaTerminal = async () => {
    showSchemaTerminal.value = true
    isLoadingSchemaLogs.value = true
    try {
        const { data } = await axios.get(route('google-ads.schema-debug'), {
            params: { pixel_site_id: selectedSiteId.value }
        })
        schemaTerminalLogs.value = data || []
    } catch (e) {
        toast.add('Failed to fetch schema logs', 'error')
    } finally {
        isLoadingSchemaLogs.value = false
    }
}

const downloadPdfReport = () => {
    isExportingPdf.value = true
    try {
        const url = route('google-ads.web-analysis.pdf', { pixel_site_id: selectedSiteId.value || '' })
        window.open(url, '_blank')
        toast.add('Generating PDF report...', 'success')
    } catch (e) {
        toast.add('Failed to start PDF export', 'error')
    } finally {
        setTimeout(() => { isExportingPdf.value = false }, 2000)
    }
}

const openSeoDetails = (link) => {
    selectedSeoLink.value = link
    showSeoModal.value = true
}

const revalidateLink = async (link) => {
    if (isValidatingLink.value) return
    isValidatingLink.value = true
    try {
        const { data } = await axios.post(route('sitemaps.links.manual-analyze', { link: link.id }))
        if (data.success) {
            toast.add('Page re-validated successfully.', 'success')
            // Update the local link data if found in our main list
            const idx = webAnalysisResponse.value.analysis_links.findIndex(l => l.id === link.id)
            if (idx !== -1) {
                webAnalysisResponse.value.analysis_links[idx] = { 
                    ...webAnalysisResponse.value.analysis_links[idx], 
                    ...data.link,
                    seo_score: data.link.seo_audit?.score ?? data.link.seo_score 
                }
                selectedSeoLink.value = webAnalysisResponse.value.analysis_links[idx]
            }
        }
    } catch (e) {
        toast.add(e.response?.data?.message || 'Failed to re-validate page', 'error')
    } finally {
        isValidatingLink.value = false
    }
}

const fetchSchemaDebug = async () => {
    isLoadingSchemaDbg.value = true
    try {
        const { data } = await axios.get(route('google-ads.schema-debug'), {
            params: { 
                pixel_site_id: selectedSiteId.value,
                page: schemaDebugPage.value
            }
        })
        schemaDebugResponse.value = data
    } catch (e) { /* silent */ } finally {
        isLoadingSchemaDbg.value = false
    }
}

// Helper: is CDN pixel connected for the selected site?
const cdnConnected = computed(() => {
    const site = selectedSite.value
    return site && (site.status === 'verified_active' || site.status === 'connected_inactive')
})

const enableCdnDiscovery = async () => {
    cdnDiscovery.value.loading = true
    cdnDiscovery.value.errorMsg = null
    try {
        const { data } = await axios.post(route('google-ads.enable-cdn-discovery'), {
            pixel_site_id: selectedSiteId.value || null
        })
        cdnDiscovery.value.enabled        = true
        cdnDiscovery.value.sitemap_id     = data.sitemap_id
        cdnDiscovery.value.discovered_count = data.discovered_count
        cdnDiscovery.value.pixel_domain   = data.pixel_domain
        toast.add('CDN Silent Discovery activated! Pages will appear as users visit them.', 'success')
        fetchDiscoveredPages()
        fetchWebAnalysis()
    } catch (e) {
        const msg = e.response?.data?.error || 'Failed to enable CDN discovery'
        cdnDiscovery.value.errorMsg = msg
        toast.add(msg, 'error')
    } finally {
        cdnDiscovery.value.loading = false
    }
}

const fetchDiscoveredPages = async () => {
    isLoadingDiscovered.value = true
    try {
        const { data } = await axios.get(route('google-ads.discovered-pages'), {
            params: { 
                pixel_site_id: selectedSiteId.value,
                page: discoveredPage.value
            }
        })
        discoveredPagesResponse.value = data
        if (data.sitemap_id) {
            cdnDiscovery.value.sitemap_id = data.sitemap_id
            cdnDiscovery.value.enabled    = data.crawl_mode === 'cdn'
            cdnDiscovery.value.discovered_count = data.total
        }
    } catch (e) { /* silent */ } finally {
        isLoadingDiscovered.value = false
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
    fetchSchemaDebug()
    fetchDiscoveredPages()
    refreshInterval = setInterval(fetchWebAnalysis, 15000)
})

onUnmounted(() => clearInterval(refreshInterval))

watch(selectedSiteId, (val) => {
    if (val) localStorage.setItem('mp_selected_site_id', val)
    else localStorage.removeItem('mp_selected_site_id')
    fetchWebAnalysis()
})

watch(activeSection, (val) => {
    localStorage.setItem('mp_active_section', val)
})
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

                <div class="flex items-center gap-2 mr-1">
                    <button @click="downloadPdfReport"
                        :disabled="isExportingPdf"
                        class="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-white transition-all">
                        <svg v-if="isExportingPdf" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V19a2 2 0 00-2-2z"/></svg>
                        Export PDF
                    </button>

                    <button @click="fetchWebAnalysis(true)"
                        class="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl transition-all text-white shadow-sm"
                        :class="{ 'opacity-50 cursor-not-allowed': isLoadingWebAnalysis }">
                        <svg class="w-4 h-4" :class="{ 'animate-spin': isLoadingWebAnalysis }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                </div>
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
                { label: 'Sitemaps', value: webAnalysisResponse.sitemaps?.length || 0, color: 'indigo', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', sub: 'Indexed coverage', action: null },
                { label: 'AI Injections', value: webAnalysisResponse.schema_stats?.total_injections || 0, color: 'emerald', icon: 'M13 10V3L4 14h7v7l9-11h-7z', sub: 'JSON-LD served', action: openSchemaTerminal },
                { label: 'JS Events', value: webAnalysisResponse.error_summary?.total || 0, color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', sub: '7-day window', action: openTerminal },
                { label: 'SEO Conflicts', value: webAnalysisResponse.schema_stats?.conflicts || 0, color: 'rose', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', sub: 'Duplicate schema', action: null },
            ]" :key="stat.label"
                @click="stat.action ? stat.action() : null"
                class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                :class="{ 'cursor-pointer hover:border-amber-200': stat.action }">
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
                <div class="flex flex-col md:flex-row items-center justify-between px-8 py-6 border-b border-slate-50 gap-4">
                    <div class="flex items-center gap-3">
                        <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Page SEO Report</h3>
                    </div>
                    
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <div class="relative flex-1 md:w-64">
                            <input v-model="searchInput" @keyup.enter="handleSearch" placeholder="Search by URL or Title..." 
                                class="w-full bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-xl text-[11px] font-bold text-slate-800 py-2.5 px-4 pr-10" />
                            <button @click="handleSearch" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            </button>
                        </div>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {{ webAnalysisResponse.pagination?.total || 0 }} pages
                        </span>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="px-8 py-4 bg-slate-50/50 border-b border-slate-50 flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                        <select v-model="filterStatus" @change="fetchWebAnalysis()"
                            class="bg-white border-slate-200 rounded-lg text-[10px] font-bold py-1 px-3 focus:ring-0">
                            <option value="all">All Pages</option>
                            <option value="ad_ready">Ad Ready</option>
                            <option value="has_issues">Has Issues</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Score:</span>
                        <input type="number" v-model.number="minSeoScore" @input="fetchWebAnalysis()" min="0" max="100"
                            class="w-16 bg-white border-slate-200 rounded-lg text-[10px] font-bold py-1 px-3 focus:ring-0" />
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sitemap:</span>
                        <select v-model="filterSitemapId" @change="fetchWebAnalysis()"
                            class="bg-white border-slate-200 rounded-lg text-[10px] font-bold py-1 px-3 focus:ring-0 max-w-[150px]">
                            <option value="all">All Sitemaps</option>
                            <option v-for="s in webAnalysisResponse.sitemaps" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>

                    <button @click="filterStatus = 'all'; minSeoScore = 0; filterSitemapId = 'all'; fetchWebAnalysis()"
                        class="text-[9px] font-black text-indigo-600 uppercase hover:underline ml-auto">
                        Reset Filters
                    </button>
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
                                    <div @click.stop="openSeoDetails(link)"
                                        class="inline-flex items-center justify-center w-10 h-10 rounded-2xl border-2 font-black text-xs leading-none mx-auto transition-transform hover:scale-110 cursor-help"
                                        :class="link.seo_score >= 80 ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                                                link.seo_score >= 50 ? 'border-amber-400 bg-amber-50 text-amber-600' :
                                                'border-rose-400 bg-rose-50 text-rose-600'">
                                        {{ link.seo_score ?? '—' }}
                                    </div>
                                </td>
                                <td class="py-4 px-4 pr-8 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <div class="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                                            <span v-if="link.is_ad_ready" class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md uppercase border border-indigo-100">Ad Ready</span>
                                            <span v-if="link.seo_bottlenecks?.length" class="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-md uppercase border border-rose-100">
                                                {{ link.seo_bottlenecks.length }} Issues
                                            </span>
                                        </div>
                                        <button @click.stop="openSeoDetails(link)"
                                            class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="View Details">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        </button>
                                        <svg class="w-3 h-3 text-slate-200 group-hover:text-slate-400 transition-all" :class="{ 'rotate-90': expandedLink === link.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Pagination -->
                    <div v-if="webAnalysisResponse.pagination?.last_page > 1" class="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing page {{ webAnalysisResponse.pagination.current_page }} of {{ webAnalysisResponse.pagination.last_page }}
                        </p>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                                class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-tight">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                                Previous
                            </button>
                            
                            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === webAnalysisResponse.pagination.last_page"
                                class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-tight">
                                Next
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
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
        <div v-show="activeSection === 'sitemaps'" class="space-y-6">

            <!-- ─── CDN Discovery CTA Panel ─── -->
            <div class="relative overflow-hidden rounded-[2rem] p-8 md:p-10"
                :class="cdnDiscovery.enabled
                    ? 'bg-teal-900'
                    : cdnConnected ? 'bg-slate-900' : 'bg-slate-800 opacity-80'">
                <!-- Glow blobs -->
                <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
                    :class="cdnDiscovery.enabled ? 'bg-teal-500/20' : 'bg-indigo-500/15'"></div>
                <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                    :class="cdnDiscovery.enabled ? 'bg-emerald-400/10' : 'bg-violet-500/10'"></div>

                <div class="relative flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
                    <!-- Left info -->
                    <div class="flex items-start gap-5">
                        <!-- Icon -->
                        <div class="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                            :class="cdnDiscovery.enabled ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-white/10 border border-white/15'">
                            <svg class="w-7 h-7" :class="cdnDiscovery.enabled ? 'text-teal-300' : 'text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                            </svg>
                        </div>
                        <div>
                            <div class="flex items-center gap-2.5 mb-1.5">
                                <h3 class="text-white font-black text-base tracking-tight">Silent CDN Discovery</h3>
                                <!-- Status pill -->
                                <span v-if="cdnDiscovery.enabled"
                                    class="flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/30 rounded-full text-[9px] font-black text-teal-300 uppercase tracking-widest">
                                    <span class="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>Active
                                </span>
                                <span v-else-if="cdnConnected"
                                    class="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 border border-white/15 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>Ready
                                </span>
                                <span v-else
                                    class="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[9px] font-black text-amber-300 uppercase tracking-widest">
                                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Pixel Needed
                                </span>
                            </div>
                            <p v-if="cdnDiscovery.enabled" class="text-sm text-teal-200/80 font-medium max-w-lg">
                                Your CDN pixel is silently watching traffic on
                                <span class="font-black text-white">{{ cdnDiscovery.pixel_domain }}</span>.
                                <span class="ml-2 text-teal-300 font-black">{{ totalDiscovered }} pages discovered so far.</span>
                            </p>
                            <p v-else-if="cdnConnected" class="text-sm text-slate-300 font-medium max-w-lg">
                                Automatically log every page visited on your site via the CDN pixel &mdash; no crawler needed.
                                Pages appear here the moment they receive traffic.
                            </p>
                            <p v-else class="text-sm text-amber-200/70 font-medium max-w-lg">
                                Install the CDN tracking pixel on your site first. Once connected, silent discovery will start automatically on activation.
                            </p>
                            <!-- Error -->
                            <p v-if="cdnDiscovery.errorMsg" class="mt-2 text-[11px] font-black text-rose-300">{{ cdnDiscovery.errorMsg }}</p>
                        </div>
                    </div>

                    <!-- Right: Action -->
                    <div class="flex-shrink-0">
                        <!-- Already enabled: link to sitemap -->
                        <div v-if="cdnDiscovery.enabled" class="flex items-center gap-3">
                            <Link v-if="cdnDiscovery.sitemap_id"
                                :href="route('sitemaps.show', cdnDiscovery.sitemap_id)"
                                class="inline-flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white text-[11px] font-black rounded-2xl transition-all shadow-lg shadow-teal-900/40">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                View Discovery Sitemap
                            </Link>
                        </div>
                        <!-- Not yet enabled: activate button -->
                        <button v-else
                            @click="enableCdnDiscovery"
                            :disabled="cdnDiscovery.loading || !cdnConnected"
                            class="inline-flex items-center gap-2.5 px-6 py-3.5 font-black text-[11px] uppercase tracking-tight rounded-2xl transition-all shadow-lg"
                            :class="cdnConnected
                                ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-teal-900/40 cursor-pointer'
                                : 'bg-white/10 text-slate-400 cursor-not-allowed shadow-none'">
                            <!-- Spinner -->
                            <svg v-if="cdnDiscovery.loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                            </svg>
                            {{ cdnDiscovery.loading ? 'Activating…' : 'Enable Silent Discovery' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- ─── Discovered Pages List (when active) ─── -->
            <div v-if="cdnDiscovery.enabled || discoveredPages.length" class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div class="flex items-center justify-between px-8 py-5 border-b border-slate-50">
                    <div class="flex items-center gap-3">
                        <span class="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Discovered Pages</h3>
                        <span class="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                            {{ totalDiscovered }} total
                        </span>
                    </div>
                    <button @click="fetchDiscoveredPages"
                        class="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500"
                        :class="{ 'opacity-50': isLoadingDiscovered }">
                        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoadingDiscovered }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                </div>

                <!-- Loading -->
                <div v-if="isLoadingDiscovered" class="p-8 space-y-3">
                    <div v-for="n in 5" :key="n" class="h-11 bg-slate-50 rounded-2xl animate-pulse"></div>
                </div>

                <!-- Empty -->
                <div v-else-if="!discoveredPagesResponse.pages.length" class="flex flex-col items-center py-16">
                    <div class="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100">
                        <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </div>
                    <p class="text-xs font-black text-slate-600 uppercase tracking-tight mb-1">Waiting for traffic…</p>
                    <p class="text-[10px] text-slate-400">Pages appear here as soon as a user visits them on your site.</p>
                </div>

                <!-- Page rows -->
                <div v-else class="divide-y divide-slate-50">
                    <div v-for="page in discoveredPagesResponse.pages" :key="page.id"
                        class="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/70 transition-all group">
                        <!-- Hit count pill -->
                        <span class="flex-shrink-0 min-w-[2.5rem] h-8 flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl text-[10px] font-black text-teal-700">
                            {{ page.cdn_hit_count }}
                        </span>
                        <!-- URL + title -->
                        <div class="flex-1 min-w-0">
                            <p class="text-[11px] font-black text-slate-800 truncate">{{ page.title || safePath(page.url) }}</p>
                            <p class="text-[9px] text-slate-400 font-mono truncate mt-0.5">{{ page.url }}</p>
                        </div>
                        <!-- SEO score -->
                        <div v-if="page.seo_score != null"
                            class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] border-2"
                            :class="page.seo_score >= 80 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                                    page.seo_score >= 50 ? 'border-amber-400 bg-amber-50 text-amber-700' :
                                                           'border-rose-400 bg-rose-50 text-rose-700'">
                            {{ page.seo_score }}
                        </div>
                        <!-- Last seen -->
                        <span class="flex-shrink-0 text-[9px] font-black text-slate-400 hidden md:block">{{ page.cdn_last_seen_at }}</span>
                        <!-- View on sitemap -->
                        <Link v-if="cdnDiscovery.sitemap_id"
                            :href="route('sitemaps.show', cdnDiscovery.sitemap_id)"
                            class="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </Link>
                    </div>

                    <!-- Discovered Pages Pagination -->
                    <div v-if="discoveredPagesResponse.pagination?.last_page > 1" class="px-8 py-5 bg-slate-50/30 flex items-center justify-between">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Page {{ discoveredPagesResponse.pagination.current_page }} / {{ discoveredPagesResponse.pagination.last_page }}
                        </p>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToDiscoveredPage(discoveredPage - 1)" :disabled="discoveredPage === 1"
                                class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                                Prev
                            </button>
                            <button @click="goToDiscoveredPage(discoveredPage + 1)" :disabled="discoveredPage === discoveredPagesResponse.pagination.last_page"
                                class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5">
                                Next
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Existing sitemaps grid -->
            <div v-if="!webAnalysisResponse.sitemaps?.length" class="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200">
                    <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">No Sitemaps Configured</p>
                <p class="text-xs text-slate-400 max-w-xs">Add a sitemap in your site settings to start crawling and tracking index coverage.</p>
            </div>

            <div v-else class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <div v-for="sitemap in webAnalysisResponse.sitemaps" :key="sitemap.id"
                        class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                        <div class="flex items-start justify-between mb-6">
                            <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <!-- Badges -->
                            <div class="flex flex-wrap items-center gap-1.5 justify-end">
                                <!-- URL count -->
                                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter">
                                    {{ sitemap.links_count || 0 }} URLs
                                </span>
                                <!-- Crawl mode badge -->
                                <!-- Silent Crawl only show if CDN is connected for selected site -->
                                <span v-if="sitemap.crawl_mode === 'cdn' && cdnConnected"
                                    class="px-2.5 py-1 bg-teal-50 text-teal-700 text-[9px] font-black rounded-full border border-teal-200 flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>Silent Crawl
                                </span>
                                <span v-else-if="sitemap.crawl_mode === 'cdn' && !cdnConnected"
                                    class="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full border border-slate-200 flex items-center gap-1"
                                    title="CDN pixel not connected — silent crawl inactive">
                                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>Silent Crawl
                                </span>
                                <span v-else
                                    class="px-2.5 py-1 bg-violet-50 text-violet-700 text-[9px] font-black rounded-full border border-violet-200 flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-violet-400 rounded-full"></span>Aggressive Crawl
                                </span>
                                <!-- Discovery badge -->
                                <span v-if="sitemap.is_discovery"
                                    class="px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-full border border-amber-200">
                                    🔍 Discovered
                                </span>
                            </div>
                        </div>
                        <!-- Clickable name → sitemaps.show -->
                        <Link :href="route('sitemaps.show', sitemap.id)"
                            class="block text-sm font-black text-slate-900 mb-1 hover:text-indigo-600 transition-colors underline-offset-2 hover:underline">
                            {{ sitemap.name }}
                        </Link>
                        <p class="text-[10px] text-slate-400 font-mono truncate mb-4">{{ sitemap.site_url }}</p>
                        <div class="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Last crawled: {{ sitemap.last_generated_at || 'Never' }}
                        </div>
                    </div>
                </div>

                <!-- Sitemaps Pagination -->
                <div v-if="webAnalysisResponse.sitemaps_pagination?.last_page > 1" class="flex items-center justify-between px-8 py-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page {{ webAnalysisResponse.sitemaps_pagination.current_page }} of {{ webAnalysisResponse.sitemaps_pagination.last_page }}
                    </p>
                    <div class="flex items-center gap-1.5">
                        <button @click="goToSitemapsPage(sitemapsPage - 1)" :disabled="sitemapsPage === 1"
                            class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-tight">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                            Prev
                        </button>
                        <button @click="goToSitemapsPage(sitemapsPage + 1)" :disabled="sitemapsPage === webAnalysisResponse.sitemaps_pagination.last_page"
                            class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-tight">
                            Next
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── SECTION: Health ────────────────────────────────────────────── -->
        <div v-show="activeSection === 'health'" class="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">

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

            <!-- ─── Schema Debug Panel ─── -->
            <div class="md:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div class="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <div class="flex items-center gap-3">
                        <span class="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                        <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">Schema Debug</h3>
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">Last 20 Auto-Generated</span>
                    </div>
                    <button @click="fetchSchemaDebug"
                        class="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500"
                        :class="{ 'opacity-50': isLoadingSchemaDbg }">
                        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoadingSchemaDbg }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </button>
                </div>

                <!-- Loading -->
                <div v-if="isLoadingSchemaDbg" class="p-8 space-y-3">
                    <div v-for="n in 4" :key="n" class="h-12 bg-slate-50 rounded-2xl animate-pulse"></div>
                </div>

                <!-- Empty -->
                <div v-else-if="!schemaDebugResponse.schemas.length" class="flex flex-col items-center py-16 text-center">
                    <div class="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 border border-violet-100">
                        <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                    </div>
                    <p class="text-xs font-black text-slate-600 uppercase tracking-tight mb-1">No schemas generated yet</p>
                    <p class="text-[10px] text-slate-400 max-w-xs">Auto-generated schemas appear here once the CDN pixel fires with the <code class="bg-slate-100 px-1 rounded">schema</code> module enabled.</p>
                </div>

                <!-- Schema list -->
                <div v-else class="divide-y divide-slate-50">
                    <div v-for="s in schemaDebugResponse.schemas" :key="s.id"
                        @click="expandedSchema = expandedSchema === s.id ? null : s.id"
                        class="px-8 py-4 hover:bg-slate-50/70 cursor-pointer transition-all group">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3 min-w-0">
                                <span class="px-2 py-0.5 text-[8px] font-black rounded-md uppercase"
                                    :class="s.schema_type === 'article' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            s.schema_type === 'website' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            'bg-violet-50 text-violet-700 border border-violet-200'">
                                    {{ s.schema_type }}
                                </span>
                                <p class="text-[11px] font-semibold text-slate-700 truncate max-w-md font-mono">{{ s.url }}</p>
                            </div>
                            <div class="flex items-center gap-3 flex-shrink-0">
                                <span class="text-[9px] font-black text-slate-400 uppercase">{{ s.injected_count }} injections</span>
                                <span class="text-[9px] text-slate-400">{{ s.last_injected_at }}</span>
                                <svg class="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-all"
                                    :class="{ 'rotate-90': expandedSchema === s.id }"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                            </div>
                        </div>
                        <!-- Expanded JSON preview -->
                        <div v-if="expandedSchema === s.id" class="mt-4 animate-fade-in">
                            <pre class="text-[10px] bg-slate-900 text-emerald-300 rounded-2xl p-5 overflow-x-auto max-h-64 font-mono leading-relaxed">{{ s.schema_preview }}</pre>
                        </div>
                    </div>

                    <!-- Schema Debug Pagination -->
                    <div v-if="schemaDebugResponse.pagination?.last_page > 1" class="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Showing page {{ schemaDebugResponse.pagination.current_page }} / {{ schemaDebugResponse.pagination.last_page }}
                        </p>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToSchemaDebugPage(schemaDebugPage - 1)" :disabled="schemaDebugPage === 1"
                                class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                                Prev
                            </button>
                            <button @click="goToSchemaDebugPage(schemaDebugPage + 1)" :disabled="schemaDebugPage === schemaDebugResponse.pagination.last_page"
                                class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5">
                                Next
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </div>

    <!-- ─── MODAL: SEO Details Deep-Dive ─────────────────────────────────── -->
    <Teleport to="body">
        <div v-if="showSeoModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <!-- Backdrop -->
            <div @click="showSeoModal = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
            
            <!-- Modal Content -->
            <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
                <!-- Modal Header -->
                <div class="px-10 py-8 border-b border-slate-50 bg-slate-50/50 relative">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-8 bg-indigo-600 rounded-full"></div>
                            <h2 class="text-xl font-black text-slate-900 uppercase tracking-tight">Technical SEO Deep-Dive</h2>
                        </div>
                        <button @click="showSeoModal = false" class="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <p class="text-[11px] font-mono text-slate-400 truncate pr-20">{{ selectedSeoLink?.url }}</p>
                    
                    <!-- Floating Score -->
                    <div class="absolute top-8 right-24 flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Health Score</p>
                            <p class="text-2xl font-black" :class="selectedSeoLink?.seo_score >= 80 ? 'text-emerald-500' : selectedSeoLink?.seo_score >= 50 ? 'text-amber-500' : 'text-rose-500'">
                                {{ selectedSeoLink?.seo_score }}%
                            </p>
                        </div>
                    </div>
                </div>

                <div class="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <!-- Issues Breakdown -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <!-- Fails/Warnings -->
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Action Items</h4>
                            </div>
                            <div class="space-y-2">
                                <div v-for="err in selectedSeoLink?.seo_audit?.errors" :key="err"
                                    class="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                    <span class="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                    <p class="text-[11px] font-bold text-rose-700 leading-tight">{{ err }}</p>
                                </div>
                                <div v-for="wrn in selectedSeoLink?.seo_audit?.warnings" :key="wrn"
                                    class="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                    <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                    <p class="text-[11px] font-bold text-amber-700 leading-tight">{{ wrn }}</p>
                                </div>
                                <!-- Success placeholder if no errors -->
                                <div v-if="!selectedSeoLink?.seo_audit?.errors?.length && !selectedSeoLink?.seo_audit?.warnings?.length"
                                    class="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">No major issues detected</p>
                                </div>
                            </div>
                        </div>

                        <!-- Passes -->
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                <h4 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Optimization Passes</h4>
                            </div>
                            <div class="space-y-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                                <div v-if="selectedSeoLink?.title" class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                    <p class="text-[10px] font-bold text-emerald-700 uppercase">Title Optimised</p>
                                </div>
                                <div v-if="selectedSeoLink?.h1" class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                    <p class="text-[10px] font-bold text-emerald-700 uppercase">Heading Structure Ok</p>
                                </div>
                                <div v-if="selectedSeoLink?.http_status === 200" class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                    <p class="text-[10px] font-bold text-emerald-700 uppercase">Server Status Indexed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Simulation: Site Engine Preview -->
                    <div class="mb-10">
                        <div class="flex items-center gap-2 mb-4">
                            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Site Engine Simulation</h4>
                        </div>
                        
                        <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm p-8">
                            <!-- Simulation Content -->
                            <div class="max-w-xl">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">🌐</div>
                                    <div class="flex flex-col">
                                        <span class="text-[10px] font-bold text-slate-900 leading-tight">{{ safeHostname(selectedSeoLink?.url) }}</span>
                                        <span class="text-[9px] text-slate-400 leading-tight">{{ selectedSeoLink?.url }}</span>
                                    </div>
                                </div>
                                <h3 class="text-lg font-bold text-[#1a0dab] hover:underline cursor-pointer mb-1">{{ selectedSeoLink?.title || 'Page Title Not Found' }}</h3>
                                <p class="text-[13px] text-[#4d5156] leading-relaxed mb-3">
                                    {{ selectedSeoLink?.description || 'No description available for this page.' }}
                                </p>
                                
                                <!-- AI Injection Overlay -->
                                <div class="mt-4 p-4 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-2xl relative">
                                    <div class="absolute -top-2.5 left-4 px-2 bg-indigo-600 text-white text-[8px] font-black rounded uppercase tracking-widest">AI Injection Zone</div>
                                    <div class="flex items-start gap-3">
                                        <div class="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
                                            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-bold text-indigo-900 mb-1">Automated Schema Enrichment</p>
                                            <p class="text-[9px] text-indigo-700/70 leading-relaxed font-mono">
                                                // Injected JSON-LD Graph for {{ selectedSeoLink?.schema_suggestions?.[0] || 'WebPage' }}<br>
                                                { "@context": "https://schema.org", "@type": "{{ selectedSeoLink?.schema_suggestions?.[0] || 'WebPage' }}", ... }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Page Content Preview (Existing Metadata Section) -->
                    <div class="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8">
                        <div class="flex items-center gap-2 mb-5">
                            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                            <h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Metadata Context</h4>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Title Tag</p>
                                <p class="text-xs font-bold text-slate-800">{{ selectedSeoLink?.title || 'Not Detected' }}</p>
                            </div>
                            <div>
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary H1</p>
                                <p class="text-xs font-bold text-slate-800">{{ selectedSeoLink?.h1 || 'Not Detected' }}</p>
                            </div>
                            <div>
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                                <p class="text-xs font-medium text-slate-500 leading-relaxed italic line-clamp-2">
                                    "{{ selectedSeoLink?.description || 'No meta description found.' }}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Technical Stats -->
                    <div class="flex items-center gap-6">
                        <div class="flex-1 p-5 bg-white border border-slate-100 rounded-2xl text-center">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Load Time</p>
                            <p class="text-base font-black text-slate-900">{{ selectedSeoLink?.load_time ? selectedSeoLink.load_time.toFixed(2) : '—' }}s</p>
                        </div>
                        <div class="flex-1 p-5 bg-white border border-slate-100 rounded-2xl text-center">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Code</p>
                            <p class="text-base font-black" :class="selectedSeoLink?.http_status === 200 ? 'text-emerald-500' : 'text-rose-500'">
                                {{ selectedSeoLink?.http_status || '—' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    <p class="text-[10px] font-medium text-slate-400 max-w-xs leading-tight">
                        Last re-validated: {{ selectedSeoLink?.updated_at ? new Date(selectedSeoLink.updated_at).toLocaleString() : 'Never' }}
                    </p>
                    <button @click="revalidateLink(selectedSeoLink)"
                        :disabled="isValidatingLink"
                        class="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-tight transition-all shadow-lg shadow-indigo-200">
                        <svg v-if="isValidatingLink" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        <span>{{ isValidatingLink ? 'Validating...' : 'Validate Changes' }}</span>
                    </button>
                </div>
            </div>
        </div>
        </Teleport>

        <!-- ── Terminal Modal (AI Injection Intelligence) ────────────────── -->
        <Teleport to="body">
            <div v-if="showSchemaTerminal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-fade-in">
                <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click="showSchemaTerminal = false"></div>
                <div class="relative w-full max-w-5xl bg-black rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col h-[80vh]">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-900/50">
                        <div class="flex items-center gap-4">
                            <div class="flex gap-1.5 items-center">
                                <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
                                <span class="w-3 h-3 rounded-full bg-violet-500"></span>
                                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                            </div>
                            <h2 class="text-sm font-black text-white uppercase tracking-widest ml-4">AI Injection Live Stream</h2>
                        </div>
                        <button @click="showSchemaTerminal = false" class="text-white/40 hover:text-white transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Console Output -->
                    <div class="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-2 selection:bg-indigo-500 selection:text-white">
                        <div v-if="isLoadingSchemaLogs" class="text-indigo-400 animate-pulse flex items-center gap-3">
                            <span class="inline-block w-2.5 h-4 bg-indigo-500 animate-terminal-cursor"></span>
                            Indexing automated schema graph...
                        </div>
                        <div v-else-if="!schemaTerminalLogs.length" class="text-zinc-600 italic">
                            [ SYSTEM ] No AI injections recorded in the last 72 hours.
                        </div>
                        <div v-else v-for="(log, i) in schemaTerminalLogs" :key="i" class="flex gap-4 group">
                            <span class="text-zinc-700 select-none w-12 flex-shrink-0 text-right">[{{ i + 1 }}]</span>
                            <div class="flex-1">
                                <div class="flex items-center gap-3 flex-wrap">
                                    <span class="text-zinc-500">[{{ log.last_injected_at }}]</span>
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-900 text-indigo-300">
                                        {{ log.schema_type }}
                                    </span>
                                    <span class="text-indigo-400 font-bold">$ schema.inject_graph</span>
                                    <span class="text-emerald-400">SUCCESS</span>
                                </div>
                                <div class="mt-1 pl-4 border-l border-white/10 ml-1 space-y-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <p class="text-zinc-400"><span class="text-indigo-600">target:</span> {{ log.url }}</p>
                                    <p class="text-zinc-500"><span class="text-indigo-600">hits:</span> {{ log.injected_count }} historical injections</p>
                                    <div class="bg-zinc-900/50 p-3 rounded-xl border border-white/5 mt-2">
                                        <pre class="text-[9px] text-indigo-200/70 overflow-x-auto">{{ log.schema_preview }}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 pt-4">
                            <span class="text-indigo-500 font-bold tracking-widest">root@ai_engine:~$</span>
                            <span class="inline-block w-2.5 h-4 bg-indigo-500 animate-terminal-cursor"></span>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ── Terminal Modal (JS Events Forensic) ────────────────────────── -->
        <Teleport to="body">
            <div v-if="showTerminalModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-fade-in">
                <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click="showTerminalModal = false"></div>
                
                <div class="relative w-full max-w-5xl bg-black rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col h-[80vh]">
                <!-- Header -->
                <div class="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-900/50">
                    <div class="flex items-center gap-4">
                        <div class="flex gap-1.5 items-center">
                            <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                        </div>
                        <h2 class="text-sm font-black text-white uppercase tracking-widest ml-4">Forensic Signal Terminal</h2>
                    </div>
                    <button @click="showTerminalModal = false" class="text-white/40 hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Console Output -->
                <div class="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-2 selection:bg-emerald-500 selection:text-black">
                    <div v-if="isLoadingLogs" class="text-emerald-500 animate-pulse flex items-center gap-3">
                        <span class="inline-block w-2.5 h-4 bg-emerald-500 animate-terminal-cursor"></span>
                        Establishing secure connection to telemetry stream...
                    </div>
                    <div v-else-if="!terminalLogs.length" class="text-zinc-600 italic">
                        [ SYSTEM ] No signal activity detected in the current window.
                    </div>
                    <div v-else v-for="(log, i) in terminalLogs" :key="i" class="flex gap-4 group">
                        <span class="text-zinc-700 select-none w-12 flex-shrink-0 text-right">[{{ i + 1 }}]</span>
                        <div class="flex-1">
                            <div class="flex items-center gap-3 flex-wrap">
                                <span class="text-zinc-500">[{{ log.created_at }}]</span>
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                                    :class="log.type === 'error' ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'">
                                    {{ log.type || 'HIT' }}
                                </span>
                                <span class="text-emerald-400 font-bold">$ telemetry.record_signal</span>
                                <span class="text-emerald-200">"{{ log.event_name || 'page_view' }}"</span>
                            </div>
                            <div class="mt-1 pl-4 border-l border-white/10 ml-1 space-y-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <p class="text-zinc-400"><span class="text-emerald-600">url:</span> {{ log.page_url }}</p>
                                <p class="text-zinc-400"><span class="text-emerald-600">source:</span> {{ log.referrer || 'direct' }}</p>
                                <p class="text-zinc-400"><span class="text-emerald-600">client:</span> {{ log.device_type }} · {{ log.country_code }} · {{ log.city || 'Unknown' }}</p>
                                <p v-if="log.metadata" class="text-zinc-500 text-[10px] break-all"><span class="text-emerald-600">meta:</span> {{ log.metadata }}</p>
                            </div>
                        </div>
                    </div>
                    <!-- Bottom anchor for terminal cursor -->
                    <div class="flex items-center gap-3 pt-4">
                        <span class="text-emerald-500 font-bold tracking-widest">root@v3.1_pixel:~$</span>
                        <span class="inline-block w-2.5 h-4 bg-emerald-500 animate-terminal-cursor"></span>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="px-8 py-4 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between">
                    <span class="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total signals Buffer: {{ terminalLogs.length }}</span>
                    <div class="flex items-center gap-4">
                        <span class="text-[9px] font-black text-emerald-500 uppercase animate-pulse">● System Live</span>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
.shadow-premium {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.03);
}
.shadow-3xl {
  box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.5);
}
@keyframes terminal-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-terminal-cursor {
  animation: terminal-cursor 1s infinite;
}
</style>
