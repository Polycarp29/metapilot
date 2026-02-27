<template>
  <AppLayout title="Keyword Intelligence">
    <div class="max-w-[1440px] mx-auto pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Keyword Intelligence</h1>
          <p class="text-slate-500 font-medium">Canonical knowledge base of trending topics with decay & resurgence forecasting.</p>
        </div>
        
        <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit">
          <Link 
            :href="route('keywords.trending')"
            class="px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span class="hidden sm:inline">Back</span>
          </Link>

          <div class="w-px h-4 bg-slate-200 mx-1"></div>

          <Link 
            :href="route('keywords.trending')"
            class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Trends
          </Link>
          <button 
            class="px-4 py-2 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all duration-300 flex items-center gap-2"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Intelligence
          </button>
          <Link 
            :href="route('keywords.research')"
            class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Research
          </Link>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-6">
        <div class="flex-1 min-w-[300px] relative">
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search keywords..." 
            class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
            @input="debouncedSearch"
          >
          <svg class="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div class="flex items-center gap-3">
          <select v-model="filters.niche" @change="fetchKeywords" class="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20">
            <option value="">All Niches</option>
            <option v-for="industry in industries" :key="industry.slug" :value="industry.slug">
              {{ industry.name }}
            </option>
          </select>

          <select v-model="filters.status" @change="fetchKeywords" class="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20">
            <option value="">All Statuses</option>
            <option value="rising">Rising</option>
            <option value="stable">Stable</option>
            <option value="decaying">Decaying</option>
            <option value="dormant">Dormant</option>
            <option value="resurgent">Resurgent</option>
          </select>

          <button @click="toggleBookmarks" class="px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all" :class="showBookmarksOnly ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">
            <svg class="w-4 h-4" :fill="showBookmarksOnly ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            {{ showBookmarksOnly ? 'My Bookmarks' : 'Show Bookmarks' }}
          </button>
        </div>
      </div>

      <!-- Keyword Grid -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 12" :key="i" class="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>
      </div>

      <div v-else-if="keywords.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="kw in keywords" 
          :key="kw.id"
          class="group bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden flex flex-col"
        >
          <!-- Status Badge -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span 
                class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                :class="statusClass(kw.decay_status)"
              >
                {{ kw.decay_status }}
              </span>
              <span v-if="kw.category" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ kw.category }}</span>
            </div>
            
            <button 
              @click="toggleBookmark(kw)"
              class="text-slate-300 hover:text-amber-500 transition-colors"
              :class="{ 'text-amber-500': kw.is_bookmarked }"
            >
              <svg class="w-5 h-5" :fill="kw.is_bookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
          </div>

          <h3 class="text-xl font-black text-slate-900 mb-4 truncate group-hover:text-blue-600 transition-colors">{{ kw.keyword }}</h3>
          
          <!-- Sparkline -->
          <div class="h-16 mb-6 w-full opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline :data="kw.trend_history" :color="sparklineColor(kw.decay_status)" />
          </div>

          <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Velocity</p>
              <span class="text-lg font-black" :class="kw.trend_velocity >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                {{ kw.trend_velocity >= 0 ? '+' : '' }}{{ Math.round(kw.trend_velocity) }}%
              </span>
            </div>
            
            <button 
              @click="showDetails(kw)"
              class="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
            >
              Analyze
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
        <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">No Intelligence Available</h3>
        <p class="text-slate-500 max-w-sm mx-auto">Discovery jobs will populate this canonical knowledge base automatically.</p>
        <Link :href="route('keywords.trending')" class="mt-6 inline-block text-blue-600 font-bold hover:underline">Run a Discovery Scan →</Link>
      </div>
    </div>

    <!-- Detail Drawer (Inline Implementation) -->
    <Transition 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="selectedKeyword" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" @click.self="selectedKeyword = null">
        <div class="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
          <!-- Close Button -->
          <button @click="selectedKeyword = null" class="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div class="flex items-center justify-between mb-8 pr-10">
             <h2 class="text-3xl font-black text-slate-900">{{ selectedKeyword.keyword }}</h2>
             <span :class="statusClass(selectedKeyword.decay_status)" class="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
               {{ selectedKeyword.decay_status }}
             </span>
          </div>

          <div class="grid grid-cols-3 gap-6 mb-8">
             <div class="bg-slate-50 p-6 rounded-3xl">
               <p class="text-xs font-bold text-slate-400 uppercase mb-2">Trend Velocity</p>
               <p class="text-3xl font-black text-slate-900">{{ selectedKeyword.trend_velocity }}%</p>
             </div>
             <div class="bg-slate-50 p-6 rounded-3xl">
               <p class="text-xs font-bold text-slate-400 uppercase mb-2">Global Score</p>
               <p class="text-3xl font-black text-slate-900">{{ Math.round(selectedKeyword.global_score) }}</p>
             </div>
             <div class="bg-slate-50 p-6 rounded-3xl">
               <p class="text-xs font-bold text-slate-400 uppercase mb-2">ML Relevance</p>
               <p class="text-3xl font-black text-slate-900">{{ selectedKeyword.relevance_score ? Math.round(selectedKeyword.relevance_score) + '%' : 'TBD' }}</p>
             </div>
          </div>

          <button 
             @click="predictDecay(selectedKeyword)"
             :disabled="mlLoading"
             class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg v-if="mlLoading" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ mlLoading ? 'Running ML Forecast...' : 'Run Precision Decay Forecast' }}
          </button>

          <div v-if="mlResult" class="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
             <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black">AI</div>
                <h4 class="font-black text-emerald-900 text-lg">Resurgence Prediction</h4>
             </div>
             <p class="text-emerald-800 font-medium leading-relaxed">
               Trend is currently <strong class="uppercase">{{ mlResult.decay_status }}</strong> with a forecast value of <strong>{{ mlResult.forecast_30d }}</strong> in 30 days. 
               Probability of resurgence: <strong>{{ (mlResult.resurgence_probability * 100).toFixed(1) }}%</strong>.
             </p>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
