import { ref, onMounted, watch, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
import Chart from "chart.js/auto";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Sparkline",
  __ssrInlineRender: true,
  props: {
    data: {
      type: Array,
      default: () => []
    },
    color: {
      type: String,
      default: "#3b82f6"
    }
  },
  setup(__props) {
    const props = __props;
    const canvas = ref(null);
    let chart = null;
    const renderChart = () => {
      if (!canvas.value) return;
      if (chart) chart.destroy();
      if (!props.data || !Array.isArray(props.data)) return [];
      const labels = props.data.map((_, i) => i);
      const values = props.data.map((d) => d.interest_value || d.value || 0);
      if (values.length < 2) {
        while (values.length < 2) values.push(0);
        while (labels.length < 2) labels.push(labels.length);
      }
      chart = new Chart(canvas.value, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: values,
            borderColor: props.color,
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor: (context) => {
              const chart2 = context.chart;
              const { ctx, chartArea } = chart2;
              if (!chartArea) return null;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
              gradient.addColorStop(1, props.color.replace(")", ", 0.1)").replace("rgb", "rgba"));
              return gradient;
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
      });
    };
    onMounted(renderChart);
    watch(() => props.data, renderChart, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "sparkline-container w-full h-full" }, _attrs))} data-v-0e51d73f><canvas data-v-0e51d73f></canvas></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Keywords/Partials/Sparkline.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Sparkline = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0e51d73f"]]);
export {
  Sparkline as default
};
