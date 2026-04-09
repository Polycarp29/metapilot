import { ref, watch, computed, onMounted, unref, withCtx, openBlock, createBlock, createVNode, toDisplayString, createTextVNode, createCommentVNode, Fragment, renderList, withDirectives, vModelSelect, withKeys, vModelText, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderClass, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./AppLayout-Oqd_r1Cw.js";
import { Head, Link } from "@inertiajs/vue3";
import axios from "axios";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "vue-chartjs";
import _sfc_main$2 from "./AdPredictionsCard-MdOBVO9n.js";
import _sfc_main$3 from "./GoogleAdsSection-B3EmGpeJ.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    campaigns: Array,
    properties: Array,
    organization: Object
  },
  setup(__props) {
    Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
    const activeTab = ref("overview");
    const props = __props;
    const selectedPropertyId = ref(null);
    const acquisitionData = ref([]);
    const adPredictions = ref([]);
    const isLoadingAcquisition = ref(false);
    const isLoadingPredictions = ref(false);
    const period = ref(30);
    const adInsight = ref(null);
    const loadingInsight = ref(false);
    const showIndustryModal = ref(false);
    const industryInput = ref("");
    const generateAdInsight = () => {
      if (!selectedPropertyId.value || loadingInsight.value) return;
      if (!props.organization?.settings?.industry) {
        showIndustryModal.value = true;
        return;
      }
      fetchAdInsight();
    };
    const saveIndustryAndGenerate = () => {
      if (!industryInput.value) return;
      if (props.organization) {
        if (!props.organization.settings) props.organization.settings = {};
        props.organization.settings.industry = industryInput.value;
      }
      showIndustryModal.value = false;
      fetchAdInsight(industryInput.value);
    };
    const fetchAdInsight = async (newIndustry = null) => {
      loadingInsight.value = true;
      adInsight.value = null;
      try {
        const payload = {
          ad_data: acquisitionData.value
        };
        if (newIndustry) {
          payload.industry = newIndustry;
        }
        const response = await axios.post(route("api.analytics.ad-insights", { property: selectedPropertyId.value }), payload);
        adInsight.value = response.data;
      } catch (e) {
        console.error("Failed to generate ad insight", e);
      } finally {
        loadingInsight.value = false;
      }
    };
    watch([selectedPropertyId, period], () => {
      fetchAcquisitionData();
      fetchAdPredictions();
      adInsight.value = null;
    }, { deep: true });
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e293b",
          padding: 12,
          cornerRadius: 6
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      }
    };
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { usePointStyle: true, font: { size: 11 } } }
      }
    };
    const sessionsChartData = computed(() => {
      const sorted = [...acquisitionData.value].sort((a, b) => b.sessions - a.sessions).slice(0, 5);
      return {
        labels: sorted.map((d) => d.campaign === "(direct)" ? "Direct" : d.campaign.substring(0, 15) + (d.campaign.length > 15 ? "..." : "")),
        datasets: [{
          label: "Sessions",
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          data: sorted.map((d) => d.sessions)
        }]
      };
    });
    const sourceChartData = computed(() => {
      const sources = {};
      acquisitionData.value.forEach((d) => {
        const source = d.source_medium.split("/")[0];
        sources[source] = (sources[source] || 0) + d.sessions;
      });
      const labels = Object.keys(sources);
      const data = Object.values(sources);
      return {
        labels,
        datasets: [{
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"],
          borderWidth: 0,
          data
        }]
      };
    });
    const fetchAcquisitionData = async () => {
      if (!selectedPropertyId.value) return;
      isLoadingAcquisition.value = true;
      try {
        const { data } = await axios.get(route("api.analytics.acquisition", {
          property: selectedPropertyId.value,
          days: period.value
        }));
        acquisitionData.value = data;
      } catch (error) {
        console.error("Failed to fetch acquisition data", error);
      } finally {
        isLoadingAcquisition.value = false;
      }
    };
    const fetchAdPredictions = async () => {
      if (!selectedPropertyId.value) return;
      isLoadingPredictions.value = true;
      try {
        const { data } = await axios.get(route("analytics.forecasts", { property: selectedPropertyId.value }));
        adPredictions.value = data.ad_performance || [];
      } catch (e) {
        console.error("Failed to fetch ad predictions", e);
      } finally {
        isLoadingPredictions.value = false;
      }
    };
    onMounted(() => {
      if (props.properties && props.properties.length > 0) {
        selectedPropertyId.value = props.properties[0].id;
      }
    });
    const getStatusColor = (status) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-700";
        case "draft":
          return "bg-slate-100 text-slate-600";
        case "paused":
          return "bg-amber-100 text-amber-700";
        case "completed":
          return "bg-blue-100 text-blue-700";
        default:
          return "bg-slate-100 text-slate-600";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(Head), { title: "SEO Campaigns" }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" data-v-d5a62f01${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6" data-v-d5a62f01${_scopeId}><div data-v-d5a62f01${_scopeId}><h1 class="text-4xl font-black text-slate-900 tracking-tight" data-v-d5a62f01${_scopeId}>SEO Campaigns</h1><p class="text-slate-500 mt-2 font-medium" data-v-d5a62f01${_scopeId}>Strategic efforts to boost your property&#39;s performance</p></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("campaigns.create"),
              class: "flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" data-v-d5a62f01${_scopeId2}></path></svg><span data-v-d5a62f01${_scopeId2}>Start New Campaign</span>`);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-5 h-5",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                      })
                    ])),
                    createVNode("span", null, "Start New Campaign")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="flex items-center gap-4 bg-slate-50/50 p-1.5 rounded-3xl w-fit border border-slate-100 mx-auto md:mx-0" data-v-d5a62f01${_scopeId}><button class="${ssrRenderClass([activeTab.value === "overview" ? "bg-white shadow-premium text-slate-900" : "text-slate-500 hover:text-slate-700", "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"])}" data-v-d5a62f01${_scopeId}> Overview </button><button class="${ssrRenderClass([activeTab.value === "ads" ? "bg-white shadow-premium text-slate-900 border-blue-100" : "text-slate-500 hover:text-slate-700", "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"])}" data-v-d5a62f01${_scopeId}> Campaign Analytics `);
            if (__props.organization?.ads_customer_id) {
              _push2(`<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-v-d5a62f01${_scopeId}></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</button></div>`);
            if (activeTab.value === "overview") {
              _push2(`<div class="space-y-10 animate-fade-in" data-v-d5a62f01${_scopeId}>`);
              if (__props.campaigns.length) {
                _push2(`<div class="grid grid-cols-1 gap-6" data-v-d5a62f01${_scopeId}><!--[-->`);
                ssrRenderList(__props.campaigns, (campaign) => {
                  _push2(ssrRenderComponent(unref(Link), {
                    key: campaign.id,
                    href: _ctx.route("campaigns.show", { campaign: campaign.id }),
                    class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  }, {
                    default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                      if (_push3) {
                        _push3(`<div class="space-y-2" data-v-d5a62f01${_scopeId2}><div class="flex items-center gap-3" data-v-d5a62f01${_scopeId2}><span class="${ssrRenderClass(["px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", getStatusColor(campaign.status)])}" data-v-d5a62f01${_scopeId2}>${ssrInterpolate(campaign.status)}</span><span class="text-slate-400 font-medium text-sm" data-v-d5a62f01${_scopeId2}>${ssrInterpolate(campaign.property?.name)}</span></div><h3 class="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors" data-v-d5a62f01${_scopeId2}>${ssrInterpolate(campaign.name)}</h3><p class="text-slate-500 max-w-2xl line-clamp-2 italic" data-v-d5a62f01${_scopeId2}>&quot;${ssrInterpolate(campaign.objective)}&quot;</p></div><div class="flex items-center gap-4" data-v-d5a62f01${_scopeId2}><div class="text-right hidden sm:block" data-v-d5a62f01${_scopeId2}><p class="text-xs font-bold text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId2}>Target URLs</p><p class="text-lg font-black text-slate-900" data-v-d5a62f01${_scopeId2}>${ssrInterpolate(campaign.target_urls?.length || 0)}</p></div><div class="w-px h-10 bg-slate-100 hidden sm:block" data-v-d5a62f01${_scopeId2}></div><div class="bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-6 py-3 rounded-xl font-bold transition-all" data-v-d5a62f01${_scopeId2}> View Impact </div></div>`);
                      } else {
                        return [
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("div", { class: "flex items-center gap-3" }, [
                              createVNode("span", {
                                class: ["px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", getStatusColor(campaign.status)]
                              }, toDisplayString(campaign.status), 3),
                              createVNode("span", { class: "text-slate-400 font-medium text-sm" }, toDisplayString(campaign.property?.name), 1)
                            ]),
                            createVNode("h3", { class: "text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors" }, toDisplayString(campaign.name), 1),
                            createVNode("p", { class: "text-slate-500 max-w-2xl line-clamp-2 italic" }, '"' + toDisplayString(campaign.objective) + '"', 1)
                          ]),
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("div", { class: "text-right hidden sm:block" }, [
                              createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Target URLs"),
                              createVNode("p", { class: "text-lg font-black text-slate-900" }, toDisplayString(campaign.target_urls?.length || 0), 1)
                            ]),
                            createVNode("div", { class: "w-px h-10 bg-slate-100 hidden sm:block" }),
                            createVNode("div", { class: "bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-6 py-3 rounded-xl font-bold transition-all" }, " View Impact ")
                          ])
                        ];
                      }
                    }),
                    _: 2
                  }, _parent2, _scopeId));
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.properties && __props.properties.length > 0) {
                _push2(`<div class="bg-slate-50 p-8 rounded-[3rem] border border-slate-200/60" data-v-d5a62f01${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8" data-v-d5a62f01${_scopeId}><div data-v-d5a62f01${_scopeId}><h2 class="text-2xl font-black text-slate-900 flex items-center gap-3" data-v-d5a62f01${_scopeId}><span class="text-3xl" data-v-d5a62f01${_scopeId}>📊</span> Acquisition Channels </h2><p class="text-slate-500 font-medium mt-1" data-v-d5a62f01${_scopeId}>Track performance across all traffic sources</p></div><div class="flex items-center gap-4" data-v-d5a62f01${_scopeId}><select class="bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer" data-v-d5a62f01${_scopeId}><!--[-->`);
                ssrRenderList(__props.properties, (prop) => {
                  _push2(`<option${ssrRenderAttr("value", prop.id)} data-v-d5a62f01${ssrIncludeBooleanAttr(Array.isArray(selectedPropertyId.value) ? ssrLooseContain(selectedPropertyId.value, prop.id) : ssrLooseEqual(selectedPropertyId.value, prop.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(prop.name)}</option>`);
                });
                _push2(`<!--]--></select><select class="bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer" data-v-d5a62f01${_scopeId}><option${ssrRenderAttr("value", 7)} data-v-d5a62f01${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 7) : ssrLooseEqual(period.value, 7)) ? " selected" : ""}${_scopeId}>Last 7 Days</option><option${ssrRenderAttr("value", 30)} data-v-d5a62f01${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 30) : ssrLooseEqual(period.value, 30)) ? " selected" : ""}${_scopeId}>Last 30 Days</option><option${ssrRenderAttr("value", 90)} data-v-d5a62f01${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 90) : ssrLooseEqual(period.value, 90)) ? " selected" : ""}${_scopeId}>Last 90 Days</option></select></div></div>`);
                if (isLoadingAcquisition.value) {
                  _push2(`<div class="py-20 text-center" data-v-d5a62f01${_scopeId}><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" data-v-d5a62f01${_scopeId}></div><p class="text-slate-500 font-bold mt-4" data-v-d5a62f01${_scopeId}>Loading data...</p></div>`);
                } else if (acquisitionData.value.length > 0) {
                  _push2(`<div class="space-y-8" data-v-d5a62f01${_scopeId}><div class="grid grid-cols-1 lg:grid-cols-2 gap-8" data-v-d5a62f01${_scopeId}><div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80" data-v-d5a62f01${_scopeId}><h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6" data-v-d5a62f01${_scopeId}>Top Campaigns (Sessions)</h3><div class="h-60" data-v-d5a62f01${_scopeId}>`);
                  _push2(ssrRenderComponent(unref(Bar), {
                    data: sessionsChartData.value,
                    options: chartOptions
                  }, null, _parent2, _scopeId));
                  _push2(`</div></div><div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80" data-v-d5a62f01${_scopeId}><h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6" data-v-d5a62f01${_scopeId}>Traffic Sources</h3><div class="h-60" data-v-d5a62f01${_scopeId}>`);
                  _push2(ssrRenderComponent(unref(Doughnut), {
                    data: sourceChartData.value,
                    options: doughnutOptions
                  }, null, _parent2, _scopeId));
                  _push2(`</div></div></div>`);
                  if (adPredictions.value.length > 0 || isLoadingPredictions.value) {
                    _push2(`<div class="mt-8" data-v-d5a62f01${_scopeId}>`);
                    _push2(ssrRenderComponent(_sfc_main$2, {
                      recommendations: adPredictions.value,
                      "is-loading": isLoadingPredictions.value
                    }, null, _parent2, _scopeId));
                    _push2(`</div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mt-8" data-v-d5a62f01${_scopeId}><div class="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4" data-v-d5a62f01${_scopeId}><div data-v-d5a62f01${_scopeId}><h3 class="text-lg font-bold text-slate-900" data-v-d5a62f01${_scopeId}>Campaign Performance</h3><p class="text-slate-500 text-sm mt-1" data-v-d5a62f01${_scopeId}>Tracking ${ssrInterpolate(acquisitionData.value.length)} active campaigns</p></div><div class="flex items-center gap-3" data-v-d5a62f01${_scopeId}><button${ssrIncludeBooleanAttr(loadingInsight.value || acquisitionData.value.length === 0) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50" data-v-d5a62f01${_scopeId}>`);
                  if (loadingInsight.value) {
                    _push2(`<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-d5a62f01${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-d5a62f01${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-d5a62f01${_scopeId}></path></svg>`);
                  }
                  _push2(` AI Ad Insights </button></div></div>`);
                  if (adInsight.value) {
                    _push2(`<div class="mx-8 mt-8 relative overflow-hidden animate-fade-in shadow-sm" data-v-d5a62f01${_scopeId}>`);
                    if (adInsight.value.status === "configuration_required") {
                      _push2(`<div class="bg-amber-50 rounded-[2rem] border border-amber-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6" data-v-d5a62f01${_scopeId}><div class="flex items-center gap-4" data-v-d5a62f01${_scopeId}><div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0" data-v-d5a62f01${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-d5a62f01${_scopeId}></path></svg></div><div data-v-d5a62f01${_scopeId}><h3 class="text-lg font-bold text-amber-900" data-v-d5a62f01${_scopeId}>AI Model Setup Required</h3><p class="text-sm text-amber-700 mt-1" data-v-d5a62f01${_scopeId}>You haven&#39;t selected an AI model for analysis yet. Please configure it in your settings.</p></div></div>`);
                      _push2(ssrRenderComponent(unref(Link), {
                        href: _ctx.route("organization.settings", { tab: "ai" }),
                        class: "whitespace-nowrap px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20"
                      }, {
                        default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                          if (_push3) {
                            _push3(` Configure AI Model `);
                          } else {
                            return [
                              createTextVNode(" Configure AI Model ")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent2, _scopeId));
                      _push2(`</div>`);
                    } else {
                      _push2(`<div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2rem] border border-blue-100 p-8 relative overflow-hidden" data-v-d5a62f01${_scopeId}><div class="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" data-v-d5a62f01${_scopeId}></div><div class="flex items-start gap-4 relative z-10" data-v-d5a62f01${_scopeId}><div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0" data-v-d5a62f01${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-d5a62f01${_scopeId}></path></svg></div><div class="space-y-4 flex-1" data-v-d5a62f01${_scopeId}><div data-v-d5a62f01${_scopeId}><div class="flex items-center justify-between" data-v-d5a62f01${_scopeId}><h3 class="text-lg font-bold text-slate-900" data-v-d5a62f01${_scopeId}>${ssrInterpolate(adInsight.value.title)}</h3>`);
                      _push2(ssrRenderComponent(unref(Link), {
                        href: _ctx.route("organization.settings"),
                        class: "text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-white/50 px-3 py-1 rounded-lg border border-indigo-100 transition-colors"
                      }, {
                        default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                          if (_push3) {
                            _push3(` Customize Context `);
                          } else {
                            return [
                              createTextVNode(" Customize Context ")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent2, _scopeId));
                      _push2(`</div><p class="text-sm text-slate-500 mt-1" data-v-d5a62f01${_scopeId}>AI Analysis based on your industry and current trends.</p></div><div class="prose prose-sm prose-slate max-w-none bg-white/60 p-6 rounded-2xl border border-white/50 backdrop-blur-sm" data-v-d5a62f01${_scopeId}><p class="text-slate-700 leading-relaxed" data-v-d5a62f01${_scopeId}>${ssrInterpolate(adInsight.value.body)}</p></div>`);
                      if (adInsight.value.context) {
                        _push2(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-d5a62f01${_scopeId}>`);
                        if (adInsight.value.context.strategic_opportunities) {
                          _push2(`<div class="bg-white/80 p-4 rounded-xl border border-white/50" data-v-d5a62f01${_scopeId}><h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3" data-v-d5a62f01${_scopeId}>Opportunities</h4><ul class="space-y-2" data-v-d5a62f01${_scopeId}><!--[-->`);
                          ssrRenderList(adInsight.value.context.strategic_opportunities, (opp, i) => {
                            _push2(`<li class="flex items-start gap-2 text-sm text-slate-700" data-v-d5a62f01${_scopeId}><span class="text-indigo-500 mt-1" data-v-d5a62f01${_scopeId}>•</span> ${ssrInterpolate(opp)}</li>`);
                          });
                          _push2(`<!--]--></ul></div>`);
                        } else {
                          _push2(`<!---->`);
                        }
                        if (adInsight.value.context.budget_recommendations) {
                          _push2(`<div class="bg-white/80 p-4 rounded-xl border border-white/50" data-v-d5a62f01${_scopeId}><h4 class="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3" data-v-d5a62f01${_scopeId}>Budget Strategy</h4><p class="text-sm text-slate-700" data-v-d5a62f01${_scopeId}>${ssrInterpolate(adInsight.value.context.budget_recommendations)}</p></div>`);
                        } else {
                          _push2(`<!---->`);
                        }
                        _push2(`</div>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div></div></div>`);
                    }
                    _push2(`</div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<div class="overflow-x-auto" data-v-d5a62f01${_scopeId}><table class="w-full text-left border-collapse" data-v-d5a62f01${_scopeId}><thead class="bg-slate-50/50" data-v-d5a62f01${_scopeId}><tr data-v-d5a62f01${_scopeId}><th class="py-5 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Campaign / Source</th><th class="py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Google Ads</th><th class="py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest w-48" data-v-d5a62f01${_scopeId}>Top Keywords</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Sessions</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Users</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Conversions</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Ad Clicks</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Cost</th><th class="py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>ROAS</th><th class="py-5 pr-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest" data-v-d5a62f01${_scopeId}>Engagement</th></tr></thead><tbody class="text-sm font-medium text-slate-600 divide-y divide-slate-50" data-v-d5a62f01${_scopeId}><!--[-->`);
                  ssrRenderList(acquisitionData.value, (row, idx) => {
                    _push2(`<tr class="group hover:bg-slate-50/80 transition-colors" data-v-d5a62f01${_scopeId}><td class="py-4 pl-8" data-v-d5a62f01${_scopeId}><div class="font-bold text-slate-900" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.campaign === "(direct)" ? "Direct Traffic" : row.campaign)}</div><div class="text-xs text-slate-400 font-bold mt-0.5" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.source_medium)}</div></td><td class="py-4 text-center" data-v-d5a62f01${_scopeId}>`);
                    if (row.google_ads_campaign && row.google_ads_campaign !== "(not set)") {
                      _push2(`<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100" data-v-d5a62f01${_scopeId}><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" data-v-d5a62f01${_scopeId}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" data-v-d5a62f01${_scopeId}></path></svg> ${ssrInterpolate(row.google_ads_campaign)}</span>`);
                    } else {
                      _push2(`<span class="text-slate-300" data-v-d5a62f01${_scopeId}>-</span>`);
                    }
                    _push2(`</td><td class="py-4 text-left" data-v-d5a62f01${_scopeId}>`);
                    if (row.keywords && row.keywords.length > 0) {
                      _push2(`<div class="flex flex-col gap-1" data-v-d5a62f01${_scopeId}><!--[-->`);
                      ssrRenderList(row.keywords.slice(0, 3), (kw, kIdx) => {
                        _push2(`<div class="text-xs text-slate-600 flex justify-between items-center w-full pr-4" data-v-d5a62f01${_scopeId}><span class="truncate max-w-[120px]"${ssrRenderAttr("title", kw.keyword)} data-v-d5a62f01${_scopeId}>${ssrInterpolate(kw.keyword)}</span><span class="text-slate-400 text-[10px]" data-v-d5a62f01${_scopeId}>$${ssrInterpolate(kw.cost.toFixed(2))}</span></div>`);
                      });
                      _push2(`<!--]-->`);
                      if (row.keywords.length > 3) {
                        _push2(`<div class="text-[10px] text-blue-500 font-bold cursor-pointer hover:underline mt-0.5" data-v-d5a62f01${_scopeId}> +${ssrInterpolate(row.keywords.length - 3)} more </div>`);
                      } else {
                        _push2(`<!---->`);
                      }
                      _push2(`</div>`);
                    } else if (row.google_ads_campaign && row.google_ads_campaign !== "(not set)") {
                      _push2(`<span class="text-xs text-slate-300 italic" data-v-d5a62f01${_scopeId}>No keywords</span>`);
                    } else {
                      _push2(`<span class="text-slate-300" data-v-d5a62f01${_scopeId}>-</span>`);
                    }
                    _push2(`</td><td class="py-4 text-right font-bold" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.sessions.toLocaleString())}</td><td class="py-4 text-right" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.users.toLocaleString())}</td><td class="py-4 text-right text-blue-600 font-bold" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.conversions.toLocaleString())}</td><td class="py-4 text-right" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.ad_clicks ? row.ad_clicks.toLocaleString() : "-")}</td><td class="py-4 text-right" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.ad_cost ? "$" + row.ad_cost.toFixed(2) : "-")}</td><td class="py-4 text-right" data-v-d5a62f01${_scopeId}>${ssrInterpolate(row.roas ? row.roas.toFixed(2) + "x" : "-")}</td><td class="py-4 pr-8 text-right" data-v-d5a62f01${_scopeId}><span class="${ssrRenderClass({ "text-emerald-500": row.engagement_rate > 0.5, "text-amber-500": row.engagement_rate <= 0.5 })}" data-v-d5a62f01${_scopeId}>${ssrInterpolate((row.engagement_rate * 100).toFixed(1))}% </span></td></tr>`);
                  });
                  _push2(`<!--]--></tbody></table></div></div></div>`);
                } else {
                  _push2(`<div class="py-12 text-center bg-white rounded-[2rem] border border-slate-100" data-v-d5a62f01${_scopeId}><p class="text-slate-400 font-medium" data-v-d5a62f01${_scopeId}>No acquisition data found for this period.</p></div>`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (!__props.campaigns.length && !isLoadingAcquisition.value && __props.properties.length === 0) {
                _push2(`<div class="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-premium" data-v-d5a62f01${_scopeId}><div class="text-6xl mb-6" data-v-d5a62f01${_scopeId}>🎯</div><h2 class="text-2xl font-bold text-slate-900" data-v-d5a62f01${_scopeId}>No Campaigns Yet</h2><p class="text-slate-500 mt-2 max-w-md mx-auto" data-v-d5a62f01${_scopeId}>Create a campaign to start tracking specific SEO goals like &quot;Improve Blog Traffic&quot; or &quot;Boost Form Conversions&quot;.</p>`);
                _push2(ssrRenderComponent(unref(Link), {
                  href: _ctx.route("campaigns.create"),
                  class: "inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(` Create Your First Campaign `);
                    } else {
                      return [
                        createTextVNode(" Create Your First Campaign ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else if (activeTab.value === "ads") {
              _push2(`<div class="animate-fade-in" data-v-d5a62f01${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$3, {
                "property-id": selectedPropertyId.value,
                organization: __props.organization
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (showIndustryModal.value) {
              _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center px-4" data-v-d5a62f01${_scopeId}><div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" data-v-d5a62f01${_scopeId}></div><div class="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-scale-in" data-v-d5a62f01${_scopeId}><h3 class="text-xl font-bold text-slate-900 mb-2" data-v-d5a62f01${_scopeId}>Tell us about your Industry</h3><p class="text-slate-500 text-sm mb-6" data-v-d5a62f01${_scopeId}>To provide accurate ad recommendations, AI needs to know your market niche.</p><div class="space-y-4" data-v-d5a62f01${_scopeId}><div data-v-d5a62f01${_scopeId}><label class="block text-sm font-bold text-slate-700 mb-2" data-v-d5a62f01${_scopeId}>Industry / Niche</label><input${ssrRenderAttr("value", industryInput.value)} type="text" placeholder="e.g. SaaS, E-commerce Fashion, Local Plumbing" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium" data-v-d5a62f01${_scopeId}></div><div class="flex justify-end gap-3" data-v-d5a62f01${_scopeId}><button class="px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors" data-v-d5a62f01${_scopeId}> Cancel </button><button${ssrIncludeBooleanAttr(!industryInput.value) ? " disabled" : ""} class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" data-v-d5a62f01${_scopeId}> Save &amp; Generate </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-4xl font-black text-slate-900 tracking-tight" }, "SEO Campaigns"),
                    createVNode("p", { class: "text-slate-500 mt-2 font-medium" }, "Strategic efforts to boost your property's performance")
                  ]),
                  createVNode(unref(Link), {
                    href: _ctx.route("campaigns.create"),
                    class: "flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                  }, {
                    default: withCtx(() => [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        })
                      ])),
                      createVNode("span", null, "Start New Campaign")
                    ]),
                    _: 1
                  }, 8, ["href"])
                ]),
                createVNode("div", { class: "flex items-center gap-4 bg-slate-50/50 p-1.5 rounded-3xl w-fit border border-slate-100 mx-auto md:mx-0" }, [
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "overview",
                    class: [activeTab.value === "overview" ? "bg-white shadow-premium text-slate-900" : "text-slate-500 hover:text-slate-700", "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"]
                  }, " Overview ", 10, ["onClick"]),
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "ads",
                    class: [activeTab.value === "ads" ? "bg-white shadow-premium text-slate-900 border-blue-100" : "text-slate-500 hover:text-slate-700", "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"]
                  }, [
                    createTextVNode(" Campaign Analytics "),
                    __props.organization?.ads_customer_id ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    })) : createCommentVNode("", true)
                  ], 10, ["onClick"])
                ]),
                activeTab.value === "overview" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-10 animate-fade-in"
                }, [
                  __props.campaigns.length ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-1 gap-6"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.campaigns, (campaign) => {
                      return openBlock(), createBlock(unref(Link), {
                        key: campaign.id,
                        href: _ctx.route("campaigns.show", { campaign: campaign.id }),
                        class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      }, {
                        default: withCtx(() => [
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("div", { class: "flex items-center gap-3" }, [
                              createVNode("span", {
                                class: ["px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", getStatusColor(campaign.status)]
                              }, toDisplayString(campaign.status), 3),
                              createVNode("span", { class: "text-slate-400 font-medium text-sm" }, toDisplayString(campaign.property?.name), 1)
                            ]),
                            createVNode("h3", { class: "text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors" }, toDisplayString(campaign.name), 1),
                            createVNode("p", { class: "text-slate-500 max-w-2xl line-clamp-2 italic" }, '"' + toDisplayString(campaign.objective) + '"', 1)
                          ]),
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("div", { class: "text-right hidden sm:block" }, [
                              createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Target URLs"),
                              createVNode("p", { class: "text-lg font-black text-slate-900" }, toDisplayString(campaign.target_urls?.length || 0), 1)
                            ]),
                            createVNode("div", { class: "w-px h-10 bg-slate-100 hidden sm:block" }),
                            createVNode("div", { class: "bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 px-6 py-3 rounded-xl font-bold transition-all" }, " View Impact ")
                          ])
                        ]),
                        _: 2
                      }, 1032, ["href"]);
                    }), 128))
                  ])) : createCommentVNode("", true),
                  __props.properties && __props.properties.length > 0 ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "bg-slate-50 p-8 rounded-[3rem] border border-slate-200/60"
                  }, [
                    createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8" }, [
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-2xl font-black text-slate-900 flex items-center gap-3" }, [
                          createVNode("span", { class: "text-3xl" }, "📊"),
                          createTextVNode(" Acquisition Channels ")
                        ]),
                        createVNode("p", { class: "text-slate-500 font-medium mt-1" }, "Track performance across all traffic sources")
                      ]),
                      createVNode("div", { class: "flex items-center gap-4" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => selectedPropertyId.value = $event,
                          class: "bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.properties, (prop) => {
                            return openBlock(), createBlock("option", {
                              key: prop.id,
                              value: prop.id
                            }, toDisplayString(prop.name), 9, ["value"]);
                          }), 128))
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, selectedPropertyId.value]
                        ]),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => period.value = $event,
                          class: "bg-white border-transparent focus:border-blue-500 focus:ring-0 rounded-xl font-bold text-slate-700 py-2 pl-4 pr-10 shadow-sm cursor-pointer"
                        }, [
                          createVNode("option", { value: 7 }, "Last 7 Days"),
                          createVNode("option", { value: 30 }, "Last 30 Days"),
                          createVNode("option", { value: 90 }, "Last 90 Days")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, period.value]
                        ])
                      ])
                    ]),
                    isLoadingAcquisition.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "py-20 text-center"
                    }, [
                      createVNode("div", { class: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" }),
                      createVNode("p", { class: "text-slate-500 font-bold mt-4" }, "Loading data...")
                    ])) : acquisitionData.value.length > 0 ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "space-y-8"
                    }, [
                      createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-8" }, [
                        createVNode("div", { class: "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80" }, [
                          createVNode("h3", { class: "text-sm font-black uppercase tracking-widest text-slate-400 mb-6" }, "Top Campaigns (Sessions)"),
                          createVNode("div", { class: "h-60" }, [
                            createVNode(unref(Bar), {
                              data: sessionsChartData.value,
                              options: chartOptions
                            }, null, 8, ["data"])
                          ])
                        ]),
                        createVNode("div", { class: "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-80" }, [
                          createVNode("h3", { class: "text-sm font-black uppercase tracking-widest text-slate-400 mb-6" }, "Traffic Sources"),
                          createVNode("div", { class: "h-60" }, [
                            createVNode(unref(Doughnut), {
                              data: sourceChartData.value,
                              options: doughnutOptions
                            }, null, 8, ["data"])
                          ])
                        ])
                      ]),
                      adPredictions.value.length > 0 || isLoadingPredictions.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "mt-8"
                      }, [
                        createVNode(_sfc_main$2, {
                          recommendations: adPredictions.value,
                          "is-loading": isLoadingPredictions.value
                        }, null, 8, ["recommendations", "is-loading"])
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mt-8" }, [
                        createVNode("div", { class: "p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4" }, [
                          createVNode("div", null, [
                            createVNode("h3", { class: "text-lg font-bold text-slate-900" }, "Campaign Performance"),
                            createVNode("p", { class: "text-slate-500 text-sm mt-1" }, "Tracking " + toDisplayString(acquisitionData.value.length) + " active campaigns", 1)
                          ]),
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("button", {
                              onClick: generateAdInsight,
                              disabled: loadingInsight.value || acquisitionData.value.length === 0,
                              class: "flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            }, [
                              loadingInsight.value ? (openBlock(), createBlock("svg", {
                                key: 0,
                                class: "animate-spin h-4 w-4",
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("circle", {
                                  class: "opacity-25",
                                  cx: "12",
                                  cy: "12",
                                  r: "10",
                                  stroke: "currentColor",
                                  "stroke-width": "4"
                                }),
                                createVNode("path", {
                                  class: "opacity-75",
                                  fill: "currentColor",
                                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                })
                              ])) : (openBlock(), createBlock("svg", {
                                key: 1,
                                class: "w-4 h-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M13 10V3L4 14h7v7l9-11h-7z"
                                })
                              ])),
                              createTextVNode(" AI Ad Insights ")
                            ], 8, ["disabled"])
                          ])
                        ]),
                        adInsight.value ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mx-8 mt-8 relative overflow-hidden animate-fade-in shadow-sm"
                        }, [
                          adInsight.value.status === "configuration_required" ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "bg-amber-50 rounded-[2rem] border border-amber-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                          }, [
                            createVNode("div", { class: "flex items-center gap-4" }, [
                              createVNode("div", { class: "w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-6 h-6",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  })
                                ]))
                              ]),
                              createVNode("div", null, [
                                createVNode("h3", { class: "text-lg font-bold text-amber-900" }, "AI Model Setup Required"),
                                createVNode("p", { class: "text-sm text-amber-700 mt-1" }, "You haven't selected an AI model for analysis yet. Please configure it in your settings.")
                              ])
                            ]),
                            createVNode(unref(Link), {
                              href: _ctx.route("organization.settings", { tab: "ai" }),
                              class: "whitespace-nowrap px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Configure AI Model ")
                              ]),
                              _: 1
                            }, 8, ["href"])
                          ])) : (openBlock(), createBlock("div", {
                            key: 1,
                            class: "bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2rem] border border-blue-100 p-8 relative overflow-hidden"
                          }, [
                            createVNode("div", { class: "absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" }),
                            createVNode("div", { class: "flex items-start gap-4 relative z-10" }, [
                              createVNode("div", { class: "w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-6 h-6",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M13 10V3L4 14h7v7l9-11h-7z"
                                  })
                                ]))
                              ]),
                              createVNode("div", { class: "space-y-4 flex-1" }, [
                                createVNode("div", null, [
                                  createVNode("div", { class: "flex items-center justify-between" }, [
                                    createVNode("h3", { class: "text-lg font-bold text-slate-900" }, toDisplayString(adInsight.value.title), 1),
                                    createVNode(unref(Link), {
                                      href: _ctx.route("organization.settings"),
                                      class: "text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-white/50 px-3 py-1 rounded-lg border border-indigo-100 transition-colors"
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(" Customize Context ")
                                      ]),
                                      _: 1
                                    }, 8, ["href"])
                                  ]),
                                  createVNode("p", { class: "text-sm text-slate-500 mt-1" }, "AI Analysis based on your industry and current trends.")
                                ]),
                                createVNode("div", { class: "prose prose-sm prose-slate max-w-none bg-white/60 p-6 rounded-2xl border border-white/50 backdrop-blur-sm" }, [
                                  createVNode("p", { class: "text-slate-700 leading-relaxed" }, toDisplayString(adInsight.value.body), 1)
                                ]),
                                adInsight.value.context ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "grid grid-cols-1 md:grid-cols-2 gap-4"
                                }, [
                                  adInsight.value.context.strategic_opportunities ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "bg-white/80 p-4 rounded-xl border border-white/50"
                                  }, [
                                    createVNode("h4", { class: "text-xs font-black text-indigo-400 uppercase tracking-widest mb-3" }, "Opportunities"),
                                    createVNode("ul", { class: "space-y-2" }, [
                                      (openBlock(true), createBlock(Fragment, null, renderList(adInsight.value.context.strategic_opportunities, (opp, i) => {
                                        return openBlock(), createBlock("li", {
                                          key: i,
                                          class: "flex items-start gap-2 text-sm text-slate-700"
                                        }, [
                                          createVNode("span", { class: "text-indigo-500 mt-1" }, "•"),
                                          createTextVNode(" " + toDisplayString(opp), 1)
                                        ]);
                                      }), 128))
                                    ])
                                  ])) : createCommentVNode("", true),
                                  adInsight.value.context.budget_recommendations ? (openBlock(), createBlock("div", {
                                    key: 1,
                                    class: "bg-white/80 p-4 rounded-xl border border-white/50"
                                  }, [
                                    createVNode("h4", { class: "text-xs font-black text-emerald-500 uppercase tracking-widest mb-3" }, "Budget Strategy"),
                                    createVNode("p", { class: "text-sm text-slate-700" }, toDisplayString(adInsight.value.context.budget_recommendations), 1)
                                  ])) : createCommentVNode("", true)
                                ])) : createCommentVNode("", true)
                              ])
                            ])
                          ]))
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "overflow-x-auto" }, [
                          createVNode("table", { class: "w-full text-left border-collapse" }, [
                            createVNode("thead", { class: "bg-slate-50/50" }, [
                              createVNode("tr", null, [
                                createVNode("th", { class: "py-5 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest" }, "Campaign / Source"),
                                createVNode("th", { class: "py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest" }, "Google Ads"),
                                createVNode("th", { class: "py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest w-48" }, "Top Keywords"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Sessions"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Users"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Conversions"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Ad Clicks"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Cost"),
                                createVNode("th", { class: "py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "ROAS"),
                                createVNode("th", { class: "py-5 pr-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest" }, "Engagement")
                              ])
                            ]),
                            createVNode("tbody", { class: "text-sm font-medium text-slate-600 divide-y divide-slate-50" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(acquisitionData.value, (row, idx) => {
                                return openBlock(), createBlock("tr", {
                                  key: idx,
                                  class: "group hover:bg-slate-50/80 transition-colors"
                                }, [
                                  createVNode("td", { class: "py-4 pl-8" }, [
                                    createVNode("div", { class: "font-bold text-slate-900" }, toDisplayString(row.campaign === "(direct)" ? "Direct Traffic" : row.campaign), 1),
                                    createVNode("div", { class: "text-xs text-slate-400 font-bold mt-0.5" }, toDisplayString(row.source_medium), 1)
                                  ]),
                                  createVNode("td", { class: "py-4 text-center" }, [
                                    row.google_ads_campaign && row.google_ads_campaign !== "(not set)" ? (openBlock(), createBlock("span", {
                                      key: 0,
                                      class: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"
                                    }, [
                                      (openBlock(), createBlock("svg", {
                                        class: "w-3 h-3",
                                        fill: "currentColor",
                                        viewBox: "0 0 24 24"
                                      }, [
                                        createVNode("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" })
                                      ])),
                                      createTextVNode(" " + toDisplayString(row.google_ads_campaign), 1)
                                    ])) : (openBlock(), createBlock("span", {
                                      key: 1,
                                      class: "text-slate-300"
                                    }, "-"))
                                  ]),
                                  createVNode("td", { class: "py-4 text-left" }, [
                                    row.keywords && row.keywords.length > 0 ? (openBlock(), createBlock("div", {
                                      key: 0,
                                      class: "flex flex-col gap-1"
                                    }, [
                                      (openBlock(true), createBlock(Fragment, null, renderList(row.keywords.slice(0, 3), (kw, kIdx) => {
                                        return openBlock(), createBlock("div", {
                                          key: kIdx,
                                          class: "text-xs text-slate-600 flex justify-between items-center w-full pr-4"
                                        }, [
                                          createVNode("span", {
                                            class: "truncate max-w-[120px]",
                                            title: kw.keyword
                                          }, toDisplayString(kw.keyword), 9, ["title"]),
                                          createVNode("span", { class: "text-slate-400 text-[10px]" }, "$" + toDisplayString(kw.cost.toFixed(2)), 1)
                                        ]);
                                      }), 128)),
                                      row.keywords.length > 3 ? (openBlock(), createBlock("div", {
                                        key: 0,
                                        class: "text-[10px] text-blue-500 font-bold cursor-pointer hover:underline mt-0.5"
                                      }, " +" + toDisplayString(row.keywords.length - 3) + " more ", 1)) : createCommentVNode("", true)
                                    ])) : row.google_ads_campaign && row.google_ads_campaign !== "(not set)" ? (openBlock(), createBlock("span", {
                                      key: 1,
                                      class: "text-xs text-slate-300 italic"
                                    }, "No keywords")) : (openBlock(), createBlock("span", {
                                      key: 2,
                                      class: "text-slate-300"
                                    }, "-"))
                                  ]),
                                  createVNode("td", { class: "py-4 text-right font-bold" }, toDisplayString(row.sessions.toLocaleString()), 1),
                                  createVNode("td", { class: "py-4 text-right" }, toDisplayString(row.users.toLocaleString()), 1),
                                  createVNode("td", { class: "py-4 text-right text-blue-600 font-bold" }, toDisplayString(row.conversions.toLocaleString()), 1),
                                  createVNode("td", { class: "py-4 text-right" }, toDisplayString(row.ad_clicks ? row.ad_clicks.toLocaleString() : "-"), 1),
                                  createVNode("td", { class: "py-4 text-right" }, toDisplayString(row.ad_cost ? "$" + row.ad_cost.toFixed(2) : "-"), 1),
                                  createVNode("td", { class: "py-4 text-right" }, toDisplayString(row.roas ? row.roas.toFixed(2) + "x" : "-"), 1),
                                  createVNode("td", { class: "py-4 pr-8 text-right" }, [
                                    createVNode("span", {
                                      class: { "text-emerald-500": row.engagement_rate > 0.5, "text-amber-500": row.engagement_rate <= 0.5 }
                                    }, toDisplayString((row.engagement_rate * 100).toFixed(1)) + "% ", 3)
                                  ])
                                ]);
                              }), 128))
                            ])
                          ])
                        ])
                      ])
                    ])) : (openBlock(), createBlock("div", {
                      key: 2,
                      class: "py-12 text-center bg-white rounded-[2rem] border border-slate-100"
                    }, [
                      createVNode("p", { class: "text-slate-400 font-medium" }, "No acquisition data found for this period.")
                    ]))
                  ])) : createCommentVNode("", true),
                  !__props.campaigns.length && !isLoadingAcquisition.value && __props.properties.length === 0 ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-premium"
                  }, [
                    createVNode("div", { class: "text-6xl mb-6" }, "🎯"),
                    createVNode("h2", { class: "text-2xl font-bold text-slate-900" }, "No Campaigns Yet"),
                    createVNode("p", { class: "text-slate-500 mt-2 max-w-md mx-auto" }, 'Create a campaign to start tracking specific SEO goals like "Improve Blog Traffic" or "Boost Form Conversions".'),
                    createVNode(unref(Link), {
                      href: _ctx.route("campaigns.create"),
                      class: "inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Create Your First Campaign ")
                      ]),
                      _: 1
                    }, 8, ["href"])
                  ])) : createCommentVNode("", true)
                ])) : activeTab.value === "ads" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "animate-fade-in"
                }, [
                  createVNode(_sfc_main$3, {
                    "property-id": selectedPropertyId.value,
                    organization: __props.organization
                  }, null, 8, ["property-id", "organization"])
                ])) : createCommentVNode("", true)
              ]),
              showIndustryModal.value ? (openBlock(), createBlock("div", {
                key: 0,
                class: "fixed inset-0 z-50 flex items-center justify-center px-4"
              }, [
                createVNode("div", {
                  class: "absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity",
                  onClick: ($event) => showIndustryModal.value = false
                }, null, 8, ["onClick"]),
                createVNode("div", { class: "bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-scale-in" }, [
                  createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "Tell us about your Industry"),
                  createVNode("p", { class: "text-slate-500 text-sm mb-6" }, "To provide accurate ad recommendations, AI needs to know your market niche."),
                  createVNode("div", { class: "space-y-4" }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-bold text-slate-700 mb-2" }, "Industry / Niche"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => industryInput.value = $event,
                        type: "text",
                        placeholder: "e.g. SaaS, E-commerce Fashion, Local Plumbing",
                        class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium",
                        onKeyup: withKeys(saveIndustryAndGenerate, ["enter"])
                      }, null, 40, ["onUpdate:modelValue"]), [
                        [vModelText, industryInput.value]
                      ])
                    ]),
                    createVNode("div", { class: "flex justify-end gap-3" }, [
                      createVNode("button", {
                        onClick: ($event) => showIndustryModal.value = false,
                        class: "px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                      }, " Cancel ", 8, ["onClick"]),
                      createVNode("button", {
                        onClick: saveIndustryAndGenerate,
                        disabled: !industryInput.value,
                        class: "bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      }, " Save & Generate ", 8, ["disabled"])
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Campaigns/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d5a62f01"]]);
export {
  Index as default
};
