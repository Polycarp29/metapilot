<template>
  <AppLayout :title="'Manage: ' + sitemap.name">
    <div class="max-w-7xl mx-auto space-y-10 pb-20">
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
        
        <div class="flex items-center gap-4 w-full md:w-auto">
          <button 
            @click="generateXml"
            :disabled="generating"
            class="flex-grow md:flex-grow-0 group flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black transition-standard active:scale-95"
          >
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ generating ? 'Building...' : 'Build XML' }}
          </button>
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
                <input type="file" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv,.txt" />
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
        <div class="lg:col-span-3 space-y-6">
           <!-- Stats Bar -->
           <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                 <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    </svg>
                 </div>
                 <div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Indexable</span>
                    <span class="text-lg font-bold text-slate-900">{{ links.total }}</span>
                 </div>
              </div>
              <!-- More stats could go here -->
           </div>

           <!-- Table Container -->
           <div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
             <div class="overflow-x-auto">
               <table class="w-full text-left border-collapse">
                 <thead>
                   <tr class="bg-slate-50 border-b border-slate-100">
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live URL Intelligence</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Freq</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Priority</th>
                     <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Added</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-50">
                   <tr v-for="link in links.data" :key="link.id" class="group hover:bg-slate-50/50 transition-colors">
                     <td class="px-8 py-5">
                       <div class="flex items-center gap-3">
                         <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span class="text-sm font-bold text-slate-900 tracking-tight">{{ link.url }}</span>
                       </div>
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
                       <span class="text-xs font-semibold text-slate-400">{{ new Date(link.created_at).toLocaleDateString() }}</span>
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
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { Link, useForm, router } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

const props = defineProps({
  sitemap: Object,
  links: Object,
  duplicateCount: Number
})

const generating = ref(false)
const importing = ref(false)
const selectedFile = ref(null)

const linkForm = useForm({
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

const generateXml = () => {
  window.location.href = route('sitemaps.generate', props.sitemap.id)
}
</script>

<style scoped>
.transition-standard {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.shadow-premium {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
}
</style>
