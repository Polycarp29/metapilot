<template>
  <AppLayout :title="sitemap ? 'Manage: ' + sitemap.name : 'Sitemap Intelligence'">
    <div v-if="sitemap" class="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-8 py-10 relative">
      <!-- Breadcrumb & Actions -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div class="flex items-center gap-6">
          <Link href="/sitemaps" class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-standard">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
             <h1 class="text-3xl font-black text-slate-900 tracking-tight">{{ sitemap.name }}</h1>
             <p class="text-slate-500 font-medium text-sm mt-1">Stored as <code>/{{ sitemap.filename }}</code></p>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <!-- Management Group -->
           <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
             <button 
               @click="showRecrawlModal = true"
               :disabled="crawling"
               class="h-10 bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-50"
             >
               <svg class="w-3 h-3" :class="{'animate-spin': crawling}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               Recrawl
             </button>
             <a
               v-if="links.total > 0"
               :href="route('sitemaps.export', sitemap.id)"
               class="h-10 bg-white hover:bg-emerald-50 text-emerald-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-emerald-200"
               title="Export CSV"
             >
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               CSV
             </a>
             <a
               v-if="links.total > 0"
               :href="route('sitemaps.export-pdf', sitemap.id)"
               class="h-10 bg-white hover:bg-rose-50 text-rose-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-rose-200"
               title="Export PDF"
             >
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
               PDF
             </a>
             <button 
               @click="deleteSitemap"
               class="h-10 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 border border-slate-200 hover:border-red-200"
               title="Delete Container"
             >
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </button>
           </div>

           <!-- Primary Actions Group -->
           <div class="flex items-center gap-2">
             <button 
               @click="openLiveConsole"
               v-if="crawling || sitemap.last_crawl_status === 'dispatched' || sitemap.last_crawl_status === 'crawling'"
               class="h-12 bg-blue-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard flex items-center gap-3 shadow-xl shadow-blue-200"
             >
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Console
             </button>
             <button 
               type="button"
               @click.stop="triggerCrawl"
               :disabled="crawling"
               class="h-12 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl shadow-indigo-200 disabled:opacity-50"
             >
               {{ crawling ? 'Scanning...' : 'Start Scan' }}
             </button>
             <button 
               @click="generateXml"
               :disabled="generating"
               class="h-12 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl"
             >
               {{ generating ? 'Building...' : 'Build XML' }}
             </button>
           </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <!-- Sidebar Widgets -->
        <div class="space-y-8">
          <!-- Bulk Import Card -->
          <div class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium">
            <h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
              Bulk Data
              <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] lowercase">csv import</span>
            </h4>
            
            <form @submit.prevent="importLinks" class="space-y-6">
              <div class="group relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-standard">
                <input type="file" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv,.txt,.xml" />
                <div class="space-y-2">
                  <svg class="w-8 h-8 text-slate-300 mx-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ selectedFile ? selectedFile.name : 'Choose CSV' }}</p>
                </div>
              </div>
              <button 
                type="submit" 
                :disabled="importing || !selectedFile"
                class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black transition-standard active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {{ importing ? 'Syncing...' : 'Sync Links' }}
              </button>
            </form>
          </div>

          <!-- Duplicate Warning -->
          <div v-if="duplicateCount > 0" class="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8">
            <div class="flex items-center gap-4 mb-4">
               <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
               </div>
               <h4 class="text-sm font-black text-amber-900 uppercase tracking-widest leading-tight">Optimization Alert</h4>
            </div>
            <p class="text-amber-800 text-xs font-medium leading-relaxed">We detected <strong>{{ duplicateCount }} duplicate URLs</strong> present in other sitemaps. Auto-canonical tags will be prioritized for these links.</p>
          </div>

          <!-- Crawl Activity Widget -->
          <div v-if="crawling || crawlProgress.status !== 'pending'" class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center">
                Crawl Activity
                <span v-if="crawling" class="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
             </h4>
             <div class="space-y-4">
                <div class="flex justify-between items-end">
                   <span class="text-[10px] font-bold text-slate-500 uppercase">Progress</span>
                   <span class="text-xs font-black text-slate-900">{{ Math.round((crawlProgress.total_crawled / (crawlProgress.total_discovered || 1)) * 100) }}%</span>
                </div>
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div class="h-full bg-blue-600 transition-all duration-500" :style="{ width: `${(crawlProgress.total_crawled / (crawlProgress.total_discovered || 1)) * 100}%` }"></div>
                </div>
                <div class="pt-2">
                   <p class="text-[9px] font-medium text-slate-400 truncate">{{ crawlProgress.current_url || 'Waiting...' }}</p>
                </div>
                <button v-if="crawlProgress.status === 'completed'" @click="router.reload()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-colors">
                   Refresh List
                </button>
             </div>
          </div>

          <!-- Quick Add Link -->
          <div class="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
             <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Internal Addition</h4>
             <form @submit.prevent="addSingleLink" class="space-y-4">
                <input v-model="linkForm.url" type="url" placeholder="https://..." class="w-full bg-white/10 border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard" required />
                <div class="grid grid-cols-2 gap-3">
                   <select v-model="linkForm.changefreq" class="bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-widest appearance-none focus:bg-white focus:text-slate-900 transition-standard">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                   </select>
                   <input v-model="linkForm.priority" type="number" step="0.1" min="0" max="1" class="bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard" placeholder="0.5" />
                </div>
                <button type="submit" class="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-standard active:scale-95 shadow-lg shadow-blue-900/40 mt-2">
                   Add Link
                </button>
             </form>
          </div>
        </div>

        <!-- Links Table -->
        <div 
          :class="[
            'lg:col-span-3 space-y-6 transition-all duration-500',
            isFullScreen ? 'fixed inset-0 z-[100] bg-slate-50 p-8 overflow-y-auto' : ''
          ]"
        >
           <!-- Table Search & Filter Bar -->
           <div class="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div class="relative flex-grow w-full">
               <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                 <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
               </div>
               <input 
                 v-model="searchQuery" 
                 type="text" 
                 placeholder="Search URLs or page titles..." 
                 class="block w-full pl-12 pr-4 h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:bg-white focus:border-indigo-300 transition-standard"
               />
             </div>

             <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button 
                    v-for="filter in ['all', 'good', 'issues', 'redirects', 'discovered']" 
                    :key="filter"
                    @click="currentFilter = filter"
                    :class="[
                      'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                      currentFilter === filter ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                    ]"
                  >
                    {{ filter }}
                  </button>
                </div>

                <button 
                  @click="isFullScreen = !isFullScreen"
                  :class="[
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-standard active:scale-95 border',
                    isFullScreen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                  ]"
                  :title="isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'"
                >
                  <svg v-if="!isFullScreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
             </div>
           </div>

           <!-- Stats Filter Bar (Compact & Polished) -->
           <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <button 
                v-for="filter in ['all', 'good', 'issues', 'redirects', 'discovered']"
                :key="'card-'+filter"
                @click="currentFilter = filter"
                :class="[
                  'p-5 rounded-2xl border flex flex-col gap-3 transition-all text-left group relative overflow-hidden',
                  currentFilter === filter ? 
                    (filter === 'good' ? 'bg-emerald-600 border-emerald-600 shadow-lg text-white' : 
                     filter === 'issues' ? 'bg-amber-500 border-amber-500 shadow-lg text-white' :
                     filter === 'redirects' ? 'bg-indigo-600 border-indigo-600 shadow-lg text-white' :
                     filter === 'discovered' ? 'bg-blue-600 border-blue-600 shadow-lg text-white' :
                     'bg-slate-900 border-slate-900 shadow-lg text-white') : 
                    'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                ]"
              >
                 <div class="flex items-center justify-between w-full">
                    <span :class="['text-[9px] font-black uppercase tracking-[0.2em]', currentFilter === filter ? 'opacity-70' : 'text-slate-400']">
                      {{ filter === 'redirects' ? 'Non-Canonical' : (filter === 'good' ? 'Indexable' : filter) }}
                    </span>
                    <div :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-colors', currentFilter === filter ? 'bg-white/20' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100']">
                      <svg v-if="filter === 'all'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      <svg v-if="filter === 'good'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <svg v-if="filter === 'issues'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <svg v-if="filter === 'redirects'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <svg v-if="filter === 'discovered'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                 </div>
                 <div class="text-2xl font-black tracking-tight leading-none">{{ stats[filter] }}</div>
              </button>
           </div>

           <!-- Table Container -->
           <div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
             <div class="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
               <table class="w-full text-left border-collapse">
                 <thead class="sticky top-0 z-10 bg-slate-50 shadow-sm">
                   <tr class="bg-slate-50 border-b border-slate-100">
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live URL Intelligence</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Audit Score</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">SEO Health</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Freq</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Priority</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-50">
                    <tr v-if="filteredLinks.length === 0" class="bg-white">
                      <td colspan="6" class="px-8 py-20 text-center">
                        <div class="space-y-4">
                           <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                           </div>
                           <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">No links found for this filter.</p>
                           <button @click="currentFilter = 'all'" class="text-xs font-black text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]">Reset All Filters</button>
                        </div>
                      </td>
                    </tr>
                   <tr v-for="link in filteredLinks" :key="link.id" class="group hover:bg-slate-50/50 transition-colors">
                     <td class="px-8 py-5">
                       <div class="flex items-center gap-3">
                         <div :class="[
                           'w-2 h-2 rounded-full flex-shrink-0',
                           link.status === 'completed' ? 'bg-emerald-500' : 
                           link.status === 'crawling' ? 'bg-blue-500 animate-pulse' :
                           link.status === 'discovered' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'
                         ]"></div>
                         <div class="flex flex-col min-w-0">
                           <span class="text-sm font-bold text-slate-900 tracking-tight truncate">{{ link.url }}</span>
                           <div class="flex items-center gap-2">
                             <span v-if="link.title" class="text-[9px] font-medium text-slate-400 line-clamp-1">{{ link.title }}</span>
                             <span v-if="link.status === 'discovered'" class="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Discovered</span>
                             <span v-if="link.is_canonical === false && link.status === 'completed'" class="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase" :title="'Points to: ' + link.canonical_url">Non-Canonical</span>
                             <span v-if="link.http_status && link.http_status >= 300" class="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Redirect {{ link.http_status }}</span>
                             <span v-if="link.depth_from_root > 0" class="text-[8px] font-bold text-slate-400">Depth {{ link.depth_from_root }}</span>
                           </div>
                         </div>
                       </div>
                     </td>
                     <td class="px-8 py-5 text-center">
                       <div v-if="link.seo_audit" :class="[
                         'inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-black border-4',
                         link.seo_audit.score >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                         link.seo_audit.score >= 70 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                         'text-red-600 bg-red-50 border-red-100'
                       ]">
                         {{ link.seo_audit.score }}
                       </div>
                       <span v-else class="text-[10px] font-bold text-slate-300">--</span>
                     </td>
                     <td class="px-8 py-5 text-center">
                       <div v-if="link.url_slug_quality" class="flex flex-col items-center gap-1">
                         <span :class="[
                           'inline-block w-3 h-3 rounded-full',
                           link.url_slug_quality === 'good' ? 'bg-emerald-400' :
                           link.url_slug_quality === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                         ]"></span>
                         <span :class="[
                           'text-[8px] font-black uppercase tracking-wider',
                           link.url_slug_quality === 'good' ? 'text-emerald-600' :
                           link.url_slug_quality === 'warning' ? 'text-amber-600' : 'text-red-600'
                         ]">{{ link.url_slug_quality }}</span>
                         <div v-if="link.seo_bottlenecks && link.seo_bottlenecks.length" class="group/tip relative">
                           <span class="text-[8px] font-bold text-slate-400 cursor-help underline decoration-dotted">{{ link.seo_bottlenecks.length }} issue{{ link.seo_bottlenecks.length > 1 ? 's' : '' }}</span>
                           <div class="hidden group-hover/tip:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white p-3 rounded-xl text-[9px] font-medium z-50 shadow-xl">
                             <div v-for="(b, bi) in link.seo_bottlenecks" :key="bi" class="py-1 border-b border-slate-700 last:border-0">
                               {{ b.message }}
                             </div>
                           </div>
                         </div>
                       </div>
                       <span v-else class="text-[10px] font-bold text-slate-300">--</span>
                     </td>
                     <td class="px-8 py-5 text-center">
                       <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{{ link.changefreq }}</span>
                     </td>
                     <td class="px-8 py-5 text-center">
                        <div class="w-12 mx-auto bg-slate-100 rounded-lg py-1 text-[11px] font-bold text-slate-600">
                          {{ link.priority }}
                        </div>
                     </td>
                     <td class="px-8 py-5 text-right">
                       <div class="flex items-center justify-end gap-1">
                         <button 
                           @click="analyzeLink(link)"
                           class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard"
                           title="Analyze Link Results"
                         >
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                           </svg>
                         </button>
                          <button 
                            @click="analyzeAi(link)"
                            :class="[
                              'p-2 rounded-xl transition-standard group/ai',
                              link.ai_schema_data ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            ]"
                            :title="link.ai_schema_data ? 'AI Data Ready' : 'AI Content Analysis'"
                          >
                            <svg class="w-4 h-4" :class="{'animate-pulse': !link.ai_schema_data && analysisLink === link.id}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </button>
                          <button 
                            @click="recrawlLink(link)"
                            class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-standard"
                            title="Recrawl Individual Link"
                          >
                            <svg class="w-4 h-4" :class="{'animate-spin-slow': link.status === 'crawling'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                         <button 
                           @click="editLink(link)"
                           class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard"
                           title="Edit Link"
                         >
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                           </svg>
                         </button>
                         <button 
                           @click="deleteLink(link)"
                           class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard"
                           title="Remove Link"
                         >
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                         <span class="text-[10px] font-bold text-slate-400 ml-2">{{ new Date(link.created_at).toLocaleDateString() }}</span>
                       </div>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
             
             <!-- Pagination -->
             <div class="px-8 py-8 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {{ links.current_page }} of {{ links.last_page }}</p>
                <div class="flex items-center gap-2">
                   <Link 
                     v-for="pLink in links.links" 
                     :key="pLink.label"
                     :href="pLink.url || '#'"
                     :class="[
                       'w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-standard',
                       pLink.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'
                     ]"
                     v-html="pLink.label"
                   ></Link>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Edit Link Modal -->
    <div v-if="showEditLinkModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center">
        <button @click="closeEditModal" class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight">Edit Link</h2>
        
        <form @submit.prevent="updateLink" class="space-y-8">
          <div class="space-y-3">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">URL</label>
            <input v-model="editLinkForm.url" type="url" placeholder="https://..." class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required />
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-3">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Change Frequency</label>
              <select v-model="editLinkForm.changefreq" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold appearance-none">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="space-y-3">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Priority</label>
              <input v-model="editLinkForm.priority" type="number" step="0.1" min="0" max="1" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" />
            </div>
          </div>

          <button :disabled="editLinkForm.processing" type="submit" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4">
            Save Link
          </button>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Link Modal -->
    <div v-if="showDeleteLinkModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
        <div class="flex flex-col items-center text-center space-y-6">
          <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-900 mb-2">Remove Link?</h2>
            <p class="text-slate-500 font-medium px-4">This will remove <span class="text-slate-900 font-bold break-all">{{ linkToDelete?.url }}</span> from the sitemap.</p>
          </div>
          <div class="flex flex-col w-full gap-3 pt-4">
            <button @click="confirmDeleteLink" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95">
              Confirm Removal
            </button>
            <button @click="showDeleteLinkModal = false" class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Container Modal -->
    <div v-if="showDeleteContainerModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
        <div class="flex flex-col items-center text-center space-y-6">
          <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-900 mb-2">Delete Entire Sitemap?</h2>
            <p class="text-slate-500 font-medium px-4">All links within <span class="text-slate-900 font-bold">"{{ sitemap.name }}"</span> will be permanently lost. This action is irreversible.</p>
          </div>
          <div class="flex flex-col w-full gap-3 pt-4">
            <button @click="confirmDeleteContainer" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95">
              Yes, Delete Container
            </button>
            <button @click="showDeleteContainerModal = false" class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Recrawl Modal -->
    <div v-if="showRecrawlModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden border border-slate-100">
        <div class="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
        <div class="flex flex-col items-center text-center space-y-6">
          <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg shadow-slate-200/50">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-900 mb-2">Recrawl All Links?</h2>
            <p class="text-slate-500 font-medium px-4">This will reset all internal statuses and restart the intelligence scan. Existing links will be re-verified.</p>
          </div>
          <div class="flex flex-col w-full gap-3 pt-4">
            <button @click="confirmRecrawlAll" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-standard active:scale-95">
              Yes, Start Sync
            </button>
            <button @click="showRecrawlModal = false" class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95">
              Back to Safety
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Crawl Mode Chooser Modal -->
    <div v-if="showCrawlModeModal" class="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] p-10 relative scale-in-center overflow-hidden border border-slate-100">
        <!-- top gradient bar -->
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-t-[3rem]"></div>

        <button @click="showCrawlModeModal = false; manualCrawling = false" class="absolute top-8 right-8 w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div class="mb-8 text-center pt-4">
          <div class="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100">
            <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Choose Analysis Mode</h2>
          <p class="text-slate-500 text-sm font-medium mt-2 px-4 truncate">{{ selectedLink?.url }}</p>
        </div>

        <!-- Mode Cards -->
        <div v-if="!manualCrawling" class="grid grid-cols-2 gap-4">

          <!-- Option A: View Existing (instant) -->
          <button
            @click="openIntelligenceReport"
            class="group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-left"
          >
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-blue-100 group-hover:bg-blue-100 transition-all">
              <svg class="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </div>
            <div>
              <p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-700">View Report</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">See last crawled data instantly</p>
            </div>
            <span class="text-[9px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">Instant</span>
          </button>

          <!-- Option B: Auto Crawl (Python) -->
          <button
            @click="selectAutoCrawl(selectedLink)"
            class="group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 text-left"
          >
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 group-hover:bg-indigo-100 transition-all">
              <svg class="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2M12 3v1"/></svg>
            </div>
            <div>
              <p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-700">Auto Crawl</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Python + Playwright full render</p>
            </div>
            <span class="text-[9px] bg-indigo-50 text-indigo-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">Async</span>
          </button>

          <!-- Option C: Manual Crawl -->
          <button
            @click="manualCrawl(selectedLink)"
            class="group col-span-2 relative flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 text-left"
          >
            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-emerald-100 group-hover:bg-emerald-100 transition-all flex-shrink-0">
              <svg class="w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
            <div class="flex-grow">
              <p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-emerald-700">Manual Crawl</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Real browser headers. Works on bot-resistant sites. Extracts full SEO data synchronously.</p>
            </div>
            <span class="text-[9px] bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors flex-shrink-0">Live</span>
          </button>
        </div>

        <!-- Manual Crawl Loading State -->
        <div v-else class="py-10 flex flex-col items-center gap-5">
          <div class="relative w-16 h-16">
            <div class="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
          </div>
          <div class="text-center">
            <p class="font-black text-slate-900 text-sm">Manual Crawler Running...</p>
            <p class="text-[10px] text-slate-400 font-medium mt-1 tracking-widest uppercase">Fetching · Parsing · Auditing</p>
          </div>
          <div class="flex gap-1.5">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Analysis (Intelligence) Modal -->
    <div v-if="showAnalysisModal" class="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 relative scale-in-center overflow-y-auto max-h-[90vh] border border-slate-100">
        <button @click="showAnalysisModal = false" class="absolute top-10 right-10 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12 border-b border-slate-50 pb-10">
          <div :class="[
            'w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black border-4 shadow-2xl',
            selectedLink?.seo_audit?.score >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100' :
            selectedLink?.seo_audit?.score >= 70 ? 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100' :
            'text-red-600 bg-red-50 border-red-100 shadow-red-100'
          ]">
            {{ selectedLink?.seo_audit?.score || '--' }}
          </div>
          <div class="space-y-1">
            <h2 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Intelligence Report
              <span v-if="selectedLink?.status === 'completed'" class="bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest">Live Audit</span>
            </h2>
            <p class="text-slate-500 font-medium text-sm flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
              {{ selectedLink?.url }}
            </p>
          </div>
          <div class="md:ml-auto flex gap-4">
             <button 
                @click="autoGenerateAiSchema"
                :disabled="generatingJsonLd"
                class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs transition-standard active:scale-95 shadow-2xl flex items-center gap-3"
             >
                <div v-if="generatingJsonLd" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <svg v-else class="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.757 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zM5.757 4.343a1 1 0 101.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z"/></svg>
                Auto-Generate AI Schema
             </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Column 1: Core Audits -->
          <div class="lg:col-span-2 space-y-10">
            <div class="space-y-6">
               <h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Optimization Analysis
               </h4>
               <div v-if="selectedLink?.seo_audit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="err in selectedLink.seo_audit.errors" :key="err" class="bg-red-50/50 p-5 rounded-3xl border border-red-100 flex gap-4 items-start shadow-sm">
                     <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                     </div>
                     <span class="text-sm font-bold text-red-900 leading-tight">{{ err }}</span>
                  </div>
                  <div v-for="warn in selectedLink.seo_audit.warnings" :key="warn" class="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex gap-4 items-start shadow-sm">
                     <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                     </div>
                     <span class="text-sm font-bold text-amber-900 leading-tight">{{ warn }}</span>
                  </div>
               </div>
               <div v-else class="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <p class="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No audit data available for this link yet.</p>
               </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                  <h4 class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1">Infrastructure Health</h4>
                  <div class="space-y-4">
                     <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                        <span class="text-[10px] uppercase font-bold text-slate-400 pr-2">Security</span>
                        <div class="flex items-center gap-2">
                           <div :class="['w-2 h-2 rounded-full', selectedLink?.ssl_info?.is_secure ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400']"></div>
                           <span class="text-xs font-black">{{ selectedLink?.ssl_info?.is_secure ? 'SSL PROTECTED' : 'INSECURE' }}</span>
                        </div>
                     </div>
                     <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                        <span class="text-[10px] uppercase font-bold text-slate-400 pr-2">Response</span>
                        <span class="text-xs font-black text-blue-400">{{ (selectedLink?.load_time || 0).toFixed(2) }}S</span>
                     </div>
                  </div>
               </div>

               <div class="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm relative overflow-hidden group">
                  <h4 class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6">Page Resources</h4>
                  <div class="space-y-4">
                     <div v-if="selectedLink?.request_analysis" class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase">Payload Size</span>
                        <span class="text-lg font-black text-indigo-900 tracking-tight">{{ (selectedLink.request_analysis.size_kb || 0).toFixed(1) }} <small class="text-[10px] opacity-60">KB</small></span>
                     </div>
                     <div class="h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-500 rounded-full w-2/3"></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <!-- Column 2: Content & Schemas -->
          <div class="space-y-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
            <div class="space-y-6">
               <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Content Metadata</h4>
               <div class="space-y-4">
                  <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                     <span class="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2">Primary Title</span>
                     <p class="text-xs font-black text-slate-800 leading-snug">{{ selectedLink?.title || 'Unknown Title' }}</p>
                  </div>
                  <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                     <span class="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2">Snippet Description</span>
                     <p class="text-xs font-bold text-slate-500 leading-relaxed">{{ selectedLink?.description || 'No description found.' }}</p>
                  </div>
               </div>
            </div>

            <div v-if="selectedLink?.extracted_json_ld?.length" class="space-y-6">
               <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Embedded Schemas</h4>
               <div class="grid grid-cols-1 gap-3">
                  <div v-for="(schema, idx) in selectedLink.extracted_json_ld" :key="idx" class="p-4 bg-white rounded-2xl border border-blue-50 flex items-center gap-3 shadow-sm hover:border-blue-200 transition-colors">
                     <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
                     </div>
                     <span class="text-[10px] font-black text-slate-700 uppercase">{{ schema['@type'] }}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Crawl Progress Overlay -->
    <div v-if="showProgressModal" class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-xl p-10 relative scale-in-center border border-slate-200">
        <div class="space-y-6">
           <div>
              <h2 class="text-xl font-bold text-slate-900">Site Sweep in Progress</h2>
              <p class="text-sm text-slate-500 mt-1">Analyzing internal structure and SEO health.</p>
           </div>

           <!-- Simple Progress Bar -->
           <div class="space-y-2">
              <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Current Deep Scan</span>
                 <span>{{ crawlProgress.total_crawled }} / {{ crawlProgress.total_discovered }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div class="h-full bg-blue-600 transition-all duration-500" :style="{ width: `${(crawlProgress.total_crawled / (crawlProgress.total_discovered || 1)) * 100}%` }"></div>
              </div>
           </div>

           <!-- Plain Logs -->
           <div class="bg-slate-50 rounded-xl p-4 h-32 overflow-y-auto border border-slate-100">
              <div v-for="(log, idx) in crawlProgress.logs" :key="idx" class="text-[10px] text-slate-600 font-medium py-1 border-b border-slate-100 last:border-0">
                 {{ log }}
              </div>
              <p v-if="!crawlProgress.logs.length" class="text-[10px] text-slate-400 italic">Initializing engine outputs...</p>
           </div>

            <div class="flex flex-col gap-3">
               <button 
                 @click="showProgressModal = false"
                 class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm transition-standard hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-200"
               >
                 Keep Scanning in Background
               </button>
               <button 
                 @click="cancelCrawl"
                 class="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard hover:bg-red-100 active:scale-95 border border-red-100/50"
               >
                 Terminate Sync & Discard
               </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Completion Toast -->
    <div v-if="showCompletionToast" class="fixed bottom-10 right-10 z-[200] animate-slide-up">
      <div class="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6">
        <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-black tracking-tight">Sync Complete!</h4>
          <p class="text-[10px] text-slate-400 font-medium whitespace-nowrap">All links have been verified and updated.</p>
        </div>
        <button @click="showCompletionToast = false" class="text-slate-500 hover:text-white transition-colors p-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    <!-- Error Toast -->
    <div v-show="showErrorToast" class="fixed bottom-10 right-10 z-[200] animate-slide-up">
      <div class="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6">
        <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-black tracking-tight">Analysis Failed</h4>
          <p class="text-[10px] text-red-100 font-medium whitespace-nowrap">{{ errorToastMessage }}</p>
        </div>
        <button @click="showErrorToast = false" class="text-red-200 hover:text-white transition-colors p-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Real-time Link Discovery Toast -->
    <Transition name="fade">
      <div v-if="showLinkToast" class="fixed bottom-10 right-10 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-subtle border border-emerald-400/50 backdrop-blur-md">
        <div class="bg-white/20 p-2 rounded-full">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-100">Synchronized</span>
          <span class="text-sm font-bold truncate max-w-[200px]">{{ lastDiscoveredUrl }}</span>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Link, useForm, router } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import axios from 'axios'

