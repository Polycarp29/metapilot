<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { Head, Link } from '@inertiajs/vue3'

const props = defineProps({
  campaigns: Array
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
  <Head title="SEO Campaigns" />

  <AppLayout>
    <div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">SEO Campaigns</h1>
          <p class="text-slate-500 mt-2 font-medium">Strategic efforts to boost your property's performance</p>
        </div>

        <Link
          :href="route('campaigns.create')"
          class="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Start New Campaign</span>
        </Link>
      </div>

      <!-- Campaign List -->
      <div v-if="campaigns.length" class="grid grid-cols-1 gap-6">
        <Link 
          v-for="campaign in campaigns" 
          :key="campaign.id" 
          :href="route('campaigns.show', { campaign: campaign.id })"
          class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', getStatusColor(campaign.status)]">
                {{ campaign.status }}
              </span>
              <span class="text-slate-400 font-medium text-sm">{{ campaign.property?.name }}</span>
            </div>
            <h3 class="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{{ campaign.name }}</h3>
            <p class="text-slate-500 max-w-2xl line-clamp-2 italic">"{{ campaign.objective }}"</p>
          </div>

          <div class="flex items-center gap-4">
             <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Target URLs</p>
                <p class="text-lg font-black text-slate-900">{{ campaign.target_urls?.length || 0 }}</p>
             </div>
             <div class="w-px h-10 bg-slate-100 hidden sm:block"></div>
             <div class="bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-6 py-3 rounded-xl font-bold transition-all">
                View Impact
             </div>
          </div>
        </Link>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-premium">
         <div class="text-6xl mb-6">🎯</div>
         <h2 class="text-2xl font-bold text-slate-900">No Campaigns Yet</h2>
         <p class="text-slate-500 mt-2 max-w-md mx-auto">Create a campaign to start tracking specific SEO goals like "Improve Blog Traffic" or "Boost Form Conversions".</p>
         <Link :href="route('campaigns.create')" class="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Create Your First Campaign
         </Link>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.shadow-premium {
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
}
</style>
