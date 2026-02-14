<template>
  <AppLayout title="Organization Settings">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="border-b border-slate-200 pb-5">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p class="text-slate-500 mt-2">Manage your workspace configuration, personal account, and team members.</p>
      </div>

      <!-- Tabs -->
      <div class="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === tab.id 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- General Tab -->
      <div v-if="activeTab === 'general'" class="space-y-6 animate-fade-in">
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Workspace Details</h2>
          <form @submit.prevent="updateOrganization" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Organization Name</label>
              <input 
                v-model="orgForm.name"
                type="text" 
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
              >
              <div v-if="orgForm.errors.name" class="text-red-500 text-sm font-medium">{{ orgForm.errors.name }}</div>
            </div>
            
            <div class="flex justify-end">
              <button 
                type="submit" 
                :disabled="orgForm.processing"
                class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Account Tab (Moved from Profile) -->
      <div v-if="activeTab === 'account'" class="space-y-6 animate-fade-in">
        <!-- Update Profile Information -->
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
          <form @submit.prevent="updateProfileInformation" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Name</label>
                <input v-model="profileForm.name" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
                <div v-if="profileForm.errors.name" class="text-red-500 text-sm font-medium">{{ profileForm.errors.name }}</div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Email</label>
                <input v-model="profileForm.email" type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
                <div v-if="profileForm.errors.email" class="text-red-500 text-sm font-medium">{{ profileForm.errors.email }}</div>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="submit" :disabled="profileForm.processing" class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70">Save Profile</button>
            </div>
          </form>
        </div>

        <!-- Update Password -->
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-6">Update Password</h2>
          <form @submit.prevent="updatePassword" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700">Current Password</label>
              <input v-model="passwordForm.current_password" type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
              <div v-if="passwordForm.errors.current_password" class="text-red-500 text-sm font-medium">{{ passwordForm.errors.current_password }}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">New Password</label>
                <input v-model="passwordForm.password" type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
                 <div v-if="passwordForm.errors.password" class="text-red-500 text-sm font-medium">{{ passwordForm.errors.password }}</div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Confirm Password</label>
                <input v-model="passwordForm.password_confirmation" type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="submit" :disabled="passwordForm.processing" class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70">Update Password</button>
            </div>
          </form>
        </div>
      </div>

      <!-- AI Configuration Tab -->
      <div v-if="activeTab === 'ai'" class="space-y-6 animate-fade-in">
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <div>
               <h2 class="text-xl font-bold text-slate-900">AI Configuration</h2>
               <p class="text-sm text-slate-500">System-wide AI settings are managed by administrators.</p>
            </div>
          </div>
          
          <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
            <!-- Model Selection -->
            <div class="space-y-4">
              <label class="block font-bold text-slate-700">Generative AI Model</label>
              <div class="relative">
                 <select v-model="orgForm.settings.ai_model" class="w-full bg-slate-50 border-slate-200 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                  <template v-if="aiModels && aiModels.length">
                     <option v-for="model in aiModels" :key="model.id" :value="model.id">{{ model.name }}</option>
                  </template>
                  <template v-else>
                     <option value="gpt-4o">GPT-4o</option>
                     <option value="gpt-4">GPT-4</option>
                     <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </template>
                </select>
                <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <p class="text-sm text-slate-500">Select the underlying intelligence engine for your automated schema analysis. 'User Based' configuration applies to this entire organization.</p>
            </div>

            <div class="space-y-4 pt-6 border-t border-slate-100">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-bold text-slate-900 text-lg">Enable AI Insights</p>
                        <p class="text-sm text-slate-500">Automatically generate SEO performance summaries and keyword strategies.</p>
                    </div>
                    <button 
                        type="button"
                        @click="orgForm.settings.ai_insights_enabled = !orgForm.settings.ai_insights_enabled"
                        class="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                        :class="orgForm.settings.ai_insights_enabled ? 'bg-purple-600' : 'bg-slate-200'"
                    >
                        <span 
                            class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                            :class="orgForm.settings.ai_insights_enabled ? 'translate-x-5' : 'translate-x-0'"
                        />
                    </button>
                </div>
            </div>

            <div class="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
               <div class="text-blue-500 shrink-0">
                 <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p class="text-sm text-blue-800 leading-relaxed">
                 <strong>Note:</strong> This setting controls the analysis phase logic. AI Insights require an active OpenAI API key to be configured in the system environment.
               </p>
            </div>

            <div class="pt-4 flex justify-end">
               <button 
                @click="updateOrganization"
                :disabled="orgForm.processing"
                class="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-standard shadow-lg active:scale-95 disabled:opacity-50"
              >
                {{ orgForm.processing ? 'Saving...' : 'Save Configuration' }}
              </button>
            </div>
          </div>
        </div>
      </div>

       <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="space-y-6 animate-fade-in">
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8">
           <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
            </div>
            <div>
               <h2 class="text-xl font-bold text-slate-900">Analytics Settings</h2>
               <p class="text-sm text-slate-500">Configure how data is reported in your dashboard.</p>
            </div>
          </div>

          <div class="space-y-10">
            <!-- Property Connection Form -->
            <div class="p-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-slate-900">Connect GA4 Property</h3>
                <a 
                  :href="route('auth.google.redirect')" 
                  class="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold hover:shadow-md transition-all text-sm"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-5 h-5" alt="Google">
                  Connect Google Account
                </a>
              </div>

              <div v-if="$page.props.flash.message" class="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium text-sm">
                {{ $page.props.flash.message }}
              </div>

              <form @submit.prevent="addProperty" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                  <label class="text-sm font-bold text-slate-700">Display Name</label>
                  <input v-model="propertyForm.name" type="text" placeholder="e.g. My Main Site" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white">
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-bold text-slate-700">GA4 Property ID</label>
                  <input v-model="propertyForm.property_id" type="text" placeholder="e.g. 123456789" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white">
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-bold text-slate-700">Website URL</label>
                  <input v-model="propertyForm.website_url" type="url" placeholder="https://example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white">
                </div>
                <div class="md:col-span-3 flex justify-end">
                  <button type="submit" :disabled="propertyForm.processing" class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    {{ propertyForm.processing ? 'Connecting...' : 'Connect Property' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Connected Properties List -->
            <div class="space-y-6">
              <div class="flex items-center justify-between px-2">
                <h3 class="text-lg font-bold text-slate-900">Connected GA4 Properties</h3>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ analyticsProperties.length }} Properties</span>
              </div>
              
              <div v-if="analyticsProperties.length" class="grid grid-cols-1 gap-4">
                <div v-for="prop in analyticsProperties" :key="prop.id" class="p-6 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div class="flex items-center gap-5">
                    <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <p class="font-bold text-slate-900">{{ prop.name }}</p>
                      <p class="text-sm text-slate-400 font-medium">ID: {{ prop.property_id }} • {{ prop.website_url }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <button @click="disconnectProperty(prop.id)" class="text-slate-400 hover:text-red-600 font-bold text-sm transition-colors">Disconnect</button>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p class="text-slate-500 font-medium">No properties connected yet.</p>
              </div>
            </div>

            <div class="pt-10 border-t border-slate-100">
              <h3 class="text-lg font-bold text-slate-900 mb-6">General Preferences</h3>
              <form @submit.prevent="updateOrganization" class="space-y-6">
                <div class="space-y-2">
                  <label class="text-sm font-bold text-slate-700">Default Reporting Period</label>
                  <select v-model="orgForm.settings.analytics_period" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-standard outline-none font-medium">
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
                
                <div class="space-y-4 pt-4 border-t border-slate-100">
                  <div class="flex items-center justify-between">
                      <div>
                          <p class="font-bold text-slate-900">Weekly Email Reports</p>
                          <p class="text-sm text-slate-500">Receive a summary of your schema performance every Monday.</p>
                      </div>
                      <button 
                          type="button"
                          @click="orgForm.settings.notifications_enabled = !orgForm.settings.notifications_enabled"
                          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                          :class="orgForm.settings.notifications_enabled ? 'bg-blue-600' : 'bg-slate-200'"
                      >
                          <span 
                              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                              :class="orgForm.settings.notifications_enabled ? 'translate-x-5' : 'translate-x-0'"
                          />
                      </button>
                  </div>
                </div>

                <div class="flex justify-end">
                  <button type="submit" :disabled="orgForm.processing" class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70">Save Preferences</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Tab -->
      <div v-if="activeTab === 'team'" class="space-y-6 animate-fade-in">
         <!-- Existing Team UI -->
         <div class="flex justify-between items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
            <div>
              <h3 class="font-bold text-blue-900">Invite Team Members</h3>
              <p class="text-sm text-blue-700">Add colleagues to collaborate on schemas.</p>
            </div>
            <button 
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
                <div class="flex items-center gap-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {{ member.role }}
                  </span>
                   <button 
                      v-if="currentUserRole === 'owner' && member.id !== $page.props.auth.user.id"
                      @click="removeMember(member.id)"
                      class="text-slate-400 hover:text-red-600 transition-colors p-2"
                    >
                      Remove
                   </button>
                </div>
              </div>
            </div>
         </div>
         
         <!-- Pending Invitations -->
         <div v-if="invitations.length > 0">
            <h3 class="text-lg font-bold text-slate-900 mb-4 ml-2">Pending Invitations</h3>
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                <div class="divide-y divide-slate-100">
                  <div v-for="invite in invitations" :key="invite.id" class="p-6 flex items-center justify-between">
                    <div>
                        <p class="font-bold text-slate-900">{{ invite.email }}</p>
                        <p class="text-sm text-slate-500">Role: {{ invite.role }}</p>
                    </div>
                    <button @click="cancelInvite(invite.id)" class="text-red-600 font-bold text-sm hover:underline">Revoke</button>
                  </div>
                </div>
            </div>
         </div>
      </div>

      <!-- Invoke Modals -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="showInviteModal = false">
          <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 class="text-2xl font-bold text-slate-900 mb-6">Invite Team Member</h3>
            <form @submit.prevent="submitInvite" class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Email Address</label>
                <input v-model="inviteForm.email" type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium">
                <div v-if="inviteForm.errors.email" class="text-red-500 text-sm font-medium">{{ inviteForm.errors.email }}</div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700">Role</label>
                <select v-model="inviteForm.role" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="flex gap-4 pt-2">
                <button type="button" @click="showInviteModal = false" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" :disabled="inviteForm.processing" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <ConfirmationModal 
        :show="showConfirmModal"
        :title="confirmTitle"
        :message="confirmMessage"
        :confirm-text="confirmButtonText"
        @close="showConfirmModal = false"
        @confirm="executeConfirm"
      />

    </div>
  </AppLayout>
</template>



<script setup>
import { ref, onMounted } from 'vue'
import { useForm, router, usePage } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import ConfirmationModal from '../../Components/ConfirmationModal.vue'

const props = defineProps({
  organization: Object,
  members: Array,
  invitations: Array,
  currentUserRole: String,
  aiModels: Array,
  analyticsProperties: Array
})

const page = usePage()
const authUser = page.props.auth.user

const tabs = [
  { id: 'general', name: 'General' },
  { id: 'account', name: 'Account' },
  { id: 'ai', name: 'AI Configuration' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'team', name: 'Team Members' }
]

const activeTab = ref('general')

onMounted(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && tabs.find(t => t.id === tab)) {
        activeTab.value = tab
    }
})
const showInviteModal = ref(false)

