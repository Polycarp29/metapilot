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
              <button @click="addUrl" class="bg-slate-900 text-white px-8 rounded-2xl font-bold">Add</button>
            </div>

            <div class="flex flex-wrap gap-3">
               <div v-for="(url, index) in form.target_urls" :key="index" class="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100 group">
                  <span class="text-sm font-bold text-slate-600">{{ url }}</span>
                  <button @click="removeUrl(index)" class="text-slate-400 hover:text-red-500 transition-colors">×</button>
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
