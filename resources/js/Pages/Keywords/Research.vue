<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto py-20 text-center">
      <div class="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.711 2.489a2 2 0 00.759 2.222l1.96 1.414a2 2 0 002.394 0l1.96-1.414a2 2 0 00.759-2.222l-.711-2.489a2 2 0 00-1.96-1.414l-2.387.477a2 2 0 00-1.022.547z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2 2m-2-2v6m7-10V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9z" />
        </svg>
      </div>
      
      <h1 class="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Keyword Research</h1>
      <p class="text-xl text-slate-500 max-w-2xl mx-auto mb-12">
        We are building a powerful AI-driven keyword research engine to help you discover untapped search volumes and competitor strategies.
      </p>

      <div class="inline-flex items-center px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-2xl shadow-slate-500/40">
        <span class="mr-3">🚀 Coming Soon</span>
      </div>

      <div class="mt-20 grid md:grid-cols-3 gap-8 text-left">
        <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 mb-2">Volume Analysis</h3>
          <p class="text-sm text-slate-500">Get precise monthly search volume and difficulty scores for any keyword.</p>
        </div>
        
        <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 mb-2">Competitor Gaps</h3>
          <p class="text-sm text-slate-500">Find the keywords your competitors rank for, but you don't.</p>
        </div>

        <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div class="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 class="font-bold text-slate-900 mb-2">AI Intent Detection</h3>
          <p class="text-sm text-slate-500">Our AI will automatically categorize keywords by buyer intent.</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../../Layouts/AppLayout.vue'
</script>
