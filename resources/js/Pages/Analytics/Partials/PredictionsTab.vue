<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { 
  Chart as ChartJS, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import { Radar, Bar, Line } from 'vue-chartjs'
import AdPredictionsCard from './AdPredictionsCard.vue'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
)

const props = defineProps({
  propertyId: Number,
  organization: Object
})

const isLoading = ref(true)
const forecasts = ref({
  propensity_scores: {},
  source_fatigue: {},
  performance_rankings: []
})

const fetchForecasts = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(route('analytics.forecasts', { property: props.propertyId }))
    forecasts.value = response.data
  } catch (error) {
    console.error('Failed to fetch forecasts:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchForecasts()
})

// --- Chart Data ---

const propensityChartData = computed(() => {
  const labels = Object.keys(forecasts.value.propensity_scores || {})
  const data = Object.values(forecasts.value.propensity_scores || {})
  
  return {
    labels,
    datasets: [{
      label: 'Conversion Probability',
      data,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6'
    }]
  }
})

const radarOptions = {
  scales: {
    r: {
      angleLines: { display: false },
      suggestedMin: 0,
      suggestedMax: 1
    }
  }
}

const fatigueChartData = computed(() => {
  const sources = Object.keys(forecasts.value.source_fatigue || {})
  const trends = sources.map(s => forecasts.value.source_fatigue[s].trend_percentage)
  
  return {
    labels: sources,
    datasets: [{
      label: 'Predicted Trend (%)',
      data: trends,
      backgroundColor: trends.map(t => t < -10 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'),
      borderRadius: 8
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  }
}

</script>

<template>
  <div class="space-y-10 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-black text-slate-900">Predictions & Insights</h2>
        <p class="text-slate-500 font-medium mt-1">AI-driven forecasts for your property</p>
      </div>
      <button @click="fetchForecasts" class="p-2 hover:bg-slate-100 rounded-xl transition-all">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      </button>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div v-for="i in 2" :key="i" class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium h-80 animate-pulse"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Propensity Radar -->
      <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
           <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
           Lead Propensity by Channel
        </h3>
        <div class="h-64 flex items-center justify-center">
          <Radar :data="propensityChartData" :options="radarOptions" />
        </div>
      </div>

      <!-- Source Fatigue Bar -->
      <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
           <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
           Source Fatigue Forecast
        </h3>
        <div class="h-64">
          <Bar :data="fatigueChartData" :options="barOptions" />
        </div>
      </div>
      
      <!-- Ad Performance Predictions -->
      <div v-if="forecasts.ad_performance && forecasts.ad_performance.length > 0" class="lg:col-span-2">
        <AdPredictionsCard 
          :recommendations="forecasts.ad_performance" 
          :is-loading="isLoading" 
        />
      </div>

      <!-- Efficiency Rankings Table -->
      <div class="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <h3 class="text-lg font-black text-slate-900 mb-6">Cross-Channel Efficiency Ranking</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-50">
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Channel</th>
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Propensity Score</th>
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Efficiency Index</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="rank in forecasts.performance_rankings" :key="rank.channel" class="hover:bg-slate-50 transition-all">
                <td class="py-4 px-4">
                  <span class="text-sm font-bold text-slate-700">{{ rank.channel }}</span>
                </td>
                <td class="py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                     <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 rounded-full" :style="{ width: (rank.propensity * 100) + '%' }"></div>
                     </div>
                     <span class="text-xs font-black text-slate-900">{{ (rank.propensity * 100).toFixed(1) }}%</span>
                  </div>
                </td>
                <td class="py-4 text-right pr-4">
                  <span class="text-sm font-black" :class="rank.efficiency_index > 0.5 ? 'text-emerald-600' : 'text-slate-900'">
                    {{ rank.efficiency_index.toFixed(4) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
}
</style>
