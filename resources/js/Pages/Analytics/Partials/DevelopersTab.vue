<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import { useToastStore } from '@/stores/useToastStore'
import ConfirmationModal from '@/Components/ConfirmationModal.vue'
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
    propertyId: [Number, String],
    forecastData: Object
})

// ─── State ────────────────────────────────────────────────────────────────────
const snippet            = ref('')
const logResponse        = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
const chartEvents        = ref([]) // Separate set for the trend chart
const isLoading          = ref(false)
const isRegenerating     = ref(false)
const isTestingConn      = ref(false)
const isSavingDomain     = ref(false)
const toast              = useToastStore()
const selectedPropId     = ref(props.propertyId || props.properties?.[0]?.id)
const selectedCampaignId = ref('')
const selectedSession    = ref(null)
const searchQuery        = ref('')
const connectionStatus   = ref(null)
const allowedDomainInput = ref(props.organization?.allowed_domain || '')
const domainSavedMsg     = ref('')
const showRegenModal     = ref(false)
const analyticsData      = ref(null)
const isLoadingAnalytics = ref(false)
const pathFilter         = ref('')  // filter log by clicking a path row

// Filters
const filters = ref({
    campaign_id: 'all',
    type: 'all',
    device: 'all',
    country: 'all',
    start_date: '',
    end_date: '',
    per_page: 25,
    page: 1
})

let eventsInterval     = null
let connInterval       = null
let analyticsInterval  = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const siteToken = computed(() => props.organization?.ads_site_token)

const selectedProperty = computed(() =>
    props.properties?.find(p => p.id == selectedPropId.value)
)

const filteredEvents = computed(() => {
    let ev = events.value
    if (campaignFilter.value !== 'all') {
        ev = ev.filter(e => e.google_campaign_id === campaignFilter.value)
    }
    if (!searchQuery.value) return ev
    const q = searchQuery.value.toLowerCase()
    return ev.filter(e =>
        e.page_url?.toLowerCase().includes(q) ||
        e.session_id?.toLowerCase().includes(q) ||
        e.utm_campaign?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q)
    )
})

const availableCampaigns = computed(() => {
    const caps = new Set()
    chartEvents.value.forEach(e => { if (e.google_campaign_id) caps.add(e.google_campaign_id) })
    return Array.from(caps)
})

const sessionTimeline = computed(() => {
    if (!selectedSession.value) return []
    // We check both log and chart events to find the full timeline
    const all = [...logResponse.value.data, ...chartEvents.value]
    return all
        .filter(e => e.session_id === selectedSession.value.session_id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const sessionChartData = computed(() => {
    if (!selectedSession.value) return { labels: [], datasets: [] }
    const t = sessionTimeline.value
    return {
        labels: t.map(e => new Date(e.created_at).toLocaleTimeString()),
        datasets: [{
            label: 'Engagement Signals',
            data: t.map(e => e.click_count),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.12)',
            fill: true, tension: 0.5, borderWidth: 3,
            pointRadius: 6, pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1', pointBorderWidth: 2
        }]
    }
})

// Segmentation logic for Ad vs Total signals
const hitsChartData = computed(() => {
    const totalCounts = {}
    const adCounts = {}
    
    chartEvents.value.forEach(e => {
        const d = new Date(e.created_at).toLocaleDateString()
        totalCounts[d] = (totalCounts[d] || 0) + 1
        
        // Ad check: has GCLID OR has utm_campaign OR has data-campaign
        const isAd = e.gclid || e.utm_campaign || e.google_campaign_id
        if (isAd) {
            adCounts[d] = (adCounts[d] || 0) + 1
        }
    })
    
    const dates = Object.keys(totalCounts).sort((a, b) => new Date(a) - new Date(b))
    
    return {
        labels: dates,
        datasets: [
            {
                label: 'Total Reach',
                data: dates.map(d => totalCounts[d]),
                borderColor: '#e2e8f0',
                backgroundColor: 'rgba(226,232,240,0.1)',
                fill: true, tension: 0.4, borderWidth: 2,
                pointRadius: 0, pointHitRadius: 20
            },
            {
                label: 'Ad Conversions',
                data: dates.map(d => adCounts[d] || 0),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.08)',
                fill: true, tension: 0.4, borderWidth: 4,
                pointRadius: 0, pointHitRadius: 20
            }
        ]
    }
})

const topCountries = computed(() => {
    const c = {}
    chartEvents.value.forEach(e => { if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1 })
    return Object.entries(c).map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count).slice(0, 8)
})

const deviceBreakdown = computed(() => {
    const d = { Mobile: 0, Desktop: 0, Tablet: 0 }
    chartEvents.value.forEach(e => { if (e.device_type && d[e.device_type] !== undefined) d[e.device_type]++ })
    return d
})

