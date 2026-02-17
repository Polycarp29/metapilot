<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { ref, watch } from 'vue'
import { Head, Link, useForm } from '@inertiajs/vue3'
import axios from 'axios'

const props = defineProps({
  properties: Array
})

const form = useForm({
  analytics_property_id: props.properties[0]?.id || '',
  name: '',
  objective: '',
  target_urls: [],
  keywords: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: ''
})

const isProposing = ref(false)
const rawUrlInput = ref('')

const addUrl = () => {
  if (rawUrlInput.value && !form.target_urls.includes(rawUrlInput.value)) {
    form.target_urls.push(rawUrlInput.value)
    rawUrlInput.value = ''
  }
}

const removeUrl = (index) => {
  form.target_urls.splice(index, 1)
}

const fetchAiProposal = async () => {
  if (!form.analytics_property_id) return
  
  isProposing.value = true
  try {
    const response = await axios.get(route('api.campaigns.propose', { property: form.analytics_property_id }))
    const proposal = response.data
    
    // Auto-fill based on AI suggestion
    // Assuming proposal structure from StrategyService
    if (proposal) {
        form.name = proposal.campaign_name || proposal['Campaign Name'] || ''
        form.objective = proposal.objective || proposal['Primary Objective'] || ''
        
        const urls = proposal.target_urls || proposal['Target URLs'] || []
        if (Array.isArray(urls)) {
            form.target_urls = [...new Set([...form.target_urls, ...urls])]
        }
    }
  } catch (error) {
    console.error('AI Proposal failed:', error)
  } finally {
    isProposing.value = false
  }
}

// Trending Keywords Logic
const rawKeywordInput = ref('')
const trendingSuggestions = ref(null)
const isLoadingTrending = ref(false)
const trendingCounts = ref({})
const walletKeywords = ref([])

const fetchWallet = async () => {
  try {
    const response = await axios.get(route('api.keywords.wallet.index'))
    walletKeywords.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch wallet:', error)
  }
}

const addKeyword = () => {
  if (rawKeywordInput.value && !form.keywords.includes(rawKeywordInput.value)) {
    form.keywords.push(rawKeywordInput.value)
    rawKeywordInput.value = ''
  }
}

const removeKeyword = (index) => {
  form.keywords.splice(index, 1)
}

const addSuggestion = (keyword) => {
  if (!form.keywords.includes(keyword)) {
    form.keywords.push(keyword)
  }
}

const discoverTrending = async () => {
  isLoadingTrending.value = true
  try {
    // 1. Manually trigger a fresh discovery scan
    await axios.post(route('api.trending-keywords.discover'))

    // 2. Fetch the newly discovered suggestions
    const response = await axios.get(route('api.trending-keywords.suggestions', { days_recent: 30 }))
    trendingSuggestions.value = response.data.suggestions
    
    // Calculate counts
    const counts = {}
    Object.values(response.data.suggestions).forEach(geo => {
        Object.keys(geo).forEach(type => {
            counts[type] = (counts[type] || 0) + geo[type].length
        })
    })
    trendingCounts.value = counts
    await fetchWallet()
  } catch (error) {
    console.error('Failed to fetch trending keywords:', error)
  } finally {
    isLoadingTrending.value = false
  }
}

const getStatusColor = (type) => {
    switch(type) {
        case 'high_potential': return 'bg-green-100 text-green-600'
        case 'rising': return 'bg-blue-100 text-blue-600'
        case 'seasonal': return 'bg-purple-100 text-purple-600'
        default: return 'bg-gray-100 text-gray-500'
    }
}

const getGrowthColor = (rate) => {
    if (rate > 50) return 'text-green-600'
    if (rate > 20) return 'text-blue-600'
    return 'text-slate-400'
}

const createCampaign = () => {
  form.post(route('campaigns.store'))
}
</script>

