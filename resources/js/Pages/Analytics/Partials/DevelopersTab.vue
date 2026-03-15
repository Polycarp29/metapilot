<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import { useToastStore } from '@/stores/useToastStore'
import ConfirmationModal from '@/Components/ConfirmationModal.vue'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  LineElement, PointElement, LinearScale, CategoryScale, Filler,
  BarElement, BarController, ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement)

const props = defineProps({
    organization: Object,
    properties: Array,
    propertyId: [Number, String],
    forecastData: Object
})

// ─── State ────────────────────────────────────────────────────────────────────
const snippet            = ref('')
const logResponse        = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
const chartEvents        = ref([]) // Separate set for the trend chart
const isLoading          = ref(false)
const isRegenerating     = ref(false)
const isTestingConn      = ref(false)
const isSavingDomain     = ref(false)
const toast              = useToastStore()
const selectedPropId     = ref(props.propertyId || props.properties?.[0]?.id)
const selectedCampaignId = ref('')
const selectedSession    = ref(null)
const searchQuery        = ref('')
const connectionStatus   = ref(null)
const allowedDomainInput = ref('')
const domainSavedMsg     = ref('')
const isSavingModules    = ref(false)
const showRegenModal     = ref(false)
const analyticsData      = ref(null)
const isLoadingAnalytics = ref(false)
const pathFilter         = ref('')  // filter log by clicking a path row

const activeTab          = ref(localStorage.getItem('mp_dev_active_tab') || 'signals')
const errorResponse      = ref({ data: [], current_page: 1, last_page: 1, total: 0 })
const isLoadingErrors    = ref(false)
const errorFilters       = ref({
    page: 1,
    search: '',
    per_page: 25
})

// Multi-site state
const pixelSites         = ref([])
const selectedSiteId     = ref(localStorage.getItem('mp_selected_site_id') ? parseInt(localStorage.getItem('mp_selected_site_id')) : null)
const isCreatingSite     = ref(false)
const showNewSiteModal   = ref(false)
const showSiteDropdown   = ref(false)
const newSite            = ref({ label: '', allowed_domain: '' })
const siteSearchQuery    = ref('')
const selectedModules    = ref(['click', 'schema']) // Default, will be overriden by site config

// Filters
const filters = ref({
    campaign_id: 'all',
    type: 'all',
    device: 'all',
    country: 'all',
    start_date: '',
    end_date: '',
    per_page: 25,
    page: 1
})

let eventsInterval     = null
let connInterval       = null
let analyticsInterval  = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const siteToken = computed(() => props.organization?.ads_site_token)

const selectedProperty = computed(() =>
    props.properties?.find(p => p.id == selectedPropId.value)
)

const selectedSite = computed(() => 
    pixelSites.value.find(s => s.id === selectedSiteId.value)
)

const filteredEvents = computed(() => {
    let ev = events.value
    if (campaignFilter.value !== 'all') {
        ev = ev.filter(e => e.google_campaign_id === campaignFilter.value)
    }
    if (!searchQuery.value) return ev
    const q = searchQuery.value.toLowerCase()
    return ev.filter(e =>
        e.page_url?.toLowerCase().includes(q) ||
        e.session_id?.toLowerCase().includes(q) ||
        e.utm_campaign?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q)
    )
})

const availableCampaigns = computed(() => {
    const caps = new Set()
    chartEvents.value.forEach(e => { if (e.google_campaign_id) caps.add(e.google_campaign_id) })
    return Array.from(caps)
})

const filteredSiteOptions = computed(() => {
    if (!siteSearchQuery.value) return pixelSites.value
    const q = siteSearchQuery.value.toLowerCase()
    return pixelSites.value.filter(s => s.label.toLowerCase().includes(q))
})

const sessionTimeline = computed(() => {
    if (!selectedSession.value) return []
    // We check both log and chart events to find the full timeline
    const all = [...logResponse.value.data, ...chartEvents.value]
    return all
        .filter(e => e.session_id === selectedSession.value.session_id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const sessionChartData = computed(() => {
    if (!selectedSession.value) return { labels: [], datasets: [] }
    const t = sessionTimeline.value
    return {
        labels: t.map(e => new Date(e.created_at).toLocaleTimeString()),
        datasets: [{
            label: 'Engagement Signals',
            data: t.map(e => e.click_count),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.12)',
            fill: true, tension: 0.5, borderWidth: 3,
            pointRadius: 6, pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1', pointBorderWidth: 2
        }]
    }
})

// Segmentation logic for Ad vs Total signals
const hitsChartData = computed(() => {
    const totalCounts = {}
    const adCounts = {}
    
    chartEvents.value.forEach(e => {
        const d = new Date(e.created_at).toLocaleDateString()
        totalCounts[d] = (totalCounts[d] || 0) + 1
        
        // Ad check: has GCLID OR has utm_campaign OR has data-campaign
        const isAd = e.gclid || e.utm_campaign || e.google_campaign_id
        if (isAd) {
            adCounts[d] = (adCounts[d] || 0) + 1
        }
    })
    
    const dates = Object.keys(totalCounts).sort((a, b) => new Date(a) - new Date(b))
    
    return {
        labels: dates,
        datasets: [
            {
                label: 'Total Reach',
                data: dates.map(d => totalCounts[d]),
                borderColor: '#e2e8f0',
                backgroundColor: 'rgba(226,232,240,0.1)',
                fill: true, tension: 0.4, borderWidth: 2,
                pointRadius: 0, pointHitRadius: 20
            },
            {
                label: 'Ad Conversions',
                data: dates.map(d => adCounts[d] || 0),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.08)',
                fill: true, tension: 0.4, borderWidth: 4,
                pointRadius: 0, pointHitRadius: 20
            }
        ]
    }
})

const topCountries = computed(() => {
    if (analyticsData.value?.by_country) return analyticsData.value.by_country
    const c = {}
    chartEvents.value.forEach(e => { if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1 })
    return Object.entries(c).map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count).slice(0, 8)
})

const deviceBreakdown = computed(() => {
    if (analyticsData.value?.by_device) {
        const d = { Mobile: 0, Desktop: 0, Tablet: 0 }
        analyticsData.value.by_device.forEach(item => {
            if (d[item.name] !== undefined) d[item.name] = item.count
        })
        return d
    }
    const d = { Mobile: 0, Desktop: 0, Tablet: 0 }
    chartEvents.value.forEach(e => { if (e.device_type && d[e.device_type] !== undefined) d[e.device_type]++ })
    return d
})

const topCities = computed(() => analyticsData.value?.by_city ?? [])

