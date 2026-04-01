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
const showHealthModal    = ref(false)
const healthModalSite    = ref(null)
const isListening        = ref(false)
const lastHeardSignal    = ref(null)
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
    page: 1,
    exclude_bots: true,
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    gclid: ''
})

let eventsInterval     = null
let connInterval       = null
let analyticsInterval  = null

// Path Intelligence pagination
const pagesPage      = ref(1)
const pagesPerPage   = ref(10)
const pagesTotalCount = ref(0)

// Attribution unified search
const attributionSearch = ref('')

// Expanded row for bottleneck details (stores page_url or null)
const expandedPage = ref(null)

// Diagnostic Actions State
const injectingPage = ref(null) // page_url
const fetchingSource = ref(null) // page_url
const showSourceModal = ref(false)
const sourceData = ref({ html: '', schema: null, url: '', mode: 'html' })

// Code Highlighting Logic
const highlightHtml = (code) => {
    if (!code) return ''
    return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="text-slate-500 italic">$1</span>') // Comments
        .replace(/(&lt;\/?[a-z1-6]+)/gi, '<span class="text-rose-400">$1</span>') // Tags
        .replace(/(&gt;)/gi, '<span class="text-rose-400">$1</span>') // Tag closure
        .replace(/\s([a-z-]+)(?==)/gi, ' <span class="text-amber-300">$1</span>') // Attributes
        .replace(/="([^"]*)"/gi, '=<span class="text-emerald-400">"$1"</span>') // Strings
}

const highlightJson = (code) => {
    if (!code) return ''
    return code
        .replace(/"([^"]+)"(?=:)/g, '<span class="text-indigo-300">"$1"</span>') // Keys
        .replace(/(?<=: )"([^"]+)"/g, '<span class="text-emerald-300">"$1"</span>') // String Values
        .replace(/(?<=: )(\d+)/g, '<span class="text-amber-400">$1</span>') // Numbers
        .replace(/(?<=: )(true|false|null)/g, '<span class="text-rose-400">$1</span>') // Boolean/Null
}

const sourceLines = computed(() => {
    const raw = sourceData.value.mode === 'html' 
        ? sourceData.value.html 
        : JSON.stringify(sourceData.value.schema, null, 4)
    return (raw || '').split('\n')
})

const autoInjectSchema = async (page) => {
    if (!selectedSiteId.value) return toast.error('Please select a pixel site first.', 'Error')
    injectingPage.value = page.page_url
    try {
        const res = await axios.post(route('google-ads.generate-schema'), {
            pixel_site_id: selectedSiteId.value,
            url: page.page_url
        })
        toast.success(res.data.message, 'Schema Generated')
        // We might want to refresh analytics if it's not too heavy
        // fetchAnalytics() 
    } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to generate schema.', 'Error')
    } finally {
        injectingPage.value = null
    }
}

const viewPageSource = async (page) => {
    fetchingSource.value = page.page_url
    try {
        const res = await axios.get(route('google-ads.page-source'), {
            params: { url: page.page_url }
        })
        sourceData.value = {
            html: res.data.html,
            schema: res.data.schema,
            url: res.data.url,
            mode: res.data.schema ? 'schema' : 'html'
        }
        showSourceModal.value = true
    } catch (e) {
        toast.error('Failed to fetch page source.', 'Error')
    } finally {
        fetchingSource.value = null
    }
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const siteToken = computed(() => props.organization?.ads_site_token)

const selectedProperty = computed(() =>
    props.properties?.find(p => p.id == selectedPropId.value)
)

const selectedSite = computed(() => 
    pixelSites.value.find(s => s.id === selectedSiteId.value)
)

const campaignFilter   = ref('all')  // legacy filter kept for filteredEvents computed

const filteredEvents = computed(() => {
    let ev = logResponse.value.data
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
const pagesTotal = computed(() => analyticsData.value?.pages_total     ?? 0)
const topReferers = computed(() => analyticsData.value?.top_referrers ?? [])
const rising     = computed(() => analyticsData.value?.trend_velocity?.rising  ?? [])
const falling    = computed(() => analyticsData.value?.trend_velocity?.falling ?? [])
const siteHealth = computed(() => analyticsData.value?.site_health ?? null)

// Session lead qualification
const sessionIsLead = computed(() => {
    if (!selectedSession.value) return false
    const total = sessionTimeline.value.reduce((s, e) => s + (e.duration_seconds || 0), 0)
    const hasHotPage = sessionTimeline.value.some(e => (e.duration_seconds || 0) >= 60)
    return total >= 90 || hasHotPage
})

const copyJourney = () => {
    const urls = sessionTimeline.value.map(e => e.page_url).filter(Boolean).join('\n')
    navigator.clipboard.writeText(urls)
    toast.success('Full journey copied!', 'Copied')
}

const copyFullJourney = copyJourney  // alias used in session modal

// Bottleneck helpers
const bottleneckIcon = (sev) => ({ critical: '🔴', warning: '🟡', good: '🟢' }[sev] ?? '⚪')
const bottleneckLabel = (sev) => ({ critical: 'Critical', warning: 'Warning', good: 'Good' }[sev] ?? 'N/A')
const bottleneckBg = (sev) => ({ critical: 'bg-rose-50 text-rose-700 border-rose-200', warning: 'bg-amber-50 text-amber-700 border-amber-200', good: 'bg-emerald-50 text-emerald-700 border-emerald-200' }[sev] ?? 'bg-slate-50 text-slate-500')

// Path Intelligence health column helpers (bottleneck_score 0-100, higher = worse)
const getHealthLabel = (score) => {
    if (score == null) return 'Unknown'
    if (score >= 60) return 'Critical'
    if (score >= 35) return 'Fair'
    return 'Healthy'
}
const getHealthClass = (score) => {
    if (score == null) return 'bg-slate-50 text-slate-400 border-slate-100'
    if (score >= 60) return 'bg-rose-50 text-rose-600 border-rose-200'
    if (score >= 35) return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'
}

// Format ms → human
const fmtMs = (ms) => {
    if (!ms || ms === 0) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
}

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
            params: { 
                ...filters.value,
                pixel_site_id: selectedSiteId.value,
                pages_page:     pagesPage.value,
                pages_per_page: pagesPerPage.value,
            }
        })
        analyticsData.value = r.data
        pagesTotalCount.value = r.data.pages_total ?? 0
    } catch (e) {
        console.error('Failed to fetch analytics', e)
    } finally {
        isLoadingAnalytics.value = false
    }
}