const props = defineProps({
  sitemap: Object,
  links: Object,
  duplicateCount: Number
})

console.log("Manager mounted with props:", {
  sitemap: props.sitemap ? 'present' : 'MISSING',
  links: props.links ? (props.links.data ? props.links.data.length : 'no-data') : 'MISSING',
  duplicateCount: props.duplicateCount
})

const generating = ref(false)
const crawling = ref(false)
const generatingJsonLd = ref(false)
const importing = ref(false)
const showEditLinkModal = ref(false)
const showDeleteLinkModal = ref(false)
const showDeleteContainerModal = ref(false)
const showAnalysisModal = ref(false)
const showProgressModal = ref(false)
const showRecrawlModal = ref(false)
const showCrawlModeModal = ref(false)
const manualCrawling = ref(false)
const showCompletionToast = ref(false)
const showErrorToast = ref(false)
const errorToastMessage = ref('')
const showLinkToast = ref(false)
const lastDiscoveredUrl = ref('')
const discoveredTimeout = ref(null)
const isFullScreen = ref(false)
const lastHandledDiscoveredCount = ref(0)

watch(isFullScreen, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const handleNewDiscovery = (url) => {
  lastDiscoveredUrl.value = url
  showLinkToast.value = true
  
  if (discoveredTimeout.value) clearTimeout(discoveredTimeout.value)
  discoveredTimeout.value = setTimeout(() => {
    showLinkToast.value = false
  }, 2500)
}
const editingLinkId = ref(null)
const linkToDelete = ref(null)
const selectedLink = ref(null)
const selectedFile = ref(null)
const analysisLink = ref(null)
const currentFilter = ref('all') // all, good, issues, redirects, discovered
const searchQuery = ref('')

const linksList = computed(() => props.links.data || [])

const filteredLinks = computed(() => {
  let list = linksList.value

  // Apply Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(link => 
      link.url.toLowerCase().includes(query) || 
      (link.title && link.title.toLowerCase().includes(query))
    )
  }

  // Apply Category Filter
  if (currentFilter.value === 'all') return list
  
  return list.filter(link => {
    const isGood = link.http_status === 200 && link.is_canonical
    const isRedirectOrNonCanonical = link.http_status !== 200 || !link.is_canonical
    const hasIssues = (link.seo_audit?.errors?.length > 0 || link.seo_audit?.warnings?.length > 0)
    
    if (currentFilter.value === 'good') return isGood
    if (currentFilter.value === 'issues') return hasIssues
    if (currentFilter.value === 'redirects') return isRedirectOrNonCanonical
    if (currentFilter.value === 'discovered') return link.status === 'discovered'
    return true
  })
})