<template>
  <Head title="Start SEO Campaign" />

  <AppLayout>
    <div class="max-w-[1000px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <Link :href="route('campaigns.index')" class="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-4">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
             </svg>
             Back to Campaigns
          </Link>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">Create SEO Campaign</h1>
        </div>

        <button 
            @click="fetchAiProposal" 
            :disabled="isProposing || !form.analytics_property_id"
            class="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
        >
          <span v-if="isProposing" class="animate-spin">🌀</span>
          <span v-else>✨</span>
          {{ isProposing ? 'Analyzing Data...' : 'Get AI Suggestion' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <!-- Property Selection -->
            <div class="space-y-3">
              <label class="block font-bold text-slate-700">Analytics Property</label>
              <select v-model="form.analytics_property_id" class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option v-for="prop in properties" :key="prop.id" :value="prop.id">{{ prop.name }}</option>
              </select>
            </div>

            <!-- Campaign Name -->
            <div class="space-y-3">
              <label class="block font-bold text-slate-700">Campaign Name</label>
              <input v-model="form.name" type="text" placeholder="e.g., Q1 Blog Engagement Boost" class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            </div>

            <!-- Objective -->
            <div class="space-y-3">
              <label class="block font-bold text-slate-700">Primary Objective</label>
              <textarea v-model="form.objective" rows="4" placeholder="What is the goal of this campaign?" class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"></textarea>
            </div>
          </div>

          <!-- Target URLs -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
            <label class="block font-bold text-slate-700">Target URLs</label>
            <div class="flex gap-4">
              <input v-model="rawUrlInput" @keyup.enter="addUrl" type="text" placeholder="https://example.com/page" class="flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
              <button @click="addUrl" class="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors">Add</button>
            </div>

            <div class="flex flex-wrap gap-3">
               <div v-for="(url, index) in form.target_urls" :key="index" class="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100 group">
                  <span class="text-sm font-bold text-slate-600">{{ url }}</span>
                  <button @click="removeUrl(index)" class="text-slate-400 hover:text-red-500 transition-colors">×</button>
               </div>
            </div>
          </div>

          <!-- Trending Keywords -->
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-700">Campaign Keywords</label>
              <button 
                @click="discoverTrending" 
                :disabled="isLoadingTrending"
                class="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
              >
                <span v-if="isLoadingTrending" class="animate-spin">🌀</span>
                <span v-else>🔥</span>
                Discover Trending
              </button>
            </div>

            <!-- Manual Input -->
            <div class="flex gap-4">
              <input v-model="rawKeywordInput" @keyup.enter="addKeyword" type="text" placeholder="Add keyword..." class="flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
              <button @click="addKeyword" class="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors">Add</button>
            </div>

            <!-- Selected Keywords -->
            <div class="flex flex-wrap gap-3">
               <div v-for="(keyword, index) in form.keywords" :key="index" class="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-blue-100 group">
                  <span class="text-sm font-bold text-blue-700">{{ keyword }}</span>
                  <button @click="removeKeyword(index)" class="text-blue-400 hover:text-red-500 transition-colors">×</button>
               </div>
            </div>

            <!-- Trending Suggestions Panel -->
            <div v-if="trendingSuggestions" class="border-t border-slate-100 pt-6 mt-6 space-y-6 animate-fade-in">
              <div class="flex items-center justify-between">
                <h4 class="font-black text-slate-800">Trending Suggestions</h4>
                <div class="flex gap-2">
                  <button 
                    v-for="(count, type) in trendingCounts" 
                    :key="type"
                    class="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                    :class="getStatusColor(type)"
                  >
                    {{ type.replace('_', ' ') }}
                  </button>
                </div>
              </div>

              <!-- Keyword Wallet Section -->
              <div v-if="walletKeywords.length > 0" class="space-y-4">
                <div class="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest">
                  <span class="text-lg">💰</span> My Wallet
                </div>
                <div class="flex flex-wrap gap-2">
                  <button 
                    v-for="kw in walletKeywords" 
                    :key="kw.id"
                    @click="addSuggestion(kw.keyword)"
                    class="bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 transition-all flex items-center gap-2"
                  >
                    <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
                    {{ kw.keyword }}
                  </button>
                </div>
              </div>

              <!-- Grouped by Country -->
              <div v-for="(types, country) in trendingSuggestions" :key="country" class="space-y-4">
                <div class="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest">
                  <span class="text-lg">🌍</span> {{ country }}
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div v-for="(keywords, type) in types" :key="type" class="space-y-2">
                      <h5 class="text-xs font-bold text-slate-400 uppercase">{{ type.replace('_', ' ') }}</h5>
                      <div class="space-y-2">
                        <button 
                          v-for="kw in keywords" 
                          :key="kw.id"
                          @click="addSuggestion(kw.keyword)"
                          class="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-3 rounded-xl transition-all group flex items-center justify-between"
                        >
                          <span class="font-bold text-slate-700 group-hover:text-indigo-700">{{ kw.keyword }}</span>
                          <span class="text-xs font-bold" :class="getGrowthColor(kw.growth_rate)">
                            +{{ kw.growth_rate }}%
                          </span>
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Dates -->
        <div class="space-y-8">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
              <div class="space-y-3">
                <label class="block font-bold text-slate-700 text-sm italic">Status</label>
                <div class="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-center uppercase tracking-widest text-xs">
                  Draft
                </div>
              </div>

              <div class="space-y-3">
                <label class="block font-bold text-slate-700">Start Date</label>
                <input v-model="form.start_date" type="date" class="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700" />
              </div>

              <div class="space-y-3">
                <label class="block font-bold text-slate-700">End Date (Optional)</label>
                <input v-model="form.end_date" type="date" class="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700" />
              </div>

              <button 
                @click="createCampaign" 
                :disabled="form.processing"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {{ form.processing ? 'Saving...' : 'Launch Campaign' }}
              </button>
            </div>

            <div class="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
               <h4 class="font-black text-xl">Strategy Tip</h4>
               <p class="text-indigo-100 text-sm leading-relaxed">AI suggestions analyze your actual GA4 traffic to find pages with high impressions but low click-through rates. These are your biggest opportunities.</p>
            </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
}
</style>
