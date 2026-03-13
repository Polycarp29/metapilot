import { ref, computed, onMounted, onUnmounted, watch, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrRenderComponent } from "vue/server-renderer";
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
    const selectedSiteId = ref(null);
    const showSiteDropdown = ref(false);
    const siteSearchQuery = ref("");
    const expandedLink = ref(null);
    const activeSection = ref("seo");
    const webAnalysisResponse = ref({
      sitemaps: [],
      analysis_links: [],
      error_summary: {},
      schema_stats: {},
      trends: { labels: [], errors: [], injections: [] }
    });
    const isLoadingWebAnalysis = ref(false);
    let refreshInterval = null;
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
      refreshInterval = setInterval(fetchWebAnalysis, 6e4);
    });
    onUnmounted(() => clearInterval(refreshInterval));
    watch(selectedSiteId, () => fetchWebAnalysis());
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "pb-24 space-y-0" }, _attrs))} data-v-f0cf4575><div class="relative overflow-hidden rounded-[2.5rem] bg-slate-900 mb-10 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8" data-v-f0cf4575><div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" data-v-f0cf4575></div><div class="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" data-v-f0cf4575></div><div class="relative" data-v-f0cf4575><div class="flex items-center gap-3 mb-3" data-v-f0cf4575><span class="${ssrRenderClass([siteStatusInfo.value.color === "emerald" ? "bg-emerald-400 animate-pulse" : siteStatusInfo.value.color === "amber" ? "bg-amber-400" : "bg-slate-500", "w-2 h-2 rounded-full"])}" data-v-f0cf4575></span><span class="${ssrRenderClass([siteStatusInfo.value.color === "emerald" ? "text-emerald-400" : siteStatusInfo.value.color === "amber" ? "text-amber-400" : "text-slate-400", "text-[10px] font-black uppercase tracking-[0.2em]"])}" data-v-f0cf4575>${ssrInterpolate(siteStatusInfo.value.label)}</span></div><h1 class="text-3xl md:text-4xl font-black text-white tracking-tight" data-v-f0cf4575>Web Analysis</h1><p class="text-slate-400 text-sm font-medium mt-1.5" data-v-f0cf4575>Sitemap coverage · SEO intelligence · Schema health</p></div><div class="flex flex-wrap items-center gap-3 relative" data-v-f0cf4575><div class="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10" data-v-f0cf4575><!--[-->`);
      ssrRenderList([{ id: "seo", label: "SEO Insights" }, { id: "sitemaps", label: "Sitemaps" }, { id: "health", label: "Health" }], (s) => {
        _push(`<button class="${ssrRenderClass([activeSection.value === s.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap"])}" data-v-f0cf4575>${ssrInterpolate(s.label)}</button>`);
      });
      _push(`<!--]--></div><div class="relative" data-v-f0cf4575><button class="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight text-white transition-all" data-v-f0cf4575><svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" data-v-f0cf4575></path></svg> ${ssrInterpolate(selectedSite.value ? selectedSite.value.label : "All Sites")} <svg class="${ssrRenderClass([{ "rotate-180": showSiteDropdown.value }, "w-2.5 h-2.5 opacity-60 transition-transform"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" data-v-f0cf4575></path></svg></button>`);
      if (showSiteDropdown.value) {
        _push(`<div class="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden" data-v-f0cf4575><div class="p-3 border-b border-white/5" data-v-f0cf4575><input${ssrRenderAttr("value", siteSearchQuery.value)} placeholder="Search sites…" class="w-full bg-white/5 border-none rounded-xl text-[11px] font-bold text-slate-200 placeholder-slate-500 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-white/20" data-v-f0cf4575></div><div class="max-h-60 overflow-y-auto p-1.5" data-v-f0cf4575><button class="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2.5" data-v-f0cf4575><span class="w-1.5 h-1.5 bg-slate-500 rounded-full" data-v-f0cf4575></span> All Sites </button><!--[-->`);
        ssrRenderList(filteredSiteOptions.value, (site) => {
          _push(`<button class="${ssrRenderClass([selectedSiteId.value === site.id ? "text-white bg-white/5" : "text-slate-400", "w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black hover:bg-white/10 transition-all flex items-center justify-between group"])}" data-v-f0cf4575><div class="flex items-center gap-2.5" data-v-f0cf4575><span class="${ssrRenderClass([site.status === "verified_active" ? "bg-emerald-400" : site.status === "connected_inactive" ? "bg-amber-400" : "bg-slate-500", "w-1.5 h-1.5 rounded-full"])}" data-v-f0cf4575></span><span data-v-f0cf4575>${ssrInterpolate(site.label)}</span></div>`);
          if (selectedSiteId.value === site.id) {
            _push(`<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-f0cf4575></path></svg>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": isLoadingWebAnalysis.value }, "w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl transition-all text-white"])}" data-v-f0cf4575><svg class="${ssrRenderClass([{ "animate-spin": isLoadingWebAnalysis.value }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-f0cf4575></path></svg></button></div></div><div class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10" data-v-f0cf4575><div class="md:col-span-1 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm gap-2 group hover:shadow-md transition-all" data-v-f0cf4575><div class="relative w-28 h-28" data-v-f0cf4575><svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100" data-v-f0cf4575><circle cx="50" cy="50"${ssrRenderAttr("r", RING_R)} fill="none" stroke="#f1f5f9" stroke-width="8" data-v-f0cf4575></circle><circle cx="50" cy="50"${ssrRenderAttr("r", RING_R)} fill="none"${ssrRenderAttr("stroke", healthColor.value.ring)} stroke-width="8" stroke-linecap="round"${ssrRenderAttr("stroke-dasharray", RING_CIRC.value)}${ssrRenderAttr("stroke-dashoffset", ringDash.value)} class="transition-all duration-700" data-v-f0cf4575></circle></svg><div class="absolute inset-0 flex flex-col items-center justify-center" data-v-f0cf4575><span class="${ssrRenderClass([`text-${healthColor.value.text}-600`, "text-2xl font-black tracking-tight leading-none"])}" data-v-f0cf4575>${ssrInterpolate(overallHealthScore.value ?? "—")}</span><span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5" data-v-f0cf4575>Score</span></div></div><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center" data-v-f0cf4575>Avg SEO Health</p></div><!--[-->`);
      ssrRenderList([
        { label: "Sitemaps", value: webAnalysisResponse.value.sitemaps?.length || 0, color: "indigo", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", sub: "Indexed coverage" },
        { label: "AI Injections", value: webAnalysisResponse.value.schema_stats?.total_injections || 0, color: "emerald", icon: "M13 10V3L4 14h7v7l9-11h-7z", sub: "JSON-LD served" },
        { label: "JS Events", value: webAnalysisResponse.value.error_summary?.total || 0, color: "amber", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", sub: "7-day window" },
        { label: "SEO Conflicts", value: webAnalysisResponse.value.schema_stats?.conflicts || 0, color: "rose", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", sub: "Duplicate schema" }
      ], (stat) => {
        _push(`<div class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden" data-v-f0cf4575><div class="absolute top-0 right-0 p-5 opacity-40 group-hover:opacity-80 transition-all" data-v-f0cf4575><div class="${ssrRenderClass([`bg-${stat.color}-50`, "w-10 h-10 rounded-xl flex items-center justify-center"])}" data-v-f0cf4575><svg class="${ssrRenderClass([`text-${stat.color}-500`, "w-5 h-5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"${ssrRenderAttr("d", stat.icon)} data-v-f0cf4575></path></svg></div></div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" data-v-f0cf4575>${ssrInterpolate(stat.label)}</p><p class="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2" data-v-f0cf4575>${ssrInterpolate(stat.value)}</p><p class="text-[10px] text-slate-400 font-medium" data-v-f0cf4575>${ssrInterpolate(stat.sub)}</p></div>`);
      });
      _push(`<!--]--></div><div class="grid grid-cols-1 xl:grid-cols-3 gap-6" style="${ssrRenderStyle(activeSection.value === "seo" ? null : { display: "none" })}" data-v-f0cf4575><div class="xl:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-f0cf4575><div class="flex items-center justify-between px-8 py-6 border-b border-slate-50" data-v-f0cf4575><div class="flex items-center gap-3" data-v-f0cf4575><span class="w-1.5 h-6 bg-indigo-600 rounded-full" data-v-f0cf4575></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-f0cf4575>Page SEO Report</h3></div><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-f0cf4575>${ssrInterpolate(webAnalysisResponse.value.analysis_links?.length || 0)} pages </span></div>`);
      if (isLoadingWebAnalysis.value) {
        _push(`<div class="p-8 space-y-4" data-v-f0cf4575><!--[-->`);
        ssrRenderList(5, (n) => {
          _push(`<div class="h-12 bg-slate-50 rounded-2xl animate-pulse" data-v-f0cf4575></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!webAnalysisResponse.value.analysis_links?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-24 px-8 text-center" data-v-f0cf4575><div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200" data-v-f0cf4575><svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" data-v-f0cf4575></path></svg></div><p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1" data-v-f0cf4575>No Pages Crawled</p><p class="text-xs text-slate-400 font-medium max-w-xs" data-v-f0cf4575>Crawl a sitemap to populate SEO intelligence and AI-driven growth suggestions.</p></div>`);
      } else {
        _push(`<div class="overflow-y-auto max-h-[520px]" data-v-f0cf4575><table class="w-full text-left" data-v-f0cf4575><thead class="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10" data-v-f0cf4575><tr data-v-f0cf4575><th class="py-3 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-f0cf4575>Page</th><th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24" data-v-f0cf4575>Score</th><th class="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-8" data-v-f0cf4575>Tags</th></tr></thead><tbody data-v-f0cf4575><!--[-->`);
        ssrRenderList(webAnalysisResponse.value.analysis_links, (link) => {
          _push(`<tr class="border-t border-slate-50 hover:bg-slate-50/60 transition-all cursor-pointer group" data-v-f0cf4575><td class="py-4 px-8" data-v-f0cf4575><p class="text-xs font-black text-slate-800 leading-tight" data-v-f0cf4575>${ssrInterpolate(safePath(link.url))}</p><p class="text-[10px] text-slate-400 font-mono truncate max-w-[260px]" data-v-f0cf4575>${ssrInterpolate(safeHostname(link.url))}</p>`);
          if (expandedLink.value === link.id) {
            _push(`<div class="mt-3 space-y-2 animate-fade-in" data-v-f0cf4575>`);
            if (link.seo_bottlenecks?.length) {
              _push(`<div data-v-f0cf4575><p class="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1" data-v-f0cf4575>Bottlenecks</p><div class="flex flex-wrap gap-1.5" data-v-f0cf4575><!--[-->`);
              ssrRenderList(link.seo_bottlenecks, (b) => {
                _push(`<span class="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black rounded-lg border border-rose-100" data-v-f0cf4575>${ssrInterpolate(b)}</span>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            if (link.schema_suggestions?.length) {
              _push(`<div data-v-f0cf4575><p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 mt-2" data-v-f0cf4575>Schema Upgrades</p><div class="flex flex-wrap gap-1.5" data-v-f0cf4575><!--[-->`);
              ssrRenderList(link.schema_suggestions, (s) => {
                _push(`<span class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100" data-v-f0cf4575>${ssrInterpolate(s)}</span>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="py-4 px-4 text-center" data-v-f0cf4575><div class="${ssrRenderClass([link.seo_score >= 80 ? "border-emerald-400 bg-emerald-50 text-emerald-600" : link.seo_score >= 50 ? "border-amber-400 bg-amber-50 text-amber-600" : "border-rose-400 bg-rose-50 text-rose-600", "inline-flex items-center justify-center w-10 h-10 rounded-2xl border-2 font-black text-xs leading-none mx-auto transition-transform group-hover:scale-110"])}" data-v-f0cf4575>${ssrInterpolate(link.seo_score ?? "—")}</div></td><td class="py-4 px-4 pr-8 text-right" data-v-f0cf4575><div class="flex items-center justify-end gap-1.5 flex-wrap" data-v-f0cf4575>`);
          if (link.is_ad_ready) {
            _push(`<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md uppercase border border-indigo-100" data-v-f0cf4575>Ad Ready</span>`);
          } else {
            _push(`<!---->`);
          }
          if (link.seo_bottlenecks?.length) {
            _push(`<span class="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-md uppercase border border-rose-100" data-v-f0cf4575>${ssrInterpolate(link.seo_bottlenecks.length)} Issues </span>`);
          } else {
            _push(`<!---->`);
          }
          if (link.schema_suggestions?.length) {
            _push(`<span class="px-2 py-0.5 bg-blue-50 text-blue-500 text-[8px] font-black rounded-md uppercase border border-blue-100" data-v-f0cf4575> Schema+ </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<svg class="${ssrRenderClass([{ "rotate-90": expandedLink.value === link.id }, "w-3 h-3 text-slate-300 group-hover:text-slate-500 ml-1 flex-shrink-0 transition-all"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" data-v-f0cf4575></path></svg></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div><div class="space-y-5" data-v-f0cf4575><div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-f0cf4575><div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50" data-v-f0cf4575><span class="w-1.5 h-6 bg-rose-500 rounded-full" data-v-f0cf4575></span><h3 class="text-xs font-black text-slate-900 uppercase tracking-tight" data-v-f0cf4575>Top Bottleneck Pages</h3></div><div class="p-5 space-y-3" data-v-f0cf4575>`);
      if (!topBottleneckPages.value.length) {
        _push(`<div class="text-center py-8" data-v-f0cf4575><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest" data-v-f0cf4575>No bottlenecks ✓</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(topBottleneckPages.value, (link, i) => {
        _push(`<div class="flex items-center gap-4 group" data-v-f0cf4575><span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 text-[10px] font-black" data-v-f0cf4575>${ssrInterpolate(i + 1)}</span><div class="flex-1 min-w-0" data-v-f0cf4575><p class="text-[11px] font-black text-slate-800 truncate" data-v-f0cf4575>${ssrInterpolate(safePath(link.url))}</p><div class="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" data-v-f0cf4575><div class="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all" style="${ssrRenderStyle({ width: 100 - (link.seo_score || 0) + "%" })}" data-v-f0cf4575></div></div></div><span class="text-[10px] font-black text-rose-500 flex-shrink-0" data-v-f0cf4575>${ssrInterpolate(link.seo_bottlenecks?.length)} issues</span></div>`);
      });
      _push(`<!--]--></div></div><div class="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm" data-v-f0cf4575><div class="flex items-center gap-3 px-7 py-5 border-b border-slate-50" data-v-f0cf4575><span class="w-1.5 h-6 bg-blue-500 rounded-full" data-v-f0cf4575></span><h3 class="text-xs font-black text-slate-900 uppercase tracking-tight" data-v-f0cf4575>Schema Opportunities</h3></div><div class="p-5 space-y-3" data-v-f0cf4575>`);
      if (!schemaUpgradePages.value.length) {
        _push(`<div class="text-center py-8" data-v-f0cf4575><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest" data-v-f0cf4575>All schemas optimal</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(schemaUpgradePages.value, (link, i) => {
        _push(`<div class="flex items-center gap-4" data-v-f0cf4575><span class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-[10px] font-black" data-v-f0cf4575>${ssrInterpolate(i + 1)}</span><div class="flex-1 min-w-0" data-v-f0cf4575><p class="text-[11px] font-black text-slate-800 truncate" data-v-f0cf4575>${ssrInterpolate(safePath(link.url))}</p><div class="flex flex-wrap gap-1 mt-1.5" data-v-f0cf4575><!--[-->`);
        ssrRenderList((link.schema_suggestions || []).slice(0, 2), (s) => {
          _push(`<span class="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase" data-v-f0cf4575>${ssrInterpolate(s)}</span>`);
        });
        _push(`<!--]--></div></div></div>`);
      });
      _push(`<!--]--></div></div></div></div><div class="space-y-5" style="${ssrRenderStyle(activeSection.value === "sitemaps" ? null : { display: "none" })}" data-v-f0cf4575>`);
      if (!webAnalysisResponse.value.sitemaps?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center" data-v-f0cf4575><div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-200" data-v-f0cf4575><svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-f0cf4575></path></svg></div><p class="text-sm font-black text-slate-700 uppercase tracking-tight mb-1" data-v-f0cf4575>No Sitemaps Configured</p><p class="text-xs text-slate-400 max-w-xs" data-v-f0cf4575>Add a sitemap in your site settings to start crawling and tracking index coverage.</p></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-v-f0cf4575><!--[-->`);
        ssrRenderList(webAnalysisResponse.value.sitemaps, (sitemap) => {
          _push(`<div class="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group" data-v-f0cf4575><div class="flex items-start justify-between mb-6" data-v-f0cf4575><div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform" data-v-f0cf4575><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-f0cf4575></path></svg></div><span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter" data-v-f0cf4575>${ssrInterpolate(sitemap.links_count || 0)} URLs </span></div><h4 class="text-sm font-black text-slate-900 mb-1" data-v-f0cf4575>${ssrInterpolate(sitemap.name)}</h4><p class="text-[10px] text-slate-400 font-mono truncate mb-4" data-v-f0cf4575>${ssrInterpolate(sitemap.site_url)}</p><div class="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-f0cf4575><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f0cf4575><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-f0cf4575></path></svg> Last crawled: ${ssrInterpolate(sitemap.last_generated_at || "Never")}</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="${ssrRenderStyle(activeSection.value === "health" ? null : { display: "none" })}" data-v-f0cf4575><div class="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-xl" data-v-f0cf4575><div class="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-[80px]" data-v-f0cf4575></div><div class="flex items-center gap-3 mb-8" data-v-f0cf4575><span class="w-1.5 h-6 bg-indigo-400 rounded-full" data-v-f0cf4575></span><h3 class="text-sm font-black uppercase tracking-tight" data-v-f0cf4575>Field Health Signals</h3></div><div class="grid grid-cols-2 gap-4 relative" data-v-f0cf4575><!--[-->`);
      ssrRenderList([
        { label: "Unique Errors", value: webAnalysisResponse.value.error_summary?.unique_messages || 0, color: "rose", chart: true },
        { label: "Affected URLs", value: webAnalysisResponse.value.error_summary?.unique_urls || 0, color: "amber" },
        { label: "Total Events", value: webAnalysisResponse.value.error_summary?.total || 0, color: "indigo" },
        { label: "JS Warnings", value: webAnalysisResponse.value.error_summary?.warnings || 0, color: "slate" }
      ], (item) => {
        _push(`<div class="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between overflow-hidden group" data-v-f0cf4575><div data-v-f0cf4575><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2" data-v-f0cf4575>${ssrInterpolate(item.label)}</p><p class="text-3xl font-black leading-none" data-v-f0cf4575>${ssrInterpolate(item.value)}</p></div>`);
        if (item.chart) {
          _push(`<div class="h-8 mt-3 -mx-5 -mb-5 opacity-40 group-hover:opacity-100 transition-all" data-v-f0cf4575>`);
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
      _push(`<!--]--></div></div><div class="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm flex flex-col" data-v-f0cf4575><div class="flex items-center gap-3 mb-8" data-v-f0cf4575><span class="w-1.5 h-6 bg-emerald-500 rounded-full" data-v-f0cf4575></span><h3 class="text-sm font-black text-slate-900 uppercase tracking-tight" data-v-f0cf4575>Schema Performance</h3></div><div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8" data-v-f0cf4575><div class="space-y-5" data-v-f0cf4575><!--[-->`);
      ssrRenderList([
        { label: "Total AI Injections", value: webAnalysisResponse.value.schema_stats?.total_injections || 0, max: 1e3, color: "emerald" },
        { label: "Active Schemas", value: webAnalysisResponse.value.schema_stats?.active || 0, max: 500, color: "indigo" },
        { label: "Detected Conflicts", value: webAnalysisResponse.value.schema_stats?.conflicts || 0, max: 50, color: "rose" }
      ], (item) => {
        _push(`<div data-v-f0cf4575><div class="flex items-center justify-between mb-1.5" data-v-f0cf4575><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest" data-v-f0cf4575>${ssrInterpolate(item.label)}</p><p class="text-sm font-black text-slate-900" data-v-f0cf4575>${ssrInterpolate(item.value)}</p></div><div class="h-2 bg-slate-100 rounded-full overflow-hidden" data-v-f0cf4575><div class="${ssrRenderClass([`bg-${item.color}-500`, "h-full rounded-full transition-all duration-700"])}" style="${ssrRenderStyle({ width: Math.min(100, item.value / item.max * 100) + "%" })}" data-v-f0cf4575></div></div></div>`);
      });
      _push(`<!--]--></div><div class="h-32 bg-slate-50 rounded-2xl p-4 border border-slate-100" data-v-f0cf4575><p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3" data-v-f0cf4575>7D Injection Trend</p><div class="h-full pb-4" data-v-f0cf4575>`);
      _push(ssrRenderComponent(unref(Bar), {
        data: injectionChartData.value,
        options: chartOptions
      }, null, _parent));
      _push(`</div></div></div><div class="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3" data-v-f0cf4575><div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" data-v-f0cf4575></div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-f0cf4575>AI Schema Engine Running</p></div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/WebAnalysisTab.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const WebAnalysisTab = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f0cf4575"]]);
export {
  WebAnalysisTab as default
};