const stats = computed(() => {
  const all = linksList.value.length
  const good = linksList.value.filter(l => l.http_status === 200 && l.is_canonical).length
  const issues = linksList.value.filter(l => l.seo_audit?.errors?.length > 0 || l.seo_audit?.warnings?.length > 0).length
  const redirects = linksList.value.filter(l => l.http_status !== 200 || !l.is_canonical).length
  const discovered = linksList.value.filter(l => l.status === 'discovered').length
  
  return { all, good, issues, redirects, discovered }
})

onMounted(() => {
  if (['dispatched', 'crawling'].includes(props.sitemap.last_crawl_status) && props.sitemap.last_crawl_job_id) {
    console.log("Resuming crawl polling for job:", props.sitemap.last_crawl_job_id)
    crawling.value = true
    // We don't necessarily show the modal automatically to avoid UX annoyance,
    // but the "Live Crawl" button will be active and pulsing.
    startPolling(props.sitemap.last_crawl_job_id)
  }
  
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission()
  }
})

const crawlProgress = ref({
  status: 'pending',
  current_url: '',
  total_discovered: 0,
  total_crawled: 0,
  logs: []
})

const linkForm = useForm({
  url: '',
  changefreq: 'daily',
  priority: 0.7
})

const editLinkForm = useForm({
  url: '',
  changefreq: 'daily',
  priority: 0.7
})