const avgClicks = computed(() => {
    const ads = chartEvents.value.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id)
    if (ads.length === 0) return 0
    const total = ads.reduce((sum, e) => sum + (e.click_count || 0), 0)
    return (total / ads.length).toFixed(1)
})

// ── Analytics-driven computed ──────────────────────────────────────────────
const todayDelta = computed(() => analyticsData.value?.summary?.today_delta ?? null)
const weekDelta  = computed(() => analyticsData.value?.summary?.week_delta  ?? null)

const historyChartData = computed(() => {
    const rows = analyticsData.value?.daily_history ?? []
    if (!rows.length) return { labels: [], datasets: [] }
    const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length
    return {
        labels: rows.map(r => r.label),
        datasets: [
            {
                type: 'bar',
                label: 'Total Signals',
                data: rows.map(r => r.total),
                backgroundColor: rows.map(r =>
                    r.total >= avg * 1.15 ? 'rgba(99,102,241,0.85)' :
                    r.total <= avg * 0.6  ? 'rgba(226,232,240,0.6)'  :
                    'rgba(99,102,241,0.35)'
                ),
                borderRadius: 8,
                borderSkipped: false,
                order: 2,
            },
            {
                type: 'line',
                label: 'Ad Hits',
                data: rows.map(r => r.ad_hits),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.08)',
                fill: true,
                tension: 0.45,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                order: 1,
            }
        ]
    }
})

const historyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
        legend: { display: true, position: 'top', align: 'end',
            labels: { boxWidth: 10, font: { family: 'Inter', weight: 'bold', size: 10 }, padding: 20 } },
        tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Inter', weight: 'black', size: 11 },
            bodyFont: { family: 'Inter', size: 11 },
            padding: 14,
            cornerRadius: 12,
            callbacks: {
                title: (items) => {
                    const row = analyticsData.value?.daily_history?.[items[0].dataIndex]
                    return row ? new Date(row.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' }) : ''
                }
            }
        }
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, maxTicksLimit: 10 } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10 } } }
    }
}

const topPages   = computed(() => analyticsData.value?.top_pages      ?? [])
const topReferers = computed(() => analyticsData.value?.top_referrers ?? [])
const rising     = computed(() => analyticsData.value?.trend_velocity?.rising  ?? [])
const falling    = computed(() => analyticsData.value?.trend_velocity?.falling ?? [])

const safePathLabel = (url) => {
    if (!url) return '—'
    try { return new URL(url).pathname || '/' } catch { return url }
}

const deltaBadgeClass = (pct) => {
    if (pct === null || pct === undefined) return 'bg-slate-100 text-slate-400'
    if (pct >= 5)  return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    if (pct <= -5) return 'bg-rose-50 text-rose-600 border border-rose-200'
    return 'bg-amber-50 text-amber-600 border border-amber-200'
}

const deltaIcon = (pct) => {
    if (pct === null || pct === undefined) return '—'
    if (pct >= 5)  return `↑ +${pct}%`
    if (pct <= -5) return `↓ ${pct}%`
    return `→ ${pct > 0 ? '+' : ''}${pct}%`
}

