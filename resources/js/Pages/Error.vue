<template>
  <div class="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
    <!-- Background Accents -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

    <div class="flex-grow flex flex-col justify-center py-12 md:py-24">
      <div class="relative z-10 w-full max-w-lg mx-auto px-6">
        <!-- Error Content -->
        <div class="text-center">
            <div class="inline-flex items-center justify-center p-6 bg-white rounded-3xl shadow-premium mb-8 animate-bounce-subtle">
                <span class="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-blue-600">
                    {{ status }}
                </span>
            </div>
            
            <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">{{ title }}</h1>
            <p class="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                {{ description }}
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                    href="/" 
                    class="w-full sm:w-auto py-4 px-8 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center"
                >
                    Return Home
                </a>
                <button 
                    @click="goBack"
                    class="w-full sm:w-auto py-4 px-8 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98] text-center"
                >
                    Go Back
                </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Persistent Legal Footer -->
    <footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto">
      <div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-500 text-sm font-medium">© 2026 MetaPilot • AI-Powered SEO Management</p>
        <div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest">
          <a href="/privacy" class="text-slate-400 hover:text-primary transition-colors">Privacy</a>
          <a href="/terms" class="text-slate-400 hover:text-primary transition-colors">Terms</a>
          <a href="/cookies" class="text-slate-400 hover:text-primary transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: Number,
    required: true,
  },
});

const title = computed(() => {
  return {
    503: 'Service Unavailable',
    500: 'Server Error',
    404: 'Page Not Found',
    403: 'Forbidden',
  }[props.status] || 'An Error Occurred';
});

const description = computed(() => {
  return {
    503: 'Sorry, we are doing some maintenance. Please check back soon.',
    500: 'Whoops, something went wrong on our servers. We are already on it.',
    404: "The page you're looking for doesn't exist or has been moved to another URL.",
    403: 'Sorry, you are forbidden from accessing this page.',
  }[props.status] || 'Something went wrong. Please try again later.';
});

function goBack() {
    window.history.back();
}
</script>

<style scoped>
.shadow-premium {
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.08);
}

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

@keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
.animate-bounce-subtle {
    animation: bounce-subtle 4s ease-in-out infinite;
}
</style>