const deviceChartData = computed(() => {
    const d = deviceBreakdown.value
    return {
        labels: ['Mobile', 'Desktop', 'Tablet'],
        datasets: [{
            data: [d.Mobile, d.Desktop, d.Tablet],
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    }
})

const deviceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 12,
            titleFont: { size: 10, weight: 'bold', family: 'Inter' },
            bodyFont: { size: 12, weight: 'black', family: 'Inter' }
        }
    }
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const getCountryName = (code) => {
    if (!code || code === 'Unknown') return 'Global/Unknown';
    try {
        return regionNames.of(code.toUpperCase()) || code;
    } catch (e) {
        return code;
    }
}

const getCountryFlag = (code) => {
    if (!code || code === 'Unknown' || code.length !== 2) return '🌍';
    return code
        .toUpperCase()
        .replace(/./g, (char) => 
            String.fromCodePoint(char.charCodeAt(0) + 127397)
        );
}

const avgClicks = computed(() => {
    const ads = chartEvents.value.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id)
    if (ads.length === 0) return 0
    const total = ads.reduce((sum, e) => sum + (e.click_count || 0), 0)
    return (total / ads.length).toFixed(1)
})

// ── Analytics-driven computed ──────────────────────────────────────────────
const todayDelta = computed(() => analyticsData.value?.summary?.today_delta ?? null)
const weekDelta  = computed(() => analyticsData.value?.summary?.week_delta  ?? null)

const historyChartData = computed(() => {
    const rows = analyticsData.value?.daily_history ?? []
    if (!rows.length) return { labels: [], datasets: [] }
    const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length
    return {
        labels: rows.map(r => r.label),
        datasets: [
            {
                type: 'bar',
                label: 'Total Signals',
                data: rows.map(r => r.total),
                backgroundColor: rows.map(r =>
                    r.total >= avg * 1.15 ? 'rgba(99,102,241,0.85)' :
                    r.total <= avg * 0.6  ? 'rgba(226,232,240,0.6)'  :
                    'rgba(99,102,241,0.35)'
                ),
                borderRadius: 8,
                borderSkipped: false,
                order: 2,
            },
            {
                type: 'line',
                label: 'Ad Hits',
                data: rows.map(r => r.ad_hits),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.08)',
                fill: true,
                tension: 0.45,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                order: 1,
            }
        ]
    }
})

const historyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
        legend: { display: true, position: 'top', align: 'end',
            labels: { boxWidth: 10, font: { family: 'Inter', weight: 'bold', size: 10 }, padding: 20 } },
        tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Inter', weight: 'black', size: 11 },
            bodyFont: { family: 'Inter', size: 11 },
            padding: 14,
            cornerRadius: 12,
            callbacks: {
                title: (items) => {
                    const row = analyticsData.value?.daily_history?.[items[0].dataIndex]
                    return row ? new Date(row.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' }) : ''
                }
            }
        }
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 }, maxTicksLimit: 10 } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10 } } }
    }
}

const topPages   = computed(() => analyticsData.value?.top_pages      ?? [])
const topReferers = computed(() => analyticsData.value?.top_referrers ?? [])
const rising     = computed(() => analyticsData.value?.trend_velocity?.rising  ?? [])
const falling    = computed(() => analyticsData.value?.trend_velocity?.falling ?? [])

const safePathLabel = (url) => {
    if (!url) return '—'
    try { return new URL(url).pathname || '/' } catch { return url }
}

const deltaBadgeClass = (pct) => {
    if (pct === null || pct === undefined) return 'bg-slate-100 text-slate-400'
    if (pct >= 5)  return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    if (pct <= -5) return 'bg-rose-50 text-rose-600 border border-rose-200'
    return 'bg-amber-50 text-amber-600 border border-amber-200'
}

const deltaIcon = (pct) => {
    if (pct === null || pct === undefined) return '—'
    if (pct >= 5)  return `↑ +${pct}%`
    if (pct <= -5) return `↓ ${pct}%`
    return `→ ${pct > 0 ? '+' : ''}${pct}%`
}

