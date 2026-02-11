<template>
  <AppLayout title="Create Schema">
    <div class="max-w-4xl mx-auto space-y-10">
      <!-- Top Navigation/Header -->
      <div class="flex items-center gap-6">
        <Link 
          href="/schemas" 
          class="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">New Schema</h1>
          <p class="text-slate-500 font-medium">Configure the foundation of your structured data.</p>
        </div>
      </div>

      <!-- Main Form -->
      <form @submit.prevent="submit" class="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] border border-slate-100 overflow-hidden">
        <div class="p-10 md:p-16 space-y-10">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <!-- Name -->
            <div class="space-y-3">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Football Betting Page"
                class="block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"
                :class="{ 'border-red-300 ring-4 ring-red-50': form.errors.name }"
              />
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
              >
                <p v-if="form.errors.name" class="text-red-500 text-xs font-bold ml-1">{{ form.errors.name }}</p>
              </Transition>
            </div>

            <!-- Schema Type -->
            <div class="space-y-3">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Schema Type</label>
              <select
                v-model="form.schema_type_id"
                class="block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium appearance-none"
                :class="{ 'border-red-300 ring-4 ring-red-50': form.errors.schema_type_id }"
              >
                <option value="">Select a category...</option>
                <option v-for="type in schemaTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
              >
                <p v-if="form.errors.schema_type_id" class="text-red-500 text-xs font-bold ml-1">{{ form.errors.schema_type_id }}</p>
              </Transition>
            </div>

            <!-- Architecture Strategy Selector -->
            <div class="md:col-span-2 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="text-xs font-black text-slate-800 uppercase tracking-widest">Architecture Strategy</h5>
                  <p class="text-[10px] text-slate-500 font-medium">Decide how this schema integrates with your brand root.</p>
                </div>
                <div class="flex gap-2">
                  <button 
                    type="button"
                    @click="form.use_existing_container = false"
                    :class="!form.use_existing_container ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'"
                    class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    New Root
                  </button>
                  <button 
                    type="button"
                    @click="form.use_existing_container = true"
                    :class="form.use_existing_container ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'"
                    class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Existing Root
                  </button>
                </div>
              </div>

              <Transition 
                enter-active-class="transition duration-500 ease-out" 
                enter-from-class="opacity-0 -translate-y-4" 
                enter-to-class="opacity-100 translate-y-0"
              >
                <div v-if="form.use_existing_container" class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/50">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Root Container</label>
                    <select v-model="form.selected_container_id" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold appearance-none">
                      <option value="">Select a brand root...</option>
                      <option v-for="c in containers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.identifier }})</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sub-path Variation</label>
                    <input v-model="form.sub_path" type="text" placeholder="e.g., /en or /mobile" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" />
                    <p class="text-[9px] text-slate-400 font-medium ml-2 italic">The schema @id will be: root_id + sub_path</p>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Schema ID -->
            <div class="space-y-3" v-if="!form.use_existing_container">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Schema ID (@id)</label>
              <input
                v-model="form.schema_id"
                type="url"
                placeholder="https://www.9ubet.co.ke/#organization"
                class="block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"
                :class="{ 'border-red-300 ring-4 ring-red-50': form.errors.schema_id }"
              />
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
              >
                <p v-if="form.errors.schema_id" class="text-red-500 text-xs font-bold ml-1">{{ form.errors.schema_id }}</p>
              </Transition>
            </div>

            <!-- Page URL -->
            <div class="space-y-3">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Context / Page URL</label>
              <input
                v-model="form.url"
                type="url"
                placeholder="https://www.9ubet.co.ke/sports/football"
                class="block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"
                :class="{ 'border-red-300 ring-4 ring-red-50': form.errors.url }"
              />
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
              >
                <p v-if="form.errors.url" class="text-red-500 text-xs font-bold ml-1">{{ form.errors.url }}</p>
              </Transition>
            </div>
          </div>

          <!-- Info Banner -->
          <div class="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 flex gap-6 items-start">
            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 uppercase tracking-widest text-xs">Ready for Next Steps</h4>
              <p class="text-slate-600 font-medium text-sm leading-relaxed">
                Saving this primary configuration will automatically unlock the <strong>Dynamic Property Editor</strong>. 
                SEO-standard fields for your selected type will be pre-populated instantly.
              </p>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Actions -->
        <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
          <Link
            href="/schemas"
            class="px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-standard active:scale-95"
          >
            Go Back
          </Link>
          <button
            type="submit"
            :disabled="form.processing"
            class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            <span v-if="form.processing" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ form.processing ? 'Establishing Connection...' : 'Save & Continue to Editor' }}
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { useForm, Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

const props = defineProps({
  schemaTypes: Array,
  containers: Array
})

const form = useForm({
  name: '',
  schema_type_id: '',
  schema_id: '',
  url: '',
  use_existing_container: false,
  selected_container_id: '',
  sub_path: '',
  is_active: true
})

const submit = () => {
  form.post('/schemas')
}
</script>
