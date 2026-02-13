<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { Head, Link } from '@inertiajs/vue3'
import axios from 'axios'

const props = defineProps({
  campaign: Object
})

const performance = ref(null)
const isLoading = ref(true)

const fetchPerformance = async () => {
    try {
        const response = await axios.get(route('api.campaigns.performance', { campaign: props.campaign.id }))
        performance.value = response.data
    } catch (error) {
        console.error('Failed to fetch performance:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchPerformance()
})

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'draft': return 'bg-slate-100 text-slate-600'
    case 'paused': return 'bg-amber-100 text-amber-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>

<template>
  <Head :title="campaign.name" />

  <AppLayout>
    <div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <Link :href="route('campaigns.index')" class="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-4">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
             </svg>
             Back to Campaigns
          </Link>
          <div class="flex items-center gap-4">
            <h1 class="text-4xl font-black text-slate-900 tracking-tight">{{ campaign.name }}</h1>
            <span :class="['px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest', getStatusColor(campaign.status)]">
                {{ campaign.status }}
            </span>
          </div>
          <p class="text-slate-500 font-medium italic">"{{ campaign.objective }}"</p>
        </div>

        <div class="flex items-center gap-4">
          <button class="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all">
             Edit Campaign
          </button>
          <button class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
             Generate Report
          </button>
        </div>
      </div>

      <!-- Impact Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users (Targeted)</p>
            <div class="flex items-end gap-3">
              <span v-if="isLoading" class="text-3xl font-black text-slate-200 animate-pulse">---</span>
              <span v-else class="text-4xl font-black text-slate-900">{{ performance?.total_users || 0 }}</span>
            </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
            <div class="flex items-end gap-3">
              <span v-if="isLoading" class="text-3xl font-black text-slate-200 animate-pulse">---</span>
              <span v-else class="text-4xl font-black text-slate-900">{{ performance?.total_sessions || 0 }}</span>
            </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Conversions</p>
            <div class="flex items-end gap-3">
              <span v-if="isLoading" class="text-3xl font-black text-slate-200 animate-pulse">---</span>
              <span v-else class="text-4xl font-black text-slate-900">{{ performance?.total_conversions || 0 }}</span>
            </div>
        </div>
      </div>

      <!-- URL Breakdown -->
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div class="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 class="text-xl font-bold text-slate-900">Target URL Performance</h3>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregate across active period</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Page URL</th>
                <th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Users</th>
                <th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Sessions</th>
                <th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Conversions</th>
              </tr>
            </thead>
            <tbody v-if="!isLoading && performance?.url_breakdown">
              <tr v-for="(metrics, url) in performance.url_breakdown" :key="url" class="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                <td class="px-8 py-6">
                  <span class="text-slate-900 font-bold truncate block max-w-md">{{ url }}</span>
                </td>
                <td class="px-8 py-6 text-right font-bold text-slate-700">{{ metrics.users }}</td>
                <td class="px-8 py-6 text-right font-bold text-slate-700">{{ metrics.sessions }}</td>
                <td class="px-8 py-6 text-right font-bold text-blue-600">{{ metrics.conversions }}</td>
              </tr>
            </tbody>
            <tbody v-else-if="isLoading">
              <tr v-for="i in 3" :key="i" class="border-t border-slate-50">
                <td class="px-8 py-6"><div class="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div></td>
                <td class="px-8 py-6 text-right"><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse"></div></td>
                <td class="px-8 py-6 text-right"><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse"></div></td>
                <td class="px-8 py-6 text-right"><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse"></div></td>
              </tr>
            </tbody>
          </table>
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