// Inline SVG sparkline (14 data points → path)
const sparklinePath = (series) => {
    if (!series?.length) return ''
    const w = 80, h = 28
    const max = Math.max(...series, 1)
    const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - (v / max) * h}`)
    return `M${pts.join(' L')}`
}

const pixelStatusBadge = computed(() => {
    const site = selectedSite.value
    if (site) {
        if (site.status === 'verified_active')   return { label: 'Verified & Active',   color: 'emerald', icon: '✓' }
        if (site.status === 'connected_inactive') return { label: 'Connected – Inactive', color: 'amber',   icon: '○' }
        return { label: 'Not Detected', color: 'rose', icon: '✕' }
    }
    return { label: 'No Site Selected', color: 'slate', icon: '○' }
})

const mainChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { 
        legend: { 
            display: true, 
            position: 'top', 
            align: 'end',
            labels: { boxWidth: 8, font: { family: 'Inter', weight: 'bold', size: 10 }, padding: 20 }
        } 
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
        y: { 
            beginAtZero: true, 
            grid: { color: '#f8fafc', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 10 }, stepSize: 1 }
        }
    }
}

const modalChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
    }
}

// ─── API calls ────────────────────────────────────────────────────────────────
const fetchEvents = async () => {
    isLoading.value = true
    try {
        const params = {
            ...filters.value,
            search: pathFilter.value || searchQuery.value,
            campaign_id: filters.value.campaign_id,
            pixel_site_id: selectedSiteId.value
        }
        const r = await axios.get(route('google-ads.pixel-events'), { params })
        logResponse.value = r.data

        // Also update chart data (we fetch more for the chart but without pagination meta)
        if (filters.value.page === 1) {
            const chartParams = { ...params, per_page: 500 }
            const cr = await axios.get(route('google-ads.pixel-events'), { params: chartParams })
            chartEvents.value = cr.data.data
        }
    } catch (e) {
        console.error('Failed to fetch pixel events', e)
    } finally {
        isLoading.value = false
    }
}

const fetchAnalytics = async () => {
    isLoadingAnalytics.value = true
    try {
        const r = await axios.get(route('google-ads.analytics'), {
            params: { pixel_site_id: selectedSiteId.value }
        })
        analyticsData.value = r.data
    } catch (e) {
        console.error('Failed to fetch analytics', e)
    } finally {
        isLoadingAnalytics.value = false
    }
}

const drillToPath = (pageUrl) => {
    pathFilter.value = pageUrl
    filters.value.page = 1
    fetchEvents()
    // scroll to log
    document.getElementById('intel-log')?.scrollIntoView({ behavior: 'smooth' })
}

const nextPage = () => {
    if (filters.value.page < logResponse.value.last_page) {
        filters.value.page++
        fetchEvents()
    }
}

const prevPage = () => {
    if (filters.value.page > 1) {
        filters.value.page--
        fetchEvents()
    }
}


const fetchErrors = async () => {
    if (!selectedSiteId.value) return
    isLoadingErrors.value = true
    try {
        const { data } = await axios.get(route('pixel-errors'), {
            params: {
                ...errorFilters.value,
                pixel_site_id: selectedSiteId.value
            }
        })
        errorResponse.value = data
    } catch (e) {
        toast.add('Failed to fetch error logs', 'error')
    } finally {
        isLoadingErrors.value = false
    }
}

const applyFilters = () => {
    filters.value.page = 1
    fetchEvents()
}

const downloadCsv = () => {
    const params = new URLSearchParams({
        ...filters.value,
        search: searchQuery.value
    }).toString()
    window.location.href = route('google-ads.pixel-events.csv') + '?' + params
}

const fetchConnectionStatus = async () => {
    try {
        const r = await axios.get(route('google-ads.connection-status'))
        pixelSites.value = r.data.pixel_sites || []
        
        // Default selection if none — we now allow null for "All Sites" but for snippet generation 
        // it's better to select the first one if the user hasn't made a choice.
        if (!selectedSiteId.value && pixelSites.value.length > 0) {
            selectedSiteId.value = pixelSites.value[0].id
        }
        
        if (selectedSite.value) {
            allowedDomainInput.value = selectedSite.value.allowed_domain || ''
            if (selectedSite.value.enabled_modules) {
                selectedModules.value = [...selectedSite.value.enabled_modules]
            }
        }
    } catch (e) { /* silent */ }
}

const runConnectionTest = async () => {
    isTestingConn.value = true
    try {
        await fetchConnectionStatus()
        const sites = pixelSites.value
        const active = sites.filter(s => s.status === 'verified_active').length
        const total = sites.length
        if (total === 0) {
            toast.error('No pixel sites found. Create a site first.')
        } else if (active > 0) {
            toast.success(`Connection verified — ${active}/${total} site(s) active`)
        } else {
            toast.add(`${total} site(s) found but none active in last 24h. Check your pixel snippet is installed correctly.`, 'warning')
        }
    } catch (e) {
        toast.error('Connection test failed — please check your network')
    } finally {
        isTestingConn.value = false
    }
}

const saveAllowedDomain = async () => {
    if (!selectedSiteId.value) return
    isSavingDomain.value = true
    domainSavedMsg.value = ''
    try {
        const r = await axios.put(route('google-ads.allowed-domain'), {
            pixel_site_id: selectedSiteId.value,
            allowed_domain: allowedDomainInput.value
        })
        domainSavedMsg.value = r.data.message
        toast.success(r.data.message || 'Domain saved successfully')
        fetchConnectionStatus()
    } catch (e) {
        domainSavedMsg.value = 'Error saving domain.'
        toast.error('Failed to save allowed domain')
    } finally {
        isSavingDomain.value = false
    }
}

const saveModules = async () => {
    if (!selectedSiteId.value) return
    isSavingModules.value = true
    try {
        const { data } = await axios.put(route('google-ads.pixel-modules'), {
            pixel_site_id: selectedSiteId.value,
            modules: selectedModules.value
        })
        toast.add(data.message, 'success')
        // Refresh site data to ensure everything is synced
        await fetchConnectionStatus()
    } catch (e) {
        toast.add(e.response?.data?.message || 'Failed to save tracker modules', 'error')
    } finally {
        isSavingModules.value = false
    }
}

const updateSnippet = () => {
    if (!selectedSite.value) {
        snippet.value = '/* Please select a specific tracking site from the dropdown to generate your custom tracking snippet. */'
        return
    }
    const base = window.location.origin
    const camp = selectedCampaignId.value ? ` data-campaign="${selectedCampaignId.value}"` : ''
    const mods = selectedModules.value.length ? ` data-modules="${selectedModules.value.join(',')}"` : ''
    snippet.value = `<script src="${base}/cdn/ads-tracker.js" data-token="${selectedSite.value.ads_site_token}"${camp}${mods} async><\/script>`
}

const regenerateToken = async () => {
    if (!selectedSiteId.value) return
    showRegenModal.value = false
    isRegenerating.value = true
    try {
        const r = await axios.post(route('google-ads.pixel-sites.regenerate-token', { pixel_site: selectedSiteId.value }))
        toast.success('Site token regenerated successfully')
        fetchConnectionStatus()
    } catch (e) {
        console.error('Failed to regenerate token', e)
        toast.error('Failed to regenerate site token')
    } finally {
        isRegenerating.value = false
    }
}

const createSite = async () => {
    isCreatingSite.value = true
    try {
        const r = await axios.post(route('google-ads.pixel-sites.store'), newSite.value)
        toast.success('New pixel site created')
        showNewSiteModal.value = false
        newSite.value = { label: '', allowed_domain: '' }
        await fetchConnectionStatus()
        selectedSiteId.value = r.data.pixel_site.id
    } catch (e) {
        toast.error('Failed to create pixel site')
    } finally {
        isCreatingSite.value = false
    }
}

const copySnippet = () => {
    navigator.clipboard.writeText(snippet.value)
    toast.success('Snippet copied to clipboard!', 'Copied')
}

const safeHostname = (url) => {
    if (!url) return ''
    try {
        const m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im)
        return m ? m[1] : url
    } catch { return url }
}

const fmt = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return d.toLocaleDateString()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    updateSnippet()
    fetchEvents()
    fetchConnectionStatus()
    fetchAnalytics()
    eventsInterval    = setInterval(fetchEvents, 60000)
    connInterval      = setInterval(fetchConnectionStatus, 30000)
    analyticsInterval = setInterval(fetchAnalytics, 300000) // every 5 min
})

onUnmounted(() => {
    clearInterval(eventsInterval)
    clearInterval(connInterval)
    clearInterval(analyticsInterval)
})

watch([selectedPropId, selectedCampaignId, selectedSiteId, selectedModules], () => {
    updateSnippet()
    if (selectedSite.value) {
        allowedDomainInput.value = selectedSite.value.allowed_domain || ''
    }
}, { deep: true })

watch(() => props.propertyId, (val) => {
    if (val) selectedPropId.value = val
}, { immediate: true })

watch(selectedSiteId, (val) => {
    if (val) localStorage.setItem('mp_selected_site_id', val)
    else localStorage.removeItem('mp_selected_site_id')

    // Sync modules from backend when site changes
    if (selectedSite.value && selectedSite.value.enabled_modules) {
        selectedModules.value = [...selectedSite.value.enabled_modules]
    } else if (selectedSite.value) {
        // Default seed if backend is empty
        selectedModules.value = ['click', 'schema']
    }

    fetchEvents()
    fetchAnalytics()
}, { immediate: true })

// Modules are now primarily synced from backend via selectedSiteId watch and fetchConnectionStatus
// We don't watch selectedModules to save to localStorage anymore as backend is Source of Truth

watch(activeTab, (val) => {
    localStorage.setItem('mp_dev_active_tab', val)
})
watch(pathFilter, () => { if (!pathFilter.value) fetchEvents() })
</script>

<template>
    <div class="space-y-12 pb-24">
        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between mb-10">
            <div>
                <h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Developer Tools
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v3.2</span>
                </h2>
                <p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Secure pixel tracking with agency attribution monitoring & real-time signal intelligence.</p>
            </div>
            <div class="flex items-center gap-4">
                <!-- Scalable Site Switcher -->
                <div class="relative">
                    <div class="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                        <button @click="selectedSiteId = null; showSiteDropdown = false"
                            class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap flex items-center gap-2"
                            :class="!selectedSiteId ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'">
                            All Sites
                        </button>
                        
                        <div class="h-6 w-px bg-slate-200 mx-1"></div>

                        <!-- Dropdown Trigger -->
                        <button @click="showSiteDropdown = !showSiteDropdown" 
                            class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap flex items-center gap-3"
                            :class="selectedSiteId ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'">
                            {{ selectedSite ? selectedSite.label : 'Select Site' }}
                            <span v-if="selectedSite" class="w-1.5 h-1.5 rounded-full" :class="{
                                'bg-emerald-500': selectedSite.status === 'verified_active',
                                'bg-amber-400': selectedSite.status === 'connected_inactive',
                                'bg-slate-300': selectedSite.status === 'not_detected',
                            }"></span>
                            <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showSiteDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                        </button>

                        <button @click="showNewSiteModal = true" class="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
                        </button>
                    </div>

                    <!-- Enhanced Dropdown Menu -->
                    <div v-if="showSiteDropdown" class="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl shadow-premium border border-slate-100 z-50 overflow-hidden">
                        <div class="p-3 border-b border-slate-50">
                            <input v-model="siteSearchQuery" placeholder="Search sites..." class="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/10" />
                        </div>
                        <div class="max-h-64 overflow-y-auto p-2 no-scrollbar">
                            <button v-for="site in filteredSiteOptions" :key="site.id"
                                @click="selectedSiteId = site.id; showSiteDropdown = false; siteSearchQuery = ''"
                                class="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full" :class="{
                                        'bg-emerald-500': site.status === 'verified_active',
                                        'bg-amber-400': site.status === 'connected_inactive',
                                        'bg-slate-300': site.status === 'not_detected',
                                    }"></div>
                                    <span class="text-[11px] font-black uppercase text-slate-700 group-hover:text-indigo-600">{{ site.label }}</span>
                                </div>
                                <span v-if="selectedSiteId === site.id" class="text-indigo-600">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                </span>
                            </button>
                            <div v-if="filteredSiteOptions.length === 0" class="p-8 text-center text-[10px] font-black text-slate-300 uppercase italic">No sites found</div>
                        </div>
                    </div>
                </div>

                <!-- Global Health Status Indicator -->
                <div v-if="selectedSite" class="flex items-center gap-2 px-5 py-3 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all shadow-sm"
                :class="{
                    'bg-emerald-50 border-emerald-200 text-emerald-700': pixelStatusBadge.color === 'emerald',
                    'bg-amber-50 border-amber-200 text-amber-700': pixelStatusBadge.color === 'amber',
                    'bg-rose-50 border-rose-200 text-rose-700': pixelStatusBadge.color === 'rose',
                }">
                <span class="w-2 h-2 rounded-full"
                    :class="{
                        'bg-emerald-500 animate-pulse': pixelStatusBadge.color === 'emerald',
                        'bg-amber-400': pixelStatusBadge.color === 'amber',
                        'bg-rose-400': pixelStatusBadge.color === 'rose',
                    }"></span>
                {{ pixelStatusBadge.label }}
            </div>
            <div v-else class="flex items-center gap-2 px-5 py-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-indigo-600 font-black text-[11px] uppercase tracking-widest shadow-sm">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                Aggregate Mode
            </div>
        </div>
    </div>

        <!-- ── Insights Panels (Row 1) ──────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Stats -->
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Total Signals -->
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                    <h4 class="text-4xl font-black text-slate-900 tracking-tight">{{ logResponse.total }}</h4>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-[10px] font-black text-slate-400">{{ selectedSite ? selectedSite.hits_last_24h : pixelSites.reduce((s, x) => s + x.hits_last_24h, 0) }} in last 24h</span>
                        <span v-if="todayDelta !== null" class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            :class="deltaBadgeClass(todayDelta)">
                            {{ deltaIcon(todayDelta) }} today
                        </span>
                    </div>
                </div>
                <!-- Ad Conversions -->
                <div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <p class="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ad Conversions</p>
                    <h4 class="text-4xl font-black text-indigo-600 tracking-tight">{{ chartEvents.filter(e => e.gclid || e.utm_campaign || e.google_campaign_id).length }}</h4>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-[10px] font-black text-indigo-500">Targeted Traffic</span>
                        <span v-if="weekDelta !== null" class="text-[10px] font-black px-2 py-0.5 rounded-lg"
                            :class="deltaBadgeClass(weekDelta)">
                            {{ deltaIcon(weekDelta) }} 7d
                        </span>
                    </div>
                </div>
                <!-- Engagement -->
                <div class="bg-indigo-600 p-8 shadow-indigo-200 shadow-2xl rounded-[2.5rem] text-white">
                    <p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Engagement Qty</p>
                    <h4 class="text-4xl font-black tracking-tight">{{ avgClicks }}</h4>
                    <div class="mt-3 text-[10px] font-black text-indigo-200">Avg Clicks Per Ad Session</div>
                </div>
            </div>

            <!-- Connection/Security Panel -->
            <div class="lg:col-span-4 bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Pixel Health</h3>
                    <button @click="runConnectionTest" :disabled="isTestingConn" class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                        {{ isTestingConn ? 'Testing...' : 'Test Now' }}
                    </button>
                </div>
                <div v-if="selectedSite" class="space-y-4">
                    <div class="relative">
                        <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Traffic Domain Pinning</label>
                        <input v-model="allowedDomainInput" placeholder="diaminyaesthetics.com" class="w-full bg-slate-50 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-xl text-[11px] font-bold text-slate-800 py-3 px-4 pr-16" />
                        <button @click="saveAllowedDomain" class="absolute right-2 bottom-2 bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Save</button>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                        <span class="text-[9px] font-black text-slate-400 uppercase">Subdomain Pinning</span>
                        <span class="text-[9px] font-black text-emerald-600 uppercase">Active (v3.1)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Insights Bar (Geography & Devices) ───────────────────── -->
        <div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <!-- Top Geographies -->
                <div class="lg:col-span-8">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Signal Origin</h4>
                            <p class="text-[9px] text-slate-400 font-medium mt-1">Acquisition by country and territory (last 30 days)</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="geo in topCountries" :key="geo.code" 
                            class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-premium hover:border-indigo-100/50 transition-all group">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-2xl group-hover:scale-110 transition-transform">{{ getCountryFlag(geo.code) }}</span>
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {{ Math.round((geo.count / (analyticsData?.summary?.last30_hits || chartEvents.length || 1)) * 100) }}%
                                </span>
                            </div>
                            <p class="text-[10px] font-black text-slate-900 leading-tight line-clamp-2 h-7" :title="getCountryName(geo.code)">{{ getCountryName(geo.code) }}</p>
                            <p class="text-[9px] font-black text-indigo-500 uppercase mt-0.5">{{ geo.count.toLocaleString() }} <span class="text-slate-400">Signals</span></p>
                        </div>
                        <div v-if="topCountries.length === 0" class="col-span-full py-12 text-center text-slate-300 italic text-[11px] border-2 border-dashed border-slate-100 rounded-2xl">
                            Intelligence gathering in progress...
                        </div>
                    </div>
                </div>

                <!-- Device Breakdown (Doughnut) -->
                <div class="lg:col-span-4 border-l border-slate-100 pl-12 flex flex-col">
                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Client Distribution</h4>
                    <div class="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                        <!-- Total Center Display -->
                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span class="text-2xl font-black text-slate-900">{{ (deviceBreakdown.Mobile + deviceBreakdown.Desktop + deviceBreakdown.Tablet).toLocaleString() }}</span>
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Unique Devices</span>
                        </div>
                        <div class="w-full h-full max-h-[180px]">
                            <Doughnut :data="deviceChartData" :options="deviceChartOptions" />
                        </div>
                    </div>
                    
                    <!-- Premium Legend -->
                    <div class="mt-8 grid grid-cols-3 gap-2">
                        <div v-for="(color, idx) in ['#6366f1', '#10b981', '#f59e0b']" :key="idx" class="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100/50">
                            <span class="w-2 h-2 rounded-full mb-1" :style="{ backgroundColor: color }"></span>
                            <span class="text-[8px] font-black text-slate-400 uppercase">{{ deviceChartData.labels[idx] }}</span>
                            <span class="text-[10px] font-black text-slate-900 mt-0.5">{{ deviceChartData.datasets[0].data[idx].toLocaleString() }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Cities / Regions Section (NEW) -->
            <div v-if="topCities.length > 0" class="mt-12 pt-8 border-t border-slate-50">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Traffic Fingerprinting</h4>
                        <p class="text-[9px] text-slate-400 font-medium mt-1">High-intent regional signal clusters</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <div v-for="city in topCities" :key="city.name" class="px-4 py-2 bg-indigo-50/30 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100/50 flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                        {{ city.name }}
                        <span class="px-1.5 py-0.5 bg-white rounded-md text-[8px] border border-indigo-100">{{ city.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══ 30-Day Signal History Chart ════════════════════════════════ -->
        <div class="bg-white p-12 shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative">
            <div class="flex items-center justify-between mb-10">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        30-Day Signal History
                        <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">Daily</span>
                    </h3>
                    <p class="text-slate-400 font-medium text-xs mt-1">Total pixel hits (bars) vs Ad-attributed hits (amber line) — darker bars = above-average days</p>
                </div>
                <div class="flex gap-4">
                    <div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span class="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">Total Signals</span>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                        <span class="text-[10px] font-black text-amber-600 uppercase">Ad Hits</span>
                    </div>
                </div>
            </div>
            <div class="h-[380px] relative">
                <div v-if="!analyticsData" class="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p class="text-[11px] font-black uppercase tracking-widest text-slate-300">Computing history...</p>
                </div>
                <Bar v-if="analyticsData" :data="historyChartData" :options="historyChartOptions" />
            </div>
        </div>

        <!-- ══ Path Intelligence Table ════════════════════════════════════ -->
        <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
            <div class="px-12 pt-12 pb-8 flex items-end justify-between border-b border-slate-50">
                <div>
                    <h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Path Intelligence
                        <span class="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-slate-100">Top 10</span>
                    </h3>
                    <p class="text-slate-400 text-xs font-medium mt-1">Most-visited pages with 14-day trend sparkline and day-over-day delta. Click a row to drill into its log.</p>
                </div>
                <button v-if="pathFilter" @click="pathFilter = ''" class="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    Clear filter
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left min-w-[900px]">
                    <thead>
                        <tr class="bg-slate-50/60">
                            <th class="py-5 px-12 text-[9px] font-black text-slate-400 uppercase tracking-widest">Page / Path</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Intent Score</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hits</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">14-Day Trend</th>
                            <th class="py-5 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Δ vs Yesterday</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr v-if="isLoadingAnalytics && !topPages.length">
                            <td colspan="7" class="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading path data...</td>
                        </tr>
                        <tr v-for="(page, idx) in topPages" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="group hover:bg-indigo-50/30 cursor-pointer transition-all"
                            :class="{ 'bg-indigo-50/20 border-l-4 border-indigo-500': pathFilter === page.page_url }">
                            <td class="py-7 px-12">
                                <div class="flex items-center gap-4">
                                    <span class="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">{{ idx + 1 }}</span>
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <p class="text-xs font-black text-slate-900 truncate max-w-xs" :title="page.page_url">
                                                {{ safePathLabel(page.page_url) }}
                                            </p>
                                            <span v-if="page.is_ad_ready" class="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase tracking-tighter shadow-sm shadow-emerald-100">Ad Ready</span>
                                            <span v-if="page.top_intent" 
                                                class="px-2 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-tighter border shadow-sm"
                                                :class="{
                                                    'bg-indigo-50 text-indigo-600 border-indigo-100': page.top_intent === 'Transactional',
                                                    'bg-blue-50 text-blue-600 border-blue-100': page.top_intent === 'Commercial',
                                                    'bg-slate-50 text-slate-500 border-slate-100': page.top_intent === 'Informational',
                                                }"
                                            >{{ page.top_intent }} Intent</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span v-for="k in page.matched_keywords.slice(0, 3)" :key="k.query" class="text-[8px] font-bold text-slate-400">#{{ k.query.replace(/\s+/g, '') }}</span>
                                            <span v-if="!page.matched_keywords.length" class="text-[9px] text-slate-300 font-bold truncate max-w-xs">{{ safeHostname(page.page_url) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <div class="inline-flex flex-col items-center">
                                    <span class="text-sm font-black" :class="page.engagement_score >= 70 ? 'text-indigo-600' : 'text-slate-900'">{{ page.engagement_score }}</span>
                                    <div class="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div class="h-full bg-indigo-500" :style="{ width: page.engagement_score + '%' }"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <span class="text-sm font-black text-slate-900">{{ page.total_hits }}</span>
                                <p class="text-[9px] text-slate-400 font-bold mt-1">{{ page.ad_hits }} Ad Hits</p>
                            </td>
                            <td class="py-7 px-6 text-center">
                                <div class="flex flex-col items-center">
                                    <span class="text-xs font-black text-slate-700">{{ page.avg_duration }}s Dwell</span>
                                    <span class="text-[9px] text-slate-400 font-bold mt-1">{{ page.avg_clicks }} Avg Clicks</span>
                                </div>
                            </td>
                            <td class="py-7 px-6">
                                <!-- SVG sparkline -->
                                <div class="flex items-center justify-center">
                                    <svg width="80" height="28" class="overflow-visible">
                                        <defs>
                                            <linearGradient :id="'sg'+idx" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
                                                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                        <path v-if="sparklinePath(page.sparkline)" :d="sparklinePath(page.sparkline) + ' L80,28 L0,28 Z'"
                                            :fill="'url(#sg'+idx+')'" />
                                        <path :d="sparklinePath(page.sparkline)" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </td>
                            <td class="py-7 px-10 text-right">
                                <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black"
                                    :class="deltaBadgeClass(page.delta_pct)">
                                    {{ deltaIcon(page.delta_pct) }}
                                </span>
                                <p class="text-[9px] text-slate-400 font-bold mt-1.5 text-right">Today: {{ page.today_count }} / Yday: {{ page.yesterday_count }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="topPages.length === 0 && !isLoadingAnalytics" class="p-16 text-center">
                <p class="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">No page data yet — signals will appear as your pixel fires.</p>
            </div>
        </div>

        <!-- ══ Trend Velocity + Top Referrers ════════════════════════════ -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Rising & Falling -->
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Fastest Rising -->
                <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
                    <div class="flex items-center gap-3 mb-7">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">🚀</div>
                        <div>
                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Fastest Rising</p>
                            <p class="text-[9px] text-slate-400 font-bold">7-day growth vs prior 7 days</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div v-if="rising.length === 0" class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">Collecting velocity data...</div>
                        <div v-for="page in rising" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="flex items-center justify-between p-5 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border border-emerald-100/50 cursor-pointer transition-all group">
                            <div class="min-w-0 mr-4">
                                <p class="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{{ safePathLabel(page.page_url) }}</p>
                                <p class="text-[9px] text-slate-400 font-bold mt-0.5">{{ page.last7 }} hits this week</p>
                            </div>
                            <span class="shrink-0 text-[11px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                                ↑ +{{ page.delta_pct }}%
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Needs Attention -->
                <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
                    <div class="flex items-center gap-3 mb-7">
                        <div class="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg">📉</div>
                        <div>
                            <p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Needs Attention</p>
                            <p class="text-[9px] text-slate-400 font-bold">Biggest drops vs prior week</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div v-if="falling.length === 0" class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">No declining pages detected.</div>
                        <div v-for="page in falling" :key="page.page_url"
                            @click="drillToPath(page.page_url)"
                            class="flex items-center justify-between p-5 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl border border-rose-100/50 cursor-pointer transition-all group">
                            <div class="min-w-0 mr-4">
                                <p class="text-xs font-black text-slate-900 truncate group-hover:text-rose-700 transition-colors">{{ safePathLabel(page.page_url) }}</p>
                                <p class="text-[9px] text-slate-400 font-bold mt-0.5">{{ page.last7 }} hits this week</p>
                            </div>
                            <span class="shrink-0 text-[11px] font-black text-rose-600 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm">
                                ↓ {{ page.delta_pct }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Referrers -->
            <div class="lg:col-span-4 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl">
                <div class="flex items-center gap-3 mb-7">
                    <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    </div>
                    <div>
                        <p class="text-[11px] font-black text-white uppercase tracking-widest">Top Referrers</p>
                        <p class="text-[9px] text-slate-400 font-bold">Where your visitors came from</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div v-if="topReferers.length === 0" class="text-[10px] text-slate-600 font-black uppercase tracking-widest italic py-4 text-center">No referrer data yet.</div>
                    <div v-for="ref in topReferers" :key="ref.domain"
                        class="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0"></div>
                            <p class="text-[11px] font-black text-slate-200 truncate" :title="ref.domain">{{ safeHostname(ref.domain) || 'Direct / None' }}</p>
                        </div>
                        <span class="text-[10px] font-black text-slate-400 shrink-0 ml-3">{{ ref.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Middle: Snippet Generator & Campaign Tools ───────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 bg-slate-900 p-12 shadow-2xl rounded-[3.5rem] border border-slate-800 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div class="flex items-center justify-between mb-10">
                    <h3 class="text-2xl font-black text-white flex items-center gap-4">
                        <span class="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                        </span>
                        Tracker Implementation: {{ selectedSite ? selectedSite.label : 'Select a Site' }}
                    </h3>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-white/5 text-indigo-400 text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest">v3.1 Secure Handshake</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tracking Site</label>
                        <select v-model="selectedSiteId" class="w-full bg-slate-800 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer">
                            <option :value="null" class="bg-slate-900 text-slate-400">Select a Site...</option>
                            <option v-for="site in pixelSites" :key="site.id" :value="site.id" class="bg-slate-900 text-white">{{ site.label }}</option>
                        </select>
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Traffic Isolation</label>
                        <input v-model="selectedCampaignId" placeholder="e.g. MetaPilot_Agency_001" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6" />
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Link</label>
                        <select v-model="selectedPropId" class="w-full bg-slate-800 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer">
                            <option v-for="prop in properties" :key="prop.id" :value="prop.id" class="bg-slate-900 text-white">{{ prop.name }}</option>
                        </select>
                    </div>
                </div>

                <!-- Module Selection -->
                <div class="mb-10">
                    <div class="flex items-center justify-between mb-4">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Active Modules</label>
                        <button v-if="selectedSiteId" 
                            @click="saveModules"
                            :disabled="isSavingModules"
                            class="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all shadow-sm disabled:opacity-50">
                            <svg v-if="isSavingModules" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                            Save configuration to Site
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="mod in [
                            { id: 'click', label: 'Click Stream', desc: 'Ad attribution' },
                            { id: 'schema', label: 'AI Schema', desc: 'JSON-LD Injection' },
                            { id: 'seo', label: 'SEO Audit', desc: 'Page diagnostics' },
                            { id: 'behavior', label: 'Behavior', desc: 'Dwell & scroll' }
                        ]" :key="mod.id" 
                            @click="selectedModules.includes(mod.id) ? selectedModules = selectedModules.filter(m => m !== mod.id) : selectedModules.push(mod.id)"
                            class="p-4 rounded-2xl border-2 cursor-pointer transition-all select-none"
                            :class="selectedModules.includes(mod.id) ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/5 hover:border-white/10'">
                            <div class="flex items-center gap-3">
                                <div class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                                    :class="selectedModules.includes(mod.id) ? 'bg-white border-white' : 'border-white/20 bg-transparent'">
                                    <svg v-if="selectedModules.includes(mod.id)" class="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                </div>
                                <span class="text-[11px] font-black uppercase tracking-tight" :class="selectedModules.includes(mod.id) ? 'text-white' : 'text-slate-400'">{{ mod.label }}</span>
                            </div>
                            <p class="text-[9px] font-medium mt-1 ml-7" :class="selectedModules.includes(mod.id) ? 'text-white/60' : 'text-slate-500'">{{ mod.desc }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-black/40 rounded-3xl p-8 border border-white/5 shadow-inner relative group">
                    <pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed">{{ snippet }}</pre>
                    <button @click="copySnippet" class="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 opacity-0 group-hover:opacity-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                </div>
                
                <div class="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="flex items-start gap-4 text-slate-400">
                        <svg class="w-5 h-5 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <div class="space-y-1">
                            <p class="text-[10px] font-black text-white uppercase tracking-widest">Attribution Settings</p>
                            <p class="text-[10px] font-medium leading-relaxed">Every hit from this pixel will be permanently attributed to <span class="text-indigo-400 font-black">{{ selectedCampaignId || 'Default' }}</span> for campaign isolation.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4 text-slate-400">
                        <svg class="w-5 h-5 mt-1 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        <div class="space-y-1" v-if="selectedModules.includes('schema')">
                            <p class="text-[10px] font-black text-white uppercase tracking-widest">AI Schema Active</p>
                            <p class="text-[10px] font-medium leading-relaxed">MetaPilot will extract DOM metadata and inject optimized JSON-LD automatically. Conflict detection included.</p>
                        </div>
                        <div class="space-y-1" v-else>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Mode</p>
                            <p class="text-[10px] font-medium leading-relaxed">Only click events are tracked. Toggle "AI Schema" to enable automated SEO injections.</p>
                        </div>
                    </div>
                </div>
                <div v-if="selectedSite" class="mt-6 flex justify-end">
                    <button @click="showRegenModal = true" class="text-[10px] font-black text-rose-500 hover:text-white transition-colors uppercase tracking-widest">Regenerate Secret</button>
                </div>
            </div>

            <!-- Developer Console -->
            <div class="lg:col-span-4 bg-slate-100 p-10 rounded-[3.5rem] border border-slate-200">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Console Diagnostics</h3>
                <div class="space-y-6">
                    <div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-2">Inspect State</p>
                        <code class="text-[10px] font-black text-indigo-600 block mb-2">window.MetaPilot</code>
                        <p class="text-[9px] text-slate-500 italic">Verify handshake status, retry queue, and hit signatures live.</p>
                    </div>
                    <div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <p class="text-[9px] font-black text-slate-400 uppercase mb-2">Campaign Isolation</p>
                        <p class="text-[10px] font-black text-slate-700">MetaPilot Agencies drive traffic using <span class="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">data-campaign</span> to correctly differentiate their ads from organic traffic.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Signal Intelligence Log ──────────────────────────────────── -->
        <div id="intel-log" class="space-y-8">
            <div class="flex items-end justify-between gap-8">
                <div class="flex-1">
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight">Intelligence Log</h3>
                    <p class="text-slate-500 font-medium">Real-time attribution and behavioral forensics</p>
                </div>
                <div class="flex items-center gap-3">
                    <button v-if="activeTab === 'signals'" @click="downloadCsv" class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Export CSV
                    </button>
                    <div class="w-80 relative">
                        <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <input v-if="activeTab === 'signals'"
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Search sessions, URLs, cities..." 
                            class="w-full bg-white border-slate-200 rounded-[2rem] text-[11px] font-bold text-slate-700 py-4 pl-14 pr-6 focus:ring-4 focus:ring-indigo-50 transition-all" />
                    </div>
                </div>
            </div>

            <div v-show="activeTab === 'signals'" class="space-y-8">
            <!-- Advanced Filter Bar -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium-soft flex flex-wrap items-center gap-6">
                <!-- Type -->
                <div class="flex-1 min-w-[150px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Type</label>
                    <select v-model="filters.type" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🌐 All Traffic</option>
                        <option value="ads">🎯 Ad Conversions</option>
                        <option value="organic">🌿 Organic Only</option>
                    </select>
                </div>
                <!-- Campaign -->
                <div class="flex-1 min-w-[200px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign ID</label>
                    <select v-model="filters.campaign_id" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🏷️ All Campaigns</option>
                        <option v-for="cap in availableCampaigns" :key="cap" :value="cap">{{ cap }}</option>
                    </select>
                </div>
                <!-- Device -->
                <div class="flex-1 min-w-[140px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Device</label>
                    <select v-model="filters.device" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">📱 All Devices</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Desktop">Desktop</option>
                        <option value="Tablet">Tablet</option>
                    </select>
                </div>
                <!-- Country -->
                <div class="flex-1 min-w-[140px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                    <select v-model="filters.country" @change="applyFilters" class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0">
                        <option value="all">🌍 Global</option>
                        <option v-for="c in topCountries" :key="c.code" :value="c.code">{{ c.code }}</option>
                    </select>
                </div>
                <!-- Date Range -->
                <div class="flex-[1.5] min-w-[300px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                    <div class="flex items-center gap-2">
                        <input type="date" v-model="filters.start_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                        <span class="text-slate-300">→</span>
                        <input type="date" v-model="filters.end_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                    </div>
                </div>
            </div>

            <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr class="bg-slate-50/50">
                                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Journey</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Device</th>
                                <th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                                <th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Attribution</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="event in logResponse.data" :key="event.id"
                                @click="selectedSession = event"
                                class="group hover:bg-slate-50 transition-all cursor-pointer">
                                <td class="py-8 px-10">
                                    <div class="flex items-center gap-5">
                                        <div class="w-12 h-12 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all shadow-sm">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-slate-900 flex items-center gap-2">
                                                ID: {{ event.session_id ? event.session_id.substring(0, 10) : '—' }}
                                                <span v-if="event.gclid" class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                            </p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase tracking-tight mt-1">{{ new Date(event.created_at).toLocaleTimeString() }} · {{ event.created_at?.split('T')[0] }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-5">
                                        <div>
                                            <p class="text-xs font-black text-slate-900">{{ event.duration_seconds }}s</p>
                                            <p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell</p>
                                        </div>
                                        <div class="w-px h-8 bg-slate-100"></div>
                                        <div>
                                            <p class="text-xs font-black tracking-tighter" :class="event.click_count > 3 ? 'text-emerald-600' : 'text-slate-900'">+{{ event.click_count }}</p>
                                            <p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Clicks</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div>
                                        <p class="text-xs font-black text-slate-800 uppercase">{{ event.browser }} / {{ event.platform }}</p>
                                        <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{{ event.device_type }} · {{ event.screen_resolution }}</p>
                                    </div>
                                </td>
                                <td class="py-8 px-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">{{ event.country_code === 'US' ? '🇺🇸' : event.country_code === 'KE' ? '🇰🇪' : '🌍' }}</span>
                                        <div>
                                            <p class="text-[10px] font-black text-slate-800 uppercase">{{ event.city || 'Unknown' }}</p>
                                            <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.country_code }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-10 text-right">
                                    <div class="flex flex-col items-end gap-1.5">
                                        <div v-if="event.google_campaign_id" class="px-2.5 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm">{{ event.google_campaign_id }}</div>
                                        <div v-if="event.gclid" class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100">GCLID ACTIVE</div>
                                        <div class="text-[9px] text-slate-400 font-bold max-w-[150px] truncate" :title="event.referrer">{{ event.referrer ? safeHostname(event.referrer) : 'DIRECT' }}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span class="text-slate-900">{{ logResponse.from || 0 }}-{{ logResponse.to || 0 }}</span> of <span class="text-slate-900">{{ logResponse.total }}</span> signals
                    </p>
                    <div class="flex items-center gap-3">
                        <button 
                            @click="prevPage" 
                            :disabled="filters.page === 1 || isLoading"
                            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                        >
                            Prev
                        </button>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-slate-900">Page {{ filters.page }} of {{ logResponse.last_page }}</span>
                        </div>
                        <button 
                            @click="nextPage" 
                            :disabled="filters.page === logResponse.last_page || isLoading"
                            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div v-if="logResponse.data.length === 0" class="p-32 text-center">
                    <div class="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-2 border-dashed border-slate-200">
                        <svg class="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h4 class="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Silenced Signals</h4>
                    <p class="text-slate-500 max-w-sm mx-auto font-medium">Listening for pixel signals on the authorised domain. No active signals captured with current filters.</p>
                </div>
            </div>
        </div>

            <!-- Signal Logic continued -->
    </div>

    <!-- ── Session Detail Modal ─────────────────────────────────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" @click="selectedSession = null"></div>
                <div class="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
                    <!-- Modal Header -->
                    <div class="p-14 border-b border-slate-100/50 flex items-center justify-between bg-white">
                        <div>
                            <div class="flex items-center gap-5">
                                <h3 class="text-4xl font-black text-slate-900 tracking-tight italic">Forensic Journey</h3>
                                <span class="px-5 py-1.5 bg-indigo-600 text-white text-[11px] font-black rounded-full uppercase tracking-widest shadow-2xl">
                                    {{ selectedSession?.session_id?.substring(0, 16) || 'ANONYMOUS' }}
                                </span>
                            </div>
                            <p class="text-slate-400 font-bold mt-3 text-xs uppercase tracking-widest">Digital forensics for attribution verification.</p>
                        </div>
                        <button @click="selectedSession = null" class="w-16 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-3xl transition-all flex items-center justify-center active:scale-90">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-14 bg-white">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            <!-- Left: Journey -->
                            <div class="lg:col-span-5 space-y-12">
                                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                                    <span class="w-10 h-0.5 bg-indigo-600"></span>Step-by-Step Signals
                                </h4>
                                <div class="space-y-10 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100">
                                    <div v-for="entry in sessionTimeline" :key="entry.id" class="relative pl-14 group">
                                        <div class="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 group-hover:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm">
                                            <div class="w-2 h-2 bg-slate-200 group-hover:bg-indigo-600 rounded-full transition-all"></div>
                                        </div>
                                        <p class="text-sm font-black text-slate-900 uppercase italic truncate" :title="entry.page_url">{{ entry.page_url?.split('/').pop() || 'Root Index' }}</p>
                                        <div class="flex items-center gap-4 mt-2">
                                            <span class="text-[10px] text-slate-400 font-black uppercase">{{ new Date(entry.created_at).toLocaleTimeString() }}</span>
                                            <span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded uppercase">{{ entry.duration_seconds }}s Stay</span>
                                            <span v-if="entry.click_count > 0" class="text-emerald-600 text-[9px] font-black uppercase tracking-widest">{{ entry.click_count }} Clicks</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Analytics -->
                            <div class="lg:col-span-7 space-y-12">
                                <div class="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 relative overflow-hidden">
                                    <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Engagement Peak Analysis</h4>
                                    <div class="h-64">
                                        <Line :data="sessionChartData" :options="modalChartOptions" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-8">
                                    <div class="space-y-4">
                                        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Origin</h5>
                                        <div class="space-y-3">
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Source</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.utm_source || 'DIRECT' }}</p>
                                            </div>
                                            <div class="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-indigo-400 uppercase mb-1">Campaign ID</p>
                                                <p class="text-xs font-black text-indigo-700 uppercase">{{ selectedSession.google_campaign_id || 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="space-y-4">
                                        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Spec</h5>
                                        <div class="space-y-3">
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Tech Stack</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.browser }} / {{ selectedSession.platform }}</p>
                                            </div>
                                            <div class="p-5 bg-white border border-slate-100 rounded-3xl">
                                                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Canvas</p>
                                                <p class="text-xs font-black text-slate-800 uppercase">{{ selectedSession.screen_resolution }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Google Ads Verification</p>
                                    <p v-if="selectedSession.gclid" class="text-xs font-bold text-emerald-700 break-all leading-relaxed">
                                        Verified Google Ads lead with GCLID: <span class="font-black italic bg-white/50 px-1">{{ selectedSession.gclid }}</span>
                                    </p>
                                    <p v-else class="text-xs font-bold text-slate-400 italic uppercase tracking-tighter">No GCLID detected for this session.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- ── Regeneration Confirmation ────────── -->
        <ConfirmationModal
            :show="showRegenModal"
            title="Regenerate Site Token?"
            message="This action is irreversible. All current tracking scripts for this specific site will stop working until updated with the new token."
            confirmText="Regenerate"
            @close="showRegenModal = false"
            @confirm="regenerateToken"
        />

        <!-- ── New Site Modal ────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showNewSiteModal" class="fixed inset-0 z-[70] flex items-center justify-center p-6">
                <div class="absolute inset-0 bg-slate-100/40 backdrop-blur-md" @click="showNewSiteModal = false"></div>
                <div class="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-200">
                    <h3 class="text-2xl font-black text-slate-900 mb-2">Add Tracking Site</h3>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Generate a unique key for another domain.</p>

                    <form @submit.prevent="createSite" class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Label</label>
                            <input v-model="newSite.label" required placeholder="e.g. Shopify Store, Landing Page..." class="w-full bg-slate-50 border-slate-100 rounded-xl text-xs font-bold py-4 px-5 focus:ring-0 focus:border-indigo-500" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Allowed Domain (Optional)</label>
                            <input v-model="newSite.allowed_domain" placeholder="example.com" class="w-full bg-slate-50 border-slate-100 rounded-xl text-xs font-bold py-4 px-5 focus:ring-0 focus:border-indigo-500" />
                            <p class="text-[9px] text-slate-400 font-medium leading-relaxed italic mt-2">Recommended for security. Only hits from this domain will be accepted.</p>
                        </div>

                        <div class="flex items-center gap-4 pt-4">
                            <button type="submit" :disabled="isCreatingSite" class="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50">
                                {{ isCreatingSite ? 'Generating...' : 'Create Site' }}
                            </button>
                            <button type="button" @click="showNewSiteModal = false" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </transition>
    </div>
</template>
