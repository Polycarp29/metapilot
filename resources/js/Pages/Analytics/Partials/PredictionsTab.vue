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
  ad_performance: []
})

// Simple linear-regression forecast from ForecastService
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
      ad_performance: data.ad_performance || []
    }

    simpleForecast.value = simpleRes.data

    const hasMLData = Object.keys(forecasts.value.propensity_scores).length > 0
      || Object.keys(forecasts.value.source_fatigue).length > 0
      || forecasts.value.performance_rankings.length > 0

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
      ad_performance: data.ad_performance || []
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

const propensityChartData = computed(() => {
  if (!hasRadarData.value) return { labels: [], datasets: [] }
  const labels = Object.keys(forecasts.value.propensity_scores)
  const data = Object.values(forecasts.value.propensity_scores)
  return {
    labels,
    datasets: [{
      label: 'Conversion Probability',
      data,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: '#3b82f6',
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6',
      borderWidth: 2,
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  }
})

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${(ctx.raw * 100).toFixed(1)}% probability`
      }
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

// ─── Chart: Source Fatigue Bar ────────────────────────────────────────────────
const hasFatigueData = computed(() => Object.keys(forecasts.value.source_fatigue).length > 0)

const fatigueChartData = computed(() => {
  if (!hasFatigueData.value) return { labels: [], datasets: [] }
  const sources = Object.keys(forecasts.value.source_fatigue)
  const trends = sources.map(s => forecasts.value.source_fatigue[s]?.trend_percentage ?? 0)
  return {
    labels: sources,
    datasets: [{
      label: 'Predicted Trend (%)',
      data: trends,
      backgroundColor: trends.map(t => t < -10
        ? 'rgba(239, 68, 68, 0.7)'
        : t > 10 ? 'rgba(16, 185, 129, 0.7)'
        : 'rgba(245, 158, 11, 0.7)'),
      borderRadius: 10,
      borderSkipped: false
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${ctx.raw > 0 ? '+' : ''}${ctx.raw.toFixed(1)}% predicted trend`
      }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { color: '#64748b', callback: (v) => `${v}%` }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { weight: 'bold', size: 11 } }
    }
  }
}

// ─── Chart: Simple Forecast Trendline ────────────────────────────────────────
const hasForecastData = computed(() => simpleForecast.value?.users?.length > 0)

const forecastChartData = computed(() => {
  if (!hasForecastData.value) return { labels: [], datasets: [] }

  const usersData = simpleForecast.value.users || []
  const sessionsData = simpleForecast.value.sessions || []

  return {
    labels: usersData.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Projected Users',
        data: usersData.map(d => d.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2.5,
        borderDash: [6, 3],
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6'
      },
      {
        label: 'Projected Sessions',
        data: sessionsData.map(d => d.value),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [4, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#10b981'
      }
    ]
  }
})

const forecastLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: { usePointStyle: true, padding: 20, font: { size: 11, weight: 'bold' } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      cornerRadius: 8,
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { color: '#64748b' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10 } }
    }
  }
}

// ─── Confidence ───────────────────────────────────────────────────────────────
const confidenceScore = computed(() => {
  const score = simpleForecast.value?.metadata?.confidence_score ?? null
  if (!score) return null
  return Math.round(score * 100)
})

// ─── Efficiency helpers ───────────────────────────────────────────────────────
const efficiencyColor = (v) => {
  if (!v && v !== 0) return 'text-slate-400'
  if (v >= 0.7) return 'text-emerald-600'
  if (v >= 0.4) return 'text-amber-600'
  return 'text-rose-600'
}

const efficiencyLabel = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 0.7) return 'High'
  if (v >= 0.4) return 'Medium'
  return 'Low'
}
</script>