// Confirmation Modal State
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
const confirmButtonText = ref('Confirm')

// Organization Form
const orgForm = useForm({
  name: props.organization.name,
  settings: {
     ai_model: props.organization.settings?.ai_model || 'gpt-4',
     ai_insights_enabled: props.organization.settings?.ai_insights_enabled !== false,
     analytics_period: props.organization.settings?.analytics_period || '30d',
     notifications_enabled: props.organization.settings?.notifications_enabled || false
  }
})

// Property Form
const propertyForm = useForm({
  name: '',
  property_id: '',
  website_url: ''
})

// Invite Form
const inviteForm = useForm({
  email: '',
  role: 'member'
})

// Profile Form
const profileForm = useForm({
  name: authUser.name,
  email: authUser.email
})

// Password Form
const passwordForm = useForm({
  current_password: '',
  password: '',
  password_confirmation: ''
})

const updateOrganization = () => {
    orgForm.put(route('organization.update'), {
        preserveScroll: true
    })
}

// Account Logic
const updateProfileInformation = () => {
  profileForm.patch(route('profile.update'), {
    preserveScroll: true
  })
}

const updatePassword = () => {
  passwordForm.put(route('password.update'), {
    preserveScroll: true,
    onSuccess: () => passwordForm.reset(),
    onError: () => {
      if (passwordForm.errors.password) {
        passwordForm.reset('password', 'password_confirmation')
      }
      if (passwordForm.errors.current_password) {
        passwordForm.reset('current_password')
      }
    }
  })
}

