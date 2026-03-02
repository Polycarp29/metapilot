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
            label: 'Pixel Hits',
            data: sortedDates.map(d => counts[d]),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#fff'
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
    if (!selectedSession.value) return null
    const timeline = sessionTimeline.value
    return {
        labels: timeline.map(e => new Date(e.created_at).toLocaleTimeString()),
        datasets: [
            {
                label: 'Clicks',
                data: timeline.map(e => e.click_count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Time (s)',
                data: timeline.map(e => e.duration_seconds),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
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
</script>

<template>
    <div class="space-y-10 pb-20">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Developer Tools</h2>
                <p class="text-slate-500 font-medium mt-1">Implement tracking and monitor pixel performance</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Snippet Generator -->
            <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
                <h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    </span>
                    CDN Tracker Generator
                </h3>
                
                <p class="text-slate-500 text-sm mb-8 leading-relaxed">
                    Embed this script on your landing pages to track ad-driven traffic directly into MetaPilot.
                    It automatically captures GCLIDs and UTM parameters.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scope to Property</label>
                        <select v-model="selectedPropId" class="w-full bg-slate-50 border-transparent focus:border-blue-500 focus:ring-0 rounded-xl text-xs font-bold text-slate-700 py-3 shadow-inner">
                            <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Optional Campaign Tag</label>
                        <input v-model="selectedCampaignId" placeholder="e.g. spring_sale_2024" class="w-full bg-slate-50 border-transparent focus:border-blue-500 focus:ring-0 rounded-xl text-xs font-bold text-slate-700 py-3 px-4 shadow-inner" />
                    </div>
                </div>

                <div class="relative group">
                    <pre class="bg-slate-900 text-slate-300 p-6 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner leading-normal">{{ snippet }}</pre>
                    <button 
                        @click="copySnippet"
                        class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors border border-white/10"
                        title="Copy to clipboard"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>

                <div class="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization Site Token</p>
                        <code class="text-xs font-bold text-slate-700">{{ siteToken }}</code>
                    </div>
                    <button 
                        @click="regenerateToken" 
                        :disabled="isRegenerating"
                        class="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                    >
                        {{ isRegenerating ? 'Regenerating...' : 'Regenerate Token' }}
                    </button>
                </div>
            </div>

            <!-- Hit Trends (Prophet Analysis) -->
            <div class="space-y-8">
                <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            </span>
                            Pixel Signal Analytics
                        </h3>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Signals</span>
                        </div>
                    </div>

                    <div class="h-48 mb-8">
                        <Line :data="hitsChartData" :options="chartOptions" />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hits</p>
                            <p class="text-2xl font-black text-slate-900">{{ events.length }}</p>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Sessions</p>
                            <p class="text-2xl font-black text-blue-600">{{ new Set(events.map(e => e.session_id)).size }}</p>
                        </div>
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

        <!-- Event Log -->
        <div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
            <div class="p-10 border-b border-slate-100 flex items-center justify-between flex-wrap gap-6">
                <div>
                    <h3 class="text-2xl font-black text-slate-900">Pixel Event Log</h3>
                    <p class="text-slate-500 font-medium mt-1">Real-time tracking hits with enriched behavioral metadata</p>
                </div>
                <div class="flex-1 max-w-md relative group">
                    <input 
                        v-model="searchQuery" 
                        placeholder="Search URL, Session, or Campaign..." 
                        class="w-full bg-slate-50 border-transparent focus:border-blue-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-700 py-4 pl-12 shadow-inner"
                    />
                    <svg class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/50">
                        <tr>
                            <th class="py-6 pl-10 text-xs font-black text-slate-400 uppercase tracking-widest">User / Session</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Behavior</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Device</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Page / Referrer</th>
                            <th class="py-6 pr-10 text-xs font-black text-slate-400 uppercase tracking-widest text-right">GCLID</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr 
                            v-for="event in filteredEvents" 
                            :key="event.id" 
                            @click="selectedSession = event"
                            class="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                        >
                            <td class="py-6 pl-10">
                                <p class="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">Session: {{ event.session_id ? event.session_id.substring(0, 8) : 'Anon' }}</p>
                                <p class="text-[10px] text-slate-400 font-medium mt-1">{{ new Date(event.created_at).toLocaleString() }}</p>
                            </td>
                            <td class="py-6">
                                <div class="flex items-center gap-3">
                                    <div class="flex flex-col">
                                        <span class="text-[10px] font-black text-slate-700">{{ event.duration_seconds }}s</span>
                                        <span class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Stay</span>
                                    </div>
                                    <div class="w-px h-6 bg-slate-100"></div>
                                    <div class="flex flex-col">
                                        <span class="text-[10px] font-black text-slate-700">{{ event.click_count }}</span>
                                        <span class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Clicks</span>
                                    </div>
                                </div>
                            </td>
                            <td class="py-6 whitespace-nowrap">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm">{{ event.country_code || '🌍' }}</span>
                                    <span class="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{{ event.city || 'Unknown' }}</span>
                                </div>
                            </td>
                            <td class="py-6">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-black text-slate-700">{{ event.browser }}</span>
                                    <span class="text-[9px] text-slate-400 uppercase tracking-tighter">{{ event.platform }}</span>
                                </div>
                            </td>
                            <td class="py-6">
                                <p class="text-xs font-bold text-slate-900 truncate max-w-[150px]" :title="event.page_url">{{ event.page_url.split('/').pop() || '/' }}</p>
                                <p class="text-[10px] text-slate-400 truncate max-w-[150px]" :title="event.referrer">{{ event.referrer ? 'via ' + (new URL(event.referrer).hostname) : 'Direct' }}</p>
                            </td>
                            <td class="py-6 pr-10 text-right">
                                <span v-if="event.gclid" class="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg border border-amber-100" :title="event.gclid">
                                    {{ event.gclid.substring(0, 8) }}...
                                </span>
                                <span v-else class="text-slate-300">-</span>
                            </td>
                        </tr>
                        <tr v-if="filteredEvents.length === 0 && !isLoading">
                            <td colspan="6" class="py-20 text-center">
                                <p class="text-slate-400 font-bold italic">No pixel events match your search.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Session Detail Modal -->
        <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="selectedSession = null"></div>
            <div class="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <!-- Modal Header -->
                <div class="p-10 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-3">
                            <h3 class="text-2xl font-black text-slate-900">Session Breakdown</h3>
                            <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">{{ selectedSession.session_id }}</span>
                        </div>
                        <p class="text-slate-500 font-medium mt-1">Detailed behavioral journey and engagement metrics</p>
                    </div>
                    <button @click="selectedSession = null" class="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <!-- Left: Journey Timeline -->
                        <div class="lg:col-span-1 space-y-6">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Visitor Journey</h4>
                            <div class="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                <div v-for="(entry, idx) in sessionTimeline" :key="entry.id" class="relative pl-8">
                                    <div class="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
                                        <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <div>
                                        <p class="text-xs font-black text-slate-900 truncate" :title="entry.page_url">{{ entry.page_url.split('/').pop() || 'Home' }}</p>
                                        <p class="text-[10px] text-slate-400 font-bold mt-0.5">{{ new Date(entry.created_at).toLocaleTimeString() }} • {{ entry.duration_seconds }}s stay</p>
                                        <div v-if="entry.click_count > 0" class="mt-2 flex items-center gap-1.5">
                                            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md border border-emerald-100">
                                                {{ entry.click_count }} CLICKS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Engagement Graph & Metadata -->
                        <div class="lg:col-span-2 space-y-10">
                            <div class="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                                <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Session Engagement over time</h4>
                                <div class="h-64">
                                    <Line :data="sessionChartData" :options="chartOptions" />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Traffic Attribution</p>
                                    <div class="space-y-3">
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Source</span>
                                            <span class="text-xs font-black text-slate-900">{{ selectedSession.utm_source || 'Direct' }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Campaign</span>
                                            <span class="text-xs font-black text-slate-900">{{ selectedSession.utm_campaign || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Referrer</span>
                                            <span class="text-xs font-black text-slate-900 truncate max-w-[120px]" :title="selectedSession.referrer">{{ selectedSession.referrer ? new URL(selectedSession.referrer).hostname : 'None' }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Device Details</p>
                                    <div class="space-y-3">
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Platform</span>
                                            <span class="text-xs font-black text-slate-900">{{ selectedSession.platform }} ({{ selectedSession.device_type }})</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Browser</span>
                                            <span class="text-xs font-black text-slate-900">{{ selectedSession.browser }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-[10px] font-bold text-slate-500 uppercase">Resolution</span>
                                            <span class="text-xs font-black text-slate-900">{{ selectedSession.screen_resolution }}</span>
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
</template>

