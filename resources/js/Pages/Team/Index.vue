<template>
  <AppLayout title="Team Members">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p class="text-slate-500 mt-2">Manage members of <span class="font-bold text-slate-700">{{ organization.name }}</span>.</p>
        </div>
        
        <button 
          v-if="currentUserRole !== 'member'"
          @click="showInviteModal = true"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Invite Member
        </button>
      </div>

      <!-- Members List -->
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div class="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-xl font-bold text-slate-900">Active Members</h2>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="member in members" :key="member.id" class="p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden">
                <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" class="w-full h-full object-cover">
                <span v-else>{{ member.name.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-bold text-slate-900">{{ member.name }}</p>
                <p class="text-sm text-slate-500">{{ member.email }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-6">
              <div class="flex flex-col items-end">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  :class="{
                    'bg-purple-100 text-purple-700': member.role === 'owner',
                    'bg-blue-100 text-blue-700': member.role === 'admin',
                    'bg-slate-100 text-slate-600': member.role === 'member'
                  }"
                >
                  {{ member.role }}
                </span>
              </div>
              
              <div v-if="currentUserRole === 'owner' && member.id !== $page.props.auth.user.id" class="relative">
                <button 
                  @click="removeMember(member.id)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-standard"
                  title="Remove Member"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Invitations -->
      <div v-if="invitations.length > 0" class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
        <div class="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-xl font-bold text-slate-900">Pending Invitations</h2>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="invite in invitations" :key="invite.id" class="p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="font-bold text-slate-900">{{ invite.email }}</p>
                <p class="text-sm text-slate-500">Invited as <span class="font-semibold text-slate-700">{{ invite.role }}</span></p>
              </div>
            </div>
            
            <button 
              @click="cancelInvite(invite.id)"
              class="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>

      <!-- Invite Modal (Simple) -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="showInviteModal = false">
          <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h3 class="text-2xl font-bold text-slate-900 mb-6">Invite Team Member</h3>
            
            <form @submit.prevent="submitInvite" class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Email Address</label>
                <input 
                  v-model="inviteForm.email"
                  type="email" 
                  placeholder="colleague@example.com"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                >
                <div v-if="inviteForm.errors.email" class="text-red-500 text-sm font-medium">{{ inviteForm.errors.email }}</div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Role</label>
                <select 
                  v-model="inviteForm.role"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium bg-white"
                >
                  <option value="member">Member (Read/Write)</option>
                  <option value="admin">Admin (Manage Users)</option>
                </select>
              </div>

              <div class="flex gap-4 pt-2">
                <button 
                  type="button" 
                  @click="showInviteModal = false"
                  class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  :disabled="inviteForm.processing"
                  class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

const props = defineProps({
  organization: Object,
  members: Array,
  invitations: Array,
  currentUserRole: String
})

const showInviteModal = ref(false)

const inviteForm = useForm({
  email: '',
  role: 'member'
})

const submitInvite = () => {
  inviteForm.post(route('team-invitations.store'), {
    onSuccess: () => {
      showInviteModal.value = false
      inviteForm.reset()
    }
  })
}

const removeMember = (id) => {
  if (confirm('Are you sure you want to remove this member?')) {
    router.delete(route('team-members.destroy', id))
  }
}

const cancelInvite = (id) => {
  if (confirm('Revoke this invitation?')) {
    router.delete(route('team-invitations.destroy', id))
  }
}
</script>
