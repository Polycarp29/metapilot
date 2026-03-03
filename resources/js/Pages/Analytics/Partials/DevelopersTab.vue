<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  LineElement, PointElement, LinearScale, CategoryScale, Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler)

const props = defineProps({
    organization: Object,
    properties: Array,
    propertyId: [Number, String],
    forecastData: Object
})

// ─── State ────────────────────────────────────────────────────────────────────
const snippet            = ref('')
const events             = ref([])
const isLoading          = ref(false)
const isRegenerating     = ref(false)
const isTestingConn      = ref(false)
const isSavingDomain     = ref(false)
const selectedPropId     = ref(props.propertyId || props.properties?.[0]?.id)
const selectedCampaignId = ref('')
const selectedSession    = ref(null)
const searchQuery        = ref('')
const connectionStatus   = ref(null)
const allowedDomainInput = ref(props.organization?.allowed_domain || '')
const domainSavedMsg     = ref('')
// Filter for log and chart
const campaignFilter     = ref('all')

let eventsInterval = null
let connInterval   = null

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
    events.value.forEach(e => { if (e.google_campaign_id) caps.add(e.google_campaign_id) })
    return Array.from(caps)
})

const sessionTimeline = computed(() => {
    if (!selectedSession.value) return []
    return events.value
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
    
    events.value.forEach(e => {
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
    events.value.forEach(e => { if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1 })
    return Object.entries(c).map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count).slice(0, 8)
})

const deviceBreakdown = computed(() => {
    const d = { Mobile: 0, Desktop: 0, Tablet: 0 }
    events.value.forEach(e => { if (e.device_type && d[e.device_type] !== undefined) d[e.device_type]++ })
    return d
})

const avgClicks = computed(() => {
    const ads = events.value.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id)
    if (ads.length === 0) return 0
    const total = ads.reduce((sum, e) => sum + (e.click_count || 0), 0)
    return (total / ads.length).toFixed(1)
})

const pixelStatusBadge = computed(() => {
    const cs = connectionStatus.value
    if (cs) {
        if (cs.status === 'verified_active')   return { label: 'Verified & Active',   color: 'emerald', icon: '✓' }
        if (cs.status === 'connected_inactive') return { label: 'Connected – Inactive', color: 'amber',   icon: '○' }
        return { label: 'Not Detected', color: 'rose', icon: '✕' }
    }
    const recent = events.value.some(e => new Date(e.created_at) > new Date(Date.now() - 86400000))
    if (recent) return { label: 'Connected & Active', color: 'emerald', icon: '✓' }
    if (events.value.length) return { label: 'Connected – Inactive', color: 'amber', icon: '○' }
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
        const r = await axios.get(route('google-ads.pixel-events'))
        events.value = r.data
    } catch (e) {
        console.error('Failed to fetch pixel events', e)
    } finally {
        isLoading.value = false
    }
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
        fetchConnectionStatus()
    } catch (e) {
        domainSavedMsg.value = 'Error saving domain.'
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
    if (!confirm('Regenerating the token will break all existing trackers. Continue?')) return
    isRegenerating.value = true
    try {
        await axios.post(route('google-ads.regenerate-token'))
        window.location.reload()
    } catch (e) {
        console.error('Failed to regenerate token', e)
    } finally {
        isRegenerating.value = false
    }
}

const copySnippet = () => {
    navigator.clipboard.writeText(snippet.value)
    alert('Snippet copied!')
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
    eventsInterval = setInterval(fetchEvents, 60000)
    connInterval   = setInterval(fetchConnectionStatus, 30000)
})

onUnmounted(() => {
    clearInterval(eventsInterval)
    clearInterval(connInterval)
})

watch([selectedPropId, selectedCampaignId, siteToken], updateSnippet)
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
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Reach</p>
                    <h4 class="text-4xl font-black text-slate-900 tracking-tight">{{ events.length }}</h4>
                    <div class="mt-3 text-[10px] font-black text-slate-400">{{ connectionStatus?.hits_last_24h ?? '—' }} in last 24h</div>
                </div>
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ad Conversions</p>
                    <h4 class="text-4xl font-black text-indigo-600 tracking-tight">{{ events.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id).length }}</h4>
                    <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-indigo-500">
                        Targeted Traffic
                    </div>
                </div>
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
                                <div class="h-full bg-indigo-500 rounded-full" :style="{ width: events.length > 0 ? (count / events.length * 100) + '%' : '0%' }"></div>
                            </div>
                            <span class="text-[10px] font-black text-slate-900">{{ count }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Full Width Signal chart ─────────────────────────────── -->
        <div class="bg-white p-12 shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative">
            <div class="flex items-center justify-between mb-10">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Traffic Signal Trends
                        <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100">Live</span>
                    </h3>
                    <p class="text-slate-400 font-medium text-xs mt-1">Daily reach vs Attribution funnel (GCLID/Campaign hits)</p>
                </div>
                <div class="flex gap-4">
                    <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                        <span class="text-[10px] font-black text-slate-500 uppercase">Total Reach</span>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">Ad Conversions</span>
                    </div>
                </div>
            </div>
            <div class="h-[450px] relative">
                <div v-if="events.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm z-10">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-pulse mb-4">
                        <svg class="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <p class="text-[11px] font-black uppercase tracking-widest italic opacity-50">Listening for signals...</p>
                </div>
                <Line :data="hitsChartData" :options="mainChartOptions" />
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
                    <button @click="regenerateToken" class="text-[10px] font-black text-rose-500 hover:text-white transition-colors uppercase tracking-widest">Regenerate Secret</button>
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
        <div class="space-y-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-8">
                    <div>
                        <h3 class="text-3xl font-black text-slate-900 tracking-tight">Intelligence Log</h3>
                        <p class="text-slate-500 font-medium mt-1">Real-time attribution and behavioral forensics</p>
                    </div>
                    <!-- Agency Logic: Campaign Filter -->
                    <div class="relative min-w-[200px]">
                        <select v-model="campaignFilter" class="w-full bg-indigo-50 border-indigo-100 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[10px] font-black text-indigo-700 py-3.5 px-6 appearance-none uppercase tracking-widest cursor-pointer">
                            <option value="all">🌐 All Campaigns</option>
                            <option v-for="cap in availableCampaigns" :key="cap" :value="cap">🏷️ {{ cap }}</option>
                        </select>
                        <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                    </div>
                </div>
                <div class="w-80 relative">
                    <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <input v-model="searchQuery" placeholder="Filter deep signals..." class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 pl-14 shadow-premium-soft" />
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
                            <tr v-for="event in filteredEvents" :key="event.id"
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
                <div v-if="filteredEvents.length === 0" class="p-32 text-center">
                    <div class="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-2 border-dashed border-slate-200">
                        <svg class="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h4 class="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Silenced Signals</h4>
                    <p class="text-slate-500 max-w-sm mx-auto font-medium">Listening for pixel signals on the authorised domain. No active signals captured for this campaign filter.</p>
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
    </div>
</template>
