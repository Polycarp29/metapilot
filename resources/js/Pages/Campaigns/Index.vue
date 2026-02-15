<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { Head, Link } from '@inertiajs/vue3'
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  ArcElement 
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  campaigns: Array,
  properties: Array // Pass available properties for selection
})

const selectedPropertyId = ref(null)
const acquisitionData = ref([])
const isLoadingAcquisition = ref(false)
const period = ref(30) // Default to last 30 days

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      backgroundColor: '#1e293b',
      padding: 12,
      cornerRadius: 6,
    }
  },
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 10 } } 
    },
    x: { 
      grid: { display: false },
      ticks: { font: { size: 10 } }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 } } }
  }
}

// Computeds for Charts
const sessionsChartData = computed(() => {
  const sorted = [...acquisitionData.value].sort((a, b) => b.sessions - a.sessions).slice(0, 5)
  return {
    labels: sorted.map(d => d.campaign === '(direct)' ? 'Direct' : d.campaign.substring(0, 15) + (d.campaign.length > 15 ? '...' : '')),
    datasets: [{
      label: 'Sessions',
      backgroundColor: '#3b82f6',
      borderRadius: 6,
      data: sorted.map(d => d.sessions)
    }]
  }
})

const sourceChartData = computed(() => {
  const sources = {}
  acquisitionData.value.forEach(d => {
    const source = d.source_medium.split('/')[0]
    sources[source] = (sources[source] || 0) + d.sessions
  })
  
  const labels = Object.keys(sources)
  const data = Object.values(sources)
  
  return {
    labels,
    datasets: [{
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
      borderWidth: 0,
      data
    }]
  }
})

const fetchAcquisitionData = async () => {
  if (!selectedPropertyId.value) return
  
  isLoadingAcquisition.value = true
  try {
    const { data } = await axios.get(route('api.analytics.acquisition', { 
        property: selectedPropertyId.value,
        days: period.value
    }))
    acquisitionData.value = data
  } catch (error) {
    console.error("Failed to fetch acquisition data", error)
  } finally {
    isLoadingAcquisition.value = false
  }
}

watch([selectedPropertyId, period], () => {
    fetchAcquisitionData()
})

onMounted(() => {
    if (props.properties && props.properties.length > 0) {
        selectedPropertyId.value = props.properties[0].id
    }
})

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'paused': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>

<template>
  <Head title="SEO Campaigns" />

  <AppLayout>
    <div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">SEO Campaigns</h1>
          <p class="text-slate-500 mt-2 font-medium">Strategic efforts to boost your property's performance</p>
        </div>

        <Link
          :href="route('campaigns.create')"
          class="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Start New Campaign</span>
        </Link>
      </div>

      <!-- Campaign List -->
      <div v-if="campaigns.length" class="grid grid-cols-1 gap-6">
        <Link 
          v-for="campaign in campaigns" 
          :key="campaign.id" 
          :href="route('campaigns.show', { campaign: campaign.id })"
          class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', getStatusColor(campaign.status)]">
                {{ campaign.status }}
              </span>
              <span class="text-slate-400 font-medium text-sm">{{ campaign.property?.name }}</span>
            </div>
            <h3 class="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{{ campaign.name }}</h3>
            <p class="text-slate-500 max-w-2xl line-clamp-2 italic">"{{ campaign.objective }}"</p>
          </div>

          <div class="flex items-center gap-4">
             <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Target URLs</p>
                <p class="text-lg font-black text-slate-900">{{ campaign.target_urls?.length || 0 }}</p>
             </div>
             <div class="w-px h-10 bg-slate-100 hidden sm:block"></div>
             <div class="bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-6 py-3 rounded-xl font-bold transition-all">
                View Impact
             </div>
          </div>
        </Link>
      </div>

      <!-- Acquisition & Performance Section -->
      <div v-if="properties && properties.length > 0" class="bg-slate-50 p-8 rounded-[3rem] border border-slate-200/60">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <h2 class="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <span class="text-3xl">📊</span>
                    Acquisition Channels
                </h2>
                <p class="text-slate-500 font-medium mt-1">Track performance across all traffic sources</p>
            </div>
            
            <div class="flex items-center gap-4">
                <select v-model="selectedPropertyId" class="bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer">
                    <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
                </select>
                <select v-model="period" class="bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer">
                    <option :value="7">Last 7 Days</option>
                    <option :value="30">Last 30 Days</option>
                    <option :value="90">Last 90 Days</option>
                </select>
            </div>
        </div>

        <div v-if="isLoadingAcquisition" class="py-20 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p class="text-slate-500 font-bold mt-4">Loading data...</p>
        </div>

        <div v-else-if="acquisitionData.length > 0" class="space-y-8">
             <!-- Charts Row -->
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Bar Chart -->
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80">
                    <h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Top Campaigns (Sessions)</h3>
                    <div class="h-60">
                        <Bar :data="sessionsChartData" :options="chartOptions" />
                    </div>
                </div>
                
                <!-- Doughnut Chart -->
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80">
                    <h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Traffic Sources</h3>
                    <div class="h-60">
                        <Doughnut :data="sourceChartData" :options="doughnutOptions" />
                    </div>
                </div>
             </div>

             <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50/50">
                            <tr>
                                <th class="py-5 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest">Campaign / Source</th>
                                <th class="py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Google Ads Campaign</th>
                                <th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Sessions</th>
                                <th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Users</th>
                                <th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Conversions</th>
                                <th class="py-5 pr-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Engagement</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-600 divide-y divide-slate-50">
                            <tr v-for="(row, idx) in acquisitionData" :key="idx" class="group hover:bg-slate-50/80 transition-colors">
                                <td class="py-4 pl-8">
                                    <div class="font-bold text-slate-900">{{ row.campaign === '(direct)' ? 'Direct Traffic' : row.campaign }}</div>
                                    <div class="text-xs text-slate-400 font-bold mt-0.5">{{ row.source_medium }}</div>
                                </td>
                                <td class="py-4 text-center">
                                    <span v-if="row.google_ads_campaign && row.google_ads_campaign !== '(not set)'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                        {{ row.google_ads_campaign }}
                                    </span>
                                    <span v-else class="text-slate-300">-</span>
                                </td>
                                <td class="py-4 text-right font-bold">{{ row.sessions.toLocaleString() }}</td>
                                <td class="py-4 text-right">{{ row.users.toLocaleString() }}</td>
                                <td class="py-4 text-right text-blue-600 font-bold">{{ row.conversions.toLocaleString() }}</td>
                                <td class="py-4 pr-8 text-right">
                                    <span :class="{'text-emerald-500': row.engagement_rate > 0.5, 'text-amber-500': row.engagement_rate <= 0.5}">
                                        {{ (row.engagement_rate * 100).toFixed(1) }}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>

        <div v-else class="py-12 text-center bg-white rounded-[2rem] border border-slate-100">
            <p class="text-slate-400 font-medium">No acquisition data found for this period.</p>
        </div>
      </div>
      
      <!-- Existing Empty State -->
      <div v-else class="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-premium">
         <div class="text-6xl mb-6">🎯</div>
         <h2 class="text-2xl font-bold text-slate-900">No Campaigns Yet</h2>
         <p class="text-slate-500 mt-2 max-w-md mx-auto">Create a campaign to start tracking specific SEO goals like "Improve Blog Traffic" or "Boost Form Conversions".</p>
         <Link :href="route('campaigns.create')" class="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Create Your First Campaign
         </Link>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
}
</style>
