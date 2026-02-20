<template>
  <AppLayout title="Sitemap Dashboard">
    <div class="max-w-7xl mx-auto space-y-10 pb-20">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 class="text-4xl font-black text-slate-900 tracking-tight">Sitemap Intelligence</h1>
          <p class="text-slate-500 font-medium mt-2 text-lg">Manage, generate, and optimize your XML sitemaps for maximum indexing.</p>
        </div>
        <button 
          @click="showCreateModal = true"
          class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-standard shadow-xl shadow-blue-100 flex items-center gap-3 active:scale-95"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Sitemap
        </button>
        <Link 
          href="/crawl-schedules"
          class="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-standard active:scale-95"
        >
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Schedules
        </Link>
      </div>

      <!-- Sitemap Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="sitemap in sitemaps" 
          :key="sitemap.id"
          class="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>

          <div class="relative z-10 flex flex-col h-full">
            <div class="flex justify-between items-start mb-6">
              <div :class="sitemap.is_index ? 'bg-indigo-500' : 'bg-blue-600'" class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <svg v-if="sitemap.is_index" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="editSitemap(sitemap)"
                  class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard"
                  title="Edit Sitemap"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click="deleteSitemap(sitemap)"
                  class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard"
                  title="Delete Sitemap"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <span v-if="sitemap.is_index" class="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Master Index</span>
                <span v-if="sitemap.schedule" class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ sitemap.schedule.frequency }}
                </span>
              </div>
            </div>

            <h3 class="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{{ sitemap.name }}</h3>
            <p v-if="sitemap.site_url" class="text-xs font-bold text-blue-500 mb-1 truncate">{{ sitemap.site_url }}</p>
            <code class="text-xs font-mono text-slate-400 mb-6 block">/{{ sitemap.filename }}</code>

            <div class="grid grid-cols-2 gap-4 mt-auto border-t border-slate-50 pt-6">
              <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Links</span>
                <span class="text-xl font-bold text-slate-900">{{ sitemap.links_count }}</span>
              </div>
              <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Last Build</span>
                <span class="text-xs font-medium text-slate-500">{{ sitemap.last_generated_at ? new Date(sitemap.last_generated_at).toLocaleDateString() : 'Never' }}</span>
              </div>
            </div>

            <Link 
              :href="route('sitemaps.show', sitemap.id)"
              class="mt-8 bg-slate-900 text-white w-full py-4 rounded-2xl font-bold text-center group-hover:bg-blue-600 transition-standard active:scale-95"
            >
              Manage Sitemap
            </Link>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sitemaps.length === 0" class="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200">
         <div class="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-slate-300">
           <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L15 17l-6 3z" />
           </svg>
         </div>
         <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">No sitemaps generated yet</h2>
         <p class="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">Create your first sitemap container to start importing links and building your XML structure.</p>
         <button 
           @click="showCreateModal = true"
           class="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-standard"
         >
           Initialize First Sitemap
         </button>
      </div>

      <!-- Create Modal -->
      <div v-if="showCreateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
        <div class="bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center">
          <button @click="closeModal" class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight">{{ isEditing ? 'Edit Sitemap' : 'Init Sitemap' }}</h2>
          
          <form @submit.prevent="submitForm" class="space-y-8">
            <div class="space-y-3">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Internal Label</label>
              <input v-model="form.name" type="text" placeholder="e.g., SEO Game Pages" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required />
            </div>

            <div class="space-y-3">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Site Link / Domain</label>
              <input v-model="form.site_url" type="url" placeholder="https://example.com" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" />
              <p v-if="form.errors.site_url" class="text-red-500 text-[10px] font-bold ml-4">{{ form.errors.site_url }}</p>
            </div>

            <div class="space-y-3">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">XML Filename</label>
              <div class="relative">
                <input v-model="form.filename" type="text" placeholder="sitemap-pages.xml" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required />
              </div>
            </div>

            <div 
              @click="form.is_index = !form.is_index"
              class="flex items-center gap-6 p-6 rounded-2xl border-2 cursor-pointer transition-standard"
              :class="form.is_index ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'"
            >
              <div :class="form.is_index ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'" class="w-12 h-12 rounded-xl flex items-center justify-center transition-standard shadow-lg">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <div>
                <p class="font-black text-slate-900 text-sm">Sitemap Index File</p>
                <p class="text-xs text-slate-500 font-medium">Link other sitemaps to this master file.</p>
              </div>
            </div>

            <button :disabled="form.processing" type="submit" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4">
              {{ isEditing ? 'Save Changes' : 'Create Container' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
        <div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
          
          <div class="flex flex-col items-center text-center space-y-6">
            <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <div>
              <h2 class="text-2xl font-black text-slate-900 mb-2">Are you sure?</h2>
              <p class="text-slate-500 font-medium px-4">You are about to delete <span class="text-slate-900 font-bold">"{{ sitemapToDelete?.name }}"</span>. All links within this sitemap will be permanently removed.</p>
            </div>

            <div class="flex flex-col w-full gap-3 pt-4">
              <button 
                @click="confirmDelete"
                class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95"
              >
                Yes, Delete It
              </button>
              <button 
                @click="showDeleteModal = false"
                class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95"
              >
                No, Keep It
              </button>
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
  sitemaps: Array
})

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const sitemapToDelete = ref(null)

const form = useForm({
  name: '',
  site_url: '',
  filename: '',
  is_index: false
})

const editSitemap = (sitemap) => {
  isEditing.value = true
  editingId.value = sitemap.id
  form.name = sitemap.name
  form.site_url = sitemap.site_url
  form.filename = sitemap.filename
  form.is_index = !!sitemap.is_index
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  setTimeout(() => {
    isEditing.value = false
    editingId.value = null
    form.reset()
  }, 400)
}

const submitForm = () => {
  if (isEditing.value) {
    form.put(route('sitemaps.update', editingId.value), {
      onSuccess: () => closeModal()
    })
  } else {
    form.post(route('sitemaps.store'), {
      onSuccess: () => closeModal()
    })
  }
}

const deleteSitemap = (sitemap) => {
  sitemapToDelete.value = sitemap
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (!sitemapToDelete.value) return
  
  router.delete(route('sitemaps.destroy', sitemapToDelete.value.id), {
    onSuccess: () => {
      showDeleteModal.value = false
      sitemapToDelete.value = null
    }
  })
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
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