const handleFileUpload = (e) => {
  selectedFile.value = e.target.files[0]
}

const importLinks = () => {
  if (!selectedFile.value) return
  
  importing.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  
  router.post(route('sitemaps.import', props.sitemap.id), formData, {
    onSuccess: () => {
      importing.value = false
      selectedFile.value = null
    },
    onError: () => {
      importing.value = false
    }
  })
}

const addSingleLink = () => {
  linkForm.post(route('sitemaps.links.store', props.sitemap.id), {
    onSuccess: () => linkForm.reset('url')
  })
}

const editLink = (link) => {
  editingLinkId.value = link.id
  editLinkForm.url = link.url
  editLinkForm.changefreq = link.changefreq
  editLinkForm.priority = link.priority
  showEditLinkModal.value = true
}

const closeEditModal = () => {
  showEditLinkModal.value = false
  setTimeout(() => {
    editingLinkId.value = null
    editLinkForm.reset()
  }, 400)
}

const updateLink = () => {
  editLinkForm.put(route('sitemaps.links.update', editingLinkId.value), {
    onSuccess: () => closeEditModal()
  })
}

const deleteLink = (link) => {
  linkToDelete.value = link
  showDeleteLinkModal.value = true
}

const confirmDeleteLink = () => {
  if (!linkToDelete.value) return
  
  router.delete(route('sitemaps.links.destroy', linkToDelete.value.id), {
    onSuccess: () => {
      showDeleteLinkModal.value = false
      linkToDelete.value = null
    }
  })
}

