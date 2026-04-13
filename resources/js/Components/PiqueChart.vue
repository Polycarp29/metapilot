<template>
    <div class="pique-chart-container bg-white border border-slate-200 rounded-3xl p-6 my-6 shadow-xl shadow-slate-200/50 overflow-hidden transition-all hover:border-blue-300">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h4 v-if="title" class="text-slate-900 font-extrabold text-lg tracking-tight">{{ title }}</h4>
                <p v-if="subtitle" class="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-widest">{{ subtitle }}</p>
            </div>
            <div class="flex gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            </div>
        </div>

        <!-- Empty state: all values are zero / no data yet -->
        <div v-if="isEmpty" class="relative h-[300px] flex flex-col items-center justify-center gap-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-slate-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            <p class="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No data available yet</p>
            <p class="text-[11px] text-slate-400 max-w-xs text-center leading-relaxed">
                Data will appear here once your connected properties start reporting metrics.
            </p>
        </div>

        <!-- Live chart -->
        <div v-else class="relative h-[300px]">
            <Bar
                v-if="type === 'bar'"
                :data="chartData"
                :options="chartOptions"
            />
            <Line
                v-else-if="type === 'line'"
                :data="chartData"
                :options="chartOptions"
            />
            <Doughnut
                v-else-if="type === 'doughnut' || type === 'pie'"
                :data="chartData"
                :options="chartOptions"
            />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'vue-chartjs';

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement
);

const props = defineProps({
    chartData: {
        type: Object,
        required: true,
    },
    title: String,
    subtitle: String,
    type: {
        type: String,
        default: 'bar', // bar, line, doughnut
    }
});

/**
 * True when every dataset value is 0 or the datasets array is empty.
 * Prevents Chart.js rendering a blank white canvas with no visual cue.
 */
const isEmpty = computed(() => {
    const datasets = props.chartData?.datasets ?? [];
    if (!datasets.length) return true;
    const total = datasets.reduce((sum, ds) => {
        const vals = Array.isArray(ds.data) ? ds.data : [];
        return sum + vals.reduce((s, v) => s + (Number(v) || 0), 0);
    }, 0);
    return total === 0;
});

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: props.type === 'doughnut',
            position: 'bottom',
            labels: {
                color: '#1e293b', // slate-800
                font: {
                    family: "'Inter', sans-serif",
                    size: 11,
                    weight: '600'
                },
                usePointStyle: true,
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.9)',
            padding: 12,
            displayColors: false,
            cornerRadius: 12,
            titleFont: { size: 13, weight: '700' },
            bodyFont: { size: 12 }
        }
    },
    scales: props.type === 'doughnut' ? {} : {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
            },
            ticks: {
                color: '#64748b', // slate-500
                font: { size: 10, weight: '500' }
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#64748b',
                font: { size: 10, weight: '500' }
            }
        }
    }
}));
</script>

<style scoped>
.pique-chart-container {
    animation: chartAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes chartAppear {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
