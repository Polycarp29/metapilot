<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement,
  PointElement,
  LinearScale, 
  CategoryScale,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler)

const props = defineProps({
    organization: Object,
    properties: Array,
    propertyId: [Number, String],
    forecastData: Object
})

const snippet = ref('')
const events = ref([])
const isLoading = ref(false)
const isRegenerating = ref(false)
const selectedPropId = ref(props.propertyId || (props.properties?.[0]?.id))
const selectedCampaignId = ref('')

const siteToken = computed(() => props.organization?.ads_site_token)

const selectedProperty = computed(() => {
    return props.properties?.find(p => p.id == selectedPropId.value)
})

const fetchEvents = async () => {
    isLoading.value = true
    try {
        const response = await axios.get(route('google-ads.pixel-events'))
        events.value = response.data
    } catch (e) {
        console.error("Failed to fetch pixel events", e)
    } finally {
        isLoading.value = false
    }
}

const updateSnippet = () => {
    const baseUrl = window.location.origin
    const campaignAttr = selectedCampaignId.value ? ` data-campaign="${selectedCampaignId.value}"` : ''
    snippet.value = `<script src="${baseUrl}/cdn/ads-tracker.js" data-token="${siteToken.value}"${campaignAttr} async><\/script>`
}

const regenerateToken = async () => {
    if (!confirm('Regenerating the token will break all existing trackers. Continue?')) return
    
    isRegenerating.value = true
    try {
        await axios.post(route('google-ads.regenerate-token'))
        window.location.reload()
    } catch (e) {
        console.error("Failed to regenerate token", e)
    } finally {
        isRegenerating.value = false
    }
}

const copySnippet = () => {
    navigator.clipboard.writeText(snippet.value)
    alert('Snippet copied to clipboard!')
}

onMounted(() => {
    updateSnippet()
    fetchEvents()
})

watch([selectedPropId, selectedCampaignId, siteToken], updateSnippet)

// Analytics Chart for Hits
const hitsChartData = computed(() => {
    // If we have Prophet forecasts for 'ad_performance' containing pixel hits, use that.
    // Otherwise, simulate or use historical event counts.
    const labels = []
    const data = []
    
    // Fallback: Use last 7 days from events
    const counts = {}
    events.value.forEach(e => {
        const date = new Date(e.created_at).toLocaleDateString()
        counts[date] = (counts[date] || 0) + 1
    })
    
const sortedDates = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b))
    
    return {
        labels: sortedDates,
        datasets: [{
            label: 'Pixel Signals',
            data: sortedDates.map(d => counts[d]),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            fill: true,
            tension: 0.5,
            borderWidth: 4,
            pointRadius: 0,
            pointHitRadius: 20,
            hoverBorderWidth: 6,
            hoverBorderColor: '#4f46e5'
        }]
    }
})

const topCountries = computed(() => {
    const countries = {}
    events.value.forEach(e => {
        if (e.country_code) {
            countries[e.country_code] = (countries[e.country_code] || 0) + 1
        }
    })
    return Object.entries(countries)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
})

const deviceBreakdown = computed(() => {
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0 }
    events.value.forEach(e => {
        if (e.device_type && devices[e.device_type] !== undefined) {
            devices[e.device_type]++
        }
    })
    return devices
})

const searchQuery = ref('')
const selectedSession = ref(null)

const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value
    const q = searchQuery.value.toLowerCase()
    return events.value.filter(e => 
        e.page_url?.toLowerCase().includes(q) || 
        e.session_id?.toLowerCase().includes(q) ||
        (e.utm_campaign && e.utm_campaign.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q))
    )
})

