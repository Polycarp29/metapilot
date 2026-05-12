<template>
  <AppLayout title="Archive Manager">
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Archive Manager</h1>
          <p class="text-slate-500 mt-2">Browse and retrieve historical data from the dedicated archive database.</p>
        </div>
        <Link 
          :href="route('organization.settings', { tab: 'analytics' })" 
          class="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Settings
        </Link>
      </div>

      <!-- Archive Tables Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          v-for="stat in tableStats" 
          :key="stat.table"
          class="bg-white rounded-[2rem] border p-6 transition-all hover:shadow-premium cursor-pointer group"
          :class="activeTable === stat.table ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-100'"
          @click="selectTable(stat.table)"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" :class="activeTable === stat.table ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-slate-900 truncate capitalize">{{ formatTableName(stat.table) }}</h3>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ (stat.rows || 0).toLocaleString() }} Rows</p>
            </div>
          </div>
          <div class="space-y-1">
             <div class="flex justify-between text-xs font-medium">
                <span class="text-slate-400">Oldest:</span>
                <span class="text-slate-600">{{ stat.oldest ? formatDate(stat.oldest) : 'N/A' }}</span>
             </div>
             <div class="flex justify-between text-xs font-medium">
                <span class="text-slate-400">Newest:</span>
                <span class="text-slate-600">{{ stat.newest ? formatDate(stat.newest) : 'N/A' }}</span>
             </div>
          </div>
        </div>
      </div>

      <!-- Data Browser -->
      <div v-if="activeTable" class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden animate-fade-in">
        <!-- Table Header & Filters -->
        <div class="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Browsing: {{ formatTableName(activeTable) }}</h2>
            <p class="text-sm text-slate-500 mt-1">Viewing records stored in the archive database.</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-4">
             <div class="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100">FROM</div>
                <input v-model="filters.from" type="date" class="px-3 py-2 text-sm font-bold text-slate-700 outline-none">
             </div>
             <div class="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100">TO</div>
                <input v-model="filters.to" type="date" class="px-3 py-2 text-sm font-bold text-slate-700 outline-none">
             </div>
             <button @click="fetchData(1)" class="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">
                Apply Filters
             </button>
          </div>
        </div>

        <!-- Table Content -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th v-for="col in columns" :key="col" class="px-6 py-4">{{ col.replace('_', ' ') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-if="loading" class="bg-white">
                 <td :colspan="columns.length" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-4">
                       <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <p class="text-sm font-bold text-slate-400">Loading historical records...</p>
                    </div>
                 </td>
              </tr>
              <tr v-else-if="records.length === 0" class="bg-white">
                 <td :colspan="columns.length" class="px-6 py-20 text-center text-slate-400 font-medium italic">
                    No records found for the selected criteria.
                 </td>
              </tr>
              <tr v-for="record in records" :key="record.id" class="hover:bg-blue-50/30 transition-colors group">
                <td v-for="col in columns" :key="col" class="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                   <template v-if="col === 'metadata' || col === 'raw_response' || col === 'by_source'">
                      <button @click="viewJson(record[col])" class="text-blue-500 hover:underline font-bold text-xs">View JSON</button>
                   </template>
                   <template v-else-if="col === 'created_at' || col === 'updated_at'">
                      {{ formatDateTime(record[col]) }}
                   </template>
                   <template v-else>
                      <span class="truncate max-w-[200px] block" :title="record[col]">{{ record[col] ?? '—' }}</span>
                   </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <div class="text-sm text-slate-500 font-medium">
            Showing <span class="font-bold text-slate-900">{{ meta.from || 0 }}</span> to <span class="font-bold text-slate-900">{{ meta.to || 0 }}</span> of <span class="font-bold text-slate-900">{{ meta.total || 0 }}</span> records
          </div>
          <div class="flex gap-2">
             <button 
                @click="fetchData(meta.current_page - 1)" 
                :disabled="meta.current_page === 1 || loading"
                class="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
             >
                Previous
             </button>
             <button 
                @click="fetchData(meta.current_page + 1)" 
                :disabled="meta.current_page === meta.last_page || loading"
                class="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
             >
                Next
             </button>
          </div>
        </div>
      </div>

      <!-- JSON Viewer Modal -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="jsonModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" @click.self="jsonModal.show = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 class="text-lg font-bold text-slate-900">Record Data</h3>
               <button @click="jsonModal.show = false" class="text-slate-400 hover:text-slate-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div class="p-6 overflow-y-auto bg-slate-50 font-mono text-sm">
               <pre class="whitespace-pre-wrap">{{ JSON.stringify(jsonModal.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import axios from 'axios'

const props = defineProps({
  tableStats: Array
})

const activeTable = ref(null)
const loading = ref(false)
const records = ref([])
const columns = ref([])
const meta = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0
})

const filters = ref({
  from: '',
  to: ''
})

const jsonModal = ref({
  show: false,
  data: null
})

const formatTableName = (name) => {
  return name.replace(/_/g, ' ')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatDateTime = (date) => {
   if (!date) return '—'
   return new Date(date).toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
   })
}

const selectTable = (table) => {
  activeTable.value = table
  fetchData(1)
}

const fetchData = async (page = 1) => {
  if (!activeTable.value) return
  
  loading.value = true
  try {
    const response = await axios.get(`/api/archive/${activeTable.value}`, {
      params: {
        page,
        from: filters.value.from,
        to: filters.value.to,
        per_page: 50
      }
    })
    
    records.value = response.data.data
    meta.value = response.data.meta
    
    if (records.value.length > 0) {
      columns.value = Object.keys(records.value[0])
    } else if (page === 1) {
       // If first page is empty, we don't have columns, but we can try to get them if needed
       // For now, just keep columns if they were there or clear them
       columns.value = []
    }
  } catch (error) {
    console.error('Failed to fetch archive data:', error)
  } finally {
    loading.value = false
  }
}

const viewJson = (data) => {
  try {
     jsonModal.value.data = typeof data === 'string' ? JSON.parse(data) : data
     jsonModal.value.show = true
  } catch (e) {
     jsonModal.value.data = { error: 'Invalid JSON format', raw: data }
     jsonModal.value.show = true
  }
}

onMounted(() => {
  if (props.tableStats.length > 0) {
    selectTable(props.tableStats[0].table)
  }
})
</script>

<style scoped>
.shadow-premium {
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