const props = defineProps({
  organization: Object,
  industries: Array
})

const page = usePage()
import axios from 'axios'
import _ from 'lodash'

const keywords = ref([])
const loading = ref(false)
const mlLoading = ref(false)
const mlResult = ref(null)
const selectedKeyword = ref(null)
const showBookmarksOnly = ref(false)

const filters = reactive({
  search: '',
  niche: '',
  status: '',
  region: ''
})

const fetchKeywords = async () => {
  loading.value = true
  try {
    const routeName = showBookmarksOnly.value ? 'api.ki.bookmarks' : 'api.ki.index'
    const res = await axios.get(route(routeName), { params: filters })
    keywords.value = showBookmarksOnly.value ? res.data : res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = _.debounce(fetchKeywords, 500)

const statusClass = (status) => {
  const classes = {
    rising: 'bg-emerald-100 text-emerald-600',
    stable: 'bg-blue-100 text-blue-600',
    decaying: 'bg-rose-100 text-rose-600',
    dormant: 'bg-slate-100 text-slate-600',
    resurgent: 'bg-amber-100 text-amber-600'
  }
  return classes[status] || 'bg-slate-100 text-slate-500'
}

const sparklineColor = (status) => {
  const colors = {
    rising: '#10b981',
    stable: '#3b82f6',
    decaying: '#f43f5e',
    dormant: '#94a3b8',
    resurgent: '#f59e0b'
  }
  return colors[status] || '#3b82f6'
}

const showDetails = (kw) => {
  selectedKeyword.value = kw
  mlResult.value = null
}

const toggleBookmarks = () => {
  showBookmarksOnly.value = !showBookmarksOnly.value
  fetchKeywords()
}

const toggleBookmark = async (kw) => {
  try {
    if (kw.is_bookmarked) {
      await axios.delete(route('api.ki.bookmark.destroy', kw.id))
      kw.is_bookmarked = false
    } else {
      await axios.post(route('api.ki.bookmark', kw.id), {
        organization_id: usePage().props.organization.id,
        use_case: 'research'
      })
      kw.is_bookmarked = true
    }
  } catch (err) {
    console.error(err)
  }
}

const predictDecay = async (kw) => {
  mlLoading.value = true
  try {
    const res = await axios.post(route('api.ki.predict-decay', kw.id))
    mlResult.value = res.data.ml_result
    // Update local values
    kw.decay_status = res.data.ml_result.decay_status
    kw.trend_velocity = res.data.ml_result.velocity
    kw.relevance_score = res.data.ml_result.resurgence_probability * 100
  } catch (err) {
    console.error(err)
  } finally {
    mlLoading.value = false
  }
}

onMounted(fetchKeywords)
</script>
