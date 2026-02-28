<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { ref, onMounted, watch, computed } from 'vue'
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
  Filler,
  ArcElement,
  BarElement
} from 'chart.js'
import { Line, Doughnut, Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
)

import PredictionsTab from './Partials/PredictionsTab.vue'

const props = defineProps({
  properties: Array,
  organization: Object
})

const selectedPropertyId = ref(props.properties[0]?.id || null)
const timeframe = ref(30)
const customStartDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const customEndDate = ref(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const isCustomRange = ref(false)
const isLoading = ref(true)
const fetchingInsights = ref(false)
const insightError = ref(false)
const overview = ref(null)
const trendData = ref(null)
const forecastData = ref(null)
const seoIntelligence = ref(null)
const geoTab = ref('country')
const geoSearch = ref('')
const chartMetric = ref('users')
const isAutoRefreshEnabled = ref(false)
const autoRefreshInterval = ref(null)
const lastRefetchTime = ref(null)
const activeTab = ref('overview')
const showSyncSuccessToast = ref(false)
const isReconnecting = ref(false)
const syncPollingInterval = ref(null)

const selectedProperty = computed(() => {
  return props.properties.find(p => p.id === selectedPropertyId.value)
})

const isSyncing = computed(() => {
  return selectedProperty.value?.sync_status === 'syncing'
})

const opportunityKeywords = computed(() => {
  if (!overview.value?.top_queries) return []
  return overview.value.top_queries
    .filter(q => q.impressions > 100 && q.ctr < 0.02) // High impressions, low CTR
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5)
})

const searchChartData = computed(() => {
  if (!trendData.value) return { labels: [], datasets: [] }
  const labels = trendData.value.map(d => new Date(d.snapshot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
  return {
    labels,
    datasets: [
      {
        label: 'Clicks',
        data: trendData.value.map(d => d.clicks),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        yAxisID: 'y'
      },
      {
        label: 'Impressions',
        data: trendData.value.map(d => d.impressions),
        borderColor: '#6366f1',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y1'
      }
    ]
  }
})

const gscChartOptions = computed(() => {
  const opts = JSON.parse(JSON.stringify(chartOptions.value))
  opts.scales.y1.display = true
  return opts
})

const filteredGeoData = computed(() => {
  if (!overview.value) return []
  const data = geoTab.value === 'country' ? overview.value.by_country : overview.value.by_city
  if (!data) return []
  
  if (!geoSearch.value) return data.slice(0, 10)
  
  const query = geoSearch.value.toLowerCase()
  return data.filter(item => item.name.toLowerCase().includes(query)).slice(0, 10)
})

const geoChartData = computed(() => {
  const data = filteredGeoData.value.slice(0, 5)
  return {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.activeUsers || d.value || 0),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  }
})

const acquisitionChartData = computed(() => {
  const data = (overview.value?.by_first_source || []).slice(0, 5)
  return {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.activeUsers || 0),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  }
})

const audienceChartData = computed(() => {
  const data = (overview.value?.by_audience || []).slice(0, 5)
  return {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.activeUsers || 0),
      backgroundColor: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8 }
  },
  cutout: '70%'
}

const chartData = ref({
  labels: [],
  datasets: []
})

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { size: 10, weight: 'bold' }
      }
    },
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
    y1: {
      beginAtZero: true,
      position: 'right',
      display: false, // Only for search
      grid: { drawOnChartArea: false },
      ticks: { color: '#10b981' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' }
    }
  }
})

const insights = ref(null)
const campaigns = ref([])

const fetchData = async (forceRefresh = false) => {
  if (!selectedPropertyId.value) return
  
  isLoading.value = true
  overview.value = null // Reset on fetch
  insights.value = null
  insightError.value = false

  try {
    const params = timeframe.value === 'custom' 
      ? { start_date: customStartDate.value, end_date: customEndDate.value }
      : { days: timeframe.value }

    if (forceRefresh) {
      params.refresh = 1
    }

    const [overviewRes, trendsRes, acquisitionRes, forecastRes, intelligenceRes] = await Promise.all([
      axios.get(route('api.analytics.overview', { property: selectedPropertyId.value }), { params }),
      axios.get(route('api.analytics.trends', { property: selectedPropertyId.value }), { params }),
      axios.get(route('api.analytics.acquisition', { property: selectedPropertyId.value }), { params }),
      axios.get(route('api.analytics.forecast', { property: selectedPropertyId.value }), { params }),
      axios.get(route('api.analytics.seo-intelligence', { property: selectedPropertyId.value }))
    ])
    
    overview.value = overviewRes.data
    trendData.value = trendsRes.data
    campaigns.value = acquisitionRes.data
    forecastData.value = forecastRes.data
    seoIntelligence.value = intelligenceRes.data
    lastRefetchTime.value = new Date()
    updateChart()

    // Fetch insights in background
    fetchInsights(params)
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    isLoading.value = false
  }
}

const handleForceReconnect = () => {
    isReconnecting.value = true
    // Get current URL but ensure we include the active tab/params
    const currentUrl = window.location.href
    window.location.href = route('auth.google', { 
        intent: 'connect',
        redirect_to: currentUrl 
    })
}

const fetchInsights = async (params) => {
  fetchingInsights.value = true
  insightError.value = false
  console.log('[AI] Starting insight fetch...', params)
  try {
    const insightsRes = await axios.get(route('api.analytics.insights', { property: selectedPropertyId.value, ...params }))
    insights.value = insightsRes.data
    console.log('[AI] Insight fetch complete:', insights.value ? 'Success' : 'No data')
  } catch (error) {
    console.error('[AI] Insight fetch failed:', error)
    insightError.value = true
  } finally {
    fetchingInsights.value = false
  }
}

const refreshInsights = async () => {
  const params = timeframe.value === 'custom' 
    ? { start_date: customStartDate.value, end_date: customEndDate.value, refresh: 1 }
    : { days: timeframe.value, refresh: 1 }
  
  await fetchInsights(params)
}

