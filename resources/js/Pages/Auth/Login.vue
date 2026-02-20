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
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Metapilot</h1>
          <p class="text-slate-500 font-medium">Welcome back! Please enter your details.</p>
        </div>

        <!-- Login Card -->
        <div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8">
          <form @submit.prevent="submit" class="space-y-5">
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

            <!-- Password Input -->
            <div>
              <div class="flex items-center justify-between mb-2 ml-1">
                <label for="password" class="text-sm font-semibold text-slate-700">Password</label>
                <a :href="route('password.request')" class="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Forgot Password?</a>
              </div>
              <div class="relative group">
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  autocomplete="current-password"
                  class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300"
                  placeholder="••••••••"
                />
                <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
              </div>
              <p v-if="form.errors.password" class="mt-2 text-xs font-medium text-red-500 ml-1">{{ form.errors.password }}</p>
            </div>

            <!-- Options -->
            <div class="flex items-center">
              <input
                id="remember"
                v-model="form.remember"
                type="checkbox"
                class="h-4 w-4 text-primary focus:ring-primary/20 border-slate-300 rounded-lg cursor-pointer"
              />
              <label for="remember" class="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">Keep me signed in</label>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="form.processing"
              class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
            >
              <span v-if="!form.processing">Sign In</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            </button>
          </form>

          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-slate-200"></span>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-transparent text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <!-- Social Login -->
          <a
            :href="route('auth.google')"
            class="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98]"
          >
            <svg class="w-5 h-5 px-0.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </a>
        </div>

        <!-- Footer Links -->
        <p class="text-center text-sm font-medium text-slate-500 mb-12">
          Don't have an account?
          <a :href="route('register')" class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all">Sign up now</a>
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

const form = useForm({
  email: '',
  password: '',
  remember: false,
});

function submit() {
  form.post(route('login'));
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
