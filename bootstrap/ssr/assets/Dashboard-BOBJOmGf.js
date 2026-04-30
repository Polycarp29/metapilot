import { ref, computed, watch, onMounted, onUnmounted, unref, withCtx, createTextVNode, openBlock, createBlock, createVNode, toDisplayString, createCommentVNode, withDirectives, Fragment, renderList, vModelSelect, vModelText, Transition, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass, ssrRenderStyle } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import { Head, Link } from "@inertiajs/vue3";
import axios from "axios";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement, BarElement } from "chart.js";
import { Line, Doughnut } from "vue-chartjs";
import PredictionsTab from "./PredictionsTab-B6PRzrRH.js";
import _sfc_main$2 from "./DevelopersTab-BRLhSSsj.js";
import WebAnalysisTab from "./WebAnalysisTab-Buk9f0L4.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
import "./AdPredictionsCard-MdOBVO9n.js";
import "./ConfirmationModal-EXlnTAwk.js";
const itemsPerPage = 10;
const _sfc_main = {
  __name: "Dashboard",
  __ssrInlineRender: true,
  props: {
    properties: Array,
    organization: Object
  },
  setup(__props) {
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler,
      ArcElement,
      BarElement
    );
    const props = __props;
    const selectedPropertyId = ref(localStorage.getItem("mp_dashboard_property_id") ? parseInt(localStorage.getItem("mp_dashboard_property_id")) : props.properties[0]?.id || null);
    const timeframe = ref(30);
    const customStartDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]);
    const customEndDate = ref(new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0]);
    const isCustomRange = ref(false);
    const isLoading = ref(true);
    const fetchingInsights = ref(false);
    const insightError = ref(false);
    const overview = ref(null);
    const trendData = ref(null);
    const forecastData = ref(null);
    const seoIntelligence = ref(null);
    const geoTab = ref("country");
    const geoSearch = ref("");
    const chartMetric = ref("users");
    const isAutoRefreshEnabled = ref(false);
    const autoRefreshInterval = ref(null);
    const lastRefetchTime = ref(null);
    const activeTab = ref(localStorage.getItem("mp_dashboard_active_tab") || "overview");
    const showSyncSuccessToast = ref(false);
    const isReconnecting = ref(false);
    const syncPollingInterval = ref(null);
    const selectedProperty = computed(() => {
      return props.properties.find((p) => p.id === selectedPropertyId.value);
    });
    const isSyncing = computed(() => {
      return selectedProperty.value?.sync_status === "syncing";
    });
    const opportunityKeywords = computed(() => {
      if (!overview.value?.top_queries) return [];
      return overview.value.top_queries.filter((q) => q.impressions > 100 && q.ctr < 0.02).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
    });
    const searchChartData = computed(() => {
      if (!trendData.value) return { labels: [], datasets: [] };
      const labels = trendData.value.map((d) => new Date(d.snapshot_date).toLocaleDateString(void 0, { month: "short", day: "numeric" }));
      return {
        labels,
        datasets: [
          {
            label: "Clicks",
            data: trendData.value.map((d) => d.clicks),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            yAxisID: "y"
          },
          {
            label: "Impressions",
            data: trendData.value.map((d) => d.impressions),
            borderColor: "#6366f1",
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            yAxisID: "y1"
          }
        ]
      };
    });
    const gscChartOptions = computed(() => {
      const opts = JSON.parse(JSON.stringify(chartOptions.value));
      opts.scales.y1.display = true;
      return opts;
    });
    const filteredGeoData = computed(() => {
      if (!overview.value) return [];
      const data = geoTab.value === "country" ? overview.value.by_country : overview.value.by_city;
      if (!data) return [];
      if (!geoSearch.value) return data.slice(0, 10);
      const query = geoSearch.value.toLowerCase();
      return data.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 10);
    });
    const geoChartData = computed(() => {
      const data = filteredGeoData.value.slice(0, 5);
      return {
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.activeUsers || d.value || 0),
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"],
          borderWidth: 0
        }]
      };
    });
    const acquisitionChartData = computed(() => {
      const data = (overview.value?.by_first_source || []).slice(0, 5);
      return {
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.activeUsers || 0),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
          borderWidth: 0
        }]
      };
    });
    const audienceChartData = computed(() => {
      const data = (overview.value?.by_audience || []).slice(0, 5);
      return {
        labels: data.map((d) => d.name),
        datasets: [{
          data: data.map((d) => d.activeUsers || 0),
          backgroundColor: ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#8b5cf6"],
          borderWidth: 0
        }]
      };
    });
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#1e293b", padding: 12, cornerRadius: 8 }
      },
      cutout: "70%"
    };
    const chartData = ref({
      labels: [],
      datasets: []
    });
    const chartOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 10, weight: "bold" }
          }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "#1e293b",
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: { color: "#64748b" }
        },
        y1: {
          beginAtZero: true,
          position: "right",
          display: false,
          // Only for search
          grid: { drawOnChartArea: false },
          ticks: { color: "#10b981" }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#64748b" }
        }
      }
    });
    const insights = ref(null);
    const campaigns = ref([]);
    const fetchData = async (forceRefresh = false) => {
      if (!selectedPropertyId.value) return;
      isLoading.value = true;
      overview.value = null;
      insights.value = null;
      insightError.value = false;
      try {
        const params = timeframe.value === "custom" ? { start_date: customStartDate.value, end_date: customEndDate.value } : { days: timeframe.value };
        if (forceRefresh) {
          params.refresh = 1;
        }
        const [overviewRes, trendsRes, acquisitionRes, forecastRes, intelligenceRes] = await Promise.all([
          axios.get(route("api.analytics.overview", { property: selectedPropertyId.value }), { params }),
          axios.get(route("api.analytics.trends", { property: selectedPropertyId.value }), { params }),
          axios.get(route("api.analytics.acquisition", { property: selectedPropertyId.value }), { params }),
          axios.get(route("api.analytics.forecast", { property: selectedPropertyId.value }), { params }),
          axios.get(route("api.analytics.seo-intelligence", { property: selectedPropertyId.value }))
        ]);
        overview.value = overviewRes.data;
        trendData.value = trendsRes.data;
        campaigns.value = acquisitionRes.data;
        forecastData.value = forecastRes.data;
        seoIntelligence.value = intelligenceRes.data;
        lastRefetchTime.value = /* @__PURE__ */ new Date();
        updateChart();
        fetchInsights(params);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        isLoading.value = false;
      }
    };
    const handleForceReconnect = () => {
      isReconnecting.value = true;
      const currentUrl = window.location.href;
      window.location.href = route("auth.google", {
        intent: "connect",
        redirect_to: currentUrl
      });
    };
    const fetchInsights = async (params) => {
      fetchingInsights.value = true;
      insightError.value = false;
      console.log("[AI] Starting insight fetch...", params);
      try {
        const insightsRes = await axios.get(route("api.analytics.insights", { property: selectedPropertyId.value, ...params }));
        insights.value = insightsRes.data;
        console.log("[AI] Insight fetch complete:", insights.value ? "Success" : "No data");
      } catch (error) {
        console.error("[AI] Insight fetch failed:", error);
        insightError.value = true;
      } finally {
        fetchingInsights.value = false;
      }
    };
    const refreshInsights = async () => {
      const params = timeframe.value === "custom" ? { start_date: customStartDate.value, end_date: customEndDate.value, refresh: 1 } : { days: timeframe.value, refresh: 1 };
      await fetchInsights(params);
    };
    const updateChart = () => {
      if (!trendData.value) return;
      const labels = trendData.value.map((d) => new Date(d.snapshot_date).toLocaleDateString(void 0, { month: "short", day: "numeric" }));
      if (chartMetric.value === "users") {
        chartOptions.value.scales.y1.display = false;
        chartData.value = {
          labels,
          datasets: [
            {
              label: "Total Users",
              data: trendData.value.map((d) => d.users || 0),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6
            }
          ]
        };
      } else {
        chartOptions.value.scales.y1.display = true;
        chartData.value = {
          labels,
          datasets: [
            {
              label: "Clicks",
              data: trendData.value.map((d) => d.clicks),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              yAxisID: "y"
            },
            {
              label: "Impressions",
              data: trendData.value.map((d) => d.impressions),
              borderColor: "#6366f1",
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
              yAxisID: "y1"
            }
          ]
        };
      }
    };
    const formatDuration = (seconds) => {
      if (!seconds) return "0s";
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };
    const formatLastUpdated = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    const toggleAutoRefresh = () => {
      isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;
      if (isAutoRefreshEnabled.value) {
        autoRefreshInterval.value = setInterval(() => {
          fetchData(true);
        }, 15 * 1e3);
      } else {
        if (autoRefreshInterval.value) {
          clearInterval(autoRefreshInterval.value);
          autoRefreshInterval.value = null;
        }
      }
    };
    const startSyncPolling = () => {
      if (syncPollingInterval.value) return;
      syncPollingInterval.value = setInterval(() => {
        router.reload({
          only: ["properties"],
          preserveScroll: true,
          preserveState: true,
          onSuccess: () => {
            if (selectedProperty.value?.sync_status === "completed") {
              stopSyncPolling();
              showSyncSuccessToast.value = true;
              setTimeout(() => showSyncSuccessToast.value = false, 8e3);
              fetchData();
            } else if (selectedProperty.value?.sync_status === "failed") {
              stopSyncPolling();
            }
          }
        });
      }, 5e3);
    };
    const stopSyncPolling = () => {
      if (syncPollingInterval.value) {
        clearInterval(syncPollingInterval.value);
        syncPollingInterval.value = null;
      }
    };
    watch(isSyncing, (syncing) => {
      if (syncing) {
        startSyncPolling();
      } else {
        stopSyncPolling();
      }
    }, { immediate: true });
    const getSEOStatus = (rate, deviceType = "desktop") => {
      const percentage = (rate || 0) * 100;
      const isMobile = deviceType?.toLowerCase() === "mobile" || deviceType?.toLowerCase() === "tablet";
      const thresholds = isMobile ? { optimum: 55, fair: 75 } : { optimum: 45, fair: 65 };
      if (percentage < thresholds.optimum) {
        return {
          label: "Optimum",
          class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          icon: "✨",
          description: "Excellent engagement. Users are finding exactly what they need."
        };
      }
      if (percentage < thresholds.fair) {
        return {
          label: "Fair",
          class: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          icon: "⚖️",
          description: "Average performance. Consider optimizing content or CTA placement."
        };
      }
      return {
        label: "Poor",
        class: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        icon: "🚩",
        description: "High bounce rate. Page may have loading issues or low relevance."
      };
    };
    const deviceStats = computed(() => {
      if (!overview.value?.by_device) return null;
      const mobile = overview.value.by_device.find((d) => d.name.toLowerCase() === "mobile");
      const desktop = overview.value.by_device.find((d) => d.name.toLowerCase() === "desktop");
      return { mobile, desktop };
    });
    onMounted(() => {
      if (selectedPropertyId.value) {
        fetchData();
      }
    });
    watch(() => props.properties, (newProps) => {
      if (newProps.length > 0 && !selectedPropertyId.value) {
        selectedPropertyId.value = newProps[0].id;
      }
    }, { immediate: true });
    watch(timeframe, (newVal) => {
      isCustomRange.value = newVal === "custom";
    });
    watch(chartMetric, () => {
      updateChart();
    });
    const getTrendInfo = (value) => {
      if (value === 0 || value === null || isNaN(value)) return null;
      const isPositive = value > 0;
      return {
        isPositive,
        label: `${Math.abs(value).toFixed(1)}%`,
        class: isPositive ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border-rose-500/20",
        icon: isPositive ? "↑" : "↓"
      };
    };
    const trajectoryAlert = computed(() => {
      if (!overview.value?.deltas) return null;
      const userDelta = overview.value.deltas.total_users;
      if (userDelta < -10) {
        return {
          type: "warning",
          title: "Traffic Drop Detected",
          message: `You've lost ${Math.abs(userDelta).toFixed(1)}% of your traffic compared to the previous period.`,
          icon: "📉"
        };
      }
      if (userDelta > 15) {
        return {
          type: "success",
          title: "Strong Growth Spurt",
          message: `Your traffic is up by ${userDelta.toFixed(1)}%! Keep up the momentum.`,
          icon: "📈"
        };
      }
      return null;
    });
    const querySearch = ref("");
    const pageSearch = ref("");
    const queryTrendFilter = ref("all");
    const pageTrendFilter = ref("all");
    const queryPage = ref(1);
    const pagePage = ref(1);
    const pagedQueries = computed(() => {
      if (!overview.value?.top_queries) return [];
      let filtered = overview.value.top_queries;
      if (querySearch.value) {
        const s = querySearch.value.toLowerCase();
        filtered = filtered.filter((q) => q.name.toLowerCase().includes(s));
      }
      if (queryTrendFilter.value === "growing") {
        filtered = filtered.filter((q) => q.delta_clicks > 0);
      } else if (queryTrendFilter.value === "declining") {
        filtered = filtered.filter((q) => q.delta_clicks < 0);
      }
      const start = (queryPage.value - 1) * itemsPerPage;
      return filtered.slice(start, start + itemsPerPage);
    });
    const queryTotalPages = computed(() => {
      if (!overview.value?.top_queries) return 0;
      let filtered = overview.value.top_queries;
      if (querySearch.value) {
        const s = querySearch.value.toLowerCase();
        filtered = filtered.filter((q) => q.name.toLowerCase().includes(s));
      }
      if (queryTrendFilter.value === "growing") {
        filtered = filtered.filter((q) => q.delta_clicks > 0);
      } else if (queryTrendFilter.value === "declining") {
        filtered = filtered.filter((q) => q.delta_clicks < 0);
      }
      return Math.ceil(filtered.length / itemsPerPage);
    });
    const pagedPagesGsc = computed(() => {
      if (!overview.value?.top_pages_gsc) return [];
      let filtered = overview.value.top_pages_gsc;
      if (pageSearch.value) {
        const s = pageSearch.value.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s));
      }
      if (pageTrendFilter.value === "growing") {
        filtered = filtered.filter((p) => p.delta_clicks > 0);
      } else if (pageTrendFilter.value === "declining") {
        filtered = filtered.filter((p) => p.delta_clicks < 0);
      }
      const start = (pagePage.value - 1) * itemsPerPage;
      return filtered.slice(start, start + itemsPerPage);
    });
    const buildMultiLineData = (data, dimensionKey, metricKey, topN = 5) => {
      if (!data || data.length === 0) return { labels: [], datasets: [] };
      const labels = data.map((d) => new Date(d.snapshot_date).toLocaleDateString(void 0, { month: "short", day: "numeric" }));
      const totals = {};
      data.forEach((day) => {
        const items = day[dimensionKey] || [];
        items.forEach((item) => {
          const name = item.name || item.query || item.page || item.event_name || item.pageTitle || "unknown";
          totals[name] = (totals[name] || 0) + (item[metricKey] || item.activeUsers || item.eventCount || 0);
        });
      });
      const topItems = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, topN).map((entry) => entry[0]);
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#f43f5e"];
      const datasets = topItems.map((name, index) => {
        const seriesData = data.map((day) => {
          const items = day[dimensionKey] || [];
          const found = items.find((i) => (i.name || i.query || i.page || i.event_name || i.pageTitle) === name);
          return found ? found[metricKey] || found.activeUsers || found.eventCount || 0 : 0;
        });
        return {
          label: name,
          data: seriesData,
          borderColor: colors[index % colors.length],
          backgroundColor: `${colors[index % colors.length]}1A`,
          // 10% opacity
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true
        };
      });
      return { labels, datasets };
    };
    const queriesChartData = computed(() => buildMultiLineData(trendData.value, "top_queries", "clicks"));
    const pagesGscChartData = computed(() => buildMultiLineData(trendData.value, "top_pages", "clicks"));
    const pageTitlesChartData = computed(() => buildMultiLineData(trendData.value, "by_page_title", "activeUsers"));
    const screensChartData = computed(() => buildMultiLineData(trendData.value, "by_screen", "activeUsers"));
    const eventsChartData = computed(() => buildMultiLineData(trendData.value, "by_event", "eventCount"));
    computed(() => {
      if (!overview.value?.top_pages_gsc) return 0;
      let filtered = overview.value.top_pages_gsc;
      if (pageSearch.value) {
        const s = pageSearch.value.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s));
      }
      if (pageTrendFilter.value === "growing") {
        filtered = filtered.filter((p) => p.delta_clicks > 0);
      } else if (pageTrendFilter.value === "declining") {
        filtered = filtered.filter((p) => p.delta_clicks < 0);
      }
      return Math.ceil(filtered.length / itemsPerPage);
    });
    watch([querySearch, queryTrendFilter], () => queryPage.value = 1);
    watch([pageSearch, pageTrendFilter], () => pagePage.value = 1);
    watch([selectedPropertyId, timeframe, customStartDate, customEndDate], () => {
      if (selectedPropertyId.value) {
        localStorage.setItem("mp_dashboard_property_id", selectedPropertyId.value);
      }
      fetchData();
      queryPage.value = 1;
      pagePage.value = 1;
    });
    watch(activeTab, (val) => {
      localStorage.setItem("mp_dashboard_active_tab", val);
    });
    onUnmounted(() => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
      }
      stopSyncPolling();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(Head), { title: "Analytics Dashboard" }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" data-v-3f602d42${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6" data-v-3f602d42${_scopeId}><div data-v-3f602d42${_scopeId}><h1 class="text-4xl font-black text-slate-900 tracking-tight" data-v-3f602d42${_scopeId}>Analytics Dashboard</h1><div class="flex items-center gap-3 mt-2" data-v-3f602d42${_scopeId}><p class="text-slate-500 font-medium" data-v-3f602d42${_scopeId}>Insights and performance tracking for ${ssrInterpolate(__props.organization.name)}</p>`);
            if (overview.value?.last_updated) {
              _push2(`<div class="flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 shadow-sm animate-in fade-in duration-500" data-v-3f602d42${_scopeId}><div class="w-1.5 h-1.5 rounded-full bg-slate-400" data-v-3f602d42${_scopeId}></div><span class="text-[10px] font-black text-slate-500 uppercase tracking-tight" data-v-3f602d42${_scopeId}>Updated: ${ssrInterpolate(formatLastUpdated(overview.value.last_updated))}</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-premium border border-slate-100" data-v-3f602d42${_scopeId}><select class="bg-transparent border-none focus:ring-0 font-bold text-slate-700 pr-10 cursor-pointer" data-v-3f602d42${_scopeId}><!--[-->`);
            ssrRenderList(__props.properties, (prop) => {
              _push2(`<option${ssrRenderAttr("value", prop.id)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(selectedPropertyId.value) ? ssrLooseContain(selectedPropertyId.value, prop.id) : ssrLooseEqual(selectedPropertyId.value, prop.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(prop.name)}</option>`);
            });
            _push2(`<!--]--></select><div class="w-px h-6 bg-slate-100" data-v-3f602d42${_scopeId}></div><select class="bg-transparent border-none focus:ring-0 font-bold text-blue-600 cursor-pointer pr-10 hover:text-blue-700 transition-colors" data-v-3f602d42${_scopeId}><option${ssrRenderAttr("value", 0)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 0) : ssrLooseEqual(timeframe.value, 0)) ? " selected" : ""}${_scopeId}>Today</option><option${ssrRenderAttr("value", 1)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 1) : ssrLooseEqual(timeframe.value, 1)) ? " selected" : ""}${_scopeId}>Yesterday</option><option${ssrRenderAttr("value", 7)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 7) : ssrLooseEqual(timeframe.value, 7)) ? " selected" : ""}${_scopeId}>Last 7 Days</option><option${ssrRenderAttr("value", 14)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 14) : ssrLooseEqual(timeframe.value, 14)) ? " selected" : ""}${_scopeId}>Last 14 Days</option><option${ssrRenderAttr("value", 28)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 28) : ssrLooseEqual(timeframe.value, 28)) ? " selected" : ""}${_scopeId}>Last 28 Days</option><option${ssrRenderAttr("value", 30)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 30) : ssrLooseEqual(timeframe.value, 30)) ? " selected" : ""}${_scopeId}>Last 30 Days</option><option${ssrRenderAttr("value", 90)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 90) : ssrLooseEqual(timeframe.value, 90)) ? " selected" : ""}${_scopeId}>Last 3 Months</option><option${ssrRenderAttr("value", 180)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 180) : ssrLooseEqual(timeframe.value, 180)) ? " selected" : ""}${_scopeId}>Last 6 Months</option><option${ssrRenderAttr("value", 365)} data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, 365) : ssrLooseEqual(timeframe.value, 365)) ? " selected" : ""}${_scopeId}>Last Year</option><option value="custom" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(timeframe.value) ? ssrLooseContain(timeframe.value, "custom") : ssrLooseEqual(timeframe.value, "custom")) ? " selected" : ""}${_scopeId}>Custom Range</option></select><div class="w-px h-6 bg-slate-100" data-v-3f602d42${_scopeId}></div><button class="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""} title="Refresh Data from API" data-v-3f602d42${_scopeId}><svg class="${ssrRenderClass([{ "animate-spin text-blue-500": isLoading.value }, "w-4 h-4 text-slate-400 group-hover:text-blue-500"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-3f602d42${_scopeId}></path></svg><span class="text-xs font-bold text-slate-500 group-hover:text-slate-700" data-v-3f602d42${_scopeId}>Refetch</span></button><div class="w-px h-6 bg-slate-100" data-v-3f602d42${_scopeId}></div><button class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group"${ssrRenderAttr("title", isAutoRefreshEnabled.value ? "Disable Auto-refresh" : "Enable Auto-refresh every 15m")} data-v-3f602d42${_scopeId}><div class="${ssrRenderClass([isAutoRefreshEnabled.value ? "bg-emerald-500 animate-pulse" : "bg-slate-300", "w-2 h-2 rounded-full"])}" data-v-3f602d42${_scopeId}></div><span class="${ssrRenderClass([isAutoRefreshEnabled.value ? "text-emerald-600" : "text-slate-500", "text-xs font-bold transition-colors"])}" data-v-3f602d42${_scopeId}>Auto</span></button></div>`);
            if (isSyncing.value) {
              _push2(`<div class="flex items-center gap-4 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 animate-in slide-in-from-right-4 duration-500" data-v-3f602d42${_scopeId}><div class="relative flex h-2.5 w-2.5" data-v-3f602d42${_scopeId}><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75" data-v-3f602d42${_scopeId}></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" data-v-3f602d42${_scopeId}></span></div><div class="flex flex-col" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black uppercase tracking-widest text-blue-100 leading-none" data-v-3f602d42${_scopeId}>Background Sync</span><span class="text-xs font-bold mt-0.5" data-v-3f602d42${_scopeId}>Updating property data...</span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (isCustomRange.value) {
              _push2(`<div class="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl shadow-premium border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300" data-v-3f602d42${_scopeId}><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-slate-400 uppercase tracking-wider" data-v-3f602d42${_scopeId}>From</span><input type="date"${ssrRenderAttr("value", customStartDate.value)} class="bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1" data-v-3f602d42${_scopeId}></div><div class="w-px h-4 bg-slate-100" data-v-3f602d42${_scopeId}></div><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-slate-400 uppercase tracking-wider" data-v-3f602d42${_scopeId}>To</span><input type="date"${ssrRenderAttr("value", customEndDate.value)} class="bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1" data-v-3f602d42${_scopeId}></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex items-center gap-2 border-b border-slate-100 px-2" data-v-3f602d42${_scopeId}><button class="${ssrRenderClass([activeTab.value === "overview" ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"])}" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" data-v-3f602d42${_scopeId}></path></svg> General Overview </button><button class="${ssrRenderClass([activeTab.value === "gsc" ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"])}" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg> Search Console </button><button class="${ssrRenderClass([activeTab.value === "predictions" ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"])}" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg> Predictions &amp; Insights </button><button class="${ssrRenderClass([activeTab.value === "developers" ? "text-indigo-600 border-indigo-600 bg-indigo-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"])}" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-3f602d42${_scopeId}></path></svg> Developers </button><button class="${ssrRenderClass([activeTab.value === "web-analysis" ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"])}" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-3f602d42${_scopeId}></path></svg> Web Analysis </button></div>`);
            if (trajectoryAlert.value) {
              _push2(`<div class="${ssrRenderClass([trajectoryAlert.value.type === "warning" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200", "p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 mb-2"])}" data-v-3f602d42${_scopeId}><div class="flex items-center gap-5" data-v-3f602d42${_scopeId}><div class="text-4xl" data-v-3f602d42${_scopeId}>${ssrInterpolate(trajectoryAlert.value.icon)}</div><div data-v-3f602d42${_scopeId}><h3 class="${ssrRenderClass([trajectoryAlert.value.type === "warning" ? "text-rose-900" : "text-emerald-900", "text-lg font-black"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(trajectoryAlert.value.title)}</h3><p class="${ssrRenderClass([trajectoryAlert.value.type === "warning" ? "text-rose-700" : "text-emerald-700", "font-medium text-sm"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(trajectoryAlert.value.message)}</p></div></div><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><span class="${ssrRenderClass([trajectoryAlert.value.type === "warning" ? "bg-rose-100/50 text-rose-600 border-rose-200" : "bg-emerald-100/50 text-emerald-600 border-emerald-200", "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border"])}" data-v-3f602d42${_scopeId}> Anomaly Detected </span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "overview") {
              _push2(`<div class="space-y-10 animate-in fade-in duration-500" data-v-3f602d42${_scopeId}>`);
              if (isLoading.value) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(8, (i) => {
                  _push2(`<div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><div class="skeleton h-3 w-20 rounded-full mb-2" data-v-3f602d42${_scopeId}></div><div class="skeleton h-2 w-32 rounded-full mb-4 opacity-50" data-v-3f602d42${_scopeId}></div><div class="skeleton h-10 w-24 rounded-xl mt-3" data-v-3f602d42${_scopeId}></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value?.google_token_invalid) {
                _push2(`<div class="mb-10 bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500" data-v-3f602d42${_scopeId}><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0" data-v-3f602d42${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h3 class="text-lg font-bold text-rose-800" data-v-3f602d42${_scopeId}>Google Connection Expired</h3><p class="text-rose-700 font-medium" data-v-3f602d42${_scopeId}>Your Google access token has expired or was revoked. Please reconnect to restore analytics.</p></div></div><button${ssrIncludeBooleanAttr(isReconnecting.value) ? " disabled" : ""} class="whitespace-nowrap px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2" data-v-3f602d42${_scopeId}>`);
                if (isReconnecting.value) {
                  _push2(`<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-3f602d42${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-3f602d42${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(` ${ssrInterpolate(isReconnecting.value ? "Connecting..." : "Reconnect Google")}</button></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value?.gsc_permission_error) {
                _push2(`<div class="mb-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500" data-v-3f602d42${_scopeId}><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0" data-v-3f602d42${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h3 class="text-lg font-bold text-amber-800" data-v-3f602d42${_scopeId}>Search Console Permission Denied</h3><p class="text-amber-700 font-medium" data-v-3f602d42${_scopeId}>Google returned a permission error for this site. Click below to re-authorize with full Search Console access.</p></div></div><button${ssrIncludeBooleanAttr(isReconnecting.value) ? " disabled" : ""} class="whitespace-nowrap px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2" data-v-3f602d42${_scopeId}>`);
                if (isReconnecting.value) {
                  _push2(`<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-3f602d42${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-3f602d42${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(` ${ssrInterpolate(isReconnecting.value ? "Connecting..." : "Re-authorize GSC")}</button></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value && overview.value.total_users > 0) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-v-3f602d42${_scopeId}><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-slate-500 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Total Users</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Active vs Total (GA4)</p></div>`);
                if (overview.value.deltas?.total_users) {
                  _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_users).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_users).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_users).label)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="flex items-baseline gap-2 mt-3" data-v-3f602d42${_scopeId}><h3 class="text-3xl font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate(overview.value.total_users || 0)}</h3><span class="text-xs font-bold text-slate-400" data-v-3f602d42${_scopeId}>/ ${ssrInterpolate(overview.value.total_users_all || 0)}</span></div></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-slate-500 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Conversions</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Key goal completions (GA4)</p></div>`);
                if (overview.value.deltas?.total_conversions) {
                  _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_conversions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_conversions).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_conversions).label)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><h3 class="text-3xl font-black text-blue-600 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(overview.value.total_conversions || 0)}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" data-v-3f602d42${_scopeId}>`);
                if (overview.value.gsc_permission_error) {
                  _push2(`<div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" data-v-3f602d42${_scopeId}>Permission Denied</span></div>`);
                } else if (overview.value.total_impressions === 0) {
                  _push2(`<div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4" data-v-3f602d42${_scopeId}><div class="flex flex-col items-center" data-v-3f602d42${_scopeId}><span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-pulse" data-v-3f602d42${_scopeId}>Syncing data...</span></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Impressions</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Times seen in Search (GSC)</p></div>`);
                if (overview.value.deltas?.total_impressions) {
                  _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_impressions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_impressions).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_impressions).label)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(overview.value.total_impressions?.toLocaleString() || 0)}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" data-v-3f602d42${_scopeId}>`);
                if (overview.value.gsc_permission_error) {
                  _push2(`<div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" data-v-3f602d42${_scopeId}>Permission Required</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Clicks</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Visits from Search (GSC)</p></div>`);
                if (overview.value.deltas?.total_clicks) {
                  _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_clicks).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_clicks).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_clicks).label)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(overview.value.total_clicks?.toLocaleString() || 0)}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" data-v-3f602d42${_scopeId}>`);
                if (overview.value.gsc_permission_error) {
                  _push2(`<div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" data-v-3f602d42${_scopeId}>Permission Required</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Avg. Position</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Mean rank in Search (GSC)</p></div>`);
                if (overview.value.deltas?.avg_position) {
                  _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.avg_position).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_position).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_position).label)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(overview.value.avg_position?.toFixed(1) || 0)}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" data-v-3f602d42${_scopeId}>`);
                if (overview.value.gsc_permission_error) {
                  _push2(`<div class="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4" data-v-3f602d42${_scopeId}><span class="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" data-v-3f602d42${_scopeId}>Permission Required</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>CTR</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Click-through rate (GSC)</p></div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate((overview.value.avg_ctr * 100).toFixed(2))}%</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-slate-500 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Bounce Rate</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Single-page rate (GA4)</p></div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate((overview.value.avg_bounce_rate * 100).toFixed(1))}%</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-slate-500 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Avg. Duration</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Time per visit (GA4)</p></div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(formatDuration(overview.value.avg_duration))}</h3></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value && overview.value.total_users > 0 && deviceStats.value) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700" data-v-3f602d42${_scopeId}><div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group" data-v-3f602d42${_scopeId}><div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]" data-v-3f602d42${_scopeId}></div><div class="relative z-10" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-6" data-v-3f602d42${_scopeId}><div class="flex items-center gap-3" data-v-3f602d42${_scopeId}><div class="p-2 bg-blue-500/20 rounded-lg text-blue-400" data-v-3f602d42${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" data-v-3f602d42${_scopeId}></path></svg></div><h3 class="text-sm font-black text-white uppercase tracking-widest" data-v-3f602d42${_scopeId}>Mobile Bounce Health</h3></div>`);
                if (deviceStats.value.mobile) {
                  _push2(`<span class="${ssrRenderClass([getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").class, "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
                if (deviceStats.value.mobile) {
                  _push2(`<div class="flex items-end gap-3" data-v-3f602d42${_scopeId}><h4 class="text-4xl font-black text-white" data-v-3f602d42${_scopeId}>${ssrInterpolate((deviceStats.value.mobile.bounceRate * 100).toFixed(1))}%</h4><p class="text-slate-400 text-xs mb-1.5 font-medium" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").description)}</p></div>`);
                } else {
                  _push2(`<p class="text-slate-500 italic text-sm" data-v-3f602d42${_scopeId}>Insufficient mobile traffic data</p>`);
                }
                _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group hover:border-indigo-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-6" data-v-3f602d42${_scopeId}><div class="flex items-center gap-3" data-v-3f602d42${_scopeId}><div class="p-2 bg-indigo-50 text-indigo-500 rounded-lg" data-v-3f602d42${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" data-v-3f602d42${_scopeId}></path></svg></div><h3 class="text-sm font-black text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Desktop Bounce Health</h3></div>`);
                if (deviceStats.value.desktop) {
                  _push2(`<span class="${ssrRenderClass([getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").class, "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
                if (deviceStats.value.desktop) {
                  _push2(`<div class="flex items-end gap-3" data-v-3f602d42${_scopeId}><h4 class="text-4xl font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((deviceStats.value.desktop.bounceRate * 100).toFixed(1))}%</h4><p class="text-slate-500 text-xs mb-1.5 font-medium" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").description)}</p></div>`);
                } else {
                  _push2(`<p class="text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>Insufficient desktop traffic data</p>`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (isLoading.value || overview.value && overview.value.total_users > 0) {
                _push2(`<div class="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group" data-v-3f602d42${_scopeId}><div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000" data-v-3f602d42${_scopeId}></div><div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" data-v-3f602d42${_scopeId}></div><div class="relative z-10" data-v-3f602d42${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10" data-v-3f602d42${_scopeId}><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm" data-v-3f602d42${_scopeId}><svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h2 class="text-2xl font-black text-white" data-v-3f602d42${_scopeId}>AI Performance Insights</h2><p class="text-slate-400 font-medium" data-v-3f602d42${_scopeId}>Smart analysis of your SEO &amp; traffic trends</p></div></div><button class="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all backdrop-blur-sm" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-3f602d42${_scopeId}></path></svg> Update Analysis </button></div>`);
                if (__props.organization?.settings?.ai_insights_enabled !== false) {
                  _push2(`<!--[-->`);
                  if (insights.value?.status === "configuration_required") {
                    _push2(`<div class="py-10" data-v-3f602d42${_scopeId}><div class="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6" data-v-3f602d42${_scopeId}><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-sm shrink-0 border border-amber-500/10" data-v-3f602d42${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h3 class="text-lg font-bold text-white" data-v-3f602d42${_scopeId}>AI Model Setup Required</h3><p class="text-sm text-slate-400 mt-1" data-v-3f602d42${_scopeId}>Select an AI model in your organization settings to enable automated performance insights.</p></div></div>`);
                    _push2(ssrRenderComponent(unref(Link), {
                      href: _ctx.route("organization.settings", { tab: "ai" }),
                      class: "whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
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
                    _push2(`</div></div>`);
                  } else if (insights.value && (!fetchingInsights.value || insights.value)) {
                    _push2(`<div class="grid grid-cols-1 lg:grid-cols-2 gap-10" data-v-3f602d42${_scopeId}><div class="space-y-8" data-v-3f602d42${_scopeId}><div class="bg-white/5 p-8 rounded-[2rem] border border-white/10" data-v-3f602d42${_scopeId}><div class="flex items-center gap-3 mb-4" data-v-3f602d42${_scopeId}><span class="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/30" data-v-3f602d42${_scopeId}>Executive Summary</span>`);
                    if (insights.value.severity) {
                      _push2(`<span class="${ssrRenderClass([{
                        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30": insights.value.severity === "low",
                        "bg-yellow-500/20 text-yellow-300 border-yellow-500/30": insights.value.severity === "medium",
                        "bg-red-500/20 text-red-300 border-red-500/30": insights.value.severity === "high"
                      }, "px-3 py-1 border text-[10px] font-black uppercase tracking-widest rounded-lg"])}" data-v-3f602d42${_scopeId}> Priority: ${ssrInterpolate(insights.value.severity)}</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div><p class="text-lg font-medium text-slate-200 leading-relaxed" data-v-3f602d42${_scopeId}>${ssrInterpolate(insights.value.body || "No summary available for this period.")}</p></div><div class="space-y-4" data-v-3f602d42${_scopeId}><h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2" data-v-3f602d42${_scopeId}>Key Findings</h3><div class="grid gap-3" data-v-3f602d42${_scopeId}><!--[-->`);
                    ssrRenderList(insights.value.context?.key_findings || [], (finding, idx) => {
                      _push2(`<div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-all" data-v-3f602d42${_scopeId}><div class="${ssrRenderClass([idx % 2 === 0 ? "bg-blue-400" : "bg-emerald-400", "w-2 h-2 rounded-full"])}" data-v-3f602d42${_scopeId}></div><span class="text-slate-300 font-medium" data-v-3f602d42${_scopeId}>${ssrInterpolate(finding)}</span></div>`);
                    });
                    _push2(`<!--]-->`);
                    if (!insights.value.context?.key_findings?.length) {
                      _push2(`<p class="text-slate-500 text-sm italic px-2" data-v-3f602d42${_scopeId}>No key findings detected.</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div></div><div class="space-y-10" data-v-3f602d42${_scopeId}><div class="space-y-6" data-v-3f602d42${_scopeId}><h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2" data-v-3f602d42${_scopeId}>Actionable Recommendations</h3><div class="space-y-4" data-v-3f602d42${_scopeId}><!--[-->`);
                    ssrRenderList(insights.value.context?.recommendations || [], (rec, idx) => {
                      _push2(`<div class="p-6 bg-gradient-to-r from-blue-500/10 to-transparent rounded-[2rem] border border-blue-500/20 group/item hover:border-blue-500/40 transition-all" data-v-3f602d42${_scopeId}><div class="flex gap-4" data-v-3f602d42${_scopeId}><div class="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm border border-blue-500/20" data-v-3f602d42${_scopeId}>${ssrInterpolate(idx + 1)}</div><p class="text-slate-200 font-bold leading-relaxed" data-v-3f602d42${_scopeId}>${ssrInterpolate(rec)}</p></div></div>`);
                    });
                    _push2(`<!--]-->`);
                    if (!insights.value.context?.recommendations?.length) {
                      _push2(`<p class="text-slate-500 text-sm italic px-2" data-v-3f602d42${_scopeId}>No recommendations available.</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                    if (insights.value.context?.keyword_strategy?.length) {
                      _push2(`<div class="space-y-6" data-v-3f602d42${_scopeId}><h3 class="text-sm font-black text-emerald-400/80 uppercase tracking-widest px-2 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16" data-v-3f602d42${_scopeId}></path></svg> Keyword Strategy </h3><div class="grid gap-4" data-v-3f602d42${_scopeId}><!--[-->`);
                      ssrRenderList(insights.value.context.keyword_strategy, (strat, idx) => {
                        _push2(`<div class="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all" data-v-3f602d42${_scopeId}><p class="text-slate-300 text-sm font-medium leading-relaxed italic" data-v-3f602d42${_scopeId}>&quot;${ssrInterpolate(strat)}&quot;</p></div>`);
                      });
                      _push2(`<!--]--></div></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    if (insights.value.context?.report_enhancements?.length) {
                      _push2(`<div class="bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10" data-v-3f602d42${_scopeId}><h3 class="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" data-v-3f602d42${_scopeId}></path></svg> Enhance this Report </h3><ul class="space-y-2" data-v-3f602d42${_scopeId}><!--[-->`);
                      ssrRenderList(insights.value.context.report_enhancements, (sug, idx) => {
                        _push2(`<li class="text-[11px] font-bold text-slate-400 flex items-start gap-2" data-v-3f602d42${_scopeId}><span class="text-indigo-500 mt-1" data-v-3f602d42${_scopeId}>•</span> ${ssrInterpolate(sug)}</li>`);
                      });
                      _push2(`<!--]--></ul></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  } else if (fetchingInsights.value) {
                    _push2(`<div class="py-10" data-v-3f602d42${_scopeId}><div class="grid grid-cols-1 lg:grid-cols-2 gap-10" data-v-3f602d42${_scopeId}><div class="space-y-8" data-v-3f602d42${_scopeId}><div class="bg-white/5 p-8 rounded-[2rem] border border-white/10" data-v-3f602d42${_scopeId}><div class="skeleton-dark h-3 w-32 rounded-full mb-6" data-v-3f602d42${_scopeId}></div><div class="space-y-3" data-v-3f602d42${_scopeId}><div class="skeleton-dark h-5 w-full rounded-full" data-v-3f602d42${_scopeId}></div><div class="skeleton-dark h-5 w-5/6 rounded-full" data-v-3f602d42${_scopeId}></div><div class="skeleton-dark h-5 w-4/6 rounded-full" data-v-3f602d42${_scopeId}></div></div></div><div class="space-y-4" data-v-3f602d42${_scopeId}><div class="skeleton-dark h-3 w-24 rounded-full mx-2" data-v-3f602d42${_scopeId}></div><!--[-->`);
                    ssrRenderList(3, (i) => {
                      _push2(`<div class="skeleton-dark h-16 w-full rounded-2xl" data-v-3f602d42${_scopeId}></div>`);
                    });
                    _push2(`<!--]--></div></div><div class="space-y-6" data-v-3f602d42${_scopeId}><div class="skeleton-dark h-3 w-40 rounded-full mx-2" data-v-3f602d42${_scopeId}></div><!--[-->`);
                    ssrRenderList(3, (i) => {
                      _push2(`<div class="skeleton-dark h-24 w-full rounded-[2rem]" data-v-3f602d42${_scopeId}></div>`);
                    });
                    _push2(`<!--]--></div></div></div>`);
                  } else if (insightError.value) {
                    _push2(`<div class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5" data-v-3f602d42${_scopeId}><div class="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-xl border border-rose-500/10" data-v-3f602d42${_scopeId}><span class="text-4xl" data-v-3f602d42${_scopeId}>⚠️</span></div><h3 class="text-xl font-black text-white mb-2" data-v-3f602d42${_scopeId}>Analysis Failed</h3><p class="text-slate-400 font-medium mb-6" data-v-3f602d42${_scopeId}>We couldn&#39;t generate insights at this time.</p><button class="text-blue-400 font-bold hover:underline" data-v-3f602d42${_scopeId}>Try again</button></div>`);
                  } else {
                    _push2(`<div class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5" data-v-3f602d42${_scopeId}><div class="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-xl border border-blue-500/10" data-v-3f602d42${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg></div><h3 class="text-xl font-black text-white mb-2" data-v-3f602d42${_scopeId}>Awaiting Intelligence</h3><p class="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed" data-v-3f602d42${_scopeId}>We need historical data for this property to generate contextual insights. Check back tomorrow!</p></div>`);
                  }
                  _push2(`<!--]-->`);
                } else {
                  _push2(`<div class="py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5" data-v-3f602d42${_scopeId}><div class="w-24 h-24 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-purple-400 shadow-xl border border-purple-500/10" data-v-3f602d42${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg></div><h3 class="text-xl font-black text-white mb-2" data-v-3f602d42${_scopeId}>Insights Disabled</h3><p class="text-slate-400 max-w-sm mx-auto font-medium mb-6" data-v-3f602d42${_scopeId}>AI analysis is currently turned off for this organization.</p>`);
                  _push2(ssrRenderComponent(unref(Link), {
                    href: _ctx.route("organization.settings", { tab: "ai" }),
                    class: "inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-purple-900/40"
                  }, {
                    default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                      if (_push3) {
                        _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" data-v-3f602d42${_scopeId2}></path></svg> Enable AI Insights `);
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
                              d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            })
                          ])),
                          createTextVNode(" Enable AI Insights ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent2, _scopeId));
                  _push2(`</div>`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (isLoading.value) {
                _push2(`<div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-10" data-v-3f602d42${_scopeId}><div class="space-y-2" data-v-3f602d42${_scopeId}><div class="skeleton h-6 w-48 rounded-full" data-v-3f602d42${_scopeId}></div><div class="skeleton h-3 w-32 rounded-full opacity-50" data-v-3f602d42${_scopeId}></div></div><div class="skeleton h-10 w-40 rounded-xl" data-v-3f602d42${_scopeId}></div></div><div class="skeleton h-[400px] w-full rounded-[2rem]" data-v-3f602d42${_scopeId}></div></div>`);
              } else if (overview.value && overview.value.total_users > 0) {
                _push2(`<div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-10" data-v-3f602d42${_scopeId}><div data-v-3f602d42${_scopeId}><h2 class="text-2xl font-black text-slate-900" data-v-3f602d42${_scopeId}>Performance Trends</h2><p class="text-slate-500 font-medium mt-1" data-v-3f602d42${_scopeId}>Daily activity overview</p></div><div class="flex bg-slate-50 p-1 rounded-xl" data-v-3f602d42${_scopeId}><button class="${ssrRenderClass([chartMetric.value === "users" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"])}" data-v-3f602d42${_scopeId}>Engagement</button><button class="${ssrRenderClass([chartMetric.value === "search" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"])}" data-v-3f602d42${_scopeId}>Search</button></div></div><div class="h-[400px]" data-v-3f602d42${_scopeId}>`);
                if (chartData.value.labels.length) {
                  _push2(ssrRenderComponent(unref(Line), {
                    data: chartData.value,
                    options: chartOptions.value
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value && overview.value.total_users > 0) {
                _push2(`<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10" data-v-3f602d42${_scopeId}><div class="space-y-8" data-v-3f602d42${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" data-v-3f602d42${_scopeId}></path></svg> Active Users by First User Source </h3><div class="flex flex-col md:flex-row gap-8 items-center" data-v-3f602d42${_scopeId}><div class="w-40 h-40 shrink-0" data-v-3f602d42${_scopeId}>`);
                _push2(ssrRenderComponent(unref(Doughnut), {
                  data: acquisitionChartData.value,
                  options: doughnutOptions
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="flex-1 space-y-4 w-full" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_first_source?.slice(0, 5) || [], (source, idx) => {
                  _push2(`<div class="group" data-v-3f602d42${_scopeId}><div class="flex justify-between items-center mb-1" data-v-3f602d42${_scopeId}><div class="flex items-center gap-2 overflow-hidden" data-v-3f602d42${_scopeId}><span class="w-2.5 h-2.5 rounded-full shrink-0" style="${ssrRenderStyle({ backgroundColor: acquisitionChartData.value.datasets[0].backgroundColor[idx] })}" data-v-3f602d42${_scopeId}></span><span class="text-xs font-bold text-slate-700 truncate"${ssrRenderAttr("title", source.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(source.name)}</span></div><span class="text-xs font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((source.activeUsers || 0).toLocaleString())}</span></div><div class="h-1 bg-slate-50 rounded-full overflow-hidden" data-v-3f602d42${_scopeId}><div class="h-full rounded-full transition-all duration-1000 ease-out" style="${ssrRenderStyle({ width: (source.activeUsers || 0) / (overview.value.total_users || 1) * 100 + "%", backgroundColor: acquisitionChartData.value.datasets[0].backgroundColor[idx] })}" data-v-3f602d42${_scopeId}></div></div></div>`);
                });
                _push2(`<!--]--></div></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" data-v-3f602d42${_scopeId}></path></svg> Active Users by Audience </h3><div class="flex flex-col md:flex-row gap-8 items-center" data-v-3f602d42${_scopeId}><div class="w-40 h-40 shrink-0" data-v-3f602d42${_scopeId}>`);
                _push2(ssrRenderComponent(unref(Doughnut), {
                  data: audienceChartData.value,
                  options: doughnutOptions
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="flex-1 space-y-4 w-full" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_audience?.slice(0, 5) || [], (audience, idx) => {
                  _push2(`<div class="group" data-v-3f602d42${_scopeId}><div class="flex justify-between items-center mb-1" data-v-3f602d42${_scopeId}><div class="flex items-center gap-2 overflow-hidden" data-v-3f602d42${_scopeId}><span class="w-2.5 h-2.5 rounded-full shrink-0" style="${ssrRenderStyle({ backgroundColor: audienceChartData.value.datasets[0].backgroundColor[idx] })}" data-v-3f602d42${_scopeId}></span><span class="text-xs font-bold text-slate-700 truncate"${ssrRenderAttr("title", audience.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(audience.name)}</span></div><span class="text-xs font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((audience.activeUsers || 0).toLocaleString())}</span></div><div class="h-1 bg-slate-50 rounded-full overflow-hidden" data-v-3f602d42${_scopeId}><div class="h-full rounded-full transition-all duration-1000 ease-out" style="${ssrRenderStyle({ width: (audience.activeUsers || 0) / (overview.value.total_users || 1) * 100 + "%", backgroundColor: audienceChartData.value.datasets[0].backgroundColor[idx] })}" data-v-3f602d42${_scopeId}></div></div></div>`);
                });
                _push2(`<!--]--></div></div>`);
                if (!overview.value?.by_audience?.length) {
                  _push2(`<p class="text-center py-8 text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No audience data available</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg> Event Performance </h3><div class="overflow-x-auto" data-v-3f602d42${_scopeId}><table class="w-full text-left" data-v-3f602d42${_scopeId}><thead data-v-3f602d42${_scopeId}><tr class="border-b border-slate-50" data-v-3f602d42${_scopeId}><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4" data-v-3f602d42${_scopeId}>Event Name</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Users</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4" data-v-3f602d42${_scopeId}>Count</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_event || [], (event) => {
                  _push2(`<tr class="group hover:bg-slate-50 transition-colors" data-v-3f602d42${_scopeId}><td class="py-4 pl-4 pr-4" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 block mb-1" data-v-3f602d42${_scopeId}>${ssrInterpolate(event.name)}</span><div class="h-1 bg-slate-100 rounded-full overflow-hidden w-24" data-v-3f602d42${_scopeId}><div class="h-full bg-purple-500 rounded-full" style="${ssrRenderStyle({ width: Math.min((event.eventCount || 0) / (overview.value?.by_event?.[0]?.eventCount || 1) * 100, 100) + "%" })}" data-v-3f602d42${_scopeId}></div></div></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><span class="text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((event.activeUsers || 0).toLocaleString())}</span></td><td class="py-4 text-right pr-4" data-v-3f602d42${_scopeId}><span class="text-sm font-medium text-slate-500" data-v-3f602d42${_scopeId}>${ssrInterpolate((event.eventCount || 0).toLocaleString())}</span>`);
                  if (event.conversions > 0) {
                    _push2(`<span class="block text-[9px] text-purple-600 font-bold" data-v-3f602d42${_scopeId}>${ssrInterpolate(event.conversions)} Conv.</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
                if (!overview.value?.by_event?.length) {
                  _push2(`<p class="text-center py-10 text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No event data available</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div><div class="space-y-8" data-v-3f602d42${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" data-v-3f602d42${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" data-v-3f602d42${_scopeId}></path></svg> Geography Overview </h3><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="flex bg-slate-50 p-1 rounded-xl" data-v-3f602d42${_scopeId}><button class="${ssrRenderClass([geoTab.value === "country" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"])}" data-v-3f602d42${_scopeId}>Country</button><button class="${ssrRenderClass([geoTab.value === "city" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"])}" data-v-3f602d42${_scopeId}>City</button></div></div></div><div class="mb-6" data-v-3f602d42${_scopeId}><div class="relative" data-v-3f602d42${_scopeId}><input${ssrRenderAttr("value", geoSearch.value)} type="text" placeholder="Search locations..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20" data-v-3f602d42${_scopeId}><svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg></div></div><div class="flex flex-col md:flex-row gap-8 items-start" data-v-3f602d42${_scopeId}><div class="w-full md:w-1/3 h-48 shrink-0 flex items-center justify-center" data-v-3f602d42${_scopeId}>`);
                if (filteredGeoData.value.length) {
                  _push2(ssrRenderComponent(unref(Doughnut), {
                    data: geoChartData.value,
                    options: doughnutOptions
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<p class="text-slate-300 text-xs font-bold uppercase tracking-widest" data-v-3f602d42${_scopeId}>No Data</p>`);
                }
                _push2(`</div><div class="w-full md:w-2/3 space-y-3" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(filteredGeoData.value, (item, idx) => {
                  _push2(`<div class="flex items-center justify-between group" data-v-3f602d42${_scopeId}><div class="flex items-center gap-2 overflow-hidden" data-v-3f602d42${_scopeId}><span class="w-2.5 h-2.5 rounded-full shrink-0" style="${ssrRenderStyle({ backgroundColor: idx < 5 ? geoChartData.value.datasets[0].backgroundColor[idx] : "#cbd5e1" })}" data-v-3f602d42${_scopeId}></span><span class="text-sm font-bold text-slate-700 truncate"${ssrRenderAttr("title", item.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(item.name)}</span></div><span class="text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((item.activeUsers || item.value || 0).toLocaleString())}</span></div>`);
                });
                _push2(`<!--]-->`);
                if (!filteredGeoData.value.length) {
                  _push2(`<p class="text-center py-4 text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No locations found</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-3f602d42${_scopeId}></path></svg> Views by Page Title and Screen Name </h3><div class="space-y-8" data-v-3f602d42${_scopeId}><div data-v-3f602d42${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" data-v-3f602d42${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-indigo-400" data-v-3f602d42${_scopeId}></span> Top Page Titles </h4><div class="space-y-4" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_page_title?.slice(0, 5) || [], (page, idx) => {
                  _push2(`<div class="group" data-v-3f602d42${_scopeId}><div class="flex justify-between items-start mb-2 gap-4" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 leading-tight line-clamp-2"${ssrRenderAttr("title", page.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(page.name)}</span><div class="text-right shrink-0" data-v-3f602d42${_scopeId}><span class="block text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.screenPageViews || page.activeUsers || 0).toLocaleString())}</span><span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider" data-v-3f602d42${_scopeId}>Views</span></div></div><div class="h-1.5 bg-slate-50 rounded-full overflow-hidden" data-v-3f602d42${_scopeId}><div class="h-full bg-indigo-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100" style="${ssrRenderStyle({ width: (page.screenPageViews || page.activeUsers || 0) / (overview.value?.by_page_title?.[0]?.screenPageViews || overview.value?.by_page_title?.[0]?.activeUsers || 1) * 100 + "%" })}" data-v-3f602d42${_scopeId}></div></div></div>`);
                });
                _push2(`<!--]-->`);
                if (!overview.value?.by_page_title?.length) {
                  _push2(`<p class="text-slate-400 italic text-xs mt-2" data-v-3f602d42${_scopeId}>No page title data</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div data-v-3f602d42${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" data-v-3f602d42${_scopeId}><span class="w-1.5 h-1.5 rounded-full bg-pink-400" data-v-3f602d42${_scopeId}></span> Top Screen Names </h4><div class="space-y-4" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_screen?.slice(0, 5) || [], (screen, idx) => {
                  _push2(`<div class="group" data-v-3f602d42${_scopeId}><div class="flex justify-between items-center mb-2 gap-4" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 truncate"${ssrRenderAttr("title", screen.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(screen.name)}</span><div class="text-right shrink-0" data-v-3f602d42${_scopeId}><span class="block text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((screen.screenPageViews || screen.activeUsers || 0).toLocaleString())}</span><span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider" data-v-3f602d42${_scopeId}>Views</span></div></div><div class="h-1.5 bg-slate-50 rounded-full overflow-hidden" data-v-3f602d42${_scopeId}><div class="h-full bg-pink-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100" style="${ssrRenderStyle({ width: (screen.screenPageViews || screen.activeUsers || 0) / (overview.value?.by_screen?.[0]?.screenPageViews || overview.value?.by_screen?.[0]?.activeUsers || 1) * 100 + "%" })}" data-v-3f602d42${_scopeId}></div></div></div>`);
                });
                _push2(`<!--]-->`);
                if (!overview.value?.by_screen?.length) {
                  _push2(`<p class="text-slate-400 italic text-xs mt-2" data-v-3f602d42${_scopeId}>No screen name data</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div></div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value && overview.value.total_users > 0) {
                _push2(`<div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12 animate-in fade-in duration-700" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-10" data-v-3f602d42${_scopeId}><h3 class="text-2xl font-black text-slate-900 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" data-v-3f602d42${_scopeId}></path></svg> Discovered Page Performance </h3><span class="text-xs font-black text-slate-400 uppercase tracking-widest" data-v-3f602d42${_scopeId}>SEO Optimization Overview</span></div><div class="overflow-x-auto" data-v-3f602d42${_scopeId}><table class="w-full text-left" data-v-3f602d42${_scopeId}><thead data-v-3f602d42${_scopeId}><tr class="border-b border-slate-50" data-v-3f602d42${_scopeId}><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4" data-v-3f602d42${_scopeId}>Page Path</th><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" data-v-3f602d42${_scopeId}>Users</th><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" data-v-3f602d42${_scopeId}>Engaged</th><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" data-v-3f602d42${_scopeId}>Avg. Time</th><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" data-v-3f602d42${_scopeId}>Bounce Rate</th><th class="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-4" data-v-3f602d42${_scopeId}>SEO Status</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(overview.value?.by_page || [], (page) => {
                  _push2(`<tr class="group hover:bg-slate-50/50 transition-all" data-v-3f602d42${_scopeId}><td class="py-5 px-4 max-w-md" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 truncate block transition-colors group-hover:text-blue-600"${ssrRenderAttr("title", page.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(page.name)}</span></td><td class="py-5 text-center" data-v-3f602d42${_scopeId}><span class="text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.activeUsers || 0).toLocaleString())}</span></td><td class="py-5 text-center" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-600" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.engagedSessions || 0).toLocaleString())}</span></td><td class="py-5 text-center" data-v-3f602d42${_scopeId}><span class="text-xs font-black text-slate-500" data-v-3f602d42${_scopeId}>${ssrInterpolate(formatDuration(page.averageSessionDuration))}</span></td><td class="py-5 text-center" data-v-3f602d42${_scopeId}><div class="flex flex-col items-center gap-1" data-v-3f602d42${_scopeId}><span class="${ssrRenderClass([getSEOStatus(page.bounceRate).label === "Poor" ? "text-rose-500" : "text-slate-700", "text-sm font-bold"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.bounceRate * 100).toFixed(1))}% </span><div class="w-20 h-1 bg-slate-100 rounded-full overflow-hidden" data-v-3f602d42${_scopeId}><div class="${ssrRenderClass([getSEOStatus(page.bounceRate).label === "Optimum" ? "bg-emerald-500" : getSEOStatus(page.bounceRate).label === "Fair" ? "bg-amber-500" : "bg-rose-500", "h-full rounded-full transition-all duration-1000"])}" style="${ssrRenderStyle({ width: 100 - page.bounceRate * 100 + "%" })}" data-v-3f602d42${_scopeId}></div></div></div></td><td class="py-5 text-right pr-4" data-v-3f602d42${_scopeId}><div class="flex items-center justify-end gap-2 group/status relative" data-v-3f602d42${_scopeId}><span class="text-lg" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(page.bounceRate).icon)}</span><span class="${ssrRenderClass([getSEOStatus(page.bounceRate).class, "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(page.bounceRate).label)}</span><div class="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] font-medium rounded-lg opacity-0 group-hover/status:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl" data-v-3f602d42${_scopeId}>${ssrInterpolate(getSEOStatus(page.bounceRate).description)}</div></div></td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
                if (!overview.value?.by_page?.length) {
                  _push2(`<p class="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic text-sm m-4" data-v-3f602d42${_scopeId}>No discovered page data available for this range</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
                if (trendData.value && trendData.value.length > 0) {
                  _push2(`<div class="space-y-8 py-10" data-v-3f602d42${_scopeId}><h2 class="text-2xl font-black text-slate-900 flex items-center gap-3" data-v-3f602d42${_scopeId}><span class="p-2 bg-emerald-500/10 rounded-xl" data-v-3f602d42${_scopeId}>📊</span> Content &amp; Event Trends </h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8" data-v-3f602d42${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-2 h-6 bg-amber-500 rounded-full" data-v-3f602d42${_scopeId}></div> Views by Page Title </h3><div class="h-[300px]" data-v-3f602d42${_scopeId}>`);
                  if (pageTitlesChartData.value.datasets.length) {
                    _push2(ssrRenderComponent(unref(Line), {
                      data: pageTitlesChartData.value,
                      options: chartOptions.value
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(`<div class="h-full flex items-center justify-center text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No page title data available</div>`);
                  }
                  _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-2 h-6 bg-blue-500 rounded-full" data-v-3f602d42${_scopeId}></div> Views by Screen Name </h3><div class="h-[300px]" data-v-3f602d42${_scopeId}>`);
                  if (screensChartData.value.datasets.length) {
                    _push2(ssrRenderComponent(unref(Line), {
                      data: screensChartData.value,
                      options: chartOptions.value
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(`<div class="h-full flex items-center justify-center text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No screen name data available</div>`);
                  }
                  _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium lg:col-span-2" data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-2 h-6 bg-rose-500 rounded-full" data-v-3f602d42${_scopeId}></div> Event Performance (Event Count) </h3><div class="h-[300px]" data-v-3f602d42${_scopeId}>`);
                  if (eventsChartData.value.datasets.length) {
                    _push2(ssrRenderComponent(unref(Line), {
                      data: eventsChartData.value,
                      options: chartOptions.value
                    }, null, _parent2, _scopeId));
                  } else {
                    _push2(`<div class="h-full flex items-center justify-center text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No event data available</div>`);
                  }
                  _push2(`</div></div></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "gsc") {
              _push2(`<div class="space-y-10 animate-in fade-in duration-500" data-v-3f602d42${_scopeId}>`);
              if (_ctx.$page.props.flash.success || _ctx.$page.props.flash.error) {
                _push2(`<div class="max-w-4xl mx-auto mb-6" data-v-3f602d42${_scopeId}>`);
                if (_ctx.$page.props.flash.success) {
                  _push2(`<div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 shadow-sm" data-v-3f602d42${_scopeId}><div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600" data-v-3f602d42${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-3f602d42${_scopeId}></path></svg></div> ${ssrInterpolate(_ctx.$page.props.flash.success)}</div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (_ctx.$page.props.flash.error) {
                  _push2(`<div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 font-bold text-sm flex items-center gap-3 shadow-sm" data-v-3f602d42${_scopeId}><div class="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-600" data-v-3f602d42${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-3f602d42${_scopeId}></path></svg></div> ${ssrInterpolate(_ctx.$page.props.flash.error)}</div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (overview.value?.gsc_permission_error) {
                _push2(`<div class="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group" data-v-3f602d42${_scopeId}><div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" data-v-3f602d42${_scopeId}></div><div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000" data-v-3f602d42${_scopeId}></div><div class="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto" data-v-3f602d42${_scopeId}><div class="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-emerald-400 shadow-xl border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500" data-v-3f602d42${_scopeId}><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg></div><h2 class="text-4xl font-black text-white mb-4" data-v-3f602d42${_scopeId}>Unlock Deep Search Insights</h2><p class="text-slate-400 text-lg font-medium leading-relaxed mb-10" data-v-3f602d42${_scopeId}> Connect Google Search Console to see exactly how customers find you. This data is critical for: </p><div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12" data-v-3f602d42${_scopeId}><div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" data-v-3f602d42${_scopeId}><div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0" data-v-3f602d42${_scopeId}>✨</div><span class="text-slate-200 font-bold" data-v-3f602d42${_scopeId}>Smart Keyword Discovery</span></div><div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" data-v-3f602d42${_scopeId}><div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0" data-v-3f602d42${_scopeId}>📍</div><span class="text-slate-200 font-bold" data-v-3f602d42${_scopeId}>Competitor Comparison</span></div><div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" data-v-3f602d42${_scopeId}><div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0" data-v-3f602d42${_scopeId}>🔍</div><span class="text-slate-200 font-bold" data-v-3f602d42${_scopeId}>AI Suggestive Content</span></div><div class="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" data-v-3f602d42${_scopeId}><div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0" data-v-3f602d42${_scopeId}>🛣️</div><span class="text-slate-200 font-bold" data-v-3f602d42${_scopeId}>Sitemap Health Tracking</span></div></div><div class="flex flex-col md:flex-row gap-4 w-full md:w-auto" data-v-3f602d42${_scopeId}><button${ssrIncludeBooleanAttr(isReconnecting.value) ? " disabled" : ""} class="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px]" data-v-3f602d42${_scopeId}>`);
                if (isReconnecting.value) {
                  _push2(`<!--[--><svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-3f602d42${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-3f602d42${_scopeId}></path></svg> Establishing Connection... <!--]-->`);
                } else {
                  _push2(`<!--[--> Force Reconnect Search Console <!--]-->`);
                }
                _push2(`</button>`);
                _push2(ssrRenderComponent(unref(Link), {
                  href: _ctx.route("organization.settings", { tab: "analytics" }),
                  class: "inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-black transition-all border border-white/10"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(` Settings flow `);
                    } else {
                      return [
                        createTextVNode(" Settings flow ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div></div></div>`);
              } else {
                _push2(`<!--[-->`);
                if (overview.value) {
                  _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-v-3f602d42${_scopeId}><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Total Impressions</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Visibility in Search Engine</p></div>`);
                  if (overview.value.deltas?.total_impressions) {
                    _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_impressions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_impressions).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_impressions).label)}</span></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate((overview.value?.total_impressions || 0).toLocaleString())}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Total Clicks</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Traffic from Search Console</p></div>`);
                  if (overview.value.deltas?.total_clicks) {
                    _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.total_clicks).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_clicks).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.total_clicks).label)}</span></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate((overview.value?.total_clicks || 0).toLocaleString())}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Avg. Position</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Mean rank across all queries</p></div>`);
                  if (overview.value.deltas?.avg_position) {
                    _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.avg_position).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_position).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_position).label)}</span></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate((overview.value?.avg_position || 0).toFixed(1))}</h3></div><div class="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-1" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><p class="text-emerald-700 font-bold text-xs uppercase tracking-wider" data-v-3f602d42${_scopeId}>Avg. CTR</p><p class="text-[9px] text-slate-400 font-medium mt-0.5" data-v-3f602d42${_scopeId}>Click-through rate average</p></div>`);
                  if (overview.value.deltas?.avg_ctr) {
                    _push2(`<div class="${ssrRenderClass([getTrendInfo(overview.value.deltas.avg_ctr).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"])}" data-v-3f602d42${_scopeId}><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_ctr).icon)}</span><span data-v-3f602d42${_scopeId}>${ssrInterpolate(getTrendInfo(overview.value.deltas.avg_ctr).label)}</span></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><h3 class="text-3xl font-black text-slate-900 mt-3" data-v-3f602d42${_scopeId}>${ssrInterpolate(((overview.value?.avg_ctr || 0) * 100).toFixed(2))}%</h3></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (trendData.value && trendData.value.length > 0) {
                  _push2(`<div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><div class="flex items-center justify-between mb-10" data-v-3f602d42${_scopeId}><div data-v-3f602d42${_scopeId}><h2 class="text-2xl font-black text-slate-900" data-v-3f602d42${_scopeId}>Search Performance Trends</h2><p class="text-slate-500 font-medium mt-1" data-v-3f602d42${_scopeId}>Clicks vs Impressions over time</p></div><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-3 h-3 rounded-full bg-emerald-500" data-v-3f602d42${_scopeId}></div><span class="text-xs font-bold text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Clicks</span></div><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-3 h-3 rounded-full bg-indigo-500" data-v-3f602d42${_scopeId}></div><span class="text-xs font-bold text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Impressions</span></div></div></div><div class="h-[400px]" data-v-3f602d42${_scopeId}>`);
                  _push2(ssrRenderComponent(unref(Line), {
                    data: searchChartData.value,
                    options: gscChartOptions.value
                  }, null, _parent2, _scopeId));
                  _push2(`</div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (trendData.value && trendData.value.length > 0) {
                  _push2(`<div class="grid grid-cols-1 lg:grid-cols-2 gap-8" data-v-3f602d42${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-2 h-6 bg-emerald-500 rounded-full" data-v-3f602d42${_scopeId}></div> Top Queries Trend (Clicks) </h3><div class="h-[300px]" data-v-3f602d42${_scopeId}>`);
                  _push2(ssrRenderComponent(unref(Line), {
                    data: queriesChartData.value,
                    options: chartOptions.value
                  }, null, _parent2, _scopeId));
                  _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2" data-v-3f602d42${_scopeId}><div class="w-2 h-6 bg-blue-500 rounded-full" data-v-3f602d42${_scopeId}></div> Top Pages Trend (Clicks) </h3><div class="h-[300px]" data-v-3f602d42${_scopeId}>`);
                  _push2(ssrRenderComponent(unref(Line), {
                    data: pagesGscChartData.value,
                    options: chartOptions.value
                  }, null, _parent2, _scopeId));
                  _push2(`</div></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="grid grid-cols-1 lg:grid-cols-3 gap-8" data-v-3f602d42${_scopeId}><div class="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] shadow-premium relative overflow-hidden" data-v-3f602d42${_scopeId}><div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]" data-v-3f602d42${_scopeId}></div><div class="relative z-10" data-v-3f602d42${_scopeId}><div class="flex items-center gap-3 mb-8" data-v-3f602d42${_scopeId}><div class="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h3 class="text-lg font-black text-white" data-v-3f602d42${_scopeId}>Keyword Opportunities</h3><p class="text-xs text-slate-400 font-medium" data-v-3f602d42${_scopeId}>High impressions with low CTR - Potential for optimization</p></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(opportunityKeywords.value, (query) => {
                  _push2(`<div class="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group" data-v-3f602d42${_scopeId}><div class="flex justify-between items-start mb-3" data-v-3f602d42${_scopeId}><p class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors" data-v-3f602d42${_scopeId}>${ssrInterpolate(query.name || "Unknown")}</p><span class="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" data-v-3f602d42${_scopeId}>Opportunity</span></div><div class="flex items-center gap-4" data-v-3f602d42${_scopeId}><div class="flex flex-col" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Impressions</span><span class="text-xs font-bold text-slate-300" data-v-3f602d42${_scopeId}>${ssrInterpolate((query.impressions || 0).toLocaleString())}</span></div><div class="w-px h-6 bg-white/10" data-v-3f602d42${_scopeId}></div><div class="flex flex-col" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Position</span><span class="text-xs font-bold text-slate-300" data-v-3f602d42${_scopeId}>${ssrInterpolate((query.position || 0).toFixed(1))}</span></div><div class="w-px h-6 bg-white/10" data-v-3f602d42${_scopeId}></div><div class="flex flex-col" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest" data-v-3f602d42${_scopeId}>CTR</span><span class="text-xs font-bold text-rose-400" data-v-3f602d42${_scopeId}>${ssrInterpolate(((query.ctr || 0) * 100).toFixed(2))}%</span></div></div></div>`);
                });
                _push2(`<!--]-->`);
                if (!opportunityKeywords.value.length) {
                  _push2(`<div class="col-span-2 text-center py-10" data-v-3f602d42${_scopeId}><p class="text-slate-500 text-sm font-medium italic" data-v-3f602d42${_scopeId}>No clear optimization opportunities detected in the current query set.</p></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div><div class="flex flex-col gap-6" data-v-3f602d42${_scopeId}><h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2" data-v-3f602d42${_scopeId}>Sitemap Health</h3>`);
                if (overview.value?.sitemaps?.length) {
                  _push2(`<div class="space-y-4" data-v-3f602d42${_scopeId}><!--[-->`);
                  ssrRenderList(overview.value.sitemaps, (sitemap) => {
                    _push2(`<div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group" data-v-3f602d42${_scopeId}><div class="flex items-center gap-3" data-v-3f602d42${_scopeId}><div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0" data-v-3f602d42${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-3f602d42${_scopeId}></path></svg></div><div class="min-w-0" data-v-3f602d42${_scopeId}><p class="text-xs font-bold text-slate-900 truncate max-w-[120px]"${ssrRenderAttr("title", sitemap.path)} data-v-3f602d42${_scopeId}>${ssrInterpolate(sitemap.path.split("/").pop())}</p><p class="text-[9px] font-black text-slate-400 uppercase" data-v-3f602d42${_scopeId}>${ssrInterpolate(sitemap.contents?.[0]?.count || 0)} URLs</p></div></div><div class="text-right" data-v-3f602d42${_scopeId}><span class="${ssrRenderClass([sitemap.errors > 0 ? "bg-rose-500" : "bg-emerald-500", "w-2 h-2 rounded-full inline-block"])}" data-v-3f602d42${_scopeId}></span><p class="${ssrRenderClass([sitemap.errors > 0 ? "text-rose-600" : "text-emerald-600", "text-[10px] font-black"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(sitemap.errors > 0 ? "Error" : "Healthy")}</p></div></div>`);
                  });
                  _push2(`<!--]--></div>`);
                } else {
                  _push2(`<div class="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200" data-v-3f602d42${_scopeId}><p class="text-slate-400 text-xs font-bold" data-v-3f602d42${_scopeId}>No sitemap data</p></div>`);
                }
                _push2(`</div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10" data-v-3f602d42${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg> Top Search Queries </h3><div class="flex items-center gap-3" data-v-3f602d42${_scopeId}><select class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 py-2 px-4 appearance-none cursor-pointer" data-v-3f602d42${_scopeId}><option value="all" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(queryTrendFilter.value) ? ssrLooseContain(queryTrendFilter.value, "all") : ssrLooseEqual(queryTrendFilter.value, "all")) ? " selected" : ""}${_scopeId}>All Trends</option><option value="growing" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(queryTrendFilter.value) ? ssrLooseContain(queryTrendFilter.value, "growing") : ssrLooseEqual(queryTrendFilter.value, "growing")) ? " selected" : ""}${_scopeId}>Growing ↑</option><option value="declining" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(queryTrendFilter.value) ? ssrLooseContain(queryTrendFilter.value, "declining") : ssrLooseEqual(queryTrendFilter.value, "declining")) ? " selected" : ""}${_scopeId}>Declining ↓</option></select><div class="relative w-full md:w-64" data-v-3f602d42${_scopeId}><input${ssrRenderAttr("value", querySearch.value)} type="text" placeholder="Search queries..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20" data-v-3f602d42${_scopeId}><svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg></div></div></div><div class="overflow-x-auto" data-v-3f602d42${_scopeId}><table class="w-full text-left" data-v-3f602d42${_scopeId}><thead data-v-3f602d42${_scopeId}><tr class="border-b border-slate-50" data-v-3f602d42${_scopeId}><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Query</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Clicks</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Impressions</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Pos.</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(pagedQueries.value, (query) => {
                  _push2(`<tr class="group hover:bg-slate-50 transition-colors" data-v-3f602d42${_scopeId}><td class="py-4 pr-4" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 block truncate max-w-[200px]"${ssrRenderAttr("title", query.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(query.name)}</span></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><div class="flex flex-col items-end" data-v-3f602d42${_scopeId}><span class="text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((query.clicks || 0).toLocaleString())}</span>`);
                  if (query.delta_clicks) {
                    _push2(`<span class="${ssrRenderClass([query.delta_clicks > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5 mt-0.5"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(query.delta_clicks > 0 ? "↑" : "↓")} ${ssrInterpolate(Math.abs(query.delta_clicks).toFixed(1))}% </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><span class="text-sm font-medium text-slate-500" data-v-3f602d42${_scopeId}>${ssrInterpolate((query.impressions || 0).toLocaleString())}</span></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><div class="flex flex-col items-end" data-v-3f602d42${_scopeId}><span class="${ssrRenderClass([(query.position || 0) <= 3 ? "text-emerald-500" : "text-slate-600", "text-sm font-bold"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate((query.position || 0).toFixed(1))}</span>`);
                  if (query.delta_position) {
                    _push2(`<span class="${ssrRenderClass([query.delta_position > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(query.delta_position > 0 ? "↑" : "↓")} ${ssrInterpolate(Math.abs(query.delta_position).toFixed(1))}% </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
                if (!pagedQueries.value.length) {
                  _push2(`<p class="text-center py-10 text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No query data available</p>`);
                } else {
                  _push2(`<!---->`);
                }
                if (queryTotalPages.value > 1) {
                  _push2(`<div class="flex items-center justify-between pt-6 border-t border-slate-50 mt-4" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" data-v-3f602d42${_scopeId}>Page ${ssrInterpolate(queryPage.value)} of ${ssrInterpolate(queryTotalPages.value)}</span><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><button${ssrIncludeBooleanAttr(queryPage.value <= 1) ? " disabled" : ""} class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-3f602d42${_scopeId}></path></svg></button><button${ssrIncludeBooleanAttr(queryPage.value >= queryTotalPages.value) ? " disabled" : ""} class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-3f602d42${_scopeId}></path></svg></button></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-3f602d42${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-v-3f602d42${_scopeId}><h3 class="text-xl font-black text-slate-900 flex items-center gap-2" data-v-3f602d42${_scopeId}><svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-3f602d42${_scopeId}></path></svg> Top Pages (GSC) </h3><div class="flex items-center gap-3" data-v-3f602d42${_scopeId}><select class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 py-2 px-4 appearance-none cursor-pointer" data-v-3f602d42${_scopeId}><option value="all" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(pageTrendFilter.value) ? ssrLooseContain(pageTrendFilter.value, "all") : ssrLooseEqual(pageTrendFilter.value, "all")) ? " selected" : ""}${_scopeId}>All Trends</option><option value="growing" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(pageTrendFilter.value) ? ssrLooseContain(pageTrendFilter.value, "growing") : ssrLooseEqual(pageTrendFilter.value, "growing")) ? " selected" : ""}${_scopeId}>Growing ↑</option><option value="declining" data-v-3f602d42${ssrIncludeBooleanAttr(Array.isArray(pageTrendFilter.value) ? ssrLooseContain(pageTrendFilter.value, "declining") : ssrLooseEqual(pageTrendFilter.value, "declining")) ? " selected" : ""}${_scopeId}>Declining ↓</option></select><div class="relative w-full md:w-64" data-v-3f602d42${_scopeId}><input${ssrRenderAttr("value", pageSearch.value)} type="text" placeholder="Search pages..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20" data-v-3f602d42${_scopeId}><svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-3f602d42${_scopeId}></path></svg></div></div></div><div class="overflow-x-auto" data-v-3f602d42${_scopeId}><table class="w-full text-left" data-v-3f602d42${_scopeId}><thead data-v-3f602d42${_scopeId}><tr class="border-b border-slate-50" data-v-3f602d42${_scopeId}><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-3f602d42${_scopeId}>Page URL</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Clicks</th><th class="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" data-v-3f602d42${_scopeId}>Pos.</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-3f602d42${_scopeId}><!--[-->`);
                ssrRenderList(pagedPagesGsc.value, (page) => {
                  _push2(`<tr class="group hover:bg-slate-50 transition-colors" data-v-3f602d42${_scopeId}><td class="py-4 pr-4" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-700 block truncate max-w-[250px]"${ssrRenderAttr("title", page.name)} data-v-3f602d42${_scopeId}>${ssrInterpolate(page.name.replace(/^https?:\/\/[^\/]+/, "") || "/")}</span></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><div class="flex flex-col items-end" data-v-3f602d42${_scopeId}><span class="text-sm font-black text-slate-900" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.clicks || 0).toLocaleString())}</span>`);
                  if (page.delta_clicks) {
                    _push2(`<span class="${ssrRenderClass([page.delta_clicks > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5 mt-0.5"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(page.delta_clicks > 0 ? "↑" : "↓")} ${ssrInterpolate(Math.abs(page.delta_clicks).toFixed(1))}% </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></td><td class="py-4 text-right" data-v-3f602d42${_scopeId}><div class="flex flex-col items-end" data-v-3f602d42${_scopeId}><span class="text-sm font-bold text-slate-600" data-v-3f602d42${_scopeId}>${ssrInterpolate((page.position || 0).toFixed(1))}</span>`);
                  if (page.delta_position) {
                    _push2(`<span class="${ssrRenderClass([page.delta_position > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5"])}" data-v-3f602d42${_scopeId}>${ssrInterpolate(page.delta_position > 0 ? "↑" : "↓")} ${ssrInterpolate(Math.abs(page.delta_position).toFixed(1))}% </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
                if (!pagedPagesGsc.value.length) {
                  _push2(`<p class="text-center py-10 text-slate-400 italic text-sm" data-v-3f602d42${_scopeId}>No page data available</p>`);
                } else {
                  _push2(`<!---->`);
                }
                if (_ctx.pagesGscTotalPages > 1) {
                  _push2(`<div class="flex items-center justify-between pt-6 border-t border-slate-50 mt-4" data-v-3f602d42${_scopeId}><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" data-v-3f602d42${_scopeId}>Page ${ssrInterpolate(pagePage.value)} of ${ssrInterpolate(_ctx.pagesGscTotalPages)}</span><div class="flex items-center gap-2" data-v-3f602d42${_scopeId}><button${ssrIncludeBooleanAttr(pagePage.value <= 1) ? " disabled" : ""} class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-3f602d42${_scopeId}></path></svg></button><button${ssrIncludeBooleanAttr(pagePage.value >= _ctx.pagesGscTotalPages) ? " disabled" : ""} class="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-3f602d42${_scopeId}></path></svg></button></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div><!--]-->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "predictions") {
              _push2(`<div data-v-3f602d42${_scopeId}>`);
              _push2(ssrRenderComponent(PredictionsTab, {
                propertyId: selectedPropertyId.value,
                organization: __props.organization
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "developers") {
              _push2(`<div data-v-3f602d42${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                propertyId: selectedPropertyId.value,
                organization: __props.organization,
                properties: __props.properties,
                forecastData: forecastData.value
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "web-analysis") {
              _push2(`<div data-v-3f602d42${_scopeId}>`);
              _push2(ssrRenderComponent(WebAnalysisTab, {
                propertyId: selectedPropertyId.value,
                organization: __props.organization,
                properties: __props.properties
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!__props.properties.length) {
              _push2(`<div class="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200" data-v-3f602d42${_scopeId}><div class="text-6xl mb-6" data-v-3f602d42${_scopeId}>📊</div><h2 class="text-2xl font-bold text-slate-900" data-v-3f602d42${_scopeId}>No Analytics Properties Connected</h2><p class="text-slate-500 mt-2" data-v-3f602d42${_scopeId}>Connect your GA4 property in the settings to start tracking performance.</p>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: _ctx.route("organization.settings", { tab: "analytics" }),
                class: "inline-block mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Connect Property `);
                  } else {
                    return [
                      createTextVNode(" Connect Property ")
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
            if (showSyncSuccessToast.value) {
              _push2(`<div class="fixed bottom-10 right-10 z-[100]" data-v-3f602d42${_scopeId}><div class="bg-emerald-600 text-white p-6 rounded-[2rem] shadow-2xl border border-emerald-400/30 flex items-center gap-6 backdrop-blur-md" data-v-3f602d42${_scopeId}><div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white" data-v-3f602d42${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-3f602d42${_scopeId}></path></svg></div><div data-v-3f602d42${_scopeId}><h4 class="text-sm font-black tracking-tight uppercase tracking-widest text-emerald-50" data-v-3f602d42${_scopeId}>Sync Complete</h4><p class="text-[10px] text-emerald-100 font-medium whitespace-nowrap" data-v-3f602d42${_scopeId}>Property analytics have been synchronized.</p></div><button class="text-emerald-200 hover:text-white transition-colors p-2" data-v-3f602d42${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3f602d42${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-3f602d42${_scopeId}></path></svg></button></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-4xl font-black text-slate-900 tracking-tight" }, "Analytics Dashboard"),
                    createVNode("div", { class: "flex items-center gap-3 mt-2" }, [
                      createVNode("p", { class: "text-slate-500 font-medium" }, "Insights and performance tracking for " + toDisplayString(__props.organization.name), 1),
                      overview.value?.last_updated ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 shadow-sm animate-in fade-in duration-500"
                      }, [
                        createVNode("div", { class: "w-1.5 h-1.5 rounded-full bg-slate-400" }),
                        createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-tight" }, "Updated: " + toDisplayString(formatLastUpdated(overview.value.last_updated)), 1)
                      ])) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "flex items-center gap-4 bg-white p-2 rounded-2xl shadow-premium border border-slate-100" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => selectedPropertyId.value = $event,
                      class: "bg-transparent border-none focus:ring-0 font-bold text-slate-700 pr-10 cursor-pointer"
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
                    createVNode("div", { class: "w-px h-6 bg-slate-100" }),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => timeframe.value = $event,
                      class: "bg-transparent border-none focus:ring-0 font-bold text-blue-600 cursor-pointer pr-10 hover:text-blue-700 transition-colors"
                    }, [
                      createVNode("option", { value: 0 }, "Today"),
                      createVNode("option", { value: 1 }, "Yesterday"),
                      createVNode("option", { value: 7 }, "Last 7 Days"),
                      createVNode("option", { value: 14 }, "Last 14 Days"),
                      createVNode("option", { value: 28 }, "Last 28 Days"),
                      createVNode("option", { value: 30 }, "Last 30 Days"),
                      createVNode("option", { value: 90 }, "Last 3 Months"),
                      createVNode("option", { value: 180 }, "Last 6 Months"),
                      createVNode("option", { value: 365 }, "Last Year"),
                      createVNode("option", { value: "custom" }, "Custom Range")
                    ], 8, ["onUpdate:modelValue"]), [
                      [vModelSelect, timeframe.value]
                    ]),
                    createVNode("div", { class: "w-px h-6 bg-slate-100" }),
                    createVNode("button", {
                      onClick: ($event) => fetchData(true),
                      class: "flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group",
                      disabled: isLoading.value,
                      title: "Refresh Data from API"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: ["w-4 h-4 text-slate-400 group-hover:text-blue-500", { "animate-spin text-blue-500": isLoading.value }],
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2.5",
                          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        })
                      ], 2)),
                      createVNode("span", { class: "text-xs font-bold text-slate-500 group-hover:text-slate-700" }, "Refetch")
                    ], 8, ["onClick", "disabled"]),
                    createVNode("div", { class: "w-px h-6 bg-slate-100" }),
                    createVNode("button", {
                      onClick: toggleAutoRefresh,
                      class: "flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition-all group",
                      title: isAutoRefreshEnabled.value ? "Disable Auto-refresh" : "Enable Auto-refresh every 15m"
                    }, [
                      createVNode("div", {
                        class: ["w-2 h-2 rounded-full", isAutoRefreshEnabled.value ? "bg-emerald-500 animate-pulse" : "bg-slate-300"]
                      }, null, 2),
                      createVNode("span", {
                        class: ["text-xs font-bold transition-colors", isAutoRefreshEnabled.value ? "text-emerald-600" : "text-slate-500"]
                      }, "Auto", 2)
                    ], 8, ["title"])
                  ]),
                  isSyncing.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex items-center gap-4 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 animate-in slide-in-from-right-4 duration-500"
                  }, [
                    createVNode("div", { class: "relative flex h-2.5 w-2.5" }, [
                      createVNode("span", { class: "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75" }),
                      createVNode("span", { class: "relative inline-flex rounded-full h-2.5 w-2.5 bg-white" })
                    ]),
                    createVNode("div", { class: "flex flex-col" }, [
                      createVNode("span", { class: "text-[10px] font-black uppercase tracking-widest text-blue-100 leading-none" }, "Background Sync"),
                      createVNode("span", { class: "text-xs font-bold mt-0.5" }, "Updating property data...")
                    ])
                  ])) : createCommentVNode("", true),
                  isCustomRange.value ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex items-center gap-3 bg-white p-2 px-4 rounded-2xl shadow-premium border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300"
                  }, [
                    createVNode("div", { class: "flex items-center gap-2" }, [
                      createVNode("span", { class: "text-xs font-bold text-slate-400 uppercase tracking-wider" }, "From"),
                      withDirectives(createVNode("input", {
                        type: "date",
                        "onUpdate:modelValue": ($event) => customStartDate.value = $event,
                        class: "bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, customStartDate.value]
                      ])
                    ]),
                    createVNode("div", { class: "w-px h-4 bg-slate-100" }),
                    createVNode("div", { class: "flex items-center gap-2" }, [
                      createVNode("span", { class: "text-xs font-bold text-slate-400 uppercase tracking-wider" }, "To"),
                      withDirectives(createVNode("input", {
                        type: "date",
                        "onUpdate:modelValue": ($event) => customEndDate.value = $event,
                        class: "bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 py-1"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, customEndDate.value]
                      ])
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex items-center gap-2 border-b border-slate-100 px-2" }, [
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "overview",
                    class: [activeTab.value === "overview" ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      })
                    ])),
                    createTextVNode(" General Overview ")
                  ], 10, ["onClick"]),
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "gsc",
                    class: [activeTab.value === "gsc" ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      })
                    ])),
                    createTextVNode(" Search Console ")
                  ], 10, ["onClick"]),
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "predictions",
                    class: [activeTab.value === "predictions" ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M13 10V3L4 14h7v7l9-11h-7z"
                      })
                    ])),
                    createTextVNode(" Predictions & Insights ")
                  ], 10, ["onClick"]),
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "developers",
                    class: [activeTab.value === "developers" ? "text-indigo-600 border-indigo-600 bg-indigo-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      })
                    ])),
                    createTextVNode(" Developers ")
                  ], 10, ["onClick"]),
                  createVNode("button", {
                    onClick: ($event) => activeTab.value = "web-analysis",
                    class: [activeTab.value === "web-analysis" ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : "text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50", "flex items-center gap-2 px-8 py-4 border-b-2 font-black uppercase tracking-widest text-xs transition-all rounded-t-2xl"]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      })
                    ])),
                    createTextVNode(" Web Analysis ")
                  ], 10, ["onClick"])
                ]),
                trajectoryAlert.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: [trajectoryAlert.value.type === "warning" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200", "p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 mb-2"]
                }, [
                  createVNode("div", { class: "flex items-center gap-5" }, [
                    createVNode("div", { class: "text-4xl" }, toDisplayString(trajectoryAlert.value.icon), 1),
                    createVNode("div", null, [
                      createVNode("h3", {
                        class: ["text-lg font-black", trajectoryAlert.value.type === "warning" ? "text-rose-900" : "text-emerald-900"]
                      }, toDisplayString(trajectoryAlert.value.title), 3),
                      createVNode("p", {
                        class: ["font-medium text-sm", trajectoryAlert.value.type === "warning" ? "text-rose-700" : "text-emerald-700"]
                      }, toDisplayString(trajectoryAlert.value.message), 3)
                    ])
                  ]),
                  createVNode("div", { class: "flex items-center gap-4" }, [
                    createVNode("span", {
                      class: ["text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border", trajectoryAlert.value.type === "warning" ? "bg-rose-100/50 text-rose-600 border-rose-200" : "bg-emerald-100/50 text-emerald-600 border-emerald-200"]
                    }, " Anomaly Detected ", 2)
                  ])
                ], 2)) : createCommentVNode("", true),
                activeTab.value === "overview" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "space-y-10 animate-in fade-in duration-500"
                }, [
                  isLoading.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  }, [
                    (openBlock(), createBlock(Fragment, null, renderList(8, (i) => {
                      return createVNode("div", {
                        key: i,
                        class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium"
                      }, [
                        createVNode("div", { class: "skeleton h-3 w-20 rounded-full mb-2" }),
                        createVNode("div", { class: "skeleton h-2 w-32 rounded-full mb-4 opacity-50" }),
                        createVNode("div", { class: "skeleton h-10 w-24 rounded-xl mt-3" })
                      ]);
                    }), 64))
                  ])) : createCommentVNode("", true),
                  overview.value?.google_token_invalid ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "mb-10 bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
                  }, [
                    createVNode("div", { class: "flex items-center gap-4" }, [
                      createVNode("div", { class: "w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0" }, [
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
                        createVNode("h3", { class: "text-lg font-bold text-rose-800" }, "Google Connection Expired"),
                        createVNode("p", { class: "text-rose-700 font-medium" }, "Your Google access token has expired or was revoked. Please reconnect to restore analytics.")
                      ])
                    ]),
                    createVNode("button", {
                      onClick: handleForceReconnect,
                      disabled: isReconnecting.value,
                      class: "whitespace-nowrap px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
                    }, [
                      isReconnecting.value ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "animate-spin h-4 w-4",
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
                      ])) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(isReconnecting.value ? "Connecting..." : "Reconnect Google"), 1)
                    ], 8, ["disabled"])
                  ])) : createCommentVNode("", true),
                  overview.value?.gsc_permission_error ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "mb-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
                  }, [
                    createVNode("div", { class: "flex items-center gap-4" }, [
                      createVNode("div", { class: "w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0" }, [
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
                        createVNode("h3", { class: "text-lg font-bold text-amber-800" }, "Search Console Permission Denied"),
                        createVNode("p", { class: "text-amber-700 font-medium" }, "Google returned a permission error for this site. Click below to re-authorize with full Search Console access.")
                      ])
                    ]),
                    createVNode("button", {
                      onClick: handleForceReconnect,
                      disabled: isReconnecting.value,
                      class: "whitespace-nowrap px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
                    }, [
                      isReconnecting.value ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "animate-spin h-4 w-4",
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
                      ])) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(isReconnecting.value ? "Connecting..." : "Re-authorize GSC"), 1)
                    ], 8, ["disabled"])
                  ])) : createCommentVNode("", true),
                  overview.value && overview.value.total_users > 0 ? (openBlock(), createBlock("div", {
                    key: 3,
                    class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  }, [
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-blue-500/30 transition-all" }, [
                      createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                        createVNode("div", { class: "flex flex-col" }, [
                          createVNode("p", { class: "text-slate-500 font-bold text-xs uppercase tracking-wider" }, "Total Users"),
                          createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Active vs Total (GA4)")
                        ]),
                        overview.value.deltas?.total_users ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [getTrendInfo(overview.value.deltas.total_users).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                        }, [
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_users).icon), 1),
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_users).label), 1)
                        ], 2)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "flex items-baseline gap-2 mt-3" }, [
                        createVNode("h3", { class: "text-3xl font-black text-slate-900" }, toDisplayString(overview.value.total_users || 0), 1),
                        createVNode("span", { class: "text-xs font-bold text-slate-400" }, "/ " + toDisplayString(overview.value.total_users_all || 0), 1)
                      ])
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" }, [
                      createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                        createVNode("div", { class: "flex flex-col" }, [
                          createVNode("p", { class: "text-slate-500 font-bold text-xs uppercase tracking-wider" }, "Conversions"),
                          createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Key goal completions (GA4)")
                        ]),
                        overview.value.deltas?.total_conversions ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [getTrendInfo(overview.value.deltas.total_conversions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                        }, [
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_conversions).icon), 1),
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_conversions).label), 1)
                        ], 2)) : createCommentVNode("", true)
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-blue-600 mt-3" }, toDisplayString(overview.value.total_conversions || 0), 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" }, [
                      overview.value.gsc_permission_error ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4"
                      }, [
                        createVNode("span", { class: "text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" }, "Permission Denied")
                      ])) : overview.value.total_impressions === 0 ? (openBlock(), createBlock("div", {
                        key: 1,
                        class: "absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4"
                      }, [
                        createVNode("div", { class: "flex flex-col items-center" }, [
                          createVNode("span", { class: "text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-pulse" }, "Syncing data...")
                        ])
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                        createVNode("div", { class: "flex flex-col" }, [
                          createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Impressions"),
                          createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Times seen in Search (GSC)")
                        ]),
                        overview.value.deltas?.total_impressions ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [getTrendInfo(overview.value.deltas.total_impressions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                        }, [
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_impressions).icon), 1),
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_impressions).label), 1)
                        ], 2)) : createCommentVNode("", true)
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString(overview.value.total_impressions?.toLocaleString() || 0), 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" }, [
                      overview.value.gsc_permission_error ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4"
                      }, [
                        createVNode("span", { class: "text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" }, "Permission Required")
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                        createVNode("div", { class: "flex flex-col" }, [
                          createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Clicks"),
                          createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Visits from Search (GSC)")
                        ]),
                        overview.value.deltas?.total_clicks ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [getTrendInfo(overview.value.deltas.total_clicks).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                        }, [
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_clicks).icon), 1),
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_clicks).label), 1)
                        ], 2)) : createCommentVNode("", true)
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString(overview.value.total_clicks?.toLocaleString() || 0), 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" }, [
                      overview.value.gsc_permission_error ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4"
                      }, [
                        createVNode("span", { class: "text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" }, "Permission Required")
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                        createVNode("div", { class: "flex flex-col" }, [
                          createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Avg. Position"),
                          createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Mean rank in Search (GSC)")
                        ]),
                        overview.value.deltas?.avg_position ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: [getTrendInfo(overview.value.deltas.avg_position).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                        }, [
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_position).icon), 1),
                          createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_position).label), 1)
                        ], 2)) : createCommentVNode("", true)
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString(overview.value.avg_position?.toFixed(1) || 0), 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-emerald-500/30 transition-all relative overflow-hidden group" }, [
                      overview.value.gsc_permission_error ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-4"
                      }, [
                        createVNode("span", { class: "text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100" }, "Permission Required")
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "flex flex-col" }, [
                        createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "CTR"),
                        createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Click-through rate (GSC)")
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString((overview.value.avg_ctr * 100).toFixed(2)) + "%", 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" }, [
                      createVNode("div", { class: "flex flex-col" }, [
                        createVNode("p", { class: "text-slate-500 font-bold text-xs uppercase tracking-wider" }, "Bounce Rate"),
                        createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Single-page rate (GA4)")
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString((overview.value.avg_bounce_rate * 100).toFixed(1)) + "%", 1)
                    ]),
                    createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:border-blue-500/30 transition-all" }, [
                      createVNode("div", { class: "flex flex-col" }, [
                        createVNode("p", { class: "text-slate-500 font-bold text-xs uppercase tracking-wider" }, "Avg. Duration"),
                        createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Time per visit (GA4)")
                      ]),
                      createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString(formatDuration(overview.value.avg_duration)), 1)
                    ])
                  ])) : createCommentVNode("", true),
                  overview.value && overview.value.total_users > 0 && deviceStats.value ? (openBlock(), createBlock("div", {
                    key: 4,
                    class: "grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700"
                  }, [
                    createVNode("div", { class: "bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group" }, [
                      createVNode("div", { class: "absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]" }),
                      createVNode("div", { class: "relative z-10" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-6" }, [
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("div", { class: "p-2 bg-blue-500/20 rounded-lg text-blue-400" }, [
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
                                  d: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                })
                              ]))
                            ]),
                            createVNode("h3", { class: "text-sm font-black text-white uppercase tracking-widest" }, "Mobile Bounce Health")
                          ]),
                          deviceStats.value.mobile ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: ["px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").class]
                          }, toDisplayString(getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").label), 3)) : createCommentVNode("", true)
                        ]),
                        deviceStats.value.mobile ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "flex items-end gap-3"
                        }, [
                          createVNode("h4", { class: "text-4xl font-black text-white" }, toDisplayString((deviceStats.value.mobile.bounceRate * 100).toFixed(1)) + "%", 1),
                          createVNode("p", { class: "text-slate-400 text-xs mb-1.5 font-medium" }, toDisplayString(getSEOStatus(deviceStats.value.mobile.bounceRate, "mobile").description), 1)
                        ])) : (openBlock(), createBlock("p", {
                          key: 1,
                          class: "text-slate-500 italic text-sm"
                        }, "Insufficient mobile traffic data"))
                      ])
                    ]),
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group hover:border-indigo-500/30 transition-all" }, [
                      createVNode("div", { class: "flex items-center justify-between mb-6" }, [
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("div", { class: "p-2 bg-indigo-50 text-indigo-500 rounded-lg" }, [
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
                                d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              })
                            ]))
                          ]),
                          createVNode("h3", { class: "text-sm font-black text-slate-500 uppercase tracking-widest" }, "Desktop Bounce Health")
                        ]),
                        deviceStats.value.desktop ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: ["px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").class]
                        }, toDisplayString(getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").label), 3)) : createCommentVNode("", true)
                      ]),
                      deviceStats.value.desktop ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex items-end gap-3"
                      }, [
                        createVNode("h4", { class: "text-4xl font-black text-slate-900" }, toDisplayString((deviceStats.value.desktop.bounceRate * 100).toFixed(1)) + "%", 1),
                        createVNode("p", { class: "text-slate-500 text-xs mb-1.5 font-medium" }, toDisplayString(getSEOStatus(deviceStats.value.desktop.bounceRate, "desktop").description), 1)
                      ])) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-slate-400 italic text-sm"
                      }, "Insufficient desktop traffic data"))
                    ])
                  ])) : createCommentVNode("", true),
                  isLoading.value || overview.value && overview.value.total_users > 0 ? (openBlock(), createBlock("div", {
                    key: 5,
                    class: "bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group"
                  }, [
                    createVNode("div", { class: "absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000" }),
                    createVNode("div", { class: "absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" }),
                    createVNode("div", { class: "relative z-10" }, [
                      createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10" }, [
                        createVNode("div", { class: "flex items-center gap-4" }, [
                          createVNode("div", { class: "p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-8 h-8 text-blue-400",
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
                          createVNode("div", null, [
                            createVNode("h2", { class: "text-2xl font-black text-white" }, "AI Performance Insights"),
                            createVNode("p", { class: "text-slate-400 font-medium" }, "Smart analysis of your SEO & traffic trends")
                          ])
                        ]),
                        createVNode("button", {
                          onClick: refreshInsights,
                          class: "flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all backdrop-blur-sm"
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-4 h-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            })
                          ])),
                          createTextVNode(" Update Analysis ")
                        ])
                      ]),
                      __props.organization?.settings?.ai_insights_enabled !== false ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        insights.value?.status === "configuration_required" ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "py-10"
                        }, [
                          createVNode("div", { class: "bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6" }, [
                            createVNode("div", { class: "flex items-center gap-4" }, [
                              createVNode("div", { class: "w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-sm shrink-0 border border-amber-500/10" }, [
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
                                createVNode("h3", { class: "text-lg font-bold text-white" }, "AI Model Setup Required"),
                                createVNode("p", { class: "text-sm text-slate-400 mt-1" }, "Select an AI model in your organization settings to enable automated performance insights.")
                              ])
                            ]),
                            createVNode(unref(Link), {
                              href: _ctx.route("organization.settings", { tab: "ai" }),
                              class: "whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Configure AI Model ")
                              ]),
                              _: 1
                            }, 8, ["href"])
                          ])
                        ])) : insights.value && (!fetchingInsights.value || insights.value) ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "grid grid-cols-1 lg:grid-cols-2 gap-10"
                        }, [
                          createVNode("div", { class: "space-y-8" }, [
                            createVNode("div", { class: "bg-white/5 p-8 rounded-[2rem] border border-white/10" }, [
                              createVNode("div", { class: "flex items-center gap-3 mb-4" }, [
                                createVNode("span", { class: "px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/30" }, "Executive Summary"),
                                insights.value.severity ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: ["px-3 py-1 border text-[10px] font-black uppercase tracking-widest rounded-lg", {
                                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30": insights.value.severity === "low",
                                    "bg-yellow-500/20 text-yellow-300 border-yellow-500/30": insights.value.severity === "medium",
                                    "bg-red-500/20 text-red-300 border-red-500/30": insights.value.severity === "high"
                                  }]
                                }, " Priority: " + toDisplayString(insights.value.severity), 3)) : createCommentVNode("", true)
                              ]),
                              createVNode("p", { class: "text-lg font-medium text-slate-200 leading-relaxed" }, toDisplayString(insights.value.body || "No summary available for this period."), 1)
                            ]),
                            createVNode("div", { class: "space-y-4" }, [
                              createVNode("h3", { class: "text-sm font-black text-slate-400 uppercase tracking-widest px-2" }, "Key Findings"),
                              createVNode("div", { class: "grid gap-3" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(insights.value.context?.key_findings || [], (finding, idx) => {
                                  return openBlock(), createBlock("div", {
                                    key: idx,
                                    class: "flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-all"
                                  }, [
                                    createVNode("div", {
                                      class: ["w-2 h-2 rounded-full", idx % 2 === 0 ? "bg-blue-400" : "bg-emerald-400"]
                                    }, null, 2),
                                    createVNode("span", { class: "text-slate-300 font-medium" }, toDisplayString(finding), 1)
                                  ]);
                                }), 128)),
                                !insights.value.context?.key_findings?.length ? (openBlock(), createBlock("p", {
                                  key: 0,
                                  class: "text-slate-500 text-sm italic px-2"
                                }, "No key findings detected.")) : createCommentVNode("", true)
                              ])
                            ])
                          ]),
                          createVNode("div", { class: "space-y-10" }, [
                            createVNode("div", { class: "space-y-6" }, [
                              createVNode("h3", { class: "text-sm font-black text-slate-400 uppercase tracking-widest px-2" }, "Actionable Recommendations"),
                              createVNode("div", { class: "space-y-4" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(insights.value.context?.recommendations || [], (rec, idx) => {
                                  return openBlock(), createBlock("div", {
                                    key: idx,
                                    class: "p-6 bg-gradient-to-r from-blue-500/10 to-transparent rounded-[2rem] border border-blue-500/20 group/item hover:border-blue-500/40 transition-all"
                                  }, [
                                    createVNode("div", { class: "flex gap-4" }, [
                                      createVNode("div", { class: "shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm border border-blue-500/20" }, toDisplayString(idx + 1), 1),
                                      createVNode("p", { class: "text-slate-200 font-bold leading-relaxed" }, toDisplayString(rec), 1)
                                    ])
                                  ]);
                                }), 128)),
                                !insights.value.context?.recommendations?.length ? (openBlock(), createBlock("p", {
                                  key: 0,
                                  class: "text-slate-500 text-sm italic px-2"
                                }, "No recommendations available.")) : createCommentVNode("", true)
                              ])
                            ]),
                            insights.value.context?.keyword_strategy?.length ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "space-y-6"
                            }, [
                              createVNode("h3", { class: "text-sm font-black text-emerald-400/80 uppercase tracking-widest px-2 flex items-center gap-2" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M7 20l4-16m2 16l4-16"
                                  })
                                ])),
                                createTextVNode(" Keyword Strategy ")
                              ]),
                              createVNode("div", { class: "grid gap-4" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(insights.value.context.keyword_strategy, (strat, idx) => {
                                  return openBlock(), createBlock("div", {
                                    key: idx,
                                    class: "p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all"
                                  }, [
                                    createVNode("p", { class: "text-slate-300 text-sm font-medium leading-relaxed italic" }, '"' + toDisplayString(strat) + '"', 1)
                                  ]);
                                }), 128))
                              ])
                            ])) : createCommentVNode("", true),
                            insights.value.context?.report_enhancements?.length ? (openBlock(), createBlock("div", {
                              key: 1,
                              class: "bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10"
                            }, [
                              createVNode("h3", { class: "text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                  })
                                ])),
                                createTextVNode(" Enhance this Report ")
                              ]),
                              createVNode("ul", { class: "space-y-2" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(insights.value.context.report_enhancements, (sug, idx) => {
                                  return openBlock(), createBlock("li", {
                                    key: idx,
                                    class: "text-[11px] font-bold text-slate-400 flex items-start gap-2"
                                  }, [
                                    createVNode("span", { class: "text-indigo-500 mt-1" }, "•"),
                                    createTextVNode(" " + toDisplayString(sug), 1)
                                  ]);
                                }), 128))
                              ])
                            ])) : createCommentVNode("", true)
                          ])
                        ])) : fetchingInsights.value ? (openBlock(), createBlock("div", {
                          key: 2,
                          class: "py-10"
                        }, [
                          createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-10" }, [
                            createVNode("div", { class: "space-y-8" }, [
                              createVNode("div", { class: "bg-white/5 p-8 rounded-[2rem] border border-white/10" }, [
                                createVNode("div", { class: "skeleton-dark h-3 w-32 rounded-full mb-6" }),
                                createVNode("div", { class: "space-y-3" }, [
                                  createVNode("div", { class: "skeleton-dark h-5 w-full rounded-full" }),
                                  createVNode("div", { class: "skeleton-dark h-5 w-5/6 rounded-full" }),
                                  createVNode("div", { class: "skeleton-dark h-5 w-4/6 rounded-full" })
                                ])
                              ]),
                              createVNode("div", { class: "space-y-4" }, [
                                createVNode("div", { class: "skeleton-dark h-3 w-24 rounded-full mx-2" }),
                                (openBlock(), createBlock(Fragment, null, renderList(3, (i) => {
                                  return createVNode("div", {
                                    key: i,
                                    class: "skeleton-dark h-16 w-full rounded-2xl"
                                  });
                                }), 64))
                              ])
                            ]),
                            createVNode("div", { class: "space-y-6" }, [
                              createVNode("div", { class: "skeleton-dark h-3 w-40 rounded-full mx-2" }),
                              (openBlock(), createBlock(Fragment, null, renderList(3, (i) => {
                                return createVNode("div", {
                                  key: i,
                                  class: "skeleton-dark h-24 w-full rounded-[2rem]"
                                });
                              }), 64))
                            ])
                          ])
                        ])) : insightError.value ? (openBlock(), createBlock("div", {
                          key: 3,
                          class: "py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5"
                        }, [
                          createVNode("div", { class: "w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-xl border border-rose-500/10" }, [
                            createVNode("span", { class: "text-4xl" }, "⚠️")
                          ]),
                          createVNode("h3", { class: "text-xl font-black text-white mb-2" }, "Analysis Failed"),
                          createVNode("p", { class: "text-slate-400 font-medium mb-6" }, "We couldn't generate insights at this time."),
                          createVNode("button", {
                            onClick: refreshInsights,
                            class: "text-blue-400 font-bold hover:underline"
                          }, "Try again")
                        ])) : (openBlock(), createBlock("div", {
                          key: 4,
                          class: "py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5"
                        }, [
                          createVNode("div", { class: "w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-xl border border-blue-500/10" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-10 h-10",
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
                          createVNode("h3", { class: "text-xl font-black text-white mb-2" }, "Awaiting Intelligence"),
                          createVNode("p", { class: "text-slate-400 max-w-sm mx-auto font-medium leading-relaxed" }, "We need historical data for this property to generate contextual insights. Check back tomorrow!")
                        ]))
                      ], 64)) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "py-20 text-center animate-fade-in shadow-inner rounded-[3rem] bg-white/5 border border-white/5"
                      }, [
                        createVNode("div", { class: "w-24 h-24 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-purple-400 shadow-xl border border-purple-500/10" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-10 h-10",
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
                        createVNode("h3", { class: "text-xl font-black text-white mb-2" }, "Insights Disabled"),
                        createVNode("p", { class: "text-slate-400 max-w-sm mx-auto font-medium mb-6" }, "AI analysis is currently turned off for this organization."),
                        createVNode(unref(Link), {
                          href: _ctx.route("organization.settings", { tab: "ai" }),
                          class: "inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-purple-900/40"
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
                                d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                              })
                            ])),
                            createTextVNode(" Enable AI Insights ")
                          ]),
                          _: 1
                        }, 8, ["href"])
                      ]))
                    ])
                  ])) : createCommentVNode("", true),
                  isLoading.value ? (openBlock(), createBlock("div", {
                    key: 6,
                    class: "bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12"
                  }, [
                    createVNode("div", { class: "flex items-center justify-between mb-10" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("div", { class: "skeleton h-6 w-48 rounded-full" }),
                        createVNode("div", { class: "skeleton h-3 w-32 rounded-full opacity-50" })
                      ]),
                      createVNode("div", { class: "skeleton h-10 w-40 rounded-xl" })
                    ]),
                    createVNode("div", { class: "skeleton h-[400px] w-full rounded-[2rem]" })
                  ])) : overview.value && overview.value.total_users > 0 ? (openBlock(), createBlock("div", {
                    key: 7,
                    class: "bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12"
                  }, [
                    createVNode("div", { class: "flex items-center justify-between mb-10" }, [
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-2xl font-black text-slate-900" }, "Performance Trends"),
                        createVNode("p", { class: "text-slate-500 font-medium mt-1" }, "Daily activity overview")
                      ]),
                      createVNode("div", { class: "flex bg-slate-50 p-1 rounded-xl" }, [
                        createVNode("button", {
                          onClick: ($event) => chartMetric.value = "users",
                          class: [chartMetric.value === "users" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"]
                        }, "Engagement", 10, ["onClick"]),
                        createVNode("button", {
                          onClick: ($event) => chartMetric.value = "search",
                          class: [chartMetric.value === "search" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"]
                        }, "Search", 10, ["onClick"])
                      ])
                    ]),
                    createVNode("div", { class: "h-[400px]" }, [
                      chartData.value.labels.length ? (openBlock(), createBlock(unref(Line), {
                        key: 0,
                        data: chartData.value,
                        options: chartOptions.value
                      }, null, 8, ["data", "options"])) : createCommentVNode("", true)
                    ])
                  ])) : createCommentVNode("", true),
                  overview.value && overview.value.total_users > 0 ? (openBlock(), createBlock("div", {
                    key: 8,
                    class: "grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10"
                  }, [
                    createVNode("div", { class: "space-y-8" }, [
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-xl font-black text-slate-900 mb-8 flex items-center gap-2" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 text-blue-500",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2.5",
                              d: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                            })
                          ])),
                          createTextVNode(" Active Users by First User Source ")
                        ]),
                        createVNode("div", { class: "flex flex-col md:flex-row gap-8 items-center" }, [
                          createVNode("div", { class: "w-40 h-40 shrink-0" }, [
                            createVNode(unref(Doughnut), {
                              data: acquisitionChartData.value,
                              options: doughnutOptions
                            }, null, 8, ["data"])
                          ]),
                          createVNode("div", { class: "flex-1 space-y-4 w-full" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_first_source?.slice(0, 5) || [], (source, idx) => {
                              return openBlock(), createBlock("div", {
                                key: source.name,
                                class: "group"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center mb-1" }, [
                                  createVNode("div", { class: "flex items-center gap-2 overflow-hidden" }, [
                                    createVNode("span", {
                                      class: "w-2.5 h-2.5 rounded-full shrink-0",
                                      style: { backgroundColor: acquisitionChartData.value.datasets[0].backgroundColor[idx] }
                                    }, null, 4),
                                    createVNode("span", {
                                      class: "text-xs font-bold text-slate-700 truncate",
                                      title: source.name
                                    }, toDisplayString(source.name), 9, ["title"])
                                  ]),
                                  createVNode("span", { class: "text-xs font-black text-slate-900" }, toDisplayString((source.activeUsers || 0).toLocaleString()), 1)
                                ]),
                                createVNode("div", { class: "h-1 bg-slate-50 rounded-full overflow-hidden" }, [
                                  createVNode("div", {
                                    class: "h-full rounded-full transition-all duration-1000 ease-out",
                                    style: { width: (source.activeUsers || 0) / (overview.value.total_users || 1) * 100 + "%", backgroundColor: acquisitionChartData.value.datasets[0].backgroundColor[idx] }
                                  }, null, 4)
                                ])
                              ]);
                            }), 128))
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-xl font-black text-slate-900 mb-8 flex items-center gap-2" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 text-amber-500",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2.5",
                              d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            })
                          ])),
                          createTextVNode(" Active Users by Audience ")
                        ]),
                        createVNode("div", { class: "flex flex-col md:flex-row gap-8 items-center" }, [
                          createVNode("div", { class: "w-40 h-40 shrink-0" }, [
                            createVNode(unref(Doughnut), {
                              data: audienceChartData.value,
                              options: doughnutOptions
                            }, null, 8, ["data"])
                          ]),
                          createVNode("div", { class: "flex-1 space-y-4 w-full" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_audience?.slice(0, 5) || [], (audience, idx) => {
                              return openBlock(), createBlock("div", {
                                key: audience.name,
                                class: "group"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center mb-1" }, [
                                  createVNode("div", { class: "flex items-center gap-2 overflow-hidden" }, [
                                    createVNode("span", {
                                      class: "w-2.5 h-2.5 rounded-full shrink-0",
                                      style: { backgroundColor: audienceChartData.value.datasets[0].backgroundColor[idx] }
                                    }, null, 4),
                                    createVNode("span", {
                                      class: "text-xs font-bold text-slate-700 truncate",
                                      title: audience.name
                                    }, toDisplayString(audience.name), 9, ["title"])
                                  ]),
                                  createVNode("span", { class: "text-xs font-black text-slate-900" }, toDisplayString((audience.activeUsers || 0).toLocaleString()), 1)
                                ]),
                                createVNode("div", { class: "h-1 bg-slate-50 rounded-full overflow-hidden" }, [
                                  createVNode("div", {
                                    class: "h-full rounded-full transition-all duration-1000 ease-out",
                                    style: { width: (audience.activeUsers || 0) / (overview.value.total_users || 1) * 100 + "%", backgroundColor: audienceChartData.value.datasets[0].backgroundColor[idx] }
                                  }, null, 4)
                                ])
                              ]);
                            }), 128))
                          ])
                        ]),
                        !overview.value?.by_audience?.length ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "text-center py-8 text-slate-400 italic text-sm"
                        }, "No audience data available")) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-xl font-black text-slate-900 mb-8 flex items-center gap-2" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 text-purple-500",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2.5",
                              d: "M13 10V3L4 14h7v7l9-11h-7z"
                            })
                          ])),
                          createTextVNode(" Event Performance ")
                        ]),
                        createVNode("div", { class: "overflow-x-auto" }, [
                          createVNode("table", { class: "w-full text-left" }, [
                            createVNode("thead", null, [
                              createVNode("tr", { class: "border-b border-slate-50" }, [
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4" }, "Event Name"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Users"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4" }, "Count")
                              ])
                            ]),
                            createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_event || [], (event) => {
                                return openBlock(), createBlock("tr", {
                                  key: event.name,
                                  class: "group hover:bg-slate-50 transition-colors"
                                }, [
                                  createVNode("td", { class: "py-4 pl-4 pr-4" }, [
                                    createVNode("span", { class: "text-sm font-bold text-slate-700 block mb-1" }, toDisplayString(event.name), 1),
                                    createVNode("div", { class: "h-1 bg-slate-100 rounded-full overflow-hidden w-24" }, [
                                      createVNode("div", {
                                        class: "h-full bg-purple-500 rounded-full",
                                        style: { width: Math.min((event.eventCount || 0) / (overview.value?.by_event?.[0]?.eventCount || 1) * 100, 100) + "%" }
                                      }, null, 4)
                                    ])
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString((event.activeUsers || 0).toLocaleString()), 1)
                                  ]),
                                  createVNode("td", { class: "py-4 text-right pr-4" }, [
                                    createVNode("span", { class: "text-sm font-medium text-slate-500" }, toDisplayString((event.eventCount || 0).toLocaleString()), 1),
                                    event.conversions > 0 ? (openBlock(), createBlock("span", {
                                      key: 0,
                                      class: "block text-[9px] text-purple-600 font-bold"
                                    }, toDisplayString(event.conversions) + " Conv.", 1)) : createCommentVNode("", true)
                                  ])
                                ]);
                              }), 128))
                            ])
                          ]),
                          !overview.value?.by_event?.length ? (openBlock(), createBlock("p", {
                            key: 0,
                            class: "text-center py-10 text-slate-400 italic text-sm"
                          }, "No event data available")) : createCommentVNode("", true)
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-8" }, [
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" }, [
                          createVNode("h3", { class: "text-xl font-black text-slate-900 flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5 text-emerald-500",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2.5",
                                d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              }),
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2.5",
                                d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              })
                            ])),
                            createTextVNode(" Geography Overview ")
                          ]),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("div", { class: "flex bg-slate-50 p-1 rounded-xl" }, [
                              createVNode("button", {
                                onClick: ($event) => geoTab.value = "country",
                                class: [geoTab.value === "country" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"]
                              }, "Country", 10, ["onClick"]),
                              createVNode("button", {
                                onClick: ($event) => geoTab.value = "city",
                                class: [geoTab.value === "city" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600", "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all"]
                              }, "City", 10, ["onClick"])
                            ])
                          ])
                        ]),
                        createVNode("div", { class: "mb-6" }, [
                          createVNode("div", { class: "relative" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => geoSearch.value = $event,
                              type: "text",
                              placeholder: "Search locations...",
                              class: "w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, geoSearch.value]
                            ]),
                            (openBlock(), createBlock("svg", {
                              class: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              })
                            ]))
                          ])
                        ]),
                        createVNode("div", { class: "flex flex-col md:flex-row gap-8 items-start" }, [
                          createVNode("div", { class: "w-full md:w-1/3 h-48 shrink-0 flex items-center justify-center" }, [
                            filteredGeoData.value.length ? (openBlock(), createBlock(unref(Doughnut), {
                              key: 0,
                              data: geoChartData.value,
                              options: doughnutOptions
                            }, null, 8, ["data"])) : (openBlock(), createBlock("p", {
                              key: 1,
                              class: "text-slate-300 text-xs font-bold uppercase tracking-widest"
                            }, "No Data"))
                          ]),
                          createVNode("div", { class: "w-full md:w-2/3 space-y-3" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(filteredGeoData.value, (item, idx) => {
                              return openBlock(), createBlock("div", {
                                key: item.name,
                                class: "flex items-center justify-between group"
                              }, [
                                createVNode("div", { class: "flex items-center gap-2 overflow-hidden" }, [
                                  createVNode("span", {
                                    class: "w-2.5 h-2.5 rounded-full shrink-0",
                                    style: { backgroundColor: idx < 5 ? geoChartData.value.datasets[0].backgroundColor[idx] : "#cbd5e1" }
                                  }, null, 4),
                                  createVNode("span", {
                                    class: "text-sm font-bold text-slate-700 truncate",
                                    title: item.name
                                  }, toDisplayString(item.name), 9, ["title"])
                                ]),
                                createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString((item.activeUsers || item.value || 0).toLocaleString()), 1)
                              ]);
                            }), 128)),
                            !filteredGeoData.value.length ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-center py-4 text-slate-400 italic text-sm"
                            }, "No locations found")) : createCommentVNode("", true)
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-xl font-black text-slate-900 mb-8 flex items-center gap-2" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 text-indigo-500",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2.5",
                              d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            })
                          ])),
                          createTextVNode(" Views by Page Title and Screen Name ")
                        ]),
                        createVNode("div", { class: "space-y-8" }, [
                          createVNode("div", null, [
                            createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" }, [
                              createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-indigo-400" }),
                              createTextVNode(" Top Page Titles ")
                            ]),
                            createVNode("div", { class: "space-y-4" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_page_title?.slice(0, 5) || [], (page, idx) => {
                                return openBlock(), createBlock("div", {
                                  key: page.name,
                                  class: "group"
                                }, [
                                  createVNode("div", { class: "flex justify-between items-start mb-2 gap-4" }, [
                                    createVNode("span", {
                                      class: "text-sm font-bold text-slate-700 leading-tight line-clamp-2",
                                      title: page.name
                                    }, toDisplayString(page.name), 9, ["title"]),
                                    createVNode("div", { class: "text-right shrink-0" }, [
                                      createVNode("span", { class: "block text-sm font-black text-slate-900" }, toDisplayString((page.screenPageViews || page.activeUsers || 0).toLocaleString()), 1),
                                      createVNode("span", { class: "text-[9px] text-slate-400 font-bold uppercase tracking-wider" }, "Views")
                                    ])
                                  ]),
                                  createVNode("div", { class: "h-1.5 bg-slate-50 rounded-full overflow-hidden" }, [
                                    createVNode("div", {
                                      class: "h-full bg-indigo-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100",
                                      style: { width: (page.screenPageViews || page.activeUsers || 0) / (overview.value?.by_page_title?.[0]?.screenPageViews || overview.value?.by_page_title?.[0]?.activeUsers || 1) * 100 + "%" }
                                    }, null, 4)
                                  ])
                                ]);
                              }), 128)),
                              !overview.value?.by_page_title?.length ? (openBlock(), createBlock("p", {
                                key: 0,
                                class: "text-slate-400 italic text-xs mt-2"
                              }, "No page title data")) : createCommentVNode("", true)
                            ])
                          ]),
                          createVNode("div", null, [
                            createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" }, [
                              createVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-pink-400" }),
                              createTextVNode(" Top Screen Names ")
                            ]),
                            createVNode("div", { class: "space-y-4" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_screen?.slice(0, 5) || [], (screen, idx) => {
                                return openBlock(), createBlock("div", {
                                  key: screen.name,
                                  class: "group"
                                }, [
                                  createVNode("div", { class: "flex justify-between items-center mb-2 gap-4" }, [
                                    createVNode("span", {
                                      class: "text-sm font-bold text-slate-700 truncate",
                                      title: screen.name
                                    }, toDisplayString(screen.name), 9, ["title"]),
                                    createVNode("div", { class: "text-right shrink-0" }, [
                                      createVNode("span", { class: "block text-sm font-black text-slate-900" }, toDisplayString((screen.screenPageViews || screen.activeUsers || 0).toLocaleString()), 1),
                                      createVNode("span", { class: "text-[9px] text-slate-400 font-bold uppercase tracking-wider" }, "Views")
                                    ])
                                  ]),
                                  createVNode("div", { class: "h-1.5 bg-slate-50 rounded-full overflow-hidden" }, [
                                    createVNode("div", {
                                      class: "h-full bg-pink-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100",
                                      style: { width: (screen.screenPageViews || screen.activeUsers || 0) / (overview.value?.by_screen?.[0]?.screenPageViews || overview.value?.by_screen?.[0]?.activeUsers || 1) * 100 + "%" }
                                    }, null, 4)
                                  ])
                                ]);
                              }), 128)),
                              !overview.value?.by_screen?.length ? (openBlock(), createBlock("p", {
                                key: 0,
                                class: "text-slate-400 italic text-xs mt-2"
                              }, "No screen name data")) : createCommentVNode("", true)
                            ])
                          ])
                        ])
                      ])
                    ])
                  ])) : createCommentVNode("", true),
                  overview.value && overview.value.total_users > 0 ? (openBlock(), createBlock("div", {
                    key: 9,
                    class: "bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium mb-12 animate-in fade-in duration-700"
                  }, [
                    createVNode("div", { class: "flex items-center justify-between mb-10" }, [
                      createVNode("h3", { class: "text-2xl font-black text-slate-900 flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6 text-emerald-500",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2.5",
                            d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                          })
                        ])),
                        createTextVNode(" Discovered Page Performance ")
                      ]),
                      createVNode("span", { class: "text-xs font-black text-slate-400 uppercase tracking-widest" }, "SEO Optimization Overview")
                    ]),
                    createVNode("div", { class: "overflow-x-auto" }, [
                      createVNode("table", { class: "w-full text-left" }, [
                        createVNode("thead", null, [
                          createVNode("tr", { class: "border-b border-slate-50" }, [
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4" }, "Page Path"),
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" }, "Users"),
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" }, "Engaged"),
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" }, "Avg. Time"),
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center" }, "Bounce Rate"),
                            createVNode("th", { class: "pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-4" }, "SEO Status")
                          ])
                        ]),
                        createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(overview.value?.by_page || [], (page) => {
                            return openBlock(), createBlock("tr", {
                              key: page.name,
                              class: "group hover:bg-slate-50/50 transition-all"
                            }, [
                              createVNode("td", { class: "py-5 px-4 max-w-md" }, [
                                createVNode("span", {
                                  class: "text-sm font-bold text-slate-700 truncate block transition-colors group-hover:text-blue-600",
                                  title: page.name
                                }, toDisplayString(page.name), 9, ["title"])
                              ]),
                              createVNode("td", { class: "py-5 text-center" }, [
                                createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString((page.activeUsers || 0).toLocaleString()), 1)
                              ]),
                              createVNode("td", { class: "py-5 text-center" }, [
                                createVNode("span", { class: "text-sm font-bold text-slate-600" }, toDisplayString((page.engagedSessions || 0).toLocaleString()), 1)
                              ]),
                              createVNode("td", { class: "py-5 text-center" }, [
                                createVNode("span", { class: "text-xs font-black text-slate-500" }, toDisplayString(formatDuration(page.averageSessionDuration)), 1)
                              ]),
                              createVNode("td", { class: "py-5 text-center" }, [
                                createVNode("div", { class: "flex flex-col items-center gap-1" }, [
                                  createVNode("span", {
                                    class: ["text-sm font-bold", getSEOStatus(page.bounceRate).label === "Poor" ? "text-rose-500" : "text-slate-700"]
                                  }, toDisplayString((page.bounceRate * 100).toFixed(1)) + "% ", 3),
                                  createVNode("div", { class: "w-20 h-1 bg-slate-100 rounded-full overflow-hidden" }, [
                                    createVNode("div", {
                                      class: ["h-full rounded-full transition-all duration-1000", getSEOStatus(page.bounceRate).label === "Optimum" ? "bg-emerald-500" : getSEOStatus(page.bounceRate).label === "Fair" ? "bg-amber-500" : "bg-rose-500"],
                                      style: { width: 100 - page.bounceRate * 100 + "%" }
                                    }, null, 6)
                                  ])
                                ])
                              ]),
                              createVNode("td", { class: "py-5 text-right pr-4" }, [
                                createVNode("div", { class: "flex items-center justify-end gap-2 group/status relative" }, [
                                  createVNode("span", { class: "text-lg" }, toDisplayString(getSEOStatus(page.bounceRate).icon), 1),
                                  createVNode("span", {
                                    class: ["px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all", getSEOStatus(page.bounceRate).class]
                                  }, toDisplayString(getSEOStatus(page.bounceRate).label), 3),
                                  createVNode("div", { class: "absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[9px] font-medium rounded-lg opacity-0 group-hover/status:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl" }, toDisplayString(getSEOStatus(page.bounceRate).description), 1)
                                ])
                              ])
                            ]);
                          }), 128))
                        ])
                      ]),
                      !overview.value?.by_page?.length ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic text-sm m-4"
                      }, "No discovered page data available for this range")) : createCommentVNode("", true)
                    ]),
                    trendData.value && trendData.value.length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "space-y-8 py-10"
                    }, [
                      createVNode("h2", { class: "text-2xl font-black text-slate-900 flex items-center gap-3" }, [
                        createVNode("span", { class: "p-2 bg-emerald-500/10 rounded-xl" }, "📊"),
                        createTextVNode(" Content & Event Trends ")
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-8" }, [
                        createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                          createVNode("h3", { class: "text-lg font-black text-slate-900 mb-6 flex items-center gap-2" }, [
                            createVNode("div", { class: "w-2 h-6 bg-amber-500 rounded-full" }),
                            createTextVNode(" Views by Page Title ")
                          ]),
                          createVNode("div", { class: "h-[300px]" }, [
                            pageTitlesChartData.value.datasets.length ? (openBlock(), createBlock(unref(Line), {
                              key: 0,
                              data: pageTitlesChartData.value,
                              options: chartOptions.value
                            }, null, 8, ["data", "options"])) : (openBlock(), createBlock("div", {
                              key: 1,
                              class: "h-full flex items-center justify-center text-slate-400 italic text-sm"
                            }, "No page title data available"))
                          ])
                        ]),
                        createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                          createVNode("h3", { class: "text-lg font-black text-slate-900 mb-6 flex items-center gap-2" }, [
                            createVNode("div", { class: "w-2 h-6 bg-blue-500 rounded-full" }),
                            createTextVNode(" Views by Screen Name ")
                          ]),
                          createVNode("div", { class: "h-[300px]" }, [
                            screensChartData.value.datasets.length ? (openBlock(), createBlock(unref(Line), {
                              key: 0,
                              data: screensChartData.value,
                              options: chartOptions.value
                            }, null, 8, ["data", "options"])) : (openBlock(), createBlock("div", {
                              key: 1,
                              class: "h-full flex items-center justify-center text-slate-400 italic text-sm"
                            }, "No screen name data available"))
                          ])
                        ]),
                        createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium lg:col-span-2" }, [
                          createVNode("h3", { class: "text-lg font-black text-slate-900 mb-6 flex items-center gap-2" }, [
                            createVNode("div", { class: "w-2 h-6 bg-rose-500 rounded-full" }),
                            createTextVNode(" Event Performance (Event Count) ")
                          ]),
                          createVNode("div", { class: "h-[300px]" }, [
                            eventsChartData.value.datasets.length ? (openBlock(), createBlock(unref(Line), {
                              key: 0,
                              data: eventsChartData.value,
                              options: chartOptions.value
                            }, null, 8, ["data", "options"])) : (openBlock(), createBlock("div", {
                              key: 1,
                              class: "h-full flex items-center justify-center text-slate-400 italic text-sm"
                            }, "No event data available"))
                          ])
                        ])
                      ])
                    ])) : createCommentVNode("", true)
                  ])) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                activeTab.value === "gsc" ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "space-y-10 animate-in fade-in duration-500"
                }, [
                  _ctx.$page.props.flash.success || _ctx.$page.props.flash.error ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "max-w-4xl mx-auto mb-6"
                  }, [
                    _ctx.$page.props.flash.success ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 shadow-sm"
                    }, [
                      createVNode("div", { class: "w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600" }, [
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
                            d: "M5 13l4 4L19 7"
                          })
                        ]))
                      ]),
                      createTextVNode(" " + toDisplayString(_ctx.$page.props.flash.success), 1)
                    ])) : createCommentVNode("", true),
                    _ctx.$page.props.flash.error ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 font-bold text-sm flex items-center gap-3 shadow-sm"
                    }, [
                      createVNode("div", { class: "w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-600" }, [
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
                            d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          })
                        ]))
                      ]),
                      createTextVNode(" " + toDisplayString(_ctx.$page.props.flash.error), 1)
                    ])) : createCommentVNode("", true)
                  ])) : createCommentVNode("", true),
                  overview.value?.gsc_permission_error ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group"
                  }, [
                    createVNode("div", { class: "absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000" }),
                    createVNode("div", { class: "absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000" }),
                    createVNode("div", { class: "relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto" }, [
                      createVNode("div", { class: "w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 text-emerald-400 shadow-xl border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-12 h-12",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ]))
                      ]),
                      createVNode("h2", { class: "text-4xl font-black text-white mb-4" }, "Unlock Deep Search Insights"),
                      createVNode("p", { class: "text-slate-400 text-lg font-medium leading-relaxed mb-10" }, " Connect Google Search Console to see exactly how customers find you. This data is critical for: "),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12" }, [
                        createVNode("div", { class: "flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" }, [
                          createVNode("div", { class: "w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0" }, "✨"),
                          createVNode("span", { class: "text-slate-200 font-bold" }, "Smart Keyword Discovery")
                        ]),
                        createVNode("div", { class: "flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" }, [
                          createVNode("div", { class: "w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0" }, "📍"),
                          createVNode("span", { class: "text-slate-200 font-bold" }, "Competitor Comparison")
                        ]),
                        createVNode("div", { class: "flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" }, [
                          createVNode("div", { class: "w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0" }, "🔍"),
                          createVNode("span", { class: "text-slate-200 font-bold" }, "AI Suggestive Content")
                        ]),
                        createVNode("div", { class: "flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 text-left" }, [
                          createVNode("div", { class: "w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0" }, "🛣️"),
                          createVNode("span", { class: "text-slate-200 font-bold" }, "Sitemap Health Tracking")
                        ])
                      ]),
                      createVNode("div", { class: "flex flex-col md:flex-row gap-4 w-full md:w-auto" }, [
                        createVNode("button", {
                          onClick: handleForceReconnect,
                          disabled: isReconnecting.value,
                          class: "inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px]"
                        }, [
                          isReconnecting.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                            (openBlock(), createBlock("svg", {
                              class: "animate-spin h-5 w-5 text-white",
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
                            ])),
                            createTextVNode(" Establishing Connection... ")
                          ], 64)) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                            createTextVNode(" Force Reconnect Search Console ")
                          ], 64))
                        ], 8, ["disabled"]),
                        createVNode(unref(Link), {
                          href: _ctx.route("organization.settings", { tab: "analytics" }),
                          class: "inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-black transition-all border border-white/10"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Settings flow ")
                          ]),
                          _: 1
                        }, 8, ["href"])
                      ])
                    ])
                  ])) : (openBlock(), createBlock(Fragment, { key: 2 }, [
                    overview.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    }, [
                      createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Total Impressions"),
                            createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Visibility in Search Engine")
                          ]),
                          overview.value.deltas?.total_impressions ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: [getTrendInfo(overview.value.deltas.total_impressions).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                          }, [
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_impressions).icon), 1),
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_impressions).label), 1)
                          ], 2)) : createCommentVNode("", true)
                        ]),
                        createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString((overview.value?.total_impressions || 0).toLocaleString()), 1)
                      ]),
                      createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Total Clicks"),
                            createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Traffic from Search Console")
                          ]),
                          overview.value.deltas?.total_clicks ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: [getTrendInfo(overview.value.deltas.total_clicks).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                          }, [
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_clicks).icon), 1),
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.total_clicks).label), 1)
                          ], 2)) : createCommentVNode("", true)
                        ]),
                        createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString((overview.value?.total_clicks || 0).toLocaleString()), 1)
                      ]),
                      createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Avg. Position"),
                            createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Mean rank across all queries")
                          ]),
                          overview.value.deltas?.avg_position ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: [getTrendInfo(overview.value.deltas.avg_position).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                          }, [
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_position).icon), 1),
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_position).label), 1)
                          ], 2)) : createCommentVNode("", true)
                        ]),
                        createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString((overview.value?.avg_position || 0).toFixed(1)), 1)
                      ]),
                      createVNode("div", { class: "bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium group hover:border-emerald-500/30 transition-all" }, [
                        createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("p", { class: "text-emerald-700 font-bold text-xs uppercase tracking-wider" }, "Avg. CTR"),
                            createVNode("p", { class: "text-[9px] text-slate-400 font-medium mt-0.5" }, "Click-through rate average")
                          ]),
                          overview.value.deltas?.avg_ctr ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: [getTrendInfo(overview.value.deltas.avg_ctr).class, "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1"]
                          }, [
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_ctr).icon), 1),
                            createVNode("span", null, toDisplayString(getTrendInfo(overview.value.deltas.avg_ctr).label), 1)
                          ], 2)) : createCommentVNode("", true)
                        ]),
                        createVNode("h3", { class: "text-3xl font-black text-slate-900 mt-3" }, toDisplayString(((overview.value?.avg_ctr || 0) * 100).toFixed(2)) + "%", 1)
                      ])
                    ])) : createCommentVNode("", true),
                    trendData.value && trendData.value.length > 0 ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium"
                    }, [
                      createVNode("div", { class: "flex items-center justify-between mb-10" }, [
                        createVNode("div", null, [
                          createVNode("h2", { class: "text-2xl font-black text-slate-900" }, "Search Performance Trends"),
                          createVNode("p", { class: "text-slate-500 font-medium mt-1" }, "Clicks vs Impressions over time")
                        ]),
                        createVNode("div", { class: "flex items-center gap-4" }, [
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("div", { class: "w-3 h-3 rounded-full bg-emerald-500" }),
                            createVNode("span", { class: "text-xs font-bold text-slate-500 uppercase tracking-widest" }, "Clicks")
                          ]),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("div", { class: "w-3 h-3 rounded-full bg-indigo-500" }),
                            createVNode("span", { class: "text-xs font-bold text-slate-500 uppercase tracking-widest" }, "Impressions")
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "h-[400px]" }, [
                        createVNode(unref(Line), {
                          data: searchChartData.value,
                          options: gscChartOptions.value
                        }, null, 8, ["data", "options"])
                      ])
                    ])) : createCommentVNode("", true),
                    trendData.value && trendData.value.length > 0 ? (openBlock(), createBlock("div", {
                      key: 2,
                      class: "grid grid-cols-1 lg:grid-cols-2 gap-8"
                    }, [
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-lg font-black text-slate-900 mb-6 flex items-center gap-2" }, [
                          createVNode("div", { class: "w-2 h-6 bg-emerald-500 rounded-full" }),
                          createTextVNode(" Top Queries Trend (Clicks) ")
                        ]),
                        createVNode("div", { class: "h-[300px]" }, [
                          createVNode(unref(Line), {
                            data: queriesChartData.value,
                            options: chartOptions.value
                          }, null, 8, ["data", "options"])
                        ])
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("h3", { class: "text-lg font-black text-slate-900 mb-6 flex items-center gap-2" }, [
                          createVNode("div", { class: "w-2 h-6 bg-blue-500 rounded-full" }),
                          createTextVNode(" Top Pages Trend (Clicks) ")
                        ]),
                        createVNode("div", { class: "h-[300px]" }, [
                          createVNode(unref(Line), {
                            data: pagesGscChartData.value,
                            options: chartOptions.value
                          }, null, 8, ["data", "options"])
                        ])
                      ])
                    ])) : createCommentVNode("", true),
                    createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-8" }, [
                      createVNode("div", { class: "lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] shadow-premium relative overflow-hidden" }, [
                        createVNode("div", { class: "absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]" }),
                        createVNode("div", { class: "relative z-10" }, [
                          createVNode("div", { class: "flex items-center gap-3 mb-8" }, [
                            createVNode("div", { class: "p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-5 h-5 text-emerald-400",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2.5",
                                  d: "M13 10V3L4 14h7v7l9-11h-7z"
                                })
                              ]))
                            ]),
                            createVNode("div", null, [
                              createVNode("h3", { class: "text-lg font-black text-white" }, "Keyword Opportunities"),
                              createVNode("p", { class: "text-xs text-slate-400 font-medium" }, "High impressions with low CTR - Potential for optimization")
                            ])
                          ]),
                          createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(opportunityKeywords.value, (query) => {
                              return openBlock(), createBlock("div", {
                                key: query.name,
                                class: "bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group"
                              }, [
                                createVNode("div", { class: "flex justify-between items-start mb-3" }, [
                                  createVNode("p", { class: "text-sm font-bold text-white group-hover:text-emerald-400 transition-colors" }, toDisplayString(query.name || "Unknown"), 1),
                                  createVNode("span", { class: "text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" }, "Opportunity")
                                ]),
                                createVNode("div", { class: "flex items-center gap-4" }, [
                                  createVNode("div", { class: "flex flex-col" }, [
                                    createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "Impressions"),
                                    createVNode("span", { class: "text-xs font-bold text-slate-300" }, toDisplayString((query.impressions || 0).toLocaleString()), 1)
                                  ]),
                                  createVNode("div", { class: "w-px h-6 bg-white/10" }),
                                  createVNode("div", { class: "flex flex-col" }, [
                                    createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "Position"),
                                    createVNode("span", { class: "text-xs font-bold text-slate-300" }, toDisplayString((query.position || 0).toFixed(1)), 1)
                                  ]),
                                  createVNode("div", { class: "w-px h-6 bg-white/10" }),
                                  createVNode("div", { class: "flex flex-col" }, [
                                    createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest" }, "CTR"),
                                    createVNode("span", { class: "text-xs font-bold text-rose-400" }, toDisplayString(((query.ctr || 0) * 100).toFixed(2)) + "%", 1)
                                  ])
                                ])
                              ]);
                            }), 128)),
                            !opportunityKeywords.value.length ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "col-span-2 text-center py-10"
                            }, [
                              createVNode("p", { class: "text-slate-500 text-sm font-medium italic" }, "No clear optimization opportunities detected in the current query set.")
                            ])) : createCommentVNode("", true)
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "flex flex-col gap-6" }, [
                        createVNode("h3", { class: "text-sm font-black text-slate-400 uppercase tracking-widest px-2" }, "Sitemap Health"),
                        overview.value?.sitemaps?.length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-4"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(overview.value.sitemaps, (sitemap) => {
                            return openBlock(), createBlock("div", {
                              key: sitemap.path,
                              class: "bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group"
                            }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0" }, [
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
                                      d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    })
                                  ]))
                                ]),
                                createVNode("div", { class: "min-w-0" }, [
                                  createVNode("p", {
                                    class: "text-xs font-bold text-slate-900 truncate max-w-[120px]",
                                    title: sitemap.path
                                  }, toDisplayString(sitemap.path.split("/").pop()), 9, ["title"]),
                                  createVNode("p", { class: "text-[9px] font-black text-slate-400 uppercase" }, toDisplayString(sitemap.contents?.[0]?.count || 0) + " URLs", 1)
                                ])
                              ]),
                              createVNode("div", { class: "text-right" }, [
                                createVNode("span", {
                                  class: ["w-2 h-2 rounded-full inline-block", sitemap.errors > 0 ? "bg-rose-500" : "bg-emerald-500"]
                                }, null, 2),
                                createVNode("p", {
                                  class: ["text-[10px] font-black", sitemap.errors > 0 ? "text-rose-600" : "text-emerald-600"]
                                }, toDisplayString(sitemap.errors > 0 ? "Error" : "Healthy"), 3)
                              ])
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
                        }, [
                          createVNode("p", { class: "text-slate-400 text-xs font-bold" }, "No sitemap data")
                        ]))
                      ])
                    ]),
                    createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10" }, [
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" }, [
                          createVNode("h3", { class: "text-xl font-black text-slate-900 flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5 text-emerald-500",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2.5",
                                d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              })
                            ])),
                            createTextVNode(" Top Search Queries ")
                          ]),
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => queryTrendFilter.value = $event,
                              class: "bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20 py-2 px-4 appearance-none cursor-pointer"
                            }, [
                              createVNode("option", { value: "all" }, "All Trends"),
                              createVNode("option", { value: "growing" }, "Growing ↑"),
                              createVNode("option", { value: "declining" }, "Declining ↓")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, queryTrendFilter.value]
                            ]),
                            createVNode("div", { class: "relative w-full md:w-64" }, [
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => querySearch.value = $event,
                                type: "text",
                                placeholder: "Search queries...",
                                class: "w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelText, querySearch.value]
                              ]),
                              (openBlock(), createBlock("svg", {
                                class: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                })
                              ]))
                            ])
                          ])
                        ]),
                        createVNode("div", { class: "overflow-x-auto" }, [
                          createVNode("table", { class: "w-full text-left" }, [
                            createVNode("thead", null, [
                              createVNode("tr", { class: "border-b border-slate-50" }, [
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Query"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Clicks"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Impressions"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Pos.")
                              ])
                            ]),
                            createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(pagedQueries.value, (query) => {
                                return openBlock(), createBlock("tr", {
                                  key: query.name,
                                  class: "group hover:bg-slate-50 transition-colors"
                                }, [
                                  createVNode("td", { class: "py-4 pr-4" }, [
                                    createVNode("span", {
                                      class: "text-sm font-bold text-slate-700 block truncate max-w-[200px]",
                                      title: query.name
                                    }, toDisplayString(query.name), 9, ["title"])
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("div", { class: "flex flex-col items-end" }, [
                                      createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString((query.clicks || 0).toLocaleString()), 1),
                                      query.delta_clicks ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        class: [query.delta_clicks > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5 mt-0.5"]
                                      }, toDisplayString(query.delta_clicks > 0 ? "↑" : "↓") + " " + toDisplayString(Math.abs(query.delta_clicks).toFixed(1)) + "% ", 3)) : createCommentVNode("", true)
                                    ])
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("span", { class: "text-sm font-medium text-slate-500" }, toDisplayString((query.impressions || 0).toLocaleString()), 1)
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("div", { class: "flex flex-col items-end" }, [
                                      createVNode("span", {
                                        class: ["text-sm font-bold", (query.position || 0) <= 3 ? "text-emerald-500" : "text-slate-600"]
                                      }, toDisplayString((query.position || 0).toFixed(1)), 3),
                                      query.delta_position ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        class: [query.delta_position > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5"]
                                      }, toDisplayString(query.delta_position > 0 ? "↑" : "↓") + " " + toDisplayString(Math.abs(query.delta_position).toFixed(1)) + "% ", 3)) : createCommentVNode("", true)
                                    ])
                                  ])
                                ]);
                              }), 128))
                            ])
                          ]),
                          !pagedQueries.value.length ? (openBlock(), createBlock("p", {
                            key: 0,
                            class: "text-center py-10 text-slate-400 italic text-sm"
                          }, "No query data available")) : createCommentVNode("", true),
                          queryTotalPages.value > 1 ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "flex items-center justify-between pt-6 border-t border-slate-50 mt-4"
                          }, [
                            createVNode("span", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" }, "Page " + toDisplayString(queryPage.value) + " of " + toDisplayString(queryTotalPages.value), 1),
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode("button", {
                                onClick: ($event) => queryPage.value--,
                                disabled: queryPage.value <= 1,
                                class: "p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M15 19l-7-7 7-7"
                                  })
                                ]))
                              ], 8, ["onClick", "disabled"]),
                              createVNode("button", {
                                onClick: ($event) => queryPage.value++,
                                disabled: queryPage.value >= queryTotalPages.value,
                                class: "p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M9 5l7 7-7 7"
                                  })
                                ]))
                              ], 8, ["onClick", "disabled"])
                            ])
                          ])) : createCommentVNode("", true)
                        ])
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                        createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" }, [
                          createVNode("h3", { class: "text-xl font-black text-slate-900 flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5 text-blue-500",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2.5",
                                d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              })
                            ])),
                            createTextVNode(" Top Pages (GSC) ")
                          ]),
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => pageTrendFilter.value = $event,
                              class: "bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 py-2 px-4 appearance-none cursor-pointer"
                            }, [
                              createVNode("option", { value: "all" }, "All Trends"),
                              createVNode("option", { value: "growing" }, "Growing ↑"),
                              createVNode("option", { value: "declining" }, "Declining ↓")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, pageTrendFilter.value]
                            ]),
                            createVNode("div", { class: "relative w-full md:w-64" }, [
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => pageSearch.value = $event,
                                type: "text",
                                placeholder: "Search pages...",
                                class: "w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelText, pageSearch.value]
                              ]),
                              (openBlock(), createBlock("svg", {
                                class: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                })
                              ]))
                            ])
                          ])
                        ]),
                        createVNode("div", { class: "overflow-x-auto" }, [
                          createVNode("table", { class: "w-full text-left" }, [
                            createVNode("thead", null, [
                              createVNode("tr", { class: "border-b border-slate-50" }, [
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Page URL"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Clicks"),
                                createVNode("th", { class: "pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right" }, "Pos.")
                              ])
                            ]),
                            createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(pagedPagesGsc.value, (page) => {
                                return openBlock(), createBlock("tr", {
                                  key: page.name,
                                  class: "group hover:bg-slate-50 transition-colors"
                                }, [
                                  createVNode("td", { class: "py-4 pr-4" }, [
                                    createVNode("span", {
                                      class: "text-sm font-bold text-slate-700 block truncate max-w-[250px]",
                                      title: page.name
                                    }, toDisplayString(page.name.replace(/^https?:\/\/[^\/]+/, "") || "/"), 9, ["title"])
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("div", { class: "flex flex-col items-end" }, [
                                      createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString((page.clicks || 0).toLocaleString()), 1),
                                      page.delta_clicks ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        class: [page.delta_clicks > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5 mt-0.5"]
                                      }, toDisplayString(page.delta_clicks > 0 ? "↑" : "↓") + " " + toDisplayString(Math.abs(page.delta_clicks).toFixed(1)) + "% ", 3)) : createCommentVNode("", true)
                                    ])
                                  ]),
                                  createVNode("td", { class: "py-4 text-right" }, [
                                    createVNode("div", { class: "flex flex-col items-end" }, [
                                      createVNode("span", { class: "text-sm font-bold text-slate-600" }, toDisplayString((page.position || 0).toFixed(1)), 1),
                                      page.delta_position ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        class: [page.delta_position > 0 ? "text-emerald-500" : "text-rose-500", "text-[9px] font-bold flex items-center gap-0.5"]
                                      }, toDisplayString(page.delta_position > 0 ? "↑" : "↓") + " " + toDisplayString(Math.abs(page.delta_position).toFixed(1)) + "% ", 3)) : createCommentVNode("", true)
                                    ])
                                  ])
                                ]);
                              }), 128))
                            ])
                          ]),
                          !pagedPagesGsc.value.length ? (openBlock(), createBlock("p", {
                            key: 0,
                            class: "text-center py-10 text-slate-400 italic text-sm"
                          }, "No page data available")) : createCommentVNode("", true),
                          _ctx.pagesGscTotalPages > 1 ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "flex items-center justify-between pt-6 border-t border-slate-50 mt-4"
                          }, [
                            createVNode("span", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" }, "Page " + toDisplayString(pagePage.value) + " of " + toDisplayString(_ctx.pagesGscTotalPages), 1),
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode("button", {
                                onClick: ($event) => pagePage.value--,
                                disabled: pagePage.value <= 1,
                                class: "p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M15 19l-7-7 7-7"
                                  })
                                ]))
                              ], 8, ["onClick", "disabled"]),
                              createVNode("button", {
                                onClick: ($event) => pagePage.value++,
                                disabled: pagePage.value >= _ctx.pagesGscTotalPages,
                                class: "p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg border border-slate-100 transition-all text-slate-600"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M9 5l7 7-7 7"
                                  })
                                ]))
                              ], 8, ["onClick", "disabled"])
                            ])
                          ])) : createCommentVNode("", true)
                        ])
                      ])
                    ])
                  ], 64))
                ])) : createCommentVNode("", true),
                activeTab.value === "predictions" ? (openBlock(), createBlock("div", { key: 3 }, [
                  createVNode(PredictionsTab, {
                    propertyId: selectedPropertyId.value,
                    organization: __props.organization
                  }, null, 8, ["propertyId", "organization"])
                ])) : createCommentVNode("", true),
                activeTab.value === "developers" ? (openBlock(), createBlock("div", { key: 4 }, [
                  createVNode(_sfc_main$2, {
                    propertyId: selectedPropertyId.value,
                    organization: __props.organization,
                    properties: __props.properties,
                    forecastData: forecastData.value
                  }, null, 8, ["propertyId", "organization", "properties", "forecastData"])
                ])) : createCommentVNode("", true),
                activeTab.value === "web-analysis" ? (openBlock(), createBlock("div", { key: 5 }, [
                  createVNode(WebAnalysisTab, {
                    propertyId: selectedPropertyId.value,
                    organization: __props.organization,
                    properties: __props.properties
                  }, null, 8, ["propertyId", "organization", "properties"])
                ])) : createCommentVNode("", true),
                !__props.properties.length ? (openBlock(), createBlock("div", {
                  key: 6,
                  class: "text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200"
                }, [
                  createVNode("div", { class: "text-6xl mb-6" }, "📊"),
                  createVNode("h2", { class: "text-2xl font-bold text-slate-900" }, "No Analytics Properties Connected"),
                  createVNode("p", { class: "text-slate-500 mt-2" }, "Connect your GA4 property in the settings to start tracking performance."),
                  createVNode(unref(Link), {
                    href: _ctx.route("organization.settings", { tab: "analytics" }),
                    class: "inline-block mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Connect Property ")
                    ]),
                    _: 1
                  }, 8, ["href"])
                ])) : createCommentVNode("", true)
              ]),
              createVNode(Transition, {
                "enter-active-class": "transform transition ease-out duration-300",
                "enter-from-class": "translate-y-10 opacity-0",
                "enter-to-class": "translate-y-0 opacity-100",
                "leave-active-class": "transition ease-in duration-200",
                "leave-from-class": "opacity-100",
                "leave-to-class": "opacity-0"
              }, {
                default: withCtx(() => [
                  showSyncSuccessToast.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed bottom-10 right-10 z-[100]"
                  }, [
                    createVNode("div", { class: "bg-emerald-600 text-white p-6 rounded-[2rem] shadow-2xl border border-emerald-400/30 flex items-center gap-6 backdrop-blur-md" }, [
                      createVNode("div", { class: "w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "3",
                            d: "M5 13l4 4L19 7"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("h4", { class: "text-sm font-black tracking-tight uppercase tracking-widest text-emerald-50" }, "Sync Complete"),
                        createVNode("p", { class: "text-[10px] text-emerald-100 font-medium whitespace-nowrap" }, "Property analytics have been synchronized.")
                      ]),
                      createVNode("button", {
                        onClick: ($event) => showSyncSuccessToast.value = false,
                        class: "text-emerald-200 hover:text-white transition-colors p-2"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M6 18L18 6M6 6l12 12"
                          })
                        ]))
                      ], 8, ["onClick"])
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                _: 1
              })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Analytics/Dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Dashboard = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3f602d42"]]);
export {
  Dashboard as default
};
