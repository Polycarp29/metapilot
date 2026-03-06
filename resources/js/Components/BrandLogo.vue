<script setup>
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps(
    {
        logo: String,
    }
)

const brandLogo = ref(props.logo || '');

</script>


<template>

    <div v-if="brandLogo" class="w-32 h-auto">
        <img class="overflow-hidden" :src="brandLogo" />
    </div>
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
            MetaPilot
        </Link>
    </div>
</template>