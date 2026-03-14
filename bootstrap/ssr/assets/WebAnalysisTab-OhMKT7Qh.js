import { ref, computed, onMounted, onUnmounted, watch, unref, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderComponent, ssrRenderTeleport } from "vue/server-renderer";
import { Link } from "@inertiajs/vue3";
import axios from "axios";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { Chart, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController } from "chart.js";
import { Line, Bar } from "vue-chartjs";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "pinia";
const RING_R = 44;
const _sfc_main = {
  __name: "WebAnalysisTab",
  __ssrInlineRender: true,
  props: {
    organization: Object,
    properties: Array,
    propertyId: [Number, String]
  },
  setup(__props) {
    Chart.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController);
    const toast = useToastStore();
    const pixelSites = ref([]);
    const selectedSiteId = ref(localStorage.getItem("mp_selected_site_id") ? parseInt(localStorage.getItem("mp_selected_site_id")) : null);
    const showSiteDropdown = ref(false);
    const siteSearchQuery = ref("");
    const expandedLink = ref(null);
    const activeSection = ref(localStorage.getItem("mp_active_section") || "seo");
    const webAnalysisResponse = ref({
      sitemaps: [],
      analysis_links: [],
      error_summary: {},
      schema_stats: {},
      trends: { labels: [], errors: [], injections: [] }
    });
    const isLoadingWebAnalysis = ref(false);
    const isExportingPdf = ref(false);
    const showSeoModal = ref(false);
    const selectedSeoLink = ref(null);
    const isValidatingLink = ref(false);
    let refreshInterval = null;
    const schemaDebugItems = ref([]);
    const isLoadingSchemaDbg = ref(false);
    const expandedSchema = ref(null);
    const cdnDiscovery = ref({
      enabled: false,
      loading: false,
      sitemap_id: null,
      discovered_count: 0,
      pixel_domain: null,
      errorMsg: null
    });
    const discoveredPages = ref([]);
    const isLoadingDiscovered = ref(false);
    const totalDiscovered = ref(0);
    const selectedSite = computed(
      () => pixelSites.value.find((s) => s.id === selectedSiteId.value)
    );
    const filteredSiteOptions = computed(() => {
      if (!siteSearchQuery.value) return pixelSites.value;
      const q = siteSearchQuery.value.toLowerCase();
      return pixelSites.value.filter((s) => s.label.toLowerCase().includes(q));
    });
    const siteStatusInfo = computed(() => {
      const site = selectedSite.value;
      if (!site) return { label: "All Sites", color: "slate", pulse: false };
      const map = {
        verified_active: { label: "Live", color: "emerald", pulse: true },
        connected_inactive: { label: "Inactive", color: "amber", pulse: false }
      };
      return map[site.status] || { label: "Unverified", color: "rose", pulse: false };
    });
    const overallHealthScore = computed(() => {
      const links = webAnalysisResponse.value.analysis_links || [];
      if (!links.length) return null;
      const avg = links.reduce((sum, l) => sum + (l.seo_score || 0), 0) / links.length;
      return Math.round(avg);
    });
    const healthColor = computed(() => {
      const s = overallHealthScore.value;
      if (s === null) return { ring: "#e2e8f0", text: "slate" };
      if (s >= 80) return { ring: "#10b981", text: "emerald" };
      if (s >= 50) return { ring: "#f59e0b", text: "amber" };
      return { ring: "#f43f5e", text: "rose" };
    });
    const RING_CIRC = computed(() => 2 * Math.PI * RING_R);
    const ringDash = computed(() => {
      const s = overallHealthScore.value;
      if (s === null) return RING_CIRC.value;
      return RING_CIRC.value * (1 - s / 100);
    });
    const topBottleneckPages = computed(() => {
      return (webAnalysisResponse.value.analysis_links || []).filter((l) => l.seo_bottlenecks?.length).slice(0, 5);
    });
    const schemaUpgradePages = computed(() => {
      return (webAnalysisResponse.value.analysis_links || []).filter((l) => l.schema_suggestions?.length).slice(0, 5);
    });
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        point: { radius: 0 },
        line: { tension: 0.4 }
      }
    };
    const errorChartData = computed(() => ({
      labels: webAnalysisResponse.value.trends?.labels || [],
      datasets: [{
        label: "Errors",
        data: webAnalysisResponse.value.trends?.errors || [],
        borderColor: "#f43f5e",
        backgroundColor: "rgba(244, 63, 94, 0.1)",
        fill: true,
        borderWidth: 2
      }]
    }));
    const injectionChartData = computed(() => ({
      labels: webAnalysisResponse.value.trends?.labels || [],
      datasets: [{
        label: "Injections",
        data: webAnalysisResponse.value.trends?.trends_injections || webAnalysisResponse.value.trends?.injections || [],
        backgroundColor: "#10b981",
        borderRadius: 4
      }]
    }));
    const fetchConnectionStatus = async () => {
      try {
        const r = await axios.get(route("google-ads.connection-status"));
        pixelSites.value = r.data.pixel_sites || [];
        if (!selectedSiteId.value && pixelSites.value.length > 0) {
          selectedSiteId.value = pixelSites.value[0].id;
        }
      } catch (e) {
      }
    };
    const fetchWebAnalysis = async (isManual = false) => {
      isLoadingWebAnalysis.value = true;
      try {
        const { data } = await axios.get(route("google-ads.web-analysis"), {
          params: { pixel_site_id: selectedSiteId.value }
        });
        webAnalysisResponse.value = data;
        if (isManual) {
          toast.add("Analysis data updated.", "success");
        }
      } catch (e) {
        toast.add("Failed to fetch web analysis", "error");
      } finally {
        isLoadingWebAnalysis.value = false;
      }
    };
    const fetchSchemaDebug = async () => {
      isLoadingSchemaDbg.value = true;
      try {
        const { data } = await axios.get(route("google-ads.schema-debug"));
        schemaDebugItems.value = data.schemas || [];
      } catch (e) {
      } finally {
        isLoadingSchemaDbg.value = false;
      }
    };
    const cdnConnected = computed(() => {
      const site = selectedSite.value;
      return site && (site.status === "verified_active" || site.status === "connected_inactive");
    });
    const fetchDiscoveredPages = async () => {
      isLoadingDiscovered.value = true;
      try {
        const { data } = await axios.get(route("google-ads.discovered-pages"));
        discoveredPages.value = data.pages || [];
        totalDiscovered.value = data.total || 0;
        if (data.sitemap_id) {
          cdnDiscovery.value.sitemap_id = data.sitemap_id;
          cdnDiscovery.value.enabled = data.crawl_mode === "cdn";
          cdnDiscovery.value.discovered_count = data.total;
        }
      } catch (e) {
      } finally {
        isLoadingDiscovered.value = false;
      }
    };
    const safeHostname = (url) => {
      if (!url) return "";
      try {
        const m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
        return m ? m[1] : url;
      } catch {
        return url;
      }
    };
    const safePath = (url) => {
      if (!url) return "/";
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    };
    onMounted(() => {
      fetchConnectionStatus();
      fetchWebAnalysis();
      fetchSchemaDebug();
      fetchDiscoveredPages();
      refreshInterval = setInterval(fetchWebAnalysis, 15e3);
    });
    onUnmounted(() => clearInterval(refreshInterval));
    watch(selectedSiteId, (val) => {
      if (val) localStorage.setItem("mp_selected_site_id", val);
      else localStorage.removeItem("mp_selected_site_id");
      fetchWebAnalysis();
    });
    watch(activeSection, (val) => {
      localStorage.setItem("mp_active_section", val);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><div class="pb-24 space-y-0" data-v-da4639fb><div class="relative overflow-hidden rounded-[2.5rem] bg-slate-900 mb-10 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8" data-v-da4639fb><div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" data-v-da4639fb></div><div class="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" data-v-da4639fb></div><div class="relative" data-v-da4639fb><div class="flex items-center gap-3 mb-3" data-v-da4639fb><span class="${ssrRenderClass([siteStatusInfo.value.color === "emerald" ? "bg-emerald-400 animate-pulse" : siteStatusInfo.value.color === "amber" ? "bg-amber-400" : "bg-slate-500", "w-2 h-2 rounded-full"])}" data-v-da4639fb></span><span class="${ssrRenderClass([siteStatusInfo.value.color === "emerald" ? "text-emerald-400" : siteStatusInfo.value.color === "amber" ? "text-amber-400" : "text-slate-400", "text-[10px] font-black uppercase tracking-[0.2em]"])}" data-v-da4639fb>${ssrInterpolate(siteStatusInfo.value.label)}</span></div><h1 class="text-3xl md:text-4xl font-black text-white tracking-tight" data-v-da4639fb>Web Analysis</h1><p class="text-slate-400 text-sm font-medium mt-1.5" data-v-da4639fb>Sitemap coverage · SEO intelligence · Schema health</p></div><div class="flex flex-wrap items-center gap-3 relative" data-v-da4639fb><div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10" data-v-da4639fb><!--[-->`);
      ssrRenderList([{ id: "seo", label: "SEO Insights" }, { id: "sitemaps", label: "Sitemaps" }, { id: "health", label: "Health" }], (s) => {
        _push(`<button class="${ssrRenderClass([activeSection.value === s.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap"])}" data-v-da4639fb>${ssrInterpolate(s.label)}</button>`);
      });
      _push(`<!--]--></div><div class="relative" data-v-da4639fb><button class="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-white transition-all" data-v-da4639fb><svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" data-v-da4639fb></path></svg> ${ssrInterpolate(selectedSite.value ? selectedSite.value.label : "All Sites")} <svg class="${ssrRenderClass([{ "rotate-180": showSiteDropdown.value }, "w-2.5 h-2.5 opacity-60 transition-transform"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" data-v-da4639fb></path></svg></button>`);
      if (showSiteDropdown.value) {
        _push(`<div class="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden" data-v-da4639fb><div class="p-3 border-b border-white/5" data-v-da4639fb><input${ssrRenderAttr("value", siteSearchQuery.value)} placeholder="Search sites…" class="w-full bg-white/5 border-none rounded-xl text-[11px] font-bold text-slate-200 placeholder-slate-500 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-white/20" data-v-da4639fb></div><div class="max-h-60 overflow-y-auto p-1.5" data-v-da4639fb><button class="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2.5" data-v-da4639fb><span class="w-1.5 h-1.5 bg-slate-500 rounded-full" data-v-da4639fb></span> All Sites </button><!--[-->`);
        ssrRenderList(filteredSiteOptions.value, (site) => {
          _push(`<button class="${ssrRenderClass([selectedSiteId.value === site.id ? "text-white bg-white/5" : "text-slate-400", "w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black hover:bg-white/10 transition-all flex items-center justify-between group"])}" data-v-da4639fb><div class="flex items-center gap-2.5" data-v-da4639fb><span class="${ssrRenderClass([site.status === "verified_active" ? "bg-emerald-400" : site.status === "connected_inactive" ? "bg-amber-400" : "bg-slate-500", "w-1.5 h-1.5 rounded-full"])}" data-v-da4639fb></span><span data-v-da4639fb>${ssrInterpolate(site.label)}</span></div>`);
          if (selectedSiteId.value === site.id) {
            _push(`<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-da4639fb></path></svg>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center gap-2 mr-1" data-v-da4639fb><button${ssrIncludeBooleanAttr(isExportingPdf.value) ? " disabled" : ""} class="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-white transition-all" data-v-da4639fb>`);
      if (isExportingPdf.value) {
        _push(`<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" data-v-da4639fb><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-da4639fb></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-da4639fb></path></svg>`);
      } else {
        _push(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V19a2 2 0 00-2-2z" data-v-da4639fb></path></svg>`);
      }
      _push(` Export PDF </button><button class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": isLoadingWebAnalysis.value }, "w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl transition-all text-white shadow-sm"])}" data-v-da4639fb><svg class="${ssrRenderClass([{ "animate-spin": isLoadingWebAnalysis.value }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-da4639fb></path></svg></button></div></div></div><div class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10" data-v-da4639fb><div class="md:col-span-1 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm gap-2 group hover:shadow-md transition-all" data-v-da4639fb><div class="relative w-28 h-28" data-v-da4639fb><svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100" data-v-da4639fb><circle cx="50" cy="50"${ssrRenderAttr("r", RING_R)} fill="none" stroke="#f1f5f9" stroke-width="8" data-v-da4639fb></circle><circle cx="50" cy="50"${ssrRenderAttr("r", RING_R)} fill="none"${ssrRenderAttr("stroke", healthColor.value.ring)} stroke-width="8" stroke-linecap="round"${ssrRenderAttr("stroke-dasharray", RING_CIRC.value)}${ssrRenderAttr("stroke-dashoffset", ringDash.value)} class="transition-all duration-700" data-v-da4639fb></circle></svg><div class="absolute inset-0 flex flex-col items-center justify-center" data-v-da4639fb><span class="${ssrRenderClass([`text-${healthColor.value.text}-600`, "text-2xl font-black tracking-tight leading-none"])}" data-v-da4639fb>${ssrInterpolate(overallHealthScore.value ?? "—")}</span><span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5" data-v-da4639fb>Score</span></div></div><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center" data-v-da4639fb>Avg SEO Health</p></div><!--[-->`);
      ssrRenderList([
        { label: "Sitemaps", value: webAnalysisResponse.value.sitemaps?.length || 0, color: "indigo", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", sub: "Indexed coverage" },
        { label: "AI Injections", value: webAnalysisResponse.value.schema_stats?.total_injections || 0, color: "emerald", icon: "M13 10V3L4 14h7v7l9-11h-7z", sub: "JSON-LD served" },
        { label: "JS Events", value: webAnalysisResponse.value.error_summary?.total || 0, color: "amber", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", sub: "7-day window" },
        { label: "SEO Conflicts", value: webAnalysisResponse.value.schema_stats?.conflicts || 0, color: "rose", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", sub: "Duplicate schema" }
      ], (stat) => {
        _push(`<div class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden" data-v-da4639fb><div class="absolute top-0 right-0 p-5 opacity-40 group-hover:opacity-80 transition-all" data-v-da4639fb><div class="${ssrRenderClass([`bg-${stat.color}-50`, "w-10 h-10 rounded-xl flex items-center justify-center"])}" data-v-da4639fb><svg class="${ssrRenderClass([`text-${stat.color}-500`, "w-5 h-5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"${ssrRenderAttr("d", stat.icon)} data-v-da4639fb></path></svg></div></div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" data-v-da4639fb>${ssrInterpolate(stat.label)}</p><p class="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2" data-v-da4639fb>${ssrInterpolate(stat.value)}</p><p class="text-[10px] text-slate-400 font-medium" data-v-da4639fb>${ssrInterpolate(stat.sub)}</p></div>`);
      });
      _push(`<!--]--></div><div class="grid grid-cols-1 xl:grid-cols-3 gap-6" style="${ssrRenderStyle(activeSection.value === "seo" ? null : { display: "none" })}" data-v-da4639fb><div class="xl:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-da4639fb><div class="flex items-center justify-between px-8 py-6 border-b border-slate-50" data-v-da4639fb><div class="flex items-center gap-3" data-v-da4639fb><span class="w-1.5 h-6 bg-indigo-600 rounded-full" data-v-da4639fb></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Page SEO Report</h3></div><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-da4639fb>${ssrInterpolate(webAnalysisResponse.value.analysis_links?.length || 0)} pages </span></div>`);
      if (isLoadingWebAnalysis.value) {
        _push(`<div class="p-8 space-y-4" data-v-da4639fb><!--[-->`);
        ssrRenderList(5, (n) => {
          _push(`<div class="h-12 bg-slate-50 rounded-2xl animate-pulse" data-v-da4639fb></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!webAnalysisResponse.value.analysis_links?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-24 px-8 text-center" data-v-da4639fb><div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200" data-v-da4639fb><svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" data-v-da4639fb></path></svg></div><p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1" data-v-da4639fb>No Pages Crawled</p><p class="text-xs text-slate-400 font-medium max-w-xs" data-v-da4639fb>Crawl a sitemap to populate SEO intelligence and AI-driven growth suggestions.</p></div>`);
      } else {
        _push(`<div class="overflow-y-auto max-h-[520px]" data-v-da4639fb><table class="w-full text-left" data-v-da4639fb><thead class="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10" data-v-da4639fb><tr data-v-da4639fb><th class="py-3 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-da4639fb>Page</th><th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24" data-v-da4639fb>Score</th><th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-8" data-v-da4639fb>Tags</th></tr></thead><tbody data-v-da4639fb><!--[-->`);
        ssrRenderList(webAnalysisResponse.value.analysis_links, (link) => {
          _push(`<tr class="border-t border-slate-50 hover:bg-slate-50/60 transition-all cursor-pointer group" data-v-da4639fb><td class="py-4 px-8" data-v-da4639fb><p class="text-xs font-black text-slate-800 leading-tight" data-v-da4639fb>${ssrInterpolate(safePath(link.url))}</p><p class="text-[10px] text-slate-400 font-mono truncate max-w-[260px]" data-v-da4639fb>${ssrInterpolate(safeHostname(link.url))}</p>`);
          if (expandedLink.value === link.id) {
            _push(`<div class="mt-3 space-y-2 animate-fade-in" data-v-da4639fb>`);
            if (link.seo_bottlenecks?.length) {
              _push(`<div data-v-da4639fb><p class="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1" data-v-da4639fb>Bottlenecks</p><div class="flex flex-wrap gap-1.5" data-v-da4639fb><!--[-->`);
              ssrRenderList(link.seo_bottlenecks, (b) => {
                _push(`<span class="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black rounded-lg border border-rose-100" data-v-da4639fb>${ssrInterpolate(b)}</span>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            if (link.schema_suggestions?.length) {
              _push(`<div data-v-da4639fb><p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 mt-2" data-v-da4639fb>Schema Upgrades</p><div class="flex flex-wrap gap-1.5" data-v-da4639fb><!--[-->`);
              ssrRenderList(link.schema_suggestions, (s) => {
                _push(`<span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100" data-v-da4639fb>${ssrInterpolate(s)}</span>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="py-4 px-4 text-center" data-v-da4639fb><div class="${ssrRenderClass([link.seo_score >= 80 ? "border-emerald-400 bg-emerald-50 text-emerald-600" : link.seo_score >= 50 ? "border-amber-400 bg-amber-50 text-amber-600" : "border-rose-400 bg-rose-50 text-rose-600", "inline-flex items-center justify-center w-10 h-10 rounded-2xl border-2 font-black text-xs leading-none mx-auto transition-transform hover:scale-110 cursor-help"])}" data-v-da4639fb>${ssrInterpolate(link.seo_score ?? "—")}</div></td><td class="py-4 px-4 pr-8 text-right" data-v-da4639fb><div class="flex items-center justify-end gap-3" data-v-da4639fb><div class="hidden sm:flex items-center gap-1.5 flex-wrap justify-end" data-v-da4639fb>`);
          if (link.is_ad_ready) {
            _push(`<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md uppercase border border-indigo-100" data-v-da4639fb>Ad Ready</span>`);
          } else {
            _push(`<!---->`);
          }
          if (link.seo_bottlenecks?.length) {
            _push(`<span class="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-md uppercase border border-rose-100" data-v-da4639fb>${ssrInterpolate(link.seo_bottlenecks.length)} Issues </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="View Details" data-v-da4639fb><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-da4639fb></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" data-v-da4639fb></path></svg></button><svg class="${ssrRenderClass([{ "rotate-90": expandedLink.value === link.id }, "w-3 h-3 text-slate-200 group-hover:text-slate-400 transition-all"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" data-v-da4639fb></path></svg></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div><div class="space-y-5" data-v-da4639fb><div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-da4639fb><div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50" data-v-da4639fb><span class="w-1.5 h-6 bg-rose-500 rounded-full" data-v-da4639fb></span><h3 class="text-xs font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Top Bottleneck Pages</h3></div><div class="p-5 space-y-3" data-v-da4639fb>`);
      if (!topBottleneckPages.value.length) {
        _push(`<div class="text-center py-8" data-v-da4639fb><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest" data-v-da4639fb>No bottlenecks ✓</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(topBottleneckPages.value, (link, i) => {
        _push(`<div class="flex items-center gap-4 group" data-v-da4639fb><span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 text-[10px] font-black" data-v-da4639fb>${ssrInterpolate(i + 1)}</span><div class="flex-1 min-w-0" data-v-da4639fb><p class="text-[11px] font-black text-slate-800 truncate" data-v-da4639fb>${ssrInterpolate(safePath(link.url))}</p><div class="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" data-v-da4639fb><div class="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all" style="${ssrRenderStyle({ width: 100 - (link.seo_score || 0) + "%" })}" data-v-da4639fb></div></div></div><span class="text-[10px] font-black text-rose-500 flex-shrink-0" data-v-da4639fb>${ssrInterpolate(link.seo_bottlenecks?.length)} issues</span></div>`);
      });
      _push(`<!--]--></div></div><div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-da4639fb><div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50" data-v-da4639fb><span class="w-1.5 h-6 bg-blue-500 rounded-full" data-v-da4639fb></span><h3 class="text-xs font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Schema Opportunities</h3></div><div class="p-5 space-y-3" data-v-da4639fb>`);
      if (!schemaUpgradePages.value.length) {
        _push(`<div class="text-center py-8" data-v-da4639fb><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest" data-v-da4639fb>All schemas optimal</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(schemaUpgradePages.value, (link, i) => {
        _push(`<div class="flex items-center gap-4" data-v-da4639fb><span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-[10px] font-black" data-v-da4639fb>${ssrInterpolate(i + 1)}</span><div class="flex-1 min-w-0" data-v-da4639fb><p class="text-[11px] font-black text-slate-800 truncate" data-v-da4639fb>${ssrInterpolate(safePath(link.url))}</p><div class="flex flex-wrap gap-1 mt-1.5" data-v-da4639fb><!--[-->`);
        ssrRenderList((link.schema_suggestions || []).slice(0, 2), (s) => {
          _push(`<span class="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase" data-v-da4639fb>${ssrInterpolate(s)}</span>`);
        });
        _push(`<!--]--></div></div></div>`);
      });
      _push(`<!--]--></div></div></div></div><div class="space-y-6" style="${ssrRenderStyle(activeSection.value === "sitemaps" ? null : { display: "none" })}" data-v-da4639fb><div class="${ssrRenderClass([cdnDiscovery.value.enabled ? "bg-teal-900" : cdnConnected.value ? "bg-slate-900" : "bg-slate-800 opacity-80", "relative overflow-hidden rounded-[2rem] p-8 md:p-10"])}" data-v-da4639fb><div class="${ssrRenderClass([cdnDiscovery.value.enabled ? "bg-teal-500/20" : "bg-indigo-500/15", "absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"])}" data-v-da4639fb></div><div class="${ssrRenderClass([cdnDiscovery.value.enabled ? "bg-emerald-400/10" : "bg-violet-500/10", "absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none"])}" data-v-da4639fb></div><div class="relative flex flex-col md:flex-row items-start md:items-center gap-6 justify-between" data-v-da4639fb><div class="flex items-start gap-5" data-v-da4639fb><div class="${ssrRenderClass([cdnDiscovery.value.enabled ? "bg-teal-500/20 border border-teal-500/30" : "bg-white/10 border border-white/15", "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"])}" data-v-da4639fb><svg class="${ssrRenderClass([cdnDiscovery.value.enabled ? "text-teal-300" : "text-slate-300", "w-7 h-7"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" data-v-da4639fb></path></svg></div><div data-v-da4639fb><div class="flex items-center gap-2.5 mb-1.5" data-v-da4639fb><h3 class="text-white font-black text-base tracking-tight" data-v-da4639fb>Silent CDN Discovery</h3>`);
      if (cdnDiscovery.value.enabled) {
        _push(`<span class="flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/30 rounded-full text-[9px] font-black text-teal-300 uppercase tracking-widest" data-v-da4639fb><span class="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" data-v-da4639fb></span>Active </span>`);
      } else if (cdnConnected.value) {
        _push(`<span class="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 border border-white/15 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-widest" data-v-da4639fb><span class="w-1.5 h-1.5 bg-slate-400 rounded-full" data-v-da4639fb></span>Ready </span>`);
      } else {
        _push(`<span class="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[9px] font-black text-amber-300 uppercase tracking-widest" data-v-da4639fb><span class="w-1.5 h-1.5 bg-amber-400 rounded-full" data-v-da4639fb></span>Pixel Needed </span>`);
      }
      _push(`</div>`);
      if (cdnDiscovery.value.enabled) {
        _push(`<p class="text-sm text-teal-200/80 font-medium max-w-lg" data-v-da4639fb> Your CDN pixel is silently watching traffic on <span class="font-black text-white" data-v-da4639fb>${ssrInterpolate(cdnDiscovery.value.pixel_domain)}</span>. <span class="ml-2 text-teal-300 font-black" data-v-da4639fb>${ssrInterpolate(totalDiscovered.value)} pages discovered so far.</span></p>`);
      } else if (cdnConnected.value) {
        _push(`<p class="text-sm text-slate-300 font-medium max-w-lg" data-v-da4639fb> Automatically log every page visited on your site via the CDN pixel — no crawler needed. Pages appear here the moment they receive traffic. </p>`);
      } else {
        _push(`<p class="text-sm text-amber-200/70 font-medium max-w-lg" data-v-da4639fb> Install the CDN tracking pixel on your site first. Once connected, silent discovery will start automatically on activation. </p>`);
      }
      if (cdnDiscovery.value.errorMsg) {
        _push(`<p class="mt-2 text-[11px] font-black text-rose-300" data-v-da4639fb>${ssrInterpolate(cdnDiscovery.value.errorMsg)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex-shrink-0" data-v-da4639fb>`);
      if (cdnDiscovery.value.enabled) {
        _push(`<div class="flex items-center gap-3" data-v-da4639fb>`);
        if (cdnDiscovery.value.sitemap_id) {
          _push(ssrRenderComponent(unref(Link), {
            href: _ctx.route("sitemaps.show", cdnDiscovery.value.sitemap_id),
            class: "inline-flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white text-[11px] font-black rounded-2xl transition-all shadow-lg shadow-teal-900/40"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-da4639fb${_scopeId}></path></svg> View Discovery Sitemap `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-3.5 h-3.5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2.5",
                      d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    })
                  ])),
                  createTextVNode(" View Discovery Sitemap ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<button${ssrIncludeBooleanAttr(cdnDiscovery.value.loading || !cdnConnected.value) ? " disabled" : ""} class="${ssrRenderClass([cdnConnected.value ? "bg-teal-500 hover:bg-teal-400 text-white shadow-teal-900/40 cursor-pointer" : "bg-white/10 text-slate-400 cursor-not-allowed shadow-none", "inline-flex items-center gap-2.5 px-6 py-3.5 font-black text-[11px] uppercase tracking-tight rounded-2xl transition-all shadow-lg"])}" data-v-da4639fb>`);
        if (cdnDiscovery.value.loading) {
          _push(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" data-v-da4639fb><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-da4639fb></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" data-v-da4639fb></path></svg>`);
        } else {
          _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" data-v-da4639fb></path></svg>`);
        }
        _push(` ${ssrInterpolate(cdnDiscovery.value.loading ? "Activating…" : "Enable Silent Discovery")}</button>`);
      }
      _push(`</div></div></div>`);
      if (cdnDiscovery.value.enabled || discoveredPages.value.length) {
        _push(`<div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-da4639fb><div class="flex items-center justify-between px-8 py-5 border-b border-slate-50" data-v-da4639fb><div class="flex items-center gap-3" data-v-da4639fb><span class="w-1.5 h-6 bg-teal-500 rounded-full" data-v-da4639fb></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Discovered Pages</h3><span class="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg" data-v-da4639fb>${ssrInterpolate(totalDiscovered.value)} total </span></div><button class="${ssrRenderClass([{ "opacity-50": isLoadingDiscovered.value }, "w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500"])}" data-v-da4639fb><svg class="${ssrRenderClass([{ "animate-spin": isLoadingDiscovered.value }, "w-3.5 h-3.5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-da4639fb></path></svg></button></div>`);
        if (isLoadingDiscovered.value) {
          _push(`<div class="p-8 space-y-3" data-v-da4639fb><!--[-->`);
          ssrRenderList(5, (n) => {
            _push(`<div class="h-11 bg-slate-50 rounded-2xl animate-pulse" data-v-da4639fb></div>`);
          });
          _push(`<!--]--></div>`);
        } else if (!discoveredPages.value.length) {
          _push(`<div class="flex flex-col items-center py-16" data-v-da4639fb><div class="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100" data-v-da4639fb><svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-da4639fb></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" data-v-da4639fb></path></svg></div><p class="text-xs font-black text-slate-600 uppercase tracking-tight mb-1" data-v-da4639fb>Waiting for traffic…</p><p class="text-[10px] text-slate-400" data-v-da4639fb>Pages appear here as soon as a user visits them on your site.</p></div>`);
        } else {
          _push(`<div class="divide-y divide-slate-50" data-v-da4639fb><!--[-->`);
          ssrRenderList(discoveredPages.value, (page) => {
            _push(`<div class="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/70 transition-all group" data-v-da4639fb><span class="flex-shrink-0 min-w-[2.5rem] h-8 flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl text-[10px] font-black text-teal-700" data-v-da4639fb>${ssrInterpolate(page.cdn_hit_count)}</span><div class="flex-1 min-w-0" data-v-da4639fb><p class="text-[11px] font-black text-slate-800 truncate" data-v-da4639fb>${ssrInterpolate(page.title || safePath(page.url))}</p><p class="text-[9px] text-slate-400 font-mono truncate mt-0.5" data-v-da4639fb>${ssrInterpolate(page.url)}</p></div>`);
            if (page.seo_score != null) {
              _push(`<div class="${ssrRenderClass([page.seo_score >= 80 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : page.seo_score >= 50 ? "border-amber-400 bg-amber-50 text-amber-700" : "border-rose-400 bg-rose-50 text-rose-700", "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] border-2"])}" data-v-da4639fb>${ssrInterpolate(page.seo_score)}</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<span class="flex-shrink-0 text-[9px] font-black text-slate-400 hidden md:block" data-v-da4639fb>${ssrInterpolate(page.cdn_last_seen_at)}</span>`);
            if (cdnDiscovery.value.sitemap_id) {
              _push(ssrRenderComponent(unref(Link), {
                href: _ctx.route("sitemaps.show", cdnDiscovery.value.sitemap_id),
                class: "flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-da4639fb${_scopeId}></path></svg>`);
                  } else {
                    return [
                      (openBlock(), createBlock("svg", {
                        class: "w-3.5 h-3.5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2.5",
                          d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        })
                      ]))
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (!webAnalysisResponse.value.sitemaps?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center" data-v-da4639fb><div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200" data-v-da4639fb><svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-da4639fb></path></svg></div><p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1" data-v-da4639fb>No Sitemaps Configured</p><p class="text-xs text-slate-400 max-w-xs" data-v-da4639fb>Add a sitemap in your site settings to start crawling and tracking index coverage.</p></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-v-da4639fb><!--[-->`);
        ssrRenderList(webAnalysisResponse.value.sitemaps, (sitemap) => {
          _push(`<div class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group" data-v-da4639fb><div class="flex items-start justify-between mb-6" data-v-da4639fb><div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform" data-v-da4639fb><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-da4639fb></path></svg></div><div class="flex flex-wrap items-center gap-1.5 justify-end" data-v-da4639fb><span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter" data-v-da4639fb>${ssrInterpolate(sitemap.links_count || 0)} URLs </span>`);
          if (sitemap.crawl_mode === "cdn" && cdnConnected.value) {
            _push(`<span class="px-2.5 py-1 bg-teal-50 text-teal-700 text-[9px] font-black rounded-full border border-teal-200 flex items-center gap-1" data-v-da4639fb><span class="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" data-v-da4639fb></span>Silent Crawl </span>`);
          } else if (sitemap.crawl_mode === "cdn" && !cdnConnected.value) {
            _push(`<span class="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full border border-slate-200 flex items-center gap-1" title="CDN pixel not connected — silent crawl inactive" data-v-da4639fb><span class="w-1.5 h-1.5 bg-slate-400 rounded-full" data-v-da4639fb></span>Silent Crawl </span>`);
          } else {
            _push(`<span class="px-2.5 py-1 bg-violet-50 text-violet-700 text-[9px] font-black rounded-full border border-violet-200 flex items-center gap-1" data-v-da4639fb><span class="w-1.5 h-1.5 bg-violet-400 rounded-full" data-v-da4639fb></span>Aggressive Crawl </span>`);
          }
          if (sitemap.is_discovery) {
            _push(`<span class="px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-full border border-amber-200" data-v-da4639fb> 🔍 Discovered </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
          _push(ssrRenderComponent(unref(Link), {
            href: _ctx.route("sitemaps.show", sitemap.id),
            class: "block text-sm font-black text-slate-900 mb-1 hover:text-indigo-600 transition-colors underline-offset-2 hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(sitemap.name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(sitemap.name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<p class="text-[10px] text-slate-400 font-mono truncate mb-4" data-v-da4639fb>${ssrInterpolate(sitemap.site_url)}</p><div class="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-da4639fb><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-da4639fb></path></svg> Last crawled: ${ssrInterpolate(sitemap.last_generated_at || "Never")}</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6" style="${ssrRenderStyle(activeSection.value === "health" ? null : { display: "none" })}" data-v-da4639fb><div class="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-xl" data-v-da4639fb><div class="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-[80px]" data-v-da4639fb></div><div class="flex items-center gap-3 mb-8" data-v-da4639fb><span class="w-1.5 h-6 bg-indigo-400 rounded-full" data-v-da4639fb></span><h3 class="text-sm font-black uppercase tracking-tight" data-v-da4639fb>Field Health Signals</h3></div><div class="grid grid-cols-2 gap-4 relative" data-v-da4639fb><!--[-->`);
      ssrRenderList([
        { label: "Unique Errors", value: webAnalysisResponse.value.error_summary?.unique_messages || 0, color: "rose", chart: true },
        { label: "Affected URLs", value: webAnalysisResponse.value.error_summary?.unique_urls || 0, color: "amber" },
        { label: "Total Events", value: webAnalysisResponse.value.error_summary?.total || 0, color: "indigo" },
        { label: "JS Warnings", value: webAnalysisResponse.value.error_summary?.warnings || 0, color: "slate" }
      ], (item) => {
        _push(`<div class="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between overflow-hidden group" data-v-da4639fb><div data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2" data-v-da4639fb>${ssrInterpolate(item.label)}</p><p class="text-3xl font-black leading-none" data-v-da4639fb>${ssrInterpolate(item.value)}</p></div>`);
        if (item.chart) {
          _push(`<div class="h-8 mt-3 -mx-5 -mb-5 opacity-40 group-hover:opacity-100 transition-all" data-v-da4639fb>`);
          _push(ssrRenderComponent(unref(Line), {
            data: errorChartData.value,
            options: chartOptions
          }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div><div class="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm flex flex-col" data-v-da4639fb><div class="flex items-center gap-3 mb-8" data-v-da4639fb><span class="w-1.5 h-6 bg-emerald-500 rounded-full" data-v-da4639fb></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Schema Performance</h3></div><div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8" data-v-da4639fb><div class="space-y-5" data-v-da4639fb><!--[-->`);
      ssrRenderList([
        { label: "Total AI Injections", value: webAnalysisResponse.value.schema_stats?.total_injections || 0, max: 1e3, color: "emerald" },
        { label: "Active Schemas", value: webAnalysisResponse.value.schema_stats?.active || 0, max: 500, color: "indigo" },
        { label: "Detected Conflicts", value: webAnalysisResponse.value.schema_stats?.conflicts || 0, max: 50, color: "rose" }
      ], (item) => {
        _push(`<div data-v-da4639fb><div class="flex items-center justify-between mb-1.5" data-v-da4639fb><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest" data-v-da4639fb>${ssrInterpolate(item.label)}</p><p class="text-sm font-black text-slate-900" data-v-da4639fb>${ssrInterpolate(item.value)}</p></div><div class="h-2 bg-slate-100 rounded-full overflow-hidden" data-v-da4639fb><div class="${ssrRenderClass([`bg-${item.color}-500`, "h-full rounded-full transition-all duration-700"])}" style="${ssrRenderStyle({ width: Math.min(100, item.value / item.max * 100) + "%" })}" data-v-da4639fb></div></div></div>`);
      });
      _push(`<!--]--></div><div class="h-32 bg-slate-50 rounded-2xl p-4 border border-slate-100" data-v-da4639fb><p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3" data-v-da4639fb>7D Injection Trend</p><div class="h-full pb-4" data-v-da4639fb>`);
      _push(ssrRenderComponent(unref(Bar), {
        data: injectionChartData.value,
        options: chartOptions
      }, null, _parent));
      _push(`</div></div></div><div class="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3" data-v-da4639fb><div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" data-v-da4639fb></div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-da4639fb>AI Schema Engine Running</p></div></div><div class="md:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-da4639fb><div class="flex items-center justify-between px-8 py-6 border-b border-slate-50" data-v-da4639fb><div class="flex items-center gap-3" data-v-da4639fb><span class="w-1.5 h-6 bg-violet-500 rounded-full" data-v-da4639fb></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Schema Debug</h3><span class="text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg" data-v-da4639fb>Last 20 Auto-Generated</span></div><button class="${ssrRenderClass([{ "opacity-50": isLoadingSchemaDbg.value }, "w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500"])}" data-v-da4639fb><svg class="${ssrRenderClass([{ "animate-spin": isLoadingSchemaDbg.value }, "w-3.5 h-3.5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-da4639fb></path></svg></button></div>`);
      if (isLoadingSchemaDbg.value) {
        _push(`<div class="p-8 space-y-3" data-v-da4639fb><!--[-->`);
        ssrRenderList(4, (n) => {
          _push(`<div class="h-12 bg-slate-50 rounded-2xl animate-pulse" data-v-da4639fb></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!schemaDebugItems.value.length) {
        _push(`<div class="flex flex-col items-center py-16 text-center" data-v-da4639fb><div class="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 border border-violet-100" data-v-da4639fb><svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-da4639fb></path></svg></div><p class="text-xs font-black text-slate-600 uppercase tracking-tight mb-1" data-v-da4639fb>No schemas generated yet</p><p class="text-[10px] text-slate-400 max-w-xs" data-v-da4639fb>Auto-generated schemas appear here once the CDN pixel fires with the <code class="bg-slate-100 px-1 rounded" data-v-da4639fb>schema</code> module enabled.</p></div>`);
      } else {
        _push(`<div class="divide-y divide-slate-50" data-v-da4639fb><!--[-->`);
        ssrRenderList(schemaDebugItems.value, (s) => {
          _push(`<div class="px-8 py-4 hover:bg-slate-50/70 cursor-pointer transition-all group" data-v-da4639fb><div class="flex items-center justify-between" data-v-da4639fb><div class="flex items-center gap-3 min-w-0" data-v-da4639fb><span class="${ssrRenderClass([s.schema_type === "article" ? "bg-amber-50 text-amber-700 border border-amber-200" : s.schema_type === "website" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-violet-50 text-violet-700 border border-violet-200", "px-2 py-0.5 text-[8px] font-black rounded-md uppercase"])}" data-v-da4639fb>${ssrInterpolate(s.schema_type)}</span><p class="text-[11px] font-semibold text-slate-700 truncate max-w-md font-mono" data-v-da4639fb>${ssrInterpolate(s.url)}</p></div><div class="flex items-center gap-3 flex-shrink-0" data-v-da4639fb><span class="text-[9px] font-black text-slate-400 uppercase" data-v-da4639fb>${ssrInterpolate(s.injected_count)} injections</span><span class="text-[9px] text-slate-400" data-v-da4639fb>${ssrInterpolate(s.last_injected_at)}</span><svg class="${ssrRenderClass([{ "rotate-90": expandedSchema.value === s.id }, "w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-all"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" data-v-da4639fb></path></svg></div></div>`);
          if (expandedSchema.value === s.id) {
            _push(`<div class="mt-4 animate-fade-in" data-v-da4639fb><pre class="text-[10px] bg-slate-900 text-emerald-300 rounded-2xl p-5 overflow-x-auto max-h-64 font-mono leading-relaxed" data-v-da4639fb>${ssrInterpolate(s.schema_preview)}</pre></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (showSeoModal.value) {
          _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" data-v-da4639fb><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" data-v-da4639fb></div><div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300" data-v-da4639fb><div class="px-10 py-8 border-b border-slate-50 bg-slate-50/50 relative" data-v-da4639fb><div class="flex items-center justify-between mb-2" data-v-da4639fb><div class="flex items-center gap-3" data-v-da4639fb><div class="w-2 h-8 bg-indigo-600 rounded-full" data-v-da4639fb></div><h2 class="text-xl font-black text-slate-900 uppercase tracking-tight" data-v-da4639fb>Technical SEO Deep-Dive</h2></div><button class="p-2 hover:bg-slate-200 rounded-full transition-colors" data-v-da4639fb><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" data-v-da4639fb></path></svg></button></div><p class="text-[11px] font-mono text-slate-400 truncate pr-20" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.url)}</p><div class="absolute top-8 right-24 flex items-center gap-4" data-v-da4639fb><div class="text-right" data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-da4639fb>Health Score</p><p class="${ssrRenderClass([selectedSeoLink.value?.seo_score >= 80 ? "text-emerald-500" : selectedSeoLink.value?.seo_score >= 50 ? "text-amber-500" : "text-rose-500", "text-2xl font-black"])}" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.seo_score)}% </p></div></div></div><div class="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar" data-v-da4639fb><div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10" data-v-da4639fb><div data-v-da4639fb><div class="flex items-center gap-2 mb-4" data-v-da4639fb><svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-da4639fb></path></svg><h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest" data-v-da4639fb>Action Items</h4></div><div class="space-y-2" data-v-da4639fb><!--[-->`);
          ssrRenderList(selectedSeoLink.value?.seo_audit?.errors, (err) => {
            _push2(`<div class="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3" data-v-da4639fb><span class="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" data-v-da4639fb></span><p class="text-[11px] font-bold text-rose-700 leading-tight" data-v-da4639fb>${ssrInterpolate(err)}</p></div>`);
          });
          _push2(`<!--]--><!--[-->`);
          ssrRenderList(selectedSeoLink.value?.seo_audit?.warnings, (wrn) => {
            _push2(`<div class="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3" data-v-da4639fb><span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" data-v-da4639fb></span><p class="text-[11px] font-bold text-amber-700 leading-tight" data-v-da4639fb>${ssrInterpolate(wrn)}</p></div>`);
          });
          _push2(`<!--]-->`);
          if (!selectedSeoLink.value?.seo_audit?.errors?.length && !selectedSeoLink.value?.seo_audit?.warnings?.length) {
            _push2(`<div class="p-8 border border-dashed border-slate-200 rounded-2xl text-center" data-v-da4639fb><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest" data-v-da4639fb>No major issues detected</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div><div data-v-da4639fb><div class="flex items-center gap-2 mb-4" data-v-da4639fb><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" data-v-da4639fb></path></svg><h4 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest" data-v-da4639fb>Optimization Passes</h4></div><div class="space-y-2 opacity-60 grayscale hover:grayscale-0 transition-all" data-v-da4639fb>`);
          if (selectedSeoLink.value?.title) {
            _push2(`<div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3" data-v-da4639fb><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" data-v-da4639fb></path></svg><p class="text-[10px] font-bold text-emerald-700 uppercase" data-v-da4639fb>Title Optimised</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (selectedSeoLink.value?.h1) {
            _push2(`<div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3" data-v-da4639fb><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" data-v-da4639fb></path></svg><p class="text-[10px] font-bold text-emerald-700 uppercase" data-v-da4639fb>Heading Structure Ok</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (selectedSeoLink.value?.http_status === 200) {
            _push2(`<div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3" data-v-da4639fb><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" data-v-da4639fb></path></svg><p class="text-[10px] font-bold text-emerald-700 uppercase" data-v-da4639fb>Server Status Indexed</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div><div class="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8" data-v-da4639fb><div class="flex items-center gap-2 mb-5" data-v-da4639fb><svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-da4639fb></path></svg><h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-widest" data-v-da4639fb>Metadata Context</h4></div><div class="space-y-4" data-v-da4639fb><div data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1" data-v-da4639fb>Title Tag</p><p class="text-xs font-bold text-slate-800" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.title || "Not Detected")}</p></div><div data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1" data-v-da4639fb>Primary H1</p><p class="text-xs font-bold text-slate-800" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.h1 || "Not Detected")}</p></div><div data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1" data-v-da4639fb>Description</p><p class="text-xs font-medium text-slate-500 leading-relaxed italic line-clamp-2" data-v-da4639fb> &quot;${ssrInterpolate(selectedSeoLink.value?.description || "No meta description found.")}&quot; </p></div></div></div><div class="flex items-center gap-6" data-v-da4639fb><div class="flex-1 p-5 bg-white border border-slate-100 rounded-2xl text-center" data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1" data-v-da4639fb>Load Time</p><p class="text-base font-black text-slate-900" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.load_time ? selectedSeoLink.value.load_time.toFixed(2) : "—")}s</p></div><div class="flex-1 p-5 bg-white border border-slate-100 rounded-2xl text-center" data-v-da4639fb><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1" data-v-da4639fb>Status Code</p><p class="${ssrRenderClass([selectedSeoLink.value?.http_status === 200 ? "text-emerald-500" : "text-rose-500", "text-base font-black"])}" data-v-da4639fb>${ssrInterpolate(selectedSeoLink.value?.http_status || "—")}</p></div></div></div><div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between" data-v-da4639fb><p class="text-[10px] font-medium text-slate-400 max-w-xs leading-tight" data-v-da4639fb> Last re-validated: ${ssrInterpolate(selectedSeoLink.value?.updated_at ? new Date(selectedSeoLink.value.updated_at).toLocaleString() : "Never")}</p><button${ssrIncludeBooleanAttr(isValidatingLink.value) ? " disabled" : ""} class="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-2xl text-xs font-black uppercase tracking-tight transition-all shadow-lg shadow-indigo-200" data-v-da4639fb>`);
          if (isValidatingLink.value) {
            _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" data-v-da4639fb><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-da4639fb></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-da4639fb></path></svg>`);
          } else {
            _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-da4639fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-da4639fb></path></svg>`);
          }
          _push2(`<span data-v-da4639fb>${ssrInterpolate(isValidatingLink.value ? "Validating..." : "Validate Changes")}</span></button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/WebAnalysisTab.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const WebAnalysisTab = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-da4639fb"]]);
export {
  WebAnalysisTab as default
};
