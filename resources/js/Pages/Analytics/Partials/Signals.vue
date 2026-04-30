<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToastStore } from '../../../stores/useToastStore'
import AppLayout from '../../../Layouts/AppLayout.vue'
import axios from 'axios'

import { Bar, Doughnut, Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, Title, Tooltip, Legend, 
  LineElement, PointElement, LinearScale, CategoryScale, Filler, 
  BarElement, BarController, ArcElement 
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement)

const props = defineProps({
  organization: Object,
  pixelSites: Array,
  initialPath: String,
  initialSiteId: [Number, String],
})

// ── State ────────────────────────────────────────────────────────────────────
const path       = ref(props.initialPath || '')
const siteId     = ref(props.initialSiteId || null)
const period     = ref(30)
const loading    = ref(false)
const data       = ref(null)
const pathInput  = ref(props.initialPath || '')
const toast      = useToastStore()
const injectingPage  = ref(null)
const fetchingSource = ref(null)
const liveMode       = ref(true)
let pollInterval     = null

const logFilters = ref({
  type: 'all',
  device: 'all',
  country: 'all',
  only_conversions: false,
  start_date: '',
  end_date: '',
})

// ── Helper functions ─────────────────────────────────────────────────────────
const safeHost = (url) => { try { return url ? new URL(url).hostname : '' } catch { return url || '' } }
const safePath = (url) => { try { return url ? new URL(url).pathname : '/' } catch { return url || '/' } }
const fmtS     = (s) => (s || 0) >= 60 ? `${Math.floor(s/60)}m ${Math.round(s%60)}s` : `${Math.round(s || 0)}s`
const fmtMs    = (ms) => (ms || 0) >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${Math.round(ms || 0)}ms`
const countryFlag = (code) => {
  if (!code || code.length !== 2) return '🌍'
  try {
    return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
  } catch { return '🌍' }
}

// ── API Logic ────────────────────────────────────────────────────────────────
const fetch = async () => {
  if (!path.value) return
  loading.value = true
  try {
    const r = await axios.get(route('path.analysis'), {
      params: { path: path.value, pixel_site_id: siteId.value, period: period.value }
    })
    data.value = r.data
  } catch(e) { 
    console.error('Path analysis fetch error:', e)
    toast.error('Failed to load path analysis')
  } finally { loading.value = false }
}

const go = () => { if(pathInput.value) { path.value = pathInput.value; fetch() } }

// ── Computed Stats ───────────────────────────────────────────────────────────
const s = computed(() => data.value?.summary || {})

const severityClass = computed(() => {
  const sc = s.value?.bottleneck_score ?? 0
  if (sc >= 60) return 'text-rose-600 bg-rose-50 border-rose-200'
  if (sc >= 35) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-emerald-600 bg-emerald-50 border-emerald-200'
})

// ── Charts Data ──────────────────────────────────────────────────────────────
const dailyChartData = computed(() => {
  const rows = data.value?.daily_history || []
  return {
    labels: rows.map(r => r.label),
    datasets: [
      { type: 'bar', label: 'Visits', data: rows.map(r => r.visits), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6, order: 2 },
      { type: 'line', label: 'Ad Hits', data: rows.map(r => r.ad_hits), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, order: 1 }
    ]
  }
})

const hourChartData = computed(() => {
  const rows = data.value?.hour_pattern || []
  return {
    labels: rows.map(r => `${r.hour}h`),
    datasets: [{ label: 'Visits', data: rows.map(r => r.visits), backgroundColor: rows.map(r => (r.visits || 0) > 0 ? 'rgba(99,102,241,0.8)' : 'rgba(226,232,240,0.5)'), borderRadius: 4 }]
  }
})

const deviceChartData = computed(() => {
  const rows = data.value?.by_device || []
  return {
    labels: rows.map(r => r.name),
    datasets: [{ data: rows.map(r => r.count), backgroundColor: ['#6366f1','#10b981','#f59e0b','#f43f5e'], borderWidth: 0 }]
  }
})

const loyaltyChartData = computed(() => {
  const ret = s.value?.returning_rate || 0
  return {
    labels: ['New Users', 'Returning'],
    datasets: [{ data: [100 - ret, ret], backgroundColor: ['#6366f1', '#10b981'], borderWidth: 0 }]
  }
})

const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } } } }
const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 10 } } } }

// ── Signal Intelligence Log ──────────────────────────────────────────────────
const logEvents       = ref({ data: [], total: 0, from: 0, to: 0, last_page: 1 })
const logPage         = ref(1)
const logLoading      = ref(false)
const selectedSession = ref(null)
const sessionEvents   = ref([])

const sessionIsLead = computed(() => {
  if (!selectedSession.value) return false
  const total = (sessionEvents.value || []).reduce((sum, e) => sum + (e.duration_seconds || 0), 0)
  return total >= 90 || (sessionEvents.value || []).some(e => (e.duration_seconds || 0) >= 60)
})

const sessionChartData = computed(() => ({
  labels: (sessionEvents.value || []).map(e => new Date(e.created_at).toLocaleTimeString()),
  datasets: [{ label: 'Engagement', data: (sessionEvents.value || []).map(e => e.click_count || 0),
    borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
    fill: true, tension: 0.5, borderWidth: 2, pointRadius: 4,
    pointBackgroundColor: '#fff', pointBorderColor: '#6366f1', pointBorderWidth: 2 }]
}))

const fetchLog = async (silent = false) => {
  if (!path.value) return
  if (!silent) logLoading.value = true
  try {
    const params = {
      search: path.value,
      page: logPage.value,
      per_page: 20,
      pixel_site_id: siteId.value,
      exclude_bots: true,
      ...logFilters.value
    }
    // Clean 'all' values
    if (params.type === 'all') delete params.type
    if (params.device === 'all') delete params.device
    if (params.country === 'all') delete params.country

    const r = await axios.get(route('google-ads.pixel-events'), { params })
    logEvents.value = r.data
  } catch (e) {
    if (!silent) console.error('Log fetch error:', e)
  } finally { if (!silent) logLoading.value = false }
}

const startPolling = () => { pollInterval = setInterval(() => fetchLog(true), 10000) }
const stopPolling = () => { clearInterval(pollInterval) }

const openSession = async (event) => {
  selectedSession.value = event
  sessionEvents.value = [event]
  if (event.session_id) {
    try {
      const r = await axios.get(route('google-ads.pixel-events'), {
        params: { search: event.session_id, per_page: 100, pixel_site_id: siteId.value }
      })
      sessionEvents.value = (r.data.data || [])
        .filter(e => e.session_id === event.session_id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } catch { }
  }
}

// ── Technical Actions ────────────────────────────────────────────────────────
const autoInjectSchema = async () => {
  if (!siteId.value) return toast.error('Please select a pixel site first.', 'Error')
  injectingPage.value = path.value
  try {
    const res = await axios.post(route('google-ads.generate-schema'), { pixel_site_id: siteId.value, url: path.value })
    toast.success(res.data.message, 'Schema Generated')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to generate schema.', 'Error')
  } finally { injectingPage.value = null }
}

const viewPageSource = async () => {
  fetchingSource.value = path.value
  try {
    const res = await axios.get(route('google-ads.page-source'), { params: { url: path.value } })
    const win = window.open('', '_blank')
    win.document.write('<pre>' + (res.data.html || '').replace(/</g, '&lt;') + '</pre>')
  } catch (e) {
    toast.error('Failed to fetch page source.', 'Error')
  } finally { fetchingSource.value = null }
}

const copyText = (text) => navigator.clipboard.writeText(text || '')
const copyJourney = () => {
  const urls = (sessionEvents.value || []).map(e => e.page_url).filter(Boolean).join('\n')
  navigator.clipboard.writeText(urls)
}

// ── Lifecycle & Watch ────────────────────────────────────────────────────────
watch([path, siteId, period], () => { 
  if (path.value) {
    logPage.value = 1
    fetch()
    fetchLog()
  }
})

watch(logPage, fetchLog)
watch(logFilters, fetchLog, { deep: true })
watch(liveMode, (val) => { if (val) startPolling(); else stopPolling() })

onMounted(() => { 
  console.log('Signals dashboard mounted', { path: props.initialPath })
  if (path.value) { 
    fetch()
    fetchLog()
    startPolling()
  } 
})

</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-slate-50 p-6 space-y-6">

      <!-- Header -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Path Intelligence</p>
            <h1 class="text-2xl font-black text-slate-900 truncate">
              {{ path ? safePath(path) : 'Select a page to analyse' }}
            </h1>
            <p v-if="path" class="text-xs text-slate-400 mt-0.5 truncate">{{ path }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <select v-model="siteId" class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0">
              <option :value="null">All Sites</option>
              <option v-for="s in pixelSites" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
            <select v-model="period" class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0">
              <option :value="7">7 days</option>
              <option :value="30">30 days</option>
              <option :value="90">90 days</option>
            </select>
            <div class="flex gap-2">
              <input v-model="pathInput" placeholder="Paste page URL…" class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 w-64" @keydown.enter="go" />
              <button @click="go" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all">Analyse</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>

      <!-- No path selected -->
      <div v-else-if="!path" class="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
        <div class="flex justify-center text-slate-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 animate-bounce">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
        <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Enter a page URL above or click "Analyse" from Path Intelligence</p>
      </div>

      <template v-else-if="data">

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div v-for="card in [
            { label: 'Total Visits',    value: s.total_visits || 0,    sub: (s.unique_sessions || 0) + ' sessions', color: 'indigo' },
            { label: 'Bounce Rate',     value: (s.bounce_rate || 0) + '%', sub: (s.bounce_rate || 0) > 50 ? 'High ⚠' : 'Good ✓', color: (s.bounce_rate || 0) > 50 ? 'rose' : 'emerald' },
            { label: 'Avg Dwell',       value: fmtS(s.avg_dwell),  sub: (s.avg_scroll || 0) + '% scroll', color: 'violet' },
            { label: 'User Loyalty',    value: (s.returning_rate || 0) + '%', sub: 'Returning Users', color: 'emerald' },
            { label: 'Engagement',      value: s.engagement_score || 0, sub: (s.engagement_score || 0) >= 65 ? 'Ad Ready ✓' : 'Building', color: (s.engagement_score || 0) >= 65 ? 'emerald' : 'amber' },
            { label: 'Ad Traffic',      value: s.ad_hits || 0,          sub: 'paid hits', color: 'amber' },
            { label: 'Avg Clicks',      value: s.avg_clicks || 0,       sub: 'per session', color: 'sky' },
          ]" :key="card.label"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ card.label }}</p>
            <p class="text-2xl font-black text-slate-900">{{ card.value }}</p>
            <p class="text-[10px] text-slate-400 font-bold mt-1">{{ card.sub }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{{ period }}-Day Traffic</p>
            <div class="h-56"><Bar :data="dailyChartData" :options="chartOpts" /></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Hour-of-Day</p>
            <div class="h-56"><Bar :data="hourChartData" :options="{ ...chartOpts, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 8 } }, y: { beginAtZero: true, display: false } } }" /></div>
          </div>
        </div>

        <!-- Geo + Device + Referrers -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Countries</p>
            <div class="space-y-3">
              <div v-for="c in (data.by_country || [])" :key="c.code" class="flex items-center gap-3">
                <span class="text-xl w-7 shrink-0">{{ countryFlag(c.code) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-slate-700 truncate">{{ c.code }}</span>
                    <span class="text-xs font-black text-slate-900 ml-2">{{ c.count }}</span>
                  </div>
                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 rounded-full" :style="{ width: (c.count / (data.by_country[0]?.count || 1) * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Device Split</p>
            <div class="h-40 mb-4"><Doughnut :data="deviceChartData" :options="donutOpts" /></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Loyalty: New vs Returning</p>
            <div class="h-40 mb-4"><Doughnut :data="loyaltyChartData" :options="donutOpts" /></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Referrers</p>
            <div class="space-y-3">
              <div v-for="r in (data.referrers || [])" :key="r.domain" class="flex items-center justify-between gap-3">
                <span class="text-xs font-bold text-slate-700 truncate">{{ safeHost(r.domain) || 'Direct / None' }}</span>
                <span class="text-xs font-black text-slate-900 shrink-0">{{ r.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Real-time Error Console & Marketing -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <!-- Real-time Error Console -->
          <div class="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-32 h-32">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl shadow-lg shadow-rose-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-black tracking-tight">Real-time Exception Console</h3>
                    <p class="text-[10px] font-black text-rose-400/80 uppercase tracking-widest mt-0.5">Live Runtime Monitoring</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <div class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-rose-400">Active</span>
                </div>
              </div>

              <div class="space-y-4 max-h-[420px] overflow-y-auto pr-4 custom-scrollbar">
                <div v-for="err in (data.errors || [])" :key="err.id" class="p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl group hover:bg-slate-800 transition-all hover:border-rose-500/30">
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">{{ err.type }} · {{ new Date(err.created_at).toLocaleTimeString() }}</p>
                      <h4 class="text-sm font-black text-white leading-relaxed">{{ err.message }}</h4>
                    </div>
                    <span class="px-2 py-1 bg-slate-900 rounded-lg text-[9px] font-black text-slate-500 shrink-0 border border-slate-700">{{ err.load_time_ms }}ms</span>
                  </div>
                  <div class="text-[10px] font-mono text-slate-500 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 break-all group-hover:text-slate-300">
                    at {{ err.filename || 'anonymous' }}:{{ err.line }}:{{ err.col }}
                  </div>
                </div>
                
                <div v-if="!(data.errors?.length)" class="flex flex-col items-center justify-center py-24 text-slate-600">
                  <div class="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center text-3xl mb-4 border border-slate-700/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-emerald-500/50">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <p class="text-xs font-black uppercase tracking-widest">No runtime exceptions detected</p>
                  <p class="text-[10px] font-bold text-slate-700 mt-2">Health Score: 100%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Marketing Strategy & Intent -->
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Strategic Intelligence</p>
            <div class="flex items-center gap-6 mb-8">
              <div class="w-24 h-24 rounded-3xl bg-slate-50 flex flex-col items-center justify-center border-2 border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intent</p>
                <p class="text-xs font-black text-slate-900 mt-1 uppercase">{{ data.summary?.top_intent || 'General' }}</p>
              </div>
              <div class="flex-1 space-y-2">
                <p class="text-xs font-bold text-slate-600 leading-relaxed">
                  MetaPilot detected <span class="text-indigo-600 font-black">{{ data.summary?.top_intent }} intent</span> based on organic traffic patterns.
                </p>
              </div>
            </div>
            
            <div class="space-y-4">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recommendations</p>
              <div v-for="(rec, idx) in (data.recommendations || [])" :key="idx" 
                class="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1"
                :class="{
                  'bg-rose-50 border-rose-100 text-rose-700': rec.type === 'critical',
                  'bg-amber-50 border-amber-100 text-amber-700': rec.type === 'warning',
                  'bg-indigo-50 border-indigo-100 text-indigo-700': rec.type === 'success',
                }"
              >
                <div class="w-5 h-5 mt-0.5">
                  <svg v-if="rec.type === 'critical'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <svg v-else-if="rec.type === 'warning'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-xs font-bold leading-relaxed">{{ rec.text }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Path & Journey Flow -->
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 mb-12">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-lg font-black text-slate-900">User Journey Flow</h2>
              <p class="text-xs text-slate-400 font-bold">Forensics on where users arrive from and their next destination</p>
            </div>
            <div class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase">
              Avg Dwell: {{ fmtS(s.avg_dwell) }}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative">
            <!-- Entry Logic -->
            <div class="space-y-4">
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">← CAME FROM</p>
              <div class="space-y-2">
                <div v-for="p in (data.prev_pages || [])" :key="p.page_url" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all">
                  <span class="text-xs font-bold text-slate-700 truncate max-w-[140px]" :title="p.page_url">{{ safePath(p.page_url) }}</span>
                  <span class="text-xs font-black text-indigo-600">{{ p.count }}</span>
                </div>
                <div v-if="!(data.prev_pages || []).length" class="text-center py-8 text-[10px] font-black text-slate-300 uppercase italic">Direct Entry Page</div>
              </div>
            </div>

            <!-- This Page (Current) -->
            <div class="relative z-10">
              <div class="bg-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-200 text-center transform scale-110">
                <p class="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">CURRENT PAGE ANALYSIS</p>
                <p class="text-sm font-black text-white truncate px-2">{{ safePath(path) }}</p>
                <div class="mt-6 flex justify-center gap-6 border-t border-indigo-500 pt-6">
                  <div>
                    <p class="text-xl font-black text-white">{{ s.entry_rate || 0 }}%</p>
                    <p class="text-[9px] text-indigo-300 font-black uppercase">Entry</p>
                  </div>
                  <div class="w-px h-8 bg-indigo-500"></div>
                  <div>
                    <p class="text-xl font-black text-white">{{ s.exit_rate || 0 }}%</p>
                    <p class="text-[9px] text-indigo-300 font-black uppercase">Exit</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Exit Logic -->
            <div class="space-y-4">
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">NEXT DESTINATION →</p>
              <div class="space-y-2">
                <div v-for="p in (data.next_pages || [])" :key="p.page_url" class="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-emerald-300 transition-all">
                  <span class="text-xs font-bold text-emerald-800 truncate max-w-[140px]" :title="p.page_url">{{ safePath(p.page_url) }}</span>
                  <span class="text-xs font-black text-emerald-600">{{ p.count }}</span>
                </div>
                <div v-if="!(data.next_pages || []).length" class="text-center py-8 text-[10px] font-black text-slate-300 uppercase italic">Drop-off / Exit Page</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lead Segmentation & Bottlenecks -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <!-- Lead Analytics -->
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <h3 class="text-sm font-black text-slate-900 mb-8 uppercase tracking-widest">Lead Attribution Logic</h3>
            <div class="grid grid-cols-1 gap-4">
              <div v-for="lead in [
                { label: 'Hot Potential', count: s.hot_leads, desc: 'High dwell time & interaction', color: 'rose', icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z' },
                { label: 'Warm Interest', count: s.warm_leads, desc: 'Significant dwell or scroll', color: 'amber', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
                { label: 'Cold Pass-through', count: s.cold_leads, desc: 'Minimal site interaction', color: 'slate', icon: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z' }
              ]" :key="lead.label" class="flex items-center gap-6 p-6 rounded-3xl border transition-all hover:shadow-md" :class="`bg-${lead.color}-50/50 border-${lead.color}-100`">
                <div class="w-10 h-10 flex items-center justify-center text-slate-400" :class="`text-${lead.color}-500`">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="lead.icon" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight">{{ lead.label }}</span>
                    <span class="text-2xl font-black text-slate-900">{{ lead.count || 0 }}</span>
                  </div>
                  <p class="text-[10px] text-slate-400 font-bold mt-1">{{ lead.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Site Health / Bottlenecks -->
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Behavioral Bottlenecks</h3>
              <span class="px-4 py-2 rounded-xl text-[10px] font-black border shadow-sm" :class="severityClass">
                {{ s.bottleneck_severity?.toUpperCase() }} SCORE: {{ s.bottleneck_score }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="m in [
                { label: 'Avg Load Time', val: fmtMs(s.avg_load_ms), bad: s.avg_load_ms > 3000 },
                { label: 'Bounce Rate', val: (s.bounce_rate || 0) + '%', bad: (s.bounce_rate || 0) > 50 },
                { label: 'Scroll Depth', val: (s.avg_scroll || 0) + '%', bad: (s.avg_scroll || 0) < 30 },
                { label: 'JS Errors', val: (data.errors || []).length + ' issues', bad: (data.errors || []).length > 0 }
              ]" :key="m.label" class="p-6 rounded-3xl border transition-all hover:shadow-md" :class="m.bad ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ m.label }}</p>
                <p class="text-xl font-black text-slate-900">{{ m.val }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Integration -->
        <div class="bg-indigo-950 rounded-[2.5rem] p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Technical Automation</p>
              <h3 class="text-xl font-black">Optimization Engine</h3>
              <p class="text-sm text-indigo-200/60 mt-1 max-w-md">Instantly improve SEO and performance for this specific page using MetaPilot's automated tools.</p>
            </div>
            <div class="flex flex-wrap gap-4">
              <button @click="autoInjectSchema" :disabled="injectingPage === path" class="px-6 py-4 bg-indigo-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all active:scale-95">
                {{ injectingPage === path ? 'Injecting...' : 'Auto-Inject Schema' }}
              </button>
              <button @click="viewPageSource" :disabled="fetchingSource === path" class="px-6 py-4 bg-white/10 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 active:scale-95">
                View Page Source
              </button>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12">
          <div class="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 class="text-lg font-black text-slate-900">Signal Intelligence</h2>
              <p class="text-xs text-slate-400 font-bold">Real-time visitor forensics and interaction timeline</p>
            </div>
            
            <!-- Log Filters -->
            <div class="flex flex-wrap items-center gap-3">
              <select v-model="logFilters.type" class="text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0">
                <option value="all">All Traffic</option>
                <option value="ads">Paid (Ads)</option>
                <option value="organic">Organic</option>
              </select>
              <select v-model="logFilters.device" class="text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0">
                <option value="all">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
              <label class="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-all hover:bg-indigo-50 hover:border-indigo-200">
                <input type="checkbox" v-model="logFilters.only_conversions" class="rounded border-slate-300 text-indigo-600 focus:ring-0" />
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">Conversions Only</span>
              </label>
              <button @click="fetchLog()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" :class="{ 'animate-spin': logLoading }">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Device</th>
                  <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Type</th>
                  <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="logLoading" class="animate-pulse">
                  <td colspan="5" class="px-8 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing signals...</td>
                </tr>
                <tr v-for="event in (logEvents?.data || [])" :key="event.id" class="group hover:bg-slate-50 transition-all">
                  <td class="px-8 py-6">
                    <p class="text-xs font-black text-slate-900">{{ new Date(event.created_at).toLocaleTimeString() }}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">{{ new Date(event.created_at).toLocaleDateString() }}</p>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                        <svg v-if="event.device_type === 'mobile'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                        <svg v-else-if="event.device_type === 'tablet'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-xs font-black text-slate-900">{{ event.browser }}</p>
                        <p class="text-[9px] text-slate-400 font-bold uppercase">{{ event.platform }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-3">
                      <span class="text-2xl shadow-sm rounded">{{ countryFlag(event.country_code) }}</span>
                      <div>
                        <p class="text-xs font-black text-slate-900">{{ event.city || 'Unknown City' }}</p>
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{{ event.country_code }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <span v-if="event.is_returning" class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Returning User
                    </span>
                    <span v-else class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      New Visitor
                    </span>
                    <div v-if="event.gclid || event.utm_campaign" class="mt-1.5 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span class="text-[8px] font-black text-amber-600 uppercase">Paid Traffic</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <button @click="openSession(event)" class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                      View Journey
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {{ logEvents?.from || 0 }}-{{ logEvents?.to || 0 }} of {{ logEvents?.total || 0 }} signals</p>
            <div class="flex items-center gap-2">
              <button 
                @click="logPage--" :disabled="logPage <= 1"
                class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"
              >Previous</button>
              <button 
                @click="logPage++" :disabled="logPage >= (logEvents?.last_page || 1)"
                class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"
              >Next</button>
            </div>
          </div>
        </div>

        <!-- Session Journey Modal -->
        <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" @click="selectedSession = null"></div>
          
          <div class="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">Behavioral Journey Map</h3>
                  <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Session ID: {{ selectedSession.session_id?.substring(0,16) }}…</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                    <div v-if="sessionIsLead" class="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 animate-pulse flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z" />
                  </svg>
                  HOT LEAD DETECTED
                </div>
                <button @click="selectedSession = null" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
              <!-- Left: Journey Timeline -->
              <div class="flex-1 overflow-y-auto p-8 border-r border-slate-100 bg-white">
                <div class="mb-8 flex items-center justify-between">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step-by-Step Forensics</p>
                  <button @click="copyJourney" class="text-[10px] font-black text-indigo-600 uppercase hover:underline">Copy All URLs</button>
                </div>

                <div class="relative space-y-0">
                  <!-- Timeline Line -->
                  <div class="absolute left-[21px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>

                  <div v-for="(entry, idx) in (sessionEvents || [])" :key="entry.id" class="relative pl-14 pb-10 last:pb-0 group">
                    <!-- Timeline Node -->
                    <div class="absolute left-0 top-1 w-11 h-11 rounded-2xl border-4 border-white shadow-md flex items-center justify-center transition-all group-hover:scale-110 z-10"
                      :class="entry.page_url === path ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200' : 'bg-slate-100 text-slate-400'">
                      <span class="text-xs font-black">{{ idx + 1 }}</span>
                    </div>

                    <!-- Page Info Card -->
                    <div class="p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1"
                      :class="entry.page_url === path ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'">
                      <div class="flex items-start justify-between gap-4 mb-3">
                        <div class="min-w-0">
                          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ new Date(entry.created_at).toLocaleTimeString() }}</p>
                          <h4 class="text-sm font-black text-slate-900 truncate" :title="entry.page_url">{{ safePath(entry.page_url) }}</h4>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                          <span class="px-2.5 py-1 bg-white rounded-lg text-[9px] font-black text-slate-600 border border-slate-100 shadow-sm">
                            {{ fmtS(entry.duration_seconds) }} Dwell
                          </span>
                          <span v-if="entry.click_count > 0" class="px-2.5 py-1 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 border border-emerald-100">
                            {{ entry.click_count }} Clicks
                          </span>
                        </div>
                      </div>
                      
                      <!-- Dwell Bar -->
                      <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" :style="{ width: Math.min((entry.duration_seconds / 120) * 100, 100) + '%' }"></div>
                      </div>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Engagement Intensity: {{ Math.min(entry.duration_seconds * 2 + entry.click_count * 10, 100) }}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Session Summary & Attribution -->
              <div class="w-full lg:w-80 bg-slate-50 p-8 overflow-y-auto">
                <div class="space-y-8">
                  <!-- Session Stats -->
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Session Statistics</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="p-4 bg-white rounded-2xl border border-slate-200">
                        <p class="text-xs font-black text-slate-900">{{ (sessionEvents || []).length }}</p>
                        <p class="text-[9px] text-slate-400 font-bold uppercase">Pages</p>
                      </div>
                      <div class="p-4 bg-white rounded-2xl border border-slate-200">
                        <p class="text-xs font-black text-slate-900">{{ fmtS((sessionEvents || []).reduce((s,e) => s + (e.duration_seconds || 0), 0)) }}</p>
                        <p class="text-[9px] text-slate-400 font-bold uppercase">Total Time</p>
                      </div>
                    </div>
                  </div>

                  <!-- Engagement Graph -->
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Interaction Intensity</p>
                    <div class="h-32 bg-white rounded-2xl border border-slate-200 p-4">
                      <Line :data="sessionChartData" :options="{ ...chartOpts, scales: { x: { display: false }, y: { display: false } } }" />
                    </div>
                  </div>

                  <!-- Attribution -->
                  <div class="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
                    <p class="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3">Campaign Attribution</p>
                    <div class="space-y-3">
                      <div>
                        <p class="text-[9px] text-indigo-300 font-black uppercase">Source</p>
                        <p class="text-sm font-black">{{ selectedSession.utm_source || 'Direct' }}</p>
                      </div>
                      <div>
                        <p class="text-[9px] text-indigo-300 font-black uppercase">Medium</p>
                        <p class="text-sm font-black">{{ selectedSession.utm_medium || 'None' }}</p>
                      </div>
                      <div v-if="selectedSession.gclid">
                        <p class="text-[9px] text-indigo-300 font-black uppercase">Google Click ID</p>
                        <p class="text-[10px] font-mono break-all opacity-80">{{ selectedSession.gclid }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Geo & IP -->
                  <div class="p-6 bg-white rounded-3xl border border-slate-200">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Geo Forensics</p>
                    <div class="flex items-center gap-3 mb-4">
                      <span class="text-2xl">{{ countryFlag(selectedSession.country_code) }}</span>
                      <div>
                        <p class="text-xs font-black text-slate-900">{{ selectedSession.city || 'Unknown' }}, {{ selectedSession.country_code }}</p>
                        <p class="text-[10px] text-slate-400 font-bold">{{ selectedSession.ip }}</p>
                      </div>
                    </div>
                    <div class="pt-4 border-t border-slate-100">
                      <p class="text-[9px] text-slate-400 font-black uppercase mb-1">User Agent</p>
                      <p class="text-[10px] text-slate-600 font-bold leading-relaxed line-clamp-2">{{ selectedSession.user_agent }}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>