const deleteSitemap = () => {
  showDeleteContainerModal.value = true
}

const confirmDeleteContainer = () => {
  router.delete(route('sitemaps.destroy', props.sitemap.id), {
    onSuccess: () => {
      showDeleteContainerModal.value = false
    }
  })
}

const generateXml = async () => {
  generating.value = true
  try {
    const response = await axios.post(route('sitemaps.generate', props.sitemap.id), {}, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = props.sitemap.filename || 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Generate XML error:', e)
  } finally {
    generating.value = false
  }
}

let progressInterval = null

const startPolling = (jobId) => {
  if (progressInterval) stopPolling()
  
  console.log("Starting polling for job:", jobId)
  progressInterval = setInterval(async () => {
    try {
      const response = await axios.get(route('sitemaps.jobs.progress', jobId))
      const data = response.data
      
      const previousStatus = crawlProgress.value.status
      crawlProgress.value = data

      const isFullyProcessed = data.status === 'completed' && data.total_crawled >= data.total_discovered;
      
      if (isFullyProcessed && previousStatus !== 'completed') {
        stopPolling()
        
        // Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sync Complete! ✨", {
             body: `The SEO intelligence scan for ${props.sitemap.name} has finished and all data is processed.`,
             icon: '/favicon.ico'
          })
        }
        
        // Final Refresh
        router.reload({ preserveScroll: true })
        
        // Show Toast
        showCompletionToast.value = true
        setTimeout(() => showCompletionToast.value = false, 8000)
      }
      
      if (data.status === 'failed' || data.status === 'error') {
        stopPolling()
      }

      // Proactive refresh: reload if we found new links
      // We check if the reported discovered count from Redis is higher than what we last handled
      const hasNewDiscoveries = data.total_discovered > lastHandledDiscoveredCount.value && data.total_discovered > props.links.total
      
      if (hasNewDiscoveries) {
        console.log("Forcing refresh: New links detected in engine.")
        lastHandledDiscoveredCount.value = data.total_discovered
        handleNewDiscovery(data.current_url || 'New URL')
        router.reload({ only: ['links'], preserveScroll: true, preserveState: true })
      } else if (data.status === 'crawling' && data.total_crawled % 4 === 0) {
        // Reduced frequency for regular reloads to avoid churn
        router.reload({ only: ['links'], preserveScroll: true, preserveState: true })
      }
      
      if (isFullyProcessed || data.status === 'failed') {
        console.log("Crawl finished. Status:", data.status)
        stopPolling()
        router.reload({ 
          only: ['links'],
          preserveScroll: true,
          preserveState: true
        })
      }
    } catch (e) {
      console.error("Polling error", e)
    }
  }, 2000)
}

