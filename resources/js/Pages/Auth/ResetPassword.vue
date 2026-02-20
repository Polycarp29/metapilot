<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden font-sans">
    <!-- Background Accents -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

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
        <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">New Password</h1>
        <p class="text-slate-500 font-medium">Set your fresh credentials below.</p>
      </div>

      <!-- Reset Password Card -->
      <div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8">
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Email Input (Hidden or Read-only) -->
          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              readonly
              class="block w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">New Password</label>
            <div class="relative group">
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                autocomplete="new-password"
                class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                placeholder="••••••••"
              />
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
            </div>
            <p v-if="form.errors.password" class="mt-2 text-xs font-medium text-red-500 ml-1">{{ form.errors.password }}</p>
          </div>

          <!-- Password Confirmation -->
          <div>
            <label for="password_confirmation" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Confirm New Password</label>
            <div class="relative group">
              <input
                id="password_confirmation"
                v-model="form.password_confirmation"
                type="password"
                required
                autocomplete="new-password"
                class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                placeholder="••••••••"
              />
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="form.processing"
            class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
          >
            <span v-if="!form.processing">Reset Password</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          </button>
        </form>
      <!-- Footer Links -->
      <p class="text-center text-sm font-medium text-slate-500 mb-12">
        Need help?
        <a href="mailto:support@metapilot.ai" class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all">Contact support</a>
      </p>
    </div>

    <!-- Persistent Legal Footer -->
    <footer class="relative z-10 py-8 border-t border-slate-200/50 mt-auto">
      <div class="max-w-md mx-auto px-6 flex flex-col items-center gap-4">
        <div class="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest">
          <a :href="route('privacy')" class="text-slate-400 hover:text-primary transition-colors">Privacy Policy</a>
          <a :href="route('terms')" class="text-slate-400 hover:text-primary transition-colors">Terms of Service</a>
          <a :href="route('cookies')" class="text-slate-400 hover:text-primary transition-colors">Cookie Policy</a>
        </div>
        <p class="text-slate-400 text-[10px] font-medium tracking-wider">© 2026 MetaPilot • AI-POWERED SEO</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3';

const props = defineProps({
  email: String,
  token: String,
});

const form = useForm({
  token: props.token,
  email: props.email,
  password: '',
  password_confirmation: '',
});

function submit() {
  form.post(route('password.store'), {
    onFinish: () => form.reset('password', 'password_confirmation'),
  });
}
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