<template>
  <div class="space-y-10 animate-in fade-in duration-500">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black text-slate-900">Predictions &amp; Insights</h2>
        <p class="text-slate-500 font-medium mt-1">AI-driven forecasts powered by your historical data</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Confidence badge -->
        <span v-if="confidenceScore !== null && state === 'ready'"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border"
          :class="confidenceScore >= 80
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : confidenceScore >= 60
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          {{ confidenceScore }}% confidence
        </span>

        <!-- Re-run button -->
        <button @click="runPredictions"
          :disabled="state === 'running' || state === 'loading'"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <svg class="w-4 h-4" :class="{ 'animate-spin': state === 'running' }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ state === 'running' ? 'Running…' : 'Run Predictions' }}
        </button>

        <!-- Soft refresh →  cached results -->
        <button v-if="state === 'ready'" @click="fetchForecasts"
          class="p-2 hover:bg-slate-100 rounded-xl transition-all" title="Reload from cache">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <div v-if="state === 'loading'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div v-for="i in 4" :key="i"
        class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium h-72 animate-pulse">
        <div class="h-3 w-32 bg-slate-100 rounded-full mb-4"></div>
        <div class="h-2 w-48 bg-slate-100 rounded-full mb-8 opacity-60"></div>
        <div class="h-40 w-full bg-slate-50 rounded-2xl"></div>
      </div>
    </div>

    <!-- ── Running state ───────────────────────────────────────────────────── -->
    <div v-else-if="state === 'running'"
      class="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 rounded-[3rem] text-white text-center shadow-2xl shadow-blue-600/30">
      <div class="w-20 h-20 mx-auto bg-white/10 rounded-[2rem] flex items-center justify-center mb-6 border border-white/20">
        <svg class="w-10 h-10 animate-spin text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
      <h3 class="text-2xl font-black mb-2">Running ML Analysis</h3>
      <p class="text-blue-100 font-medium max-w-md mx-auto">
        Calculating propensity scores, source fatigue, and ad performance predictions…
        <br>This usually takes 10–30 seconds.
      </p>
      <div class="mt-8 flex items-center justify-center gap-6 text-sm font-bold text-blue-200">
        <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Lead propensity</span>
        <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style="animation-delay:200ms"></span> Source fatigue</span>
        <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-300 animate-pulse" style="animation-delay:400ms"></span> Efficiency rank</span>
      </div>
    </div>

    <!-- ── Empty / error state ─────────────────────────────────────────────── -->
    <div v-else-if="state === 'empty' || state === 'error'"
      class="space-y-10">

      <!-- Error message -->
      <div v-if="runError" class="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3 text-sm">
        <svg class="w-5 h-5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-rose-700 font-medium">{{ runError }}</p>
      </div>

      <!-- Hero Call-to-Action -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 text-white text-center relative overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px]"></div>
          <div class="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px]"></div>
        </div>
        <div class="relative z-10">
          <div class="w-20 h-20 mx-auto bg-blue-500/15 border border-blue-500/30 rounded-[2rem] flex items-center justify-center mb-6 text-blue-400">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h3 class="text-3xl font-black mb-3">No Predictions Generated Yet</h3>
          <p class="text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
            Your ML prediction engine hasn't run for this property yet.
            Click <strong class="text-white">Run Predictions</strong> to compute propensity scores,
            source fatigue, and ad performance recommendations.
          </p>
          <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Requires at least 7 days of synced data</p>
          <button @click="runPredictions"
            class="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-900/40">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Generate Predictions Now
          </button>
        </div>
      </div>

      <!-- Preview (greyed-out demo charts) -->
      <div>
        <div class="flex items-center gap-3 mb-6">
          <div class="h-px flex-1 bg-slate-100"></div>
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest px-3">Preview — what you'll see</span>
          <div class="h-px flex-1 bg-slate-100"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-30 pointer-events-none select-none filter blur-[1px]">
          <!-- Demo Radar -->
          <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
            <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Lead Propensity by Channel
            </h3>
            <div class="h-64 flex items-center justify-center">
              <Radar :data="{
                labels: ['Organic', 'Direct', 'Social', 'Email', 'Paid'],
                datasets: [{ label: 'Demo', data: [0.8, 0.6, 0.4, 0.7, 0.5],
                  backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6',
                  pointBackgroundColor: '#3b82f6', borderWidth: 2, pointRadius: 4 }]
              }" :options="radarOptions" />
            </div>
          </div>

          <!-- Demo Bar -->
          <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
            <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
              </svg>
              Source Fatigue Forecast
            </h3>
            <div class="h-64">
              <Bar :data="{
                labels: ['Organic', 'Paid', 'Social', 'Email'],
                datasets: [{ data: [12, -18, 5, 8],
                  backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
                  borderRadius: 10 }]
              }" :options="barOptions" />
            </div>
          </div>
        </div>
      </div>

      <!-- Linear Forecast (still useful even without ML) -->
      <div v-if="hasForecastData"
        class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
              </svg>
              Traffic Projection (Next {{ simpleForecast?.metadata?.forecast_days ?? 14 }} days)
            </h3>
            <p class="text-sm text-slate-400 font-medium mt-1">Linear trend extrapolation · {{ simpleForecast?.metadata?.lookback_days }} days lookback</p>
          </div>
          <span class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-700 border-indigo-200">
            Trend Model
          </span>
        </div>
        <div class="h-64">
          <Line :data="forecastChartData" :options="forecastLineOptions" />
        </div>
      </div>
    </div>

    <!-- ── Ready: Full Results ─────────────────────────────────────────────── -->
    <div v-else-if="state === 'ready'" class="space-y-8">

      <!-- Row 1: Radar + Bar -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Propensity Radar -->
        <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
          <h3 class="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Lead Propensity by Channel
          </h3>
          <p class="text-xs text-slate-400 font-medium mb-6">Predicted likelihood each channel converts a returning visitor</p>
          <div class="h-64 flex items-center justify-center">
            <Radar v-if="hasRadarData" :data="propensityChartData" :options="radarOptions" />
            <p v-else class="text-slate-300 text-sm font-bold">No channel data yet</p>
          </div>
        </div>

        <!-- Source Fatigue -->
        <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
          <h3 class="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
            </svg>
            Source Fatigue Forecast
          </h3>
          <p class="text-xs text-slate-400 font-medium mb-6">Predicted traffic change (%) per channel over the next 14 days</p>
          <div class="h-64">
            <Bar v-if="hasFatigueData" :data="fatigueChartData" :options="barOptions" />
            <p v-else class="text-slate-300 text-sm font-bold text-center pt-20">No fatigue data yet</p>
          </div>
        </div>
      </div>

      <!-- Row 2: Linear Forecast Trendline -->
      <div v-if="hasForecastData"
        class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
              </svg>
              Traffic Projection (Next {{ simpleForecast?.metadata?.forecast_days ?? 14 }} days)
            </h3>
            <p class="text-sm text-slate-400 font-medium mt-1">Linear trend extrapolation · {{ simpleForecast?.metadata?.lookback_days }}-day lookback</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="confidenceScore !== null"
              class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border"
              :class="confidenceScore >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'">
              {{ confidenceScore }}% confidence
            </span>
            <span class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-700 border-indigo-200">
              Trend Model
            </span>
          </div>
        </div>
        <div class="h-72">
          <Line :data="forecastChartData" :options="forecastLineOptions" />
        </div>
      </div>

      <!-- Row 3: Ad Performance Predictions -->
      <div v-if="forecasts.ad_performance && forecasts.ad_performance.length > 0" class="lg:col-span-2">
        <AdPredictionsCard
          :recommendations="forecasts.ad_performance"
          :is-loading="false"
          :forecast-days="simpleForecast?.metadata?.forecast_days ?? 14"
        />
      </div>

      <!-- Row 4: Efficiency Rankings Table -->
      <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-premium">
        <h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Cross-Channel Efficiency Ranking
        </h3>

        <div v-if="forecasts.performance_rankings.length" class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Channel</th>
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Propensity</th>
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Efficiency</th>
                <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="rank in forecasts.performance_rankings" :key="rank.channel"
                class="hover:bg-slate-50 transition-all">
                <td class="py-4 px-4">
                  <span class="text-sm font-bold text-slate-700">{{ rank.channel }}</span>
                </td>
                <td class="py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full transition-all duration-700"
                        :style="{ width: (rank.propensity * 100) + '%' }"></div>
                    </div>
                    <span class="text-xs font-black text-slate-900 w-10">{{ (rank.propensity * 100).toFixed(1) }}%</span>
                  </div>
                </td>
                <td class="py-4 text-center">
                  <div class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                    <div class="h-full rounded-full transition-all duration-700"
                      :class="rank.efficiency_index >= 0.7 ? 'bg-emerald-500' : rank.efficiency_index >= 0.4 ? 'bg-amber-400' : 'bg-rose-500'"
                      :style="{ width: Math.min(rank.efficiency_index * 100, 100) + '%' }"></div>
                  </div>
                </td>
                <td class="py-4 text-right pr-4">
                  <span class="text-xs font-black px-2 py-1 rounded-lg"
                    :class="efficiencyColor(rank.efficiency_index) === 'text-emerald-600'
                      ? 'bg-emerald-50 text-emerald-700'
                      : efficiencyColor(rank.efficiency_index) === 'text-amber-600'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'">
                    {{ efficiencyLabel(rank.efficiency_index) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty table state -->
        <div v-else class="py-10 text-center">
          <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="text-slate-400 text-sm font-bold">No channel rankings computed yet</p>
          <p class="text-slate-300 text-xs mt-1">Run predictions to generate efficiency rankings</p>
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
