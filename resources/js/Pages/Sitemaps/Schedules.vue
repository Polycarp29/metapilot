<template>
  <AppLayout>
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Crawl Schedules</h1>
          <p class="text-slate-500 mt-1">Automate your sitemap crawling with recurring schedules</p>
        </div>
        <div class="flex items-center space-x-3">
          <Link href="/sitemaps" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
            ← Back to Sitemaps
          </Link>
          <button
            v-if="availableSitemaps.length > 0"
            @click="showCreateModal = true"
            class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      <!-- Schedules Grid -->
      <div v-if="schedules.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="schedule in schedules"
          :key="schedule.id"
          class="group bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          <!-- Card Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-slate-900 truncate">{{ schedule.sitemap?.name || 'Unknown Sitemap' }}</h3>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ schedule.sitemap?.site_url || schedule.sitemap?.filename }}</p>
              </div>
              <!-- Active Toggle -->
              <button
                @click="toggleActive(schedule)"
                :class="schedule.is_active ? 'bg-emerald-500' : 'bg-slate-300'"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              >
                <span
                  :class="schedule.is_active ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                />
              </button>
            </div>

            <!-- Frequency Badge -->
            <div class="flex items-center space-x-2 mb-4">
              <span :class="freqBadgeClass(schedule.frequency)" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {{ schedule.frequency }}
              </span>
              <span v-if="schedule.run_at && schedule.frequency !== 'hourly'" class="text-xs text-slate-500">
                at {{ schedule.run_at }}
              </span>
              <span v-if="schedule.day_of_week !== null && schedule.frequency === 'weekly'" class="text-xs text-slate-500">
                on {{ dayNames[schedule.day_of_week] }}
              </span>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-slate-50 rounded-xl p-3">
                <div class="text-slate-400 text-xs font-medium mb-0.5">Max Depth</div>
                <div class="font-bold text-slate-900">{{ schedule.max_depth }}</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-3">
                <div class="text-slate-400 text-xs font-medium mb-0.5">Last Status</div>
                <div :class="statusColorClass(schedule.last_run_status)" class="font-bold text-sm capitalize">
                  {{ schedule.last_run_status || 'Never run' }}
                </div>
              </div>
              <div class="bg-slate-50 rounded-xl p-3 col-span-2">
                <div class="text-slate-400 text-xs font-medium mb-0.5">Next Run</div>
                <div class="font-bold text-slate-900 text-sm">
                  {{ schedule.next_run_at ? formatDate(schedule.next_run_at) : 'Pending' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="border-t border-slate-100 px-6 py-3 flex justify-end space-x-2 bg-slate-50/50">
            <button @click="editSchedule(schedule)" class="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
              Edit
            </button>
            <button @click="confirmDelete(schedule)" class="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">No Crawl Schedules Yet</h3>
        <p class="text-slate-500 max-w-md mx-auto mb-6">
          Set up automated crawl schedules to keep your sitemaps up-to-date automatically.
        </p>
        <button
          v-if="availableSitemaps.length > 0"
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
        >
          Create First Schedule
        </button>
        <p v-else class="text-sm text-slate-400 mt-4">Create a sitemap first to set up a schedule.</p>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="closeModals"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-modal-in">
          <h2 class="text-xl font-bold text-slate-900 mb-6">{{ showEditModal ? 'Edit Schedule' : 'Create Crawl Schedule' }}</h2>

          <form @submit.prevent="showEditModal ? submitEdit() : submitCreate()" class="space-y-5">
            <!-- Sitemap Selection (create only) -->
            <div v-if="!showEditModal">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Sitemap</label>
              <select v-model="form.sitemap_id" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" required>
                <option value="" disabled>Select a sitemap...</option>
                <option v-for="sm in availableSitemaps" :key="sm.id" :value="sm.id">
                  {{ sm.name }} {{ sm.site_url ? `(${sm.site_url})` : '' }}
                </option>
              </select>
            </div>

            <!-- Frequency -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Frequency</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="freq in ['hourly', 'daily', 'weekly', 'monthly']"
                  :key="freq"
                  type="button"
                  @click="form.frequency = freq"
                  :class="form.frequency === freq
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'"
                  class="px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center"
                >
                  {{ freq }}
                </button>
              </div>
            </div>

            <!-- Time of Day (not for hourly) -->
            <div v-if="form.frequency !== 'hourly'">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Run At (Time of Day)</label>
              <input v-model="form.run_at" type="time" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" />
            </div>

            <!-- Day of Week (weekly only) -->
            <div v-if="form.frequency === 'weekly'">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Day of Week</label>
              <select v-model.number="form.day_of_week" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm">
                <option v-for="(name, idx) in dayNames" :key="idx" :value="idx">{{ name }}</option>
              </select>
            </div>

            <!-- Max Depth -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Max Crawl Depth</label>
              <input v-model.number="form.max_depth" type="number" min="1" max="10" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" />
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-2">
              <button type="button" @click="closeModals" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200">
                {{ showEditModal ? 'Save Changes' : 'Create Schedule' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <h3 class="text-lg font-bold text-slate-900 mb-3">Delete Schedule?</h3>
          <p class="text-sm text-slate-500 mb-6">This will permanently delete the crawl schedule for <strong>{{ deletingSchedule?.sitemap?.name }}</strong>.</p>
          <div class="flex justify-end space-x-3">
            <button @click="showDeleteModal = false" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
            <button @click="executeDelete" class="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

const props = defineProps({
  schedules: Array,
  availableSitemaps: Array,
})

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingSchedule = ref(null)
const deletingSchedule = ref(null)

const form = reactive({
  sitemap_id: '',
  frequency: 'daily',
  run_at: '02:00',
  day_of_week: 1,
  max_depth: 3,
})

function resetForm() {
  form.sitemap_id = ''
  form.frequency = 'daily'
  form.run_at = '02:00'
  form.day_of_week = 1
  form.max_depth = 3
}

function closeModals() {
  showCreateModal.value = false
  showEditModal.value = false
  editingSchedule.value = null
  resetForm()
}

function submitCreate() {
  router.post('/crawl-schedules', { ...form }, {
    preserveScroll: true,
    onSuccess: () => closeModals(),
  })
}

function editSchedule(schedule) {
  editingSchedule.value = schedule
  form.frequency = schedule.frequency
  form.run_at = schedule.run_at || '02:00'
  form.day_of_week = schedule.day_of_week ?? 1
  form.max_depth = schedule.max_depth
  showEditModal.value = true
}

function submitEdit() {
  router.put(`/crawl-schedules/${editingSchedule.value.id}`, { ...form }, {
    preserveScroll: true,
    onSuccess: () => closeModals(),
  })
}

function toggleActive(schedule) {
  router.put(`/crawl-schedules/${schedule.id}`, { is_active: !schedule.is_active }, {
    preserveScroll: true,
  })
}

function confirmDelete(schedule) {
  deletingSchedule.value = schedule
  showDeleteModal.value = true
}

function executeDelete() {
  router.delete(`/crawl-schedules/${deletingSchedule.value.id}`, {
    preserveScroll: true,
    onSuccess: () => {
      showDeleteModal.value = false
      deletingSchedule.value = null
    },
  })
}

function freqBadgeClass(freq) {
  return {
    hourly: 'bg-amber-100 text-amber-700',
    daily: 'bg-blue-100 text-blue-700',
    weekly: 'bg-indigo-100 text-indigo-700',
    monthly: 'bg-violet-100 text-violet-700',
  }[freq] || 'bg-slate-100 text-slate-700'
}

function statusColorClass(status) {
  if (!status) return 'text-slate-400'
  if (status === 'completed' || status === 'dispatched') return 'text-emerald-600'
  if (status === 'failed') return 'text-red-500'
  return 'text-amber-500'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-in {
  animation: modal-in 0.25s ease-out;
}
</style>
