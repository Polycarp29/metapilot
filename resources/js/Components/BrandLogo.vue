<script setup>
import { computed, onMounted } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const branding = computed(() => usePage().props.branding ?? {});
const logoUrl  = computed(() => branding.value.logo_url  || null);
const siteName = computed(() => branding.value.site_name || 'MetaPilot');



</script>

<template>
    <!-- Custom brand logo image -->
    <Link v-if="logoUrl" href="/">
        <img
            :src="logoUrl"
            :alt="siteName"
            class="h-10 w-auto object-contain max-w-[160px]"
        />
    </Link>

    <!-- Fallback: SVG icon + site name text -->
    <div v-else class="flex items-center space-x-3 group">
        <div
            class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-standard">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        </div>
        <Link href="/"
            class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
            {{ siteName }}
        </Link>
    </div>
</template>