const stopPolling = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

const triggerCrawl = async () => {
  console.log("Triggering crawl audit from UI...")
  if (crawling.value) return
  
  crawling.value = true
  showProgressModal.value = true
  crawlProgress.value.status = 'dispatched'
  crawlProgress.value.logs = ['Dispatched job to queue...']
  
  try {
    const response = await axios.post(route('sitemaps.crawl', props.sitemap.id), {
      starting_url: props.sitemap.site_url,
      max_depth: 3,
      render_js: true
    }, {
      headers: { 'Accept': 'application/json' }
    })
    
    console.log("Server response:", response.data)
    if (response.data && response.data.job_id) {
      console.log("Initiating polling for:", response.data.job_id)
      startPolling(response.data.job_id)
    } else {
      console.warn("No job_id returned from server")
      crawlProgress.value.status = 'error'
      crawlProgress.value.logs.push("Error: Server did not return a Job ID.")
    }
  } catch (e) {
    console.error("Crawl trigger error:", e)
    crawlProgress.value.status = 'failed'
    crawlProgress.value.logs.push("Critical Error: " + (e.response?.data?.message || e.message))
  } finally {
    crawling.value = false
  }
}

const cancelCrawl = () => {
  if (!confirm('This will immediately terminate the crawler and stop discovery. Continue?')) return
  
  router.post(route('sitemaps.cancel-crawl', props.sitemap.id), {}, {
    onSuccess: () => {
      stopPolling()
      showProgressModal.value = false
      crawling.value = false
    },
    onError: () => {
      // Even on error, we might want to close UI
      showProgressModal.value = false
    }
  })
}

