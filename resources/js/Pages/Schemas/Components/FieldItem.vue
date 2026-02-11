<template>
  <div class="group/item relative bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 transition-standard hover:shadow-premium hover:border-blue-100 hover:bg-white active:scale-[0.99] animate-in fade-in slide-in-from-left-4 duration-300">
    <div class="flex items-start justify-between gap-6">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow">
        <!-- Field Path (Key) -->
        <div class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Property Key</label>
          <input
            v-model="field.field_path"
            type="text"
            placeholder="e.g., name, @type"
            class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-medium placeholder:text-slate-300"
            @input="$emit('update')"
          />
        </div>

        <!-- Field Type -->
        <div class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Structure</label>
          <div class="relative">
            <select
              v-model="field.field_type"
              class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-bold text-slate-700 appearance-none"
              @change="handleTypeChange"
            >
              <option value="text">String / Text</option>
              <option value="number">Numeric</option>
              <option value="boolean">Boolean</option>
              <option value="url">Link / URL</option>
              <option value="object">Nested Object</option>
              <option value="array">List / Array</option>
            </select>
          </div>
        </div>

        <!-- Field Value -->
        <div v-if="!['object', 'array'].includes(field.field_type)" class="space-y-2 lg:col-span-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment</label>
          <div class="relative">
            <input
              v-if="field.field_type !== 'boolean'"
              v-model="field.field_value"
              :type="field.field_type === 'number' ? 'number' : 'text'"
              placeholder="Enter value..."
              class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-medium placeholder:text-slate-300"
              @input="$emit('update')"
            />
            <select
              v-else
              v-model="field.field_value"
              class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-bold appearance-none"
              @change="$emit('update')"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        </div>
        
        <!-- Nested Info -->
        <div v-else class="flex items-center h-full pt-6 lg:col-span-2">
          <div class="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
            <div :class="field.field_type === 'object' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'" class="w-2 h-2 rounded-full animate-pulse"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              {{ field.field_type === 'object' ? 'Container Object Active' : 'Sequential List Active' }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-standard">
        <!-- Duplicate Button -->
        <button
          @click="$emit('duplicate')"
          class="p-2 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-standard active:scale-90"
          title="Duplicate property"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>

        <!-- Remove Button -->
        <button
          @click="$emit('remove')"
          class="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-standard active:scale-90"
          title="Remove property"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Nested Fields (Recursion) -->
    <div v-if="['object', 'array'].includes(field.field_type)" class="pl-8 border-l-2 border-slate-100 mt-6 space-y-6">
      <div v-for="(child, index) in field.children" :key="index">
        <FieldItem
          :field="child"
          @remove="removeChild(index)"
          @duplicate="duplicateChild(index)"
          @update="$emit('update')"
        />
      </div>
      
      <button
        type="button"
        @click="addChild"
        class="group/add w-full py-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] hover:border-blue-200 hover:bg-blue-50/50 transition-standard flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        <div class="w-8 h-8 bg-blue-50 group-hover/add:bg-blue-600 group-hover/add:text-white rounded-lg flex items-center justify-center text-blue-600 transition-standard">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span class="text-xs font-black text-slate-400 group-hover/add:text-blue-600 uppercase tracking-widest transition-standard">
          Add New {{ field.field_type === 'object' ? 'Member Property' : 'Array Item' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  field: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['remove', 'duplicate', 'update'])

const handleTypeChange = () => {
  if (['object', 'array'].includes(props.field.field_type)) {
    if (!props.field.children) {
      props.field.children = []
    }
  }
  emit('update')
}

const addChild = () => {
  if (!props.field.children) {
    props.field.children = []
  }
  props.field.children.push({
    field_path: props.field.field_type === 'array' ? '' : '',
    field_type: 'text',
    field_value: '',
    children: []
  })
  emit('update')
}

const removeChild = (index) => {
  props.field.children.splice(index, 1)
  emit('update')
}

const duplicateChild = (index) => {
  const childToDuplicate = JSON.parse(JSON.stringify(props.field.children[index]))
  props.field.children.splice(index + 1, 0, childToDuplicate)
  emit('update')
}
</script>
