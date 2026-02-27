<template>
  <AppLayout title="Keyword Insights">
    <div class="max-w-[1440px] mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Keyword Insights</h1>
          <p class="text-slate-500 font-medium">Discover trending topics in your niche and save them for your next campaign.</p>
        </div>
        <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit">
          <button 
            @click="activeTab = 'trends'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'trends' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Smart Trends
          </button>
          
          <button 
            @click="activeTab = 'global'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
            Global Discovery
          </button>

          <button 
            @click="activeTab = 'bookmarks'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'bookmarks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Bookmarks
          </button>

          <div class="w-px h-4 bg-slate-200 mx-1"></div>

          <Link 
            :href="route('keywords.intelligence')"
            class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Intelligence
          </Link>
        </div>
      </div>

      <!-- Trends Tab (Organization Specific) -->
      <div v-if="activeTab === 'trends'" class="space-y-8 animate-in fade-in duration-500">
        <div class="flex flex-wrap items-center gap-4">
          <button 
            @click="runDiscovery"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {{ loading ? 'Running Smart Discovery...' : 'Scan Organization Trends' }}
          </button>
        </div>

        <div v-if="keywords.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="kw in keywords" 
            :key="kw.id"
            class="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all duration-300 relative overflow-hidden shadow-sm"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{{ kw.recommendation_type.replace('_', ' ') }}</span>
              <span class="text-slate-400 text-xs font-bold">{{ kw.country_code }}</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{{ kw.keyword }}</h3>
            <div class="flex items-end justify-between mt-6">
              <div>
                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Growth</p>
                <span class="text-2xl font-black text-slate-900">+{{ Math.round(kw.growth_rate) }}%</span>
              </div>
              <button 
                @click="saveToBookmark(kw)"
                class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white"
                :disabled="savingId === kw.id"
              >
                <svg v-if="savingId === kw.id" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Global Discovery Tab -->
      <div v-if="activeTab === 'global'" class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <!-- Advanced Filters -->
        <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div class="relative w-full sm:w-80">
              <input 
                v-model="filters.search"
                @input="fetchGlobalIntelligence"
                type="text" 
                placeholder="Search global intelligence pool..."
                class="w-full bg-slate-50 border-none rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
              <svg class="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <select 
              v-model="filters.geo"
              @change="fetchGlobalIntelligence"
              class="w-full sm:w-auto bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="KE">Kenya (KE)</option>
              <option value="US">USA (US)</option>
              <option value="GLOBAL">Worldwide Hub</option>
            </select>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full xl:w-auto">
            <button 
              @click="filters.niche = ''; fetchGlobalIntelligence()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              :class="filters.niche === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
            >
              All Segments
            </button>
            <button 
              v-for="niche in industries"
              :key="niche"
              @click="filters.niche = niche; fetchGlobalIntelligence()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              :class="filters.niche === niche ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
            >
              {{ niche }}
            </button>
          </div>
        </div>

        <!-- Global Grid -->
        <div v-if="globalKeywords.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="kw in globalKeywords" 
            :key="kw.id"
            class="bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all group shadow-sm flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">{{ kw.category || 'Discovery' }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full" :class="kw.decay_status === 'rising' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{ kw.decay_status }}</span>
                </div>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-2 leading-tight">{{ kw.keyword }}</h3>
            </div>
            
            <div class="flex items-center justify-between pt-6 border-t border-slate-50">
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">System Score</span>
                <span class="text-xl font-black text-slate-900 block">{{ Math.round(kw.global_score) }}</span>
              </div>
              
              <button 
                @click="saveToBookmark(kw, true)"
                class="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                :class="kw.is_bookmarked ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white'"
                :disabled="savingId === kw.id || kw.is_bookmarked"
              >
                <svg v-if="savingId === kw.id" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" :fill="kw.is_bookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <p class="text-slate-400 font-medium">No results found for current filters.</p>
        </div>
      </div>

      <!-- Bookmarks Tab -->
      <div v-if="activeTab === 'bookmarks'" class="animate-in fade-in duration-500">
        <div v-if="bookmarkItems.length > 0" class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Keyword</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Source</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Status</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="item in bookmarkItems" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-6"><span class="font-bold text-slate-900">{{ item.keyword }}</span></td>
                <td class="px-8 py-6"><span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{{ item.source }}</span></td>
                <td class="px-8 py-6">
                  <div v-if="item.intelligence" class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full" :class="item.intelligence.decay_status === 'rising' ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                    <span class="text-xs font-bold text-slate-700 capitalize">{{ item.intelligence.decay_status }}</span>
                  </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <button @click="removeFromBookmarks(item.id)" class="text-rose-500 hover:text-rose-700 font-bold text-xs">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <h3 class="text-xl font-bold text-slate-900 mb-2">Empty Library</h3>
          <p class="text-slate-500">Discover and save keywords to build your strategy.</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import axios from 'axios'

