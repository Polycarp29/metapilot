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

// ─── State ───────────────────────────────────────────────────────────────────
const state = ref('loading') // 'loading' | 'empty' | 'running' | 'ready' | 'error'
const runError = ref(null)
const forecasts = ref({
  propensity_scores: {},
  source_fatigue: {},
  performance_rankings: [],
  ad_performance: [],
  strategic_strategy: {
    summary: '',
    recommendations: [],
    diagnostics: {}
  }
})

// Simple linear-regression forecast (Legacy/Trend fallback)
const simpleForecast = ref(null)

// ─── Data Fetching ────────────────────────────────────────────────────────────
const fetchForecasts = async () => {
  state.value = 'loading'
  try {
    const [forecastsRes, simpleRes] = await Promise.all([
      axios.get(route('analytics.forecasts', { property: props.propertyId })),
      axios.get(route('api.analytics.forecast', { property: props.propertyId }))
    ])

    const data = forecastsRes.data
    forecasts.value = {
      propensity_scores: data.propensity_scores || {},
      source_fatigue: data.source_fatigue || {},
      performance_rankings: data.performance_rankings || [],
      ad_performance: data.ad_performance || [],
      strategic_strategy: data.strategic_strategy || { summary: '', recommendations: [], diagnostics: {} }
    }

    simpleForecast.value = simpleRes.data

    const hasMLData = Object.keys(forecasts.value.propensity_scores).length > 0
      || Object.keys(forecasts.value.source_fatigue).length > 0
      || forecasts.value.performance_rankings.length > 0
      || !!forecasts.value.strategic_strategy.summary

    state.value = hasMLData ? 'ready' : 'empty'
  } catch (error) {
    console.error('Failed to fetch forecasts:', error)
    state.value = 'error'
  }
}

const runPredictions = async () => {
  state.value = 'running'
  runError.value = null
  try {
    const response = await axios.post(route('analytics.refresh-predictions', { property: props.propertyId }))
    const data = response.data

    if (data.error) {
      runError.value = data.error
      state.value = 'empty'
      return
    }

    forecasts.value = {
      propensity_scores: data.propensity_scores || {},
      source_fatigue: data.source_fatigue || {},
      performance_rankings: data.performance_rankings || [],
      ad_performance: data.ad_performance || [],
      strategic_strategy: data.strategic_strategy || { summary: '', recommendations: [], diagnostics: {} }
    }

    state.value = 'ready'
  } catch (error) {
    runError.value = error.response?.data?.error || 'Internal error. Check that the Python service is running.'
    state.value = 'empty'
  }
}

onMounted(fetchForecasts)

// ─── Chart: Lead Propensity Radar ─────────────────────────────────────────────
const hasRadarData = computed(() => Object.keys(forecasts.value.propensity_scores).length > 0)

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
      cornerRadius: 8,
      callbacks: { label: (ctx) => ` ${(ctx.raw * 100).toFixed(1)}% probability` }
    }
  },
  scales: {
    r: {
      angleLines: { color: 'rgba(0,0,0,0.08)' },
      grid: { color: 'rgba(0,0,0,0.06)' },
      pointLabels: { font: { size: 11, weight: 'bold' }, color: '#475569' },
      ticks: { display: false },
      suggestedMin: 0,
      suggestedMax: 1
    }
  }
}

// ─── Chart: Strategic 90d Projections ─────────────────────────────────────────
const strategicSessions = computed(() => (forecasts.value.sessions || {}))
const hasStrategicForecast = computed(() => Object.keys(strategicSessions.value).length > 0)

