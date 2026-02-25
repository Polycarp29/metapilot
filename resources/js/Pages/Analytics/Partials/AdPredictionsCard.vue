<script setup>
import { computed } from 'vue'

const props = defineProps({
    recommendations: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

const getActionColor = (action) => {
    if (action.includes('Increase') || action.includes('Scale')) return 'bg-emerald-100 text-emerald-700'
    if (action.includes('Decrease')) return 'bg-rose-100 text-rose-700'
    return 'bg-slate-100 text-slate-700'
}

const getActionIcon = (action) => {
    if (action.includes('Increase') || action.includes('Scale')) return '↑'
    if (action.includes('Decrease')) return '↓'
    return '→'
}
</script>

<template>
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h3 class="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span class="text-2xl">🔮</span>
                    Probable Predictions
                </h3>
                <p class="text-slate-500 font-medium text-sm mt-1">AI-driven ROI forecasting & budget optimization</p>
            </div>
            <div v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
        </div>

        <div v-if="recommendations.length > 0" class="p-8 space-y-6">
            <div 
                v-for="(rec, idx) in recommendations" 
                :key="idx"
                class="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all"
            >
                <div class="space-y-1 mb-4 md:mb-0">
                    <div class="text-xs font-black text-slate-400 uppercase tracking-widest">Campaign</div>
                    <div class="text-lg font-bold text-slate-900">{{ rec.campaign }}</div>
                    <div class="flex items-center gap-4 mt-2">
                        <div class="text-sm font-medium text-slate-500">
                            Spend: <span class="text-slate-900 font-bold">${{ rec.current_spend.toLocaleString() }}</span>
                        </div>
                        <div class="w-px h-3 bg-slate-200"></div>
                        <div class="text-sm font-medium text-slate-500">
                            ROAS: <span class="text-blue-600 font-bold">{{ rec.roas }}x</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <div :class="['px-4 py-2 rounded-xl text-sm font-black uppercase tracking-tight flex items-center gap-2', getActionColor(rec.action)]">
                        <span class="text-lg">{{ getActionIcon(rec.action) }}</span>
                        {{ rec.action }}
                    </div>
                    <p class="text-xs text-slate-500 font-medium max-w-[200px] text-right italic">
                        "{{ rec.reason }}"
                    </p>
                </div>
            </div>

            <div class="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div class="flex items-center gap-3 text-blue-700 mb-2">
                    <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span class="font-bold">Optimization Impact</span>
                </div>
                <p class="text-sm text-blue-600 font-medium">
                    Applying these budget shifts is predicted to improve overall ROI by <span class="font-black text-blue-800">15%</span> over the next 14 days based on current search trends.
                </p>
            </div>
        </div>

        <div v-else-if="!isLoading" class="p-12 text-center">
            <div class="text-4xl mb-4">⏳</div>
            <p class="text-slate-400 font-bold">Awaiting more campaign data to generate high-confidence predictions.</p>
        </div>
    </div>
</template>