const page = usePage()
const activeTab = ref('trends')
const loading = ref(false)
const keywords = ref([])
const globalKeywords = ref([])
const industries = ref(['Real Estate', 'Betting', 'Tech', 'Health', 'Finance'])
const bookmarkItems = ref([])
const savingId = ref(null)

const filters = ref({
    geo: 'KE',
    niche: '',
    search: ''
})

// Current organization shorthand
const currentOrg = computed(() => page.props.auth.user.current_organization || page.props.auth.user.organizations?.[0])

const runDiscovery = async () => {
    loading.value = true
    try {
        await axios.post(route('api.trending-keywords.discover'))
        await fetchTrends()
    } catch (err) {
        console.error("Discovery failed", err)
    } finally {
        loading.value = false
    }
}

const fetchTrends = async () => {
    loading.value = true
    try {
        const res = await axios.get(route('api.trending-keywords.index'))
        keywords.value = res.data.keywords
    } catch (err) {
        console.error("Failed to fetch trends", err)
    } finally {
        loading.value = false
    }
}

const fetchGlobalIntelligence = async () => {
    loading.value = true
    try {
        const res = await axios.get(route('api.ki.index'), {
            params: {
                region: filters.value.geo === 'GLOBAL' ? '' : filters.value.geo,
                niche: filters.value.niche,
                search: filters.value.search
            }
        })
        globalKeywords.value = res.data.data
    } catch (err) {
        console.error("Failed to fetch global intelligence", err)
    } finally {
        loading.value = false
    }
}

const fetchBookmarks = async () => {
    try {
        const res = await axios.get(route('api.keywords.wallet.index'))
        bookmarkItems.value = res.data.data
    } catch (err) {
        console.error("Failed to fetch bookmarks", err)
    }
}

const saveToBookmark = async (kw, isGlobal = false) => {
    savingId.value = kw.id
    try {
        if (isGlobal) {
            await axios.post(route('api.ki.bookmark', kw.id), {
                organization_id: currentOrg.value.id,
                use_case: 'research'
            })
            kw.is_bookmarked = true
        } else {
            await axios.post(route('api.keywords.wallet.store'), {
                keyword: kw.keyword,
                source: 'trending',
                metadata: {
                    country: kw.country_code,
                    growth: kw.growth_rate,
                    type: kw.recommendation_type
                }
            })
        }
        await fetchBookmarks()
    } catch (err) {
        console.error("Save failed", err)
    } finally {
        savingId.value = null
    }
}

const removeFromBookmarks = async (id) => {
    if (!confirm('Remove this keyword?')) return
    try {
        await axios.delete(route('api.keywords.wallet.destroy', id))
        await fetchBookmarks()
    } catch (err) {
        console.error("Delete failed", err)
    }
}

// Watchers for tab switching
watch(activeTab, (newTab) => {
    if (newTab === 'global' && globalKeywords.value.length === 0) {
        fetchGlobalIntelligence()
    }
    if (newTab === 'bookmarks') {
        fetchBookmarks()
    }
})

onMounted(async () => {
    await fetchTrends()
    await fetchBookmarks()
    
    if (keywords.value.length === 0) {
        runDiscovery()
    }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>