const addProperty = () => {
    propertyForm.post(route('analytics.properties.store'), {
        onSuccess: () => propertyForm.reset(),
        preserveScroll: true
    })
}

const disconnectProperty = (id) => {
    openConfirmModal(
        'Disconnect GA4 Property',
        'Are you sure you want to disconnect this GA4 property? Historical data will remain but no new data will be fetched.',
        () => router.delete(route('analytics.properties.destroy', id)),
        'Disconnect Property'
    )
}

const submitInvite = () => {
  inviteForm.post(route('team-invitations.store'), {
    onSuccess: () => {
      showInviteModal.value = false
      inviteForm.reset()
    }
  })
}

const openConfirmModal = (title, message, action, buttonText = 'Confirm') => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmAction.value = action
  confirmButtonText.value = buttonText
  showConfirmModal.value = true
}

const executeConfirm = () => {
  if (confirmAction.value) {
    confirmAction.value()
  }
  showConfirmModal.value = false
}

const removeMember = (id) => {
  openConfirmModal(
    'Remove Team Member',
    'Are you sure you want to remove this member from the organization? They will lose access immediately.',
    () => router.delete(route('team-members.destroy', id)),
    'Remove Member'
  )
}

const cancelInvite = (id) => {
  openConfirmModal(
    'Revoke Invitation',
    'Are you sure you want to revoke this invitation? The link sent to the user will become invalid.',
    () => router.delete(route('team-invitations.destroy', id)),
    'Revoke Invitation'
  )
}
</script>