// Inline SVG sparkline (14 data points → path)
const sparklinePath = (series) => {
    if (!series?.length) return ''
    const w = 80, h = 28
    const max = Math.max(...series, 1)
    const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - (v / max) * h}`)
    return `M${pts.join(' L')}`
}

const pixelStatusBadge = computed(() => {
    const cs = connectionStatus.value
    if (cs) {
        if (cs.status === 'verified_active')   return { label: 'Verified & Active',   color: 'emerald', icon: '✓' }
        if (cs.status === 'connected_inactive') return { label: 'Connected – Inactive', color: 'amber',   icon: '○' }
        return { label: 'Not Detected', color: 'rose', icon: '✕' }
    }
    const recent = chartEvents.value.some(e => new Date(e.created_at) > new Date(Date.now() - 86400000))
    if (recent) return { label: 'Connected & Active', color: 'emerald', icon: '✓' }
    if (logResponse.value.total > 0) return { label: 'Connected – Inactive', color: 'amber', icon: '○' }
    return { label: 'Not Detected', color: 'rose', icon: '✕' }
})

const mainChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { 
        legend: { 
            display: true, 
            position: 'top', 
            align: 'end',
            labels: { boxWidth: 8, font: { family: 'Inter', weight: 'bold', size: 10 }, padding: 20 }
        } 
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
        y: { 
            beginAtZero: true, 
            grid: { color: '#f8fafc', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 10 }, stepSize: 1 }
        }
    }
}

const modalChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
    }
}

// ─── API calls ────────────────────────────────────────────────────────────────
const fetchEvents = async () => {
    isLoading.value = true
    try {
        const params = {
            ...filters.value,
            search: pathFilter.value || searchQuery.value,
            campaign_id: filters.value.campaign_id
        }
        const r = await axios.get(route('google-ads.pixel-events'), { params })
        logResponse.value = r.data

        // Also update chart data (we fetch more for the chart but without pagination meta)
        if (filters.value.page === 1) {
            const chartParams = { ...params, per_page: 500 }
            const cr = await axios.get(route('google-ads.pixel-events'), { params: chartParams })
            chartEvents.value = cr.data.data
        }
    } catch (e) {
        console.error('Failed to fetch pixel events', e)
    } finally {
        isLoading.value = false
    }
}

const fetchAnalytics = async () => {
    isLoadingAnalytics.value = true
    try {
        const r = await axios.get(route('google-ads.analytics'))
        analyticsData.value = r.data
    } catch (e) {
        console.error('Failed to fetch analytics', e)
    } finally {
        isLoadingAnalytics.value = false
    }
}

const drillToPath = (pageUrl) => {
    pathFilter.value = pageUrl
    filters.value.page = 1
    fetchEvents()
    // scroll to log
    document.getElementById('intel-log')?.scrollIntoView({ behavior: 'smooth' })
}

const nextPage = () => {
    if (filters.value.page < logResponse.value.last_page) {
        filters.value.page++
        fetchEvents()
    }
}

const prevPage = () => {
    if (filters.value.page > 1) {
        filters.value.page--
        fetchEvents()
    }
}

const applyFilters = () => {
    filters.value.page = 1
    fetchEvents()
}

const downloadCsv = () => {
    const params = new URLSearchParams({
        ...filters.value,
        search: searchQuery.value
    }).toString()
    window.location.href = route('google-ads.pixel-events.csv') + '?' + params
}

const fetchConnectionStatus = async () => {
    try {
        const r = await axios.get(route('google-ads.connection-status'))
        connectionStatus.value = r.data
    } catch (e) { /* silent */ }
}

const runConnectionTest = async () => {
    isTestingConn.value = true
    try {
        const r = await axios.get(route('google-ads.connection-status'))
        connectionStatus.value = r.data
    } catch (e) {
        connectionStatus.value = { status: 'not_detected', connected: false }
    } finally {
        isTestingConn.value = false
    }
}

const saveAllowedDomain = async () => {
    isSavingDomain.value = true
    domainSavedMsg.value = ''
    try {
        const r = await axios.put(route('google-ads.allowed-domain'), {
            allowed_domain: allowedDomainInput.value
        })
        domainSavedMsg.value = r.data.message
        toast.success(r.data.message || 'Domain saved successfully')
        fetchConnectionStatus()
    } catch (e) {
        domainSavedMsg.value = 'Error saving domain.'
        toast.error('Failed to save allowed domain')
    } finally {
        isSavingDomain.value = false
    }
}

const updateSnippet = () => {
    const base = window.location.origin
    const camp = selectedCampaignId.value ? ` data-campaign="${selectedCampaignId.value}"` : ''
    snippet.value = `<script src="${base}/cdn/ads-tracker.js" data-token="${siteToken.value}"${camp} async><\/script>`
}

const regenerateToken = async () => {
    showRegenModal.value = false
    isRegenerating.value = true
    try {
        await axios.post(route('google-ads.regenerate-token'))
        toast.success('Site token regenerated successfully')
        window.location.reload()
    } catch (e) {
        console.error('Failed to regenerate token', e)
        toast.error('Failed to regenerate site token')
    } finally {
        isRegenerating.value = false
    }
}

const copySnippet = () => {
    navigator.clipboard.writeText(snippet.value)
    toast.success('Snippet copied to clipboard!', 'Copied')
}

const safeHostname = (url) => {
    if (!url) return ''
    try {
        const m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im)
        return m ? m[1] : url
    } catch { return url }
}

const fmt = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return d.toLocaleDateString()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    updateSnippet()
    fetchEvents()
    fetchConnectionStatus()
    fetchAnalytics()
    eventsInterval    = setInterval(fetchEvents, 60000)
    connInterval      = setInterval(fetchConnectionStatus, 30000)
    analyticsInterval = setInterval(fetchAnalytics, 300000) // every 5 min
})

onUnmounted(() => {
    clearInterval(eventsInterval)
    clearInterval(connInterval)
    clearInterval(analyticsInterval)
})

watch([selectedPropId, selectedCampaignId, siteToken], updateSnippet)
watch(pathFilter, () => { if (!pathFilter.value) fetchEvents() })
</script>

<template>
    <div class="space-y-12 pb-24">
        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between mb-10">
            <div>
                <h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Developer Tools
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v3.1</span>
                </h2>
                <p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Secure pixel tracking with agency attribution monitoring & real-time signal intelligence.</p>
            </div>
            <div class="flex items-center gap-2 px-5 py-3 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all"
                :class="{
                    'bg-emerald-50 border-emerald-200 text-emerald-700': pixelStatusBadge.color === 'emerald',
                    'bg-amber-50 border-amber-200 text-amber-700': pixelStatusBadge.color === 'amber',
                    'bg-rose-50 border-rose-200 text-rose-700': pixelStatusBadge.color === 'rose',
                }">
                <span class="w-2 h-2 rounded-full"
                    :class="{
                        'bg-emerald-500 animate-pulse': pixelStatusBadge.color === 'emerald',
                        'bg-amber-400': pixelStatusBadge.color === 'amber',
                        'bg-rose-400': pixelStatusBadge.color === 'rose',
                    }"></span>
                {{ pixelStatusBadge.label }}
            </div>
        </div>

        <!-- ── Insights Panels (Row 1) ──────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Stats -->
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Total Signals -->
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                    <h4 class="text-4xl font-black text-slate-900 tracking-tight">{{ logResponse.total }}</h4>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-[10px] font-black text-slate-400">{{ connectionStatus?.hits_last_24h ?? '—' }} in last 24h</span>
                        <span v-if="todayDelta !== null" class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            :class="deltaBadgeClass(todayDelta)">
                            {{ deltaIcon(todayDelta) }} today
                        </span>
                    </div>
                </div>
                <!-- Ad Conversions -->
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ad Conversions</p>
                    <h4 class="text-4xl font-black text-indigo-600 tracking-tight">{{ chartEvents.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id).length }}</h4>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-[10px] font-black text-indigo-500">Targeted Traffic</span>
                        <span v-if="weekDelta !== null" class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            :class="deltaBadgeClass(weekDelta)">
                            {{ deltaIcon(weekDelta) }} 7d
                        </span>
                    </div>
                </div>
                <!-- Engagement -->
                <div class="bg-indigo-600 p-8 shadow-indigo-200 shadow-2xl rounded-[2.5rem] text-white">
                    <p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Engagement Qty</p>
                    <h4 class="text-4xl font-black tracking-tight">{{ avgClicks }}</h4>
                    <div class="mt-3 text-[10px] font-black text-indigo-200">Avg Clicks Per Ad Session</div>
                </div>
            </div>

            <!-- Connection/Security Panel -->
            <div class="lg:col-span-4 bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Pixel Health</h3>
                    <button @click="runConnectionTest" :disabled="isTestingConn" class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                        {{ isTestingConn ? 'Testing...' : 'Test Now' }}
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="relative">
                        <input v-model="allowedDomainInput" placeholder="diaminyaesthetics.com" class="w-full bg-slate-50 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-xl text-[11px] font-bold text-slate-800 py-3 px-4 pr-16" />
                        <button @click="saveAllowedDomain" class="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg">Save</button>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                        <span class="text-[9px] font-black text-slate-400 uppercase">Subdomain Pinning</span>
                        <span class="text-[9px] font-black text-emerald-600 uppercase">Active (v3.1)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Insights Bar (Geography & Devices) ───────────────────── -->
        <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <!-- Top Geographies -->
                <div class="lg:col-span-8">
                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Global Signal Origin</h4>
                    <div class="flex flex-wrap gap-4">
                        <div v-for="geo in topCountries" :key="geo.code" class="px-5 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100/50">
                            <span class="text-lg">{{ geo.code === 'US' ? '🇺🇸' : geo.code === 'GB' ? '🇬🇧' : geo.code === 'CA' ? '🇨🇦' : geo.code === 'KE' ? '🇰🇪' : '🌍' }}</span>
                            <div>
                                <p class="text-[10px] font-black text-slate-900">{{ geo.code }}</p>
                                <p class="text-[8px] font-black text-slate-400 uppercase">{{ geo.count }} Hits</p>
                            </div>
                        </div>
                        <div v-if="topCountries.length === 0" class="text-[10px] text-slate-300 italic py-3">Collecting data...</div>
                    </div>
                </div>
                <!-- Device Breakdown -->
                <div class="lg:col-span-4 border-l border-slate-100 pl-12">
                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Client Distribution</h4>
                    <div class="space-y-4">
                        <div v-for="(count, type) in deviceBreakdown" :key="type" class="flex items-center justify-between">
                            <span class="text-[10px] font-black text-slate-600 uppercase">{{ type }}</span>
                            <div class="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full bg-indigo-500 rounded-full" :style="{ width: chartEvents.length > 0 ? (count / chartEvents.length * 100) + '%' : '0%' }"></div>
                            </div>
                            <span class="text-[10px] font-black text-slate-900">{{ count }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══ 30-Day Signal History Chart ════════════════════════════════ -->
        <div class="bg-white p-12 shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative">
            <div class="flex items-center justify-between mb-10">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        30-Day Signal History
                        <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">Daily</span>
                    </h3>
                    <p class="text-slate-400 font-medium text-xs mt-1">Total pixel hits (bars) vs Ad-attributed hits (amber line) — darker bars = above-average days</p>
                </div>
                <div class="flex gap-4">
                    <div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span class="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">Total Signals</span>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                        <span class="text-[10px] font-black text-amber-600 uppercase">Ad Hits</span>
                    </div>
                </div>
            </div>
            <div class="h-[380px] relative">
                <div v-if="!analyticsData" class="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-slate-300">Computing history...</p>
                </div>
                <Bar v-if="analyticsData" :data="historyChartData" :options="historyChartOptions" />
            </div>
        </div>

        <!-- ══ Path Intelligence Table ════════════════════════════════════ -->
        <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
            <div class="px-12 pt-12 pb-8 flex items-end justify-between border-b border-slate-50">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Path Intelligence
                        <span class="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-slate-100">Top 10</span>
                    </h3>
                    <p class="text-slate-400 text-xs font-medium mt-1">Most-visited pages with 14-day trend sparkline and day-over-day delta. Click a row to drill into its log.</p>
                </div>
                <button v-if="pathFilter" @click="pathFilter = ''" class="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    Clear filter
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left min-w-[900px]">
                    <thead>
                        <tr class="bg-slate-50/60">
                            <th class="py-5 px-12 text-[9px] font-black text-slate-400 uppercase tracking-widest">Page / Path</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hits</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ad Hits</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Stay</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Clicks</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">14-Day Trend</th>
                            <th class="py-5 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Δ vs Yesterday</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr v-if="isLoadingAnalytics && !topPages.length">
                            <td colspan="7" class="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading path data...</td>
                        </tr>
                        <tr v-for="(page, idx) in topPages" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="group hover:bg-indigo-50/30 cursor-pointer transition-all"
                            :class="{ 'bg-indigo-50/20 border-l-4 border-indigo-500': pathFilter === page.page_url }">
                            <td class="py-7 px-12">
                                <div class="flex items-center gap-4">
                                    <span class="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">{{ idx + 1 }}</span>
                                    <div class="min-w-0">
                                        <p class="text-xs font-black text-slate-900 truncate max-w-xs" :title="page.page_url">
                                            {{ safePathLabel(page.page_url) }}
                                        </p>
                                        <p class="text-[9px] text-slate-400 font-bold truncate max-w-xs">{{ safeHostname(page.page_url) }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <span class="text-sm font-black text-slate-900">{{ page.total_hits }}</span>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <span class="text-sm font-black" :class="page.ad_hits > 0 ? 'text-indigo-600' : 'text-slate-300'">{{ page.ad_hits }}</span>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <span class="text-xs font-black text-slate-700">{{ page.avg_duration }}s</span>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <span class="text-xs font-black text-slate-700">{{ page.avg_clicks }}</span>
                            </td>
                            <td class="py-7 px-6">
                                <!-- SVG sparkline -->
                                <div class="flex items-center justify-center">
                                    <svg width="80" height="28" class="overflow-visible">
                                        <defs>
                                            <linearGradient :id="'sg'+idx" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
                                                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        <path v-if="sparklinePath(page.sparkline)" :d="sparklinePath(page.sparkline) + ' L80,28 L0,28 Z'"
                                            :fill="'url(#sg'+idx+')'" />
                                        <path :d="sparklinePath(page.sparkline)" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </td>
                            <td class="py-7 px-10 text-right">
                                <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black"
                                    :class="deltaBadgeClass(page.delta_pct)">
                                    {{ deltaIcon(page.delta_pct) }}
                                </span>
                                <p class="text-[9px] text-slate-400 font-bold mt-1.5 text-right">Today: {{ page.today_count }} / Yday: {{ page.yesterday_count }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="topPages.length === 0 && !isLoadingAnalytics" class="p-16 text-center">
                <p class="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">No page data yet — signals will appear as your pixel fires.</p>
            </div>
        </div>

        <!-- ══ Trend Velocity + Top Referrers ════════════════════════════ -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Rising & Falling -->
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Fastest Rising -->
                <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
                    <div class="flex items-center gap-3 mb-7">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">🚀</div>
                        <div>
                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Fastest Rising</p>
                            <p class="text-[9px] text-slate-400 font-bold">7-day growth vs prior 7 days</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div v-if="rising.length === 0" class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">Collecting velocity data...</div>
                        <div v-for="page in rising" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="flex items-center justify-between p-5 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border border-emerald-100/50 cursor-pointer transition-all group">
                            <div class="min-w-0 mr-4">
                                <p class="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{{ safePathLabel(page.page_url) }}</p>
                                <p class="text-[9px] text-slate-400 font-bold mt-0.5">{{ page.last7 }} hits this week</p>
                            </div>
                            <span class="shrink-0 text-[11px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                                ↑ +{{ page.delta_pct }}%
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Needs Attention -->
                <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
                    <div class="flex items-center gap-3 mb-7">
                        <div class="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg">📉</div>
                        <div>
                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Needs Attention</p>
                            <p class="text-[9px] text-slate-400 font-bold">Biggest drops vs prior week</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div v-if="falling.length === 0" class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">No declining pages detected.</div>
                        <div v-for="page in falling" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="flex items-center justify-between p-5 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl border border-rose-100/50 cursor-pointer transition-all group">
                            <div class="min-w-0 mr-4">
                                <p class="text-xs font-black text-slate-900 truncate group-hover:text-rose-700 transition-colors">{{ safePathLabel(page.page_url) }}</p>
                                <p class="text-[9px] text-slate-400 font-bold mt-0.5">{{ page.last7 }} hits this week</p>
                            </div>
                            <span class="shrink-0 text-[11px] font-black text-rose-600 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm">
                                ↓ {{ page.delta_pct }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Referrers -->
            <div class="lg:col-span-4 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl">
                <div class="flex items-center gap-3 mb-7">
                    <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    </div>
                    <div>
                        <p class="text-[11px] font-black text-white uppercase tracking-widest">Top Referrers</p>
                        <p class="text-[9px] text-slate-400 font-bold">Where your visitors came from</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div v-if="topReferers.length === 0" class="text-[10px] text-slate-600 font-black uppercase tracking-widest italic py-4 text-center">No referrer data yet.</div>
                    <div v-for="ref in topReferers" :key="ref.domain"
                        class="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0"></div>
                            <p class="text-[11px] font-black text-slate-200 truncate" :title="ref.domain">{{ safeHostname(ref.domain) || 'Direct / None' }}</p>
                        </div>
                        <span class="text-[10px] font-black text-slate-400 shrink-0 ml-3">{{ ref.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Middle: Snippet Generator & Campaign Tools ───────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-slate-900 p-12 shadow-2xl rounded-[3.5rem] border border-slate-800 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div class="flex items-center justify-between mb-10">
                    <h3 class="text-2xl font-black text-white flex items-center gap-4">
                        <span class="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                        </span>
                        Tracker Implementation
                    </h3>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-white/5 text-indigo-400 text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest">v3.1 Secure Handshake</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Traffic Isolation (Campaign ID)</label>
                        <input v-model="selectedCampaignId" placeholder="e.g. MetaPilot_Agency_001" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6" />
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Link</label>
                        <select v-model="selectedPropId" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer">
                            <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
                        </select>
                    </div>
                </div>

                <div class="bg-black/40 rounded-3xl p-8 border border-white/5 shadow-inner relative group">
                    <pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed">{{ snippet }}</pre>
                    <button @click="copySnippet" class="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 opacity-0 group-hover:opacity-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                </div>
                
                <div class="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-4 text-slate-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="text-[10px] font-medium leading-relaxed max-w-md">Every hit from this pixel will be permanently attributed to <span class="text-indigo-400 font-black">{{ selectedCampaignId || 'Default' }}</span> for campaign isolation.</p>
                    </div>
                    <button @click="showRegenModal = true" class="text-[10px] font-black text-rose-500 hover:text-white transition-colors uppercase tracking-widest">Regenerate Secret</button>
                </div>
            </div>

            <!-- Developer Console -->
            <div class="lg:col-span-4 bg-slate-100 p-10 rounded-[3.5rem] border border-slate-200">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Console Diagnostics</h3>
                <div class="space-y-6">
                    <div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-2">Inspect State</p>
                        <code class="text-[10px] font-black text-indigo-600 block mb-2">window.MetaPilot</code>
                        <p class="text-[9px] text-slate-500 italic">Verify handshake status, retry queue, and hit signatures live.</p>
                    </div>
                    <div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-2">Campaign Isolation</p>
                        <p class="text-[10px] font-black text-slate-700">MetaPilot Agencies drive traffic using <span class="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">data-campaign</span> to correctly differentiate their ads from organic traffic.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Signal Intelligence Log ──────────────────────────────────── -->
        <div id="intel-log" class="space-y-8">
            <div class="flex items-end justify-between gap-8">
                <div class="flex-1">
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight">Intelligence Log</h3>
                    <p class="text-slate-500 font-medium mt-1">Real-time attribution and behavioral forensics</p>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="downloadCsv" class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Export CSV
                    </button>
                    <div class="w-80 relative">
                        <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <input v-model="searchQuery" @keyup.enter="applyFilters" placeholder="Search Session, URL, City..." class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 pl-14 shadow-premium-soft" />
                    </div>
                </div>
            </div>

            <!-- Advanced Filter Bar -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium-soft flex flex-wrap items-center gap-6">
                <!-- Type -->
                <div class="flex-1 min-w-[150px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Type</label>
                    <select v-model="filters.type" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🌐 All Traffic</option>
                        <option value="ads">🎯 Ad Conversions</option>
                        <option value="organic">🌿 Organic Only</option>
                    </select>
                </div>
                <!-- Campaign -->
                <div class="flex-1 min-w-[200px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign ID</label>
                    <select v-model="filters.campaign_id" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🏷️ All Campaigns</option>
                        <option v-for="cap in availableCampaigns" :key="cap" :value="cap">{{ cap }}</option>
                    </select>
                </div>
                <!-- Device -->
                <div class="flex-1 min-w-[140px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Device</label>
                    <select v-model="filters.device" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">📱 All Devices</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Desktop">Desktop</option>
                        <option value="Tablet">Tablet</option>
                    </select>
                </div>
                <!-- Country -->
                <div class="flex-1 min-w-[140px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                    <select v-model="filters.country" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🌍 Global</option>
                        <option v-for="c in topCountries" :key="c.code" :value="c.code">{{ c.code }}</option>
                    </select>
                </div>
                <!-- Date Range -->
                <div class="flex-[1.5] min-w-[300px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                    <div class="flex items-center gap-2">
                        <input type="date" v-model="filters.start_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                        <span class="text-slate-300">→</span>
                        <input type="date" v-model="filters.end_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                    </div>
                </div>
            </div>

            <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr class="bg-slate-50/50">
                                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Journey</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Device</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Attribution</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="event in logResponse.data" :key="event.id"
                                @click="selectedSession = event"
                                class="group hover:bg-slate-50 transition-all cursor-pointer">
                                <td class="py-8 px-10">
                                    <div class="flex items-center gap-5">
                                        <div class="w-12 h-12 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all shadow-sm">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-slate-900 flex items-center gap-2">
                                                ID: {{ event.session_id ? event.session_id.substring(0, 10) : '—' }}
                                                <span v-if="event.gclid" class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                            </p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase tracking-tight mt-1">{{ new Date(event.created_at).toLocaleTimeString() }} · {{ event.created_at?.split('T')[0] }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-5">
                                        <div>
                                            <p class="text-xs font-black text-slate-900">{{ event.duration_seconds }}s</p>
                                            <p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell</p>
                                        </div>
                                        <div class="w-px h-8 bg-slate-100"></div>
                                        <div>
                                            <p class="text-xs font-black tracking-tighter" :class="event.click_count > 3 ? 'text-emerald-600' : 'text-slate-900'">+{{ event.click_count }}</p>
                                            <p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Clicks</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div>
                                        <p class="text-xs font-black text-slate-800 uppercase">{{ event.browser }} / {{ event.platform }}</p>
                                        <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{{ event.device_type }} · {{ event.screen_resolution }}</p>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">{{ event.country_code === 'US' ? '🇺🇸' : event.country_code === 'KE' ? '🇰🇪' : '🌍' }}</span>
                                        <div>
                                            <p class="text-[10px] font-black text-slate-800 uppercase">{{ event.city || 'Unknown' }}</p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.country_code }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-10 text-right">
                                    <div class="flex flex-col items-end gap-1.5">
                                        <div v-if="event.google_campaign_id" class="px-2.5 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm">{{ event.google_campaign_id }}</div>
                                        <div v-if="event.gclid" class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100">GCLID ACTIVE</div>
                                        <div class="text-[9px] text-slate-400 font-bold max-w-[150px] truncate" :title="event.referrer">{{ event.referrer ? safeHostname(event.referrer) : 'DIRECT' }}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span class="text-slate-900">{{ logResponse.from || 0 }}-{{ logResponse.to || 0 }}</span> of <span class="text-slate-900">{{ logResponse.total }}</span> signals
                    </p>
                    <div class="flex items-center gap-3">
                        <button 
                            @click="prevPage" 
                            :disabled="filters.page === 1 || isLoading"
                            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                        >
                            Prev
                        </button>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-slate-900">Page {{ filters.page }} of {{ logResponse.last_page }}</span>
                        </div>
                        <button 
                            @click="nextPage" 
                            :disabled="filters.page === logResponse.last_page || isLoading"
                            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div v-if="logResponse.data.length === 0" class="p-32 text-center">
                    <div class="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-2 border-dashed border-slate-200">
                        <svg class="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h4 class="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Silenced Signals</h4>
                    <p class="text-slate-500 max-w-sm mx-auto font-medium">Listening for pixel signals on the authorised domain. No active signals captured with current filters.</p>
                </div>
            </div>
        </div>

        <!-- ── Session Detail Modal ─────────────────────────────────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" @click="selectedSession = null"></div>
                <div class="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
                    <!-- Modal Header -->
                    <div class="p-14 border-b border-slate-100/50 flex items-center justify-between bg-white">
                        <div>
                            <div class="flex items-center gap-5">
                                <h3 class="text-4xl font-black text-slate-900 tracking-tight italic">Forensic Journey</h3>
                                <span class="px-5 py-1.5 bg-indigo-600 text-white text-[11px] font-black rounded-full uppercase tracking-widest shadow-2xl">
                                    {{ selectedSession?.session_id?.substring(0, 16) || 'ANONYMOUS' }}
                                </span>
                            </div>
                            <p class="text-slate-400 font-bold mt-3 text-xs uppercase tracking-widest">Digital forensics for attribution verification.</p>
                        </div>
                        <button @click="selectedSession = null" class="w-16 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-3xl transition-all flex items-center justify-center active:scale-90">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-14 bg-white">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            <!-- Left: Journey -->
                            <div class="lg:col-span-5 space-y-12">
                                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                                    <span class="w-10 h-0.5 bg-indigo-600"></span>Step-by-Step Signals
                                </h4>
                                <div class="space-y-10 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100">
                                    <div v-for="entry in sessionTimeline" :key="entry.id" class="relative pl-14 group">
                                        <div class="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 group-hover:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm">
                                            <div class="w-2 h-2 bg-slate-200 group-hover:bg-indigo-600 rounded-full transition-all"></div>
                                        </div>
                                        <p class="text-sm font-black text-slate-900 uppercase italic truncate" :title="entry.page_url">{{ entry.page_url?.split('/').pop() || 'Root Index' }}</p>
                                        <div class="flex items-center gap-4 mt-2">
                                            <span class="text-[10px] text-slate-400 font-black uppercase">{{ new Date(entry.created_at).toLocaleTimeString() }}</span>
                                            <span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded uppercase">{{ entry.duration_seconds }}s Stay</span>
                                            <span v-if="entry.click_count > 0" class="text-emerald-600 text-[9px] font-black uppercase tracking-widest">{{ entry.click_count }} Clicks</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Analytics -->
                            <div class="lg:col-span-7 space-y-12">
                                <div class="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 relative overflow-hidden">
                                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Engagement Peak Analysis</h4>
                                    <div class="h-64">
                                        <Line :data="sessionChartData" :options="modalChartOptions" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-8">
                                    <div class="space-y-4">
                                        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Origin</h5>
                                        <div class="space-y-3">
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Source</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.utm_source || 'DIRECT' }}</p>
                                            </div>
                                            <div class="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-indigo-400 uppercase mb-1">Campaign ID</p>
                                                <p class="text-xs font-black text-indigo-700 uppercase">{{ selectedSession.google_campaign_id || 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="space-y-4">
                                        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Spec</h5>
                                        <div class="space-y-3">
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Tech Stack</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.browser }} / {{ selectedSession.platform }}</p>
                                            </div>
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Canvas</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.screen_resolution }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Google Ads Verification</p>
                                    <p v-if="selectedSession.gclid" class="text-xs font-bold text-emerald-700 break-all leading-relaxed">
                                        Verified Google Ads lead with GCLID: <span class="font-black italic bg-white/50 px-1">{{ selectedSession.gclid }}</span>
                                    </p>
                                    <p v-else class="text-xs font-bold text-slate-400 italic uppercase tracking-tighter">No GCLID detected for this session.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- ── Regeneration Confirmation ────────── -->
        <ConfirmationModal
            :show="showRegenModal"
            title="Regenerate Site Token?"
            message="This action is irreversible. All current tracking scripts will stop working until updated with the new token."
            confirmText="Regenerate"
            @close="showRegenModal = false"
            @confirm="regenerateToken"
        />
    </div>
</template>
