import { ref, computed, onMounted, onUnmounted, watch, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr, ssrRenderList, ssrRenderStyle, ssrRenderComponent, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import axios from "axios";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _sfc_main$1 } from "./ConfirmationModal-EXlnTAwk.js";
import { Chart, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController } from "chart.js";
import { Bar, Line } from "vue-chartjs";
import "pinia";
const _sfc_main = {
  __name: "DevelopersTab",
  __ssrInlineRender: true,
  props: {
    organization: Object,
    properties: Array,
    propertyId: [Number, String],
    forecastData: Object
  },
  setup(__props) {
    Chart.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController);
    const props = __props;
    const snippet = ref("");
    const logResponse = ref({ data: [], current_page: 1, last_page: 1, total: 0 });
    const chartEvents = ref([]);
    const isLoading = ref(false);
    const isRegenerating = ref(false);
    const isTestingConn = ref(false);
    ref(false);
    const toast = useToastStore();
    const selectedPropId = ref(props.propertyId || props.properties?.[0]?.id);
    const selectedCampaignId = ref("");
    const selectedSession = ref(null);
    const searchQuery = ref("");
    const connectionStatus = ref(null);
    const allowedDomainInput = ref(props.organization?.allowed_domain || "");
    ref("");
    const showRegenModal = ref(false);
    const analyticsData = ref(null);
    const isLoadingAnalytics = ref(false);
    const pathFilter = ref("");
    const filters = ref({
      campaign_id: "all",
      type: "all",
      device: "all",
      country: "all",
      start_date: "",
      end_date: "",
      per_page: 25,
      page: 1
    });
    let eventsInterval = null;
    let connInterval = null;
    let analyticsInterval = null;
    const siteToken = computed(() => props.organization?.ads_site_token);
    computed(
      () => props.properties?.find((p) => p.id == selectedPropId.value)
    );
    computed(() => {
      let ev = events.value;
      if (campaignFilter.value !== "all") {
        ev = ev.filter((e) => e.google_campaign_id === campaignFilter.value);
      }
      if (!searchQuery.value) return ev;
      const q = searchQuery.value.toLowerCase();
      return ev.filter(
        (e) => e.page_url?.toLowerCase().includes(q) || e.session_id?.toLowerCase().includes(q) || e.utm_campaign?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q)
      );
    });
    const availableCampaigns = computed(() => {
      const caps = /* @__PURE__ */ new Set();
      chartEvents.value.forEach((e) => {
        if (e.google_campaign_id) caps.add(e.google_campaign_id);
      });
      return Array.from(caps);
    });
    const sessionTimeline = computed(() => {
      if (!selectedSession.value) return [];
      const all = [...logResponse.value.data, ...chartEvents.value];
      return all.filter((e) => e.session_id === selectedSession.value.session_id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
    const sessionChartData = computed(() => {
      if (!selectedSession.value) return { labels: [], datasets: [] };
      const t = sessionTimeline.value;
      return {
        labels: t.map((e) => new Date(e.created_at).toLocaleTimeString()),
        datasets: [{
          label: "Engagement Signals",
          data: t.map((e) => e.click_count),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.12)",
          fill: true,
          tension: 0.5,
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#6366f1",
          pointBorderWidth: 2
        }]
      };
    });
    computed(() => {
      const totalCounts = {};
      const adCounts = {};
      chartEvents.value.forEach((e) => {
        const d = new Date(e.created_at).toLocaleDateString();
        totalCounts[d] = (totalCounts[d] || 0) + 1;
        const isAd = e.gclid || e.utm_campaign || e.google_campaign_id;
        if (isAd) {
          adCounts[d] = (adCounts[d] || 0) + 1;
        }
      });
      const dates = Object.keys(totalCounts).sort((a, b) => new Date(a) - new Date(b));
      return {
        labels: dates,
        datasets: [
          {
            label: "Total Reach",
            data: dates.map((d) => totalCounts[d]),
            borderColor: "#e2e8f0",
            backgroundColor: "rgba(226,232,240,0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 20
          },
          {
            label: "Ad Conversions",
            data: dates.map((d) => adCounts[d] || 0),
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.08)",
            fill: true,
            tension: 0.4,
            borderWidth: 4,
            pointRadius: 0,
            pointHitRadius: 20
          }
        ]
      };
    });
    const topCountries = computed(() => {
      const c = {};
      chartEvents.value.forEach((e) => {
        if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1;
      });
      return Object.entries(c).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    });
    const deviceBreakdown = computed(() => {
      const d = { Mobile: 0, Desktop: 0, Tablet: 0 };
      chartEvents.value.forEach((e) => {
        if (e.device_type && d[e.device_type] !== void 0) d[e.device_type]++;
      });
      return d;
    });
    const avgClicks = computed(() => {
      const ads = chartEvents.value.filter((e) => e.gclid || e.utm_campaign || e.google_campaign_id);
      if (ads.length === 0) return 0;
      const total = ads.reduce((sum, e) => sum + (e.click_count || 0), 0);
      return (total / ads.length).toFixed(1);
    });
    const todayDelta = computed(() => analyticsData.value?.summary?.today_delta ?? null);
    const weekDelta = computed(() => analyticsData.value?.summary?.week_delta ?? null);
    const historyChartData = computed(() => {
      const rows = analyticsData.value?.daily_history ?? [];
      if (!rows.length) return { labels: [], datasets: [] };
      const avg = rows.reduce((s, r) => s + r.total, 0) / rows.length;
      return {
        labels: rows.map((r) => r.label),
        datasets: [
          {
            type: "bar",
            label: "Total Signals",
            data: rows.map((r) => r.total),
            backgroundColor: rows.map(
              (r) => r.total >= avg * 1.15 ? "rgba(99,102,241,0.85)" : r.total <= avg * 0.6 ? "rgba(226,232,240,0.6)" : "rgba(99,102,241,0.35)"
            ),
            borderRadius: 8,
            borderSkipped: false,
            order: 2
          },
          {
            type: "line",
            label: "Ad Hits",
            data: rows.map((r) => r.ad_hits),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.08)",
            fill: true,
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            order: 1
          }
        ]
      };
    });
    const historyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: { boxWidth: 10, font: { family: "Inter", weight: "bold", size: 10 }, padding: 20 }
        },
        tooltip: {
          backgroundColor: "#0f172a",
          titleFont: { family: "Inter", weight: "black", size: 11 },
          bodyFont: { family: "Inter", size: 11 },
          padding: 14,
          cornerRadius: 12,
          callbacks: {
            title: (items) => {
              const row = analyticsData.value?.daily_history?.[items[0].dataIndex];
              return row ? new Date(row.date).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" }) : "";
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "Inter", size: 10 }, maxTicksLimit: 10 } },
        y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { family: "Inter", size: 10 } } }
      }
    };
    const topPages = computed(() => analyticsData.value?.top_pages ?? []);
    const topReferers = computed(() => analyticsData.value?.top_referrers ?? []);
    const rising = computed(() => analyticsData.value?.trend_velocity?.rising ?? []);
    const falling = computed(() => analyticsData.value?.trend_velocity?.falling ?? []);
    const safePathLabel = (url) => {
      if (!url) return "—";
      try {
        return new URL(url).pathname || "/";
      } catch {
        return url;
      }
    };
    const deltaBadgeClass = (pct) => {
      if (pct === null || pct === void 0) return "bg-slate-100 text-slate-400";
      if (pct >= 5) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      if (pct <= -5) return "bg-rose-50 text-rose-600 border border-rose-200";
      return "bg-amber-50 text-amber-600 border border-amber-200";
    };
    const deltaIcon = (pct) => {
      if (pct === null || pct === void 0) return "—";
      if (pct >= 5) return `↑ +${pct}%`;
      if (pct <= -5) return `↓ ${pct}%`;
      return `→ ${pct > 0 ? "+" : ""}${pct}%`;
    };
    const sparklinePath = (series) => {
      if (!series?.length) return "";
      const w = 80, h = 28;
      const max = Math.max(...series, 1);
      const pts = series.map((v, i) => `${i / (series.length - 1) * w},${h - v / max * h}`);
      return `M${pts.join(" L")}`;
    };
    const pixelStatusBadge = computed(() => {
      const cs = connectionStatus.value;
      if (cs) {
        if (cs.status === "verified_active") return { label: "Verified & Active", color: "emerald", icon: "✓" };
        if (cs.status === "connected_inactive") return { label: "Connected – Inactive", color: "amber", icon: "○" };
        return { label: "Not Detected", color: "rose", icon: "✕" };
      }
      const recent = chartEvents.value.some((e) => new Date(e.created_at) > new Date(Date.now() - 864e5));
      if (recent) return { label: "Connected & Active", color: "emerald", icon: "✓" };
      if (logResponse.value.total > 0) return { label: "Connected – Inactive", color: "amber", icon: "○" };
      return { label: "Not Detected", color: "rose", icon: "✕" };
    });
    const modalChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } }
      }
    };
    const fetchEvents = async () => {
      isLoading.value = true;
      try {
        const params = {
          ...filters.value,
          search: pathFilter.value || searchQuery.value,
          campaign_id: filters.value.campaign_id
        };
        const r = await axios.get(route("google-ads.pixel-events"), { params });
        logResponse.value = r.data;
        if (filters.value.page === 1) {
          const chartParams = { ...params, per_page: 500 };
          const cr = await axios.get(route("google-ads.pixel-events"), { params: chartParams });
          chartEvents.value = cr.data.data;
        }
      } catch (e) {
        console.error("Failed to fetch pixel events", e);
      } finally {
        isLoading.value = false;
      }
    };
    const fetchAnalytics = async () => {
      isLoadingAnalytics.value = true;
      try {
        const r = await axios.get(route("google-ads.analytics"));
        analyticsData.value = r.data;
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        isLoadingAnalytics.value = false;
      }
    };
    const fetchConnectionStatus = async () => {
      try {
        const r = await axios.get(route("google-ads.connection-status"));
        connectionStatus.value = r.data;
      } catch (e) {
      }
    };
    const updateSnippet = () => {
      const base = window.location.origin;
      const camp = selectedCampaignId.value ? ` data-campaign="${selectedCampaignId.value}"` : "";
      snippet.value = `<script src="${base}/cdn/ads-tracker.js" data-token="${siteToken.value}"${camp} async><\/script>`;
    };
    const regenerateToken = async () => {
      showRegenModal.value = false;
      isRegenerating.value = true;
      try {
        await axios.post(route("google-ads.regenerate-token"));
        toast.success("Site token regenerated successfully");
        window.location.reload();
      } catch (e) {
        console.error("Failed to regenerate token", e);
        toast.error("Failed to regenerate site token");
      } finally {
        isRegenerating.value = false;
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
    onMounted(() => {
      updateSnippet();
      fetchEvents();
      fetchConnectionStatus();
      fetchAnalytics();
      eventsInterval = setInterval(fetchEvents, 6e4);
      connInterval = setInterval(fetchConnectionStatus, 3e4);
      analyticsInterval = setInterval(fetchAnalytics, 3e5);
    });
    onUnmounted(() => {
      clearInterval(eventsInterval);
      clearInterval(connInterval);
      clearInterval(analyticsInterval);
    });
    watch([selectedPropId, selectedCampaignId, siteToken], updateSnippet);
    watch(pathFilter, () => {
      if (!pathFilter.value) fetchEvents();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-12 pb-24" }, _attrs))}><div class="flex items-center justify-between mb-10"><div><h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4"> Developer Tools <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v3.1</span></h2><p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Secure pixel tracking with agency attribution monitoring &amp; real-time signal intelligence.</p></div><div class="${ssrRenderClass([{
        "bg-emerald-50 border-emerald-200 text-emerald-700": pixelStatusBadge.value.color === "emerald",
        "bg-amber-50 border-amber-200 text-amber-700": pixelStatusBadge.value.color === "amber",
        "bg-rose-50 border-rose-200 text-rose-700": pixelStatusBadge.value.color === "rose"
      }, "flex items-center gap-2 px-5 py-3 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all"])}"><span class="${ssrRenderClass([{
        "bg-emerald-500 animate-pulse": pixelStatusBadge.value.color === "emerald",
        "bg-amber-400": pixelStatusBadge.value.color === "amber",
        "bg-rose-400": pixelStatusBadge.value.color === "rose"
      }, "w-2 h-2 rounded-full"])}"></span> ${ssrInterpolate(pixelStatusBadge.value.label)}</div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6"><div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden"><p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p><h4 class="text-4xl font-black text-slate-900 tracking-tight">${ssrInterpolate(logResponse.value.total)}</h4><div class="mt-3 flex items-center justify-between"><span class="text-[10px] font-black text-slate-400">${ssrInterpolate(connectionStatus.value?.hits_last_24h ?? "—")} in last 24h</span>`);
      if (todayDelta.value !== null) {
        _push(`<span class="${ssrRenderClass([deltaBadgeClass(todayDelta.value), "text-[10px] font-black px-2 py-0.5 rounded-lg"])}">${ssrInterpolate(deltaIcon(todayDelta.value))} today </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden"><p class="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Ad Conversions</p><h4 class="text-4xl font-black text-indigo-600 tracking-tight">${ssrInterpolate(chartEvents.value.filter((e) => e.gclid || e.utm_campaign || e.google_campaign_id).length)}</h4><div class="mt-3 flex items-center justify-between"><span class="text-[10px] font-black text-indigo-500">Targeted Traffic</span>`);
      if (weekDelta.value !== null) {
        _push(`<span class="${ssrRenderClass([deltaBadgeClass(weekDelta.value), "text-[10px] font-black px-2 py-0.5 rounded-lg"])}">${ssrInterpolate(deltaIcon(weekDelta.value))} 7d </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-indigo-600 p-8 shadow-indigo-200 shadow-2xl rounded-[2.5rem] text-white"><p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Engagement Qty</p><h4 class="text-4xl font-black tracking-tight">${ssrInterpolate(avgClicks.value)}</h4><div class="mt-3 text-[10px] font-black text-indigo-200">Avg Clicks Per Ad Session</div></div></div><div class="lg:col-span-4 bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100"><div class="flex items-center justify-between mb-6"><h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Pixel Health</h3><button${ssrIncludeBooleanAttr(isTestingConn.value) ? " disabled" : ""} class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">${ssrInterpolate(isTestingConn.value ? "Testing..." : "Test Now")}</button></div><div class="space-y-4"><div class="relative"><input${ssrRenderAttr("value", allowedDomainInput.value)} placeholder="diaminyaesthetics.com" class="w-full bg-slate-50 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-xl text-[11px] font-bold text-slate-800 py-3 px-4 pr-16"><button class="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg">Save</button></div><div class="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl"><span class="text-[9px] font-black text-slate-400 uppercase">Subdomain Pinning</span><span class="text-[9px] font-black text-emerald-600 uppercase">Active (v3.1)</span></div></div></div></div><div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100"><div class="grid grid-cols-1 lg:grid-cols-12 gap-12"><div class="lg:col-span-8"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Global Signal Origin</h4><div class="flex flex-wrap gap-4"><!--[-->`);
      ssrRenderList(topCountries.value, (geo) => {
        _push(`<div class="px-5 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100/50"><span class="text-lg">${ssrInterpolate(geo.code === "US" ? "🇺🇸" : geo.code === "GB" ? "🇬🇧" : geo.code === "CA" ? "🇨🇦" : geo.code === "KE" ? "🇰🇪" : "🌍")}</span><div><p class="text-[10px] font-black text-slate-900">${ssrInterpolate(geo.code)}</p><p class="text-[8px] font-black text-slate-400 uppercase">${ssrInterpolate(geo.count)} Hits</p></div></div>`);
      });
      _push(`<!--]-->`);
      if (topCountries.value.length === 0) {
        _push(`<div class="text-[10px] text-slate-300 italic py-3">Collecting data...</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="lg:col-span-4 border-l border-slate-100 pl-12"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Client Distribution</h4><div class="space-y-4"><!--[-->`);
      ssrRenderList(deviceBreakdown.value, (count, type) => {
        _push(`<div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-600 uppercase">${ssrInterpolate(type)}</span><div class="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-indigo-500 rounded-full" style="${ssrRenderStyle({ width: chartEvents.value.length > 0 ? count / chartEvents.value.length * 100 + "%" : "0%" })}"></div></div><span class="text-[10px] font-black text-slate-900">${ssrInterpolate(count)}</span></div>`);
      });
      _push(`<!--]--></div></div></div></div><div class="bg-white p-12 shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative"><div class="flex items-center justify-between mb-10"><div><h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4"> 30-Day Signal History <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">Daily</span></h3><p class="text-slate-400 font-medium text-xs mt-1">Total pixel hits (bars) vs Ad-attributed hits (amber line) — darker bars = above-average days</p></div><div class="flex gap-4"><div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100"><span class="w-3 h-3 bg-indigo-500 rounded-sm"></span><span class="text-[10px] font-black text-indigo-600 uppercase">Total Signals</span></div><div class="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100"><span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span><span class="text-[10px] font-black text-amber-600 uppercase">Ad Hits</span></div></div></div><div class="h-[380px] relative">`);
      if (!analyticsData.value) {
        _push(`<div class="absolute inset-0 flex flex-col items-center justify-center z-10"><div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div><p class="text-[11px] font-black uppercase tracking-widest text-slate-300">Computing history...</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (analyticsData.value) {
        _push(ssrRenderComponent(unref(Bar), {
          data: historyChartData.value,
          options: historyChartOptions
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden"><div class="px-12 pt-12 pb-8 flex items-end justify-between border-b border-slate-50"><div><h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4"> Path Intelligence <span class="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-slate-100">Top 10</span></h3><p class="text-slate-400 text-xs font-medium mt-1">Most-visited pages with 14-day trend sparkline and day-over-day delta. Click a row to drill into its log.</p></div>`);
      if (pathFilter.value) {
        _push(`<button class="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg> Clear filter </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="overflow-x-auto"><table class="w-full text-left min-w-[900px]"><thead><tr class="bg-slate-50/60"><th class="py-5 px-12 text-[9px] font-black text-slate-400 uppercase tracking-widest">Page / Path</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hits</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ad Hits</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Stay</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Clicks</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">14-Day Trend</th><th class="py-5 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Δ vs Yesterday</th></tr></thead><tbody class="divide-y divide-slate-50">`);
      if (isLoadingAnalytics.value && !topPages.value.length) {
        _push(`<tr><td colspan="7" class="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading path data...</td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(topPages.value, (page, idx) => {
        _push(`<tr class="${ssrRenderClass([{ "bg-indigo-50/20 border-l-4 border-indigo-500": pathFilter.value === page.page_url }, "group hover:bg-indigo-50/30 cursor-pointer transition-all"])}"><td class="py-7 px-12"><div class="flex items-center gap-4"><span class="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">${ssrInterpolate(idx + 1)}</span><div class="min-w-0"><p class="text-xs font-black text-slate-900 truncate max-w-xs"${ssrRenderAttr("title", page.page_url)}>${ssrInterpolate(safePathLabel(page.page_url))}</p><p class="text-[9px] text-slate-400 font-bold truncate max-w-xs">${ssrInterpolate(safeHostname(page.page_url))}</p></div></div></td><td class="py-7 px-6 text-center"><span class="text-sm font-black text-slate-900">${ssrInterpolate(page.total_hits)}</span></td><td class="py-7 px-6 text-center"><span class="${ssrRenderClass([page.ad_hits > 0 ? "text-indigo-600" : "text-slate-300", "text-sm font-black"])}">${ssrInterpolate(page.ad_hits)}</span></td><td class="py-7 px-6 text-center"><span class="text-xs font-black text-slate-700">${ssrInterpolate(page.avg_duration)}s</span></td><td class="py-7 px-6 text-center"><span class="text-xs font-black text-slate-700">${ssrInterpolate(page.avg_clicks)}</span></td><td class="py-7 px-6"><div class="flex items-center justify-center"><svg width="80" height="28" class="overflow-visible"><defs><linearGradient${ssrRenderAttr("id", "sg" + idx)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"></stop><stop offset="100%" stop-color="#6366f1" stop-opacity="0"></stop></linearGradient></defs>`);
        if (sparklinePath(page.sparkline)) {
          _push(`<path${ssrRenderAttr("d", sparklinePath(page.sparkline) + " L80,28 L0,28 Z")}${ssrRenderAttr("fill", "url(#sg" + idx + ")")}></path>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<path${ssrRenderAttr("d", sparklinePath(page.sparkline))} fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></td><td class="py-7 px-10 text-right"><span class="${ssrRenderClass([deltaBadgeClass(page.delta_pct), "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black"])}">${ssrInterpolate(deltaIcon(page.delta_pct))}</span><p class="text-[9px] text-slate-400 font-bold mt-1.5 text-right">Today: ${ssrInterpolate(page.today_count)} / Yday: ${ssrInterpolate(page.yesterday_count)}</p></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (topPages.value.length === 0 && !isLoadingAnalytics.value) {
        _push(`<div class="p-16 text-center"><p class="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">No page data yet — signals will appear as your pixel fires.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10"><div class="flex items-center gap-3 mb-7"><div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">🚀</div><div><p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Fastest Rising</p><p class="text-[9px] text-slate-400 font-bold">7-day growth vs prior 7 days</p></div></div><div class="space-y-4">`);
      if (rising.value.length === 0) {
        _push(`<div class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">Collecting velocity data...</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(rising.value, (page) => {
        _push(`<div class="flex items-center justify-between p-5 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl border border-emerald-100/50 cursor-pointer transition-all group"><div class="min-w-0 mr-4"><p class="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">${ssrInterpolate(safePathLabel(page.page_url))}</p><p class="text-[9px] text-slate-400 font-bold mt-0.5">${ssrInterpolate(page.last7)} hits this week</p></div><span class="shrink-0 text-[11px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm"> ↑ +${ssrInterpolate(page.delta_pct)}% </span></div>`);
      });
      _push(`<!--]--></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10"><div class="flex items-center gap-3 mb-7"><div class="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg">📉</div><div><p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Needs Attention</p><p class="text-[9px] text-slate-400 font-bold">Biggest drops vs prior week</p></div></div><div class="space-y-4">`);
      if (falling.value.length === 0) {
        _push(`<div class="text-[10px] text-slate-300 font-black uppercase tracking-widest italic py-4 text-center">No declining pages detected.</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(falling.value, (page) => {
        _push(`<div class="flex items-center justify-between p-5 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl border border-rose-100/50 cursor-pointer transition-all group"><div class="min-w-0 mr-4"><p class="text-xs font-black text-slate-900 truncate group-hover:text-rose-700 transition-colors">${ssrInterpolate(safePathLabel(page.page_url))}</p><p class="text-[9px] text-slate-400 font-bold mt-0.5">${ssrInterpolate(page.last7)} hits this week</p></div><span class="shrink-0 text-[11px] font-black text-rose-600 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm"> ↓ ${ssrInterpolate(page.delta_pct)}% </span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="lg:col-span-4 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl"><div class="flex items-center gap-3 mb-7"><div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></div><div><p class="text-[11px] font-black text-white uppercase tracking-widest">Top Referrers</p><p class="text-[9px] text-slate-400 font-bold">Where your visitors came from</p></div></div><div class="space-y-3">`);
      if (topReferers.value.length === 0) {
        _push(`<div class="text-[10px] text-slate-600 font-black uppercase tracking-widest italic py-4 text-center">No referrer data yet.</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(topReferers.value, (ref2) => {
        _push(`<div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><div class="flex items-center gap-3 min-w-0"><div class="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0"></div><p class="text-[11px] font-black text-slate-200 truncate"${ssrRenderAttr("title", ref2.domain)}>${ssrInterpolate(safeHostname(ref2.domain) || "Direct / None")}</p></div><span class="text-[10px] font-black text-slate-400 shrink-0 ml-3">${ssrInterpolate(ref2.count)}</span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 bg-slate-900 p-12 shadow-2xl rounded-[3.5rem] border border-slate-800 relative overflow-hidden"><div class="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div><div class="flex items-center justify-between mb-10"><h3 class="text-2xl font-black text-white flex items-center gap-4"><span class="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg></span> Tracker Implementation </h3><div class="flex items-center gap-3"><span class="px-3 py-1 bg-white/5 text-indigo-400 text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest">v3.1 Secure Handshake</span></div></div><div class="grid grid-cols-2 gap-6 mb-8"><div class="space-y-3"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Traffic Isolation (Campaign ID)</label><input${ssrRenderAttr("value", selectedCampaignId.value)} placeholder="e.g. MetaPilot_Agency_001" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6"></div><div class="space-y-3"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Link</label><select class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer"><!--[-->`);
      ssrRenderList(__props.properties, (prop) => {
        _push(`<option${ssrRenderAttr("value", prop.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedPropId.value) ? ssrLooseContain(selectedPropId.value, prop.id) : ssrLooseEqual(selectedPropId.value, prop.id)) ? " selected" : ""}>${ssrInterpolate(prop.name)}</option>`);
      });
      _push(`<!--]--></select></div></div><div class="bg-black/40 rounded-3xl p-8 border border-white/5 shadow-inner relative group"><pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed">${ssrInterpolate(snippet.value)}</pre><button class="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 opacity-0 group-hover:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div><div class="mt-8 pt-8 border-t border-white/5 flex items-center justify-between"><div class="flex items-center gap-4 text-slate-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-[10px] font-medium leading-relaxed max-w-md">Every hit from this pixel will be permanently attributed to <span class="text-indigo-400 font-black">${ssrInterpolate(selectedCampaignId.value || "Default")}</span> for campaign isolation.</p></div><button class="text-[10px] font-black text-rose-500 hover:text-white transition-colors uppercase tracking-widest">Regenerate Secret</button></div></div><div class="lg:col-span-4 bg-slate-100 p-10 rounded-[3.5rem] border border-slate-200"><h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Console Diagnostics</h3><div class="space-y-6"><div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm"><p class="text-[9px] font-black text-slate-400 uppercase mb-2">Inspect State</p><code class="text-[10px] font-black text-indigo-600 block mb-2">window.MetaPilot</code><p class="text-[9px] text-slate-500 italic">Verify handshake status, retry queue, and hit signatures live.</p></div><div class="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm"><p class="text-[9px] font-black text-slate-400 uppercase mb-2">Campaign Isolation</p><p class="text-[10px] font-black text-slate-700">MetaPilot Agencies drive traffic using <span class="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">data-campaign</span> to correctly differentiate their ads from organic traffic.</p></div></div></div></div><div id="intel-log" class="space-y-8"><div class="flex items-end justify-between gap-8"><div class="flex-1"><h3 class="text-3xl font-black text-slate-900 tracking-tight">Intelligence Log</h3><p class="text-slate-500 font-medium mt-1">Real-time attribution and behavioral forensics</p></div><div class="flex items-center gap-3"><button class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export CSV </button><div class="w-80 relative"><div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><input${ssrRenderAttr("value", searchQuery.value)} placeholder="Search Session, URL, City..." class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-xs font-bold text-slate-800 py-4 pl-14 shadow-premium-soft"></div></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium-soft flex flex-wrap items-center gap-6"><div class="flex-1 min-w-[150px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Type</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "all") : ssrLooseEqual(filters.value.type, "all")) ? " selected" : ""}>🌐 All Traffic</option><option value="ads"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "ads") : ssrLooseEqual(filters.value.type, "ads")) ? " selected" : ""}>🎯 Ad Conversions</option><option value="organic"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "organic") : ssrLooseEqual(filters.value.type, "organic")) ? " selected" : ""}>🌿 Organic Only</option></select></div><div class="flex-1 min-w-[200px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign ID</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.campaign_id) ? ssrLooseContain(filters.value.campaign_id, "all") : ssrLooseEqual(filters.value.campaign_id, "all")) ? " selected" : ""}>🏷️ All Campaigns</option><!--[-->`);
      ssrRenderList(availableCampaigns.value, (cap) => {
        _push(`<option${ssrRenderAttr("value", cap)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.campaign_id) ? ssrLooseContain(filters.value.campaign_id, cap) : ssrLooseEqual(filters.value.campaign_id, cap)) ? " selected" : ""}>${ssrInterpolate(cap)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex-1 min-w-[140px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Device</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "all") : ssrLooseEqual(filters.value.device, "all")) ? " selected" : ""}>📱 All Devices</option><option value="Mobile"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Mobile") : ssrLooseEqual(filters.value.device, "Mobile")) ? " selected" : ""}>Mobile</option><option value="Desktop"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Desktop") : ssrLooseEqual(filters.value.device, "Desktop")) ? " selected" : ""}>Desktop</option><option value="Tablet"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Tablet") : ssrLooseEqual(filters.value.device, "Tablet")) ? " selected" : ""}>Tablet</option></select></div><div class="flex-1 min-w-[140px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.country) ? ssrLooseContain(filters.value.country, "all") : ssrLooseEqual(filters.value.country, "all")) ? " selected" : ""}>🌍 Global</option><!--[-->`);
      ssrRenderList(topCountries.value, (c) => {
        _push(`<option${ssrRenderAttr("value", c.code)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.country) ? ssrLooseContain(filters.value.country, c.code) : ssrLooseEqual(filters.value.country, c.code)) ? " selected" : ""}>${ssrInterpolate(c.code)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex-[1.5] min-w-[300px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label><div class="flex items-center gap-2"><input type="date"${ssrRenderAttr("value", filters.value.start_date)} class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><span class="text-slate-300">→</span><input type="date"${ssrRenderAttr("value", filters.value.end_date)} class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"></div></div></div><div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-left border-collapse min-w-[1000px]"><thead><tr class="bg-slate-50/50"><th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Journey</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Device</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th><th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Attribution</th></tr></thead><tbody class="divide-y divide-slate-50"><!--[-->`);
      ssrRenderList(logResponse.value.data, (event) => {
        _push(`<tr class="group hover:bg-slate-50 transition-all cursor-pointer"><td class="py-8 px-10"><div class="flex items-center gap-5"><div class="w-12 h-12 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div><div><p class="text-xs font-black text-slate-900 flex items-center gap-2"> ID: ${ssrInterpolate(event.session_id ? event.session_id.substring(0, 10) : "—")} `);
        if (event.gclid) {
          _push(`<span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p><p class="text-[9px] text-slate-400 font-black uppercase tracking-tight mt-1">${ssrInterpolate(new Date(event.created_at).toLocaleTimeString())} · ${ssrInterpolate(event.created_at?.split("T")[0])}</p></div></div></td><td class="py-8 px-6"><div class="flex items-center gap-5"><div><p class="text-xs font-black text-slate-900">${ssrInterpolate(event.duration_seconds)}s</p><p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell</p></div><div class="w-px h-8 bg-slate-100"></div><div><p class="${ssrRenderClass([event.click_count > 3 ? "text-emerald-600" : "text-slate-900", "text-xs font-black tracking-tighter"])}">+${ssrInterpolate(event.click_count)}</p><p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Clicks</p></div></div></td><td class="py-8 px-6"><div><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(event.browser)} / ${ssrInterpolate(event.platform)}</p><p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">${ssrInterpolate(event.device_type)} · ${ssrInterpolate(event.screen_resolution)}</p></div></td><td class="py-8 px-6"><div class="flex items-center gap-3"><span class="text-xl">${ssrInterpolate(event.country_code === "US" ? "🇺🇸" : event.country_code === "KE" ? "🇰🇪" : "🌍")}</span><div><p class="text-[10px] font-black text-slate-800 uppercase">${ssrInterpolate(event.city || "Unknown")}</p><p class="text-[9px] text-slate-400 font-black uppercase">${ssrInterpolate(event.country_code)}</p></div></div></td><td class="py-8 px-10 text-right"><div class="flex flex-col items-end gap-1.5">`);
        if (event.google_campaign_id) {
          _push(`<div class="px-2.5 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm">${ssrInterpolate(event.google_campaign_id)}</div>`);
        } else {
          _push(`<!---->`);
        }
        if (event.gclid) {
          _push(`<div class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100">GCLID ACTIVE</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="text-[9px] text-slate-400 font-bold max-w-[150px] truncate"${ssrRenderAttr("title", event.referrer)}>${ssrInterpolate(event.referrer ? safeHostname(event.referrer) : "DIRECT")}</div></div></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div><div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"> Showing <span class="text-slate-900">${ssrInterpolate(logResponse.value.from || 0)}-${ssrInterpolate(logResponse.value.to || 0)}</span> of <span class="text-slate-900">${ssrInterpolate(logResponse.value.total)}</span> signals </p><div class="flex items-center gap-3"><button${ssrIncludeBooleanAttr(filters.value.page === 1 || isLoading.value) ? " disabled" : ""} class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"> Prev </button><div class="flex items-center gap-2"><span class="text-[10px] font-black text-slate-900">Page ${ssrInterpolate(filters.value.page)} of ${ssrInterpolate(logResponse.value.last_page)}</span></div><button${ssrIncludeBooleanAttr(filters.value.page === logResponse.value.last_page || isLoading.value) ? " disabled" : ""} class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"> Next </button></div></div>`);
      if (logResponse.value.data.length === 0) {
        _push(`<div class="p-32 text-center"><div class="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-2 border-dashed border-slate-200"><svg class="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div><h4 class="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Silenced Signals</h4><p class="text-slate-500 max-w-sm mx-auto font-medium">Listening for pixel signals on the authorised domain. No active signals captured with current filters.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (selectedSession.value) {
        _push(`<div class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12"><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"></div><div class="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[95vh] border border-white/20"><div class="p-14 border-b border-slate-100/50 flex items-center justify-between bg-white"><div><div class="flex items-center gap-5"><h3 class="text-4xl font-black text-slate-900 tracking-tight italic">Forensic Journey</h3><span class="px-5 py-1.5 bg-indigo-600 text-white text-[11px] font-black rounded-full uppercase tracking-widest shadow-2xl">${ssrInterpolate(selectedSession.value?.session_id?.substring(0, 16) || "ANONYMOUS")}</span></div><p class="text-slate-400 font-bold mt-3 text-xs uppercase tracking-widest">Digital forensics for attribution verification.</p></div><button class="w-16 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-3xl transition-all flex items-center justify-center active:scale-90"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="flex-1 overflow-y-auto p-14 bg-white"><div class="grid grid-cols-1 lg:grid-cols-12 gap-16"><div class="lg:col-span-5 space-y-12"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4"><span class="w-10 h-0.5 bg-indigo-600"></span>Step-by-Step Signals </h4><div class="space-y-10 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100"><!--[-->`);
        ssrRenderList(sessionTimeline.value, (entry) => {
          _push(`<div class="relative pl-14 group"><div class="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 group-hover:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm"><div class="w-2 h-2 bg-slate-200 group-hover:bg-indigo-600 rounded-full transition-all"></div></div><p class="text-sm font-black text-slate-900 uppercase italic truncate"${ssrRenderAttr("title", entry.page_url)}>${ssrInterpolate(entry.page_url?.split("/").pop() || "Root Index")}</p><div class="flex items-center gap-4 mt-2"><span class="text-[10px] text-slate-400 font-black uppercase">${ssrInterpolate(new Date(entry.created_at).toLocaleTimeString())}</span><span class="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded uppercase">${ssrInterpolate(entry.duration_seconds)}s Stay</span>`);
          if (entry.click_count > 0) {
            _push(`<span class="text-emerald-600 text-[9px] font-black uppercase tracking-widest">${ssrInterpolate(entry.click_count)} Clicks</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div><div class="lg:col-span-7 space-y-12"><div class="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 relative overflow-hidden"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Engagement Peak Analysis</h4><div class="h-64">`);
        _push(ssrRenderComponent(unref(Line), {
          data: sessionChartData.value,
          options: modalChartOptions
        }, null, _parent));
        _push(`</div></div><div class="grid grid-cols-2 gap-8"><div class="space-y-4"><h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Origin</h5><div class="space-y-3"><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Source</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.utm_source || "DIRECT")}</p></div><div class="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl"><p class="text-[9px] font-black text-indigo-400 uppercase mb-1">Campaign ID</p><p class="text-xs font-black text-indigo-700 uppercase">${ssrInterpolate(selectedSession.value.google_campaign_id || "N/A")}</p></div></div></div><div class="space-y-4"><h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Spec</h5><div class="space-y-3"><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Tech Stack</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.browser)} / ${ssrInterpolate(selectedSession.value.platform)}</p></div><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Canvas</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.screen_resolution)}</p></div></div></div></div><div class="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50"><p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Google Ads Verification</p>`);
        if (selectedSession.value.gclid) {
          _push(`<p class="text-xs font-bold text-emerald-700 break-all leading-relaxed"> Verified Google Ads lead with GCLID: <span class="font-black italic bg-white/50 px-1">${ssrInterpolate(selectedSession.value.gclid)}</span></p>`);
        } else {
          _push(`<p class="text-xs font-bold text-slate-400 italic uppercase tracking-tighter">No GCLID detected for this session.</p>`);
        }
        _push(`</div></div></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_sfc_main$1, {
        show: showRegenModal.value,
        title: "Regenerate Site Token?",
        message: "This action is irreversible. All current tracking scripts will stop working until updated with the new token.",
        confirmText: "Regenerate",
        onClose: ($event) => showRegenModal.value = false,
        onConfirm: regenerateToken
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/DevelopersTab.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
