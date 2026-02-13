<template>
  <AppLayout title="Profile">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <p class="text-slate-500 mt-2">Manage your account settings and preferences.</p>
      </div>

      <!-- Profile Form -->
      <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium">
        <form @submit.prevent="form.patch('/profile')" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Full Name</label>
              <input 
                v-model="form.name"
                type="text" 
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
              >
              <div v-if="form.errors.name" class="text-red-500 text-sm font-medium">{{ form.errors.name }}</div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Email Address</label>
              <input 
                v-model="form.email"
                type="email" 
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium text-slate-500 bg-slate-50"
              >
              <div v-if="form.errors.email" class="text-red-500 text-sm font-medium">{{ form.errors.email }}</div>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100">
            <h3 class="text-lg font-bold text-slate-900 mb-4">Change Password</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">New Password</label>
                <input 
                  v-model="form.password"
                  type="password" 
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                  placeholder="Leave blank to keep current"
                >
                <div v-if="form.errors.password" class="text-red-500 text-sm font-medium">{{ form.errors.password }}</div>
              </div>
              
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Confirm Password</label>
                <input 
                  v-model="form.password_confirmation"
                  type="password" 
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                >
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-6">
            <button 
              type="submit" 
              :disabled="form.processing"
              class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

const props = defineProps({
  user: Object,
  status: String
})

const form = useForm({
  name: props.user.name,
  email: props.user.email,
  password: '',
  password_confirmation: ''
})
</script>
