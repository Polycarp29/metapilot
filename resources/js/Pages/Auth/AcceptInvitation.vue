<template>
  <div class="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
    <!-- Background Accents -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

    <!-- Content Area -->
    <div class="flex-grow flex flex-col justify-center py-12 md:py-24">
      <div class="relative z-10 w-full max-w-md mx-auto px-6">
        <!-- Logo/Brand -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-premium mb-4">
            <svg class="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Join Workspace</h1>
          <p class="text-slate-500 font-medium">You've been invited to join <strong>{{ invitation.organization.name }}</strong>.</p>
        </div>

        <!-- Invitation Card -->
        <div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8">
          <div v-if="invitation.project" class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
            <div class="p-3 bg-blue-100/50 rounded-xl text-blue-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <div>
              <p class="text-xs font-bold text-blue-500 uppercase tracking-wider">Assigned Project</p>
              <p class="text-sm font-bold text-slate-800">{{ invitation.project.name }}</p>
            </div>
          </div>

          <form @submit.prevent="submit" class="space-y-5">
            <div v-if="!userExists">
              <!-- Name Input -->
              <div class="mb-5">
                <label for="name" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Your Full Name</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300"
                  placeholder="John Doe"
                />
                <p v-if="form.errors.name" class="mt-2 text-xs font-medium text-red-500 ml-1">{{ form.errors.name }}</p>
              </div>

              <!-- Password Input -->
              <div class="mb-5">
                <label for="password" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Create Password</label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300"
                  placeholder="••••••••"
                />
                <p v-if="form.errors.password" class="mt-2 text-xs font-medium text-red-500 ml-1">{{ form.errors.password }}</p>
              </div>

              <!-- Password Confirmation -->
              <div>
                <label for="password_confirmation" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Confirm Password</label>
                <input
                  id="password_confirmation"
                  v-model="form.password_confirmation"
                  type="password"
                  required
                  class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div v-else class="text-center py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
              <p class="text-sm text-slate-600">You already have an account with <strong>{{ invitation.email }}</strong>. Click below to accept the invitation and join.</p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="form.processing"
              class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
            >
              <span v-if="!form.processing">{{ !userExists ? 'Create Account & Join' : 'Accept Invitation & Join' }}</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            </button>
          </form>
        </div>

        <!-- Footer Links -->
        <p class="text-center text-sm font-medium text-slate-500 mb-12">
          Signed in as another user?
          <button @click="logout" class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all">Switch Account</button>
        </p>
      </div>
    </div>

    <!-- Persistent Legal Footer -->
    <footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto">
      <div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-500 text-sm font-medium">© 2026 MetaPilot • AI-Powered SEO Management</p>
        <div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest">
          <a :href="route('privacy')" class="text-slate-400 hover:text-primary transition-colors">Privacy</a>
          <a :href="route('terms')" class="text-slate-400 hover:text-primary transition-colors">Terms</a>
          <a :href="route('cookies')" class="text-slate-400 hover:text-primary transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useForm, router } from '@inertiajs/vue3';

const props = defineProps({
  invitation: Object,
  userExists: Boolean,
});

const form = useForm({
  name: '',
  password: '',
  password_confirmation: '',
  user_exists: props.userExists,
});

const submit = () => {
  form.post(route('invitations.accept', { token: props.invitation.token }));
};

const logout = () => {
  router.post(route('logout'));
};
</script>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
</style>
