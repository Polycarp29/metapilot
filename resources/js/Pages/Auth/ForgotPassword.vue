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
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Reset Password</h1>
          <p class="text-slate-500 font-medium">No worries, we'll send you instructions.</p>
        </div>

        <!-- Forgot Password Card -->
        <div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8">
          <div v-if="status" class="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-sm font-semibold text-green-600 animate-in fade-in slide-in-from-top-4 duration-500">
            {{ status }}
          </div>

          <form @submit.prevent="submit" class="space-y-6">
            <!-- Email Input -->
            <div>
              <label for="email" class="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</label>
              <div class="relative group">
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  autocomplete="email"
                  class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                  placeholder="name@company.com"
                />
                <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <p v-if="form.errors.email" class="mt-2 text-xs font-medium text-red-500 ml-1">{{ form.errors.email }}</p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="form.processing"
              class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
            >
              <span v-if="!form.processing">Send Reset Link</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            </button>
          </form>
        </div>

        <!-- Footer Links -->
        <p class="text-center text-sm font-medium text-slate-500 mb-12">
          Remembered your password?
          <a :href="route('login')" class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all">Back to sign in</a>
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
import { useForm } from '@inertiajs/vue3';

defineProps({
  status: String,
});

const form = useForm({
  email: '',
});

function submit() {
  form.post(route('password.email'));
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