const strategicChartData = computed(() => {
  const data = forecasts.value.sessions || {}
  const labels = ['Now', '30 Days', '90 Days', '180 Days']
  const values = [
    simpleForecast.value?.users?.[0]?.value || 0, // Fallback to start of trend
    data['30d']?.predicted || 0,
    data['90d']?.predicted || 0,
    data['180d']?.predicted || 0
  ]

  return {
    labels,
    datasets: [{
      label: 'Predicted Traffic',
      data: values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 4,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 3
    }]
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(0,0,0,0.04)' } },
    x: { grid: { display: false } }
  }
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────
const getPriorityClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'high': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

const getImpactIcon = (type) => {
  switch (type) {
    case 'ads': return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
    case 'seo': return 'M7 16V4m0 12l-4-4m4 4l4-4m6 0v12m0-12l-4 4m4-4l4 4'
    default: return 'M13 10V3L4 14h7v7l9-11h-7z'
  }
}
</script>

<template>
  <div class="space-y-10 animate-in fade-in duration-500 pb-20">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Strategic Intelligence</h2>
        <p class="text-slate-500 font-medium mt-1">Multi-source correlation & predictive strategy</p>
      </div>
      <div class="flex items-center gap-4">
        <button @click="runPredictions"
          :disabled="state === 'running' || state === 'loading'"
          class="group flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-slate-900/20 active:scale-95">
          <svg class="w-5 h-5 transition-transform group-hover:rotate-180" :class="{ 'animate-spin': state === 'running' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ state === 'running' ? 'Analyzing…' : 'Regenerate Strategy' }}
        </button>
      </div>
    </div>

    <!-- ── Loading / Empty States ──────────────────────────────────────────── -->
    <div v-if="state === 'loading'" class="space-y-8">
      <div class="h-40 bg-slate-50 rounded-[3rem] animate-pulse"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-64 bg-slate-50 rounded-3xl animate-pulse"></div>
      </div>
    </div>

    <div v-else-if="state === 'running'" class="max-w-2xl mx-auto py-20 text-center">
      <div class="relative w-32 h-32 mx-auto mb-10">
        <div class="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping"></div>
        <div class="relative w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-600/40">
           <svg class="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
           </svg>
        </div>
      </div>
      <h3 class="text-3xl font-black text-slate-900 mb-4">Processing Deep Intelligence</h3>
      <p class="text-slate-500 font-medium leading-relaxed">
        Correlating GA4 session data with GSC search intent and Ad performance...
        <br><span class="text-blue-600 font-black">Generating 180-day forecasts.</span>
      </p>
    </div>

    <div v-else-if="state === 'empty'" class="bg-slate-50 p-20 rounded-[4rem] text-center border-2 border-dashed border-slate-200">
       <div class="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-8 text-slate-400">
         <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
         </svg>
       </div>
       <h3 class="text-2xl font-black text-slate-900 mb-4">No Strategy Data Yet</h3>
       <p class="text-slate-500 max-w-sm mx-auto mb-10">Generate your first strategic analysis to see prioritized growth recommendations.</p>
       <button @click="runPredictions" class="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20">Analyze Now</button>
    </div>

    <!-- ── Strategic Dashboard ────────────────────────────────────────────── -->
    <div v-else-if="state === 'ready'" class="space-y-12">
      
      <!-- Executive Summary Card -->
      <div class="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-10 opacity-10">
           <svg class="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="relative z-10 flex flex-col md:flex-row gap-10">
           <div class="flex-1">
             <div class="flex items-center gap-3 mb-6">
                <span class="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">AI Briefing</span>
                <span class="text-blue-100 text-[10px] font-black uppercase tracking-widest">Property Health: Excellent</span>
             </div>
             <h3 class="text-4xl font-black mb-6 tracking-tight leading-tight">
               {{ forecasts.strategic_strategy?.summary || 'Performance is stable across all primary channels.' }}
             </h3>
             <div class="flex items-center gap-8 mt-10 border-t border-white/10 pt-10">
                <div v-for="(val, key) in forecasts.strategic_strategy?.diagnostics" :key="key">
                   <p class="text-[10px] font-black text-blue-200 uppercase tracking-widest">{{ key.replace('_', ' ') }}</p>
                   <p class="text-2xl font-black mt-1">{{ val }}</p>
                </div>
             </div>
           </div>
           
           <div class="w-full md:w-80 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
             <p class="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-6">Strategy Potential</p>
             <div class="space-y-6">
                <div>
                   <div class="flex justify-between text-xs font-black mb-2"><span>Conversion Lift</span><span>+18%</span></div>
                   <div class="h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full bg-emerald-400 w-[70%]"></div></div>
                </div>
                <div>
                   <div class="flex justify-between text-xs font-black mb-2"><span>SEO Visibility</span><span>+24%</span></div>
                   <div class="h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full bg-blue-300 w-[85%]"></div></div>
                </div>
                <div>
                   <div class="flex justify-between text-xs font-black mb-2"><span>Ads Optimization</span><span>+12%</span></div>
                   <div class="h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full bg-amber-400 w-[40%]"></div></div>
                </div>
             </div>
           </div>
        </div>
      </div>

      <!-- Strategy Recommendations Grid -->
      <div>
        <h4 class="text-xl font-black text-slate-900 mb-8 px-2">Growth Strategy Map</h4>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div v-for="(rec, idx) in forecasts.strategic_strategy?.recommendations" :key="idx"
            class="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            
            <div class="flex items-center justify-between mb-8">
               <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-900 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getImpactIcon(rec.type)" />
                  </svg>
               </div>
               <span class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border" :class="getPriorityClass(rec.priority)">
                 {{ rec.priority }}
               </span>
            </div>

            <h5 class="text-xl font-black text-slate-900 leading-snug mb-3">{{ rec.title }}</h5>
            <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8">{{ rec.rationale }}</p>

            <div class="p-6 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
               <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Impact Forecast</p>
               <div class="flex flex-wrap gap-4">
                  <div v-for="(val, metric) in rec.expected_impact" :key="metric" class="flex items-center gap-2">
                     <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     <span class="text-xs font-black text-slate-700">{{ metric.replace('_', ' ') }}: {{ val }}</span>
                  </div>
               </div>
            </div>

            <div class="space-y-4">
               <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Steps</p>
               <div v-for="(action, aidx) in rec.actions" :key="aidx" class="flex gap-4">
                  <div class="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{{ aidx + 1 }}</div>
                  <p class="text-xs font-bold text-slate-600 leading-relaxed">{{ action.description }}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Data Layer: Projections & Radar -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
         
         <!-- Strategic Projection Chart -->
         <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
            <div class="flex items-center justify-between mb-10">
               <div>
                  <h3 class="text-xl font-black text-slate-900">180-Day Traffic Forecast</h3>
                  <p class="text-xs text-slate-400 font-medium mt-1">AI modeling based on seasonal search trends</p>
               </div>
               <div class="flex gap-2">
                  <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100">Prophet Model</span>
               </div>
            </div>
            <div class="h-64">
               <Line v-if="hasStrategicForecast" :data="strategicChartData" :options="lineOptions" />
               <div v-else class="h-full flex items-center justify-center text-slate-300 font-black italic">Generating projection...</div>
            </div>
            <div class="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-50 text-center">
               <div v-for="p in ['30d', '90d', '180d']" :key="p">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ p }} Prediction</p>
                  <p class="text-xl font-black text-slate-900">{{ (forecasts.value.sessions || {})[p]?.predicted || '—' }}</p>
               </div>
            </div>
         </div>

         <!-- Propensity Radar -->
         <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
            <h3 class="text-xl font-black text-slate-900 mb-2">Intent Propensity</h3>
            <p class="text-xs text-slate-400 font-medium mb-10">Channel conversion probability for fresh leads</p>
            <div class="h-80 flex items-center justify-center">
              <Radar v-if="hasRadarData" :data="propensityChartData" :options="radarOptions" />
              <p v-else class="text-slate-300 font-black">Waiting for ML data...</p>
            </div>
         </div>

      </div>

      <!-- Efficiency Ranking Section -->
      <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden relative">
         <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-black text-slate-900">Global Channel Efficiency</h3>
            <span class="text-xs font-bold text-slate-400">Total reach: 100% normalized</span>
         </div>
         
         <div v-if="forecasts.performance_rankings.length" class="space-y-8">
            <div v-for="rank in forecasts.performance_rankings" :key="rank.channel" class="group">
               <div class="flex items-center justify-between mb-3 px-2">
                  <span class="text-sm font-black text-slate-800">{{ rank.channel }}</span>
                  <div class="flex items-center gap-4">
                     <span class="text-[10px] font-black uppercase tracking-widest" :class="rank.efficiency_index >= 0.7 ? 'text-emerald-500' : 'text-slate-400'">
                        {{ rank.efficiency_index >= 0.7 ? 'Excellent' : rank.efficiency_index >= 0.4 ? 'Stable' : 'Underperforming' }}
                     </span>
                     <span class="text-sm font-black text-slate-900">{{ (rank.propensity * 100).toFixed(0) }}%</span>
                  </div>
               </div>
               <div class="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                  <div class="h-full rounded-full transition-all duration-1000"
                    :class="rank.efficiency_index >= 0.7 ? 'bg-blue-600' : rank.efficiency_index >= 0.4 ? 'bg-indigo-400' : 'bg-slate-300'"
                    :style="{ width: Math.min(rank.propensity * 100, 100) + '%' }"></div>
               </div>
            </div>
         </div>
         <p v-else class="text-center py-20 text-slate-300 font-black italic">Awaiting multi-channel analysis...</p>
      </div>

    </div>

  </div>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 10px 40px -15px rgba(0, 0, 0, 0.04);
}
</style>
