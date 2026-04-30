import { ref, computed, onMounted, onUnmounted, watch, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import axios from "axios";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _sfc_main$1 } from "./ConfirmationModal-EXlnTAwk.js";
import { Chart, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement } from "chart.js";
import { Doughnut, Bar, Line } from "vue-chartjs";
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
    Chart.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler, BarElement, BarController, ArcElement);
    const props = __props;
    const snippet = ref("");
    const logResponse = ref({ data: [], current_page: 1, last_page: 1, total: 0 });
    const chartEvents = ref([]);
    const isLoading = ref(false);
    const isRegenerating = ref(false);
    ref(false);
    ref(false);
    const toast = useToastStore();
    const selectedPropId = ref(props.propertyId || props.properties?.[0]?.id);
    const selectedCampaignId = ref("");
    const selectedSession = ref(null);
    const searchQuery = ref("");
    ref(null);
    const allowedDomainInput = ref("");
    ref("");
    const isSavingModules = ref(false);
    const showRegenModal = ref(false);
    const analyticsData = ref(null);
    const isLoadingAnalytics = ref(false);
    const pathFilter = ref("");
    const activeTab = ref(localStorage.getItem("mp_dev_active_tab") || "signals");
    ref({ data: [], current_page: 1, last_page: 1, total: 0 });
    ref(false);
    ref({
      page: 1,
      search: "",
      per_page: 25
    });
    const pixelSites = ref([]);
    const selectedSiteId = ref(localStorage.getItem("mp_selected_site_id") ? parseInt(localStorage.getItem("mp_selected_site_id")) : null);
    const isCreatingSite = ref(false);
    const showNewSiteModal = ref(false);
    const showSiteDropdown = ref(false);
    const showHealthModal = ref(false);
    const healthModalSite = ref(null);
    const isListening = ref(false);
    const lastHeardSignal = ref(null);
    const newSite = ref({ label: "", allowed_domain: "" });
    const siteSearchQuery = ref("");
    const selectedModules = ref(["click", "schema"]);
    const filters = ref({
      campaign_id: "all",
      type: "all",
      device: "all",
      country: "all",
      start_date: "",
      end_date: "",
      per_page: 25,
      page: 1,
      exclude_bots: true,
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      gclid: ""
    });
    let eventsInterval = null;
    let connInterval = null;
    let analyticsInterval = null;
    const pagesPage = ref(1);
    const pagesPerPage = ref(10);
    const pagesTotalCount = ref(0);
    const attributionSearch = ref("");
    ref(null);
    const injectingPage = ref(null);
    const fetchingSource = ref(null);
    const showSourceModal = ref(false);
    const sourceData = ref({ html: "", schema: null, url: "", mode: "html" });
    const highlightHtml = (code) => {
      if (!code) return "";
      return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/(&lt;!--.*?--&gt;)/gs, '<span class="text-slate-500 italic">$1</span>').replace(/(&lt;\/?[a-z1-6]+)/gi, '<span class="text-rose-400">$1</span>').replace(/(&gt;)/gi, '<span class="text-rose-400">$1</span>').replace(/\s([a-z-]+)(?==)/gi, ' <span class="text-amber-300">$1</span>').replace(/="([^"]*)"/gi, '=<span class="text-emerald-400">"$1"</span>');
    };
    const highlightJson = (code) => {
      if (!code) return "";
      return code.replace(/"([^"]+)"(?=:)/g, '<span class="text-indigo-300">"$1"</span>').replace(new RegExp('(?<=: )"([^"]+)"', "g"), '<span class="text-emerald-300">"$1"</span>').replace(new RegExp("(?<=: )(\\d+)", "g"), '<span class="text-amber-400">$1</span>').replace(new RegExp("(?<=: )(true|false|null)", "g"), '<span class="text-rose-400">$1</span>');
    };
    const sourceLines = computed(() => {
      const raw = sourceData.value.mode === "html" ? sourceData.value.html : JSON.stringify(sourceData.value.schema, null, 4);
      return (raw || "").split("\n");
    });
    computed(() => props.organization?.ads_site_token);
    computed(
      () => props.properties?.find((p) => p.id == selectedPropId.value)
    );
    const selectedSite = computed(
      () => pixelSites.value.find((s) => s.id === selectedSiteId.value)
    );
    const campaignFilter = ref("all");
    computed(() => {
      let ev = logResponse.value.data;
      if (campaignFilter.value !== "all") {
        ev = ev.filter((e) => e.google_campaign_id === campaignFilter.value);
      }
      if (!searchQuery.value) return ev;
      const q = searchQuery.value.toLowerCase();
      return ev.filter(
        (e) => e.page_url?.toLowerCase().includes(q) || e.session_id?.toLowerCase().includes(q) || e.utm_campaign?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q)
      );
    });
    computed(() => {
      const caps = /* @__PURE__ */ new Set();
      chartEvents.value.forEach((e) => {
        if (e.google_campaign_id) caps.add(e.google_campaign_id);
      });
      return Array.from(caps);
    });
    const filteredSiteOptions = computed(() => {
      if (!siteSearchQuery.value) return pixelSites.value;
      const q = siteSearchQuery.value.toLowerCase();
      return pixelSites.value.filter((s) => s.label.toLowerCase().includes(q));
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
      if (analyticsData.value?.by_country) return analyticsData.value.by_country;
      const c = {};
      chartEvents.value.forEach((e) => {
        if (e.country_code) c[e.country_code] = (c[e.country_code] || 0) + 1;
      });
      return Object.entries(c).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    });
    const deviceBreakdown = computed(() => {
      if (analyticsData.value?.by_device) {
        const d2 = { Mobile: 0, Desktop: 0, Tablet: 0 };
        analyticsData.value.by_device.forEach((item) => {
          if (d2[item.name] !== void 0) d2[item.name] = item.count;
        });
        return d2;
      }
      const d = { Mobile: 0, Desktop: 0, Tablet: 0 };
      chartEvents.value.forEach((e) => {
        if (e.device_type && d[e.device_type] !== void 0) d[e.device_type]++;
      });
      return d;
    });
    const topCities = computed(() => analyticsData.value?.by_city ?? []);
    const deviceChartData = computed(() => {
      const d = deviceBreakdown.value;
      return {
        labels: ["Mobile", "Desktop", "Tablet"],
        datasets: [{
          data: [d.Mobile, d.Desktop, d.Tablet],
          backgroundColor: ["#6366f1", "#10b981", "#f59e0b"],
          borderWidth: 0,
          hoverOffset: 15
        }]
      };
    });
    const deviceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          padding: 12,
          cornerRadius: 12,
          titleFont: { size: 10, weight: "bold", family: "Inter" },
          bodyFont: { size: 12, weight: "black", family: "Inter" }
        }
      }
    };
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    const getCountryName = (code) => {
      if (!code || code === "Unknown") return "Global/Unknown";
      try {
        return regionNames.of(code.toUpperCase()) || code;
      } catch (e) {
        return code;
      }
    };
    const getCountryFlag = (code) => {
      if (!code || code === "Unknown" || code.length !== 2) return "🌍";
      return code.toUpperCase().replace(
        /./g,
        (char) => String.fromCodePoint(char.charCodeAt(0) + 127397)
      );
    };
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
    computed(() => analyticsData.value?.pages_total ?? 0);
    const topReferers = computed(() => analyticsData.value?.top_referrers ?? []);
    const rising = computed(() => analyticsData.value?.trend_velocity?.rising ?? []);
    const falling = computed(() => analyticsData.value?.trend_velocity?.falling ?? []);
    const siteHealth = computed(() => analyticsData.value?.site_health ?? null);
    const sessionIsLead = computed(() => {
      if (!selectedSession.value) return false;
      const total = sessionTimeline.value.reduce((s, e) => s + (e.duration_seconds || 0), 0);
      const hasHotPage = sessionTimeline.value.some((e) => (e.duration_seconds || 0) >= 60);
      return total >= 90 || hasHotPage;
    });
    const getHealthLabel = (score) => {
      if (score == null) return "Unknown";
      if (score >= 60) return "Critical";
      if (score >= 35) return "Fair";
      return "Healthy";
    };
    const getHealthClass = (score) => {
      if (score == null) return "bg-slate-50 text-slate-400 border-slate-100";
      if (score >= 60) return "bg-rose-50 text-rose-600 border-rose-200";
      if (score >= 35) return "bg-amber-50 text-amber-600 border-amber-200";
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    };
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
    computed(() => {
      const site = selectedSite.value;
      if (site) {
        if (site.status === "verified_active") return { label: "Verified & Active", color: "emerald", icon: "✓" };
        if (site.status === "connected_inactive") return { label: "Connected – Inactive", color: "amber", icon: "○" };
        return { label: "Not Detected", color: "rose", icon: "✕" };
      }
      return { label: "No Site Selected", color: "slate", icon: "○" };
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
          pixel_site_id: selectedSiteId.value
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
        const r = await axios.get(route("google-ads.analytics"), {
          params: {
            ...filters.value,
            pixel_site_id: selectedSiteId.value,
            pages_page: pagesPage.value,
            pages_per_page: pagesPerPage.value
          }
        });
        analyticsData.value = r.data;
        pagesTotalCount.value = r.data.pages_total ?? 0;
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        isLoadingAnalytics.value = false;
      }
    };
    const fetchConnectionStatus = async () => {
      try {
        const r = await axios.get(route("google-ads.connection-status"));
        pixelSites.value = r.data.pixel_sites || [];
        if (!selectedSiteId.value && pixelSites.value.length > 0) {
          selectedSiteId.value = pixelSites.value[0].id;
        }
        if (selectedSite.value) {
          allowedDomainInput.value = selectedSite.value.allowed_domain || "";
          if (selectedSite.value.enabled_modules) {
            selectedModules.value = [...selectedSite.value.enabled_modules];
          }
        }
      } catch (e) {
      }
    };
    const updateSnippet = () => {
      if (!selectedSite.value) {
        snippet.value = "/* Please select a specific tracking site from the dropdown to generate your custom tracking snippet. */";
        return;
      }
      const base = window.location.origin;
      const camp = selectedCampaignId.value ? ` data-campaign="${selectedCampaignId.value}"` : "";
      const mods = selectedModules.value.length ? ` data-modules="${selectedModules.value.join(",")}"` : "";
      snippet.value = `<script src="${base}/cdn/ads-tracker.js" data-token="${selectedSite.value.ads_site_token}"${camp}${mods} async><\/script>`;
    };
    const regenerateToken = async () => {
      if (!selectedSiteId.value) return;
      showRegenModal.value = false;
      isRegenerating.value = true;
      try {
        const r = await axios.post(route("google-ads.pixel-sites.regenerate-token", { pixel_site: selectedSiteId.value }));
        toast.success("Site token regenerated successfully");
        fetchConnectionStatus();
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
    const fmt = (iso) => {
      if (!iso) return "—";
      const d = new Date(iso);
      const diff = Math.floor((Date.now() - d) / 6e4);
      if (diff < 1) return "Just now";
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
      return d.toLocaleDateString();
    };
    onMounted(() => {
      updateSnippet();
      fetchConnectionStatus();
      eventsInterval = setInterval(fetchEvents, 6e4);
      connInterval = setInterval(fetchConnectionStatus, 3e4);
      analyticsInterval = setInterval(fetchAnalytics, 3e5);
    });
    onUnmounted(() => {
      clearInterval(eventsInterval);
      clearInterval(connInterval);
      clearInterval(analyticsInterval);
    });
    watch([selectedPropId, selectedCampaignId, selectedSiteId, selectedModules], () => {
      updateSnippet();
      if (selectedSite.value) {
        allowedDomainInput.value = selectedSite.value.allowed_domain || "";
      }
    }, { deep: true });
    watch(() => props.propertyId, (val) => {
      if (val) selectedPropId.value = val;
    }, { immediate: true });
    watch(selectedSiteId, (val) => {
      if (val) localStorage.setItem("mp_selected_site_id", val);
      else localStorage.removeItem("mp_selected_site_id");
      if (selectedSite.value && selectedSite.value.enabled_modules) {
        selectedModules.value = [...selectedSite.value.enabled_modules];
      } else if (selectedSite.value) {
        selectedModules.value = ["click", "schema"];
      }
      fetchEvents();
      fetchAnalytics();
    }, { immediate: true });
    watch(activeTab, (val) => {
      localStorage.setItem("mp_dev_active_tab", val);
    });
    watch(pathFilter, () => {
      if (!pathFilter.value) fetchEvents();
    });
    watch(showHealthModal, (val) => {
      if (!val) {
        isListening.value = false;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-12 pb-24" }, _attrs))}><div class="flex items-center justify-between mb-10"><div><h2 class="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4"> Developer Tools <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-indigo-100/50">v3.2</span></h2><p class="text-slate-500 font-medium mt-2 max-w-xl leading-relaxed">Secure pixel tracking with agency attribution monitoring &amp; real-time signal intelligence.</p></div><div class="flex items-center gap-4"><div class="relative"><div class="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl"><button class="${ssrRenderClass([!selectedSiteId.value ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap flex items-center gap-2"])}"> All Sites </button><div class="h-6 w-px bg-slate-200 mx-1"></div><button class="${ssrRenderClass([selectedSiteId.value ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap flex items-center gap-3"])}">${ssrInterpolate(selectedSite.value ? selectedSite.value.label : "Select Site")} `);
      if (selectedSite.value) {
        _push(`<span class="${ssrRenderClass([{
          "bg-emerald-500": selectedSite.value.status === "verified_active",
          "bg-amber-400": selectedSite.value.status === "connected_inactive",
          "bg-slate-300": selectedSite.value.status === "not_detected"
        }, "w-1.5 h-1.5 rounded-full"])}"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<svg class="${ssrRenderClass([{ "rotate-180": showSiteDropdown.value }, "w-3 h-3 transition-transform"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg></button></div>`);
      if (showSiteDropdown.value) {
        _push(`<div class="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl shadow-premium border border-slate-100 z-50 overflow-hidden"><div class="p-3 border-b border-slate-50"><input${ssrRenderAttr("value", siteSearchQuery.value)} placeholder="Search sites..." class="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/10"></div><div class="max-h-64 overflow-y-auto p-2 no-scrollbar"><!--[-->`);
        ssrRenderList(filteredSiteOptions.value, (site) => {
          _push(`<button class="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group"><div class="flex items-center gap-3"><div class="${ssrRenderClass([{
            "bg-emerald-500": site.status === "verified_active",
            "bg-amber-400": site.status === "connected_inactive",
            "bg-slate-300": site.status === "not_detected"
          }, "w-2 h-2 rounded-full"])}"></div><span class="text-[11px] font-black uppercase text-slate-700 group-hover:text-indigo-600">${ssrInterpolate(site.label)}</span></div>`);
          if (selectedSiteId.value === site.id) {
            _push(`<div class="flex gap-2"><button class="p-1 px-2 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase hover:bg-indigo-100 transition-colors">Health</button><span class="text-indigo-600"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg></span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]-->`);
        if (filteredSiteOptions.value.length === 0) {
          _push(`<div class="p-8 text-center text-[10px] font-black text-slate-300 uppercase italic">No sites found</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6"><div class="bg-white p-8 shadow-premium rounded-[2.5rem] border border-slate-100 relative overflow-hidden"><p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p><h4 class="text-4xl font-black text-slate-900 tracking-tight">${ssrInterpolate(logResponse.value.total)}</h4><div class="mt-3 flex items-center justify-between"><span class="text-[10px] font-black text-slate-400">${ssrInterpolate(selectedSite.value ? selectedSite.value.hits_last_24h : pixelSites.value.reduce((s, x) => s + x.hits_last_24h, 0))} in last 24h</span>`);
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
      _push(`</div></div><div class="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50 flex flex-col justify-center items-center text-center group hover:bg-white hover:shadow-premium transition-all"><p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Growth Forecast</p><h4 class="text-2xl font-black text-slate-900 tracking-tight">Stable</h4><span class="text-[9px] font-bold text-slate-400 mt-2 italic">Based on 7d velocity</span></div></div><div class="lg:col-span-4 bg-indigo-600 p-10 shadow-indigo-200 shadow-2xl rounded-[3rem] text-white relative overflow-hidden group"><div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform"></div><div class="relative z-10"><p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Avg Engagement</p><h4 class="text-4xl font-black tracking-tight">${ssrInterpolate(avgClicks.value)} <small class="text-lg opacity-60">hits/session</small></h4><div class="mt-4 flex items-center gap-2"><span class="px-2 py-0.5 bg-white/20 rounded text-[9px] font-bold uppercase tracking-tighter">Live Telemetry</span></div></div></div></div><div class="bg-white p-8 shadow-premium rounded-[3rem] border border-slate-100"><div class="grid grid-cols-1 lg:grid-cols-12 gap-12"><div class="lg:col-span-8"><div class="flex items-center justify-between mb-8"><div><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Signal Origin</h4><p class="text-[9px] text-slate-400 font-medium mt-1">Acquisition by country and territory (last 30 days)</p></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><!--[-->`);
      ssrRenderList(topCountries.value, (geo) => {
        _push(`<div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-premium hover:border-indigo-100/50 transition-all group"><div class="flex items-center justify-between mb-3"><span class="text-2xl group-hover:scale-110 transition-transform">${ssrInterpolate(getCountryFlag(geo.code))}</span><span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${ssrInterpolate(Math.round(geo.count / (analyticsData.value?.summary?.last30_hits || chartEvents.value.length || 1) * 100))}% </span></div><p class="text-[10px] font-black text-slate-900 leading-tight line-clamp-2 h-7"${ssrRenderAttr("title", getCountryName(geo.code))}>${ssrInterpolate(getCountryName(geo.code))}</p><p class="text-[9px] font-black text-indigo-500 uppercase mt-0.5">${ssrInterpolate(geo.count.toLocaleString())} <span class="text-slate-400">Signals</span></p></div>`);
      });
      _push(`<!--]-->`);
      if (topCountries.value.length === 0) {
        _push(`<div class="col-span-full py-12 text-center text-slate-300 italic text-[11px] border-2 border-dashed border-slate-100 rounded-2xl"> Intelligence gathering in progress... </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="lg:col-span-4 border-l border-slate-100 pl-12 flex flex-col"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Client Distribution</h4><div class="flex-1 flex flex-col items-center justify-center relative min-h-[200px]"><div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span class="text-2xl font-black text-slate-900">${ssrInterpolate((deviceBreakdown.value.Mobile + deviceBreakdown.value.Desktop + deviceBreakdown.value.Tablet).toLocaleString())}</span><span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Unique Devices</span></div><div class="w-full h-full max-h-[180px]">`);
      _push(ssrRenderComponent(unref(Doughnut), {
        data: deviceChartData.value,
        options: deviceChartOptions
      }, null, _parent));
      _push(`</div></div><div class="mt-8 grid grid-cols-3 gap-2"><!--[-->`);
      ssrRenderList(["#6366f1", "#10b981", "#f59e0b"], (color, idx) => {
        _push(`<div class="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100/50"><span class="w-2 h-2 rounded-full mb-1" style="${ssrRenderStyle({ backgroundColor: color })}"></span><span class="text-[8px] font-black text-slate-400 uppercase">${ssrInterpolate(deviceChartData.value.labels[idx])}</span><span class="text-[10px] font-black text-slate-900 mt-0.5">${ssrInterpolate(deviceChartData.value.datasets[0].data[idx].toLocaleString())}</span></div>`);
      });
      _push(`<!--]--></div></div></div>`);
      if (topCities.value.length > 0) {
        _push(`<div class="mt-12 pt-8 border-t border-slate-50"><div class="flex items-center justify-between mb-8"><div><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Traffic Fingerprinting</h4><p class="text-[9px] text-slate-400 font-medium mt-1">High-intent regional signal clusters</p></div></div><div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(topCities.value, (city) => {
          _push(`<div class="px-4 py-2 bg-indigo-50/30 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100/50 flex items-center gap-2 hover:bg-indigo-50 transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg> ${ssrInterpolate(city.name)} <span class="px-1.5 py-0.5 bg-white rounded-md text-[8px] border border-indigo-100">${ssrInterpolate(city.count)}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white p-12 shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden relative"><div class="flex items-center justify-between mb-10"><div><h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4"> 30-Day Signal History <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">Daily</span></h3><p class="text-slate-400 font-medium text-xs mt-1">Total pixel hits (bars) vs Ad-attributed hits (amber line) — darker bars = above-average days</p></div><div class="flex gap-4"><div class="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100"><span class="w-3 h-3 bg-indigo-500 rounded-sm"></span><span class="text-[10px] font-black text-indigo-600 uppercase">Total Signals</span></div><div class="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100"><span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span><span class="text-[10px] font-black text-amber-600 uppercase">Ad Hits</span></div></div></div><div class="h-[380px] relative">`);
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
      _push(`</div></div>`);
      if (topPages.value.filter((p) => p.bottleneck_score >= 60).length) {
        _push(`<div class="grid grid-cols-1 md:grid-cols-3 gap-6"><!--[-->`);
        ssrRenderList(topPages.value.filter((p) => p.bottleneck_score >= 60).slice(0, 3), (page) => {
          _push(`<div class="${ssrRenderClass([page.bottleneck_score >= 80 ? "bg-rose-50 border-rose-200 hover:shadow-rose-100 hover:shadow-lg" : "bg-amber-50 border-amber-200 hover:shadow-amber-100 hover:shadow-lg", "group relative flex items-start gap-5 p-8 rounded-[2.5rem] border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"])}"><div class="${ssrRenderClass([page.bottleneck_score >= 80 ? "bg-rose-400" : "bg-amber-400", "absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-30 transition-all group-hover:scale-125"])}"></div><div class="${ssrRenderClass([page.bottleneck_score >= 80 ? "bg-white text-rose-500" : "bg-white text-amber-500", "w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl shadow-sm"])}">${ssrInterpolate(page.bottleneck_score >= 80 ? "🔴" : "🟡")}</div><div class="min-w-0 z-10"><p class="${ssrRenderClass([page.bottleneck_score >= 80 ? "text-rose-500" : "text-amber-600", "text-[9px] font-black uppercase tracking-widest mb-0.5"])}">${ssrInterpolate(page.bottleneck_score >= 80 ? "Critical" : "Warning")} · Score ${ssrInterpolate(page.bottleneck_score)}</p><p class="text-xs font-black text-slate-900 truncate"${ssrRenderAttr("title", page.page_url)}>${ssrInterpolate(safePathLabel(page.page_url))}</p><div class="flex flex-wrap gap-3 mt-2">`);
          if (page.bounce_rate > 50) {
            _push(`<span class="text-[9px] font-bold text-slate-500">↑ Bounce ${ssrInterpolate(page.bounce_rate)}%</span>`);
          } else {
            _push(`<!---->`);
          }
          if (page.avg_load_time > 3e3) {
            _push(`<span class="text-[9px] font-bold text-slate-500">⏱ Load ${ssrInterpolate((page.avg_load_time / 1e3).toFixed(1))}s</span>`);
          } else {
            _push(`<!---->`);
          }
          if (page.error_count > 0) {
            _push(`<span class="text-[9px] font-bold text-slate-500">⚠ ${ssrInterpolate(page.error_count)} errors/24h</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden"><div class="px-12 pt-12 pb-8 flex items-end justify-between border-b border-slate-50"><div><h3 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4"> Path Intelligence <span class="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-slate-100">Top 10</span></h3><p class="text-slate-400 text-xs font-medium mt-1">Most-visited pages with 14-day trend sparkline and day-over-day delta. Click a row to drill into its log.</p></div>`);
      if (pathFilter.value) {
        _push(`<button class="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg> Clear filter </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="overflow-x-auto"><table class="w-full text-left min-w-[900px]"><thead><tr class="bg-slate-50/60"><th class="py-5 px-12 text-[9px] font-black text-slate-400 uppercase tracking-widest">Page / Path</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Health</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hits</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Bounce Rate</th><th class="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">14-Day Trend</th><th class="py-5 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Δ vs Yesterday</th></tr></thead><tbody class="divide-y divide-slate-50">`);
      if (isLoadingAnalytics.value && !topPages.value.length) {
        _push(`<tr><td colspan="7" class="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Loading path data...</td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(topPages.value, (page, idx) => {
        _push(`<!--[--><tr class="${ssrRenderClass([pathFilter.value === page.page_url ? "bg-indigo-50/20 border-indigo-500" : "border-transparent", "group hover:bg-slate-50 cursor-pointer transition-all border-l-4"])}"><td class="py-7 px-12"><div class="flex items-center gap-4"><div class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">${ssrInterpolate((pagesPage.value - 1) * pagesPerPage.value + idx + 1)}</div><div class="min-w-0"><div class="flex items-center gap-2 mb-1"><p class="text-[11px] font-black text-slate-900 truncate max-w-xs"${ssrRenderAttr("title", page.page_url)}>${ssrInterpolate(safePathLabel(page.page_url))}</p>`);
        if (page.is_ad_ready) {
          _push(`<span class="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-lg uppercase tracking-tighter shadow-sm">Ad Ready</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><svg class="${ssrRenderClass([{ "rotate-180": page.showRecs }, "w-3.5 h-3.5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg></button><a${ssrRenderAttr("href", `/site_analysis?path=${encodeURIComponent(page.page_url)}${selectedSiteId.value ? "&site_id=" + selectedSiteId.value : ""}`)} class="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-black rounded-lg border border-indigo-100 transition-all uppercase tracking-tight" title="Open per-path deep-dive analysis"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Deep Dive </a></div><div class="flex items-center gap-2"><!--[-->`);
        ssrRenderList(page.matched_keywords.slice(0, 3), (k) => {
          _push(`<span class="text-[8px] font-bold text-slate-400">#${ssrInterpolate(k.query.replace(/\s+/g, ""))}</span>`);
        });
        _push(`<!--]-->`);
        if (!page.matched_keywords.length) {
          _push(`<span class="text-[9px] text-slate-300 font-bold truncate max-w-xs">${ssrInterpolate(safeHostname(page.page_url))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></td><td class="py-7 px-6 text-center"><div class="${ssrRenderClass([getHealthClass(page.bottleneck_score), "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border shadow-sm"])}">${ssrInterpolate(getHealthLabel(page.bottleneck_score))}</div></td><td class="py-7 px-6 text-center"><span class="text-sm font-black text-slate-900">${ssrInterpolate(page.total_hits)}</span><p class="text-[9px] text-slate-400 font-bold mt-1">${ssrInterpolate(page.ad_hits)} Ad Hits</p></td><td class="py-7 px-6 text-center"><div class="flex flex-col items-center"><span class="text-xs font-black text-slate-700">${ssrInterpolate(page.avg_duration)}s Dwell</span><span class="text-[9px] text-slate-400 font-bold mt-1">${ssrInterpolate(page.avg_clicks)} Avg Clicks</span></div></td><td class="py-7 px-6 text-center"><span class="${ssrRenderClass([page.bounce_rate > 50 ? "text-rose-500" : "text-emerald-500", "text-xs font-black"])}">${ssrInterpolate(page.bounce_rate)}%</span><div class="w-12 h-1 bg-slate-100 rounded-full mt-1 mx-auto overflow-hidden"><div class="${ssrRenderClass([page.bounce_rate > 50 ? "bg-rose-500" : "bg-emerald-500", "h-full"])}" style="${ssrRenderStyle({ width: page.bounce_rate + "%" })}"></div></div></td><td class="py-7 px-6"><div class="flex items-center justify-center"><svg width="60" height="20" class="overflow-visible">`);
        if (sparklinePath(page.sparkline)) {
          _push(`<path${ssrRenderAttr("d", sparklinePath(page.sparkline))} fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</svg></div></td><td class="py-7 px-10 text-right"><span class="${ssrRenderClass([deltaBadgeClass(page.delta_pct), "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black font-mono shadow-sm"])}">${ssrInterpolate(deltaIcon(page.delta_pct))}${ssrInterpolate(Math.abs(page.delta_pct))}% </span></td></tr>`);
        if (page.showRecs) {
          _push(`<tr class="bg-slate-50/80 border-l-4 border-indigo-200"><td colspan="7" class="py-8 px-12"><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="col-span-1 space-y-4"><h5 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Meta</h5><div class="space-y-2"><div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"><span class="text-[9px] font-bold text-slate-500">Avg Load Time</span><span class="${ssrRenderClass([page.avg_load_time > 3e3 ? "text-rose-500" : "text-slate-900", "text-[10px] font-black"])}">${ssrInterpolate((page.avg_load_time / 1e3).toFixed(2))}s</span></div><div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"><span class="text-[9px] font-bold text-slate-500">Issue Count (24h)</span><span class="${ssrRenderClass([page.error_count > 0 ? "text-rose-500" : "text-slate-900", "text-[10px] font-black"])}">${ssrInterpolate(page.error_count)}</span></div></div></div><div class="col-span-2 space-y-4"><h5 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">MetaPilot Optimization Logic</h5><div class="p-6 bg-white rounded-2xl border border-slate-100 shadow-premium-sm relative overflow-hidden"><div class="absolute right-4 top-4 text-xs opacity-20">🤖</div>`);
          if (page.recommendations?.length) {
            _push(`<p class="text-xs font-bold text-slate-800 leading-relaxed italic whitespace-pre-wrap">&quot;${ssrInterpolate(page.recommendations.join(" · "))}&quot;</p>`);
          } else {
            _push(`<p class="text-xs font-bold text-slate-400 leading-relaxed italic">No specific recommendations — this page looks healthy! 🎉</p>`);
          }
          _push(`<div class="mt-6 flex items-center gap-4"><button${ssrIncludeBooleanAttr(injectingPage.value === page.page_url) ? " disabled" : ""} class="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-tight shadow-md hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50">${ssrInterpolate(injectingPage.value === page.page_url ? "Injecting..." : "Auto-Inject Schema")}</button><button${ssrIncludeBooleanAttr(fetchingSource.value === page.page_url) ? " disabled" : ""} class="px-4 py-2 bg-white text-slate-600 border border-slate-200 text-[9px] font-black rounded-lg uppercase tracking-tight hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30">${ssrInterpolate(fetchingSource.value === page.page_url ? "Fetching..." : "View Page Source")}</button></div></div></div></div></td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (topPages.value.length === 0 && !isLoadingAnalytics.value) {
        _push(`<div class="p-16 text-center"><p class="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">No page data yet — signals will appear as your pixel fires.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="px-12 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between"><div class="flex items-center gap-6"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"> Total Pages Tracked: <span class="text-slate-900">${ssrInterpolate(pagesTotalCount.value)}</span></p><div class="flex items-center gap-3"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per Page</label><select class="bg-white border-slate-200 rounded-lg text-[10px] font-black py-1 px-3 focus:ring-0"><option${ssrRenderAttr("value", 10)}${ssrIncludeBooleanAttr(Array.isArray(pagesPerPage.value) ? ssrLooseContain(pagesPerPage.value, 10) : ssrLooseEqual(pagesPerPage.value, 10)) ? " selected" : ""}>10</option><option${ssrRenderAttr("value", 25)}${ssrIncludeBooleanAttr(Array.isArray(pagesPerPage.value) ? ssrLooseContain(pagesPerPage.value, 25) : ssrLooseEqual(pagesPerPage.value, 25)) ? " selected" : ""}>25</option><option${ssrRenderAttr("value", 50)}${ssrIncludeBooleanAttr(Array.isArray(pagesPerPage.value) ? ssrLooseContain(pagesPerPage.value, 50) : ssrLooseEqual(pagesPerPage.value, 50)) ? " selected" : ""}>50</option></select></div></div><div class="flex items-center gap-4"><button${ssrIncludeBooleanAttr(pagesPage.value === 1 || isLoadingAnalytics.value) ? " disabled" : ""} class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"> Prev </button><span class="text-[10px] font-black text-slate-900 font-mono">Page ${ssrInterpolate(pagesPage.value)} of ${ssrInterpolate(Math.ceil(pagesTotalCount.value / pagesPerPage.value) || 1)}</span><button${ssrIncludeBooleanAttr(pagesPage.value >= Math.ceil(pagesTotalCount.value / pagesPerPage.value) || isLoadingAnalytics.value) ? " disabled" : ""} class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"> Next </button></div></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10"><div class="flex items-center gap-3 mb-7"><div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">🚀</div><div><p class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Fastest Rising</p><p class="text-[9px] text-slate-400 font-bold">7-day growth vs prior 7 days</p></div></div><div class="space-y-4">`);
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
      _push(`<!--]--></div></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-8"><div class="lg:col-span-8 bg-slate-900 p-12 shadow-2xl rounded-[3.5rem] border border-slate-800 relative overflow-hidden"><div class="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div><div class="flex items-center justify-between mb-10"><div class="flex items-center gap-5"><div class="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg relative"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>`);
      if (selectedSite.value) {
        _push(`<span class="${ssrRenderClass([{
          "bg-emerald-500": selectedSite.value.status === "verified_active",
          "bg-amber-400": selectedSite.value.status === "connected_inactive",
          "bg-slate-300": selectedSite.value.status === "not_detected"
        }, "absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-900"])}"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><h3 class="text-2xl font-black text-white tracking-tight">${ssrInterpolate(selectedSite.value ? selectedSite.value.label : "Select Pixel Site")}</h3><div class="flex items-center gap-3 mt-1"><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${ssrInterpolate(selectedSite.value ? selectedSite.value.ads_site_token.substring(0, 18) + "..." : "System Identity v3.2")}</span>`);
      if (selectedSite.value) {
        _push(`<button class="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1.5 transition-colors"><span class="w-1 h-1 rounded-full bg-indigo-500"></span> View Health &amp; Config </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="flex items-center gap-4"><button class="px-5 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all shadow-xl"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg> New Identification </button></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"><div class="space-y-3"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lead Attribution ID</label><input${ssrRenderAttr("value", selectedCampaignId.value)} placeholder="e.g. fb_ads_winter_campaign" class="w-full bg-white/5 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6"></div><div class="space-y-3"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identification Source</label><select class="w-full bg-slate-800 border-white/10 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-white py-4 px-6 appearance-none cursor-pointer"><option${ssrRenderAttr("value", null)}${ssrIncludeBooleanAttr(Array.isArray(selectedSiteId.value) ? ssrLooseContain(selectedSiteId.value, null) : ssrLooseEqual(selectedSiteId.value, null)) ? " selected" : ""}>System Selection...</option><!--[-->`);
      ssrRenderList(pixelSites.value, (site) => {
        _push(`<option${ssrRenderAttr("value", site.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedSiteId.value) ? ssrLooseContain(selectedSiteId.value, site.id) : ssrLooseEqual(selectedSiteId.value, site.id)) ? " selected" : ""}>${ssrInterpolate(site.label)} (${ssrInterpolate(site.total_hits)} hits)</option>`);
      });
      _push(`<!--]--></select></div></div><div class="mb-10"><div class="flex items-center justify-between mb-4"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Active Modules</label>`);
      if (selectedSiteId.value) {
        _push(`<button${ssrIncludeBooleanAttr(isSavingModules.value) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all shadow-sm disabled:opacity-50">`);
        if (isSavingModules.value) {
          _push(`<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
        } else {
          _push(`<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`);
        }
        _push(` Save configuration to Site </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><!--[-->`);
      ssrRenderList([
        { id: "click", label: "Click Stream", desc: "Ad attribution" },
        { id: "schema", label: "AI Schema", desc: "JSON-LD Injection" },
        { id: "seo", label: "SEO Audit", desc: "Page diagnostics" },
        { id: "behavior", label: "Behavior", desc: "Dwell & scroll" }
      ], (mod) => {
        _push(`<div class="${ssrRenderClass([selectedModules.value.includes(mod.id) ? "bg-indigo-600 border-indigo-400" : "bg-white/5 border-white/5 hover:border-white/10", "p-4 rounded-2xl border-2 cursor-pointer transition-all select-none"])}"><div class="flex items-center gap-3"><div class="${ssrRenderClass([selectedModules.value.includes(mod.id) ? "bg-white border-white" : "border-white/20 bg-transparent", "w-4 h-4 rounded border flex items-center justify-center transition-colors"])}">`);
        if (selectedModules.value.includes(mod.id)) {
          _push(`<svg class="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><span class="${ssrRenderClass([selectedModules.value.includes(mod.id) ? "text-white" : "text-slate-400", "text-[11px] font-black uppercase tracking-tight"])}">${ssrInterpolate(mod.label)}</span></div><p class="${ssrRenderClass([selectedModules.value.includes(mod.id) ? "text-white/60" : "text-slate-500", "text-[9px] font-medium mt-1 ml-7"])}">${ssrInterpolate(mod.desc)}</p></div>`);
      });
      _push(`<!--]--></div></div><div class="bg-black/40 rounded-3xl p-8 border border-white/5 shadow-inner relative group"><pre class="text-indigo-300 text-[13px] font-mono overflow-x-auto leading-relaxed">${ssrInterpolate(snippet.value)}</pre><button class="absolute top-4 right-4 p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 opacity-0 group-hover:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div><div class="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8"><div class="flex items-start gap-4 text-slate-400"><svg class="w-5 h-5 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div class="space-y-1"><p class="text-[10px] font-black text-white uppercase tracking-widest">Attribution Settings</p><p class="text-[10px] font-medium leading-relaxed">Every hit from this pixel will be permanently attributed to <span class="text-indigo-400 font-black">${ssrInterpolate(selectedCampaignId.value || "Default")}</span> for campaign isolation.</p></div></div><div class="flex items-start gap-4 text-slate-400"><svg class="w-5 h-5 mt-1 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`);
      if (selectedModules.value.includes("schema")) {
        _push(`<div class="space-y-1"><p class="text-[10px] font-black text-white uppercase tracking-widest">AI Schema Active</p><p class="text-[10px] font-medium leading-relaxed">MetaPilot will extract DOM metadata and inject optimized JSON-LD automatically. Conflict detection included.</p></div>`);
      } else {
        _push(`<div class="space-y-1"><p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Mode</p><p class="text-[10px] font-medium leading-relaxed">Only click events are tracked. Toggle &quot;AI Schema&quot; to enable automated SEO injections.</p></div>`);
      }
      _push(`</div></div>`);
      if (selectedSite.value) {
        _push(`<div class="mt-6 flex justify-end"><button class="text-[10px] font-black text-rose-500 hover:text-white transition-colors uppercase tracking-widest">Regenerate Secret</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-premium relative overflow-hidden group"><div class="relative z-10"><div class="flex items-center justify-between mb-8"><h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Connection Health</h3>`);
      if (selectedSite.value) {
        _push(`<span class="${ssrRenderClass([{
          "bg-emerald-500 animate-pulse": selectedSite.value.status === "verified_active",
          "bg-amber-400": selectedSite.value.status === "connected_inactive",
          "bg-slate-300": selectedSite.value.status === "not_detected"
        }, "flex h-2 w-2 rounded-full"])}"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100"><label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Traffic Origin Pinning</label><div class="relative group/pin"><input${ssrRenderAttr("value", allowedDomainInput.value)} placeholder="e.g. domain.com" class="w-full bg-white border-slate-200 focus:border-indigo-500 focus:ring-0 rounded-2xl text-[11px] font-bold text-slate-700 py-3.5 px-5 shadow-sm"><button class="absolute right-2 top-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg opacity-0 group-hover/pin:opacity-100 transition-all">Save</button></div><p class="text-[9px] text-slate-400 font-medium mt-2 leading-relaxed italic">Restricts signals to this domain ONLY.</p></div><div class="space-y-4"><div class="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm"><p class="text-[9px] font-black text-slate-400 uppercase mb-2">Service Identity</p><div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-700 uppercase">${ssrInterpolate(selectedSite.value ? selectedSite.value.label : "N/A")}</span><span class="text-[10px] font-mono text-indigo-600 font-black">${ssrInterpolate(selectedSite.value ? selectedSite.value.ads_site_token.substring(0, 12) + "..." : "---")}</span></div></div>`);
      if (selectedSite.value) {
        _push(`<button class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Start Live Scan </button>`);
      } else {
        _push(`<div class="p-5 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center"><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Site to Verify</p></div>`);
      }
      _push(`</div><div class="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">`);
      if (selectedSite.value) {
        _push(`<button class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">Reset Secret</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight">API Identity v3.2</span></div></div></div><div class="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 group-hover:bg-indigo-100/50 rounded-full transition-colors duration-700 pointer-events-none"></div></div></div><div id="intel-log" class="space-y-8 pt-12"><div class="flex flex-col md:flex-row md:items-end justify-between gap-8"><div class="flex-1"><div class="flex items-center gap-8 mb-8 border-b border-slate-100"><button class="${ssrRenderClass([activeTab.value === "signals" ? "text-indigo-600 border-indigo-600 font-black" : "text-slate-400 border-transparent hover:text-slate-600", "text-[11px] font-black uppercase tracking-widest transition-all pb-4 border-b-2 flex items-center gap-2"])}"> Signals Log <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px]">${ssrInterpolate(logResponse.value.total)}</span></button><button class="${ssrRenderClass([activeTab.value === "performance" ? "text-indigo-600 border-indigo-600 font-black" : "text-slate-400 border-transparent hover:text-slate-600", "text-[11px] font-black uppercase tracking-widest transition-all pb-4 border-b-2 flex items-center gap-2"])}"> Performance &amp; Health `);
      if (siteHealth.value?.alerts_last_24h?.length) {
        _push(`<span class="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] animate-pulse">${ssrInterpolate(siteHealth.value.alerts_last_24h.length)} alerts </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button></div><div style="${ssrRenderStyle(activeTab.value === "signals" ? null : { display: "none" })}"><h3 class="text-3xl font-black text-slate-900 tracking-tight">Signal Intelligence</h3><p class="text-slate-500 font-medium">Real-time attribution and behavioral forensics</p></div><div style="${ssrRenderStyle(activeTab.value === "performance" ? null : { display: "none" })}"><h3 class="text-3xl font-black text-slate-900 tracking-tight">Performance &amp; Health</h3><p class="text-slate-500 font-medium">Service delivery and behavioral bottlenecks</p></div></div><div class="flex items-center gap-3">`);
      if (activeTab.value === "signals") {
        _push(`<button class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export CSV </button>`);
      } else {
        _push(`<!---->`);
      }
      if (activeTab.value === "signals") {
        _push(`<div class="w-80 relative group"><div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><svg class="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><input type="text"${ssrRenderAttr("value", searchQuery.value)} placeholder="Find ID, URL, City..." class="w-full bg-white border-slate-200 rounded-[2rem] text-[11px] font-bold text-slate-700 py-4 pl-14 pr-6 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="space-y-8" style="${ssrRenderStyle(activeTab.value === "signals" ? null : { display: "none" })}"><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium-soft flex flex-wrap items-center gap-6"><div class="flex-1 min-w-[150px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Type</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "all") : ssrLooseEqual(filters.value.type, "all")) ? " selected" : ""}>🌐 All Traffic</option><option value="ads"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "ads") : ssrLooseEqual(filters.value.type, "ads")) ? " selected" : ""}>🎯 Ad Conversions</option><option value="organic"${ssrIncludeBooleanAttr(Array.isArray(filters.value.type) ? ssrLooseContain(filters.value.type, "organic") : ssrLooseEqual(filters.value.type, "organic")) ? " selected" : ""}>🌿 Organic Only</option></select></div><div class="flex-[2] min-w-[300px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Attribution Search (UTM/GCLID)</label><div class="relative group"><div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg class="w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><input${ssrRenderAttr("value", attributionSearch.value)} placeholder="Find by source, medium, campaign or GCLID..." class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all shadow-sm">`);
      if (attributionSearch.value || filters.value.gclid) {
        _push(`<button class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-rose-500"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex-1 min-w-[140px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Device</label><select class="w-full bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "all") : ssrLooseEqual(filters.value.device, "all")) ? " selected" : ""}>📱 All Devices</option><option value="Mobile"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Mobile") : ssrLooseEqual(filters.value.device, "Mobile")) ? " selected" : ""}>Mobile</option><option value="Desktop"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Desktop") : ssrLooseEqual(filters.value.device, "Desktop")) ? " selected" : ""}>Desktop</option><option value="Tablet"${ssrIncludeBooleanAttr(Array.isArray(filters.value.device) ? ssrLooseContain(filters.value.device, "Tablet") : ssrLooseEqual(filters.value.device, "Tablet")) ? " selected" : ""}>Tablet</option></select></div><div class="flex-[1.5] min-w-[300px] space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label><div class="flex items-center gap-2"><input type="date"${ssrRenderAttr("value", filters.value.start_date)} class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"><span class="text-slate-300">→</span><input type="date"${ssrRenderAttr("value", filters.value.end_date)} class="flex-1 bg-slate-50 border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 py-3 px-4 focus:ring-0"></div></div><div class="w-full h-px bg-slate-50 my-2"></div><div class="w-full flex flex-wrap gap-2 min-h-[32px]">`);
      if (!filters.value.utm_source && !filters.value.utm_medium && !filters.value.utm_campaign && !filters.value.gclid) {
        _push(`<div class="text-[9px] text-slate-300 font-bold uppercase py-2">No active attribution filters</div>`);
      } else {
        _push(`<!---->`);
      }
      if (filters.value.utm_source) {
        _push(`<div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full"><span class="text-[9px] font-black text-slate-400 uppercase">Source:</span><span class="text-[10px] font-black text-indigo-600 uppercase">${ssrInterpolate(filters.value.utm_source)}</span><button class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (filters.value.utm_medium) {
        _push(`<div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full"><span class="text-[9px] font-black text-slate-400 uppercase">Medium:</span><span class="text-[10px] font-black text-indigo-600 uppercase">${ssrInterpolate(filters.value.utm_medium)}</span><button class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (filters.value.utm_campaign) {
        _push(`<div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full"><span class="text-[9px] font-black text-slate-400 uppercase">Campaign:</span><span class="text-[10px] font-black text-indigo-600 uppercase">${ssrInterpolate(filters.value.utm_campaign)}</span><button class="ml-1 w-4 h-4 rounded-full bg-indigo-100 hover:bg-rose-100 flex items-center justify-center text-indigo-400 hover:text-rose-500 transition-colors"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (filters.value.gclid) {
        _push(`<div class="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-amber-50 border border-amber-100 rounded-full"><span class="text-[9px] font-black text-slate-400 uppercase">GCLID:</span><span class="text-[10px] font-black text-amber-700 uppercase">Active</span><button class="ml-1 w-4 h-4 rounded-full bg-amber-100 hover:bg-rose-100 flex items-center justify-center text-amber-500 hover:text-rose-500 transition-colors"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="ml-auto flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" for="bot-toggle">Exclude Bots</label><button id="bot-toggle" class="${ssrRenderClass([filters.value.exclude_bots ? "bg-indigo-600" : "bg-slate-200", "w-10 h-5 rounded-full transition-all relative"])}"><div class="${ssrRenderClass([{ "translate-x-5": filters.value.exclude_bots }, "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"])}"></div></button></div></div></div></div><div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-left border-collapse min-w-[1000px]"><thead><tr class="bg-slate-50/50"><th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Visitor Journey</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Engagement</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Device</th><th class="py-10 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th><th class="py-10 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Attribution</th></tr></thead><tbody class="divide-y divide-slate-50"><!--[-->`);
      ssrRenderList(logResponse.value.data, (event) => {
        _push(`<tr class="group hover:bg-slate-50 transition-all cursor-pointer"><td class="py-8 px-10"><div class="flex items-center gap-5"><div class="w-12 h-12 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div><div><p class="text-xs font-black text-slate-900 flex items-center gap-2"> ID: ${ssrInterpolate(event.session_id ? event.session_id.substring(0, 10) : "—")} `);
        if (event.gclid) {
          _push(`<span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p><p class="text-[9px] text-slate-400 font-black uppercase tracking-tight mt-1">${ssrInterpolate(new Date(event.created_at).toLocaleTimeString())} · ${ssrInterpolate(event.created_at?.split("T")[0])}</p></div></div></td><td class="py-8 px-6"><div class="flex items-center gap-5"><div><p class="text-xs font-black text-slate-900 flex items-center gap-2">${ssrInterpolate(event.duration_seconds)}s `);
        if (event.metadata?.is_engaged) {
          _push(`<span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Engaged Session"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p><p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Dwell</p></div><div class="w-px h-8 bg-slate-100"></div><div><p class="${ssrRenderClass([event.click_count > 3 ? "text-emerald-600" : "text-slate-900", "text-xs font-black tracking-tighter"])}">+${ssrInterpolate(event.click_count)}</p><p class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Clicks</p></div></div></td><td class="py-8 px-6"><div><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(event.browser)} / ${ssrInterpolate(event.platform)}</p><p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">${ssrInterpolate(event.device_type)} · ${ssrInterpolate(event.screen_resolution)}</p></div></td><td class="py-8 px-6"><div class="flex items-center gap-3"><span class="text-xl">${ssrInterpolate(event.country_code === "US" ? "🇺🇸" : event.country_code === "KE" ? "🇰🇪" : "🌍")}</span><div><p class="text-[10px] font-black text-slate-800 uppercase">${ssrInterpolate(event.city || "Unknown")}</p><p class="text-[9px] text-slate-400 font-black uppercase">${ssrInterpolate(event.country_code)}</p></div></div></td><td class="py-8 px-10 text-right"><div class="flex flex-col items-end gap-1.5">`);
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
      _push(`</div></div><div class="space-y-12 pb-24" style="${ssrRenderStyle(activeTab.value === "performance" ? null : { display: "none" })}"><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium flex flex-col justify-between overflow-hidden relative group"><div class="z-10"><p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Alerts (24h)</p><h4 class="${ssrRenderClass([siteHealth.value?.alerts_last_24h?.length > 0 ? "text-rose-500" : "text-emerald-500", "text-4xl font-black"])}">${ssrInterpolate(siteHealth.value?.alerts_last_24h?.length || 0)}</h4></div><div class="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 group-hover:bg-rose-50 group-hover:scale-110 transition-all blur-3xl rounded-full"></div><p class="text-[10px] font-medium text-slate-500 mt-4 leading-relaxed z-10"> Critical issues detected across your tracked properties in the last 24 hours. </p></div><div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium"><p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Error Distribution</p><div class="space-y-4"><!--[-->`);
      ssrRenderList(siteHealth.value?.error_type_breakdown, (err) => {
        _push(`<div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-600 uppercase">${ssrInterpolate(err.type.replace("_", " "))}</span><div class="flex-1 mx-4 h-1.5 bg-slate-50 rounded-full overflow-hidden"><div class="h-full bg-indigo-500" style="${ssrRenderStyle({ width: siteHealth.value?.error_type_breakdown?.[0]?.count && err.count ? Math.min(100, err.count / siteHealth.value.error_type_breakdown[0].count * 100) + "%" : "0%" })}"></div></div><span class="text-[10px] font-black text-slate-900">${ssrInterpolate(err.count)}</span></div>`);
      });
      _push(`<!--]-->`);
      if (!siteHealth.value?.error_type_breakdown?.length) {
        _push(`<div class="text-center py-4 text-[10px] font-black text-slate-300 uppercase italic">No errors logged</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group"><div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700"></div><p class="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1">Performance Baseline</p><h4 class="text-4xl font-black text-white">${ssrInterpolate(siteHealth.value?.slow_pages?.[0]?.avg_load_ms ? (siteHealth.value.slow_pages[0].avg_load_ms / 1e3).toFixed(1) + "s" : "—")}</h4><p class="text-[10px] font-black text-indigo-200 mt-4 uppercase tracking-tighter">Slowest Peak Page Load</p></div></div><div class="bg-white shadow-premium rounded-[3.5rem] border border-slate-100/50 overflow-hidden"><div class="p-10 border-b border-slate-50 flex items-center justify-between"><h4 class="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-amber-400"></span> Performance Bottlenecks </h4></div><div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="bg-slate-50/50"><th class="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Target URL</th><th class="py-8 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Load</th><th class="py-8 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Incidents</th><th class="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Last Peak</th></tr></thead><tbody class="divide-y divide-slate-50"><!--[-->`);
      ssrRenderList(siteHealth.value?.slow_pages, (page) => {
        _push(`<tr class="hover:bg-slate-50 transition-all group cursor-pointer"><td class="py-6 px-10"><p class="text-xs font-black text-slate-900 truncate max-w-md">${ssrInterpolate(page.url)}</p></td><td class="py-6 px-6 text-center"><span class="text-xs font-black text-rose-500">${ssrInterpolate((page.avg_load_ms / 1e3).toFixed(2))}s</span></td><td class="py-6 px-6 text-center"><span class="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">${ssrInterpolate(page.count)}</span></td><td class="py-6 px-10 text-right"><span class="text-[10px] font-black text-slate-400">${ssrInterpolate(fmt(page.last_seen))}</span></td></tr>`);
      });
      _push(`<!--]-->`);
      if (!siteHealth.value?.slow_pages?.length) {
        _push(`<tr><td colspan="4" class="py-20 text-center text-[11px] font-black text-slate-300 uppercase italic">Great news! No slow page loads detected (&gt;3s).</td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div></div>`);
      if (siteHealth.value?.alerts_last_24h?.length) {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><!--[-->`);
        ssrRenderList(siteHealth.value.alerts_last_24h, (alert, idx) => {
          _push(`<div class="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-start gap-6 relative group overflow-hidden"><div class="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div><div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"></path></svg></div><div class="flex-1 min-w-0"><p class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">${ssrInterpolate(alert.error_type.replace("_", " "))} Alert</p><p class="text-sm font-black text-slate-900 truncate"${ssrRenderAttr("title", alert.url)}>${ssrInterpolate(alert.url)}</p><p class="text-[10px] font-bold text-slate-500 mt-2">${ssrInterpolate(alert.count)} occurrences in the last 24 hours.</p></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (selectedSession.value) {
        _push(`<div class="fixed inset-0 z-[60] flex items-center justify-center p-6 md:p-12"><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"></div><div class="relative w-full max-w-6xl bg-white/80 backdrop-blur-3xl rounded-[4rem] shadow-premium-modal overflow-hidden flex flex-col max-h-[95vh] border border-white/40"><div class="p-14 border-b border-slate-100/50 flex items-center justify-between bg-white/40"><div><div class="flex items-center gap-5"><h3 class="text-4xl font-black text-slate-900 tracking-tight">Session Journey</h3><div class="flex items-center gap-3"><button class="group flex items-center gap-3 px-5 py-2 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">${ssrInterpolate(selectedSession.value?.session_id?.substring(0, 12) || "ANONYMOUS")}... <svg class="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button>`);
        if (sessionIsLead.value) {
          _push(`<span class="px-4 py-2 bg-amber-500 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-lg flex items-center gap-2"> ✨ Likely Lead </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><p class="text-slate-400 font-bold mt-3 text-xs uppercase tracking-widest">Digital attribution verification &amp; step-by-step signals.</p></div><div class="flex items-center gap-4"><button class="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-premium-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1"></path></svg> Copy full Journey </button><button class="w-16 h-16 bg-white/40 hover:bg-white text-slate-400 rounded-3xl transition-all flex items-center justify-center active:scale-90 border border-white/40 shadow-sm"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div><div class="flex-1 overflow-y-auto p-14 bg-white/20 no-scrollbar"><div class="grid grid-cols-1 lg:grid-cols-12 gap-16"><div class="lg:col-span-5 space-y-12"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4"><span class="w-10 h-0.5 bg-indigo-600"></span>Step-by-Step Visualization </h4><div class="space-y-10 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100"><!--[-->`);
        ssrRenderList(sessionTimeline.value, (entry, idx) => {
          _push(`<div class="relative pl-14 group"><div class="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 group-hover:border-indigo-600 rounded-2xl flex items-center justify-center z-10 transition-all shadow-sm group-hover:shadow-indigo-100 group-hover:-translate-y-0.5"><span class="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">${ssrInterpolate(idx + 1)}</span></div><div class="space-y-3"><div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-4 transition-all group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-premium-sm relative overflow-auto"><div class="flex gap-1.5 px-1.5 opacity-40 group-hover:opacity-100 transition-opacity"><div class="w-2 h-2 rounded-full bg-rose-400"></div><div class="w-2 h-2 rounded-full bg-amber-400"></div><div class="w-2 h-2 rounded-full bg-emerald-400"></div></div><div class="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 flex items-center justify-between group/bar overflow-x-auto"><div class="flex items-center gap-2 overflow-hidden"><svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0014 3c1.259 0 2.455.232 3.559.651m.517 1.352A9.993 9.993 0 0115.357 15l-.43.515"></path></svg><span class="text-[9px] font-bold text-slate-500 truncate lowercase">${ssrInterpolate(entry.page_url)}</span></div><button class="text-slate-300 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg></button></div></div><div class="flex items-center gap-4 px-2"><span class="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">${ssrInterpolate(new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span><div class="h-1 w-1 rounded-full bg-slate-200"></div><span class="${ssrRenderClass([{ "bg-orange-50 text-orange-600": entry.duration_seconds >= 60 }, "px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[6px] font-black rounded flex items-center gap-1.5"])}">${ssrInterpolate(entry.duration_seconds)}s Engagement `);
          if (entry.duration_seconds >= 60) {
            _push(`<span>🔥</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</span>`);
          if (entry.click_count > 0) {
            _push(`<span class="${ssrRenderClass([{ "text-indigo-600": entry.click_count >= 3 }, "flex items-center gap-1.5 text-emerald-600 text-[5px] font-black tracking-widest"])}"><span class="${ssrRenderClass([entry.click_count >= 3 ? "bg-indigo-500" : "bg-emerald-500", "w-1.5 h-1.5 rounded-full animate-pulse"])}"></span> ${ssrInterpolate(entry.click_count)} Interactions `);
            if (entry.click_count >= 3) {
              _push(`<span>💡</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div></div><div class="lg:col-span-7 space-y-12"><div class="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 relative overflow-hidden"><h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Engagement Peak Analysis</h4><div class="h-64">`);
        _push(ssrRenderComponent(unref(Line), {
          data: sessionChartData.value,
          options: modalChartOptions
        }, null, _parent));
        _push(`</div></div><div class="grid grid-cols-2 gap-8"><div class="space-y-4"><h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Traffic Origin</h5><div class="space-y-3"><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Source</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.utm_source || "DIRECT")}</p></div><div class="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl"><p class="text-[9px] font-black text-indigo-400 uppercase mb-1">Campaign ID</p><p class="text-xs font-black text-indigo-700 uppercase">${ssrInterpolate(selectedSession.value.google_campaign_id || "N/A")}</p></div></div></div><div class="space-y-4"><h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Spec</h5><div class="space-y-3"><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Tech Stack</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.browser)} / ${ssrInterpolate(selectedSession.value.platform)}</p></div><div class="p-5 bg-white border border-slate-100 rounded-3xl"><p class="text-[9px] font-black text-slate-400 uppercase mb-1">Canvas</p><p class="text-xs font-black text-slate-800 uppercase">${ssrInterpolate(selectedSession.value.screen_resolution)}</p></div></div></div></div><div class="p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 backdrop-blur-md"><p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Google Ads Verification </p>`);
        if (selectedSession.value.gclid) {
          _push(`<p class="text-xs font-bold text-emerald-800 break-all leading-relaxed"> Verified Google Ads lead with GCLID: <span class="font-black bg-emerald-100/50 px-1.5 py-0.5 rounded-md">${ssrInterpolate(selectedSession.value.gclid)}</span></p>`);
        } else {
          _push(`<p class="text-xs font-bold text-slate-500 leading-relaxed italic"> Organic attribution signal. No external click ID detected. </p>`);
        }
        _push(`</div>`);
        if (sessionIsLead.value) {
          _push(`<div class="p-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group"><div class="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700"></div><div class="relative z-10"><div class="flex items-center justify-between mb-6"><h4 class="text-[10px] font-black text-amber-100 uppercase tracking-widest">Lead Qualification Report</h4><span class="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase">Confirmed Interest</span></div><p class="text-lg font-black tracking-tight mb-4">High Acquisition Potential Detected</p><div class="grid grid-cols-2 gap-4"><div class="p-4 bg-white/10 rounded-2xl"><p class="text-[9px] font-black text-amber-100 uppercase mb-1">Total Dwell</p><p class="text-lg font-black">${ssrInterpolate(sessionTimeline.value.reduce((s, x) => s + x.duration_seconds, 0))}s</p></div><div class="p-4 bg-white/10 rounded-2xl"><p class="text-[9px] font-black text-amber-100 uppercase mb-1">Max Dwell</p><p class="text-lg font-black">${ssrInterpolate(Math.max(...sessionTimeline.value.map((x) => x.duration_seconds)))}s</p></div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_sfc_main$1, {
        show: showRegenModal.value,
        title: "Regenerate Site Token?",
        message: "This action is irreversible. All current tracking scripts for this specific site will stop working until updated with the new token.",
        confirmText: "Regenerate",
        onClose: ($event) => showRegenModal.value = false,
        onConfirm: regenerateToken
      }, null, _parent));
      if (showNewSiteModal.value) {
        _push(`<div class="fixed inset-0 z-[75] flex items-center justify-center p-6"><div class="absolute inset-0 bg-slate-100/40 backdrop-blur-md"></div><div class="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-200"><h3 class="text-2xl font-black text-slate-900 mb-2">Add Tracking Site</h3><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Generate a unique key for another domain.</p><form class="space-y-6"><div class="space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Label</label><input${ssrRenderAttr("value", newSite.value.label)} required placeholder="e.g. Shopify Store, Landing Page..." class="w-full bg-slate-50 border-slate-100 rounded-xl text-xs font-bold py-4 px-5 focus:ring-0 focus:border-indigo-500"></div><div class="space-y-2"><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Allowed Domain (Optional)</label><input${ssrRenderAttr("value", newSite.value.allowed_domain)} placeholder="example.com" class="w-full bg-slate-50 border-slate-100 rounded-xl text-xs font-bold py-4 px-5 focus:ring-0 focus:border-indigo-500"><p class="text-[9px] text-slate-400 font-medium leading-relaxed italic mt-2">Recommended for security. Only hits from this domain will be accepted.</p></div><div class="flex items-center gap-4 pt-4"><button type="submit"${ssrIncludeBooleanAttr(isCreatingSite.value) ? " disabled" : ""} class="flex-1 bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50">${ssrInterpolate(isCreatingSite.value ? "Generating..." : "Create Site")}</button><button type="button" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button></div></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showHealthModal.value && healthModalSite.value) {
        _push(`<div class="fixed inset-0 z-[80] flex items-center justify-center p-6"><div class="absolute inset-0 bg-slate-100/50 backdrop-blur-2xl"></div><div class="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-premium-lg border border-slate-200 overflow-hidden"><div class="grid grid-cols-1 lg:grid-cols-12"><div class="lg:col-span-5 bg-slate-50 p-12 border-r border-slate-100"><div class="flex items-center gap-4 mb-8"><div class="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div><div><h3 class="text-2xl font-black text-slate-900 leading-tight">${ssrInterpolate(healthModalSite.value.label)}</h3><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Domain Identity Health</p></div></div><div class="space-y-8"><div><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Traffic Domain Pinning</label><div class="relative group/pin"><input${ssrRenderAttr("value", allowedDomainInput.value)} placeholder="e.g. site.com" class="w-full bg-white border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-0 focus:border-indigo-500 shadow-sm"><button class="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/pin:opacity-100 transition-opacity">Update</button></div><p class="text-[9px] text-slate-400 font-medium mt-2 leading-relaxed italic">Signals from domains not matching this pattern will be rejected (403).</p></div><div class="p-6 bg-white border border-slate-100 rounded-3xl space-y-4"><div class="flex items-center justify-between pb-4 border-b border-slate-50"><span class="text-[9px] font-black text-slate-400 uppercase">Verification ID</span><span class="text-[10px] font-mono font-bold text-slate-600 tracking-tighter">${ssrInterpolate(healthModalSite.value.ads_site_token.substring(0, 24))}...</span></div><div class="flex items-center justify-between"><span class="text-[9px] font-black text-slate-400 uppercase">Last Signal</span><span class="text-[10px] font-bold text-slate-900 uppercase">${ssrInterpolate(healthModalSite.value.last_hit_at ? new Date(healthModalSite.value.last_hit_at).toLocaleTimeString() : "No hits detected")}</span></div></div><button class="w-full py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors"> Regenerate Tracking token </button></div></div><div class="lg:col-span-7 p-12 relative overflow-hidden">`);
        if (!isListening.value && !lastHeardSignal.value) {
          _push(`<div class="h-full flex flex-col items-center justify-center text-center space-y-6"><div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl shadow-inner border border-slate-100"> 📡 </div><div class="max-w-xs"><h4 class="text-xl font-black text-slate-900">Live Connection Test</h4><p class="text-sm text-slate-400 font-medium mt-2">Open your website in another tab once the listener is active to verify real-time tracking.</p></div><button class="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0 transition-all"> Start Live Verification </button></div>`);
        } else if (isListening.value && !lastHeardSignal.value) {
          _push(`<div class="h-full flex flex-col items-center justify-center text-center space-y-8"><div class="relative w-32 h-32"><div class="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div><div class="absolute inset-4 bg-indigo-500/40 rounded-full animate-ping animation-delay-500"></div><div class="relative w-full h-full bg-white rounded-full flex items-center justify-center text-3xl shadow-premium border-2 border-indigo-500"> 👂 </div></div><div class="space-y-2"><h4 class="text-2xl font-black text-slate-900">Listening for signals...</h4><p class="text-sm text-indigo-500 font-bold uppercase tracking-widest animate-pulse">Waiting for hit from ${ssrInterpolate(healthModalSite.value.allowed_domain || "any domain")}</p></div><p class="text-[10px] text-slate-400 font-medium max-w-xs mt-4">Tip: Refresh your website or click a link to trigger a tracking event.</p><button class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel Test</button></div>`);
        } else if (lastHeardSignal.value) {
          _push(`<div class="h-full flex flex-col items-center justify-center text-center p-8"><div class="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl shadow-2xl shadow-emerald-200 mb-8 animate-bounce"> ✅ </div><h4 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Connection Success!</h4><p class="text-lg text-emerald-600 font-black uppercase tracking-tight mb-8">Signal Received via Secure Handshake</p><div class="w-full bg-slate-900 rounded-3xl p-8 text-left space-y-4 border border-white/5"><div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-500 uppercase">Device</span><span class="text-xs font-bold text-white">${ssrInterpolate(lastHeardSignal.value.browser)} / ${ssrInterpolate(lastHeardSignal.value.platform)}</span></div><div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-500 uppercase">Source Path</span><span class="text-xs font-bold text-indigo-300 truncate max-w-[200px]">${ssrInterpolate(lastHeardSignal.value.page_url)}</span></div><div class="flex items-center justify-between"><span class="text-[10px] font-black text-slate-500 uppercase">Attribution ID</span><span class="text-xs font-bold text-emerald-400">${ssrInterpolate(lastHeardSignal.value.google_campaign_id || "System Default")}</span></div>`);
          if (lastHeardSignal.value.metadata?.is_engaged || lastHeardSignal.value.duration_seconds >= 30) {
            _push(`<div class="flex items-center justify-between pt-2 border-t border-white/5"><span class="text-[10px] font-black text-slate-500 uppercase">Qualitative Status</span><span class="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded uppercase tracking-widest animate-pulse">Engaged Lead</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button class="mt-8 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Run Another Test</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><button class="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showSourceModal.value) {
        _push(`<div class="fixed inset-0 z-[90] flex items-center justify-center p-6 md:p-12"><div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"></div><div class="relative w-full max-w-5xl bg-[#1e293b] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"><div class="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40"><div><h3 class="text-2xl font-black text-white tracking-tight">Source Diagnostic</h3><p class="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">${ssrInterpolate(sourceData.value.url)}</p></div><div class="flex items-center gap-3"><div class="flex bg-slate-800 p-1 rounded-xl border border-white/5"><button class="${ssrRenderClass([sourceData.value.mode === "html" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white", "px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"])}"> Raw HTML </button><button class="${ssrRenderClass([sourceData.value.mode === "schema" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white", "px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"])}"> Injected Schema </button></div><button class="w-12 h-12 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl transition-all flex items-center justify-center border border-white/5"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div><div class="flex-1 overflow-auto p-0 bg-[#0f172a] selection:bg-indigo-500/30 custom-scrollbar-dark no-scrollbar">`);
        if (sourceLines.value.length > 0 && sourceLines.value[0] !== "") {
          _push(`<div class="min-w-full inline-block py-6"><table class="w-full text-left border-collapse font-mono text-[11px] leading-relaxed"><!--[-->`);
          ssrRenderList(sourceLines.value, (line, idx) => {
            _push(`<tr class="group hover:bg-white/5 transition-colors"><td class="select-none py-0.5 px-4 text-right align-top w-12 text-slate-600 border-r border-white/5 bg-slate-900/40 sticky left-0 z-10">${ssrInterpolate(idx + 1)}</td><td class="py-0.5 px-6 whitespace-pre text-slate-300">`);
            if (sourceData.value.mode === "html") {
              _push(`<span>${highlightHtml(line) ?? ""}</span>`);
            } else {
              _push(`<span>${highlightJson(line) ?? ""}</span>`);
            }
            _push(`</td></tr>`);
          });
          _push(`<!--]--></table></div>`);
        } else {
          _push(`<div class="h-96 flex flex-col items-center justify-center text-center space-y-6"><div class="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner border border-white/5">${ssrInterpolate(sourceData.value.mode === "html" ? "📄" : "🔍")}</div><div><p class="text-white font-black text-xs uppercase tracking-widest mb-1">No Content Detected</p><p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Waiting for source transmission...</p></div></div>`);
        }
        _push(`</div><div class="p-8 border-t border-white/5 bg-slate-900/40 flex items-center justify-between"><span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">MetaPilot Diagnostic Kernel v1.0</span><button class="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2"></path></svg> Copy ${ssrInterpolate(sourceData.value.mode === "html" ? "HTML" : "Schema")}</button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Partials/DevelopersTab.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
