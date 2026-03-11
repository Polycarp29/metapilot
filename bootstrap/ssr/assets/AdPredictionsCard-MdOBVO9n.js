import { computed, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass } from "vue/server-renderer";
const _sfc_main = {
  __name: "AdPredictionsCard",
  __ssrInlineRender: true,
  props: {
    recommendations: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    forecastDays: {
      type: Number,
      default: 14
    }
  },
  setup(__props) {
    const props = __props;
    const getActionColor = (action) => {
      const a = (action || "").toLowerCase();
      if (a.includes("increase") || a.includes("scale")) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      if (a.includes("decrease") || a.includes("reduce") || a.includes("pause")) return "bg-rose-100 text-rose-700 border border-rose-200";
      return "bg-slate-100 text-slate-700 border border-slate-200";
    };
    const getActionIcon = (action) => {
      const a = (action || "").toLowerCase();
      if (a.includes("increase") || a.includes("scale")) return "↑";
      if (a.includes("decrease") || a.includes("reduce") || a.includes("pause")) return "↓";
      return "→";
    };
    const projectedRoiImprovement = computed(() => {
      if (!props.recommendations || props.recommendations.length === 0) return null;
      const roas = props.recommendations.map((r) => r.roas || 0).filter((r) => r > 0);
      if (roas.length < 2) return null;
      const maxRoas = Math.max(...roas);
      const avgRoas = roas.reduce((a, b) => a + b, 0) / roas.length;
      const lift = Math.round((maxRoas - avgRoas) / avgRoas * 100);
      return lift > 0 ? lift : null;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden" }, _attrs))}><div class="p-8 border-b border-slate-100 flex items-center justify-between"><div><h3 class="text-xl font-black text-slate-900 flex items-center gap-2"><span class="text-2xl">🔮</span> Ad Budget Predictions </h3><p class="text-slate-500 font-medium text-sm mt-1">AI-driven ROI forecasting &amp; budget optimization</p></div>`);
      if (__props.isLoading) {
        _push(`<div class="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.recommendations.length > 0) {
        _push(`<div class="p-8 space-y-4"><!--[-->`);
        ssrRenderList(__props.recommendations, (rec, idx) => {
          _push(`<div class="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 hover:shadow-md transition-all duration-200"><div class="space-y-1 mb-4 md:mb-0"><div class="text-xs font-black text-slate-400 uppercase tracking-widest">Campaign</div><div class="text-lg font-bold text-slate-900">${ssrInterpolate(rec.campaign)}</div><div class="flex items-center gap-4 mt-2"><div class="text-sm font-medium text-slate-500"> Spend: <span class="text-slate-900 font-bold">$${ssrInterpolate((rec.current_spend || 0).toLocaleString())}</span></div><div class="w-px h-3 bg-slate-200"></div><div class="text-sm font-medium text-slate-500"> ROAS: <span class="text-blue-600 font-bold">${ssrInterpolate(rec.roas)}x</span></div></div></div><div class="flex flex-col items-end gap-2"><div class="${ssrRenderClass(["px-4 py-2 rounded-xl text-sm font-black uppercase tracking-tight flex items-center gap-2", getActionColor(rec.action)])}"><span class="text-lg">${ssrInterpolate(getActionIcon(rec.action))}</span> ${ssrInterpolate(rec.action)}</div><p class="text-xs text-slate-500 font-medium max-w-[220px] text-right italic"> &quot;${ssrInterpolate(rec.reason)}&quot; </p></div></div>`);
        });
        _push(`<!--]--><div class="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100"><div class="flex items-center gap-3 text-blue-700 mb-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="font-bold">Optimization Impact</span></div>`);
        if (projectedRoiImprovement.value) {
          _push(`<p class="text-sm text-blue-600 font-medium"> Shifting budget to the highest-ROAS campaigns is projected to improve overall ROI by <span class="font-black text-blue-800">~${ssrInterpolate(projectedRoiImprovement.value)}%</span> over the next <span class="font-black text-blue-800">${ssrInterpolate(__props.forecastDays)} days</span> based on current ROAS spread. </p>`);
        } else {
          _push(`<p class="text-sm text-blue-600 font-medium"> Applying these budget recommendations may improve ROI over the next <span class="font-black text-blue-800">${ssrInterpolate(__props.forecastDays)} days</span>. More campaign data will sharpen this estimate. </p>`);
        }
        _push(`</div></div>`);
      } else if (!__props.isLoading) {
        _push(`<div class="p-12 text-center"><div class="text-4xl mb-4">⏳</div><p class="text-slate-400 font-bold">Awaiting campaign data to generate high-confidence predictions.</p><p class="text-slate-300 text-xs mt-2 font-medium">Campaign spend data must be present in your metric snapshots.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/AdPredictionsCard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
