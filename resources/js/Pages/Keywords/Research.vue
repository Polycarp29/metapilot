<template>
  <AppLayout title="Keyword Research">
    <div class="min-h-screen bg-slate-50/50 pb-20">
      <!-- Header Section -->
      <div class="bg-white border-b border-slate-200 pt-12 pb-8 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Keyword Research</h1>
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner self-start mt-4 w-fit">
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
                <Link 
                  :href="route('keywords.intelligence')"
                  class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Intelligence
                </Link>
                <button 
                  class="px-4 py-2 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all duration-300 flex items-center gap-2"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Research
                </button>
              </div>
              <p class="text-slate-500">Discover search trends and analyze organic competition.</p>
                <div v-if="results" class="flex gap-2">
                  <span v-if="cached" class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                    Cached {{ last_searched }}
                  </span>
                  <span v-if="niche" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                     Niche: {{ niche }}
                  </span>
                  <span v-if="intent" class="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase tracking-wider">
                     Global Intent: {{ intent }}
                  </span>
                  <span v-if="growth_rate > 0" class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
                    <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"/></svg>
                    +{{ growth_rate }}% Growth
                  </span>
                  <span v-if="current_interest > 50" class="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">
                     Rising Trend
                  </span>
                </div>
              </div>
            
            <!-- Search Bar -->
            <form @submit.prevent="handleSearch" class="flex-1 max-w-2xl">
              <div class="relative group">
                <input
                  v-model="form.q"
                  type="text"
                  placeholder="Enter a keyword or topic..."
                  class="w-full pl-6 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400"
                />
                <div class="absolute inset-y-2 right-2 flex gap-2">
                  <select 
                    v-model="form.gl" 
                    class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="ke">KE (Kenya)</option>
                    <option value="ng">NG (Nigeria)</option>
                    <option value="za">ZA (South Africa)</option>
                    <option value="us">US</option>
                    <option value="uk">UK</option>
                  </select>
                  <button
                    type="submit"
                    :disabled="loading"
                    class="px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <span v-if="!loading">Search</span>
                    <svg v-else class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Dashboard Content -->
        <div v-if="!results && !loading" class="text-center py-20 px-6 glass rounded-[3rem] border-white/40 shadow-premium">
          <div class="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-4">Start your research</h2>
          <p class="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
            Enter a keyword above to see organic search results, related queries, and analyze competitor strategies.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <button v-for="tag in ['best seo tools', 'meta descriptions', 'json-ld generator']" 
                    @click="quickSearch(tag)"
                    class="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all duration-200">
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Results View -->
        <div v-else-if="results" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div class="grid lg:grid-cols-3 gap-8">
            <!-- Main Results -->
            <div class="lg:col-span-2 space-y-6">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                Organic Search Results
              </h3>
              
              <div v-for="(item, index) in results.organic" :key="index" 
                   class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300">
                <div class="flex items-start gap-4">
                  <div class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <a :href="item.link" target="_blank" class="block group">
                      <p class="text-xs text-slate-400 truncate mb-1">{{ item.link }}</p>
                      <h4 class="text-lg font-bold text-primary group-hover:underline truncate">{{ item.title }}</h4>
                    </a>
                    <p class="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{{ item.snippet }}</p>
                    
                    <div class="flex items-center gap-3 mt-4">
                      <span :class="getIntentClass(item.snippet)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {{ detectIntent(item.snippet) }}
                      </span>
                      <span v-if="item.date" class="text-xs text-slate-400 font-medium">Published: {{ item.date }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar Stats -->
            <div class="space-y-8">
              <!-- Related Queries -->
              <div class="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
                <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  Related Searches
                </h3>
                <div class="space-y-3">
                  <button v-for="rel in results.relatedSearches" 
                          @click="quickSearch(rel.query)"
                          class="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-slate-300 group-hover:text-white">{{ rel.query }}</span>
                      <svg class="w-4 h-4 text-slate-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- People Also Ask -->
              <div v-if="results.peopleAlsoAsk" class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  People Also Ask
                </h3>
                <div class="space-y-4">
                  <div v-for="ask in results.peopleAlsoAsk" class="p-4 bg-slate-50 rounded-2xl">
                    <p class="text-sm font-bold text-slate-800 leading-snug">{{ ask.question }}</p>
                    <p class="text-xs text-slate-500 mt-2 line-clamp-2">{{ ask.snippet }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-40">
          <div class="relative w-20 h-20">
            <div class="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p class="mt-6 text-slate-500 font-bold animate-pulse text-lg tracking-widest uppercase">Analyzing Keywords...</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';

const props = defineProps({
  results: Object,
  intent: String,
  niche: String,
  growth_rate: [String, Number],
  current_interest: [String, Number],
  cached: Boolean,
  last_searched: String,
  filters: Object,
});

const form = useForm({
  q: props.filters?.q || '',
  gl: props.filters?.gl || 'ke',
  hl: props.filters?.hl || 'en',
});

const loading = ref(false);

function handleSearch() {
  if (!form.q) return;
  
  loading.value = true;
  form.get(route('keywords.research'), {
    preserveState: true,
    preserveScroll: true,
    onFinish: () => loading.value = false,
  });
}

function quickSearch(query) {
  form.q = query;
  handleSearch();
}

function detectIntent(snippet) {
  const s = snippet.toLowerCase();
  if (s.includes('buy') || s.includes('price') || s.includes('shop') || s.includes('discount')) return 'Commercial';
  if (s.includes('how to') || s.includes('what is') || s.includes('guide') || s.includes('tutorial')) return 'Informational';
  if (s.includes('best') || s.includes('review') || s.includes('top')) return 'Transactional';
  return 'Navigational';
}

function getIntentClass(snippet) {
  const intent = detectIntent(snippet);
  const classes = {
    'Commercial': 'bg-green-100 text-green-700',
    'Informational': 'bg-blue-100 text-blue-700',
    'Transactional': 'bg-purple-100 text-purple-700',
    'Navigational': 'bg-slate-100 text-slate-700'
  };
  return classes[intent];
}
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
