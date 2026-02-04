<template>
  <AppLayout title="Dashboard">
    <div class="space-y-12">
      <!-- Welcome Hero -->
      <div class="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-2xl">
        <!-- Background Orbs -->
        <!-- <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px]"></div> -->
        
        <div class="relative z-10 max-w-3xl">
          <span class="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            Welcome Back
          </span>
          <h1 class="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            Master Your Site's <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Structured Data</span>
          </h1>
          <p class="text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
            Centrally manage, validate, and deploy Schema.org JSON-LD configurations.
          </p>
          <div class="flex flex-wrap gap-4">
            <Link
              href="/schemas/create"
              class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Schema
            </Link>
            <Link
              href="/schemas"
              class="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold transition-standard border border-white/10 active:scale-95"
            >
              Manage Existing
            </Link>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-6">
            <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-standard">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Schemas</span>
          </div>
          <div>
            <p class="text-5xl font-black text-slate-900 tracking-tighter mb-2">{{ stats.totalSchemas }}</p>
            <p class="text-slate-500 font-medium">Currently configured items</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-6">
            <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-standard">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Schema Types</span>
          </div>
          <div>
            <p class="text-5xl font-black text-slate-900 tracking-tighter mb-2">{{ stats.totalTypes }}</p>
            <p class="text-slate-500 font-medium">Available template categories</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group">
          <div class="flex justify-between items-start mb-6">
            <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-standard">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</span>
          </div>
          <div>
            <p class="text-5xl font-black text-slate-900 tracking-tighter mb-2">100%</p>
            <p class="text-slate-500 font-medium">All services operational</p>
          </div>
        </div>
      </div>

      <!-- Recent Content -->
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10">
        <div class="flex justify-between items-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
          <Link href="/schemas" class="text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center gap-2">
            View All
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div class="overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="text-left">
                <th class="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Schema Name</th>
                <th class="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th class="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                <th class="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="schema in recentSchemas" :key="schema.id" class="group transition-standard hover:bg-slate-50/50">
                <td class="py-5">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-standard">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                    </div>
                    <span class="font-bold text-slate-900">{{ schema.name }}</span>
                  </div>
                </td>
                <td class="py-5">
                  <span class="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{{ schema.schema_type.name }}</span>
                </td>
                <td class="py-5 text-sm text-slate-500">
                  {{ formatDate(schema.updated_at) }}
                </td>
                <td class="py-5 text-right">
                  <Link :href="`/schemas/${schema.id}/edit`" class="inline-flex items-center justify-center w-10 h-10 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-standard">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Link>
                </td>
              </tr>
              <tr v-if="recentSchemas.length === 0">
                <td colspan="4" class="py-20 text-center">
                  <div class="flex flex-col items-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p class="text-slate-400 font-medium">No recent activity found. Start building today!</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../Layouts/AppLayout.vue'

defineProps({
  stats: Object,
  recentSchemas: Array
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date)
}
</script>