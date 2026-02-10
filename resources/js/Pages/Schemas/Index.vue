<template>
  <AppLayout title="All Schemas">
    <div class="space-y-10">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Schema Repository</h1>
          <p class="text-slate-500 font-medium">Browse and manage all structured data configurations for 9UBET.</p>
        </div>
        <div class="flex items-center gap-4">
          <Link
            href="/schemas/automated/create"
            class="inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-slate-200 active:scale-95"
          >
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Automated Builder
          </Link>
          <Link
            href="/schemas/create"
            class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-200 active:scale-95"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Build New Schema
          </Link>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div class="bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 flex flex-wrap gap-8 items-end">
        <div class="flex-grow space-y-3">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Search Database</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="search"
              type="text"
              placeholder="Filter by name, URL, or type..."
              class="block w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 placeholder:text-slate-400 sm:text-sm font-medium"
            />
          </div>
        </div>

        <div class="w-full md:w-64 space-y-3">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Filter by Type</label>
          <select
            v-model="typeFilter"
            class="block w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium sm:text-sm appearance-none"
          >
            <option value="">All Categories</option>
            <option v-for="type in schemaTypes" :key="type.id" :value="type.type_key">
              {{ type.name }}
            </option>
          </select>
        </div>

        <button
          @click="resetFilters"
          class="px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-standard active:scale-95"
        >
          Reset Filters
        </button>
      </div>

      <!-- Table / Results -->
      <div class="bg-white shadow-premium rounded-[2.5rem] border border-slate-100 overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-50/50 border-b border-slate-100">
            <tr class="text-left">
              <th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Configuration</th>
              <th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Context URL</th>
              <th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Settings</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="schema in schemas.data" :key="schema.id" class="group hover:bg-slate-50/30 transition-standard">
              <td class="px-8 py-7">
                <div class="flex items-center gap-2 mb-1">
                  <div class="font-bold text-slate-900 text-lg tracking-tight">{{ schema.name }}</div>
                  <span v-if="schema.container" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tight" :title="schema.container.identifier">
                    Part of Container
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-mono uppercase">{{ schema.schema_id }}</div>
              </td>
              <td class="px-8 py-7">
                <span class="inline-flex items-center px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-blue-100">
                  {{ schema.schema_type?.name }}
                </span>
              </td>
              <td class="px-8 py-7">
                <div class="flex items-center gap-2 group/url">
                  <span class="text-xs text-slate-500 font-medium max-w-[200px] truncate">{{ schema.url }}</span>
                  <a :href="schema.url" target="_blank" class="text-slate-300 hover:text-blue-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </td>
              <td class="px-8 py-7">
                <div class="flex items-center gap-2">
                  <div :class="schema.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'" class="w-2 h-2 rounded-full"></div>
                  <span
                    :class="schema.is_active ? 'text-emerald-700' : 'text-slate-500'"
                    class="text-xs font-bold uppercase tracking-widest"
                  >
                    {{ schema.is_active ? 'Active' : 'Draft' }}
                  </span>
                </div>
              </td>
              <td class="px-8 py-7 text-right space-x-2">
                <Link
                  :href="`/schemas/${schema.id}/edit`"
                  class="inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-standard shadow-sm active:scale-95"
                  title="Configure"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </Link>
                <Link
                  :href="`/schemas/${schema.id}`"
                  class="inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-2xl transition-standard shadow-sm active:scale-95"
                  title="Raw View"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <button
                  @click="openDeleteModal(schema.id)"
                  class="inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-standard shadow-sm active:scale-95"
                  title="Remove"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="schemas.data.length === 0">
              <td colspan="5" class="px-8 py-24 text-center">
                <div class="flex flex-col items-center">
                  <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
                    <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900 mb-2">Infinite Possibilities, Zero Schemas</h3>
                  <p class="text-slate-500 font-medium mb-10 max-w-sm">You haven't generated any structured data yet. Let's fix that by building your first schema.</p>
                  <Link
                    href="/schemas/create"
                    class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-standard active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Create First Schema
                  </Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 gap-6" v-if="schemas.total > 0">
        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Displaying <span class="text-slate-900">{{ schemas.from }}-{{ schemas.to }}</span> of <span class="text-slate-900">{{ schemas.total }}</span> results
        </span>
        <div class="flex items-center gap-2">
          <Link
            v-for="link in schemas.links"
            :key="link.label"
            :href="link.url || '#'"
            v-html="link.label"
            class="px-5 py-3 rounded-2xl text-sm font-bold border transition-standard"
            :class="[
              link.active ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
              !link.url ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Deletion Verification Modal -->
    <Transition 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
          <!-- Background overlay -->
          <div @click="closeDeleteModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" aria-hidden="true"></div>

          <!-- Modal Panel -->
          <div class="relative z-10 inline-block align-middle bg-white rounded-[3rem] text-left overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100 animate-in zoom-in-95 duration-300">
            <div class="bg-white p-12">
              <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-[2rem] bg-red-50 mb-8 border border-red-100 shadow-inner">
                  <svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 class="text-3xl font-black text-slate-900 tracking-tight mb-4" id="modal-title">Confirm Removal</h3>
                <p class="text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to delete this schema? This action will archive the configuration. You can restore it later, but it will be deactivated immediately.
                </p>
              </div>
            </div>
            <div class="bg-slate-50 p-10 flex flex-col-reverse sm:flex-row sm:justify-center gap-6">
              <button 
                @click="closeDeleteModal" 
                class="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-standard active:scale-95 shadow-sm"
              >
                No, Keep it safe
              </button>
              <button 
                @click="confirmDeletion" 
                class="w-full sm:w-auto px-10 py-5 bg-red-600 border border-transparent rounded-2xl text-sm font-black text-white hover:bg-red-500 shadow-xl shadow-red-200 transition-standard active:scale-95"
              >
                Yes, Delete now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { debounce } from 'lodash'

const props = defineProps({
  schemas: Object,
  schemaTypes: Array,
  filters: Object
})

const search = ref(props.filters.search || '')
const typeFilter = ref(props.filters.type || '')

const updateFilters = debounce(() => {
  router.get('/schemas', {
    search: search.value,
    type: typeFilter.value
  }, {
    preserveState: true,
    replace: true
  })
}, 300)

watch([search, typeFilter], updateFilters)

const resetFilters = () => {
  search.value = ''
  typeFilter.value = ''
}

const showDeleteModal = ref(false)
const selectedSchemaId = ref(null)

const openDeleteModal = (id) => {
  selectedSchemaId.value = id
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedSchemaId.value = null
}

const confirmDeletion = () => {
  if (selectedSchemaId.value) {
    router.delete(`/schemas/${selectedSchemaId.value}`, {
      onSuccess: () => closeDeleteModal(),
      onError: () => closeDeleteModal()
    })
  }
}
</script>
