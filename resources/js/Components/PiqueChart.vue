<template>
    <div class="pique-chart-container bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 my-4 shadow-2xl overflow-hidden transition-all hover:border-white/20">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h4 v-if="title" class="text-white font-semibold text-lg tracking-tight">{{ title }}</h4>
                <p v-if="subtitle" class="text-white/50 text-xs mt-1 uppercase tracking-widest">{{ subtitle }}</p>
            </div>
            <div class="flex gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div class="w-2 h-2 rounded-full bg-emerald-500/30"></div>
            </div>
        </div>

        <div class="relative h-[280px]">
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

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: props.type === 'doughnut',
            position: 'bottom',
            labels: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                },
                usePointStyle: true,
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            cornerRadius: 8,
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 }
        }
    },
    scales: props.type === 'doughnut' ? {} : {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
            },
            ticks: {
                color: 'rgba(255, 255, 255, 0.5)',
                font: { size: 10 }
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: 'rgba(255, 255, 255, 0.5)',
                font: { size: 10 }
            }
        }
    }
}));
</script>

<style scoped>
.pique-chart-container {
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
