<template>
  <div class="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
    <Toaster />
    <!-- Background Accents -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

    <!-- Content Area -->
    <div class="flex-grow flex flex-col justify-center py-12 md:py-24">
      <div class="relative z-10 w-full max-w-md mx-auto px-6">
        <!-- Logo/Brand -->
        <div class="text-center mb-10">
          <div class="flex flex-col items-center justify-center mb-4">
            <BrandLogo />
          </div>
          <p class="text-slate-500 font-medium mt-4">Thanks for signing up! Please verify your email address to get started.</p>
        </div>

        <!-- Verification Card -->
        <div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8">
          <div class="mb-6 text-sm text-slate-600 leading-relaxed text-center">
            Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.
          </div>

          <div v-if="verificationLinkSent" class="mb-6 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-600 text-center animate-in fade-in slide-in-from-top-2 duration-500">
            A new verification link has been sent to the email address you provided during registration.
          </div>

          <form @submit.prevent="submit" class="space-y-4">
            <button
              type="submit"
              :disabled="form.processing"
              class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
            >
              <span v-if="!form.processing">Resend Verification Email</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            </button>

            <button
              type="button"
              @click="logout"
              class="w-full py-3.5 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98] text-center"
            >
              Log Out
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Persistent Legal Footer -->
    <footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto">
      <div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-500 text-sm font-medium">© 2026 {{ $page.props.branding?.site_name || 'MetaPilot' }} • AI-Powered SEO Management</p>
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
import { computed } from 'vue';
import { useForm, router } from '@inertiajs/vue3';
import BrandLogo from '../../Components/BrandLogo.vue';
import { useToastStore } from '@/stores/useToastStore';
import Toaster from '@/Components/Toaster.vue';

const props = defineProps({
  status: String,
});

const toast = useToastStore();
const form = useForm({});

const submit = () => {
  form.post(route('verification.send'), {
    onSuccess: () => {
      toast.success('Verification link sent successfully!');
    },
    onError: () => {
      toast.error('Failed to send verification link. Please try again.');
    }
  });
};

const logout = () => {
  router.post(route('logout'));
};

const verificationLinkSent = computed(() => props.status === 'verification-link-sent');
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

.animate-in {
    animation-duration: 0.5s;
    animation-fill-mode: both;
}
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes slide-in-from-top-2 {
    from { transform: translateY(-0.5rem); }
    to { transform: translateY(0); }
}
.fade-in { animation-name: fade-in; }
.slide-in-from-top-2 { animation-name: slide-in-from-top-2; }
</style>
