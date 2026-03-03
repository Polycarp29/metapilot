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

let eventsInterval = null
let connInterval   = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const siteToken = computed(() => props.organization?.ads_site_token)

const selectedProperty = computed(() =>
    props.properties?.find(p => p.id == selectedPropId.value)
)

const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value
    const q = searchQuery.value.toLowerCase()
    return events.value.filter(e =>
        e.page_url?.toLowerCase().includes(q) ||
        e.session_id?.toLowerCase().includes(q) ||
        e.utm_campaign?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q)
    )
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

const hitsChartData = computed(() => {
    const counts = {}
    events.value.forEach(e => {
        const d = new Date(e.created_at).toLocaleDateString()
        counts[d] = (counts[d] || 0) + 1
    })
    const dates = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b))
    return {
        labels: dates,
        datasets: [{
            label: 'Pixel Signals',
            data: dates.map(d => counts[d]),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.08)',
            fill: true, tension: 0.5, borderWidth: 4,
            pointRadius: 0, pointHitRadius: 20
        }]
    }
})

const topCountries = computed(() => {
    const c = {}
    events.value.forEach(e => { if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1 })
    return Object.entries(c).map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5)
})

const deviceBreakdown = computed(() => {
    const d = { Mobile: 0, Desktop: 0, Tablet: 0 }
    events.value.forEach(e => { if (e.device_type && d[e.device_type] !== undefined) d[e.device_type]++ })
    return d
})

// Pixel status derived from connectionStatus API or local event count as fallback
const pixelStatusBadge = computed(() => {
    const cs = connectionStatus.value
    if (cs) {
        if (cs.status === 'verified_active')   return { label: 'Verified & Active',   color: 'emerald', icon: '✓' }
        if (cs.status === 'connected_inactive') return { label: 'Connected – Inactive', color: 'amber',   icon: '○' }
        return { label: 'Not Detected', color: 'rose', icon: '✕' }
    }
    // Fallback: derive from local events
    const recent = events.value.some(e => new Date(e.created_at) > new Date(Date.now() - 86400000))
    if (recent) return { label: 'Connected & Active', color: 'emerald', icon: '✓' }
    if (events.value.length) return { label: 'Connected – Inactive', color: 'amber', icon: '○' }
    return { label: 'Not Detected', color: 'rose', icon: '✕' }
})