const nextPagesPage = () => {
    const lastPage = Math.ceil(pagesTotal.value / pagesPerPage.value)
    if (pagesPage.value < lastPage) {
        pagesPage.value++
        fetchAnalytics()
    }
}

const prevPagesPage = () => {
    if (pagesPage.value > 1) {
        pagesPage.value--
        fetchAnalytics()
    }
}

const applyAttributionSearch = () => {
    const q = attributionSearch.value.trim()
    // Broadcast to all attribution filters simultaneously
    filters.value.utm_source   = q
    filters.value.utm_medium   = q
    filters.value.utm_campaign = q
    filters.value.page = 1
    fetchEvents()
}

const clearAttributionSearch = () => {
    attributionSearch.value    = ''
    filters.value.utm_source   = ''
    filters.value.utm_medium   = ''
    filters.value.utm_campaign = ''
    filters.value.gclid        = ''
    filters.value.page = 1
    fetchEvents()
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
        pixel_site_id: selectedSiteId.value,
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

const copyText = (text, label = 'Content') => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`, 'Copied')
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

const startLiveListener = () => {
    if (isListening.value) return
    isListening.value = true
    lastHeardSignal.value = null
    
    // Simple polling listener for the health modal
    const checkSignal = async () => {
        if (!isListening.value) return
        try {
            const r = await axios.get(route('google-ads.pixel-events'), {
                params: { pixel_site_id: healthModalSite.value?.id, per_page: 1 }
            })
            const latest = r.data.data?.[0]
            if (latest) {
                const latestTime = new Date(latest.created_at).getTime()
                const modalOpenTime = new Date().getTime() - 10000 // 10s grace
                if (latestTime > modalOpenTime) {
                    lastHeardSignal.value = latest
                    toast.success('Live signal detected! Connection verified.')
                }
            }
        } catch (e) {}
        if (isListening.value && !lastHeardSignal.value) {
            setTimeout(checkSignal, 2000)
        }
    }
    checkSignal()
}

watch(showHealthModal, (val) => {
    if (!val) {
        isListening.value = false
    }
})

const openHealthModal = (site = null) => {
    healthModalSite.value = site || selectedSite.value
    showHealthModal.value = true
}

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
                                <div v-if="selectedSiteId === site.id" class="flex gap-2">
                                    <button @click.stop="openHealthModal(site)" class="p-1 px-2 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase hover:bg-indigo-100 transition-colors">Health</button>
                                    <span class="text-indigo-600">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                                    </span>
                                </div>
                            </button>
                            <div v-if="filteredSiteOptions.length === 0" class="p-8 text-center text-[10px] font-black text-slate-300 uppercase italic">No sites found</div>
                        </div>
                    </div>
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
                <div class="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50 flex flex-col justify-center items-center text-center group hover:bg-white hover:shadow-premium transition-all">
                    <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Growth Forecast</p>
                    <h4 class="text-2xl font-black text-slate-900 tracking-tight">Stable</h4>
                    <span class="text-[9px] font-bold text-slate-400 mt-2 italic">Based on 7d velocity</span>
                </div>
            </div>
 
            <!-- Insights Card -->
            <div class="lg:col-span-4 bg-indigo-600 p-10 shadow-indigo-200 shadow-2xl rounded-[3rem] text-white relative overflow-hidden group">
                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform"></div>
                <div class="relative z-10">
                    <p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Avg Engagement</p>
                    <h4 class="text-4xl font-black tracking-tight">{{ avgClicks }} <small class="text-lg opacity-60">hits/session</small></h4>
                    <div class="mt-4 flex items-center gap-2">
                        <span class="px-2 py-0.5 bg-white/20 rounded text-[9px] font-bold uppercase tracking-tighter">Live Telemetry</span>
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

        <!-- Bottleneck Summary Panel -->
        <div v-if="topPages.filter(p => p.bottleneck_score >= 60).length" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="page in topPages.filter(p => p.bottleneck_score >= 60).slice(0, 3)" :key="page.page_url"
                class="group relative flex items-start gap-5 p-8 rounded-[2.5rem] border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                :class="page.bottleneck_score >= 80 ? 'bg-rose-50 border-rose-200 hover:shadow-rose-100 hover:shadow-lg' : 'bg-amber-50 border-amber-200 hover:shadow-amber-100 hover:shadow-lg'"
                @click="drillToPath(page.page_url)"
            >
                <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-30 transition-all group-hover:scale-125"
                    :class="page.bottleneck_score >= 80 ? 'bg-rose-400' : 'bg-amber-400'"></div>
                <div class="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                    :class="page.bottleneck_score >= 80 ? 'bg-white text-rose-500' : 'bg-white text-amber-500'">
                    {{ page.bottleneck_score >= 80 ? '🔴' : '🟡' }}
                </div>
                <div class="min-w-0 z-10">
                    <p class="text-[9px] font-black uppercase tracking-widest mb-0.5"
                        :class="page.bottleneck_score >= 80 ? 'text-rose-500' : 'text-amber-600'"
                    >{{ page.bottleneck_score >= 80 ? 'Critical' : 'Warning' }} · Score {{ page.bottleneck_score }}</p>
                    <p class="text-xs font-black text-slate-900 truncate" :title="page.page_url">{{ safePathLabel(page.page_url) }}</p>
                    <div class="flex flex-wrap gap-3 mt-2">
                        <span v-if="page.bounce_rate > 50" class="text-[9px] font-bold text-slate-500">↑ Bounce {{ page.bounce_rate }}%</span>
                        <span v-if="page.avg_load_time > 3000" class="text-[9px] font-bold text-slate-500">⏱ Load {{ (page.avg_load_time / 1000).toFixed(1) }}s</span>
                        <span v-if="page.error_count > 0" class="text-[9px] font-bold text-slate-500">⚠ {{ page.error_count }} errors/24h</span>
                    </div>
                </div>
            </div>
        </div>

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
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Health</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hits</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Bounce Rate</th>
                            <th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">14-Day Trend</th>
                            <th class="py-5 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Δ vs Yesterday</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <tr v-if="isLoadingAnalytics && !topPages.length">
                            <td colspan="7" class="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading path data...</td>
                        </tr>
                        <template v-for="(page, idx) in topPages" :key="page.page_url">
                            <tr @click="drillToPath(page.page_url)"
                                class="group hover:bg-slate-50 cursor-pointer transition-all border-l-4"
                                :class="pathFilter === page.page_url ? 'bg-indigo-50/20 border-indigo-500' : 'border-transparent'">
                                <td class="py-7 px-12">
                                    <div class="flex items-center gap-4">
                                        <div class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            {{ ((pagesPage - 1) * pagesPerPage) + idx + 1 }}
                                        </div>
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-2 mb-1">
                                                <p class="text-[11px] font-black text-slate-900 truncate max-w-xs" :title="page.page_url">
                                                    {{ safePathLabel(page.page_url) }}
                                                </p>
                                                <span v-if="page.is_ad_ready" class="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase tracking-tighter shadow-sm">Ad Ready</span>
                                                <button @click.stop="page.showRecs = !page.showRecs" class="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                                                    <svg class="w-3.5 h-3.5" :class="{ 'rotate-180': page.showRecs }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                                                </button>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span v-for="k in page.matched_keywords.slice(0, 3)" :key="k.query" class="text-[8px] font-bold text-slate-400">#{{ k.query.replace(/\s+/g, '') }}</span>
                                                <span v-if="!page.matched_keywords.length" class="text-[9px] text-slate-300 font-bold truncate max-w-xs">{{ safeHostname(page.page_url) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-7 px-6 text-center">
                                    <div class="inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border shadow-sm"
                                        :class="getHealthClass(page.bottleneck_score)">
                                        {{ getHealthLabel(page.bottleneck_score) }}
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
                                <td class="py-7 px-6 text-center">
                                    <span class="text-xs font-black" :class="page.bounce_rate > 50 ? 'text-rose-500' : 'text-emerald-500'">{{ page.bounce_rate }}%</span>
                                    <div class="w-12 h-1 bg-slate-100 rounded-full mt-1 mx-auto overflow-hidden">
                                        <div class="h-full" :class="page.bounce_rate > 50 ? 'bg-rose-500' : 'bg-emerald-500'" :style="{ width: page.bounce_rate + '%' }"></div>
                                    </div>
                                </td>
                                <td class="py-7 px-6">
                                    <!-- SVG sparkline -->
                                    <div class="flex items-center justify-center">
                                        <svg width="60" height="20" class="overflow-visible">
                                            <path v-if="sparklinePath(page.sparkline)" :d="sparklinePath(page.sparkline)" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                </td>
                                <td class="py-7 px-10 text-right">
                                    <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black font-mono shadow-sm"
                                        :class="deltaBadgeClass(page.delta_pct)">
                                        {{ deltaIcon(page.delta_pct) }}{{ Math.abs(page.delta_pct) }}%
                                    </span>
                                </td>
                            </tr>
                            <!-- Recommendation Row -->
                            <tr v-if="page.showRecs" class="bg-slate-50/80 border-l-4 border-indigo-200">
                                <td colspan="7" class="py-8 px-12">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div class="col-span-1 space-y-4">
                                            <h5 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Meta</h5>
                                            <div class="space-y-2">
                                                <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <span class="text-[9px] font-bold text-slate-500">Avg Load Time</span>
                                                    <span class="text-[10px] font-black" :class="page.avg_load_time > 3000 ? 'text-rose-500' : 'text-slate-900'">{{ (page.avg_load_time / 1000).toFixed(2) }}s</span>
                                                </div>
                                                <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <span class="text-[9px] font-bold text-slate-500">Issue Count (24h)</span>
                                                    <span class="text-[10px] font-black" :class="page.error_count > 0 ? 'text-rose-500' : 'text-slate-900'">{{ page.error_count }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-span-2 space-y-4">
                                             <h5 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">MetaPilot Optimization Logic</h5>
                                             <div class="p-6 bg-white rounded-2xl border border-slate-100 shadow-premium-sm relative overflow-hidden">
                                                 <div class="absolute right-4 top-4 text-xs opacity-20">🤖</div>
                                                 <p v-if="page.recommendations?.length" class="text-xs font-bold text-slate-800 leading-relaxed italic whitespace-pre-wrap">"{{ page.recommendations.join(' · ') }}"</p>
                                                 <p v-else class="text-xs font-bold text-slate-400 leading-relaxed italic">No specific recommendations — this page looks healthy! 🎉</p>
                                                 <div class="mt-6 flex items-center gap-4">
                                                     <button 
                                                        @click.stop="autoInjectSchema(page)"
                                                        :disabled="injectingPage === page.page_url"
                                                        class="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-tight shadow-md hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                                                      >
                                                          {{ injectingPage === page.page_url ? 'Injecting...' : 'Auto-Inject Schema' }}
                                                      </button>
                                                     <button 
                                                        @click.stop="viewPageSource(page)"
                                                        :disabled="fetchingSource === page.page_url"
                                                        class="px-4 py-2 bg-white text-slate-600 border border-slate-200 text-[9px] font-black rounded-lg uppercase tracking-tight hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30"
                                                      >
                                                          {{ fetchingSource === page.page_url ? 'Fetching...' : 'View Page Source' }}
                                                      </button>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            <div v-if="topPages.length === 0 && !isLoadingAnalytics" class="p-16 text-center">
                <p class="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">No page data yet — signals will appear as your pixel fires.</p>
            </div>

            <!-- Path Intelligence Pagination -->
            <div class="px-12 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Pages Tracked: <span class="text-slate-900">{{ pagesTotalCount }}</span>
                    </p>
                    <div class="flex items-center gap-3">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per Page</label>
                        <select v-model="pagesPerPage" @change="pagesPage = 1; fetchAnalytics()" class="bg-white border-slate-200 rounded-lg text-[10px] font-black py-1 px-3 focus:ring-0">
                            <option :value="10">10</option>
                            <option :value="25">25</option>
                            <option :value="50">50</option>
                        </select>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button 
                        @click="pagesPage--; fetchAnalytics()" 
                        :disabled="pagesPage === 1 || isLoadingAnalytics"
                        class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Prev
                    </button>
                    <span class="text-[10px] font-black text-slate-900 font-mono">Page {{ pagesPage }} of {{ Math.ceil(pagesTotalCount / pagesPerPage) || 1 }}</span>
                    <button 
                        @click="pagesPage++; fetchAnalytics()" 
                        :disabled="pagesPage >= Math.ceil(pagesTotalCount / pagesPerPage) || isLoadingAnalytics"
                        class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
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
                    <div class="flex items-center gap-5">
                        <div class="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg relative">
                            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                            <span v-if="selectedSite" class="absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-900" :class="{
                                'bg-emerald-500': selectedSite.status === 'verified_active',
                                'bg-amber-400': selectedSite.status === 'connected_inactive',
                                'bg-slate-300': selectedSite.status === 'not_detected',
                            }"></span>
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-white tracking-tight">
                                {{ selectedSite ? selectedSite.label : 'Select Pixel Site' }}
                            </h3>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ selectedSite ? selectedSite.ads_site_token.substring(0, 18) + '...' : 'System Identity v3.2' }}</span>
                                <button v-if="selectedSite" @click="openHealthModal(selectedSite)" class="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                                    <span class="w-1 h-1 rounded-full bg-indigo-500"></span>
                                    View Health & Config
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <button @click="showNewSiteModal = true" class="px-5 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all shadow-xl">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
                            New Identification
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lead Attribution ID</label>
                        <input v-model="selectedCampaignId" placeholder="e.g. fb_ads_winter_campaign" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6" />
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identification Source</label>
                        <select v-model="selectedSiteId" class="w-full bg-slate-800 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer">
                            <option :value="null">System Selection...</option>
                            <option v-for="site in pixelSites" :key="site.id" :value="site.id">{{ site.label }} ({{ site.total_hits }} hits)</option>
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

            <!-- Connection Health & Security Panel (Restored) -->
            <div class="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-premium relative overflow-hidden group">
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Connection Health</h3>
                        <span v-if="selectedSite" class="flex h-2 w-2 rounded-full" :class="{
                            'bg-emerald-500 animate-pulse': selectedSite.status === 'verified_active',
                            'bg-amber-400': selectedSite.status === 'connected_inactive',
                            'bg-slate-300': selectedSite.status === 'not_detected',
                        }"></span>
                    </div>

                    <!-- Domain Pinning -->
                    <div class="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Traffic Origin Pinning</label>
                        <div class="relative group/pin">
                            <input v-model="allowedDomainInput" placeholder="e.g. domain.com" class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-slate-700 py-3.5 px-5 shadow-sm" />
                            <button @click="saveAllowedDomain" class="absolute right-2 top-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg opacity-0 group-hover/pin:opacity-100 transition-all">Save</button>
                        </div>
                        <p class="text-[9px] text-slate-400 font-medium mt-2 leading-relaxed italic">Restricts signals to this domain ONLY.</p>
                    </div>

                    <!-- Diagnostics & Live Link -->
                    <div class="space-y-4">
                        <div class="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <p class="text-[9px] font-black text-slate-400 uppercase mb-2">Service Identity</p>
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-black text-slate-700 uppercase">{{ selectedSite ? selectedSite.label : 'N/A' }}</span>
                                <span class="text-[10px] font-mono text-indigo-600 font-black">{{ selectedSite ? selectedSite.ads_site_token.substring(0, 12) + '...' : '---' }}</span>
                            </div>
                        </div>

                        <button @click="openHealthModal()" v-if="selectedSite"
                            class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            Start Live Scan
                        </button>
                        <div v-else class="p-5 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Site to Verify</p>
                        </div>
                    </div>

                    <!-- Developer Quick Links -->
                    <div class="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <button @click="showRegenModal = true" v-if="selectedSite" class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">Reset Secret</button>
                        <div class="flex items-center gap-2">
                             <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight">API Identity v3.2</span>
                        </div>
                    </div>
                </div>
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 group-hover:bg-indigo-100/50 rounded-full transition-colors duration-700 pointer-events-none"></div>
            </div>
        </div>

        <!-- ── Signal Intelligence Log ──────────────────────────────────── -->
        <div id="intel-log" class="space-y-8 pt-12">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div class="flex-1">
                    <!-- Tab Switcher -->
                    <div class="flex items-center gap-8 mb-8 border-b border-slate-100">
                        <button @click="activeTab = 'signals'" 
                            class="text-[11px] font-black uppercase tracking-widest transition-all pb-4 border-b-2 flex items-center gap-2"
                            :class="activeTab === 'signals' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'">
                            Signals Log
                            <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px]">{{ logResponse.total }}</span>
                        </button>
                        <button @click="activeTab = 'performance'" 
                            class="text-[11px] font-black uppercase tracking-widest transition-all pb-4 border-b-2 flex items-center gap-2"
                            :class="activeTab === 'performance' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'">
                            Performance & Health
                            <span v-if="siteHealth?.alerts_last_24h?.length" class="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] animate-pulse">
                                {{ siteHealth.alerts_last_24h.length }} alerts
                            </span>
                        </button>
                    </div>

                    <div v-show="activeTab === 'signals'">
                        <h3 class="text-3xl font-black text-slate-900 tracking-tight">Signal Intelligence</h3>
                        <p class="text-slate-500 font-medium">Real-time attribution and behavioral forensics</p>
                    </div>
                    <div v-show="activeTab === 'performance'">
                        <h3 class="text-3xl font-black text-slate-900 tracking-tight">Performance & Health</h3>
                        <p class="text-slate-500 font-medium">Service delivery and behavioral bottlenecks</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-3">
                    <button v-if="activeTab === 'signals'" @click="downloadCsv" class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Export CSV
                    </button>
                    <div class="w-80 relative group" v-if="activeTab === 'signals'">
                        <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <svg class="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Find ID, URL, City..." 
                            class="w-full bg-white border-slate-200 rounded-[2rem] text-[11px] font-bold text-slate-700 py-4 pl-14 pr-6 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm" />
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
                <!-- Unified Attribution Search -->
                <div class="flex-[2] min-w-[300px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Attribution Search (UTM/GCLID)</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg class="w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <input 
                            v-model="attributionSearch" 
                            @input="applyAttributionSearch" 
                            placeholder="Find by source, medium, campaign or GCLID..." 
                            class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all shadow-sm" />
                        <button v-if="attributionSearch || filters.gclid" @click="clearAttributionSearch" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-rose-500">
                             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
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
                <!-- Date Range -->
                <div class="flex-[1.5] min-w-[300px] space-y-2">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                    <div class="flex items-center gap-2">
                        <input type="date" v-model="filters.start_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                        <span class="text-slate-300">→</span>
                        <input type="date" v-model="filters.end_date" @change="applyFilters" class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0" />
                    </div>
                </div>

                <div class="w-full h-px bg-slate-50 my-2"></div>

                <!-- Attribution Chips -->
                <div class="w-full flex flex-wrap gap-2 min-h-[32px]">
                    <div v-if="!filters.utm_source && !filters.utm_medium && !filters.utm_campaign && !filters.gclid" class="text-[9px] text-slate-300 font-bold uppercase py-2">No active attribution filters</div>
                    <div v-if="filters.utm_source" class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                        <span class="text-[9px] font-black text-slate-400 uppercase">Source:</span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">{{ filters.utm_source }}</span>
                        <button @click.stop="filters.utm_source = ''; applyFilters()" class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div v-if="filters.utm_medium" class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                        <span class="text-[9px] font-black text-slate-400 uppercase">Medium:</span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">{{ filters.utm_medium }}</span>
                        <button @click.stop="filters.utm_medium = ''; applyFilters()" class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div v-if="filters.utm_campaign" class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                        <span class="text-[9px] font-black text-slate-400 uppercase">Campaign:</span>
                        <span class="text-[10px] font-black text-indigo-600 uppercase">{{ filters.utm_campaign }}</span>
                        <button @click.stop="filters.utm_campaign = ''; applyFilters()" class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div v-if="filters.gclid" class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
                        <span class="text-[9px] font-black text-slate-400 uppercase">GCLID:</span>
                        <span class="text-[10px] font-black text-amber-700 uppercase">Active</span>
                        <button @click.stop="filters.gclid = ''; applyFilters()" class="ml-1 w-4 h-4 rounded-full bg-amber-100 hover:bg-rose-100 flex items-center justify-center text-amber-500 hover:text-rose-500 transition-colors">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <!-- Exclude Bots Toggle -->
                    <div class="ml-auto flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" for="bot-toggle">Exclude Bots</label>
                        <button @click="filters.exclude_bots = !filters.exclude_bots; applyFilters()" 
                            id="bot-toggle"
                            class="w-10 h-5 rounded-full transition-all relative"
                            :class="filters.exclude_bots ? 'bg-indigo-600' : 'bg-slate-200'"
                        >
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all" :class="{ 'translate-x-5': filters.exclude_bots }"></div>
                        </button>
                    </div>
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
                                            <p class="text-xs font-black text-slate-900 flex items-center gap-2">
                                                {{ event.duration_seconds }}s
                                                <span v-if="event.metadata?.is_engaged" class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Engaged Session"></span>
                                            </p>
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

            <!-- ── Performance & Health Tab (NEW) ────────────────────────── -->
            <div v-show="activeTab === 'performance'" class="space-y-12 pb-24">
                <!-- Health Overview Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium flex flex-col justify-between overflow-hidden relative group">
                        <div class="z-10">
                            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Alerts (24h)</p>
                            <h4 class="text-4xl font-black" :class="siteHealth?.alerts_last_24h?.length > 0 ? 'text-rose-500' : 'text-emerald-500'">
                                {{ siteHealth?.alerts_last_24h?.length || 0 }}
                            </h4>
                        </div>
                        <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 group-hover:bg-rose-50 group-hover:scale-110 transition-all blur-3xl rounded-full"></div>
                        <p class="text-[10px] font-medium text-slate-500 mt-4 leading-relaxed z-10">
                            Critical issues detected across your tracked properties in the last 24 hours.
                        </p>
                    </div>

                    <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
                        <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Error Distribution</p>
                        <div class="space-y-4">
                            <div v-for="err in siteHealth?.error_type_breakdown" :key="err.type" class="flex items-center justify-between">
                                <span class="text-[10px] font-black text-slate-600 uppercase">{{ err.type.replace('_', ' ') }}</span>
                                <div class="flex-1 mx-4 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                     <div class="h-full bg-indigo-500" :style="{ width: (siteHealth?.error_type_breakdown?.[0]?.count && err.count) ? Math.min(100, (err.count / siteHealth.error_type_breakdown[0].count) * 100) + '%' : '0%' }"></div>
                                </div>
                                <span class="text-[10px] font-black text-slate-900">{{ err.count }}</span>
                            </div>
                            <div v-if="!siteHealth?.error_type_breakdown?.length" class="text-center py-4 text-[10px] font-black text-slate-300 uppercase italic">No errors logged</div>
                        </div>
                    </div>

                    <div class="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Performance Baseline</p>
                        <h4 class="text-4xl font-black text-white">
                            {{ siteHealth?.slow_pages?.[0]?.avg_load_ms ? (siteHealth.slow_pages[0].avg_load_ms / 1000).toFixed(1) + 's' : '—' }}
                        </h4>
                        <p class="text-[10px] font-black text-indigo-200 mt-4 uppercase tracking-tighter">Slowest Peak Page Load</p>
                    </div>
                </div>

                <!-- Slow Pages Table -->
                <div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden">
                    <div class="p-10 border-b border-slate-50 flex items-center justify-between">
                        <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                            Performance Bottlenecks
                        </h4>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/50">
                                    <th class="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Target URL</th>
                                    <th class="py-8 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Load</th>
                                    <th class="py-8 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Incidents</th>
                                    <th class="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Last Peak</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                <tr v-for="page in siteHealth?.slow_pages" :key="page.url" class="hover:bg-slate-50 transition-all group cursor-pointer" @click="drillToPath(page.url)">
                                    <td class="py-6 px-10">
                                        <p class="text-xs font-black text-slate-900 truncate max-w-md">{{ page.url }}</p>
                                    </td>
                                    <td class="py-6 px-6 text-center">
                                        <span class="text-xs font-black text-rose-500">{{ (page.avg_load_ms / 1000).toFixed(2) }}s</span>
                                    </td>
                                    <td class="py-6 px-6 text-center">
                                         <span class="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">{{ page.count }}</span>
                                    </td>
                                    <td class="py-6 px-10 text-right">
                                        <span class="text-[10px] font-black text-slate-400">{{ fmt(page.last_seen) }}</span>
                                    </td>
                                </tr>
                                <tr v-if="!siteHealth?.slow_pages?.length">
                                    <td colspan="4" class="py-20 text-center text-[11px] font-black text-slate-300 uppercase italic">Great news! No slow page loads detected (>3s).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Alerts -->
                <div v-if="siteHealth?.alerts_last_24h?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="(alert, idx) in siteHealth.alerts_last_24h" :key="idx" class="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-start gap-6 relative group overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
                        <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 shrink-0">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">{{ alert.error_type.replace('_', ' ') }} Alert</p>
                            <p class="text-sm font-black text-slate-900 truncate" :title="alert.url">{{ alert.url }}</p>
                            <p class="text-[10px] font-bold text-slate-500 mt-2">{{ alert.count }} occurrences in the last 24 hours.</p>
                        </div>
                    </div>
                </div>
            </div>


    <!-- ── Session Detail Modal ─────────────────────────────────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="selectedSession" class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" @click="selectedSession = null"></div>
                <div class="relative w-full max-w-6xl bg-white/80 backdrop-blur-3xl rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[95vh] border border-white/40">
                    <!-- Modal Header -->
                    <div class="p-14 border-b border-slate-100/50 flex items-center justify-between bg-white/40">
                        <div>
                            <div class="flex items-center gap-5">
                                <h3 class="text-4xl font-black text-slate-900 tracking-tight">Session Journey</h3>
                                <div class="flex items-center gap-3">
                                    <button @click="copyText(selectedSession?.session_id, 'Session ID')" 
                                        class="group flex items-center gap-3 px-5 py-2 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
                                        {{ selectedSession?.session_id?.substring(0, 12) || 'ANONYMOUS' }}...
                                        <svg class="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                    </button>
                                    <span v-if="sessionIsLead" class="px-4 py-2 bg-amber-500 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-lg flex items-center gap-2">
                                        ✨ Likely Lead
                                    </span>
                                </div>
                            </div>
                            <p class="text-slate-400 font-bold mt-3 text-xs uppercase tracking-widest">Digital attribution verification & step-by-step signals.</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <button @click="copyFullJourney" class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-premium-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1"/></svg>
                                Copy full Journey
                            </button>
                            <button @click="selectedSession = null" class="w-16 h-16 bg-white/40 hover:bg-white text-slate-400 rounded-3xl transition-all flex items-center justify-center active:scale-90 border border-white/40 shadow-sm">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-14 bg-white/20 no-scrollbar">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            <!-- Left: Journey -->
                            <div class="lg:col-span-5 space-y-12">
                                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                                    <span class="w-10 h-0.5 bg-indigo-600"></span>Step-by-Step Visualization
                                </h4>
                                
                                <div class="space-y-10 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100">
                                    <div v-for="(entry, idx) in sessionTimeline" :key="entry.id" class="relative pl-14 group">
                                        <!-- Node -->
                                        <div class="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 group-hover:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm group-hover:shadow-indigo-100 group-hover:-translate-y-0.5">
                                            <span class="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">{{ idx + 1 }}</span>
                                        </div>

                                        <!-- Browser Simulation & Link -->
                                        <div class="space-y-3">
                                            <!-- Browser Bar Simulation -->
                                            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-4 transition-all group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-premium-sm relative overflow-hidden">
                                                <!-- Action dots -->
                                                <div class="flex gap-1.5 px-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <div class="w-2 h-2 rounded-full bg-rose-400"></div>
                                                    <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                                    <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                </div>

                                                <!-- Address Bar -->
                                                <div class="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 flex items-center justify-between group/bar">
                                                    <div class="flex items-center gap-2 overflow-hidden">
                                                        <svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0014 3c1.259 0 2.455.232 3.559.651m.517 1.352A9.993 9.993 0 0115.357 15l-.43.515"/></svg>
                                                        <span class="text-[9px] font-bold text-slate-500 truncate lowercase">{{ entry.page_url }}</span>
                                                    </div>
                                                    <button @click="copyText(entry.page_url, 'URL')" class="text-slate-300 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50">
                                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-4 px-2">
                                                <span class="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">{{ new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                                                <div class="h-1 w-1 rounded-full bg-slate-200"></div>
                                                <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase flex items-center gap-1.5" :class="{ 'bg-orange-50 text-orange-600': entry.duration_seconds >= 60 }">
                                                    {{ entry.duration_seconds }}s Engagement
                                                    <span v-if="entry.duration_seconds >= 60">🔥</span>
                                                </span>
                                                <span v-if="entry.click_count > 0" class="flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest" :class="{ 'text-indigo-600': entry.click_count >= 3 }">
                                                    <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="entry.click_count >= 3 ? 'bg-indigo-500' : 'bg-emerald-500'"></span>
                                                    {{ entry.click_count }} Interactions
                                                    <span v-if="entry.click_count >= 3">💡</span>
                                                </span>
                                            </div>
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
                                <div class="p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 backdrop-blur-md">
                                    <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        Google Ads Verification
                                    </p>
                                    <p v-if="selectedSession.gclid" class="text-xs font-bold text-emerald-800 break-all leading-relaxed">
                                        Verified Google Ads lead with GCLID: <span class="font-black bg-emerald-100/50 px-1.5 py-0.5 rounded-md">{{ selectedSession.gclid }}</span>
                                    </p>
                                    <p v-else class="text-xs font-bold text-slate-500 leading-relaxed italic">
                                        Organic attribution signal. No external click ID detected.
                                    </p>
                                </div>

                                <!-- Lead Acquisition Summary -->
                                <div v-if="sessionIsLead" class="p-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                                    <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                                    <div class="relative z-10">
                                        <div class="flex items-center justify-between mb-6">
                                            <h4 class="text-[10px] font-black text-amber-100 uppercase tracking-widest">Lead Qualification Report</h4>
                                            <span class="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase">Confirmed Interest</span>
                                        </div>
                                        <p class="text-lg font-black tracking-tight mb-4">High Acquisition Potential Detected</p>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="p-4 bg-white/10 rounded-2xl">
                                                <p class="text-[9px] font-black text-amber-100 uppercase mb-1">Total Dwell</p>
                                                <p class="text-lg font-black">{{ sessionTimeline.reduce((s, x) => s + x.duration_seconds, 0) }}s</p>
                                            </div>
                                            <div class="p-4 bg-white/10 rounded-2xl">
                                                <p class="text-[9px] font-black text-amber-100 uppercase mb-1">Max Dwell</p>
                                                <p class="text-lg font-black">{{ Math.max(...sessionTimeline.map(x => x.duration_seconds)) }}s</p>
                                            </div>
                                        </div>
                                    </div>
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
            <div v-if="showNewSiteModal" class="fixed inset-0 z-[75] flex items-center justify-center p-6">
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

        <!-- ── Pixel Health & Live Test Modal ────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
            <div v-if="showHealthModal && healthModalSite" class="fixed inset-0 z-[80] flex items-center justify-center p-6">
                <div class="absolute inset-0 bg-slate-100/50 backdrop-blur-2xl" @click="showHealthModal = false"></div>
                <div class="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-premium-lg border border-slate-200 overflow-hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-12">
                        <!-- Left: Site Info & Config -->
                        <div class="lg:col-span-5 bg-slate-50 p-12 border-r border-slate-100">
                            <div class="flex items-center gap-4 mb-8">
                                <div class="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-slate-900 leading-tight">{{ healthModalSite.label }}</h3>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Domain Identity Health</p>
                                </div>
                            </div>

                            <div class="space-y-8">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Traffic Domain Pinning</label>
                                    <div class="relative group/pin">
                                        <input v-model="allowedDomainInput" placeholder="e.g. site.com" class="w-full bg-white border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-0 focus:border-indigo-500 shadow-sm" />
                                        <button @click="saveAllowedDomain" class="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/pin:opacity-100 transition-opacity">Update</button>
                                    </div>
                                    <p class="text-[9px] text-slate-400 font-medium mt-2 leading-relaxed italic">Signals from domains not matching this pattern will be rejected (403).</p>
                                </div>

                                <div class="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
                                    <div class="flex items-center justify-between pb-4 border-b border-slate-50">
                                        <span class="text-[9px] font-black text-slate-400 uppercase">Verification ID</span>
                                        <span class="text-[10px] font-mono font-bold text-slate-600 tracking-tighter">{{ healthModalSite.ads_site_token.substring(0, 24) }}...</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-[9px] font-black text-slate-400 uppercase">Last Signal</span>
                                        <span class="text-[10px] font-bold text-slate-900 uppercase">{{ healthModalSite.last_hit_at ? new Date(healthModalSite.last_hit_at).toLocaleTimeString() : 'No hits detected' }}</span>
                                    </div>
                                </div>

                                <button @click="showRegenModal = true" class="w-full py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors">
                                    Regenerate Tracking token
                                </button>
                            </div>
                        </div>

                        <!-- Right: Live Diagnostic -->
                        <div class="lg:col-span-7 p-12 relative overflow-hidden">
                            <div v-if="!isListening && !lastHeardSignal" class="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl shadow-inner border border-slate-100">
                                    📡
                                </div>
                                <div class="max-w-xs">
                                    <h4 class="text-xl font-black text-slate-900">Live Connection Test</h4>
                                    <p class="text-sm text-slate-400 font-medium mt-2">Open your website in another tab once the listener is active to verify real-time tracking.</p>
                                </div>
                                <button @click="startLiveListener" class="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                                    Start Live Verification
                                </button>
                            </div>

                            <!-- Listening State -->
                            <div v-else-if="isListening && !lastHeardSignal" class="h-full flex flex-col items-center justify-center text-center space-y-8">
                                <div class="relative w-32 h-32">
                                    <div class="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                                    <div class="absolute inset-4 bg-indigo-500/40 rounded-full animate-ping animation-delay-500"></div>
                                    <div class="relative w-full h-full bg-white rounded-full flex items-center justify-center text-3xl shadow-premium border-2 border-indigo-500">
                                        👂
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <h4 class="text-2xl font-black text-slate-900">Listening for signals...</h4>
                                    <p class="text-sm text-indigo-500 font-bold uppercase tracking-widest animate-pulse">Waiting for hit from {{ healthModalSite.allowed_domain || 'any domain' }}</p>
                                </div>
                                <p class="text-[10px] text-slate-400 font-medium max-w-xs mt-4">Tip: Refresh your website or click a link to trigger a tracking event.</p>
                                <button @click="isListening = false" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel Test</button>
                            </div>

                            <!-- Success State -->
                            <div v-else-if="lastHeardSignal" class="h-full flex flex-col items-center justify-center text-center p-8">
                                <div class="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl shadow-2xl shadow-emerald-200 mb-8 animate-bounce">
                                    ✅
                                </div>
                                <h4 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Connection Success!</h4>
                                <p class="text-lg text-emerald-600 font-black uppercase tracking-tight mb-8">Signal Received via Secure Handshake</p>
                                
                                <div class="w-full bg-slate-900 rounded-3xl p-8 text-left space-y-4 border border-white/5">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-black text-slate-500 uppercase">Device</span>
                                        <span class="text-xs font-bold text-white">{{ lastHeardSignal.browser }} / {{ lastHeardSignal.platform }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-black text-slate-500 uppercase">Source Path</span>
                                        <span class="text-xs font-bold text-indigo-300 truncate max-w-[200px]">{{ lastHeardSignal.page_url }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-black text-slate-500 uppercase">Attribution ID</span>
                                        <span class="text-xs font-bold text-emerald-400">{{ lastHeardSignal.google_campaign_id || 'System Default' }}</span>
                                    </div>
                                    <div v-if="lastHeardSignal.metadata?.is_engaged || lastHeardSignal.duration_seconds >= 30" class="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span class="text-[10px] font-black text-slate-500 uppercase">Qualitative Status</span>
                                        <span class="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded uppercase tracking-widest animate-pulse">Engaged Lead</span>
                                    </div>
                                </div>

                                <button @click="lastHeardSignal = null; startLiveListener()" class="mt-8 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Run Another Test</button>
                            </div>
                        </div>
                    </div>
                    
                    <button @click="showHealthModal = false" class="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>
        </transition>

        <!-- ── Source Viewer Modal (NEW) ────────── -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="showSourceModal" class="fixed inset-0 z-[90] flex items-center justify-center p-6 md:p-12">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showSourceModal = false"></div>
                <div class="relative w-full max-w-5xl bg-[#1e293b] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                    <!-- Modal Header -->
                    <div class="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                        <div>
                            <h3 class="text-2xl font-black text-white tracking-tight">Source Diagnostic</h3>
                            <p class="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{{ sourceData.url }}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="flex bg-slate-800 p-1 rounded-xl border border-white/5">
                                <button @click="sourceData.mode = 'html'" 
                                    class="px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                    :class="sourceData.mode === 'html' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'">
                                    Raw HTML
                                </button>
                                <button @click="sourceData.mode = 'schema'" 
                                    class="px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                    :class="sourceData.mode === 'schema' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'">
                                    Injected Schema
                                </button>
                            </div>
                            <button @click="showSourceModal = false" class="w-12 h-12 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl transition-all flex items-center justify-center border border-white/5">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Code Content -->
                    <div class="flex-1 overflow-auto p-0 bg-[#0f172a] selection:bg-indigo-500/30 custom-scrollbar-dark no-scrollbar">
                         <div v-if="sourceLines.length > 0 && sourceLines[0] !== ''" class="min-w-full inline-block py-6">
                            <table class="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                                <tr v-for="(line, idx) in sourceLines" :key="idx" class="group hover:bg-white/5 transition-colors">
                                    <td class="select-none py-0.5 px-4 text-right align-top w-12 text-slate-600 border-r border-white/5 bg-slate-900/40 sticky left-0 z-10">
                                        {{ idx + 1 }}
                                    </td>
                                    <td class="py-0.5 px-6 whitespace-pre text-slate-300">
                                        <span v-if="sourceData.mode === 'html'" v-html="highlightHtml(line)"></span>
                                        <span v-else v-html="highlightJson(line)"></span>
                                    </td>
                                </tr>
                            </table>
                         </div>
                         <div v-else class="h-96 flex flex-col items-center justify-center text-center space-y-6">
                            <div class="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-white/5">
                                {{ sourceData.mode === 'html' ? '📄' : '🔍' }}
                            </div>
                            <div>
                                <p class="text-white font-black text-xs uppercase tracking-widest mb-1">No Content Detected</p>
                                <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Waiting for source transmission...</p>
                            </div>
                         </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-8 border-t border-white/5 bg-slate-900/40 flex items-center justify-between">
                         <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">MetaPilot Diagnostic Kernel v1.0</span>
                         <button @click="copyText(sourceData.mode === 'html' ? sourceData.html : JSON.stringify(sourceData.schema, null, 2), 'Code')" class="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                            Copy {{ sourceData.mode === 'html' ? 'HTML' : 'Schema' }}
                         </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
