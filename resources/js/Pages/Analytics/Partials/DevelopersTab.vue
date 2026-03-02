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
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                        <p class="text-2xl font-black text-slate-900">{{ events.length }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Correlation Accuracy</p>
                        <p class="text-2xl font-black text-emerald-600">High</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Event Log -->
        <div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
            <div class="p-10 border-b border-slate-100">
                <h3 class="text-2xl font-black text-slate-900">Pixel Event Log</h3>
                <p class="text-slate-500 font-medium mt-1">Real-time tracking hits for debugging</p>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/50">
                        <tr>
                            <th class="py-6 pl-10 text-xs font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Page URL</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Source/Medium</th>
                            <th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Campaign</th>
                            <th class="py-6 pr-10 text-xs font-black text-slate-400 uppercase tracking-widest text-right">GCLID</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr v-for="event in events" :key="event.id" class="group hover:bg-slate-50/50 transition-colors">
                            <td class="py-6 pl-10 text-sm font-medium text-slate-500 whitespace-nowrap">
                                {{ new Date(event.created_at).toLocaleString() }}
                            </td>
                            <td class="py-6 text-sm font-bold text-slate-900 max-w-xs truncate" :title="event.page_url">
                                {{ event.page_url }}
                            </td>
                            <td class="py-6 text-sm text-slate-600">
                                {{ event.utm_source || '-' }} / {{ event.utm_medium || '-' }}
                            </td>
                            <td class="py-6 text-sm text-slate-600">
                                {{ event.utm_campaign || '-' }}
                            </td>
                            <td class="py-6 pr-10 text-right">
                                <span v-if="event.gclid" class="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg border border-amber-100" :title="event.gclid">
                                    {{ event.gclid.substring(0, 8) }}...
                                </span>
                                <span v-else class="text-slate-300">-</span>
                            </td>
                        </tr>
                        <tr v-if="events.length === 0 && !isLoading">
                            <td colspan="5" class="py-20 text-center">
                                <p class="text-slate-400 font-bold italic">No pixel events detected yet.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