const updateChart = () => {
  if (!trendData.value) return
  
  const labels = trendData.value.map(d => new Date(d.snapshot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
  
  if (chartMetric.value === 'users') {
    chartOptions.value.scales.y1.display = false
    chartData.value = {
      labels,
      datasets: [
        {
          label: 'Total Users',
          data: trendData.value.map(d => d.users || 0),
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
  } else {
    chartOptions.value.scales.y1.display = true
    chartData.value = {
      labels,
      datasets: [
        {
          label: 'Clicks',
          data: trendData.value.map(d => d.clicks),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Impressions',
          data: trendData.value.map(d => d.impressions),
          borderColor: '#6366f1',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          yAxisID: 'y1'
        }
      ]
    }
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

const formatLastUpdated = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const toggleAutoRefresh = () => {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value
  
  if (isAutoRefreshEnabled.value) {
    // Refresh every 15 minutes
    autoRefreshInterval.value = setInterval(() => {
      fetchData(true)
    }, 15 * 60 * 1000)
  } else {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
  }
}

const startSyncPolling = () => {
  if (syncPollingInterval.value) return
  
  syncPollingInterval.value = setInterval(() => {
    router.reload({ 
      only: ['properties'], 
      preserveScroll: true, 
      preserveState: true,
      onSuccess: () => {
        if (selectedProperty.value?.sync_status === 'completed') {
          stopSyncPolling()
          showSyncSuccessToast.value = true
          setTimeout(() => showSyncSuccessToast.value = false, 8000)
          fetchData() // Refetch data to show fresh sync results
        } else if (selectedProperty.value?.sync_status === 'failed') {
          stopSyncPolling()
        }
      }
    })
  }, 5000)
}

const stopSyncPolling = () => {
  if (syncPollingInterval.value) {
    clearInterval(syncPollingInterval.value)
    syncPollingInterval.value = null
  }
}

watch(isSyncing, (syncing) => {
  if (syncing) {
    startSyncPolling()
  } else {
    stopSyncPolling()
  }
}, { immediate: true })

const getSEOStatus = (rate, deviceType = 'desktop') => {
  const percentage = (rate || 0) * 100
  const isMobile = deviceType?.toLowerCase() === 'mobile' || deviceType?.toLowerCase() === 'tablet'
  
  // Mobile thresholds are typically higher due to network/intent differences
  const thresholds = isMobile 
    ? { optimum: 55, fair: 75 } // Mobile: <55% is good, 55-75% is fair
    : { optimum: 45, fair: 65 } // Desktop: <45% is good, 45-65% is fair

  if (percentage < thresholds.optimum) {
    return { 
      label: 'Optimum', 
      class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: '✨',
      description: 'Excellent engagement. Users are finding exactly what they need.'
    }
  }
  if (percentage < thresholds.fair) {
    return { 
      label: 'Fair', 
      class: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: '⚖️',
      description: 'Average performance. Consider optimizing content or CTA placement.'
    }
  }
  return { 
    label: 'Poor', 
    class: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    icon: '🚩',
    description: 'High bounce rate. Page may have loading issues or low relevance.'
  }
}

const deviceStats = computed(() => {
  if (!overview.value?.by_device) return null
  const mobile = overview.value.by_device.find(d => d.name.toLowerCase() === 'mobile')
  const desktop = overview.value.by_device.find(d => d.name.toLowerCase() === 'desktop')
  return { mobile, desktop }
})

onMounted(() => {
  if (selectedPropertyId.value) {
    fetchData()
  }
})

watch(() => props.properties, (newProps) => {
  if (newProps.length > 0 && !selectedPropertyId.value) {
    selectedPropertyId.value = newProps[0].id
  }
}, { immediate: true })

watch(timeframe, (newVal) => {
  isCustomRange.value = newVal === 'custom'
})

watch(chartMetric, () => {
  updateChart()
})

const getTrendInfo = (value) => {
  if (value === 0 || value === null || isNaN(value)) return null
  const isPositive = value > 0
  return {
    isPositive,
    label: `${Math.abs(value).toFixed(1)}%`,
    class: isPositive ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    icon: isPositive ? '↑' : '↓'
  }
}

const trajectoryAlert = computed(() => {
  if (!overview.value?.deltas) return null
  
  const userDelta = overview.value.deltas.total_users
  if (userDelta < -10) {
    return {
      type: 'warning',
      title: 'Traffic Drop Detected',
      message: `You've lost ${Math.abs(userDelta).toFixed(1)}% of your traffic compared to the previous period.`,
      icon: '📉'
    }
  }
  
  if (userDelta > 15) {
    return {
      type: 'success',
      title: 'Strong Growth Spurt',
      message: `Your traffic is up by ${userDelta.toFixed(1)}%! Keep up the momentum.`,
      icon: '📈'
    }
  }
  
  return null
})

const querySearch = ref('')
const pageSearch = ref('')
const queryTrendFilter = ref('all') // 'all', 'growing', 'declining'
const pageTrendFilter = ref('all') // 'all', 'growing', 'declining'
const queryPage = ref(1)
const pagePage = ref(1)
const itemsPerPage = 10

const pagedQueries = computed(() => {
  if (!overview.value?.top_queries) return []
  let filtered = overview.value.top_queries
  
  // Search filter
  if (querySearch.value) {
    const s = querySearch.value.toLowerCase()
    filtered = filtered.filter(q => q.name.toLowerCase().includes(s))
  }
  
  // Trend filter
  if (queryTrendFilter.value === 'growing') {
    filtered = filtered.filter(q => q.delta_clicks > 0)
  } else if (queryTrendFilter.value === 'declining') {
    filtered = filtered.filter(q => q.delta_clicks < 0)
  }
  
  const start = (queryPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

const queryTotalPages = computed(() => {
  if (!overview.value?.top_queries) return 0
  let filtered = overview.value.top_queries
  
  if (querySearch.value) {
    const s = querySearch.value.toLowerCase()
    filtered = filtered.filter(q => q.name.toLowerCase().includes(s))
  }
  
  if (queryTrendFilter.value === 'growing') {
    filtered = filtered.filter(q => q.delta_clicks > 0)
  } else if (queryTrendFilter.value === 'declining') {
    filtered = filtered.filter(q => q.delta_clicks < 0)
  }
  
  return Math.ceil(filtered.length / itemsPerPage)
})

const pagedPagesGsc = computed(() => {
  if (!overview.value?.top_pages_gsc) return []
  let filtered = overview.value.top_pages_gsc
  
  // Search filter
  if (pageSearch.value) {
    const s = pageSearch.value.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s))
  }
  
  // Trend filter
  if (pageTrendFilter.value === 'growing') {
    filtered = filtered.filter(p => p.delta_clicks > 0)
  } else if (pageTrendFilter.value === 'declining') {
    filtered = filtered.filter(p => p.delta_clicks < 0)
  }
  
  const start = (pagePage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

const pagesGscTotalPages = computed(() => {
  if (!overview.value?.top_pages_gsc) return 0
  let filtered = overview.value.top_pages_gsc
  
  if (pageSearch.value) {
    const s = pageSearch.value.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s))
  }
  
  if (pageTrendFilter.value === 'growing') {
    filtered = filtered.filter(p => p.delta_clicks > 0)
  } else if (pageTrendFilter.value === 'declining') {
    filtered = filtered.filter(p => p.delta_clicks < 0)
  }
  
  return Math.ceil(filtered.length / itemsPerPage)
})

watch([querySearch, queryTrendFilter], () => queryPage.value = 1)
watch([pageSearch, pageTrendFilter], () => pagePage.value = 1)

watch([selectedPropertyId, timeframe, customStartDate, customEndDate], () => {
  fetchData()
  queryPage.value = 1
  pagePage.value = 1
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
  stopSyncPolling()
})

</script>

<template>
  <Head title="Analytics Dashboard" />

  <AppLayout>
    <div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <div class="flex items-center gap-3 mt-2">
            <p class="text-slate-500 font-medium">Insights and performance tracking for {{ organization.name }}</p>
            <div v-if="overview?.last_updated" class="flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 shadow-sm animate-in fade-in duration-500">
               <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
               <span class="text-[10px] font-black text-slate-500 uppercase tracking-tight">Updated: {{ formatLastUpdated(overview.last_updated) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-premium border border-slate-100">
          <select v-model="selectedPropertyId" class="bg-transparent border-none focus:ring-0 font-bold text-slate-700 pr-10 cursor-pointer">
            <option v-for="prop in properties" :key="prop.id" :value="prop.id">
              {{ prop.name }}
            </option>
          </select>
          
          <div class="w-px h-6 bg-slate-100"></div>
          
          <select v-model="timeframe" class="bg-transparent border-none focus:ring-0 font-bold text-blue-600 cursor-pointer pr-10 hover:text-blue-700 transition-colors">
            <option :value="0">Today</option>
            <option :value="1">Yesterday</option>
            <option :value="7">Last 7 Days</option>
            <option :value="14">Last 14 Days</option>
            <option :value="28">Last 28 Days</option>
            <option :value="30">Last 30 Days</option>
            <option :value="90">Last 3 Months</option>
            <option :value="180">Last 6 Months</option>
            <option :value="365">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          <div class="w-px h-6 bg-slate-100"></div>

          <button @click="fetchData(true)" 
            class="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group"
            :disabled="isLoading"
            title="Refresh Data from API">
            <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-500" 
              :class="{ 'animate-spin text-blue-500': isLoading }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-xs font-bold text-slate-500 group-hover:text-slate-700">Refetch</span>
          </button>

          <div class="w-px h-6 bg-slate-100"></div>

          <button @click="toggleAutoRefresh" 
            class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group"
            :title="isAutoRefreshEnabled ? 'Disable Auto-refresh' : 'Enable Auto-refresh every 15m'">
            <div class="w-2 h-2 rounded-full" :class="isAutoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></div>
            <span class="text-xs font-bold transition-colors" :class="isAutoRefreshEnabled ? 'text-emerald-600' : 'text-slate-500'">Auto</span>
          </button>
        </div>

        <!-- Sync Progress Indicator -->
        <div v-if="isSyncing" class="flex items-center gap-4 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 animate-in slide-in-from-right-4 duration-500">
          <div class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-blue-100 leading-none">Background Sync</span>
            <span class="text-xs font-bold mt-0.5">Updating property data...</span>
          </div>
        </div>

        <div v-if="isCustomRange" class="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl shadow-premium border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">From</span>
            <input type="date" v-model="customStartDate" class="bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1" />
          </div>
          <div class="w-px h-4 bg-slate-100"></div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">To</span>
            <input type="date" v-model="customEndDate" class="bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1" />
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-2 border-b border-slate-100 px-2">
        <button 
          @click="activeTab = 'overview'"
          :class="activeTab === 'overview' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'"
          class="flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          General Overview
        </button>
        <button 
          @click="activeTab = 'gsc'"
          :class="activeTab === 'gsc' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'"
          class="flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Search Console
        </button>
        <button 
          @click="activeTab = 'predictions'" 
          :class="activeTab === 'predictions' ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'"
          class="flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Predictions & Insights
        </button>
      </div>

      <!-- Trajectory Alert Banner -->
      <div v-if="trajectoryAlert" 
        :class="trajectoryAlert.type === 'warning' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'"
        class="p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 mb-2">
        <div class="flex items-center gap-5">
          <div class="text-4xl">{{ trajectoryAlert.icon }}</div>
          <div>
            <h3 class="text-lg font-black" :class="trajectoryAlert.type === 'warning' ? 'text-rose-900' : 'text-emerald-900'">{{ trajectoryAlert.title }}</h3>
            <p class="font-medium text-sm" :class="trajectoryAlert.type === 'warning' ? 'text-rose-700' : 'text-emerald-700'">{{ trajectoryAlert.message }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border" 
            :class="trajectoryAlert.type === 'warning' ? 'bg-rose-100/50 text-rose-600 border-rose-200' : 'bg-emerald-100/50 text-emerald-600 border-emerald-200'">
            Anomaly Detected
          </span>
        </div>
      </div>

      <div v-if="activeTab === 'overview'" class="space-y-10 animate-in fade-in duration-500">
        <!-- Stats Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium">
          <div class="skeleton h-3 w-20 rounded-full mb-2"></div>
          <div class="skeleton h-2 w-32 rounded-full mb-4 opacity-50"></div>
          <div class="skeleton h-10 w-24 rounded-xl mt-3"></div>
        </div>
      </div>

      <!-- Google Connection Error Warning -->
      <div v-if="overview?.google_token_invalid" class="mb-10 bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-rose-800">Google Connection Expired</h3>
            <p class="text-rose-700 font-medium">Your Google access token has expired or was revoked. Please reconnect to restore analytics.</p>
          </div>
        </div>
        <button 
          @click="handleForceReconnect" 
          :disabled="isReconnecting"
          class="whitespace-nowrap px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="isReconnecting" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isReconnecting ? 'Connecting...' : 'Reconnect Google' }}
        </button>
      </div>

      <!-- Search Console Permission Warning (Only if confirmed 403) -->
      <div v-if="overview?.gsc_permission_error" class="mb-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-amber-800">Search Console Permission Denied</h3>
            <p class="text-amber-700 font-medium">Google returned a permission error for this site. Click below to re-authorize with full Search Console access.</p>
          </div>
        </div>
        <button 
          @click="handleForceReconnect" 
          :disabled="isReconnecting"
          class="whitespace-nowrap px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="isReconnecting" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ isReconnecting ? 'Connecting...' : 'Re-authorize GSC' }}
        </button>
      </div>

      <div v-if="overview && overview.total_users > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- GA4: Total Users -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all">
          <div class="flex items-center justify-between mb-1">
            <div class="flex flex-col">
              <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Users</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">Active vs Total (GA4)</p>
            </div>
            <!-- Trend Pill -->
            <div v-if="overview.deltas?.total_users" :class="getTrendInfo(overview.deltas.total_users).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
              <span>{{ getTrendInfo(overview.deltas.total_users).icon }}</span>
              <span>{{ getTrendInfo(overview.deltas.total_users).label }}</span>
            </div>
          </div>
          <div class="flex items-baseline gap-2 mt-3">
            <h3 class="text-3xl font-black text-slate-900">{{ overview.total_users || 0 }}</h3>
            <span class="text-xs font-bold text-slate-400">/ {{ overview.total_users_all || 0 }}</span>
          </div>
        </div>

        <!-- GA4: Conversions -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <div class="flex items-center justify-between mb-1">
            <div class="flex flex-col">
              <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Conversions</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">Key goal completions (GA4)</p>
            </div>
            <!-- Trend Pill -->
            <div v-if="overview.deltas?.total_conversions" :class="getTrendInfo(overview.deltas.total_conversions).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
              <span>{{ getTrendInfo(overview.deltas.total_conversions).icon }}</span>
              <span>{{ getTrendInfo(overview.deltas.total_conversions).label }}</span>
            </div>
          </div>
          <h3 class="text-3xl font-black text-blue-600 mt-3">{{ overview.total_conversions || 0 }}</h3>
        </div>

        <!-- GSC: Impressions -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <!-- ... existing overlays ... -->
          <div v-if="overview.gsc_permission_error" class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
            <span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Permission Denied</span>
          </div>
          <div v-else-if="overview.total_impressions === 0" class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
            <div class="flex flex-col items-center">
              <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-pulse">Syncing data...</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between mb-1">
            <div class="flex flex-col">
              <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Impressions</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">Times seen in Search (GSC)</p>
            </div>
            <!-- Trend Pill -->
            <div v-if="overview.deltas?.total_impressions" :class="getTrendInfo(overview.deltas.total_impressions).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
              <span>{{ getTrendInfo(overview.deltas.total_impressions).icon }}</span>
              <span>{{ getTrendInfo(overview.deltas.total_impressions).label }}</span>
            </div>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ overview.total_impressions?.toLocaleString() || 0 }}</h3>
        </div>

        <!-- GSC: Clicks -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div v-if="overview.gsc_permission_error" class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
            <span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Permission Required</span>
          </div>
          <div class="flex items-center justify-between mb-1">
            <div class="flex flex-col">
              <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Clicks</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">Visits from Search (GSC)</p>
            </div>
            <!-- Trend Pill -->
            <div v-if="overview.deltas?.total_clicks" :class="getTrendInfo(overview.deltas.total_clicks).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
              <span>{{ getTrendInfo(overview.deltas.total_clicks).icon }}</span>
              <span>{{ getTrendInfo(overview.deltas.total_clicks).label }}</span>
            </div>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ overview.total_clicks?.toLocaleString() || 0 }}</h3>
        </div>

        <!-- GSC: Avg. Position -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div v-if="overview.gsc_permission_error" class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
            <span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Permission Required</span>
          </div>
          <div class="flex items-center justify-between mb-1">
            <div class="flex flex-col">
              <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Avg. Position</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">Mean rank in Search (GSC)</p>
            </div>
            <!-- Trend Pill -->
            <div v-if="overview.deltas?.avg_position" :class="getTrendInfo(overview.deltas.avg_position).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
              <span>{{ getTrendInfo(overview.deltas.avg_position).icon }}</span>
              <span>{{ getTrendInfo(overview.deltas.avg_position).label }}</span>
            </div>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ overview.avg_position?.toFixed(1) || 0 }}</h3>
        </div>

        <!-- GSC: CTR -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div v-if="overview.gsc_permission_error" class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4">
            <span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">Permission Required</span>
          </div>
          <div class="flex flex-col">
            <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">CTR</p>
            <p class="text-[9px] text-slate-400 font-medium mt-0.5">Click-through rate (GSC)</p>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ (overview.avg_ctr * 100).toFixed(2) }}%</h3>
        </div>

        <!-- GA4: Bounce Rate -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <div class="flex flex-col">
            <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Bounce Rate</p>
            <p class="text-[9px] text-slate-400 font-medium mt-0.5">Single-page rate (GA4)</p>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ (overview.avg_bounce_rate * 100).toFixed(1) }}%</h3>
        </div>

        <!-- GA4: Avg. Duration -->
        <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all">
          <div class="flex flex-col">
            <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Avg. Duration</p>
            <p class="text-[9px] text-slate-400 font-medium mt-0.5">Time per visit (GA4)</p>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mt-3">{{ formatDuration(overview.avg_duration) }}</h3>
        </div>
      </div>

      <!-- Bounce Rate SEO Health Banner -->
      <div v-if="overview && overview.total_users > 0 && deviceStats" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">
        <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <h3 class="text-sm font-black text-white uppercase tracking-widest">Mobile Bounce Health</h3>
              </div>
              <span v-if="deviceStats.mobile" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" :class="getSEOStatus(deviceStats.mobile.bounceRate, 'mobile').class">
                {{ getSEOStatus(deviceStats.mobile.bounceRate, 'mobile').label }}
              </span>
            </div>
            <div v-if="deviceStats.mobile" class="flex items-end gap-3">
              <h4 class="text-4xl font-black text-white">{{ (deviceStats.mobile.bounceRate * 100).toFixed(1) }}%</h4>
              <p class="text-slate-400 text-xs mb-1.5 font-medium">{{ getSEOStatus(deviceStats.mobile.bounceRate, 'mobile').description }}</p>
            </div>
            <p v-else class="text-slate-500 italic text-sm">Insufficient mobile traffic data</p>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="text-sm font-black text-slate-500 uppercase tracking-widest">Desktop Bounce Health</h3>
            </div>
            <span v-if="deviceStats.desktop" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" :class="getSEOStatus(deviceStats.desktop.bounceRate, 'desktop').class">
              {{ getSEOStatus(deviceStats.desktop.bounceRate, 'desktop').label }}
            </span>
          </div>
          <div v-if="deviceStats.desktop" class="flex items-end gap-3">
            <h4 class="text-4xl font-black text-slate-900">{{ (deviceStats.desktop.bounceRate * 100).toFixed(1) }}%</h4>
            <p class="text-slate-500 text-xs mb-1.5 font-medium">{{ getSEOStatus(deviceStats.desktop.bounceRate, 'desktop').description }}</p>
          </div>
          <p v-else class="text-slate-400 italic text-sm">Insufficient desktop traffic data</p>
        </div>
      </div>

      <!-- AI Performance Insights -->
      <div v-if="isLoading || (overview && overview.total_users > 0)" class="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">

        <!-- Decorative background elements -->
        <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000"></div>
        <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

        <div class="relative z-10">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div class="flex items-center gap-4">
              <div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h2 class="text-2xl font-black text-white">AI Performance Insights</h2>
                <p class="text-slate-400 font-medium">Smart analysis of your SEO & traffic trends</p>
              </div>
            </div>
            
            <button @click="refreshInsights" class="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all backdrop-blur-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Update Analysis
            </button>
          </div>

          <!-- Results or Empty States -->
          <template v-if="organization?.settings?.ai_insights_enabled !== false">
            <!-- Configuration Required State -->
            <div v-if="insights?.status === 'configuration_required'" class="py-10">
              <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-sm shrink-0 border border-amber-500/10">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-white">AI Model Setup Required</h3>
                    <p class="text-sm text-slate-400 mt-1">Select an AI model in your organization settings to enable automated performance insights.</p>
                  </div>
                </div>
                <Link :href="route('organization.settings', { tab: 'ai' })" class="whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                  Configure AI Model
                </Link>
              </div>
            </div>

            <div v-else-if="insights && (!fetchingInsights || insights)" class="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <!-- Summary & Findings -->
              <div class="space-y-8">
                <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                  <div class="flex items-center gap-3 mb-4">
                    <span class="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/30">Executive Summary</span>
                    <span v-if="insights.severity" class="px-3 py-1 border text-[10px] font-black uppercase tracking-widest rounded-lg"
                      :class="{
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30': insights.severity === 'low',
                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30': insights.severity === 'medium',
                        'bg-red-500/20 text-red-300 border-red-500/30': insights.severity === 'high'
                      }">
                      Priority: {{ insights.severity }}
                    </span>
                  </div>
                  <p class="text-lg font-medium text-slate-200 leading-relaxed">{{ insights.body || 'No summary available for this period.' }}</p>
                </div>

                <div class="space-y-4">
                  <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Key Findings</h3>
                  <div class="grid gap-3">
                    <div v-for="(finding, idx) in (insights.context?.key_findings || [])" :key="idx" 
                      class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-all">
                      <div class="w-2 h-2 rounded-full" :class="idx % 2 === 0 ? 'bg-blue-400' : 'bg-emerald-400'"></div>
                      <span class="text-slate-300 font-medium">{{ finding }}</span>
                    </div>
                    <p v-if="!insights.context?.key_findings?.length" class="text-slate-500 text-sm italic px-2">No key findings detected.</p>
                  </div>
                </div>
              </div>

              <!-- Recommendations & Strategy -->
              <div class="space-y-10">
                <div class="space-y-6">
                  <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Actionable Recommendations</h3>
                  <div class="space-y-4">
                    <div v-for="(rec, idx) in (insights.context?.recommendations || [])" :key="idx" 
                      class="p-6 bg-gradient-to-r from-blue-500/10 to-transparent rounded-[2rem] border border-blue-500/20 group/item hover:border-blue-500/40 transition-all">
                      <div class="flex gap-4">
                        <div class="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm border border-blue-500/20">
                          {{ idx + 1 }}
                        </div>
                        <p class="text-slate-200 font-bold leading-relaxed">{{ rec }}</p>
                      </div>
                    </div>
                    <p v-if="!insights.context?.recommendations?.length" class="text-slate-500 text-sm italic px-2">No recommendations available.</p>
                  </div>
                </div>

                <!-- Keyword Strategy Section -->
                <div v-if="insights.context?.keyword_strategy?.length" class="space-y-6">
                  <h3 class="text-sm font-black text-emerald-400/80 uppercase tracking-widest px-2 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16"></path></svg>
                    Keyword Strategy
                  </h3>
                  <div class="grid gap-4">
                    <div v-for="(strat, idx) in insights.context.keyword_strategy" :key="idx"
                      class="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                      <p class="text-slate-300 text-sm font-medium leading-relaxed italic">"{{ strat }}"</p>
                    </div>
                  </div>
                </div>

                <!-- Report Enhancement Suggestions -->
                <div v-if="insights.context?.report_enhancements?.length" class="bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10">
                  <h3 class="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    Enhance this Report
                  </h3>
                  <ul class="space-y-2">
                    <li v-for="(sug, idx) in insights.context.report_enhancements" :key="idx" 
                      class="text-[11px] font-bold text-slate-400 flex items-start gap-2">
                      <span class="text-indigo-500 mt-1">•</span>
                      {{ sug }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <!-- Loading State -->
            <div v-else-if="fetchingInsights" class="py-10">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div class="space-y-8">
                  <div class="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                    <div class="skeleton-dark h-3 w-32 rounded-full mb-6"></div>
                    <div class="space-y-3">
                      <div class="skeleton-dark h-5 w-full rounded-full"></div>
                      <div class="skeleton-dark h-5 w-5/6 rounded-full"></div>
                      <div class="skeleton-dark h-5 w-4/6 rounded-full"></div>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="skeleton-dark h-3 w-24 rounded-full mx-2"></div>
                    <div v-for="i in 3" :key="i" class="skeleton-dark h-16 w-full rounded-2xl"></div>
                  </div>
                </div>
                <div class="space-y-6">
                  <div class="skeleton-dark h-3 w-40 rounded-full mx-2"></div>
                  <div v-for="i in 3" :key="i" class="skeleton-dark h-24 w-full rounded-[2rem]"></div>
                </div>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="insightError" class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5">
               <div class="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-xl border border-rose-500/10">
                  <span class="text-4xl">⚠️</span>
               </div>
               <h3 class="text-xl font-black text-white mb-2">Analysis Failed</h3>
               <p class="text-slate-400 font-medium mb-6">We couldn't generate insights at this time.</p>
               <button @click="refreshInsights" class="text-blue-400 font-bold hover:underline">Try again</button>
            </div>

            <!-- Empty State (No Data) -->
            <div v-else class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5">
              <div class="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-xl border border-blue-500/10">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 class="text-xl font-black text-white mb-2">Awaiting Intelligence</h3>
              <p class="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">We need historical data for this property to generate contextual insights. Check back tomorrow!</p>
            </div>
          </template>
 
          <!-- Disabled State -->
          <div v-else class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5">
            <div class="w-24 h-24 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-purple-400 shadow-xl border border-purple-500/10">
               <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-xl font-black text-white mb-2">Insights Disabled</h3>
            <p class="text-slate-400 max-w-sm mx-auto font-medium mb-6">AI analysis is currently turned off for this organization.</p>
            <Link :href="route('organization.settings', { tab: 'ai' })" class="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-purple-900/40">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Enable AI Insights
            </Link>
          </div>
        </div>
      </div>

      <!-- Main Chart Area -->
      <div v-if="isLoading" class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12">
        <div class="flex items-center justify-between mb-10">
          <div class="space-y-2">
            <div class="skeleton h-6 w-48 rounded-full"></div>
            <div class="skeleton h-3 w-32 rounded-full opacity-50"></div>
          </div>
          <div class="skeleton h-10 w-40 rounded-xl"></div>
        </div>
        <div class="skeleton h-[400px] w-full rounded-[2rem]"></div>
      </div>

      <div v-else-if="overview && overview.total_users > 0" class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Performance Trends</h2>
            <p class="text-slate-500 font-medium mt-1">Daily activity overview</p>
          </div>
          
          <div class="flex bg-slate-50 p-1 rounded-xl">
            <button @click="chartMetric = 'users'" 
              :class="chartMetric === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
              class="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Engagement</button>
            <button @click="chartMetric = 'search'" 
              :class="chartMetric === 'search' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
              class="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Search</button>
          </div>
        </div>
        
        <div class="h-[400px]">
          <Line v-if="chartData.labels.length" :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Restored GA4 Sections -->
      <div v-if="overview && overview.total_users > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        
        <!-- Acquisition & Events -->
        <div class="space-y-8">
          <!-- Acquisition: First User Source -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
              Active Users by First User Source
            </h3>
            <div class="flex flex-col md:flex-row gap-8 items-center">
              <!-- Chart -->
              <div class="w-40 h-40 shrink-0">
                <Doughnut :data="acquisitionChartData" :options="doughnutOptions" />
              </div>
              
              <!-- Legend/List -->
              <div class="flex-1 space-y-4 w-full">
                <div v-for="(source, idx) in (overview?.by_first_source?.slice(0, 5) || [])" :key="source.name" class="group">
                  <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: acquisitionChartData.datasets[0].backgroundColor[idx] }"></span>
                      <span class="text-xs font-bold text-slate-700 truncate" :title="source.name">{{ source.name }}</span>
                    </div>
                    <span class="text-xs font-black text-slate-900">{{ (source.activeUsers || 0).toLocaleString() }}</span>
                  </div>
                  <div class="h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000 ease-out" 
                      :style="{ width: ((source.activeUsers || 0) / (overview.total_users || 1) * 100) + '%', backgroundColor: acquisitionChartData.datasets[0].backgroundColor[idx] }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audience: Active Users by Audience -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Active Users by Audience
            </h3>
            <div class="flex flex-col md:flex-row gap-8 items-center">
              <!-- Chart -->
              <div class="w-40 h-40 shrink-0">
                <Doughnut :data="audienceChartData" :options="doughnutOptions" />
              </div>

              <!-- List -->
              <div class="flex-1 space-y-4 w-full">
                <div v-for="(audience, idx) in (overview?.by_audience?.slice(0, 5) || [])" :key="audience.name" class="group">
                  <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: audienceChartData.datasets[0].backgroundColor[idx] }"></span>
                      <span class="text-xs font-bold text-slate-700 truncate" :title="audience.name">{{ audience.name }}</span>
                    </div>
                    <span class="text-xs font-black text-slate-900">{{ (audience.activeUsers || 0).toLocaleString() }}</span>
                  </div>
                  <div class="h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000 ease-out" 
                      :style="{ width: ((audience.activeUsers || 0) / (overview.total_users || 1) * 100) + '%', backgroundColor: audienceChartData.datasets[0].backgroundColor[idx] }"></div>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!overview?.by_audience?.length" class="text-center py-8 text-slate-400 italic text-sm">No audience data available</p>
          </div>


          <!-- Events: Event Performance -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Event Performance
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-slate-50">
                    <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Event Name</th>
                    <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Users</th>
                    <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Count</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="event in (overview?.by_event || [])" :key="event.name" class="group hover:bg-slate-50 transition-colors">
                    <td class="py-4 pl-4 pr-4">
                      <span class="text-sm font-bold text-slate-700 block mb-1">{{ event.name }}</span>
                      <div class="h-1 bg-slate-100 rounded-full overflow-hidden w-24">
                         <div class="h-full bg-purple-500 rounded-full" 
                          :style="{ width: Math.min(((event.eventCount || 0) / (overview?.by_event?.[0]?.eventCount || 1) * 100), 100) + '%' }"></div>
                      </div>
                    </td>
                    <td class="py-4 text-right">
                      <span class="text-sm font-black text-slate-900">{{ (event.activeUsers || 0).toLocaleString() }}</span>
                    </td>
                    <td class="py-4 text-right pr-4">
                      <span class="text-sm font-medium text-slate-500">{{ (event.eventCount || 0).toLocaleString() }}</span>
                      <span class="block text-[9px] text-purple-600 font-bold" v-if="event.conversions > 0">{{ event.conversions }} Conv.</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-if="!overview?.by_event?.length" class="text-center py-10 text-slate-400 italic text-sm">No event data available</p>
            </div>
          </div>
        </div>

        <!-- Geography & Pages -->
        <div class="space-y-8">
          <!-- Geography: Country & City -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Geography Overview
              </h3>
              
              <!-- Tabs & Filter -->
              <div class="flex items-center gap-2">
                 <div class="flex bg-slate-50 p-1 rounded-xl">
                  <button @click="geoTab = 'country'" 
                    :class="geoTab === 'country' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                    class="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Country</button>
                  <button @click="geoTab = 'city'" 
                    :class="geoTab === 'city' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                    class="px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all">City</button>
                </div>
              </div>
            </div>
            
             <!-- Search Filter -->
             <div class="mb-6">
                <div class="relative">
                  <input v-model="geoSearch" type="text" placeholder="Search locations..." 
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20">
                    <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
             </div>

            <div class="flex flex-col md:flex-row gap-8 items-start">
               <!-- Chart -->
               <div class="w-full md:w-1/3 h-48 shrink-0 flex items-center justify-center">
                 <Doughnut v-if="filteredGeoData.length" :data="geoChartData" :options="doughnutOptions" />
                 <p v-else class="text-slate-300 text-xs font-bold uppercase tracking-widest">No Data</p>
               </div>

               <!-- List -->
               <div class="w-full md:w-2/3 space-y-3">
                 <div v-for="(item, idx) in filteredGeoData" :key="item.name" class="flex items-center justify-between group">
                   <div class="flex items-center gap-2 overflow-hidden">
                      <span class="w-2.5 h-2.5 rounded-full shrink-0" 
                        :style="{ backgroundColor: idx < 5 ? geoChartData.datasets[0].backgroundColor[idx] : '#cbd5e1' }"></span>
                      <span class="text-sm font-bold text-slate-700 truncate" :title="item.name">{{ item.name }}</span>
                   </div>
                   <span class="text-sm font-black text-slate-900">{{ (item.activeUsers || item.value || 0).toLocaleString() }}</span>
                 </div>
                 <p v-if="!filteredGeoData.length" class="text-center py-4 text-slate-400 italic text-sm">No locations found</p>
               </div>
            </div>
          </div>

          <!-- Pages: Page Title & Screen Name -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Views by Page Title and Screen Name
            </h3>
            <div class="space-y-8">
              <!-- By Page Title -->
              <div>
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Top Page Titles
                </h4>
                <div class="space-y-4">
                  <div v-for="(page, idx) in (overview?.by_page_title?.slice(0, 5) || [])" :key="page.name" class="group">
                    <div class="flex justify-between items-start mb-2 gap-4">
                      <span class="text-sm font-bold text-slate-700 leading-tight line-clamp-2" :title="page.name">{{ page.name }}</span>
                      <div class="text-right shrink-0">
                        <span class="block text-sm font-black text-slate-900">{{ (page.screenPageViews || page.activeUsers || 0).toLocaleString() }}</span>
                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Views</span>
                      </div>
                    </div>
                    <div class="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100" 
                        :style="{ width: ((page.screenPageViews || page.activeUsers || 0) / (overview?.by_page_title?.[0]?.screenPageViews || overview?.by_page_title?.[0]?.activeUsers || 1) * 100) + '%' }"></div>
                    </div>
                  </div>
                  <p v-if="!overview?.by_page_title?.length" class="text-slate-400 italic text-xs mt-2">No page title data</p>
                </div>
              </div>

              <!-- By Screen Name -->
              <div>
                 <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                  Top Screen Names
                </h4>
                <div class="space-y-4">
                  <div v-for="(screen, idx) in (overview?.by_screen?.slice(0, 5) || [])" :key="screen.name" class="group">
                    <div class="flex justify-between items-center mb-2 gap-4">
                      <span class="text-sm font-bold text-slate-700 truncate" :title="screen.name">{{ screen.name }}</span>
                       <div class="text-right shrink-0">
                        <span class="block text-sm font-black text-slate-900">{{ (screen.screenPageViews || screen.activeUsers || 0).toLocaleString() }}</span>
                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Views</span>
                      </div>
                    </div>
                     <div class="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div class="h-full bg-pink-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100" 
                        :style="{ width: ((screen.screenPageViews || screen.activeUsers || 0) / (overview?.by_screen?.[0]?.screenPageViews || overview?.by_screen?.[0]?.activeUsers || 1) * 100) + '%' }"></div>
                    </div>
                  </div>
                  <p v-if="!overview?.by_screen?.length" class="text-slate-400 italic text-xs mt-2">No screen name data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Discovered Page Performance: Detailed SEO Status -->
      <div v-if="overview && overview.total_users > 0" class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12 animate-in fade-in duration-700">
        <div class="flex items-center justify-between mb-10">
          <h3 class="text-2xl font-black text-slate-900 flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Discovered Page Performance
          </h3>
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest">SEO Optimization Overview</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-50">
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">Page Path</th>
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Users</th>
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Engaged</th>
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Avg. Time</th>
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Bounce Rate</th>
                <th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">SEO Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="page in (overview?.by_page || [])" :key="page.name" class="group hover:bg-slate-50/50 transition-all">
                <td class="py-5 px-4 max-w-md">
                  <span class="text-sm font-bold text-slate-700 truncate block transition-colors group-hover:text-blue-600" :title="page.name">{{ page.name }}</span>
                </td>
                <td class="py-5 text-center">
                  <span class="text-sm font-black text-slate-900">{{ (page.activeUsers || 0).toLocaleString() }}</span>
                </td>
                <td class="py-5 text-center">
                  <span class="text-sm font-bold text-slate-600">{{ (page.engagedSessions || 0).toLocaleString() }}</span>
                </td>
                <td class="py-5 text-center">
                  <span class="text-xs font-black text-slate-500">{{ formatDuration(page.averageSessionDuration) }}</span>
                </td>
                <td class="py-5 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-sm font-bold" :class="getSEOStatus(page.bounceRate).label === 'Poor' ? 'text-rose-500' : 'text-slate-700'">
                      {{ (page.bounceRate * 100).toFixed(1) }}%
                    </span>
                    <div class="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-1000" 
                        :class="getSEOStatus(page.bounceRate).label === 'Optimum' ? 'bg-emerald-500' : (getSEOStatus(page.bounceRate).label === 'Fair' ? 'bg-amber-500' : 'bg-rose-500')"
                        :style="{ width: (100 - (page.bounceRate * 100)) + '%' }"></div>
                    </div>
                  </div>
                </td>
                <td class="py-5 text-right pr-4">
                  <div class="flex items-center justify-end gap-2 group/status relative">
                    <span class="text-lg">{{ getSEOStatus(page.bounceRate).icon }}</span>
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all" :class="getSEOStatus(page.bounceRate).class">
                      {{ getSEOStatus(page.bounceRate).label }}
                    </span>
                    <!-- Tooltip hint -->
                    <div class="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] font-medium rounded-lg opacity-0 group-hover/status:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                      {{ getSEOStatus(page.bounceRate).description }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!overview?.by_page?.length" class="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic text-sm m-4">No discovered page data available for this range</p>
        </div>
      </div>
    </div> <!-- End Overview Tab -->

      <div v-if="activeTab === 'gsc'" class="space-y-10 animate-in fade-in duration-500">
        <!-- Flash Messages -->
        <div v-if="$page.props.flash.success || $page.props.flash.error" class="max-w-4xl mx-auto mb-6">
           <div v-if="$page.props.flash.success" class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 shadow-sm">
               <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
               </div>
               {{ $page.props.flash.success }}
           </div>
           <div v-if="$page.props.flash.error" class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 font-bold text-sm flex items-center gap-3 shadow-sm">
               <div class="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-600">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               {{ $page.props.flash.error }}
           </div>
        </div>

        <!-- Permission Required State -->
        <div v-if="overview?.gsc_permission_error" class="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <!-- Decorative background elements -->
          <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
          <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000"></div>

          <div class="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div class="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-emerald-400 shadow-xl border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            <h2 class="text-4xl font-black text-white mb-4">Unlock Deep Search Insights</h2>
            <p class="text-slate-400 text-lg font-medium leading-relaxed mb-10">
              Connect Google Search Console to see exactly how customers find you. This data is critical for:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
              <div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">✨</div>
                <span class="text-slate-200 font-bold">Smart Keyword Discovery</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">📍</div>
                <span class="text-slate-200 font-bold">Competitor Comparison</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left">
                <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">🔍</div>
                <span class="text-slate-200 font-bold">AI Suggestive Content</span>
              </div>
              <div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">🛣️</div>
                <span class="text-slate-200 font-bold">Sitemap Health Tracking</span>
              </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
               <button 
                 @click="handleForceReconnect"
                 :disabled="isReconnecting"
                 class="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px]">
                 <template v-if="isReconnecting">
                   <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Establishing Connection...
                 </template>
                 <template v-else>
                   Force Reconnect Search Console
                 </template>
               </button>
               
               <Link :href="route('organization.settings', { tab: 'analytics' })" 
                 class="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-black transition-all border border-white/10">
                 Settings flow
               </Link>
            </div>
          </div>
        </div>

        <!-- Normal State (Only if no permission error) -->
        <template v-else>
          <!-- GSC specific Stats Grid -->
          <div v-if="overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- GSC: Impressions -->
            <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all">
              <div class="flex items-center justify-between mb-1">
                <div class="flex flex-col">
                  <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Total Impressions</p>
                  <p class="text-[9px] text-slate-400 font-medium mt-0.5">Visibility in Search Engine</p>
                </div>
                <!-- Trend Pill -->
                <div v-if="overview.deltas?.total_impressions" :class="getTrendInfo(overview.deltas.total_impressions).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
                  <span>{{ getTrendInfo(overview.deltas.total_impressions).icon }}</span>
                  <span>{{ getTrendInfo(overview.deltas.total_impressions).label }}</span>
                </div>
              </div>
              <h3 class="text-3xl font-black text-slate-900 mt-3">{{ (overview?.total_impressions || 0).toLocaleString() }}</h3>
            </div>

            <!-- GSC: Clicks -->
            <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all">
              <div class="flex items-center justify-between mb-1">
                <div class="flex flex-col">
                  <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Total Clicks</p>
                  <p class="text-[9px] text-slate-400 font-medium mt-0.5">Traffic from Search Console</p>
                </div>
                <!-- Trend Pill -->
                <div v-if="overview.deltas?.total_clicks" :class="getTrendInfo(overview.deltas.total_clicks).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
                  <span>{{ getTrendInfo(overview.deltas.total_clicks).icon }}</span>
                  <span>{{ getTrendInfo(overview.deltas.total_clicks).label }}</span>
                </div>
              </div>
              <h3 class="text-3xl font-black text-slate-900 mt-3">{{ (overview?.total_clicks || 0).toLocaleString() }}</h3>
            </div>

            <!-- GSC: Avg. Position -->
            <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all">
              <div class="flex items-center justify-between mb-1">
                <div class="flex flex-col">
                  <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Avg. Position</p>
                  <p class="text-[9px] text-slate-400 font-medium mt-0.5">Mean rank across all queries</p>
                </div>
                <!-- Trend Pill -->
                <div v-if="overview.deltas?.avg_position" :class="getTrendInfo(overview.deltas.avg_position).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
                  <span>{{ getTrendInfo(overview.deltas.avg_position).icon }}</span>
                  <span>{{ getTrendInfo(overview.deltas.avg_position).label }}</span>
                </div>
              </div>
              <h3 class="text-3xl font-black text-slate-900 mt-3">{{ (overview?.avg_position || 0).toFixed(1) }}</h3>
            </div>

            <!-- GSC: Avg. CTR -->
            <div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all">
              <div class="flex items-center justify-between mb-1">
                <div class="flex flex-col">
                  <p class="text-emerald-700 font-bold text-xs uppercase tracking-wider">Avg. CTR</p>
                  <p class="text-[9px] text-slate-400 font-medium mt-0.5">Click-through rate average</p>
                </div>
                <!-- Trend Pill -->
                <div v-if="overview.deltas?.avg_ctr" :class="getTrendInfo(overview.deltas.avg_ctr).class" class="px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1">
                  <span>{{ getTrendInfo(overview.deltas.avg_ctr).icon }}</span>
                  <span>{{ getTrendInfo(overview.deltas.avg_ctr).label }}</span>
                </div>
              </div>
              <h3 class="text-3xl font-black text-slate-900 mt-3">{{ ((overview?.avg_ctr || 0) * 100).toFixed(2) }}%</h3>
            </div>
          </div>

          <!-- GSC Performance Trend Chart -->
          <div v-if="trendData && trendData.length > 0" class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
            <div class="flex items-center justify-between mb-10">
              <div>
                <h2 class="text-2xl font-black text-slate-900">Search Performance Trends</h2>
                <p class="text-slate-500 font-medium mt-1">Clicks vs Impressions over time</p>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Clicks</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Impressions</span>
                </div>
              </div>
            </div>
            <div class="h-[400px]">
              <Line :data="searchChartData" :options="gscChartOptions" />
            </div>
          </div>

          <!-- Keyword Opportunities & Sitemap Health -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Keyword Opportunities -->
            <div class="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] shadow-premium relative overflow-hidden">
              <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]"></div>
              <div class="relative z-10">
                <div class="flex items-center gap-3 mb-8">
                  <div class="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-black text-white">Keyword Opportunities</h3>
                    <p class="text-xs text-slate-400 font-medium">High impressions with low CTR - Potential for optimization</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="query in opportunityKeywords" :key="query.name" 
                    class="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                    <div class="flex justify-between items-start mb-3">
                      <p class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{{ query.name || 'Unknown' }}</p>
                      <span class="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Opportunity</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impressions</span>
                        <span class="text-xs font-bold text-slate-300">{{ (query.impressions || 0).toLocaleString() }}</span>
                      </div>
                      <div class="w-px h-6 bg-white/10"></div>
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Position</span>
                        <span class="text-xs font-bold text-slate-300">{{ (query.position || 0).toFixed(1) }}</span>
                      </div>
                      <div class="w-px h-6 bg-white/10"></div>
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">CTR</span>
                        <span class="text-xs font-bold text-rose-400">{{ ((query.ctr || 0) * 100).toFixed(2) }}%</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="!opportunityKeywords.length" class="col-span-2 text-center py-10">
                    <p class="text-slate-500 text-sm font-medium italic">No clear optimization opportunities detected in the current query set.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sitemap Health (Moved) -->
            <div class="flex flex-col gap-6">
              <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Sitemap Health</h3>
              <div v-if="overview?.sitemaps?.length" class="space-y-4">
                <div v-for="sitemap in overview.sitemaps" :key="sitemap.path" 
                  class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-slate-900 truncate max-w-[120px]" :title="sitemap.path">{{ sitemap.path.split('/').pop() }}</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase">{{ sitemap.contents?.[0]?.count || 0 }} URLs</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="w-2 h-2 rounded-full inline-block" :class="sitemap.errors > 0 ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                    <p class="text-[10px] font-black" :class="sitemap.errors > 0 ? 'text-rose-600' : 'text-emerald-600'">{{ sitemap.errors > 0 ? 'Error' : 'Healthy' }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p class="text-slate-400 text-xs font-bold">No sitemap data</p>
              </div>
            </div>
          </div>

          <!-- Detailed Tables -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            <!-- Detailed Top Queries -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  Top Search Queries
                </h3>
                
                <!-- Filters -->
                <div class="flex items-center gap-3">
                  <!-- Trend Filter -->
                  <select v-model="queryTrendFilter" 
                    class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 py-2 px-4 appearance-none cursor-pointer">
                    <option value="all">All Trends</option>
                    <option value="growing">Growing ↑</option>
                    <option value="declining">Declining ↓</option>
                  </select>

                  <!-- Search Input -->
                  <div class="relative w-full md:w-64">
                    <input v-model="querySearch" type="text" placeholder="Search queries..." 
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20">
                    <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead>
                    <tr class="border-b border-slate-50">
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Query</th>
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Clicks</th>
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Impressions</th>
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pos.</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="query in pagedQueries" :key="query.name" class="group hover:bg-slate-50 transition-colors">
                      <td class="py-4 pr-4">
                        <span class="text-sm font-bold text-slate-700 block truncate max-w-[200px]" :title="query.name">{{ query.name }}</span>
                      </td>
                      <td class="py-4 text-right">
                        <div class="flex flex-col items-end">
                          <span class="text-sm font-black text-slate-900">{{ (query.clicks || 0).toLocaleString() }}</span>
                          <span v-if="query.delta_clicks" :class="query.delta_clicks > 0 ? 'text-emerald-500' : 'text-rose-500'" class="text-[9px] font-bold flex items-center gap-0.5 mt-0.5">
                            {{ query.delta_clicks > 0 ? '↑' : '↓' }} {{ Math.abs(query.delta_clicks).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                      <td class="py-4 text-right">
                        <span class="text-sm font-medium text-slate-500">{{ (query.impressions || 0).toLocaleString() }}</span>
                      </td>
                      <td class="py-4 text-right">
                        <div class="flex flex-col items-end">
                          <span class="text-sm font-bold" :class="(query.position || 0) <= 3 ? 'text-emerald-500' : 'text-slate-600'">{{ (query.position || 0).toFixed(1) }}</span>
                          <span v-if="query.delta_position" :class="query.delta_position > 0 ? 'text-emerald-500' : 'text-rose-500'" class="text-[9px] font-bold flex items-center gap-0.5">
                            {{ query.delta_position > 0 ? '↑' : '↓' }} {{ Math.abs(query.delta_position).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="!pagedQueries.length" class="text-center py-10 text-slate-400 italic text-sm">No query data available</p>

                <!-- Pagination footer -->
                <div v-if="queryTotalPages > 1" class="flex items-center justify-between pt-6 border-t border-slate-50 mt-4">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Page {{ queryPage }} of {{ queryTotalPages }}</span>
                  <div class="flex items-center gap-2">
                    <button @click="queryPage--" :disabled="queryPage <= 1" 
                      class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button @click="queryPage++" :disabled="queryPage >= queryTotalPages" 
                      class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Detailed Top Pages (GSC) -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Top Pages (GSC)
                </h3>

                <!-- Filters -->
                <div class="flex items-center gap-3">
                  <!-- Trend Filter -->
                  <select v-model="pageTrendFilter" 
                    class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 py-2 px-4 appearance-none cursor-pointer">
                    <option value="all">All Trends</option>
                    <option value="growing">Growing ↑</option>
                    <option value="declining">Declining ↓</option>
                  </select>

                  <!-- Search Input -->
                  <div class="relative w-full md:w-64">
                    <input v-model="pageSearch" type="text" placeholder="Search pages..." 
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20">
                    <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead>
                    <tr class="border-b border-slate-50">
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Page URL</th>
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Clicks</th>
                      <th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pos.</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="page in pagedPagesGsc" :key="page.name" class="group hover:bg-slate-50 transition-colors">
                      <td class="py-4 pr-4">
                        <span class="text-sm font-bold text-slate-700 block truncate max-w-[250px]" :title="page.name">{{ page.name.replace(/^https?:\/\/[^\/]+/, '') || '/' }}</span>
                      </td>
                      <td class="py-4 text-right">
                        <div class="flex flex-col items-end">
                          <span class="text-sm font-black text-slate-900">{{ (page.clicks || 0).toLocaleString() }}</span>
                          <span v-if="page.delta_clicks" :class="page.delta_clicks > 0 ? 'text-emerald-500' : 'text-rose-500'" class="text-[9px] font-bold flex items-center gap-0.5 mt-0.5">
                            {{ page.delta_clicks > 0 ? '↑' : '↓' }} {{ Math.abs(page.delta_clicks).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                      <td class="py-4 text-right">
                        <div class="flex flex-col items-end">
                          <span class="text-sm font-bold text-slate-600">{{ (page.position || 0).toFixed(1) }}</span>
                          <span v-if="page.delta_position" :class="page.delta_position > 0 ? 'text-emerald-500' : 'text-rose-500'" class="text-[9px] font-bold flex items-center gap-0.5">
                            {{ page.delta_position > 0 ? '↑' : '↓' }} {{ Math.abs(page.delta_position).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="!pagedPagesGsc.length" class="text-center py-10 text-slate-400 italic text-sm">No page data available</p>

                <!-- Pagination footer -->
                <div v-if="pagesGscTotalPages > 1" class="flex items-center justify-between pt-6 border-t border-slate-50 mt-4">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Page {{ pagePage }} of {{ pagesGscTotalPages }}</span>
                  <div class="flex items-center gap-2">
                    <button @click="pagePage--" :disabled="pagePage <= 1" 
                      class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button @click="pagePage++" :disabled="pagePage >= pagesGscTotalPages" 
                      class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div> <!-- End GSC Tab -->

      <!-- Predictions Tab -->
      <div v-if="activeTab === 'predictions'">
        <PredictionsTab :propertyId="selectedPropertyId" :organization="organization" />
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

    <!-- Sync Success Toast -->
    <Transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-10 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showSyncSuccessToast" class="fixed bottom-10 right-10 z-[100]">
        <div class="bg-emerald-600 text-white p-6 rounded-[2rem] shadow-2xl border border-emerald-400/30 flex items-center gap-6 backdrop-blur-md">
          <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-black tracking-tight uppercase tracking-widest text-emerald-50">Sync Complete</h4>
            <p class="text-[10px] text-emerald-100 font-medium whitespace-nowrap">Property analytics have been synchronized.</p>
          </div>
          <button @click="showSyncSuccessToast = false" class="text-emerald-200 hover:text-white transition-colors p-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

.skeleton-dark {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
</style>
