<template>
  <AppLayout>
    <div class="max-w-[1440px] mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Keyword Insights</h1>
          <p class="text-slate-500 font-medium">Discover trending topics in your niche and save them for your next campaign.</p>
        </div>
        
          <button 
            @click="activeTab = 'trends'"
            class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            :class="activeTab === 'trends' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            🔥 Trends
          </button>
          <Link 
            :href="route('keywords.intelligence')"
            class="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-all duration-200"
          >
            🧠 Intelligence
          </Link>
          <button 
            @click="activeTab = 'bookmarks'"
            class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2"
            :class="activeTab === 'bookmarks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Bookmarks
          </button>
          <Link 
            :href="route('keywords.research')"
            class="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-all duration-200"
          >
            🔍 Research
          </Link>
      </div>

      <!-- Trends Tab -->
      <div v-if="activeTab === 'trends'" class="space-y-8">
        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-4">
          <button 
            @click="runDiscovery"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {{ loading ? 'Running Smart Discovery...' : 'Scan for Trends' }}
          </button>
        </div>

        <div v-if="keywords.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="kw in keywords" 
            :key="kw.id"
            class="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden"
          >
            <!-- Badge -->
            <div class="flex items-center justify-between mb-4">
              <span 
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                :class="{
                  'bg-rose-100 text-rose-600': kw.recommendation_type === 'high_potential',
                  'bg-amber-100 text-amber-600': kw.recommendation_type === 'rising',
                  'bg-blue-100 text-blue-600': kw.recommendation_type === 'seasonal'
                }"
              >
                {{ kw.recommendation_type.replace('_', ' ') }}
              </span>
              <span class="text-slate-400 text-xs font-bold flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {{ kw.country_code }}
              </span>
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{{ kw.keyword }}</h3>
            
            <div class="flex items-end justify-between mt-6">
              <div>
                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Growth Forecast</p>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-black text-slate-900">+{{ Math.round(kw.growth_rate) }}%</span>
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
              </div>
              
              <button 
                @click="saveToBookmark(kw)"
                class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white group/btn"
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

        <!-- Empty State -->
        <div v-else-if="!loading" class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">No Keywords Discovered Yet</h3>
          <p class="text-slate-500 max-w-sm mx-auto mb-8">Click the scan button to start identifying trending topics for your niche.</p>
          <button @click="runDiscovery" class="text-blue-600 font-bold hover:underline">Run Smart Scan →</button>
        </div>
      </div>

      <!-- Bookmarks Tab -->
      <div v-if="activeTab === 'bookmarks'">
        <div v-if="bookmarkItems.length > 0" class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Keyword</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Source</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Intelligence</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Velocity</th>
                <th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="item in bookmarkItems" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-6">
                  <span class="font-extrabold text-slate-900 text-lg">{{ item.keyword }}</span>
                </td>
                <td class="px-8 py-6">
                  <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">{{ item.source }}</span>
                </td>
                <td class="px-8 py-6">
                  <div v-if="item.intelligence" class="flex items-center gap-2">
                    <span 
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-emerald-500': item.intelligence.decay_status === 'rising',
                        'bg-blue-500': item.intelligence.decay_status === 'stable',
                        'bg-rose-500': item.intelligence.decay_status === 'decaying',
                        'bg-slate-300': item.intelligence.decay_status === 'dormant',
                        'bg-purple-500': item.intelligence.decay_status === 'resurgent'
                      }"
                    ></span>
                    <span class="text-xs font-bold text-slate-700 capitalize">{{ item.intelligence.decay_status }}</span>
                  </div>
                  <span v-else class="text-xs text-slate-400 font-medium italic">Pending Analysis</span>
                </td>
                <td class="px-8 py-6">
                  <div v-if="item.intelligence" class="flex items-center gap-2">
                    <span :class="item.intelligence.trend_velocity >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="text-xs font-black">
                      {{ item.intelligence.trend_velocity >= 0 ? '+' : '' }}{{ Math.round(item.intelligence.trend_velocity) }}%
                    </span>
                    <svg class="w-3 h-3" :class="item.intelligence.trend_velocity >= 0 ? 'text-emerald-500' : 'text-rose-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="item.intelligence.trend_velocity >= 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="px-8 py-6 text-right">
                  <button 
                    @click="removeFromBookmarks(item.id)"
                    class="text-rose-500 hover:text-rose-700 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">No Bookmarks Yet</h3>
          <p class="text-slate-500 max-w-sm mx-auto">Saved keywords from your trending hub will appear here for future campaigns.</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { Link, Head } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import axios from 'axios'

const activeTab = ref('trends')
const loading = ref(false)
const keywords = ref([])
const bookmarkItems = ref([])
const savingId = ref(null)

const runDiscovery = async () => {
  loading.value = true
  try {
    await axios.post(route('api.trending-keywords.discover'))
    await fetchTrends()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchTrends = async () => {
  loading.value = true
  try {
    const res = await axios.get(route('api.trending-keywords.index'))
    keywords.value = res.data.keywords
    return res.data.keywords
  } catch (err) {
    console.error(err)
    return []
  } finally {
    loading.value = false
  }
}

const fetchBookmarks = async () => {
  try {
    const res = await axios.get(route('api.keywords.wallet.index'))
    bookmarkItems.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const saveToBookmark = async (kw) => {
  savingId.value = kw.id
  try {
    await axios.post(route('api.keywords.wallet.store'), {
      keyword: kw.keyword,
      source: 'trending',
      metadata: {
        country: kw.country_code,
        growth: kw.growth_rate,
        type: kw.recommendation_type
      }
    })
    fetchBookmarks()
    // Optional: Toast notification
  } catch (err) {
    console.error(err)
  } finally {
    savingId.value = null
  }
}

const removeFromBookmarks = async (id) => {
  if (!confirm('Remove this keyword from your bookmarks?')) return
  try {
    await axios.delete(route('api.keywords.wallet.destroy', id))
    fetchBookmarks()
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  const existing = await fetchTrends()
  fetchBookmarks()
  
  // Auto-scout if empty
  if (!existing || existing.length === 0) {
    runDiscovery()
  }
})
</script>
