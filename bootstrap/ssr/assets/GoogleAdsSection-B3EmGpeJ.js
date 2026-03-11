import { ref, computed, onMounted, watch, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderList } from "vue/server-renderer";
import axios from "axios";
import _sfc_main$1 from "./AdPredictionsCard-MdOBVO9n.js";
import { Chart, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler } from "chart.js";
import { Line } from "vue-chartjs";
const _sfc_main = {
  __name: "GoogleAdsSection",
  __ssrInlineRender: true,
  props: {
    propertyId: [Number, String],
    organization: Object
  },
  setup(__props) {
    Chart.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler);
    const props = __props;
    const customerId = ref(props.organization?.ads_customer_id || "");
    const isConnecting = ref(false);
    const isLoading = ref(false);
    const data = ref({ campaigns: [], forecast: null, last_sync: null });
    const error = ref(null);
    const isConnected = computed(() => !!props.organization?.ads_customer_id);
    const fetchData = async () => {
      if (!isConnected.value || !props.propertyId) return;
      isLoading.value = true;
      try {
        const response = await axios.get(route("google-ads.index", { property_id: props.propertyId }));
        data.value = response.data;
      } catch (e) {
        console.error("Failed to fetch Google Ads data", e);
        error.value = "Failed to load campaign data";
      } finally {
        isLoading.value = false;
      }
    };
    onMounted(fetchData);
    watch(() => props.propertyId, fetchData);
    const forecastChartData = computed(() => {
      if (!data.value.forecast || !data.value.forecast.ds) return null;
      const ds = data.value.forecast.ds;
      const yhat = data.value.forecast.yhat;
      const yhat_lower = data.value.forecast.yhat_lower;
      const yhat_upper = data.value.forecast.yhat_upper;
      return {
        labels: ds.map((d) => new Date(d).toLocaleDateString(void 0, { month: "short", day: "numeric" })),
        datasets: [
          {
            label: "Forecast",
            data: yhat,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0
          },
          {
            label: "Confidence Interval",
            data: yhat_upper,
            borderColor: "transparent",
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            fill: "+1",
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: "Lower Bound",
            data: yhat_lower,
            borderColor: "transparent",
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      };
    });
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } }
      }
    };
    const stats = computed(() => {
      const campaigns = data.value.campaigns;
      return {
        spend: campaigns.reduce((acc, c) => acc + c.metrics.cost_micros / 1e6, 0),
        clicks: campaigns.reduce((acc, c) => acc + c.metrics.clicks, 0),
        conversions: campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0),
        impressions: campaigns.reduce((acc, c) => acc + c.metrics.impressions, 0)
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-10" }, _attrs))}>`);
      if (!isConnected.value) {
        _push(`<div class="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-premium text-center max-w-2xl mx-auto"><div class="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-8 shadow-inner"><svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z"></path></svg></div><h2 class="text-3xl font-black text-slate-900 tracking-tight">Connect Google Ads</h2><p class="text-slate-500 font-medium mt-4 mb-10 leading-relaxed"> Unlock Prophet-driven performance forecasts and deep monitoring for your ad campaigns. Enter your 10-digit Customer ID below. </p><div class="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto"><input${ssrRenderAttr("value", customerId.value)} placeholder="123-456-7890" class="w-full bg-slate-50 border-transparent focus:border-blue-500 focus:ring-0 rounded-2xl py-4 px-6 font-bold text-slate-700 shadow-inner"><button${ssrIncludeBooleanAttr(isConnecting.value || !customerId.value) ? " disabled" : ""} class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50">${ssrInterpolate(isConnecting.value ? "Connecting..." : "Connect")}</button></div>`);
        if (error.value) {
          _push(`<p class="text-red-500 text-sm font-bold mt-4">${ssrInterpolate(error.value)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-10 animate-fade-in"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium"><p class="text-xs font-black text-slate-400 uppercase tracking-widest">Total Spend</p><h3 class="text-3xl font-black text-slate-900 mt-2">$${ssrInterpolate(stats.value.spend.toLocaleString(void 0, { minimumFractionDigits: 2 }))}</h3></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium"><p class="text-xs font-black text-slate-400 uppercase tracking-widest">Ad Clicks</p><h3 class="text-3xl font-black text-slate-900 mt-2">${ssrInterpolate(stats.value.clicks.toLocaleString())}</h3></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium"><p class="text-xs font-black text-slate-400 uppercase tracking-widest">Conversions</p><h3 class="text-3xl font-black text-slate-900 mt-2 text-blue-600">${ssrInterpolate(stats.value.conversions.toLocaleString())}</h3></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium"><p class="text-xs font-black text-slate-400 uppercase tracking-widest">ROAS</p><h3 class="text-3xl font-black text-slate-900 mt-2">${ssrInterpolate(stats.value.spend > 0 ? (stats.value.conversions / stats.value.spend).toFixed(2) : "0")}x</h3></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium min-h-[400px]"><div class="flex items-center justify-between mb-10"><div><h3 class="text-xl font-black text-slate-900">Performance Forecast</h3><p class="text-slate-400 text-sm font-bold mt-1 uppercase tracking-wider">Powered by Prophet ML engine</p></div><div class="flex items-center gap-2"><span class="w-3 h-3 bg-blue-500 rounded-full"></span><span class="text-xs font-black text-slate-500 uppercase tracking-widest">Predicted Conversions</span></div></div>`);
        if (isLoading.value) {
          _push(`<div class="h-64 flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>`);
        } else if (forecastChartData.value) {
          _push(`<div class="h-64">`);
          _push(ssrRenderComponent(unref(Line), {
            data: forecastChartData.value,
            options: chartOptions
          }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<div class="h-64 flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200"><p class="text-slate-400 font-bold italic">Generating forecast models...</p></div>`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_sfc_main$1, {
          title: "Ad Strategy Insight",
          recommendations: props.organization?.ad_predictions || [],
          "is-loading": isLoading.value
        }, null, _parent));
        _push(`</div><div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden"><div class="p-10 border-b border-slate-100 flex items-center justify-between"><div><h3 class="text-2xl font-black text-slate-900">Google Ads Campaigns</h3><p class="text-slate-500 font-medium mt-1">Direct API sync for Customer ID: ${ssrInterpolate(__props.organization?.ads_customer_id)}</p></div><button${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""} class="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"><svg class="${ssrRenderClass([{ "animate-spin": isLoading.value }, "w-5 h-5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Manual Sync </button></div><div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead class="bg-slate-50/50"><tr><th class="py-6 pl-10 text-xs font-black text-slate-400 uppercase tracking-widest">Campaign</th><th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th><th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Impressions</th><th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Clicks</th><th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Cost</th><th class="py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Conversions</th><th class="py-6 pr-10 text-xs font-black text-slate-400 uppercase tracking-widest text-right">CTR</th></tr></thead><tbody class="divide-y divide-slate-50"><!--[-->`);
        ssrRenderList(data.value.campaigns, (campaign) => {
          _push(`<tr class="group hover:bg-slate-50/50 transition-colors"><td class="py-6 pl-10"><div class="font-black text-slate-900 group-hover:text-blue-600 transition-colors">${ssrInterpolate(campaign.name)}</div><div class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">${ssrInterpolate(campaign.campaign_type)}</div></td><td class="py-6 text-center"><span class="${ssrRenderClass([campaign.status === "ENABLED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600", "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"])}">${ssrInterpolate(campaign.status)}</span></td><td class="py-6 text-right font-bold text-slate-600">${ssrInterpolate(campaign.metrics.impressions.toLocaleString())}</td><td class="py-6 text-right font-bold text-slate-600">${ssrInterpolate(campaign.metrics.clicks.toLocaleString())}</td><td class="py-6 text-right font-bold text-slate-900">$${ssrInterpolate((campaign.metrics.cost_micros / 1e6).toLocaleString(void 0, { minimumFractionDigits: 2 }))}</td><td class="py-6 text-right font-black text-blue-600">${ssrInterpolate(campaign.metrics.conversions.toLocaleString())}</td><td class="py-6 pr-10 text-right font-bold text-slate-600">${ssrInterpolate((campaign.metrics.ctr * 100).toFixed(2))}%</td></tr>`);
        });
        _push(`<!--]-->`);
        if (data.value.campaigns.length === 0 && !isLoading.value) {
          _push(`<tr><td colspan="7" class="py-20 text-center"><p class="text-slate-400 font-bold italic">No campaigns found for this customer ID.</p></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div></div></div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Campaigns/Partials/GoogleAdsSection.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