const analyzeLink = (link) => {
  selectedLink.value = link
  showCrawlModeModal.value = true
}

const openIntelligenceReport = () => {
  showCrawlModeModal.value = false
  showAnalysisModal.value = true
}

const selectAutoCrawl = (link) => {
  showCrawlModeModal.value = false
  // Dispatch python recrawl (depth 0, single page), then open report with existing data
  router.post(route('sitemaps.links.recrawl', link.id), {}, {
    onSuccess: () => {
      // The page will reload via Inertia; open modal with refreshed link data
      showAnalysisModal.value = true
    }
  })
}

const manualCrawl = async (link) => {
  manualCrawling.value = true
  try {
    const response = await axios.post(route('sitemaps.links.manual-analyze', link.id), {}, {
      headers: { 'Accept': 'application/json' }
    })
    if (response.data?.success && response.data?.link) {
      // Merge fresh data into selectedLink so the modal shows updated fields
      selectedLink.value = { ...selectedLink.value, ...response.data.link }
    }
    showCrawlModeModal.value = false
    showAnalysisModal.value = true
  } catch (err) {
    errorToastMessage.value = err.response?.data?.message || 'Manual analysis failed. The site may be blocking all requests.'
    showErrorToast.value = true
    setTimeout(() => { showErrorToast.value = false }, 5000)
  } finally {
    manualCrawling.value = false
  }
}

