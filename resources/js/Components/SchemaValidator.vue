<template>
  <div class="bg-white rounded-lg shadow border">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Schema Validation
      </h3>
    </div>

    <div class="p-6">
      <div class="flex space-x-4 mb-6">
        <button
          @click="validateSchema"
          :disabled="isValidating"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
        >
          <svg v-if="isValidating" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Validate Schema
        </button>

        <button
          @click="testWithGoogle"
          :disabled="isValidating"
          class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10" />
          </svg>
          Test with Google
        </button>

        <button
          @click="showRequiredFields"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Required Fields
        </button>
      </div>

      <!-- Validation Results -->
      <div v-if="validationResult" class="space-y-4">
        <div class="flex items-center">
          <div :class="validationResult.is_valid ? 'text-green-600' : 'text-red-600'" class="flex items-center">
            <svg v-if="validationResult.is_valid" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="font-semibold">
              {{ validationResult.is_valid ? 'Valid Schema' : 'Invalid Schema' }}
            </span>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="validationResult.errors && validationResult.errors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 class="text-sm font-medium text-red-800 mb-2">Errors:</h4>
          <ul class="text-sm text-red-700 space-y-1">
            <li v-for="error in validationResult.errors" :key="error" class="flex items-start">
              <span class="text-red-500 mr-2">•</span>
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- Warnings -->
        <div v-if="validationResult.warnings && validationResult.warnings.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 class="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
          <ul class="text-sm text-yellow-700 space-y-1">
            <li v-for="warning in validationResult.warnings" :key="warning" class="flex items-start">
              <span class="text-yellow-500 mr-2">•</span>
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Google Test Results -->
      <div v-if="googleTestResult" class="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 class="text-sm font-medium text-blue-800 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2" />
          </svg>
          Google Rich Results Test
        </h4>
        
        <div class="text-sm text-blue-700 mb-3">
          <ol class="list-decimal list-inside space-y-1">
            <li v-for="instruction in googleTestResult.google_test_instructions" :key="instruction">
              {{ instruction }}
            </li>
          </ol>
        </div>

        <div class="flex space-x-3">
          <button
            @click="copyJsonLd"
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Copy JSON-LD
          </button>
          
          <a
            :href="googleTestResult.test_url"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
          >
            Open Google Test Tool
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Required Fields Modal -->
      <div v-if="showRequiredModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeRequiredModal">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white" @click.stop>
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Required Fields for {{ schema?.schema_type?.name }}</h3>
            
            <div v-if="requiredFieldsData" class="text-sm text-gray-700">
              <div v-if="requiredFieldsData.has_rules">
                <h4 class="font-medium mb-2">Validation Rules:</h4>
                <div class="bg-gray-50 rounded p-3">
                  <pre class="whitespace-pre-wrap">{{ JSON.stringify(requiredFieldsData.validation_rules, null, 2) }}</pre>
                </div>
              </div>
              <div v-else class="text-gray-500">
                No specific validation rules defined for this schema type.
              </div>
            </div>
            
            <div class="flex justify-end mt-6">
              <button
                @click="closeRequiredModal"
                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import axios from 'axios'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  }
})

const isValidating = ref(false)
const validationResult = ref(null)
const googleTestResult = ref(null)
const showRequiredModal = ref(false)
const requiredFieldsData = ref(null)

const validateSchema = async () => {
  isValidating.value = true
  try {
    const response = await axios.get(`/schemas/${props.schema.id}/validate`)
    validationResult.value = response.data
  } catch (error) {
    console.error('Validation error:', error)
  } finally {
    isValidating.value = false
  }
}

const testWithGoogle = async () => {
  isValidating.value = true
  try {
    const response = await axios.get(`/schemas/${props.schema.id}/test-google`)
    googleTestResult.value = response.data
  } catch (error) {
    console.error('Google test error:', error)
  } finally {
    isValidating.value = false
  }
}

const showRequiredFields = async () => {
  if (!props.schema.schema_type_id) return
  
  try {
    const response = await axios.get(`/schema-types/${props.schema.schema_type_id}/required-fields`)
    requiredFieldsData.value = response.data
    showRequiredModal.value = true
  } catch (error) {
    console.error('Required fields error:', error)
  }
}

const closeRequiredModal = () => {
  showRequiredModal.value = false
  requiredFieldsData.value = null
}

const copyJsonLd = async () => {
  if (googleTestResult.value?.json_ld) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(googleTestResult.value.json_ld, null, 2))
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy JSON-LD:', error)
    }
  }
}
</script>