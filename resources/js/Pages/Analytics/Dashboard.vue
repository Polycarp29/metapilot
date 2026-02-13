<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { ref, onMounted, watch } from 'vue'
import { Head, Link, usePage } from '@inertiajs/vue3'
import axios from 'axios'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  properties: Array,
  organization: Object
})

const selectedPropertyId = ref(props.properties[0]?.id || null)
const timeframe = ref(30)
const isLoading = ref(false)
const overview = ref(null)
const trendData = ref(null)

const chartData = ref({
  labels: [],
  datasets: []
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#1e293b',
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b' }
    },
    x: {
      grid: { display: false },
        ticks: { color: '#64748b' }
    }
  }
}

const fetchData = async () => {
  if (!selectedPropertyId.value) return
  
  isLoading.value = true
  try {
    const [overviewRes, trendsRes] = await Promise.all([
      axios.get(route('api.analytics.overview', { property: selectedPropertyId.value, days: timeframe.value })),
      axios.get(route('api.analytics.trends', { property: selectedPropertyId.value, days: timeframe.value }))
    ])
    
    overview.value = overviewRes.data
    trendData.value = trendsRes.data
    
    updateChart()
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    isLoading.value = false
  }
}

const updateChart = () => {
  if (!trendData.value) return
  
  chartData.value = {
    labels: trendData.value.map(d => d.snapshot_date),
    datasets: [
      {
        label: 'Users',
        data: trendData.value.map(d => d.users),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      }
    ]
  }
}

onMounted(fetchData)
watch([selectedPropertyId, timeframe], fetchData)

</script>

<template>
  <Head title="Analytics Dashboard" />

  <AppLayout>
    <div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p class="text-slate-500 mt-2 font-medium">Insights and performance tracking for {{ organization.name }}</p>
        </div>

        <div class="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-premium border border-slate-100">
          <select v-model="selectedPropertyId" class="bg-transparent border-none focus:ring-0 font-bold text-slate-700 pr-10 cursor-pointer">
            <option v-for="prop in properties" :key="prop.id" :value="prop.id">
              {{ prop.name }}
            </option>
          </select>
          
          <div class="w-px h-6 bg-slate-100"></div>
          
          <select v-model="timeframe" class="bg-transparent border-none focus:ring-0 font-bold text-blue-600 cursor-pointer pr-10">
            <option :value="7">Last 7 Days</option>
            <option :value="30">Last 30 Days</option>
            <option :value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      <!-- Stats Grid -->
      <div v-if="overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all">
          <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Users</p>
          <div class="flex items-end gap-3 mt-2">
            <h3 class="text-4xl font-black text-slate-900">{{ overview.total_users || 0 }}</h3>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">Sessions</p>
          <h3 class="text-4xl font-black text-slate-900 mt-2">{{ overview.total_sessions || 0 }}</h3>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">Conversions</p>
          <h3 class="text-4xl font-black text-blue-600 mt-2">{{ overview.total_conversions || 0 }}</h3>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <p class="text-slate-500 font-bold text-sm uppercase tracking-wider">Engagement Rate</p>
          <h3 class="text-4xl font-black text-slate-900 mt-2">{{ (overview.avg_engagement_rate * 100).toFixed(1) }}%</h3>
        </div>
      </div>

      <!-- Main Chart Area -->
      <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium relative min-h-[500px]">
        <div class="flex items-center justify-between mb-10">
          <h3 class="text-2xl font-black text-slate-900">Traffic Trend</h3>
          <div class="flex gap-2">
            <div class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">
              <div class="w-2 h-2 rounded-full bg-blue-600"></div>
              Users
            </div>
          </div>
        </div>

        <div class="h-[400px]">
           <Line v-if="trendData" :data="chartData" :options="chartOptions" />
           <div v-else class="h-full flex items-center justify-center text-slate-400 font-bold">
              Fetching trend data...
           </div>
        </div>
      </div>

      <div v-if="!properties.length" class="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
         <div class="text-6xl mb-6">📊</div>
         <h2 class="text-2xl font-bold text-slate-900">No Analytics Properties Connected</h2>
         <p class="text-slate-500 mt-2">Connect your GA4 property in the settings to start tracking performance.</p>
         <Link :href="route('organization.settings', { tab: 'analytics' })" class="inline-block mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
            Connect Property
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