const sessionTimeline = computed(() => {
    if (!selectedSession.value) return []
    return events.value
        .filter(e => e.session_id === selectedSession.value.session_id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const sessionChartData = computed(() => {
    if (!selectedSession.value) return null
    const timeline = sessionTimeline.value
    return {
        labels: timeline.map(e => new Date(e.created_at).toLocaleTimeString()),
        datasets: [
            {
                label: 'Engagement Signals',
                data: timeline.map(e => e.click_count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                fill: true,
                tension: 0.5,
                borderWidth: 3,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
    }
}
const safeHostname = (url) => {
    if (!url) return ''
    try {
        const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im)
        return match ? match[1] : url
    } catch (e) {
        return url
    }
}
</script>

<template>
    <div class="space-y-10 pb-20">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Developer Tools
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v2.0 Beta</span>
                </h2>
                <p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Implement advanced pixel tracking and monitor real-time signal performance through our global CDN infrastructure.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex -space-x-3">
                    <div v-for="i in 3" :key="i" class="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img :src="`https://ui-avatars.com/api/?name=Dev+${i}&background=random`" class="w-full h-full object-cover">
                    </div>
                </div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Active Implementation</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Left Column: Snippet Generator -->
            <div class="lg:col-span-7 space-y-8">
                <div class="bg-white p-1 shadow-premium rounded-[3rem] border border-slate-200/50 overflow-hidden relative group">
                    <div class="p-10">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-2xl font-black text-slate-900 flex items-center gap-4">
                                <span class="p-3 bg-indigo-600 text-white rounded-2xl shadow-indigo-200 shadow-lg">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                                </span>
                                CDN Tracker Generator
                            </h3>
                            <div class="p-1.5 bg-slate-100 rounded-xl flex items-center gap-2 px-4 border border-slate-200/50">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Ready</span>
                            </div>
                        </div>
                        
                        <p class="text-slate-500 text-sm mb-10 leading-relaxed max-w-md">
                            Standard MetaPilot tracking implementation. Automatically captures engagement signals, GCLIDs, and visitor attribution.
                        </p>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div class="space-y-3">
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope to Property</label>
                                <div class="relative group/select">
                                    <select v-model="selectedPropId" class="w-full bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 px-5 shadow-sm transition-all appearance-none cursor-pointer">
                                        <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
                                    </select>
                                    <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Tag (Optional)</label>
                                <input v-model="selectedCampaignId" placeholder="e.g. holiday_sale_2026" class="w-full bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 px-5 shadow-sm transition-all" />
                            </div>
                        </div>

                        <div class="relative group/code">
                            <div class="absolute -top-3 left-6 px-3 py-1 bg-slate-900 rounded-lg z-10">
                                <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Asynchronous Script</span>
                            </div>
                            <div class="bg-slate-900 rounded-3xl p-8 pt-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                                <pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed custom-scrollbar-dark pb-2">{{ snippet }}</pre>
                                
                                <div class="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CDN Serving: Cloudflare</span>
                                        </div>
                                    </div>
                                    <button 
                                        @click="copySnippet"
                                        class="flex items-center gap-2 bg-white/10 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 font-black text-[11px] uppercase tracking-widest active:scale-95"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        Copy Implementation
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="mt-10 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-white rounded-2xl shadow-sm">
                                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Global Authentication Token</p>
                                    <code class="text-xs font-black text-indigo-600">{{ siteToken }}</code>
                                </div>
                            </div>
                            <button 
                                @click="regenerateToken" 
                                :disabled="isRegenerating"
                                class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {{ isRegenerating ? 'Regenerating...' : 'Reset Token' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Live Analysis -->
            <div class="lg:col-span-5 space-y-8">
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100 relative group overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
                        <div class="relative">
                            <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </div>
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                            <h4 class="text-3xl font-black text-slate-900 tracking-tight">{{ events.length }}</h4>
                            <div class="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                Authenticated
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100 relative group overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8"></div>
                        <div class="relative">
                            <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Sessions</p>
                            <h4 class="text-3xl font-black text-slate-900 tracking-tight">{{ new Set(events.map(e => e.session_id)).size }}</h4>
                            <div class="mt-4 flex items-center gap-1.5 text-indigo-600 font-bold text-[10px]">
                                <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                Active Now
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-10 shadow-premium rounded-[3rem] border border-slate-100 relative group overflow-hidden">
                    <div class="flex items-center justify-between mb-10">
                        <h3 class="text-xl font-black text-slate-900 flex items-center gap-4">
                            <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            </span>
                            Pixel Signal Trends
                        </h3>
                    </div>

                    <div class="h-[240px] relative">
                        <div v-if="events.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <svg class="w-12 h-12 mb-4 animate-bounce opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                            <p class="text-[11px] font-black uppercase tracking-widest italic opacity-50">Waiting for signals...</p>
                        </div>
                        <Line :data="hitsChartData" :options="chartOptions" />
                    </div>
                </div>

                <!-- Geography & Devices Breakdown -->
                <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
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
                                <div v-if="topCountries.length === 0" class="text-[10px] text-slate-400 italic">Waiting for geo data...</div>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Device Usage</h4>
                            <div class="space-y-3">
                                <div v-for="(count, type) in deviceBreakdown" :key="type" class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <svg v-if="type === 'Mobile'" class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        <svg v-else-if="type === 'Desktop'" class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        <span class="text-[10px] font-bold text-slate-700">{{ type }}</span>
                                    </div>
                                    <span class="text-xs font-black text-slate-400">{{ count }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Event Log Section -->
        <div class="space-y-8">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight lh-tight">
                        Signal Intelligence Log
                    </h3>
                    <p class="text-slate-500 font-medium mt-1">Deep analytics on behavior, attribution, and visitor journey</p>
                </div>
                <div class="w-80 relative group">
                    <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        v-model="searchQuery" 
                        placeholder="Filter signals..." 
                        class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 pl-12 shadow-premium-soft transition-all"
                    />
                </div>
            </div>

            <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr class="bg-slate-50/50">
                                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Node / Temporal</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement Intensity</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Regional Attribution</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client Architecture</th>
                                <th class="py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ingress Point</th>
                                <th class="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr 
                                v-for="event in filteredEvents" 
                                :key="event.id" 
                                @click="selectedSession = event"
                                class="group hover:bg-indigo-50/30 transition-all cursor-pointer relative"
                            >
                                <td class="py-8 px-10">
                                    <div class="flex items-center gap-5">
                                        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <div>
                                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-tighter">SID: {{ event.session_id ? event.session_id.substring(0, 8) : 'ANONYMOUS' }}</p>
                                            <div class="flex items-center gap-2 mt-1">
                                                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{{ new Date(event.created_at).toLocaleTimeString() }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-6">
                                        <div class="flex flex-col">
                                            <span class="text-xs font-black text-slate-900 tracking-tight">{{ event.duration_seconds }}s</span>
                                            <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell Time</span>
                                        </div>
                                        <div class="w-px h-8 bg-slate-100"></div>
                                        <div class="flex flex-col">
                                            <span class="text-xs font-black text-indigo-600 tracking-tight">+{{ event.click_count }}</span>
                                            <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Signals</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner overflow-hidden border border-slate-200/50">
                                            <span>{{ event.country_code || '🌍' }}</span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight">{{ event.city || 'Undisclosed' }}</span>
                                            <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">{{ event.country_code || 'Global' }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-1.5 h-10 rounded-full" :class="event.device_type === 'Mobile' ? 'bg-indigo-500' : 'bg-slate-200'"></div>
                                        <div>
                                            <p class="text-[11px] font-black text-slate-800 uppercase tracking-tight">{{ event.browser }}</p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest">{{ event.platform }} / {{ event.device_type }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="max-w-[200px]">
                                        <p class="text-[11px] font-black text-slate-800 truncate uppercase tracking-tighter" :title="event.page_url">{{ event.page_url.split('/').pop() || '/' }}</p>
                                        <p class="text-[9px] text-slate-400 font-black truncate uppercase tracking-widest mt-1" :title="event.referrer">{{ event.referrer ? 'via ' + safeHostname(event.referrer) : 'Direct Entry' }}</p>
                                    </div>
                                </td>
                                <td class="py-8 px-10 text-right">
                                    <div class="flex items-center justify-end gap-4">
                                        <div v-if="event.gclid" class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 shadow-sm" title="Google Ads ID Present">GCLID</div>
                                        <div class="p-2.5 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="filteredEvents.length === 0" class="p-32 text-center">
                    <div class="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-slate-100 animate-pulse">
                        <svg class="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <h4 class="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">No Active Signals</h4>
                    <p class="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">System ready. Waiting for ingress traffic via global endpoints.</p>
                </div>
            </div>
        </div>

        <!-- Session Detail Modal -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" @click="selectedSession = null"></div>
                <div class="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[92vh] border border-white/50 animate-in fade-in zoom-in duration-300">
                    <!-- Modal Header -->
                    <div class="p-12 border-b border-slate-100/50 flex items-center justify-between bg-slate-50/30">
                        <div>
                            <div class="flex items-center gap-4">
                                <h3 class="text-3xl font-black text-slate-900 tracking-tight">Session Breakdown</h3>
                                <span class="px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-indigo-100 shadow-xl">{{ selectedSession.session_id.substring(0, 12) }}</span>
                            </div>
                            <p class="text-slate-500 font-medium mt-2">Correlating behavior patterns and attribution hierarchy.</p>
                        </div>
                        <button @click="selectedSession = null" class="p-5 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-400 rounded-3xl transition-all active:scale-95 group">
                            <svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <!-- Left: Journey Timeline -->
                            <div class="lg:col-span-4 space-y-8">
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                    <span class="w-8 h-px bg-slate-200"></span>
                                    Behavioral Journey
                                </h4>
                                <div class="space-y-8 relative before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                    <div v-for="(entry, idx) in sessionTimeline" :key="entry.id" class="relative pl-12 group/step">
                                        <div class="absolute left-0 top-1 w-[32px] h-[32px] bg-white border-4 border-slate-100 group-hover/step:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm">
                                            <div class="w-1.5 h-1.5 bg-slate-300 group-hover/step:bg-indigo-600 rounded-full transition-all"></div>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-slate-900 truncate uppercase mt-0.5" :title="entry.page_url">{{ entry.page_url.split('/').pop() || 'Node Root' }}</p>
                                            <p class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{{ new Date(entry.created_at).toLocaleTimeString() }} • {{ entry.duration_seconds }}s Engagement</p>
                                            <div v-if="entry.click_count > 0" class="mt-3 flex items-center gap-2">
                                                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100/50 uppercase">
                                                    {{ entry.click_count }} Active Signals
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Engagement Graph & Metadata -->
                            <div class="lg:col-span-8 space-y-12">
                                <div class="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100/50 shadow-inner relative overflow-hidden group">
                                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 px-2">Engagment Velocity Analytics</h4>
                                    <div class="h-72">
                                        <Line :data="sessionChartData" :options="chartOptions" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium-soft">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Traffic Hierarchy</p>
                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Engine</span>
                                                <span class="text-xs font-black text-slate-900 uppercase italic">{{ selectedSession.utm_source || 'Organic Nucleus' }}</span>
                                            </div>
                                            <div class="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl">
                                                <span class="text-[10px] font-bold text-slate-400 uppercase">Protocol</span>
                                                <span class="text-xs font-black text-slate-900 uppercase italic">{{ selectedSession.utm_campaign || 'Global Default' }}</span>
                                            </div>
                                            <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                                                <span class="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Referrer Host</span>
                                                <span class="text-xs font-black text-indigo-600 truncate block uppercase italic" :title="selectedSession.referrer">{{ selectedSession.referrer ? safeHostname(selectedSession.referrer) : 'DIRECT_ACCESS' }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-premium-soft">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Architecture Intelligence</p>
                                        <div class="space-y-4">
                                            <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                                <div>
                                                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Platform</p>
                                                    <p class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.platform }}</p>
                                                </div>
                                                <div class="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                </div>
                                            </div>
                                            <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                                <div>
                                                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Runtime</p>
                                                    <p class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.browser }}</p>
                                                </div>
                                                <div class="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
                                                </div>
                                            </div>
                                            <div class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                                <div>
                                                    <p class="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Display Matrix</p>
                                                    <p class="text-xs font-black text-slate-900 uppercase">{{ selectedSession.screen_resolution }}</p>
                                                </div>
                                                <div class="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                                                </div>
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

