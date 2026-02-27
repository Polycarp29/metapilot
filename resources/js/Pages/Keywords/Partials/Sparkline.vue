<template>
  <div class="sparkline-container w-full h-full">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  color: {
    type: String,
    default: '#3b82f6'
  }
})

const canvas = ref(null)
let chart = null

const renderChart = () => {
  if (!canvas.value) return
  if (chart) chart.destroy()

  if (!props.data || !Array.isArray(props.data)) return []
  const labels = props.data.map((_, i) => i)
  const values = props.data.map(d => d.interest_value || d.value || 0)

  // Pad with zeros if less than 2 points
  if (values.length < 2) {
    while (values.length < 2) values.push(0)
    while (labels.length < 2) labels.push(labels.length)
  }

  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: props.color,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return null
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
          gradient.addColorStop(1, props.color.replace(')', ', 0.1)').replace('rgb', 'rgba'))
          return gradient
        },
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false, min: 0, max: 100 }
      },
      interaction: { intersect: false }
    }
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.sparkline-container {
  position: relative;
}
</style>