const autoGenerateAiSchema = () => {
  if (selectedLink.value) {
    generateJsonLd(selectedLink.value)
  }
}

const generateJsonLd = (link) => {
  generatingJsonLd.value = true
  router.post(route('sitemaps.links.generate-json-ld', link.id), {}, {
    onSuccess: () => {
      generatingJsonLd.value = false
    },
    onError: () => {
      generatingJsonLd.value = false
    }
  })
}

const analyzeAi = (link) => {
  if (analysisLink.value) return
  analysisLink.value = link.id
  
  router.post(route('sitemaps.links.ai-analyze', link.id), {}, {
    onSuccess: () => {
      analysisLink.value = null
    },
    onError: () => {
      analysisLink.value = null
    }
  })
}

const recrawlLink = (link) => {
  router.post(route('sitemaps.links.recrawl', link.id), {}, {
    onSuccess: () => {
      // The status will update via Inertia reload
    }
  })
}

const confirmRecrawlAll = async () => {
  showRecrawlModal.value = false
  if (crawling.value) return
  
  crawling.value = true
  showProgressModal.value = true
  crawlProgress.value.status = 'dispatched'
  crawlProgress.value.logs = ['Initiating sitemap-wide sync...']
  
  try {
    const response = await axios.post(route('sitemaps.recrawl-all', props.sitemap.id), {}, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (response.data && response.data.job_id) {
      startPolling(response.data.job_id)
    }
  } catch (e) {
    console.error("Recrawl error:", e)
    crawlProgress.value.status = 'failed'
  } finally {
    crawling.value = false
  }
}

const recrawlAll = () => {
  showRecrawlModal.value = true
}

const openLiveConsole = () => {
  if (props.sitemap.last_crawl_job_id) {
    if (!progressInterval) {
      startPolling(props.sitemap.last_crawl_job_id)
    }
    showProgressModal.value = true
  }
}
</script>

<style scoped>
.transition-standard {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.shadow-premium {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
}
.scale-in-center {
  animation: scale-in-center 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}
@keyframes scale-in-center {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes scanner {
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(128px); opacity: 0; }
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-scanner { animation: scanner 2s linear infinite; }
.animate-shimmer { animation: shimmer 2s infinite; }
.animate-spin-slow { animation: spin-slow 20s linear infinite; }
.animate-slide-up { animation: slide-up 0.4s ease-out both; }
.fade-mask {
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
}
</style>
