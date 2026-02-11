<template>
  <AppLayout :title="`Editing ${schema.name}`">
    <div class="space-y-8">
      <!-- Editor Header -->
      <div class="glass sticky top-[80px] z-30 -mx-6 px-6 py-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 mb-10 shadow-sm">
        <div class="flex items-center gap-6">
          <Link 
            href="/schemas" 
            class="hidden lg:flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">{{ schema.name }}</h1>
              <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{{ schema.schema_type.name }}</span>
            </div>
            <p class="text-sm text-slate-400 font-medium tracking-tight truncate max-w-sm">{{ schema.schema_id }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto">
          <a
            :href="`/schemas/${schema.id}/export`"
            class="flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-standard active:scale-95 text-sm"
          >
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </a>
          <button
            @click="saveFields"
            :disabled="saving"
            class="flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-white font-bold px-10 py-3.5 rounded-2xl hover:bg-slate-800 transition-standard shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 text-sm"
          >
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
             {{ saving ? 'Syncing...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        <!-- Input Canvas -->
        <div class="space-y-8 pb-32">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Properties Map</h3>
          </div>
          
          <div class="space-y-6">
            <div v-for="field in localFields" :key="field._uid">
              <FieldItem
                :field="field"
                @remove="removeRootField(localFields.indexOf(field))"
                @duplicate="duplicateRootField(localFields.indexOf(field))"
                @update="generatePreview"
              />
            </div>
            
            <div class="pt-6">
              <button
                @click="addRootField"
                class="group flex items-center gap-3 bg-white border-2 border-dashed border-slate-200 w-full py-6 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-standard active:scale-[0.98]"
              >
                <div class="mx-auto flex items-center gap-2">
                  <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-standard">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span class="text-sm font-black uppercase tracking-widest">New Property Layer</span>
                </div>
              </button>
            </div>
            
            <div v-if="localFields.length === 0" class="flex flex-col items-center justify-center py-32 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center px-10">
              <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 class="text-xl font-bold text-slate-900 mb-2 font-display">No Metadata Defined</h4>
              <p class="text-slate-500 font-medium mb-10 max-w-xs">Start configuring your JSON-LD by adding properties to the root level.</p>
              <button 
                @click="addRootField" 
                class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-standard active:scale-95 shadow-lg shadow-blue-100"
              >
                Insert First Property
              </button>
            </div>
          </div>
        </div>

        <!-- Live Intelligence / Preview -->
        <div class="sticky top-[200px] space-y-8">
          <div class="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[75vh]">
            <div class="px-8 py-6 bg-black/40 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-red-500/80 rounded-full"></div>
                <div class="w-3 h-3 bg-amber-500/80 rounded-full"></div>
                <div class="w-3 h-3 bg-emerald-500/80 rounded-full"></div>
                <span class="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Real-time Intelligence
                </span>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click="toggleEditorMode"
                  :class="isEditorMode ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'"
                  class="px-4 py-2 rounded-xl transition-standard border border-white/5 text-[10px] font-black uppercase tracking-widest active:scale-90"
                >
                  {{ isEditorMode ? 'Viewing Highlighted' : 'Edit as Code' }}
                </button>
                <button
                  @click="showImportModal = true"
                  class="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl transition-standard border border-blue-500/20 text-[10px] font-black uppercase tracking-widest active:scale-90"
                >
                  Import Code
                </button>
                <button
                  @click="copyPreview"
                  class="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-3 rounded-xl transition-standard border border-white/5 active:scale-90"
                  title="Copy Code"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="flex-grow p-8 font-mono text-[13px] overflow-auto custom-scrollbar-dark selection:bg-blue-500/30 relative">
              <textarea
                v-if="isEditorMode"
                v-model="editableCode"
                @input="handleCodeInput"
                class="absolute inset-0 w-full h-full p-8 bg-transparent text-slate-300 resize-none border-none focus:ring-0 font-mono text-[13px] custom-scrollbar-dark"
                spellcheck="false"
              ></textarea>
              <pre v-else class="bg-transparent"><code class="grid gap-1"><span v-for="(line, i) in previewLines" :key="i" class="flex gap-6"><span class="text-slate-700 w-8 text-right select-none pr-4 border-r border-slate-800">{{ i + 1 }}</span><span class="text-slate-300 whitespace-pre" v-html="highlight(line)"></span></span></code></pre>
            </div>
            
            <div class="px-8 py-5 bg-black/40 border-t border-white/5 flex flex-col gap-4">
              <!-- Validation Indicators -->
              <div class="flex items-center justify-between">
                <div class="flex gap-4">
                  <div class="flex flex-col">
                    <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Compiler</span>
                    <span :class="syntaxError ? 'text-red-400' : 'text-emerald-400'" class="text-[11px] font-bold">
                      {{ syntaxError ? 'SYNTAX ERROR' : 'READY' }}
                    </span>
                  </div>
                  <div class="w-px h-8 bg-slate-800 mx-2"></div>
                  <div class="flex flex-col">
                     <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                     <span class="text-[11px] text-blue-400 font-bold">JSON-LD 1.1</span>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div v-if="isValidating" class="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div class="flex items-center gap-2 group cursor-help">
                    <span :class="seoErrors.length > 0 || syntaxError ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'" class="w-2 h-2 rounded-full"></span>
                    <span class="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
                      {{ seoErrors.length > 0 || syntaxError ? 'Action Required' : 'SEO Standard Passed' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- SEO Result List -->
              <div v-if="seoErrors.length > 0 || seoWarnings.length > 0" class="pt-4 border-t border-white/5 space-y-3">
                <div v-for="(err, i) in seoErrors" :key="'err-'+i" class="flex gap-3 items-start p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-[11px] text-red-400 font-medium leading-relaxed">{{ err }}</span>
                </div>
                <div v-for="(warn, i) in seoWarnings" :key="'warn-'+i" class="flex gap-3 items-start p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-[11px] text-amber-400 font-medium leading-relaxed">{{ warn }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Import Modal -->
    <div v-if="showImportModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-premium p-12 relative scale-in-center">
        <button @click="showImportModal = false" class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight">Import JSON-LD</h2>
        
        <div class="space-y-8">
          <div class="space-y-3">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Paste code snippet</label>
            <textarea 
              v-model="importCode" 
              rows="8" 
              placeholder='{ "@context": "https://schema.org", ... }' 
              class="w-full px-8 py-6 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-mono text-sm"
            ></textarea>
          </div>

          <button 
            @click="processImport" 
            class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard"
          >
            Populate Form Architecture
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import axios from 'axios'
import AppLayout from '../../Layouts/AppLayout.vue'
import FieldItem from './Components/FieldItem.vue'

import { useToastStore } from '../../stores/useToastStore'

const toastStore = useToastStore()
const props = defineProps({
  schema: Object,
  schemaTypes: Array
})

const generateUid = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

const mapFields = (fields) => {
  return fields.map(f => ({
    ...f,
    _uid: generateUid(),
    children: mapFields(f.recursive_children || f.children || [])
  }))
}

const localFields = ref(props.schema.root_fields ? mapFields(JSON.parse(JSON.stringify(props.schema.root_fields))) : [])
const previewJson = ref('')
const saving = ref(false)
const showImportModal = ref(false)
const importCode = ref('')
const isEditorMode = ref(false)
const editableCode = ref('')
const syntaxError = ref(false)
const seoErrors = ref([])
const seoWarnings = ref([])
const isValidating = ref(false)
let validationTimeout = null

const previewLines = computed(() => previewJson.value.split('\n'))

const addRootField = () => {
  localFields.value.push({
    _uid: generateUid(),
    field_path: '',
    field_type: 'text',
    field_value: '',
    children: []
  })
  generatePreview()
}

const removeRootField = (index) => {
  localFields.value.splice(index, 1)
  generatePreview()
}

const prepareForDuplication = (field) => {
  const newField = { ...field, _uid: generateUid() }
  if (field.children && field.children.length > 0) {
    newField.children = field.children.map(child => prepareForDuplication(child))
  }
  return newField
}

const duplicateRootField = (index) => {
  const fieldToDuplicate = JSON.parse(JSON.stringify(localFields.value[index]))
  const newField = prepareForDuplication(fieldToDuplicate)
  localFields.value.splice(index + 1, 0, newField)
  generatePreview()
}

const processFieldsForPreview = (fields) => {
  const obj = {}
  fields.forEach(field => {
    if (!field.field_path) return

    if (field.field_type === 'object') {
      obj[field.field_path] = processFieldsForPreview(field.children || [])
    } else if (field.field_type === 'array') {
      obj[field.field_path] = (field.children || []).map(child => {
        if (child.field_type === 'object') return processFieldsForPreview(child.children || [])
        return castValue(child.field_value, child.field_type)
      })
    } else {
      obj[field.field_path] = castValue(field.field_value, field.field_type)
    }
  })
  return obj
}

const castValue = (val, type) => {
  if (type === 'number') return parseFloat(val) || 0
  if (type === 'boolean') return val === 'true' || val === true
  return val
}

const generatePreview = () => {
  const result = {
    "@context": "https://schema.org",
    "@type": props.schema.schema_type.name,
    "@id": props.schema.schema_id,
    ...processFieldsForPreview(localFields.value)
  }
  previewJson.value = JSON.stringify(result, null, 2)
  if (!isEditorMode.value) {
    editableCode.value = previewJson.value
  }
  
  // Trigger SEO Validation
  performLiveValidation()
}

const performLiveValidation = () => {
  if (validationTimeout) clearTimeout(validationTimeout)
  
  validationTimeout = setTimeout(async () => {
    try {
      isValidating.value = true
      const parsed = JSON.parse(previewJson.value)
      
      const response = await axios.post('/api/validate-schema', {
        json_ld: parsed
      })
      
      seoErrors.value = response.data.errors || []
      seoWarnings.value = response.data.warnings || []
      isValidating.value = false
    } catch (e) {
      isValidating.value = false
    }
  }, 1000)
}

const getTypeOfValue = (val) => {
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) return 'url'
  return 'text'
}

const jsonToFields = (obj) => {
  return Object.entries(obj)
    .filter(([key]) => !['@context', '@type', '@id'].includes(key))
    .map(([key, value]) => {
      let type = 'text'
      let val = value
      let children = []

      if (Array.isArray(value)) {
        type = 'array'
        val = ''
        children = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return { 
              field_path: '', 
              field_type: 'object', 
              field_value: '', 
              children: jsonToFields(item) 
            }
          } else {
            return { 
              field_path: '', 
              field_type: getTypeOfValue(item), 
              field_value: item, 
              children: [] 
            }
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        type = 'object'
        val = ''
        children = jsonToFields(value)
      } else {
        type = getTypeOfValue(value)
        val = value
      }

      return {
        field_path: key,
        field_type: type,
        field_value: val,
        children: children
      }
    })
}

const processImport = () => {
  try {
    const parsed = JSON.parse(importCode.value)
    const newFields = jsonToFields(parsed)
    localFields.value = [...localFields.value, ...newFields]
    generatePreview()
    showImportModal.value = false
    importCode.value = ''
    toastStore.success('Intelligence Interpreter has expanded the form architecture!')
  } catch (e) {
    toastStore.error('Parse Error: Please ensure you are pasting valid JSON-LD.')
  }
}

const toggleEditorMode = () => {
  isEditorMode.value = !isEditorMode.value
  if (!isEditorMode.value) {
    generatePreview()
  }
}

const handleCodeInput = () => {
  try {
    const parsed = JSON.parse(editableCode.value)
    syntaxError.value = false
    localFields.value = jsonToFields(parsed)
    // We don't call generatePreview here to avoid cursor jump in textarea
    // but we update the internal state
  } catch (e) {
    syntaxError.value = true
  }
}

const saveFields = () => {
  saving.value = true
  router.post(`/schemas/${props.schema.id}/fields/bulk`, {
    fields: localFields.value
  }, {
    onSuccess: () => {
      saving.value = false
    },
    onError: () => {
      saving.value = false
    }
  })
}

const highlight = (line) => {
  return line
    .replace(/"([^"]+)"(?=:)/g, '<span class="text-blue-400">"$1"</span>') // keys
    .replace(/(?<=: )"([^"]+)"/g, '<span class="text-emerald-300">"$1"</span>') // values
    .replace(/(?<=: )(\d+)/g, '<span class="text-amber-400">$1</span>') // numbers
}

const copyPreview = () => {
  navigator.clipboard.writeText(previewJson.value)
  toastStore.success('Optimized JSON-LD copied to clipboard!')
}

onMounted(() => {
  generatePreview()
})
</script>

<style>
.custom-scrollbar-dark::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar-dark::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-left-4 {
  from { transform: translateX(-1rem); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-in {
  animation-fill-mode: both;
}
</style>
