import { ref, computed, watch, onMounted, withCtx, unref, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, withDirectives, Fragment, renderList, vModelSelect, withKeys, vModelText, createTextVNode, vModelCheckbox, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderStyle, ssrRenderClass } from "vue/server-renderer";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import axios from "axios";
import { Bar, Doughnut, Line } from "vue-chartjs";
import { Chart, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement } from "chart.js";
import "pinia";
import "@inertiajs/vue3";
import "./Toaster-DHWaylML.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Signals",
  __ssrInlineRender: true,
  props: {
    organization: Object,
    pixelSites: Array,
    initialPath: String,
    initialSiteId: [Number, String]
  },
  setup(__props) {
    Chart.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement);
    const props = __props;
    const path = ref(props.initialPath || "");
    const siteId = ref(props.initialSiteId || null);
    const period = ref(30);
    const loading = ref(false);
    const data = ref(null);
    const pathInput = ref(props.initialPath || "");
    const toast = useToastStore();
    const injectingPage = ref(null);
    const fetchingSource = ref(null);
    const liveMode = ref(true);
    let pollInterval = null;
    const logFilters = ref({
      type: "all",
      device: "all",
      country: "all",
      only_conversions: false,
      start_date: "",
      end_date: ""
    });
    const safeHost = (url) => {
      try {
        return url ? new URL(url).hostname : "";
      } catch {
        return url || "";
      }
    };
    const safePath = (url) => {
      try {
        return url ? new URL(url).pathname : "/";
      } catch {
        return url || "/";
      }
    };
    const fmtS = (s2) => (s2 || 0) >= 60 ? `${Math.floor(s2 / 60)}m ${Math.round(s2 % 60)}s` : `${Math.round(s2 || 0)}s`;
    const fmtMs = (ms) => (ms || 0) >= 1e3 ? `${(ms / 1e3).toFixed(1)}s` : `${Math.round(ms || 0)}ms`;
    const countryFlag = (code) => {
      if (!code || code.length !== 2) return "🌍";
      try {
        return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
      } catch {
        return "🌍";
      }
    };
    const fetch = async () => {
      if (!path.value) return;
      loading.value = true;
      try {
        const r = await axios.get(route("path.analysis"), {
          params: { path: path.value, pixel_site_id: siteId.value, period: period.value }
        });
        data.value = r.data;
      } catch (e) {
        console.error("Path analysis fetch error:", e);
        toast.error("Failed to load path analysis");
      } finally {
        loading.value = false;
      }
    };
    const go = () => {
      if (pathInput.value) {
        path.value = pathInput.value;
        fetch();
      }
    };
    const s = computed(() => data.value?.summary || {});
    const severityClass = computed(() => {
      const sc = s.value?.bottleneck_score ?? 0;
      if (sc >= 60) return "text-rose-600 bg-rose-50 border-rose-200";
      if (sc >= 35) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    });
    const dailyChartData = computed(() => {
      const rows = data.value?.daily_history || [];
      return {
        labels: rows.map((r) => r.label),
        datasets: [
          { type: "bar", label: "Visits", data: rows.map((r) => r.visits), backgroundColor: "rgba(99,102,241,0.7)", borderRadius: 6, order: 2 },
          { type: "line", label: "Ad Hits", data: rows.map((r) => r.ad_hits), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.08)", fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, order: 1 }
        ]
      };
    });
    const hourChartData = computed(() => {
      const rows = data.value?.hour_pattern || [];
      return {
        labels: rows.map((r) => `${r.hour}h`),
        datasets: [{ label: "Visits", data: rows.map((r) => r.visits), backgroundColor: rows.map((r) => (r.visits || 0) > 0 ? "rgba(99,102,241,0.8)" : "rgba(226,232,240,0.5)"), borderRadius: 4 }]
      };
    });
    const deviceChartData = computed(() => {
      const rows = data.value?.by_device || [];
      return {
        labels: rows.map((r) => r.name),
        datasets: [{ data: rows.map((r) => r.count), backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#f43f5e"], borderWidth: 0 }]
      };
    });
    const loyaltyChartData = computed(() => {
      const ret = s.value?.returning_rate || 0;
      return {
        labels: ["New Users", "Returning"],
        datasets: [{ data: [100 - ret, ret], backgroundColor: ["#6366f1", "#10b981"], borderWidth: 0 }]
      };
    });
    const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 10 } } } } };
    const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 10 } } } };
    const logEvents = ref({ data: [], total: 0, from: 0, to: 0, last_page: 1 });
    const logPage = ref(1);
    const logLoading = ref(false);
    const selectedSession = ref(null);
    const sessionEvents = ref([]);
    const sessionIsLead = computed(() => {
      if (!selectedSession.value) return false;
      const total = (sessionEvents.value || []).reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
      return total >= 90 || (sessionEvents.value || []).some((e) => (e.duration_seconds || 0) >= 60);
    });
    const sessionChartData = computed(() => ({
      labels: (sessionEvents.value || []).map((e) => new Date(e.created_at).toLocaleTimeString()),
      datasets: [{
        label: "Engagement",
        data: (sessionEvents.value || []).map((e) => e.click_count || 0),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        fill: true,
        tension: 0.5,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#6366f1",
        pointBorderWidth: 2
      }]
    }));
    const fetchLog = async (silent = false) => {
      if (!path.value) return;
      if (!silent) logLoading.value = true;
      try {
        const params = {
          search: path.value,
          page: logPage.value,
          per_page: 20,
          pixel_site_id: siteId.value,
          exclude_bots: true,
          ...logFilters.value
        };
        if (params.type === "all") delete params.type;
        if (params.device === "all") delete params.device;
        if (params.country === "all") delete params.country;
        const r = await axios.get(route("google-ads.pixel-events"), { params });
        logEvents.value = r.data;
      } catch (e) {
        if (!silent) console.error("Log fetch error:", e);
      } finally {
        if (!silent) logLoading.value = false;
      }
    };
    const startPolling = () => {
      pollInterval = setInterval(() => fetchLog(true), 1e4);
    };
    const stopPolling = () => {
      clearInterval(pollInterval);
    };
    const openSession = async (event) => {
      selectedSession.value = event;
      sessionEvents.value = [event];
      if (event.session_id) {
        try {
          const r = await axios.get(route("google-ads.pixel-events"), {
            params: { search: event.session_id, per_page: 100, pixel_site_id: siteId.value }
          });
          sessionEvents.value = (r.data.data || []).filter((e) => e.session_id === event.session_id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } catch {
        }
      }
    };
    const autoInjectSchema = async () => {
      if (!siteId.value) return toast.error("Please select a pixel site first.", "Error");
      injectingPage.value = path.value;
      try {
        const res = await axios.post(route("google-ads.generate-schema"), { pixel_site_id: siteId.value, url: path.value });
        toast.success(res.data.message, "Schema Generated");
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to generate schema.", "Error");
      } finally {
        injectingPage.value = null;
      }
    };
    const viewPageSource = async () => {
      fetchingSource.value = path.value;
      try {
        const res = await axios.get(route("google-ads.page-source"), { params: { url: path.value } });
        const win = window.open("", "_blank");
        win.document.write("<pre>" + (res.data.html || "").replace(/</g, "&lt;") + "</pre>");
      } catch (e) {
        toast.error("Failed to fetch page source.", "Error");
      } finally {
        fetchingSource.value = null;
      }
    };
    const copyJourney = () => {
      const urls = (sessionEvents.value || []).map((e) => e.page_url).filter(Boolean).join("\n");
      navigator.clipboard.writeText(urls);
    };
    watch([path, siteId, period], () => {
      if (path.value) {
        logPage.value = 1;
        fetch();
        fetchLog();
      }
    });
    watch(logPage, fetchLog);
    watch(logFilters, fetchLog, { deep: true });
    watch(liveMode, (val) => {
      if (val) startPolling();
      else stopPolling();
    });
    onMounted(() => {
      console.log("Signals dashboard mounted", { path: props.initialPath });
      if (path.value) {
        fetch();
        fetchLog();
        startPolling();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="min-h-screen bg-slate-50 p-6 space-y-6"${_scopeId}><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><div class="flex flex-wrap items-end gap-4"${_scopeId}><div class="flex-1 min-w-0"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1"${_scopeId}>Path Intelligence</p><h1 class="text-2xl font-black text-slate-900 truncate"${_scopeId}>${ssrInterpolate(path.value ? safePath(path.value) : "Select a page to analyse")}</h1>`);
            if (path.value) {
              _push2(`<p class="text-xs text-slate-400 mt-0.5 truncate"${_scopeId}>${ssrInterpolate(path.value)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex flex-wrap items-center gap-3"${_scopeId}><select class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0"${_scopeId}><option${ssrRenderAttr("value", null)}${ssrIncludeBooleanAttr(Array.isArray(siteId.value) ? ssrLooseContain(siteId.value, null) : ssrLooseEqual(siteId.value, null)) ? " selected" : ""}${_scopeId}>All Sites</option><!--[-->`);
            ssrRenderList(__props.pixelSites, (s2) => {
              _push2(`<option${ssrRenderAttr("value", s2.id)}${ssrIncludeBooleanAttr(Array.isArray(siteId.value) ? ssrLooseContain(siteId.value, s2.id) : ssrLooseEqual(siteId.value, s2.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(s2.label)}</option>`);
            });
            _push2(`<!--]--></select><select class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0"${_scopeId}><option${ssrRenderAttr("value", 7)}${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 7) : ssrLooseEqual(period.value, 7)) ? " selected" : ""}${_scopeId}>7 days</option><option${ssrRenderAttr("value", 30)}${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 30) : ssrLooseEqual(period.value, 30)) ? " selected" : ""}${_scopeId}>30 days</option><option${ssrRenderAttr("value", 90)}${ssrIncludeBooleanAttr(Array.isArray(period.value) ? ssrLooseContain(period.value, 90) : ssrLooseEqual(period.value, 90)) ? " selected" : ""}${_scopeId}>90 days</option></select><div class="flex gap-2"${_scopeId}><input${ssrRenderAttr("value", pathInput.value)} placeholder="Paste page URL…" class="text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 w-64"${_scopeId}><button class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all"${_scopeId}>Analyse</button></div></div></div></div>`);
            if (loading.value) {
              _push2(`<div class="flex items-center justify-center py-24"${_scopeId}><div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"${_scopeId}></div></div>`);
            } else if (!path.value) {
              _push2(`<div class="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center"${_scopeId}><div class="flex justify-center text-slate-300 mb-4"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 animate-bounce"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"${_scopeId}></path></svg></div><p class="text-sm font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Enter a page URL above or click &quot;Analyse&quot; from Path Intelligence</p></div>`);
            } else if (data.value) {
              _push2(`<!--[--><div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"${_scopeId}><!--[-->`);
              ssrRenderList([
                { label: "Total Visits", value: s.value.total_visits || 0, sub: (s.value.unique_sessions || 0) + " sessions", color: "indigo" },
                { label: "Bounce Rate", value: (s.value.bounce_rate || 0) + "%", sub: (s.value.bounce_rate || 0) > 50 ? "High ⚠" : "Good ✓", color: (s.value.bounce_rate || 0) > 50 ? "rose" : "emerald" },
                { label: "Avg Dwell", value: fmtS(s.value.avg_dwell), sub: (s.value.avg_scroll || 0) + "% scroll", color: "violet" },
                { label: "User Loyalty", value: (s.value.returning_rate || 0) + "%", sub: "Returning Users", color: "emerald" },
                { label: "Engagement", value: s.value.engagement_score || 0, sub: (s.value.engagement_score || 0) >= 65 ? "Ad Ready ✓" : "Building", color: (s.value.engagement_score || 0) >= 65 ? "emerald" : "amber" },
                { label: "Ad Traffic", value: s.value.ad_hits || 0, sub: "paid hits", color: "amber" },
                { label: "Avg Clicks", value: s.value.avg_clicks || 0, sub: "per session", color: "sky" }
              ], (card) => {
                _push2(`<div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"${_scopeId}>${ssrInterpolate(card.label)}</p><p class="text-2xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(card.value)}</p><p class="text-[10px] text-slate-400 font-bold mt-1"${_scopeId}>${ssrInterpolate(card.sub)}</p></div>`);
              });
              _push2(`<!--]--></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"${_scopeId}><div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>${ssrInterpolate(period.value)}-Day Traffic</p><div class="h-56"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Bar), {
                data: dailyChartData.value,
                options: chartOpts
              }, null, _parent2, _scopeId));
              _push2(`</div></div><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Hour-of-Day</p><div class="h-56"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Bar), {
                data: hourChartData.value,
                options: { ...chartOpts, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 8 } }, y: { beginAtZero: true, display: false } } }
              }, null, _parent2, _scopeId));
              _push2(`</div></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-6"${_scopeId}><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Countries</p><div class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(data.value.by_country || [], (c) => {
                _push2(`<div class="flex items-center gap-3"${_scopeId}><span class="text-xl w-7 shrink-0"${_scopeId}>${ssrInterpolate(countryFlag(c.code))}</span><div class="flex-1 min-w-0"${_scopeId}><div class="flex justify-between items-center mb-1"${_scopeId}><span class="text-xs font-bold text-slate-700 truncate"${_scopeId}>${ssrInterpolate(c.code)}</span><span class="text-xs font-black text-slate-900 ml-2"${_scopeId}>${ssrInterpolate(c.count)}</span></div><div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"${_scopeId}><div class="h-full bg-indigo-500 rounded-full" style="${ssrRenderStyle({ width: c.count / (data.value.by_country[0]?.count || 1) * 100 + "%" })}"${_scopeId}></div></div></div></div>`);
              });
              _push2(`<!--]--></div></div><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Device Split</p><div class="h-40 mb-4"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Doughnut), {
                data: deviceChartData.value,
                options: donutOpts
              }, null, _parent2, _scopeId));
              _push2(`</div></div><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Loyalty: New vs Returning</p><div class="h-40 mb-4"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Doughnut), {
                data: loyaltyChartData.value,
                options: donutOpts
              }, null, _parent2, _scopeId));
              _push2(`</div></div><div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"${_scopeId}><p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Top Referrers</p><div class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(data.value.referrers || [], (r) => {
                _push2(`<div class="flex items-center justify-between gap-3"${_scopeId}><span class="text-xs font-bold text-slate-700 truncate"${_scopeId}>${ssrInterpolate(safeHost(r.domain) || "Direct / None")}</span><span class="text-xs font-black text-slate-900 shrink-0"${_scopeId}>${ssrInterpolate(r.count)}</span></div>`);
              });
              _push2(`<!--]--></div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"${_scopeId}><div class="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"${_scopeId}><div class="absolute top-0 right-0 p-8 opacity-10"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-32 h-32"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"${_scopeId}></path></svg></div><div class="relative z-10"${_scopeId}><div class="flex items-center justify-between mb-8"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl shadow-lg shadow-rose-900/50"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-lg font-black tracking-tight"${_scopeId}>Real-time Exception Console</h3><p class="text-[10px] font-black text-rose-400/80 uppercase tracking-widest mt-0.5"${_scopeId}>Live Runtime Monitoring</p></div></div><div class="flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20"${_scopeId}><div class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"${_scopeId}></div><span class="text-[9px] font-black uppercase tracking-widest text-rose-400"${_scopeId}>Active</span></div></div><div class="space-y-4 max-h-[420px] overflow-y-auto pr-4 custom-scrollbar"${_scopeId}><!--[-->`);
              ssrRenderList(data.value.errors || [], (err) => {
                _push2(`<div class="p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl group hover:bg-slate-800 transition-all hover:border-rose-500/30"${_scopeId}><div class="flex items-start justify-between gap-4 mb-3"${_scopeId}><div class="min-w-0"${_scopeId}><p class="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1"${_scopeId}>${ssrInterpolate(err.type)} · ${ssrInterpolate(new Date(err.created_at).toLocaleTimeString())}</p><h4 class="text-sm font-black text-white leading-relaxed"${_scopeId}>${ssrInterpolate(err.message)}</h4></div><span class="px-2 py-1 bg-slate-900 rounded-lg text-[9px] font-black text-slate-500 shrink-0 border border-slate-700"${_scopeId}>${ssrInterpolate(err.load_time_ms)}ms</span></div><div class="text-[10px] font-mono text-slate-500 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 break-all group-hover:text-slate-300"${_scopeId}> at ${ssrInterpolate(err.filename || "anonymous")}:${ssrInterpolate(err.line)}:${ssrInterpolate(err.col)}</div></div>`);
              });
              _push2(`<!--]-->`);
              if (!data.value.errors?.length) {
                _push2(`<div class="flex flex-col items-center justify-center py-24 text-slate-600"${_scopeId}><div class="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center text-3xl mb-4 border border-slate-700/30"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 text-emerald-500/50"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"${_scopeId}></path></svg></div><p class="text-xs font-black uppercase tracking-widest"${_scopeId}>No runtime exceptions detected</p><p class="text-[10px] font-bold text-slate-700 mt-2"${_scopeId}>Health Score: 100%</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>Strategic Intelligence</p><div class="flex items-center gap-6 mb-8"${_scopeId}><div class="w-24 h-24 rounded-3xl bg-slate-50 flex flex-col items-center justify-center border-2 border-slate-100"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Intent</p><p class="text-xs font-black text-slate-900 mt-1 uppercase"${_scopeId}>${ssrInterpolate(data.value.summary?.top_intent || "General")}</p></div><div class="flex-1 space-y-2"${_scopeId}><p class="text-xs font-bold text-slate-600 leading-relaxed"${_scopeId}> MetaPilot detected <span class="text-indigo-600 font-black"${_scopeId}>${ssrInterpolate(data.value.summary?.top_intent)} intent</span> based on organic traffic patterns. </p></div></div><div class="space-y-4"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"${_scopeId}>Recommendations</p><!--[-->`);
              ssrRenderList(data.value.recommendations || [], (rec, idx) => {
                _push2(`<div class="${ssrRenderClass([{
                  "bg-rose-50 border-rose-100 text-rose-700": rec.type === "critical",
                  "bg-amber-50 border-amber-100 text-amber-700": rec.type === "warning",
                  "bg-indigo-50 border-indigo-100 text-indigo-700": rec.type === "success"
                }, "flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1"])}"${_scopeId}><div class="w-5 h-5 mt-0.5"${_scopeId}>`);
                if (rec.type === "critical") {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"${_scopeId}></path></svg>`);
                } else if (rec.type === "warning") {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"${_scopeId}></path></svg>`);
                } else {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
                }
                _push2(`</div><p class="text-xs font-bold leading-relaxed"${_scopeId}>${ssrInterpolate(rec.text)}</p></div>`);
              });
              _push2(`<!--]--></div></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 mb-12"${_scopeId}><div class="flex items-center justify-between mb-8"${_scopeId}><div${_scopeId}><h2 class="text-lg font-black text-slate-900"${_scopeId}>User Journey Flow</h2><p class="text-xs text-slate-400 font-bold"${_scopeId}>Forensics on where users arrive from and their next destination</p></div><div class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase"${_scopeId}> Avg Dwell: ${ssrInterpolate(fmtS(s.value.avg_dwell))}</div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative"${_scopeId}><div class="space-y-4"${_scopeId}><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center"${_scopeId}>← CAME FROM</p><div class="space-y-2"${_scopeId}><!--[-->`);
              ssrRenderList(data.value.prev_pages || [], (p) => {
                _push2(`<div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all"${_scopeId}><span class="text-xs font-bold text-slate-700 truncate max-w-[140px]"${ssrRenderAttr("title", p.page_url)}${_scopeId}>${ssrInterpolate(safePath(p.page_url))}</span><span class="text-xs font-black text-indigo-600"${_scopeId}>${ssrInterpolate(p.count)}</span></div>`);
              });
              _push2(`<!--]-->`);
              if (!(data.value.prev_pages || []).length) {
                _push2(`<div class="text-center py-8 text-[10px] font-black text-slate-300 uppercase italic"${_scopeId}>Direct Entry Page</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="relative z-10"${_scopeId}><div class="bg-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-200 text-center transform scale-110"${_scopeId}><p class="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2"${_scopeId}>CURRENT PAGE ANALYSIS</p><p class="text-sm font-black text-white truncate px-2"${_scopeId}>${ssrInterpolate(safePath(path.value))}</p><div class="mt-6 flex justify-center gap-6 border-t border-indigo-500 pt-6"${_scopeId}><div${_scopeId}><p class="text-xl font-black text-white"${_scopeId}>${ssrInterpolate(s.value.entry_rate || 0)}%</p><p class="text-[9px] text-indigo-300 font-black uppercase"${_scopeId}>Entry</p></div><div class="w-px h-8 bg-indigo-500"${_scopeId}></div><div${_scopeId}><p class="text-xl font-black text-white"${_scopeId}>${ssrInterpolate(s.value.exit_rate || 0)}%</p><p class="text-[9px] text-indigo-300 font-black uppercase"${_scopeId}>Exit</p></div></div></div></div><div class="space-y-4"${_scopeId}><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center"${_scopeId}>NEXT DESTINATION →</p><div class="space-y-2"${_scopeId}><!--[-->`);
              ssrRenderList(data.value.next_pages || [], (p) => {
                _push2(`<div class="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-emerald-300 transition-all"${_scopeId}><span class="text-xs font-bold text-emerald-800 truncate max-w-[140px]"${ssrRenderAttr("title", p.page_url)}${_scopeId}>${ssrInterpolate(safePath(p.page_url))}</span><span class="text-xs font-black text-emerald-600"${_scopeId}>${ssrInterpolate(p.count)}</span></div>`);
              });
              _push2(`<!--]-->`);
              if (!(data.value.next_pages || []).length) {
                _push2(`<div class="text-center py-8 text-[10px] font-black text-slate-300 uppercase italic"${_scopeId}>Drop-off / Exit Page</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8"${_scopeId}><h3 class="text-sm font-black text-slate-900 mb-8 uppercase tracking-widest"${_scopeId}>Lead Attribution Logic</h3><div class="grid grid-cols-1 gap-4"${_scopeId}><!--[-->`);
              ssrRenderList([
                { label: "Hot Potential", count: s.value.hot_leads, desc: "High dwell time & interaction", color: "rose", icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z" },
                { label: "Warm Interest", count: s.value.warm_leads, desc: "Significant dwell or scroll", color: "amber", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
                { label: "Cold Pass-through", count: s.value.cold_leads, desc: "Minimal site interaction", color: "slate", icon: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z" }
              ], (lead) => {
                _push2(`<div class="${ssrRenderClass([`bg-${lead.color}-50/50 border-${lead.color}-100`, "flex items-center gap-6 p-6 rounded-3xl border transition-all hover:shadow-md"])}"${_scopeId}><div class="${ssrRenderClass([`text-${lead.color}-500`, "w-10 h-10 flex items-center justify-center text-slate-400"])}"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round"${ssrRenderAttr("d", lead.icon)}${_scopeId}></path></svg></div><div class="flex-1"${_scopeId}><div class="flex justify-between items-center"${_scopeId}><span class="text-xs font-black text-slate-700 uppercase tracking-tight"${_scopeId}>${ssrInterpolate(lead.label)}</span><span class="text-2xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(lead.count || 0)}</span></div><p class="text-[10px] text-slate-400 font-bold mt-1"${_scopeId}>${ssrInterpolate(lead.desc)}</p></div></div>`);
              });
              _push2(`<!--]--></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8"${_scopeId}><div class="flex items-center justify-between mb-8"${_scopeId}><h3 class="text-sm font-black text-slate-900 uppercase tracking-widest"${_scopeId}>Behavioral Bottlenecks</h3><span class="${ssrRenderClass([severityClass.value, "px-4 py-2 rounded-xl text-[10px] font-black border shadow-sm"])}"${_scopeId}>${ssrInterpolate(s.value.bottleneck_severity?.toUpperCase())} SCORE: ${ssrInterpolate(s.value.bottleneck_score)}</span></div><div class="grid grid-cols-2 gap-4"${_scopeId}><!--[-->`);
              ssrRenderList([
                { label: "Avg Load Time", val: fmtMs(s.value.avg_load_ms), bad: s.value.avg_load_ms > 3e3 },
                { label: "Bounce Rate", val: (s.value.bounce_rate || 0) + "%", bad: (s.value.bounce_rate || 0) > 50 },
                { label: "Scroll Depth", val: (s.value.avg_scroll || 0) + "%", bad: (s.value.avg_scroll || 0) < 30 },
                { label: "JS Errors", val: (data.value.errors || []).length + " issues", bad: (data.value.errors || []).length > 0 }
              ], (m) => {
                _push2(`<div class="${ssrRenderClass([m.bad ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100", "p-6 rounded-3xl border transition-all hover:shadow-md"])}"${_scopeId}><p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2"${_scopeId}>${ssrInterpolate(m.label)}</p><p class="text-xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(m.val)}</p></div>`);
              });
              _push2(`<!--]--></div></div></div><div class="bg-indigo-950 rounded-[2.5rem] p-8 mb-12 text-white shadow-2xl relative overflow-hidden"${_scopeId}><div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none"${_scopeId}></div><div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8"${_scopeId}><div${_scopeId}><p class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2"${_scopeId}>Technical Automation</p><h3 class="text-xl font-black"${_scopeId}>Optimization Engine</h3><p class="text-sm text-indigo-200/60 mt-1 max-w-md"${_scopeId}>Instantly improve SEO and performance for this specific page using MetaPilot&#39;s automated tools.</p></div><div class="flex flex-wrap gap-4"${_scopeId}><button${ssrIncludeBooleanAttr(injectingPage.value === path.value) ? " disabled" : ""} class="px-6 py-4 bg-indigo-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all active:scale-95"${_scopeId}>${ssrInterpolate(injectingPage.value === path.value ? "Injecting..." : "Auto-Inject Schema")}</button><button${ssrIncludeBooleanAttr(fetchingSource.value === path.value) ? " disabled" : ""} class="px-6 py-4 bg-white/10 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 active:scale-95"${_scopeId}> View Page Source </button></div></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12"${_scopeId}><div class="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6"${_scopeId}><div${_scopeId}><h2 class="text-lg font-black text-slate-900"${_scopeId}>Signal Intelligence</h2><p class="text-xs text-slate-400 font-bold"${_scopeId}>Real-time visitor forensics and interaction timeline</p></div><div class="flex flex-wrap items-center gap-3"${_scopeId}><select class="text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0"${_scopeId}><option value="all"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.type) ? ssrLooseContain(logFilters.value.type, "all") : ssrLooseEqual(logFilters.value.type, "all")) ? " selected" : ""}${_scopeId}>All Traffic</option><option value="ads"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.type) ? ssrLooseContain(logFilters.value.type, "ads") : ssrLooseEqual(logFilters.value.type, "ads")) ? " selected" : ""}${_scopeId}>Paid (Ads)</option><option value="organic"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.type) ? ssrLooseContain(logFilters.value.type, "organic") : ssrLooseEqual(logFilters.value.type, "organic")) ? " selected" : ""}${_scopeId}>Organic</option></select><select class="text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0"${_scopeId}><option value="all"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.device) ? ssrLooseContain(logFilters.value.device, "all") : ssrLooseEqual(logFilters.value.device, "all")) ? " selected" : ""}${_scopeId}>All Devices</option><option value="desktop"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.device) ? ssrLooseContain(logFilters.value.device, "desktop") : ssrLooseEqual(logFilters.value.device, "desktop")) ? " selected" : ""}${_scopeId}>Desktop</option><option value="mobile"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.device) ? ssrLooseContain(logFilters.value.device, "mobile") : ssrLooseEqual(logFilters.value.device, "mobile")) ? " selected" : ""}${_scopeId}>Mobile</option><option value="tablet"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.device) ? ssrLooseContain(logFilters.value.device, "tablet") : ssrLooseEqual(logFilters.value.device, "tablet")) ? " selected" : ""}${_scopeId}>Tablet</option></select><label class="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-all hover:bg-indigo-50 hover:border-indigo-200"${_scopeId}><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(logFilters.value.only_conversions) ? ssrLooseContain(logFilters.value.only_conversions, null) : logFilters.value.only_conversions) ? " checked" : ""} class="rounded border-slate-300 text-indigo-600 focus:ring-0"${_scopeId}><span class="text-[10px] font-black uppercase tracking-widest text-slate-600"${_scopeId}>Conversions Only</span></label><button class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-105 transition-all"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="${ssrRenderClass([{ "animate-spin": logLoading.value }, "w-5 h-5"])}"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"${_scopeId}></path></svg></button></div></div><div class="overflow-x-auto"${_scopeId}><table class="w-full text-left"${_scopeId}><thead${_scopeId}><tr class="bg-slate-50/50"${_scopeId}><th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Time</th><th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Client / Device</th><th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Location</th><th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>User Type</th><th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"${_scopeId}>Action</th></tr></thead><tbody class="divide-y divide-slate-100"${_scopeId}>`);
              if (logLoading.value) {
                _push2(`<tr class="animate-pulse"${_scopeId}><td colspan="5" class="px-8 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Syncing signals...</td></tr>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--[-->`);
              ssrRenderList(logEvents.value?.data || [], (event) => {
                _push2(`<tr class="group hover:bg-slate-50 transition-all"${_scopeId}><td class="px-8 py-6"${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate(new Date(event.created_at).toLocaleTimeString())}</p><p class="text-[9px] text-slate-400 font-bold uppercase"${_scopeId}>${ssrInterpolate(new Date(event.created_at).toLocaleDateString())}</p></td><td class="px-8 py-6"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm"${_scopeId}>`);
                if (event.device_type === "mobile") {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"${_scopeId}></path></svg>`);
                } else if (event.device_type === "tablet") {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"${_scopeId}></path></svg>`);
                } else {
                  _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"${_scopeId}></path></svg>`);
                }
                _push2(`</div><div${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate(event.browser)}</p><p class="text-[9px] text-slate-400 font-bold uppercase"${_scopeId}>${ssrInterpolate(event.platform)}</p></div></div></td><td class="px-8 py-6"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><span class="text-2xl shadow-sm rounded"${_scopeId}>${ssrInterpolate(countryFlag(event.country_code))}</span><div${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate(event.city || "Unknown City")}</p><p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest"${_scopeId}>${ssrInterpolate(event.country_code)}</p></div></div></td><td class="px-8 py-6"${_scopeId}>`);
                if (event.is_returning) {
                  _push2(`<span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100"${_scopeId}> Returning User </span>`);
                } else {
                  _push2(`<span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100"${_scopeId}> New Visitor </span>`);
                }
                if (event.gclid || event.utm_campaign) {
                  _push2(`<div class="mt-1.5 flex items-center gap-1"${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-amber-500"${_scopeId}></span><span class="text-[8px] font-black text-amber-600 uppercase"${_scopeId}>Paid Traffic</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</td><td class="px-8 py-6 text-right"${_scopeId}><button class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"${_scopeId}> View Journey </button></td></tr>`);
              });
              _push2(`<!--]--></tbody></table></div><div class="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Showing ${ssrInterpolate(logEvents.value?.from || 0)}-${ssrInterpolate(logEvents.value?.to || 0)} of ${ssrInterpolate(logEvents.value?.total || 0)} signals</p><div class="flex items-center gap-2"${_scopeId}><button${ssrIncludeBooleanAttr(logPage.value <= 1) ? " disabled" : ""} class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"${_scopeId}>Previous</button><button${ssrIncludeBooleanAttr(logPage.value >= (logEvents.value?.last_page || 1)) ? " disabled" : ""} class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"${_scopeId}>Next</button></div></div></div>`);
              if (selectedSession.value) {
                _push2(`<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"${_scopeId}><div class="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"${_scopeId}></div><div class="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"${_scopeId}><div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-xl font-black text-slate-900"${_scopeId}>Behavioral Journey Map</h3><p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5"${_scopeId}>Session ID: ${ssrInterpolate(selectedSession.value.session_id?.substring(0, 16))}…</p></div></div><div class="flex items-center gap-3"${_scopeId}>`);
                if (sessionIsLead.value) {
                  _push2(`<div class="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 animate-pulse flex items-center gap-2"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z"${_scopeId}></path></svg> HOT LEAD DETECTED </div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<button class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button></div></div><div class="flex-1 overflow-hidden flex flex-col lg:flex-row"${_scopeId}><div class="flex-1 overflow-y-auto p-8 border-r border-slate-100 bg-white"${_scopeId}><div class="mb-8 flex items-center justify-between"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Step-by-Step Forensics</p><button class="text-[10px] font-black text-indigo-600 uppercase hover:underline"${_scopeId}>Copy All URLs</button></div><div class="relative space-y-0"${_scopeId}><div class="absolute left-[21px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"${_scopeId}></div><!--[-->`);
                ssrRenderList(sessionEvents.value || [], (entry, idx) => {
                  _push2(`<div class="relative pl-14 pb-10 last:pb-0 group"${_scopeId}><div class="${ssrRenderClass([entry.page_url === path.value ? "bg-indigo-600 text-white scale-110 shadow-indigo-200" : "bg-slate-100 text-slate-400", "absolute left-0 top-1 w-11 h-11 rounded-2xl border-4 border-white shadow-md flex items-center justify-center transition-all group-hover:scale-110 z-10"])}"${_scopeId}><span class="text-xs font-black"${_scopeId}>${ssrInterpolate(idx + 1)}</span></div><div class="${ssrRenderClass([entry.page_url === path.value ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-100", "p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1"])}"${_scopeId}><div class="flex items-start justify-between gap-4 mb-3"${_scopeId}><div class="min-w-0"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"${_scopeId}>${ssrInterpolate(new Date(entry.created_at).toLocaleTimeString())}</p><h4 class="text-sm font-black text-slate-900 truncate"${ssrRenderAttr("title", entry.page_url)}${_scopeId}>${ssrInterpolate(safePath(entry.page_url))}</h4></div><div class="flex flex-col items-end gap-1 shrink-0"${_scopeId}><span class="px-2.5 py-1 bg-white rounded-lg text-[9px] font-black text-slate-600 border border-slate-100 shadow-sm"${_scopeId}>${ssrInterpolate(fmtS(entry.duration_seconds))} Dwell </span>`);
                  if (entry.click_count > 0) {
                    _push2(`<span class="px-2.5 py-1 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 border border-emerald-100"${_scopeId}>${ssrInterpolate(entry.click_count)} Clicks </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div><div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-2"${_scopeId}><div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" style="${ssrRenderStyle({ width: Math.min(entry.duration_seconds / 120 * 100, 100) + "%" })}"${_scopeId}></div></div><p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter"${_scopeId}>Engagement Intensity: ${ssrInterpolate(Math.min(entry.duration_seconds * 2 + entry.click_count * 10, 100))}%</p></div></div>`);
                });
                _push2(`<!--]--></div></div><div class="w-full lg:w-80 bg-slate-50 p-8 overflow-y-auto"${_scopeId}><div class="space-y-8"${_scopeId}><div${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Session Statistics</p><div class="grid grid-cols-2 gap-3"${_scopeId}><div class="p-4 bg-white rounded-2xl border border-slate-200"${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate((sessionEvents.value || []).length)}</p><p class="text-[9px] text-slate-400 font-bold uppercase"${_scopeId}>Pages</p></div><div class="p-4 bg-white rounded-2xl border border-slate-200"${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate(fmtS((sessionEvents.value || []).reduce((s2, e) => s2 + (e.duration_seconds || 0), 0)))}</p><p class="text-[9px] text-slate-400 font-bold uppercase"${_scopeId}>Total Time</p></div></div></div><div${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Interaction Intensity</p><div class="h-32 bg-white rounded-2xl border border-slate-200 p-4"${_scopeId}>`);
                _push2(ssrRenderComponent(unref(Line), {
                  data: sessionChartData.value,
                  options: { ...chartOpts, scales: { x: { display: false }, y: { display: false } } }
                }, null, _parent2, _scopeId));
                _push2(`</div></div><div class="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100"${_scopeId}><p class="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3"${_scopeId}>Campaign Attribution</p><div class="space-y-3"${_scopeId}><div${_scopeId}><p class="text-[9px] text-indigo-300 font-black uppercase"${_scopeId}>Source</p><p class="text-sm font-black"${_scopeId}>${ssrInterpolate(selectedSession.value.utm_source || "Direct")}</p></div><div${_scopeId}><p class="text-[9px] text-indigo-300 font-black uppercase"${_scopeId}>Medium</p><p class="text-sm font-black"${_scopeId}>${ssrInterpolate(selectedSession.value.utm_medium || "None")}</p></div>`);
                if (selectedSession.value.gclid) {
                  _push2(`<div${_scopeId}><p class="text-[9px] text-indigo-300 font-black uppercase"${_scopeId}>Google Click ID</p><p class="text-[10px] font-mono break-all opacity-80"${_scopeId}>${ssrInterpolate(selectedSession.value.gclid)}</p></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="p-6 bg-white rounded-3xl border border-slate-200"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"${_scopeId}>Geo Forensics</p><div class="flex items-center gap-3 mb-4"${_scopeId}><span class="text-2xl"${_scopeId}>${ssrInterpolate(countryFlag(selectedSession.value.country_code))}</span><div${_scopeId}><p class="text-xs font-black text-slate-900"${_scopeId}>${ssrInterpolate(selectedSession.value.city || "Unknown")}, ${ssrInterpolate(selectedSession.value.country_code)}</p><p class="text-[10px] text-slate-400 font-bold"${_scopeId}>${ssrInterpolate(selectedSession.value.ip)}</p></div></div><div class="pt-4 border-t border-slate-100"${_scopeId}><p class="text-[9px] text-slate-400 font-black uppercase mb-1"${_scopeId}>User Agent</p><p class="text-[10px] text-slate-600 font-bold leading-relaxed line-clamp-2"${_scopeId}>${ssrInterpolate(selectedSession.value.user_agent)}</p></div></div></div></div></div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--]-->`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "min-h-screen bg-slate-50 p-6 space-y-6" }, [
                createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                  createVNode("div", { class: "flex flex-wrap items-end gap-4" }, [
                    createVNode("div", { class: "flex-1 min-w-0" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-1" }, "Path Intelligence"),
                      createVNode("h1", { class: "text-2xl font-black text-slate-900 truncate" }, toDisplayString(path.value ? safePath(path.value) : "Select a page to analyse"), 1),
                      path.value ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-xs text-slate-400 mt-0.5 truncate"
                      }, toDisplayString(path.value), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => siteId.value = $event,
                        class: "text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0"
                      }, [
                        createVNode("option", { value: null }, "All Sites"),
                        (openBlock(true), createBlock(Fragment, null, renderList(__props.pixelSites, (s2) => {
                          return openBlock(), createBlock("option", {
                            key: s2.id,
                            value: s2.id
                          }, toDisplayString(s2.label), 9, ["value"]);
                        }), 128))
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, siteId.value]
                      ]),
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => period.value = $event,
                        class: "text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-0"
                      }, [
                        createVNode("option", { value: 7 }, "7 days"),
                        createVNode("option", { value: 30 }, "30 days"),
                        createVNode("option", { value: 90 }, "90 days")
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, period.value]
                      ]),
                      createVNode("div", { class: "flex gap-2" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => pathInput.value = $event,
                          placeholder: "Paste page URL…",
                          class: "text-xs border-slate-200 rounded-xl py-2.5 px-4 bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 w-64",
                          onKeydown: withKeys(go, ["enter"])
                        }, null, 40, ["onUpdate:modelValue"]), [
                          [vModelText, pathInput.value]
                        ]),
                        createVNode("button", {
                          onClick: go,
                          class: "px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all"
                        }, "Analyse")
                      ])
                    ])
                  ])
                ]),
                loading.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex items-center justify-center py-24"
                }, [
                  createVNode("div", { class: "w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" })
                ])) : !path.value ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center"
                }, [
                  createVNode("div", { class: "flex justify-center text-slate-300 mb-4" }, [
                    (openBlock(), createBlock("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      "stroke-width": "1.5",
                      stroke: "currentColor",
                      class: "w-12 h-12 animate-bounce"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        d: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
                      })
                    ]))
                  ]),
                  createVNode("p", { class: "text-sm font-black text-slate-400 uppercase tracking-widest" }, 'Enter a page URL above or click "Analyse" from Path Intelligence')
                ])) : data.value ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                  createVNode("div", { class: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList([
                      { label: "Total Visits", value: s.value.total_visits || 0, sub: (s.value.unique_sessions || 0) + " sessions", color: "indigo" },
                      { label: "Bounce Rate", value: (s.value.bounce_rate || 0) + "%", sub: (s.value.bounce_rate || 0) > 50 ? "High ⚠" : "Good ✓", color: (s.value.bounce_rate || 0) > 50 ? "rose" : "emerald" },
                      { label: "Avg Dwell", value: fmtS(s.value.avg_dwell), sub: (s.value.avg_scroll || 0) + "% scroll", color: "violet" },
                      { label: "User Loyalty", value: (s.value.returning_rate || 0) + "%", sub: "Returning Users", color: "emerald" },
                      { label: "Engagement", value: s.value.engagement_score || 0, sub: (s.value.engagement_score || 0) >= 65 ? "Ad Ready ✓" : "Building", color: (s.value.engagement_score || 0) >= 65 ? "emerald" : "amber" },
                      { label: "Ad Traffic", value: s.value.ad_hits || 0, sub: "paid hits", color: "amber" },
                      { label: "Avg Clicks", value: s.value.avg_clicks || 0, sub: "per session", color: "sky" }
                    ], (card) => {
                      return openBlock(), createBlock("div", {
                        key: card.label,
                        class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                      }, [
                        createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" }, toDisplayString(card.label), 1),
                        createVNode("p", { class: "text-2xl font-black text-slate-900" }, toDisplayString(card.value), 1),
                        createVNode("p", { class: "text-[10px] text-slate-400 font-bold mt-1" }, toDisplayString(card.sub), 1)
                      ]);
                    }), 128))
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, [
                    createVNode("div", { class: "lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, toDisplayString(period.value) + "-Day Traffic", 1),
                      createVNode("div", { class: "h-56" }, [
                        createVNode(unref(Bar), {
                          data: dailyChartData.value,
                          options: chartOpts
                        }, null, 8, ["data"])
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, "Hour-of-Day"),
                      createVNode("div", { class: "h-56" }, [
                        createVNode(unref(Bar), {
                          data: hourChartData.value,
                          options: { ...chartOpts, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 8 } }, y: { beginAtZero: true, display: false } } }
                        }, null, 8, ["data", "options"])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-6" }, [
                    createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, "Countries"),
                      createVNode("div", { class: "space-y-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(data.value.by_country || [], (c) => {
                          return openBlock(), createBlock("div", {
                            key: c.code,
                            class: "flex items-center gap-3"
                          }, [
                            createVNode("span", { class: "text-xl w-7 shrink-0" }, toDisplayString(countryFlag(c.code)), 1),
                            createVNode("div", { class: "flex-1 min-w-0" }, [
                              createVNode("div", { class: "flex justify-between items-center mb-1" }, [
                                createVNode("span", { class: "text-xs font-bold text-slate-700 truncate" }, toDisplayString(c.code), 1),
                                createVNode("span", { class: "text-xs font-black text-slate-900 ml-2" }, toDisplayString(c.count), 1)
                              ]),
                              createVNode("div", { class: "h-1.5 bg-slate-100 rounded-full overflow-hidden" }, [
                                createVNode("div", {
                                  class: "h-full bg-indigo-500 rounded-full",
                                  style: { width: c.count / (data.value.by_country[0]?.count || 1) * 100 + "%" }
                                }, null, 4)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, "Device Split"),
                      createVNode("div", { class: "h-40 mb-4" }, [
                        createVNode(unref(Doughnut), {
                          data: deviceChartData.value,
                          options: donutOpts
                        }, null, 8, ["data"])
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, "Loyalty: New vs Returning"),
                      createVNode("div", { class: "h-40 mb-4" }, [
                        createVNode(unref(Doughnut), {
                          data: loyaltyChartData.value,
                          options: donutOpts
                        }, null, 8, ["data"])
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-2xl border border-slate-100 shadow-sm p-6" }, [
                      createVNode("p", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-4" }, "Top Referrers"),
                      createVNode("div", { class: "space-y-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(data.value.referrers || [], (r) => {
                          return openBlock(), createBlock("div", {
                            key: r.domain,
                            class: "flex items-center justify-between gap-3"
                          }, [
                            createVNode("span", { class: "text-xs font-bold text-slate-700 truncate" }, toDisplayString(safeHost(r.domain) || "Direct / None"), 1),
                            createVNode("span", { class: "text-xs font-black text-slate-900 shrink-0" }, toDisplayString(r.count), 1)
                          ]);
                        }), 128))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12" }, [
                    createVNode("div", { class: "lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden" }, [
                      createVNode("div", { class: "absolute top-0 right-0 p-8 opacity-10" }, [
                        (openBlock(), createBlock("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          "stroke-width": "1.5",
                          stroke: "currentColor",
                          class: "w-32 h-32"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                          })
                        ]))
                      ]),
                      createVNode("div", { class: "relative z-10" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-8" }, [
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("div", { class: "w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl shadow-lg shadow-rose-900/50" }, [
                              (openBlock(), createBlock("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "2",
                                stroke: "currentColor",
                                class: "w-6 h-6"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: "M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                                })
                              ]))
                            ]),
                            createVNode("div", null, [
                              createVNode("h3", { class: "text-lg font-black tracking-tight" }, "Real-time Exception Console"),
                              createVNode("p", { class: "text-[10px] font-black text-rose-400/80 uppercase tracking-widest mt-0.5" }, "Live Runtime Monitoring")
                            ])
                          ]),
                          createVNode("div", { class: "flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20" }, [
                            createVNode("div", { class: "w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" }),
                            createVNode("span", { class: "text-[9px] font-black uppercase tracking-widest text-rose-400" }, "Active")
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4 max-h-[420px] overflow-y-auto pr-4 custom-scrollbar" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(data.value.errors || [], (err) => {
                            return openBlock(), createBlock("div", {
                              key: err.id,
                              class: "p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl group hover:bg-slate-800 transition-all hover:border-rose-500/30"
                            }, [
                              createVNode("div", { class: "flex items-start justify-between gap-4 mb-3" }, [
                                createVNode("div", { class: "min-w-0" }, [
                                  createVNode("p", { class: "text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1" }, toDisplayString(err.type) + " · " + toDisplayString(new Date(err.created_at).toLocaleTimeString()), 1),
                                  createVNode("h4", { class: "text-sm font-black text-white leading-relaxed" }, toDisplayString(err.message), 1)
                                ]),
                                createVNode("span", { class: "px-2 py-1 bg-slate-900 rounded-lg text-[9px] font-black text-slate-500 shrink-0 border border-slate-700" }, toDisplayString(err.load_time_ms) + "ms", 1)
                              ]),
                              createVNode("div", { class: "text-[10px] font-mono text-slate-500 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 break-all group-hover:text-slate-300" }, " at " + toDisplayString(err.filename || "anonymous") + ":" + toDisplayString(err.line) + ":" + toDisplayString(err.col), 1)
                            ]);
                          }), 128)),
                          !data.value.errors?.length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "flex flex-col items-center justify-center py-24 text-slate-600"
                          }, [
                            createVNode("div", { class: "w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center text-3xl mb-4 border border-slate-700/30" }, [
                              (openBlock(), createBlock("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "1.5",
                                stroke: "currentColor",
                                class: "w-10 h-10 text-emerald-500/50"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                })
                              ]))
                            ]),
                            createVNode("p", { class: "text-xs font-black uppercase tracking-widest" }, "No runtime exceptions detected"),
                            createVNode("p", { class: "text-[10px] font-bold text-slate-700 mt-2" }, "Health Score: 100%")
                          ])) : createCommentVNode("", true)
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8" }, [
                      createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6" }, "Strategic Intelligence"),
                      createVNode("div", { class: "flex items-center gap-6 mb-8" }, [
                        createVNode("div", { class: "w-24 h-24 rounded-3xl bg-slate-50 flex flex-col items-center justify-center border-2 border-slate-100" }, [
                          createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Intent"),
                          createVNode("p", { class: "text-xs font-black text-slate-900 mt-1 uppercase" }, toDisplayString(data.value.summary?.top_intent || "General"), 1)
                        ]),
                        createVNode("div", { class: "flex-1 space-y-2" }, [
                          createVNode("p", { class: "text-xs font-bold text-slate-600 leading-relaxed" }, [
                            createTextVNode(" MetaPilot detected "),
                            createVNode("span", { class: "text-indigo-600 font-black" }, toDisplayString(data.value.summary?.top_intent) + " intent", 1),
                            createTextVNode(" based on organic traffic patterns. ")
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" }, "Recommendations"),
                        (openBlock(true), createBlock(Fragment, null, renderList(data.value.recommendations || [], (rec, idx) => {
                          return openBlock(), createBlock("div", {
                            key: idx,
                            class: ["flex items-start gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1", {
                              "bg-rose-50 border-rose-100 text-rose-700": rec.type === "critical",
                              "bg-amber-50 border-amber-100 text-amber-700": rec.type === "warning",
                              "bg-indigo-50 border-indigo-100 text-indigo-700": rec.type === "success"
                            }]
                          }, [
                            createVNode("div", { class: "w-5 h-5 mt-0.5" }, [
                              rec.type === "critical" ? (openBlock(), createBlock("svg", {
                                key: 0,
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "1.5",
                                stroke: "currentColor",
                                class: "w-5 h-5"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                })
                              ])) : rec.type === "warning" ? (openBlock(), createBlock("svg", {
                                key: 1,
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "1.5",
                                stroke: "currentColor",
                                class: "w-5 h-5"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                })
                              ])) : (openBlock(), createBlock("svg", {
                                key: 2,
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "1.5",
                                stroke: "currentColor",
                                class: "w-5 h-5"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                              ]))
                            ]),
                            createVNode("p", { class: "text-xs font-bold leading-relaxed" }, toDisplayString(rec.text), 1)
                          ], 2);
                        }), 128))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 mb-12" }, [
                    createVNode("div", { class: "flex items-center justify-between mb-8" }, [
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-lg font-black text-slate-900" }, "User Journey Flow"),
                        createVNode("p", { class: "text-xs text-slate-400 font-bold" }, "Forensics on where users arrive from and their next destination")
                      ]),
                      createVNode("div", { class: "px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase" }, " Avg Dwell: " + toDisplayString(fmtS(s.value.avg_dwell)), 1)
                    ]),
                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative" }, [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode("p", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest text-center" }, "← CAME FROM"),
                        createVNode("div", { class: "space-y-2" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(data.value.prev_pages || [], (p) => {
                            return openBlock(), createBlock("div", {
                              key: p.page_url,
                              class: "p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all"
                            }, [
                              createVNode("span", {
                                class: "text-xs font-bold text-slate-700 truncate max-w-[140px]",
                                title: p.page_url
                              }, toDisplayString(safePath(p.page_url)), 9, ["title"]),
                              createVNode("span", { class: "text-xs font-black text-indigo-600" }, toDisplayString(p.count), 1)
                            ]);
                          }), 128)),
                          !(data.value.prev_pages || []).length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-center py-8 text-[10px] font-black text-slate-300 uppercase italic"
                          }, "Direct Entry Page")) : createCommentVNode("", true)
                        ])
                      ]),
                      createVNode("div", { class: "relative z-10" }, [
                        createVNode("div", { class: "bg-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-200 text-center transform scale-110" }, [
                          createVNode("p", { class: "text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2" }, "CURRENT PAGE ANALYSIS"),
                          createVNode("p", { class: "text-sm font-black text-white truncate px-2" }, toDisplayString(safePath(path.value)), 1),
                          createVNode("div", { class: "mt-6 flex justify-center gap-6 border-t border-indigo-500 pt-6" }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "text-xl font-black text-white" }, toDisplayString(s.value.entry_rate || 0) + "%", 1),
                              createVNode("p", { class: "text-[9px] text-indigo-300 font-black uppercase" }, "Entry")
                            ]),
                            createVNode("div", { class: "w-px h-8 bg-indigo-500" }),
                            createVNode("div", null, [
                              createVNode("p", { class: "text-xl font-black text-white" }, toDisplayString(s.value.exit_rate || 0) + "%", 1),
                              createVNode("p", { class: "text-[9px] text-indigo-300 font-black uppercase" }, "Exit")
                            ])
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode("p", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest text-center" }, "NEXT DESTINATION →"),
                        createVNode("div", { class: "space-y-2" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(data.value.next_pages || [], (p) => {
                            return openBlock(), createBlock("div", {
                              key: p.page_url,
                              class: "p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-emerald-300 transition-all"
                            }, [
                              createVNode("span", {
                                class: "text-xs font-bold text-emerald-800 truncate max-w-[140px]",
                                title: p.page_url
                              }, toDisplayString(safePath(p.page_url)), 9, ["title"]),
                              createVNode("span", { class: "text-xs font-black text-emerald-600" }, toDisplayString(p.count), 1)
                            ]);
                          }), 128)),
                          !(data.value.next_pages || []).length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-center py-8 text-[10px] font-black text-slate-300 uppercase italic"
                          }, "Drop-off / Exit Page")) : createCommentVNode("", true)
                        ])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8 mb-12" }, [
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8" }, [
                      createVNode("h3", { class: "text-sm font-black text-slate-900 mb-8 uppercase tracking-widest" }, "Lead Attribution Logic"),
                      createVNode("div", { class: "grid grid-cols-1 gap-4" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList([
                          { label: "Hot Potential", count: s.value.hot_leads, desc: "High dwell time & interaction", color: "rose", icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z" },
                          { label: "Warm Interest", count: s.value.warm_leads, desc: "Significant dwell or scroll", color: "amber", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
                          { label: "Cold Pass-through", count: s.value.cold_leads, desc: "Minimal site interaction", color: "slate", icon: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z" }
                        ], (lead) => {
                          return openBlock(), createBlock("div", {
                            key: lead.label,
                            class: ["flex items-center gap-6 p-6 rounded-3xl border transition-all hover:shadow-md", `bg-${lead.color}-50/50 border-${lead.color}-100`]
                          }, [
                            createVNode("div", {
                              class: ["w-10 h-10 flex items-center justify-center text-slate-400", `text-${lead.color}-500`]
                            }, [
                              (openBlock(), createBlock("svg", {
                                xmlns: "http://www.w3.org/2000/svg",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                "stroke-width": "1.5",
                                stroke: "currentColor",
                                class: "w-8 h-8"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  d: lead.icon
                                }, null, 8, ["d"])
                              ]))
                            ], 2),
                            createVNode("div", { class: "flex-1" }, [
                              createVNode("div", { class: "flex justify-between items-center" }, [
                                createVNode("span", { class: "text-xs font-black text-slate-700 uppercase tracking-tight" }, toDisplayString(lead.label), 1),
                                createVNode("span", { class: "text-2xl font-black text-slate-900" }, toDisplayString(lead.count || 0), 1)
                              ]),
                              createVNode("p", { class: "text-[10px] text-slate-400 font-bold mt-1" }, toDisplayString(lead.desc), 1)
                            ])
                          ], 2);
                        }), 128))
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8" }, [
                      createVNode("div", { class: "flex items-center justify-between mb-8" }, [
                        createVNode("h3", { class: "text-sm font-black text-slate-900 uppercase tracking-widest" }, "Behavioral Bottlenecks"),
                        createVNode("span", {
                          class: ["px-4 py-2 rounded-xl text-[10px] font-black border shadow-sm", severityClass.value]
                        }, toDisplayString(s.value.bottleneck_severity?.toUpperCase()) + " SCORE: " + toDisplayString(s.value.bottleneck_score), 3)
                      ]),
                      createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList([
                          { label: "Avg Load Time", val: fmtMs(s.value.avg_load_ms), bad: s.value.avg_load_ms > 3e3 },
                          { label: "Bounce Rate", val: (s.value.bounce_rate || 0) + "%", bad: (s.value.bounce_rate || 0) > 50 },
                          { label: "Scroll Depth", val: (s.value.avg_scroll || 0) + "%", bad: (s.value.avg_scroll || 0) < 30 },
                          { label: "JS Errors", val: (data.value.errors || []).length + " issues", bad: (data.value.errors || []).length > 0 }
                        ], (m) => {
                          return openBlock(), createBlock("div", {
                            key: m.label,
                            class: ["p-6 rounded-3xl border transition-all hover:shadow-md", m.bad ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"]
                          }, [
                            createVNode("p", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2" }, toDisplayString(m.label), 1),
                            createVNode("p", { class: "text-xl font-black text-slate-900" }, toDisplayString(m.val), 1)
                          ], 2);
                        }), 128))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "bg-indigo-950 rounded-[2.5rem] p-8 mb-12 text-white shadow-2xl relative overflow-hidden" }, [
                    createVNode("div", { class: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none" }),
                    createVNode("div", { class: "relative z-10 flex flex-col md:flex-row items-center justify-between gap-8" }, [
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-black text-indigo-400 uppercase tracking-widest mb-2" }, "Technical Automation"),
                        createVNode("h3", { class: "text-xl font-black" }, "Optimization Engine"),
                        createVNode("p", { class: "text-sm text-indigo-200/60 mt-1 max-w-md" }, "Instantly improve SEO and performance for this specific page using MetaPilot's automated tools.")
                      ]),
                      createVNode("div", { class: "flex flex-wrap gap-4" }, [
                        createVNode("button", {
                          onClick: autoInjectSchema,
                          disabled: injectingPage.value === path.value,
                          class: "px-6 py-4 bg-indigo-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all active:scale-95"
                        }, toDisplayString(injectingPage.value === path.value ? "Injecting..." : "Auto-Inject Schema"), 9, ["disabled"]),
                        createVNode("button", {
                          onClick: viewPageSource,
                          disabled: fetchingSource.value === path.value,
                          class: "px-6 py-4 bg-white/10 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                        }, " View Page Source ", 8, ["disabled"])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12" }, [
                    createVNode("div", { class: "p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6" }, [
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-lg font-black text-slate-900" }, "Signal Intelligence"),
                        createVNode("p", { class: "text-xs text-slate-400 font-bold" }, "Real-time visitor forensics and interaction timeline")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => logFilters.value.type = $event,
                          class: "text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0"
                        }, [
                          createVNode("option", { value: "all" }, "All Traffic"),
                          createVNode("option", { value: "ads" }, "Paid (Ads)"),
                          createVNode("option", { value: "organic" }, "Organic")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, logFilters.value.type]
                        ]),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => logFilters.value.device = $event,
                          class: "text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl bg-slate-50 focus:ring-0"
                        }, [
                          createVNode("option", { value: "all" }, "All Devices"),
                          createVNode("option", { value: "desktop" }, "Desktop"),
                          createVNode("option", { value: "mobile" }, "Mobile"),
                          createVNode("option", { value: "tablet" }, "Tablet")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, logFilters.value.device]
                        ]),
                        createVNode("label", { class: "flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-all hover:bg-indigo-50 hover:border-indigo-200" }, [
                          withDirectives(createVNode("input", {
                            type: "checkbox",
                            "onUpdate:modelValue": ($event) => logFilters.value.only_conversions = $event,
                            class: "rounded border-slate-300 text-indigo-600 focus:ring-0"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelCheckbox, logFilters.value.only_conversions]
                          ]),
                          createVNode("span", { class: "text-[10px] font-black uppercase tracking-widest text-slate-600" }, "Conversions Only")
                        ]),
                        createVNode("button", {
                          onClick: ($event) => fetchLog(),
                          class: "w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
                        }, [
                          (openBlock(), createBlock("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            "stroke-width": "2",
                            stroke: "currentColor",
                            class: ["w-5 h-5", { "animate-spin": logLoading.value }]
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                            })
                          ], 2))
                        ], 8, ["onClick"])
                      ])
                    ]),
                    createVNode("div", { class: "overflow-x-auto" }, [
                      createVNode("table", { class: "w-full text-left" }, [
                        createVNode("thead", null, [
                          createVNode("tr", { class: "bg-slate-50/50" }, [
                            createVNode("th", { class: "px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Time"),
                            createVNode("th", { class: "px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Client / Device"),
                            createVNode("th", { class: "px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Location"),
                            createVNode("th", { class: "px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "User Type"),
                            createVNode("th", { class: "px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Action")
                          ])
                        ]),
                        createVNode("tbody", { class: "divide-y divide-slate-100" }, [
                          logLoading.value ? (openBlock(), createBlock("tr", {
                            key: 0,
                            class: "animate-pulse"
                          }, [
                            createVNode("td", {
                              colspan: "5",
                              class: "px-8 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest"
                            }, "Syncing signals...")
                          ])) : createCommentVNode("", true),
                          (openBlock(true), createBlock(Fragment, null, renderList(logEvents.value?.data || [], (event) => {
                            return openBlock(), createBlock("tr", {
                              key: event.id,
                              class: "group hover:bg-slate-50 transition-all"
                            }, [
                              createVNode("td", { class: "px-8 py-6" }, [
                                createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString(new Date(event.created_at).toLocaleTimeString()), 1),
                                createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase" }, toDisplayString(new Date(event.created_at).toLocaleDateString()), 1)
                              ]),
                              createVNode("td", { class: "px-8 py-6" }, [
                                createVNode("div", { class: "flex items-center gap-3" }, [
                                  createVNode("div", { class: "w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm" }, [
                                    event.device_type === "mobile" ? (openBlock(), createBlock("svg", {
                                      key: 0,
                                      xmlns: "http://www.w3.org/2000/svg",
                                      fill: "none",
                                      viewBox: "0 0 24 24",
                                      "stroke-width": "1.5",
                                      stroke: "currentColor",
                                      class: "w-5 h-5"
                                    }, [
                                      createVNode("path", {
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        d: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                                      })
                                    ])) : event.device_type === "tablet" ? (openBlock(), createBlock("svg", {
                                      key: 1,
                                      xmlns: "http://www.w3.org/2000/svg",
                                      fill: "none",
                                      viewBox: "0 0 24 24",
                                      "stroke-width": "1.5",
                                      stroke: "currentColor",
                                      class: "w-5 h-5"
                                    }, [
                                      createVNode("path", {
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        d: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                                      })
                                    ])) : (openBlock(), createBlock("svg", {
                                      key: 2,
                                      xmlns: "http://www.w3.org/2000/svg",
                                      fill: "none",
                                      viewBox: "0 0 24 24",
                                      "stroke-width": "1.5",
                                      stroke: "currentColor",
                                      class: "w-5 h-5"
                                    }, [
                                      createVNode("path", {
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        d: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                                      })
                                    ]))
                                  ]),
                                  createVNode("div", null, [
                                    createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString(event.browser), 1),
                                    createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase" }, toDisplayString(event.platform), 1)
                                  ])
                                ])
                              ]),
                              createVNode("td", { class: "px-8 py-6" }, [
                                createVNode("div", { class: "flex items-center gap-3" }, [
                                  createVNode("span", { class: "text-2xl shadow-sm rounded" }, toDisplayString(countryFlag(event.country_code)), 1),
                                  createVNode("div", null, [
                                    createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString(event.city || "Unknown City"), 1),
                                    createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase tracking-widest" }, toDisplayString(event.country_code), 1)
                                  ])
                                ])
                              ]),
                              createVNode("td", { class: "px-8 py-6" }, [
                                event.is_returning ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: "px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100"
                                }, " Returning User ")) : (openBlock(), createBlock("span", {
                                  key: 1,
                                  class: "px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100"
                                }, " New Visitor ")),
                                event.gclid || event.utm_campaign ? (openBlock(), createBlock("div", {
                                  key: 2,
                                  class: "mt-1.5 flex items-center gap-1"
                                }, [
                                  createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-amber-500" }),
                                  createVNode("span", { class: "text-[8px] font-black text-amber-600 uppercase" }, "Paid Traffic")
                                ])) : createCommentVNode("", true)
                              ]),
                              createVNode("td", { class: "px-8 py-6 text-right" }, [
                                createVNode("button", {
                                  onClick: ($event) => openSession(event),
                                  class: "px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                }, " View Journey ", 8, ["onClick"])
                              ])
                            ]);
                          }), 128))
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between" }, [
                      createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Showing " + toDisplayString(logEvents.value?.from || 0) + "-" + toDisplayString(logEvents.value?.to || 0) + " of " + toDisplayString(logEvents.value?.total || 0) + " signals", 1),
                      createVNode("div", { class: "flex items-center gap-2" }, [
                        createVNode("button", {
                          onClick: ($event) => logPage.value--,
                          disabled: logPage.value <= 1,
                          class: "px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"
                        }, "Previous", 8, ["onClick", "disabled"]),
                        createVNode("button", {
                          onClick: ($event) => logPage.value++,
                          disabled: logPage.value >= (logEvents.value?.last_page || 1),
                          class: "px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-slate-900 hover:text-white"
                        }, "Next", 8, ["onClick", "disabled"])
                      ])
                    ])
                  ]),
                  selectedSession.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
                  }, [
                    createVNode("div", {
                      class: "absolute inset-0 bg-slate-900/80 backdrop-blur-xl",
                      onClick: ($event) => selectedSession.value = null
                    }, null, 8, ["onClick"]),
                    createVNode("div", { class: "relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" }, [
                      createVNode("div", { class: "p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" }, [
                        createVNode("div", { class: "flex items-center gap-4" }, [
                          createVNode("div", { class: "w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100" }, [
                            (openBlock(), createBlock("svg", {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              "stroke-width": "1.5",
                              stroke: "currentColor",
                              class: "w-6 h-6"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              })
                            ]))
                          ]),
                          createVNode("div", null, [
                            createVNode("h3", { class: "text-xl font-black text-slate-900" }, "Behavioral Journey Map"),
                            createVNode("p", { class: "text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5" }, "Session ID: " + toDisplayString(selectedSession.value.session_id?.substring(0, 16)) + "…", 1)
                          ])
                        ]),
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          sessionIsLead.value ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 animate-pulse flex items-center gap-2"
                          }, [
                            (openBlock(), createBlock("svg", {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              "stroke-width": "2",
                              stroke: "currentColor",
                              class: "w-3 h-3"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                d: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                              }),
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                d: "M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-1.568-4.567A3.75 3.75 0 0012 18z"
                              })
                            ])),
                            createTextVNode(" HOT LEAD DETECTED ")
                          ])) : createCommentVNode("", true),
                          createVNode("button", {
                            onClick: ($event) => selectedSession.value = null,
                            class: "w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
                          }, [
                            (openBlock(), createBlock("svg", {
                              xmlns: "http://www.w3.org/2000/svg",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              "stroke-width": "2",
                              stroke: "currentColor",
                              class: "w-5 h-5"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                d: "M6 18L18 6M6 6l12 12"
                              })
                            ]))
                          ], 8, ["onClick"])
                        ])
                      ]),
                      createVNode("div", { class: "flex-1 overflow-hidden flex flex-col lg:flex-row" }, [
                        createVNode("div", { class: "flex-1 overflow-y-auto p-8 border-r border-slate-100 bg-white" }, [
                          createVNode("div", { class: "mb-8 flex items-center justify-between" }, [
                            createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Step-by-Step Forensics"),
                            createVNode("button", {
                              onClick: copyJourney,
                              class: "text-[10px] font-black text-indigo-600 uppercase hover:underline"
                            }, "Copy All URLs")
                          ]),
                          createVNode("div", { class: "relative space-y-0" }, [
                            createVNode("div", { class: "absolute left-[21px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" }),
                            (openBlock(true), createBlock(Fragment, null, renderList(sessionEvents.value || [], (entry, idx) => {
                              return openBlock(), createBlock("div", {
                                key: entry.id,
                                class: "relative pl-14 pb-10 last:pb-0 group"
                              }, [
                                createVNode("div", {
                                  class: ["absolute left-0 top-1 w-11 h-11 rounded-2xl border-4 border-white shadow-md flex items-center justify-center transition-all group-hover:scale-110 z-10", entry.page_url === path.value ? "bg-indigo-600 text-white scale-110 shadow-indigo-200" : "bg-slate-100 text-slate-400"]
                                }, [
                                  createVNode("span", { class: "text-xs font-black" }, toDisplayString(idx + 1), 1)
                                ], 2),
                                createVNode("div", {
                                  class: ["p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1", entry.page_url === path.value ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-100"]
                                }, [
                                  createVNode("div", { class: "flex items-start justify-between gap-4 mb-3" }, [
                                    createVNode("div", { class: "min-w-0" }, [
                                      createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" }, toDisplayString(new Date(entry.created_at).toLocaleTimeString()), 1),
                                      createVNode("h4", {
                                        class: "text-sm font-black text-slate-900 truncate",
                                        title: entry.page_url
                                      }, toDisplayString(safePath(entry.page_url)), 9, ["title"])
                                    ]),
                                    createVNode("div", { class: "flex flex-col items-end gap-1 shrink-0" }, [
                                      createVNode("span", { class: "px-2.5 py-1 bg-white rounded-lg text-[9px] font-black text-slate-600 border border-slate-100 shadow-sm" }, toDisplayString(fmtS(entry.duration_seconds)) + " Dwell ", 1),
                                      entry.click_count > 0 ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        class: "px-2.5 py-1 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 border border-emerald-100"
                                      }, toDisplayString(entry.click_count) + " Clicks ", 1)) : createCommentVNode("", true)
                                    ])
                                  ]),
                                  createVNode("div", { class: "h-2 bg-slate-100 rounded-full overflow-hidden mb-2" }, [
                                    createVNode("div", {
                                      class: "h-full bg-indigo-500 rounded-full transition-all duration-1000",
                                      style: { width: Math.min(entry.duration_seconds / 120 * 100, 100) + "%" }
                                    }, null, 4)
                                  ]),
                                  createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase tracking-tighter" }, "Engagement Intensity: " + toDisplayString(Math.min(entry.duration_seconds * 2 + entry.click_count * 10, 100)) + "%", 1)
                                ], 2)
                              ]);
                            }), 128))
                          ])
                        ]),
                        createVNode("div", { class: "w-full lg:w-80 bg-slate-50 p-8 overflow-y-auto" }, [
                          createVNode("div", { class: "space-y-8" }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4" }, "Session Statistics"),
                              createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                                createVNode("div", { class: "p-4 bg-white rounded-2xl border border-slate-200" }, [
                                  createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString((sessionEvents.value || []).length), 1),
                                  createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase" }, "Pages")
                                ]),
                                createVNode("div", { class: "p-4 bg-white rounded-2xl border border-slate-200" }, [
                                  createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString(fmtS((sessionEvents.value || []).reduce((s2, e) => s2 + (e.duration_seconds || 0), 0))), 1),
                                  createVNode("p", { class: "text-[9px] text-slate-400 font-bold uppercase" }, "Total Time")
                                ])
                              ])
                            ]),
                            createVNode("div", null, [
                              createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4" }, "Interaction Intensity"),
                              createVNode("div", { class: "h-32 bg-white rounded-2xl border border-slate-200 p-4" }, [
                                createVNode(unref(Line), {
                                  data: sessionChartData.value,
                                  options: { ...chartOpts, scales: { x: { display: false }, y: { display: false } } }
                                }, null, 8, ["data", "options"])
                              ])
                            ]),
                            createVNode("div", { class: "p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100" }, [
                              createVNode("p", { class: "text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3" }, "Campaign Attribution"),
                              createVNode("div", { class: "space-y-3" }, [
                                createVNode("div", null, [
                                  createVNode("p", { class: "text-[9px] text-indigo-300 font-black uppercase" }, "Source"),
                                  createVNode("p", { class: "text-sm font-black" }, toDisplayString(selectedSession.value.utm_source || "Direct"), 1)
                                ]),
                                createVNode("div", null, [
                                  createVNode("p", { class: "text-[9px] text-indigo-300 font-black uppercase" }, "Medium"),
                                  createVNode("p", { class: "text-sm font-black" }, toDisplayString(selectedSession.value.utm_medium || "None"), 1)
                                ]),
                                selectedSession.value.gclid ? (openBlock(), createBlock("div", { key: 0 }, [
                                  createVNode("p", { class: "text-[9px] text-indigo-300 font-black uppercase" }, "Google Click ID"),
                                  createVNode("p", { class: "text-[10px] font-mono break-all opacity-80" }, toDisplayString(selectedSession.value.gclid), 1)
                                ])) : createCommentVNode("", true)
                              ])
                            ]),
                            createVNode("div", { class: "p-6 bg-white rounded-3xl border border-slate-200" }, [
                              createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4" }, "Geo Forensics"),
                              createVNode("div", { class: "flex items-center gap-3 mb-4" }, [
                                createVNode("span", { class: "text-2xl" }, toDisplayString(countryFlag(selectedSession.value.country_code)), 1),
                                createVNode("div", null, [
                                  createVNode("p", { class: "text-xs font-black text-slate-900" }, toDisplayString(selectedSession.value.city || "Unknown") + ", " + toDisplayString(selectedSession.value.country_code), 1),
                                  createVNode("p", { class: "text-[10px] text-slate-400 font-bold" }, toDisplayString(selectedSession.value.ip), 1)
                                ])
                              ]),
                              createVNode("div", { class: "pt-4 border-t border-slate-100" }, [
                                createVNode("p", { class: "text-[9px] text-slate-400 font-black uppercase mb-1" }, "User Agent"),
                                createVNode("p", { class: "text-[10px] text-slate-600 font-bold leading-relaxed line-clamp-2" }, toDisplayString(selectedSession.value.user_agent), 1)
                              ])
                            ])
                          ])
                        ])
                      ])
                    ])
                  ])) : createCommentVNode("", true)
                ], 64)) : createCommentVNode("", true)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/Signals.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