const chartOptions = {
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
    <div class="space-y-10 pb-20">
        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Developer Tools
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v3.0</span>
                </h2>
                <p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Implement advanced pixel tracking with security, domain pinning, and real-time signal intelligence.</p>
            </div>
            <!-- Live Status Pill -->
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

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- ── Left: Snippet Generator ────────────────────────────── -->
            <div class="lg:col-span-7 space-y-8">
                <div class="bg-white p-1 shadow-premium rounded-[3rem] border border-slate-200/50 overflow-hidden">
                    <div class="p-10">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-2xl font-black text-slate-900 flex items-center gap-4">
                                <span class="p-3 bg-indigo-600 text-white rounded-2xl shadow-indigo-200 shadow-lg">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                                </span>
                                CDN Tracker Generator
                            </h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div class="space-y-3">
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope to Property</label>
                                <div class="relative">
                                    <select v-model="selectedPropId" class="w-full bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 px-5 appearance-none cursor-pointer">
                                        <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
                                    </select>
                                    <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Tag (Optional)</label>
                                <input v-model="selectedCampaignId" placeholder="e.g. holiday_sale_2026" class="w-full bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 px-5" />
                            </div>
                        </div>

                        <!-- Code block -->
                        <div class="relative">
                            <div class="absolute -top-3 left-6 px-3 py-1 bg-slate-900 rounded-lg z-10">
                                <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest">v3.0 • HMAC Signed • Retry Queue</span>
                            </div>
                            <div class="bg-slate-900 rounded-3xl p-8 pt-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                                <pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed pb-2">{{ snippet }}</pre>
                                <div class="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
                                    <div class="flex items-center gap-3 flex-wrap">
                                        <span class="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>HMAC-SHA256
                                        </span>
                                        <span class="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                            <span class="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>Retry Queue
                                        </span>
                                        <span class="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>Async
                                        </span>
                                    </div>
                                    <button @click="copySnippet" class="flex items-center gap-2 bg-white/10 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 font-black text-[11px] uppercase tracking-widest active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Token row -->
                        <div class="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-white rounded-2xl shadow-sm">
                                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Site Token (HMAC Key)</p>
                                    <code class="text-xs font-black text-indigo-600">{{ siteToken }}</code>
                                </div>
                            </div>
                            <button @click="regenerateToken" :disabled="isRegenerating" class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                {{ isRegenerating ? 'Regenerating...' : 'Reset Token' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ── Developer Console Hint ──────────────────────── -->
                <div class="bg-slate-900 rounded-[2rem] p-8 border border-slate-800">
                    <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Browser Console Debug</p>
                    <pre class="text-emerald-400 text-xs font-mono leading-relaxed">// After the pixel fires, run in your browser console:
window.MetaPilot
// Returns: { version, token, status, connected, hitCount, lastHit, retryQueue }</pre>
                </div>
            </div>

            <!-- ── Right: Stats + Connection Panel + Charts ───────────── -->
            <div class="lg:col-span-5 space-y-8">
                <!-- Stats row -->
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
                        <div class="relative">
                            <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </div>
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                            <h4 class="text-3xl font-black text-slate-900 tracking-tight">{{ connectionStatus?.total_hits ?? events.length }}</h4>
                            <div class="mt-3 text-[10px] font-black text-emerald-600">{{ connectionStatus?.hits_last_24h ?? '—' }} in last 24h</div>
                        </div>
                    </div>
                    <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8"></div>
                        <div class="relative">
                            <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </div>
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Sessions</p>
                            <h4 class="text-3xl font-black text-slate-900 tracking-tight">{{ new Set(events.map(e => e.session_id)).size }}</h4>
                            <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-indigo-600">
                                <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>Unique IDs
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Pixel Connection Panel ──────────────────────── -->
                <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100 space-y-6">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-black text-slate-900 flex items-center gap-3">
                            <span class="p-2.5 rounded-2xl"
                                :class="{
                                    'bg-emerald-50 text-emerald-600': pixelStatusBadge.color === 'emerald',
                                    'bg-amber-50 text-amber-600': pixelStatusBadge.color === 'amber',
                                    'bg-rose-50 text-rose-600': pixelStatusBadge.color === 'rose',
                                }">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            </span>
                            Pixel Connection
                        </h3>
                        <button @click="runConnectionTest" :disabled="isTestingConn"
                            class="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            :class="isTestingConn ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'">
                            {{ isTestingConn ? 'Testing...' : 'Run Test' }}
                        </button>
                    </div>

                    <!-- Domain input -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorised Domain</label>
                        <div class="flex gap-3">
                            <input v-model="allowedDomainInput" placeholder="example.com" class="flex-1 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-3.5 px-5" />
                            <button @click="saveAllowedDomain" :disabled="isSavingDomain"
                                class="px-5 py-3.5 bg-slate-900 text-white text-[10px] font-black rounded-2xl hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap uppercase tracking-widest">
                                {{ isSavingDomain ? '...' : 'Save' }}
                            </button>
                        </div>
                        <p v-if="domainSavedMsg" class="text-[10px] font-bold text-emerald-600 pl-1">{{ domainSavedMsg }}</p>
                        <p class="text-[10px] text-slate-400 pl-1">Hits from other domains will be rejected (403).</p>
                    </div>

                    <!-- Connection results -->
                    <div v-if="connectionStatus" class="space-y-3 border-t border-slate-100 pt-5">
                        <!-- Status row -->
                        <div class="flex items-center justify-between p-4 rounded-2xl"
                            :class="{
                                'bg-emerald-50': pixelStatusBadge.color === 'emerald',
                                'bg-amber-50': pixelStatusBadge.color === 'amber',
                                'bg-rose-50': pixelStatusBadge.color === 'rose',
                            }">
                            <span class="text-[10px] font-black uppercase tracking-widest"
                                :class="{
                                    'text-emerald-700': pixelStatusBadge.color === 'emerald',
                                    'text-amber-700': pixelStatusBadge.color === 'amber',
                                    'text-rose-700': pixelStatusBadge.color === 'rose',
                                }">{{ pixelStatusBadge.label }}</span>
                            <svg v-if="pixelStatusBadge.color === 'emerald'" class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="p-4 bg-slate-50 rounded-2xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Signal</p>
                                <p class="text-xs font-black text-slate-900">{{ fmt(connectionStatus.last_hit_at) }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-2xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">24h Hits</p>
                                <p class="text-xs font-black text-indigo-600">{{ connectionStatus.hits_last_24h }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-2xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain Verified</p>
                                <p class="text-xs font-black" :class="connectionStatus.pixel_verified ? 'text-emerald-600' : 'text-slate-400'">
                                    {{ connectionStatus.pixel_verified ? 'Yes' : 'Pending' }}
                                </p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-2xl">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Security</p>
                                <p class="text-xs font-black text-emerald-600">HMAC-256 Active</p>
                            </div>
                        </div>
                        <div v-if="connectionStatus.last_hit_domain" class="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/50">
                            <p class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Last Signal From</p>
                            <p class="text-xs font-black text-indigo-700 truncate">{{ connectionStatus.last_hit_domain }}</p>
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div v-else class="text-center py-6 text-slate-400">
                        <p class="text-[11px] font-black uppercase tracking-widest">Click "Run Test" to check connection</p>
                    </div>
                </div>

                <!-- Chart -->
                <div class="bg-white p-10 shadow-premium rounded-[3rem] border border-slate-100 relative overflow-hidden">
                    <h3 class="text-xl font-black text-slate-900 flex items-center gap-4 mb-8">
                        <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        </span>
                        Signal Trends
                    </h3>
                    <div class="h-[200px] relative">
                        <div v-if="events.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <p class="text-[11px] font-black uppercase tracking-widest italic opacity-50">Waiting for signals...</p>
                        </div>
                        <Line :data="hitsChartData" :options="chartOptions" />
                    </div>
                </div>

                <!-- Geo & Devices -->
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
                    <div class="grid grid-cols-2 gap-8">
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Geography</h4>
                            <div class="space-y-3">
                                <div v-for="geo in topCountries" :key="geo.code" class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">{{ geo.code === 'US' ? '🇺🇸' : geo.code === 'GB' ? '🇬🇧' : geo.code === 'CA' ? '🇨🇦' : '🌍' }}</span>
                                        <span class="text-xs font-bold text-slate-700">{{ geo.code }}</span>
                                    </div>
                                    <span class="text-xs font-black text-slate-400">{{ geo.count }}</span>
                                </div>
                                <div v-if="topCountries.length === 0" class="text-[10px] text-slate-400 italic">Waiting...</div>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Devices</h4>
                            <div class="space-y-3">
                                <div v-for="(count, type) in deviceBreakdown" :key="type" class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-700">{{ type }}</span>
                                    <span class="text-xs font-black text-slate-400">{{ count }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Signal Intelligence Log ──────────────────────────────────── -->
        <div class="space-y-8">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight">Signal Intelligence Log</h3>
                    <p class="text-slate-500 font-medium mt-1">Deep analytics on behavior, attribution, and visitor journey</p>
                </div>
                <div class="w-80 relative">
                    <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <input v-model="searchQuery" placeholder="Filter signals..." class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 pl-12 shadow-premium-soft" />
                </div>
            </div>

            <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr class="bg-slate-50/50">
                                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor / Time</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Page</th>
                                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Tags</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="event in filteredEvents" :key="event.id"
                                @click="selectedSession = event"
                                class="group hover:bg-indigo-50/30 transition-all cursor-pointer">
                                <td class="py-6 px-10">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                        </div>
                                        <div>
                                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-tighter">SID: {{ event.session_id ? event.session_id.substring(0, 8) : 'ANONYMOUS' }}</p>
                                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{{ new Date(event.created_at).toLocaleTimeString() }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-6">
                                    <div class="flex items-center gap-4">
                                        <div class="flex flex-col">
                                            <span class="text-xs font-black text-slate-900">{{ event.duration_seconds }}s</span>
                                            <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell</span>
                                        </div>
                                        <div class="w-px h-6 bg-slate-100"></div>
                                        <div class="flex flex-col">
                                            <span class="text-xs font-black text-indigo-600">+{{ event.click_count }}</span>
                                            <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Clicks</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-6">
                                    <div class="flex items-center gap-2">
                                        <span class="text-base">{{ event.country_code === 'US' ? '🇺🇸' : event.country_code === 'GB' ? '🇬🇧' : '🌍' }}</span>
                                        <div>
                                            <p class="text-[10px] font-black text-slate-800 uppercase">{{ event.city || 'Unknown' }}</p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.country_code || 'Global' }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-1.5 h-8 rounded-full" :class="event.device_type === 'Mobile' ? 'bg-indigo-500' : 'bg-slate-200'"></div>
                                        <div>
                                            <p class="text-[11px] font-black text-slate-800 uppercase">{{ event.browser }}</p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.platform }} / {{ event.device_type }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-6">
                                    <div class="max-w-[200px]">
                                        <p class="text-[11px] font-black text-slate-800 truncate uppercase" :title="event.page_url">{{ event.page_url?.split('/').pop() || '/' }}</p>
                                        <p class="text-[9px] text-slate-400 font-black truncate uppercase mt-0.5">{{ event.referrer ? 'via ' + safeHostname(event.referrer) : 'Direct' }}</p>
                                    </div>
                                </td>
                                <td class="py-6 px-10 text-right">
                                    <div class="flex items-center justify-end gap-3">
                                        <div v-if="event.gclid" class="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg border border-indigo-100">GCLID</div>
                                        <div class="p-2 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="filteredEvents.length === 0" class="p-24 text-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 animate-pulse">
                        <svg class="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <h4 class="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">No Active Signals</h4>
                    <p class="text-slate-500 max-w-sm mx-auto font-medium">Install the pixel snippet and verify the domain to start receiving signals.</p>
                </div>
            </div>
        </div>

        <!-- ── Session Detail Modal ─────────────────────────────────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" @click="selectedSession = null"></div>
                <div class="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[92vh] border border-white/50">
                    <!-- Modal Header -->
                    <div class="p-12 border-b border-slate-100/50 flex items-center justify-between bg-slate-50/30">
                        <div>
                            <div class="flex items-center gap-4">
                                <h3 class="text-3xl font-black text-slate-900 tracking-tight">Session Breakdown</h3>
                                <span class="px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-indigo-100 shadow-xl">
                                    {{ selectedSession?.session_id ? selectedSession.session_id.substring(0, 12) : 'ANONYMOUS' }}
                                </span>
                            </div>
                            <p class="text-slate-500 font-medium mt-2">Behavior patterns and attribution hierarchy.</p>
                        </div>
                        <button @click="selectedSession = null" class="p-5 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-400 rounded-3xl transition-all active:scale-95 group">
                            <svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-12">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <!-- Journey Timeline -->
                            <div class="lg:col-span-4 space-y-8">
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                    <span class="w-8 h-px bg-slate-200"></span>Behavioral Journey
                                </h4>
                                <div class="space-y-6 relative before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                    <div v-for="entry in sessionTimeline" :key="entry.id" class="relative pl-12 group/step">
                                        <div class="absolute left-0 top-1 w-8 h-8 bg-white border-4 border-slate-100 group-hover/step:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm">
                                            <div class="w-1.5 h-1.5 bg-slate-300 group-hover/step:bg-indigo-600 rounded-full transition-all"></div>
                                        </div>
                                        <p class="text-xs font-black text-slate-900 truncate uppercase" :title="entry.page_url">{{ entry.page_url?.split('/').pop() || 'Root' }}</p>
                                        <p class="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">{{ new Date(entry.created_at).toLocaleTimeString() }} · {{ entry.duration_seconds }}s</p>
                                        <div v-if="entry.click_count > 0" class="mt-2">
                                            <span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100/50 uppercase">{{ entry.click_count }} clicks</span>
                                        </div>
                                    </div>
                                    <div v-if="sessionTimeline.length === 0" class="text-[10px] text-slate-400 pl-2">Single page visit</div>
                                </div>
                            </div>

                            <!-- Engagement Graph + Metadata -->
                            <div class="lg:col-span-8 space-y-10">
                                <div class="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100/50 shadow-inner">
                                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Engagement Velocity</h4>
                                    <div class="h-60">
                                        <Line :data="sessionChartData" :options="chartOptions" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Traffic Hierarchy -->
                                    <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium-soft">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Traffic Hierarchy</p>
                                        <div class="space-y-3">
                                            <div class="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Source</span>
                                                <span class="text-xs font-black text-slate-900 italic">{{ selectedSession.utm_source || 'Organic' }}</span>
                                            </div>
                                            <div class="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Campaign</span>
                                                <span class="text-xs font-black text-slate-900 italic">{{ selectedSession.utm_campaign || 'Default' }}</span>
                                            </div>
                                            <div class="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/50">
                                                <span class="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Referrer</span>
                                                <span class="text-xs font-black text-indigo-600 truncate block italic" :title="selectedSession.referrer">{{ selectedSession.referrer ? safeHostname(selectedSession.referrer) : 'DIRECT' }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Architecture -->
                                    <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium-soft">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Client Architecture</p>
                                        <div class="space-y-3">
                                            <div class="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Platform</span>
                                                <span class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.platform }}</span>
                                            </div>
                                            <div class="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Browser</span>
                                                <span class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.browser }}</span>
                                            </div>
                                            <div class="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Resolution</span>
                                                <span class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.screen_resolution }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
