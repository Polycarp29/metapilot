import { ref, watch, computed, onMounted, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, toDisplayString, createTextVNode, createCommentVNode, withModifiers, withDirectives, vModelText, vModelSelect, Fragment, renderList, vShow, Transition, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderClass, ssrRenderAttr, ssrRenderStyle, ssrLooseContain, ssrLooseEqual, ssrRenderList } from "vue/server-renderer";
import { useForm, router, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-D17_izsv.js";
import axios from "axios";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Manager",
  __ssrInlineRender: true,
  props: {
    sitemap: Object,
    links: Object,
    duplicateCount: Number
  },
  setup(__props) {
    const props = __props;
    console.log("Manager mounted with props:", {
      sitemap: props.sitemap ? "present" : "MISSING",
      links: props.links ? props.links.data ? props.links.data.length : "no-data" : "MISSING",
      duplicateCount: props.duplicateCount
    });
    const generating = ref(false);
    const crawling = ref(false);
    const generatingJsonLd = ref(false);
    const importing = ref(false);
    const showEditLinkModal = ref(false);
    const showDeleteLinkModal = ref(false);
    const showDeleteContainerModal = ref(false);
    const showAnalysisModal = ref(false);
    const showProgressModal = ref(false);
    const showRecrawlModal = ref(false);
    const showCrawlModeModal = ref(false);
    const manualCrawling = ref(false);
    const showCompletionToast = ref(false);
    const showErrorToast = ref(false);
    const errorToastMessage = ref("");
    const showLinkToast = ref(false);
    const showImportToast = ref(false);
    const importToastMessage = ref("");
    const lastDiscoveredUrl = ref("");
    const discoveredTimeout = ref(null);
    const isFullScreen = ref(false);
    const lastHandledDiscoveredCount = ref(0);
    watch(isFullScreen, (val) => {
      if (val) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
    const handleNewDiscovery = (url) => {
      lastDiscoveredUrl.value = url;
      showLinkToast.value = true;
      if (discoveredTimeout.value) clearTimeout(discoveredTimeout.value);
      discoveredTimeout.value = setTimeout(() => {
        showLinkToast.value = false;
      }, 2500);
    };
    const editingLinkId = ref(null);
    const linkToDelete = ref(null);
    const selectedLink = ref(null);
    const selectedFile = ref(null);
    const analysisLink = ref(null);
    const currentFilter = ref("all");
    const searchQuery = ref("");
    const linksList = computed(() => props.links.data || []);
    const filteredLinks = computed(() => {
      let list = linksList.value;
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        list = list.filter(
          (link) => link.url.toLowerCase().includes(query) || link.title && link.title.toLowerCase().includes(query)
        );
      }
      if (currentFilter.value === "all") return list;
      return list.filter((link) => {
        const isGood = link.http_status === 200 && link.is_canonical;
        const isRedirectOrNonCanonical = link.http_status !== 200 || !link.is_canonical;
        const hasIssues = link.seo_audit?.errors?.length > 0 || link.seo_audit?.warnings?.length > 0;
        if (currentFilter.value === "good") return isGood;
        if (currentFilter.value === "issues") return hasIssues;
        if (currentFilter.value === "redirects") return isRedirectOrNonCanonical;
        if (currentFilter.value === "discovered") return link.status === "discovered";
        return true;
      });
    });
    const stats = computed(() => {
      const all = props.links.total ?? linksList.value.length;
      const good = linksList.value.filter((l) => l.http_status === 200 && l.is_canonical).length;
      const issues = linksList.value.filter((l) => l.seo_audit?.errors?.length > 0 || l.seo_audit?.warnings?.length > 0).length;
      const redirects = linksList.value.filter((l) => l.http_status !== 200 || !l.is_canonical).length;
      const discovered = linksList.value.filter((l) => l.status === "discovered").length;
      return { all, good, issues, redirects, discovered };
    });
    onMounted(() => {
      if (["dispatched", "crawling"].includes(props.sitemap.last_crawl_status) && props.sitemap.last_crawl_job_id) {
        console.log("Resuming crawl polling for job:", props.sitemap.last_crawl_job_id);
        crawling.value = true;
        startPolling(props.sitemap.last_crawl_job_id);
      }
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    });
    const crawlProgress = ref({
      status: "pending",
      current_url: "",
      total_discovered: 0,
      total_crawled: 0,
      logs: []
    });
    const linkForm = useForm({
      url: "",
      changefreq: "daily",
      priority: 0.7
    });
    const editLinkForm = useForm({
      url: "",
      changefreq: "daily",
      priority: 0.7
    });
    const handleFileUpload = (e) => {
      selectedFile.value = e.target.files[0];
    };
    const importLinks = () => {
      if (!selectedFile.value) return;
      importing.value = true;
      const formData = new FormData();
      formData.append("file", selectedFile.value);
      router.post(route("sitemaps.import", props.sitemap.id), formData, {
        onSuccess: (page) => {
          importing.value = false;
          selectedFile.value = null;
          const flash = page?.props?.flash?.message || page?.props?.message;
          importToastMessage.value = flash || "Links imported successfully!";
          showImportToast.value = true;
          setTimeout(() => {
            showImportToast.value = false;
          }, 5e3);
        },
        onError: () => {
          importing.value = false;
          errorToastMessage.value = "Import failed. Please check the file format.";
          showErrorToast.value = true;
          setTimeout(() => {
            showErrorToast.value = false;
          }, 5e3);
        }
      });
    };
    const addSingleLink = () => {
      linkForm.post(route("sitemaps.links.store", props.sitemap.id), {
        onSuccess: () => {
          linkForm.reset("url");
          const tableEl = document.querySelector("tbody");
          if (tableEl) tableEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    };
    const editLink = (link) => {
      editingLinkId.value = link.id;
      editLinkForm.url = link.url;
      editLinkForm.changefreq = link.changefreq;
      editLinkForm.priority = link.priority;
      showEditLinkModal.value = true;
    };
    const closeEditModal = () => {
      showEditLinkModal.value = false;
      setTimeout(() => {
        editingLinkId.value = null;
        editLinkForm.reset();
      }, 400);
    };
    const updateLink = () => {
      editLinkForm.put(route("sitemaps.links.update", editingLinkId.value), {
        onSuccess: () => closeEditModal()
      });
    };
    const deleteLink = (link) => {
      linkToDelete.value = link;
      showDeleteLinkModal.value = true;
    };
    const confirmDeleteLink = () => {
      if (!linkToDelete.value) return;
      router.delete(route("sitemaps.links.destroy", linkToDelete.value.id), {
        onSuccess: () => {
          showDeleteLinkModal.value = false;
          linkToDelete.value = null;
        }
      });
    };
    const deleteSitemap = () => {
      showDeleteContainerModal.value = true;
    };
    const confirmDeleteContainer = () => {
      router.delete(route("sitemaps.destroy", props.sitemap.id), {
        onSuccess: () => {
          showDeleteContainerModal.value = false;
        }
      });
    };
    const generateXml = async () => {
      generating.value = true;
      try {
        const response = await axios.post(route("sitemaps.generate", props.sitemap.id), {}, {
          responseType: "blob"
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = props.sitemap.filename || "sitemap.xml";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Generate XML error:", e);
      } finally {
        generating.value = false;
      }
    };
    let progressInterval = null;
    const startPolling = (jobId) => {
      if (progressInterval) stopPolling();
      console.log("Starting polling for job:", jobId);
      progressInterval = setInterval(async () => {
        try {
          const response = await axios.get(route("sitemaps.jobs.progress", jobId));
          const data = response.data;
          const previousStatus = crawlProgress.value.status;
          crawlProgress.value = data;
          const isFullyProcessed = data.status === "completed" && data.total_crawled >= data.total_discovered;
          if (isFullyProcessed && previousStatus !== "completed") {
            stopPolling();
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Sync Complete! ✨", {
                body: `The SEO intelligence scan for ${props.sitemap.name} has finished and all data is processed.`,
                icon: "/favicon.ico"
              });
            }
            router.reload({ preserveScroll: true });
            showCompletionToast.value = true;
            setTimeout(() => showCompletionToast.value = false, 8e3);
          }
          if (data.status === "failed" || data.status === "error") {
            stopPolling();
          }
          const hasNewDiscoveries = data.total_discovered > lastHandledDiscoveredCount.value && data.total_discovered > props.links.total;
          if (hasNewDiscoveries) {
            console.log("Forcing refresh: New links detected in engine.");
            lastHandledDiscoveredCount.value = data.total_discovered;
            handleNewDiscovery(data.current_url || "New URL");
            router.reload({ only: ["links"], preserveScroll: true, preserveState: true });
          } else if (data.status === "crawling" && data.total_crawled % 4 === 0) {
            router.reload({ only: ["links"], preserveScroll: true, preserveState: true });
          }
          if (isFullyProcessed || data.status === "failed") {
            console.log("Crawl finished. Status:", data.status);
            stopPolling();
            router.reload({
              only: ["links"],
              preserveScroll: true,
              preserveState: true
            });
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2e3);
    };
    const stopPolling = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };
    const triggerCrawl = async () => {
      console.log("Triggering crawl audit from UI...");
      if (crawling.value) return;
      crawling.value = true;
      showProgressModal.value = true;
      crawlProgress.value.status = "dispatched";
      crawlProgress.value.logs = ["Dispatched job to queue..."];
      try {
        const response = await axios.post(route("sitemaps.crawl", props.sitemap.id), {
          starting_url: props.sitemap.site_url,
          max_depth: 3,
          render_js: true
        }, {
          headers: { "Accept": "application/json" }
        });
        console.log("Server response:", response.data);
        if (response.data && response.data.job_id) {
          console.log("Initiating polling for:", response.data.job_id);
          startPolling(response.data.job_id);
        } else {
          console.warn("No job_id returned from server");
          crawlProgress.value.status = "error";
          crawlProgress.value.logs.push("Error: Server did not return a Job ID.");
        }
      } catch (e) {
        console.error("Crawl trigger error:", e);
        crawlProgress.value.status = "failed";
        crawlProgress.value.logs.push("Critical Error: " + (e.response?.data?.message || e.message));
      } finally {
        crawling.value = false;
      }
    };
    const cancelCrawl = () => {
      if (!confirm("This will immediately terminate the crawler and stop discovery. Continue?")) return;
      router.post(route("sitemaps.cancel-crawl", props.sitemap.id), {}, {
        onSuccess: () => {
          stopPolling();
          showProgressModal.value = false;
          crawling.value = false;
        },
        onError: () => {
          showProgressModal.value = false;
        }
      });
    };
    const analyzeLink = (link) => {
      selectedLink.value = link;
      showCrawlModeModal.value = true;
    };
    const openIntelligenceReport = () => {
      showCrawlModeModal.value = false;
      showAnalysisModal.value = true;
    };
    const selectAutoCrawl = (link) => {
      showCrawlModeModal.value = false;
      router.post(route("sitemaps.links.recrawl", link.id), {}, {
        onSuccess: () => {
          showAnalysisModal.value = true;
        }
      });
    };
    const manualCrawl = async (link) => {
      manualCrawling.value = true;
      try {
        const response = await axios.post(route("sitemaps.links.manual-analyze", link.id), {}, {
          headers: { "Accept": "application/json" }
        });
        if (response.data?.success && response.data?.link) {
          selectedLink.value = { ...selectedLink.value, ...response.data.link };
        }
        showCrawlModeModal.value = false;
        showAnalysisModal.value = true;
      } catch (err) {
        errorToastMessage.value = err.response?.data?.message || "Manual analysis failed. The site may be blocking all requests.";
        showErrorToast.value = true;
        setTimeout(() => {
          showErrorToast.value = false;
        }, 5e3);
      } finally {
        manualCrawling.value = false;
      }
    };
    const autoGenerateAiSchema = () => {
      if (selectedLink.value) {
        generateJsonLd(selectedLink.value);
      }
    };
    const generateJsonLd = (link) => {
      generatingJsonLd.value = true;
      router.post(route("sitemaps.links.generate-json-ld", link.id), {}, {
        onSuccess: () => {
          generatingJsonLd.value = false;
        },
        onError: () => {
          generatingJsonLd.value = false;
        }
      });
    };
    const analyzeAi = (link) => {
      if (analysisLink.value) return;
      analysisLink.value = link.id;
      router.post(route("sitemaps.links.ai-analyze", link.id), {}, {
        onSuccess: () => {
          analysisLink.value = null;
        },
        onError: () => {
          analysisLink.value = null;
        }
      });
    };
    const recrawlLink = (link) => {
      router.post(route("sitemaps.links.recrawl", link.id), {}, {
        onSuccess: () => {
        }
      });
    };
    const confirmRecrawlAll = async () => {
      showRecrawlModal.value = false;
      if (crawling.value) return;
      crawling.value = true;
      showProgressModal.value = true;
      crawlProgress.value.status = "dispatched";
      crawlProgress.value.logs = ["Initiating sitemap-wide sync..."];
      try {
        const response = await axios.post(route("sitemaps.recrawl-all", props.sitemap.id), {}, {
          headers: { "Accept": "application/json" }
        });
        if (response.data && response.data.job_id) {
          startPolling(response.data.job_id);
        }
      } catch (e) {
        console.error("Recrawl error:", e);
        crawlProgress.value.status = "failed";
      } finally {
        crawling.value = false;
      }
    };
    const openLiveConsole = () => {
      if (props.sitemap.last_crawl_job_id) {
        if (!progressInterval) {
          startPolling(props.sitemap.last_crawl_job_id);
        }
        showProgressModal.value = true;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        title: __props.sitemap ? "Manage: " + __props.sitemap.name : "Sitemap Intelligence"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.sitemap) {
              _push2(`<div class="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-8 py-10 relative" data-v-18b5b6e1${_scopeId}><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm" data-v-18b5b6e1${_scopeId}><div class="flex items-center gap-6" data-v-18b5b6e1${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: "/sitemaps",
                class: "w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-standard"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-v-18b5b6e1${_scopeId2}></path></svg>`);
                  } else {
                    return [
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
                          d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                        })
                      ]))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`<div data-v-18b5b6e1${_scopeId}><h1 class="text-3xl font-black text-slate-900 tracking-tight" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(__props.sitemap.name)}</h1><p class="text-slate-500 font-medium text-sm mt-1" data-v-18b5b6e1${_scopeId}>Stored as <code data-v-18b5b6e1${_scopeId}>/${ssrInterpolate(__props.sitemap.filename)}</code></p></div></div><div class="flex flex-wrap items-center gap-3 w-full md:w-auto" data-v-18b5b6e1${_scopeId}><div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100" data-v-18b5b6e1${_scopeId}><button${ssrIncludeBooleanAttr(crawling.value) ? " disabled" : ""} class="h-10 bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-50" data-v-18b5b6e1${_scopeId}><svg class="${ssrRenderClass([{ "animate-spin": crawling.value }, "w-3 h-3"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-18b5b6e1${_scopeId}></path></svg> Recrawl </button>`);
              if (__props.links.total > 0) {
                _push2(`<a${ssrRenderAttr("href", _ctx.route("sitemaps.export", __props.sitemap.id))} class="h-10 bg-white hover:bg-emerald-50 text-emerald-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-emerald-200" title="Export CSV" data-v-18b5b6e1${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" data-v-18b5b6e1${_scopeId}></path></svg> CSV </a>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.links.total > 0) {
                _push2(`<a${ssrRenderAttr("href", _ctx.route("sitemaps.export-pdf", __props.sitemap.id))} class="h-10 bg-white hover:bg-rose-50 text-rose-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-rose-200" title="Export PDF" data-v-18b5b6e1${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" data-v-18b5b6e1${_scopeId}></path></svg> PDF </a>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<button class="h-10 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 border border-slate-200 hover:border-red-200" title="Delete Container" data-v-18b5b6e1${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-18b5b6e1${_scopeId}></path></svg></button></div><div class="flex items-center gap-2" data-v-18b5b6e1${_scopeId}>`);
              if (crawling.value || __props.sitemap.last_crawl_status === "dispatched" || __props.sitemap.last_crawl_status === "crawling") {
                _push2(`<button class="h-12 bg-blue-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard flex items-center gap-3 shadow-xl shadow-blue-200" data-v-18b5b6e1${_scopeId}><span class="relative flex h-2 w-2" data-v-18b5b6e1${_scopeId}><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" data-v-18b5b6e1${_scopeId}></span><span class="relative inline-flex rounded-full h-2 w-2 bg-white" data-v-18b5b6e1${_scopeId}></span></span> Console </button>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<button type="button"${ssrIncludeBooleanAttr(crawling.value) ? " disabled" : ""} class="h-12 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl shadow-indigo-200 disabled:opacity-50" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(crawling.value ? "Scanning..." : "Start Scan")}</button><button${ssrIncludeBooleanAttr(generating.value) ? " disabled" : ""} class="h-12 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(generating.value ? "Building..." : "Build XML")}</button></div></div></div><div class="grid grid-cols-1 lg:grid-cols-4 gap-10" data-v-18b5b6e1${_scopeId}><div class="space-y-8" data-v-18b5b6e1${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium" data-v-18b5b6e1${_scopeId}><h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between" data-v-18b5b6e1${_scopeId}> Bulk Data <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] lowercase" data-v-18b5b6e1${_scopeId}>csv import</span></h4><form class="space-y-6" data-v-18b5b6e1${_scopeId}><div class="group relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-standard" data-v-18b5b6e1${_scopeId}><input type="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv,.txt,.xml" data-v-18b5b6e1${_scopeId}><div class="space-y-2" data-v-18b5b6e1${_scopeId}><svg class="w-8 h-8 text-slate-300 mx-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" data-v-18b5b6e1${_scopeId}></path></svg><p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedFile.value ? selectedFile.value.name : "Choose CSV")}</p></div></div><button type="submit"${ssrIncludeBooleanAttr(importing.value || !selectedFile.value) ? " disabled" : ""} class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black transition-standard active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(importing.value ? "Syncing..." : "Sync Links")}</button></form></div>`);
              if (__props.duplicateCount > 0) {
                _push2(`<div class="bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8" data-v-18b5b6e1${_scopeId}><div class="flex items-center gap-4 mb-4" data-v-18b5b6e1${_scopeId}><div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-18b5b6e1${_scopeId}></path></svg></div><h4 class="text-sm font-black text-amber-900 uppercase tracking-widest leading-tight" data-v-18b5b6e1${_scopeId}>Optimization Alert</h4></div><p class="text-amber-800 text-xs font-medium leading-relaxed" data-v-18b5b6e1${_scopeId}>We detected <strong data-v-18b5b6e1${_scopeId}>${ssrInterpolate(__props.duplicateCount)} duplicate URLs</strong> present in other sitemaps. Auto-canonical tags will be prioritized for these links.</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (crawling.value || crawlProgress.value.status !== "pending") {
                _push2(`<div class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm" data-v-18b5b6e1${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center" data-v-18b5b6e1${_scopeId}> Crawl Activity `);
                if (crawling.value) {
                  _push2(`<span class="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" data-v-18b5b6e1${_scopeId}></span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</h4><div class="space-y-4" data-v-18b5b6e1${_scopeId}><div class="flex justify-between items-end" data-v-18b5b6e1${_scopeId}><span class="text-[10px] font-bold text-slate-500 uppercase" data-v-18b5b6e1${_scopeId}>Progress</span><span class="text-xs font-black text-slate-900" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(Math.round(crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100))}%</span></div><div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="h-full bg-blue-600 transition-all duration-500" style="${ssrRenderStyle({ width: `${crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100}%` })}" data-v-18b5b6e1${_scopeId}></div></div><div class="pt-2" data-v-18b5b6e1${_scopeId}><p class="text-[9px] font-medium text-slate-400 truncate" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(crawlProgress.value.current_url || "Waiting...")}</p></div>`);
                if (crawlProgress.value.status === "completed") {
                  _push2(`<button class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-colors" data-v-18b5b6e1${_scopeId}> Refresh List </button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl" data-v-18b5b6e1${_scopeId}><h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6" data-v-18b5b6e1${_scopeId}>Internal Addition</h4><form class="space-y-4" data-v-18b5b6e1${_scopeId}><input${ssrRenderAttr("value", unref(linkForm).url)} type="url" placeholder="https://..." class="w-full bg-white/10 border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard" required data-v-18b5b6e1${_scopeId}><div class="grid grid-cols-2 gap-3" data-v-18b5b6e1${_scopeId}><select class="bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-widest appearance-none focus:bg-white focus:text-slate-900 transition-standard" data-v-18b5b6e1${_scopeId}><option value="daily" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(linkForm).changefreq) ? ssrLooseContain(unref(linkForm).changefreq, "daily") : ssrLooseEqual(unref(linkForm).changefreq, "daily")) ? " selected" : ""}${_scopeId}>Daily</option><option value="weekly" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(linkForm).changefreq) ? ssrLooseContain(unref(linkForm).changefreq, "weekly") : ssrLooseEqual(unref(linkForm).changefreq, "weekly")) ? " selected" : ""}${_scopeId}>Weekly</option><option value="monthly" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(linkForm).changefreq) ? ssrLooseContain(unref(linkForm).changefreq, "monthly") : ssrLooseEqual(unref(linkForm).changefreq, "monthly")) ? " selected" : ""}${_scopeId}>Monthly</option></select><input${ssrRenderAttr("value", unref(linkForm).priority)} type="number" step="0.1" min="0" max="1" class="bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard" placeholder="0.5" data-v-18b5b6e1${_scopeId}></div><button type="submit" class="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-standard active:scale-95 shadow-lg shadow-blue-900/40 mt-2" data-v-18b5b6e1${_scopeId}> Add Link </button></form></div></div><div class="${ssrRenderClass([
                "lg:col-span-3 space-y-6 transition-all duration-500",
                isFullScreen.value ? "fixed inset-0 z-[100] bg-slate-50 p-8 overflow-y-auto" : ""
              ])}" data-v-18b5b6e1${_scopeId}><div class="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm" data-v-18b5b6e1${_scopeId}><div class="relative flex-grow w-full" data-v-18b5b6e1${_scopeId}><div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none" data-v-18b5b6e1${_scopeId}><svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-18b5b6e1${_scopeId}></path></svg></div><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Search URLs or page titles..." class="block w-full pl-12 pr-4 h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:bg-white focus:border-indigo-300 transition-standard" data-v-18b5b6e1${_scopeId}></div><div class="flex items-center gap-4 w-full md:w-auto" data-v-18b5b6e1${_scopeId}><div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100" data-v-18b5b6e1${_scopeId}><!--[-->`);
              ssrRenderList(["all", "good", "issues", "redirects", "discovered"], (filter) => {
                _push2(`<button class="${ssrRenderClass([
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  currentFilter.value === filter ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                ])}" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(filter)}</button>`);
              });
              _push2(`<!--]--></div><button class="${ssrRenderClass([
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-standard active:scale-95 border",
                isFullScreen.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-900 hover:text-slate-900"
              ])}"${ssrRenderAttr("title", isFullScreen.value ? "Exit Full Screen" : "Expand to Full Screen")} data-v-18b5b6e1${_scopeId}>`);
              if (!isFullScreen.value) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" data-v-18b5b6e1${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg>`);
              }
              _push2(`</button></div></div><div class="grid grid-cols-2 lg:grid-cols-5 gap-4" data-v-18b5b6e1${_scopeId}><!--[-->`);
              ssrRenderList(["all", "good", "issues", "redirects", "discovered"], (filter) => {
                _push2(`<button class="${ssrRenderClass([
                  "p-5 rounded-2xl border flex flex-col gap-3 transition-all text-left group relative overflow-hidden",
                  currentFilter.value === filter ? filter === "good" ? "bg-emerald-600 border-emerald-600 shadow-lg text-white" : filter === "issues" ? "bg-amber-500 border-amber-500 shadow-lg text-white" : filter === "redirects" ? "bg-indigo-600 border-indigo-600 shadow-lg text-white" : filter === "discovered" ? "bg-blue-600 border-blue-600 shadow-lg text-white" : "bg-slate-900 border-slate-900 shadow-lg text-white" : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                ])}" data-v-18b5b6e1${_scopeId}><div class="flex items-center justify-between w-full" data-v-18b5b6e1${_scopeId}><span class="${ssrRenderClass(["text-[9px] font-black uppercase tracking-[0.2em]", currentFilter.value === filter ? "opacity-70" : "text-slate-400"])}" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(filter === "redirects" ? "Non-Canonical" : filter === "good" ? "Indexable" : filter)}</span><div class="${ssrRenderClass(["w-8 h-8 rounded-lg flex items-center justify-center transition-colors", currentFilter.value === filter ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"])}" data-v-18b5b6e1${_scopeId}>`);
                if (filter === "all") {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" data-v-18b5b6e1${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                if (filter === "good") {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-18b5b6e1${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                if (filter === "issues") {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-18b5b6e1${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                if (filter === "redirects") {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" data-v-18b5b6e1${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                if (filter === "discovered") {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-18b5b6e1${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="text-2xl font-black tracking-tight leading-none" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(stats.value[filter])}</div></button>`);
              });
              _push2(`<!--]--></div><div class="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar" data-v-18b5b6e1${_scopeId}><table class="w-full text-left border-collapse" data-v-18b5b6e1${_scopeId}><thead class="sticky top-0 z-10 bg-slate-50 shadow-sm" data-v-18b5b6e1${_scopeId}><tr class="bg-slate-50 border-b border-slate-100" data-v-18b5b6e1${_scopeId}><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-18b5b6e1${_scopeId}>Live URL Intelligence</th><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" data-v-18b5b6e1${_scopeId}>Audit Score</th><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" data-v-18b5b6e1${_scopeId}>SEO Health</th><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" data-v-18b5b6e1${_scopeId}>Freq</th><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" data-v-18b5b6e1${_scopeId}>Priority</th><th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right" data-v-18b5b6e1${_scopeId}>Actions</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-18b5b6e1${_scopeId}>`);
              if (filteredLinks.value.length === 0) {
                _push2(`<tr class="bg-white" data-v-18b5b6e1${_scopeId}><td colspan="6" class="px-8 py-20 text-center" data-v-18b5b6e1${_scopeId}><div class="space-y-4" data-v-18b5b6e1${_scopeId}><div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300" data-v-18b5b6e1${_scopeId}><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-18b5b6e1${_scopeId}></path></svg></div><p class="text-sm font-bold text-slate-500 uppercase tracking-widest" data-v-18b5b6e1${_scopeId}>No links found for this filter.</p><button class="text-xs font-black text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]" data-v-18b5b6e1${_scopeId}>Reset All Filters</button></div></td></tr>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--[-->`);
              ssrRenderList(filteredLinks.value, (link) => {
                _push2(`<tr class="group hover:bg-slate-50/50 transition-colors" data-v-18b5b6e1${_scopeId}><td class="px-8 py-5" data-v-18b5b6e1${_scopeId}><div class="flex items-center gap-3" data-v-18b5b6e1${_scopeId}><div class="${ssrRenderClass([
                  "w-2 h-2 rounded-full flex-shrink-0",
                  link.status === "completed" ? "bg-emerald-500" : link.status === "crawling" ? "bg-blue-500 animate-pulse" : link.status === "discovered" ? "bg-amber-400 animate-pulse" : "bg-slate-300"
                ])}" data-v-18b5b6e1${_scopeId}></div><div class="flex flex-col min-w-0" data-v-18b5b6e1${_scopeId}><span class="text-sm font-bold text-slate-900 tracking-tight truncate" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.url)}</span><div class="flex items-center gap-2" data-v-18b5b6e1${_scopeId}>`);
                if (link.title) {
                  _push2(`<span class="text-[9px] font-medium text-slate-400 line-clamp-1" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.title)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (link.status === "discovered") {
                  _push2(`<span class="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase" data-v-18b5b6e1${_scopeId}>Discovered</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (link.is_canonical === false && link.status === "completed") {
                  _push2(`<span class="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase"${ssrRenderAttr("title", "Points to: " + link.canonical_url)} data-v-18b5b6e1${_scopeId}>Non-Canonical</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (link.http_status && link.http_status >= 300) {
                  _push2(`<span class="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase" data-v-18b5b6e1${_scopeId}>Redirect ${ssrInterpolate(link.http_status)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (link.depth_from_root > 0) {
                  _push2(`<span class="text-[8px] font-bold text-slate-400" data-v-18b5b6e1${_scopeId}>Depth ${ssrInterpolate(link.depth_from_root)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div></td><td class="px-8 py-5 text-center" data-v-18b5b6e1${_scopeId}>`);
                if (link.seo_audit) {
                  _push2(`<div class="${ssrRenderClass([
                    "inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-black border-4",
                    link.seo_audit.score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : link.seo_audit.score >= 70 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-red-600 bg-red-50 border-red-100"
                  ])}" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.seo_audit.score)}</div>`);
                } else {
                  _push2(`<span class="text-[10px] font-bold text-slate-300" data-v-18b5b6e1${_scopeId}>--</span>`);
                }
                _push2(`</td><td class="px-8 py-5 text-center" data-v-18b5b6e1${_scopeId}>`);
                if (link.url_slug_quality) {
                  _push2(`<div class="flex flex-col items-center gap-1" data-v-18b5b6e1${_scopeId}><span class="${ssrRenderClass([
                    "inline-block w-3 h-3 rounded-full",
                    link.url_slug_quality === "good" ? "bg-emerald-400" : link.url_slug_quality === "warning" ? "bg-amber-400" : "bg-red-400"
                  ])}" data-v-18b5b6e1${_scopeId}></span><span class="${ssrRenderClass([
                    "text-[8px] font-black uppercase tracking-wider",
                    link.url_slug_quality === "good" ? "text-emerald-600" : link.url_slug_quality === "warning" ? "text-amber-600" : "text-red-600"
                  ])}" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.url_slug_quality)}</span>`);
                  if (link.seo_bottlenecks && link.seo_bottlenecks.length) {
                    _push2(`<div class="group/tip relative" data-v-18b5b6e1${_scopeId}><span class="text-[8px] font-bold text-slate-400 cursor-help underline decoration-dotted" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.seo_bottlenecks.length)} issue${ssrInterpolate(link.seo_bottlenecks.length > 1 ? "s" : "")}</span><div class="hidden group-hover/tip:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white p-3 rounded-xl text-[9px] font-medium z-50 shadow-xl" data-v-18b5b6e1${_scopeId}><!--[-->`);
                    ssrRenderList(link.seo_bottlenecks, (b, bi) => {
                      _push2(`<div class="py-1 border-b border-slate-700 last:border-0" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(b.message)}</div>`);
                    });
                    _push2(`<!--]--></div></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div>`);
                } else {
                  _push2(`<span class="text-[10px] font-bold text-slate-300" data-v-18b5b6e1${_scopeId}>--</span>`);
                }
                _push2(`</td><td class="px-8 py-5 text-center" data-v-18b5b6e1${_scopeId}><span class="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.changefreq)}</span></td><td class="px-8 py-5 text-center" data-v-18b5b6e1${_scopeId}><div class="w-12 mx-auto bg-slate-100 rounded-lg py-1 text-[11px] font-bold text-slate-600" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(link.priority)}</div></td><td class="px-8 py-5 text-right" data-v-18b5b6e1${_scopeId}><div class="flex items-center justify-end gap-1" data-v-18b5b6e1${_scopeId}><button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard" title="Analyze Link Results" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" data-v-18b5b6e1${_scopeId}></path></svg></button><button class="${ssrRenderClass([
                  "p-2 rounded-xl transition-standard group/ai",
                  link.ai_schema_data ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                ])}"${ssrRenderAttr("title", link.ai_schema_data ? "AI Data Ready" : "AI Content Analysis")} data-v-18b5b6e1${_scopeId}><svg class="${ssrRenderClass([{ "animate-pulse": !link.ai_schema_data && analysisLink.value === link.id }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" data-v-18b5b6e1${_scopeId}></path></svg></button><button class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-standard" title="Recrawl Individual Link" data-v-18b5b6e1${_scopeId}><svg class="${ssrRenderClass([{ "animate-spin-slow": link.status === "crawling" }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-18b5b6e1${_scopeId}></path></svg></button><button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard" title="Edit Link" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" data-v-18b5b6e1${_scopeId}></path></svg></button><button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard" title="Remove Link" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-18b5b6e1${_scopeId}></path></svg></button><span class="text-[10px] font-bold text-slate-400 ml-2" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(new Date(link.created_at).toLocaleDateString())}</span></div></td></tr>`);
              });
              _push2(`<!--]--></tbody></table></div><div class="px-8 py-8 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center" data-v-18b5b6e1${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-18b5b6e1${_scopeId}>Page ${ssrInterpolate(__props.links.current_page)} of ${ssrInterpolate(__props.links.last_page)}</p><div class="flex items-center gap-2" data-v-18b5b6e1${_scopeId}><!--[-->`);
              ssrRenderList(__props.links.links, (pLink) => {
                _push2(ssrRenderComponent(unref(Link), {
                  key: pLink.label,
                  href: pLink.url || "#",
                  class: [
                    "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-standard",
                    pLink.active ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-100"
                  ]
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div></div></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showEditLinkModal.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" data-v-18b5b6e1${_scopeId}><button class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button><h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight" data-v-18b5b6e1${_scopeId}>Edit Link</h2><form class="space-y-8" data-v-18b5b6e1${_scopeId}><div class="space-y-3" data-v-18b5b6e1${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-18b5b6e1${_scopeId}>URL</label><input${ssrRenderAttr("value", unref(editLinkForm).url)} type="url" placeholder="https://..." class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required data-v-18b5b6e1${_scopeId}></div><div class="grid grid-cols-2 gap-6" data-v-18b5b6e1${_scopeId}><div class="space-y-3" data-v-18b5b6e1${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-18b5b6e1${_scopeId}>Change Frequency</label><select class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold appearance-none" data-v-18b5b6e1${_scopeId}><option value="daily" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(editLinkForm).changefreq) ? ssrLooseContain(unref(editLinkForm).changefreq, "daily") : ssrLooseEqual(unref(editLinkForm).changefreq, "daily")) ? " selected" : ""}${_scopeId}>Daily</option><option value="weekly" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(editLinkForm).changefreq) ? ssrLooseContain(unref(editLinkForm).changefreq, "weekly") : ssrLooseEqual(unref(editLinkForm).changefreq, "weekly")) ? " selected" : ""}${_scopeId}>Weekly</option><option value="monthly" data-v-18b5b6e1${ssrIncludeBooleanAttr(Array.isArray(unref(editLinkForm).changefreq) ? ssrLooseContain(unref(editLinkForm).changefreq, "monthly") : ssrLooseEqual(unref(editLinkForm).changefreq, "monthly")) ? " selected" : ""}${_scopeId}>Monthly</option></select></div><div class="space-y-3" data-v-18b5b6e1${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-18b5b6e1${_scopeId}>Priority</label><input${ssrRenderAttr("value", unref(editLinkForm).priority)} type="number" step="0.1" min="0" max="1" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" data-v-18b5b6e1${_scopeId}></div></div><button${ssrIncludeBooleanAttr(unref(editLinkForm).processing) ? " disabled" : ""} type="submit" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4" data-v-18b5b6e1${_scopeId}> Save Link </button></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showDeleteLinkModal.value) {
              _push2(`<div class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="absolute top-0 left-0 w-full h-2 bg-red-500" data-v-18b5b6e1${_scopeId}></div><div class="flex flex-col items-center text-center space-y-6" data-v-18b5b6e1${_scopeId}><div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" data-v-18b5b6e1${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><h2 class="text-2xl font-black text-slate-900 mb-2" data-v-18b5b6e1${_scopeId}>Remove Link?</h2><p class="text-slate-500 font-medium px-4" data-v-18b5b6e1${_scopeId}>This will remove <span class="text-slate-900 font-bold break-all" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(linkToDelete.value?.url)}</span> from the sitemap.</p></div><div class="flex flex-col w-full gap-3 pt-4" data-v-18b5b6e1${_scopeId}><button class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Confirm Removal </button><button class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Cancel </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showDeleteContainerModal.value) {
              _push2(`<div class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="absolute top-0 left-0 w-full h-2 bg-red-500" data-v-18b5b6e1${_scopeId}></div><div class="flex flex-col items-center text-center space-y-6" data-v-18b5b6e1${_scopeId}><div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" data-v-18b5b6e1${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><h2 class="text-2xl font-black text-slate-900 mb-2" data-v-18b5b6e1${_scopeId}>Delete Entire Sitemap?</h2><p class="text-slate-500 font-medium px-4" data-v-18b5b6e1${_scopeId}>All links within <span class="text-slate-900 font-bold" data-v-18b5b6e1${_scopeId}>&quot;${ssrInterpolate(__props.sitemap.name)}&quot;</span> will be permanently lost. This action is irreversible.</p></div><div class="flex flex-col w-full gap-3 pt-4" data-v-18b5b6e1${_scopeId}><button class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Yes, Delete Container </button><button class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Cancel </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showRecrawlModal.value) {
              _push2(`<div class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden border border-slate-100" data-v-18b5b6e1${_scopeId}><div class="absolute top-0 left-0 w-full h-2 bg-slate-900" data-v-18b5b6e1${_scopeId}></div><div class="flex flex-col items-center text-center space-y-6" data-v-18b5b6e1${_scopeId}><div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg shadow-slate-200/50" data-v-18b5b6e1${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><h2 class="text-2xl font-black text-slate-900 mb-2" data-v-18b5b6e1${_scopeId}>Recrawl All Links?</h2><p class="text-slate-500 font-medium px-4" data-v-18b5b6e1${_scopeId}>This will reset all internal statuses and restart the intelligence scan. Existing links will be re-verified.</p></div><div class="flex flex-col w-full gap-3 pt-4" data-v-18b5b6e1${_scopeId}><button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Yes, Start Sync </button><button class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95" data-v-18b5b6e1${_scopeId}> Back to Safety </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showCrawlModeModal.value) {
              _push2(`<div class="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] p-10 relative scale-in-center overflow-hidden border border-slate-100" data-v-18b5b6e1${_scopeId}><div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-t-[3rem]" data-v-18b5b6e1${_scopeId}></div><button class="absolute top-8 right-8 w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button><div class="mb-8 text-center pt-4" data-v-18b5b6e1${_scopeId}><div class="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100" data-v-18b5b6e1${_scopeId}><svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" data-v-18b5b6e1${_scopeId}></path></svg></div><h2 class="text-2xl font-black text-slate-900 tracking-tight" data-v-18b5b6e1${_scopeId}>Choose Analysis Mode</h2><p class="text-slate-500 text-sm font-medium mt-2 px-4 truncate" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedLink.value?.url)}</p></div>`);
              if (!manualCrawling.value) {
                _push2(`<div class="grid grid-cols-2 gap-4" data-v-18b5b6e1${_scopeId}><button class="group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-left" data-v-18b5b6e1${_scopeId}><div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-blue-100 group-hover:bg-blue-100 transition-all" data-v-18b5b6e1${_scopeId}><svg class="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-18b5b6e1${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-700" data-v-18b5b6e1${_scopeId}>View Report</p><p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" data-v-18b5b6e1${_scopeId}>See last crawled data instantly</p></div><span class="text-[9px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors" data-v-18b5b6e1${_scopeId}>Instant</span></button><button class="group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 text-left" data-v-18b5b6e1${_scopeId}><div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 group-hover:bg-indigo-100 transition-all" data-v-18b5b6e1${_scopeId}><svg class="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2M12 3v1" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-700" data-v-18b5b6e1${_scopeId}>Auto Crawl</p><p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" data-v-18b5b6e1${_scopeId}>Python + Playwright full render</p></div><span class="text-[9px] bg-indigo-50 text-indigo-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors" data-v-18b5b6e1${_scopeId}>Async</span></button><button class="group col-span-2 relative flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 text-left" data-v-18b5b6e1${_scopeId}><div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-emerald-100 group-hover:bg-emerald-100 transition-all flex-shrink-0" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-18b5b6e1${_scopeId}></path></svg></div><div class="flex-grow" data-v-18b5b6e1${_scopeId}><p class="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-emerald-700" data-v-18b5b6e1${_scopeId}>Manual Crawl</p><p class="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" data-v-18b5b6e1${_scopeId}>Real browser headers. Works on bot-resistant sites. Extracts full SEO data synchronously.</p></div><span class="text-[9px] bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors flex-shrink-0" data-v-18b5b6e1${_scopeId}>Live</span></button></div>`);
              } else {
                _push2(`<div class="py-10 flex flex-col items-center gap-5" data-v-18b5b6e1${_scopeId}><div class="relative w-16 h-16" data-v-18b5b6e1${_scopeId}><div class="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" data-v-18b5b6e1${_scopeId}></div><div class="absolute inset-0 flex items-center justify-center" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-18b5b6e1${_scopeId}></path></svg></div></div><div class="text-center" data-v-18b5b6e1${_scopeId}><p class="font-black text-slate-900 text-sm" data-v-18b5b6e1${_scopeId}>Manual Crawler Running...</p><p class="text-[10px] text-slate-400 font-medium mt-1 tracking-widest uppercase" data-v-18b5b6e1${_scopeId}>Fetching · Parsing · Auditing</p></div><div class="flex gap-1.5" data-v-18b5b6e1${_scopeId}><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="${ssrRenderStyle({ "animation-delay": "0ms" })}" data-v-18b5b6e1${_scopeId}></span><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="${ssrRenderStyle({ "animation-delay": "150ms" })}" data-v-18b5b6e1${_scopeId}></span><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style="${ssrRenderStyle({ "animation-delay": "300ms" })}" data-v-18b5b6e1${_scopeId}></span></div></div>`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showAnalysisModal.value) {
              _push2(`<div class="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 relative scale-in-center overflow-y-auto max-h-[90vh] border border-slate-100" data-v-18b5b6e1${_scopeId}><button class="absolute top-10 right-10 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" data-v-18b5b6e1${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button><div class="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12 border-b border-slate-50 pb-10" data-v-18b5b6e1${_scopeId}><div class="${ssrRenderClass([
                "w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black border-4 shadow-2xl",
                selectedLink.value?.seo_audit?.score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100" : selectedLink.value?.seo_audit?.score >= 70 ? "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100" : "text-red-600 bg-red-50 border-red-100 shadow-red-100"
              ])}" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedLink.value?.seo_audit?.score || "--")}</div><div class="space-y-1" data-v-18b5b6e1${_scopeId}><h2 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3" data-v-18b5b6e1${_scopeId}> Intelligence Report `);
              if (selectedLink.value?.status === "completed") {
                _push2(`<span class="bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest" data-v-18b5b6e1${_scopeId}>Live Audit</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</h2><p class="text-slate-500 font-medium text-sm flex items-center gap-2" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" data-v-18b5b6e1${_scopeId}></path></svg> ${ssrInterpolate(selectedLink.value?.url)}</p></div><div class="md:ml-auto flex gap-4" data-v-18b5b6e1${_scopeId}><button${ssrIncludeBooleanAttr(generatingJsonLd.value) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs transition-standard active:scale-95 shadow-2xl flex items-center gap-3" data-v-18b5b6e1${_scopeId}>`);
              if (generatingJsonLd.value) {
                _push2(`<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" data-v-18b5b6e1${_scopeId}></div>`);
              } else {
                _push2(`<svg class="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" data-v-18b5b6e1${_scopeId}><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.757 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zM5.757 4.343a1 1 0 101.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" data-v-18b5b6e1${_scopeId}></path></svg>`);
              }
              _push2(` Auto-Generate AI Schema </button></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-12" data-v-18b5b6e1${_scopeId}><div class="lg:col-span-2 space-y-10" data-v-18b5b6e1${_scopeId}><div class="space-y-6" data-v-18b5b6e1${_scopeId}><h4 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3" data-v-18b5b6e1${_scopeId}><div class="w-1.5 h-1.5 bg-blue-500 rounded-full" data-v-18b5b6e1${_scopeId}></div> Optimization Analysis </h4>`);
              if (selectedLink.value?.seo_audit) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-18b5b6e1${_scopeId}><!--[-->`);
                ssrRenderList(selectedLink.value.seo_audit.errors, (err) => {
                  _push2(`<div class="bg-red-50/50 p-5 rounded-3xl border border-red-100 flex gap-4 items-start shadow-sm" data-v-18b5b6e1${_scopeId}><div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20" data-v-18b5b6e1${_scopeId}><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-18b5b6e1${_scopeId}></path></svg></div><span class="text-sm font-bold text-red-900 leading-tight" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(err)}</span></div>`);
                });
                _push2(`<!--]--><!--[-->`);
                ssrRenderList(selectedLink.value.seo_audit.warnings, (warn) => {
                  _push2(`<div class="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex gap-4 items-start shadow-sm" data-v-18b5b6e1${_scopeId}><div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20" data-v-18b5b6e1${_scopeId}><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" data-v-18b5b6e1${_scopeId}></path></svg></div><span class="text-sm font-bold text-amber-900 leading-tight" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(warn)}</span></div>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<div class="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200" data-v-18b5b6e1${_scopeId}><p class="text-slate-400 font-bold uppercase text-[10px] tracking-widest" data-v-18b5b6e1${_scopeId}>No audit data available for this link yet.</p></div>`);
              }
              _push2(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-8" data-v-18b5b6e1${_scopeId}><div class="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group" data-v-18b5b6e1${_scopeId}><div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" data-v-18b5b6e1${_scopeId}></div><h4 class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1" data-v-18b5b6e1${_scopeId}>Infrastructure Health</h4><div class="space-y-4" data-v-18b5b6e1${_scopeId}><div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl" data-v-18b5b6e1${_scopeId}><span class="text-[10px] uppercase font-bold text-slate-400 pr-2" data-v-18b5b6e1${_scopeId}>Security</span><div class="flex items-center gap-2" data-v-18b5b6e1${_scopeId}><div class="${ssrRenderClass(["w-2 h-2 rounded-full", selectedLink.value?.ssl_info?.is_secure ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400"])}" data-v-18b5b6e1${_scopeId}></div><span class="text-xs font-black" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedLink.value?.ssl_info?.is_secure ? "SSL PROTECTED" : "INSECURE")}</span></div></div><div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl" data-v-18b5b6e1${_scopeId}><span class="text-[10px] uppercase font-bold text-slate-400 pr-2" data-v-18b5b6e1${_scopeId}>Response</span><span class="text-xs font-black text-blue-400" data-v-18b5b6e1${_scopeId}>${ssrInterpolate((selectedLink.value?.load_time || 0).toFixed(2))}S</span></div></div></div><div class="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm relative overflow-hidden group" data-v-18b5b6e1${_scopeId}><h4 class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6" data-v-18b5b6e1${_scopeId}>Page Resources</h4><div class="space-y-4" data-v-18b5b6e1${_scopeId}>`);
              if (selectedLink.value?.request_analysis) {
                _push2(`<div class="flex justify-between items-center" data-v-18b5b6e1${_scopeId}><span class="text-[10px] font-bold text-slate-400 uppercase" data-v-18b5b6e1${_scopeId}>Payload Size</span><span class="text-lg font-black text-indigo-900 tracking-tight" data-v-18b5b6e1${_scopeId}>${ssrInterpolate((selectedLink.value.request_analysis.size_kb || 0).toFixed(1))} <small class="text-[10px] opacity-60" data-v-18b5b6e1${_scopeId}>KB</small></span></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="h-2 bg-indigo-100 rounded-full overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="h-full bg-indigo-500 rounded-full w-2/3" data-v-18b5b6e1${_scopeId}></div></div></div></div></div></div><div class="space-y-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100" data-v-18b5b6e1${_scopeId}><div class="space-y-6" data-v-18b5b6e1${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" data-v-18b5b6e1${_scopeId}>Content Metadata</h4><div class="space-y-4" data-v-18b5b6e1${_scopeId}><div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" data-v-18b5b6e1${_scopeId}><span class="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2" data-v-18b5b6e1${_scopeId}>Primary Title</span><p class="text-xs font-black text-slate-800 leading-snug" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedLink.value?.title || "Unknown Title")}</p></div><div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" data-v-18b5b6e1${_scopeId}><span class="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2" data-v-18b5b6e1${_scopeId}>Snippet Description</span><p class="text-xs font-bold text-slate-500 leading-relaxed" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(selectedLink.value?.description || "No description found.")}</p></div></div></div>`);
              if (selectedLink.value?.extracted_json_ld?.length) {
                _push2(`<div class="space-y-6" data-v-18b5b6e1${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" data-v-18b5b6e1${_scopeId}>Embedded Schemas</h4><div class="grid grid-cols-1 gap-3" data-v-18b5b6e1${_scopeId}><!--[-->`);
                ssrRenderList(selectedLink.value.extracted_json_ld, (schema, idx) => {
                  _push2(`<div class="p-4 bg-white rounded-2xl border border-blue-50 flex items-center gap-3 shadow-sm hover:border-blue-200 transition-colors" data-v-18b5b6e1${_scopeId}><div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" data-v-18b5b6e1${_scopeId}><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" data-v-18b5b6e1${_scopeId}></path></svg></div><span class="text-[10px] font-black text-slate-700 uppercase" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(schema["@type"])}</span></div>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showProgressModal.value) {
              _push2(`<div class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" data-v-18b5b6e1${_scopeId}><div class="bg-white w-full max-w-lg rounded-3xl shadow-xl p-10 relative scale-in-center border border-slate-200" data-v-18b5b6e1${_scopeId}><div class="space-y-6" data-v-18b5b6e1${_scopeId}><div data-v-18b5b6e1${_scopeId}><h2 class="text-xl font-bold text-slate-900" data-v-18b5b6e1${_scopeId}>Site Sweep in Progress</h2><p class="text-sm text-slate-500 mt-1" data-v-18b5b6e1${_scopeId}>Analyzing internal structure and SEO health.</p></div><div class="space-y-2" data-v-18b5b6e1${_scopeId}><div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-18b5b6e1${_scopeId}><span data-v-18b5b6e1${_scopeId}>Current Deep Scan</span><span data-v-18b5b6e1${_scopeId}>${ssrInterpolate(crawlProgress.value.total_crawled)} / ${ssrInterpolate(crawlProgress.value.total_discovered)}</span></div><div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden" data-v-18b5b6e1${_scopeId}><div class="h-full bg-blue-600 transition-all duration-500" style="${ssrRenderStyle({ width: `${crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100}%` })}" data-v-18b5b6e1${_scopeId}></div></div></div><div class="bg-slate-50 rounded-xl p-4 h-32 overflow-y-auto border border-slate-100" data-v-18b5b6e1${_scopeId}><!--[-->`);
              ssrRenderList(crawlProgress.value.logs, (log, idx) => {
                _push2(`<div class="text-[10px] text-slate-600 font-medium py-1 border-b border-slate-100 last:border-0" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(log)}</div>`);
              });
              _push2(`<!--]-->`);
              if (!crawlProgress.value.logs.length) {
                _push2(`<p class="text-[10px] text-slate-400 italic" data-v-18b5b6e1${_scopeId}>Initializing engine outputs...</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex flex-col gap-3" data-v-18b5b6e1${_scopeId}><button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm transition-standard hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-200" data-v-18b5b6e1${_scopeId}> Keep Scanning in Background </button><button class="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard hover:bg-red-100 active:scale-95 border border-red-100/50" data-v-18b5b6e1${_scopeId}> Terminate Sync &amp; Discard </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showCompletionToast.value) {
              _push2(`<div class="fixed bottom-10 right-10 z-[200] animate-slide-up" data-v-18b5b6e1${_scopeId}><div class="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6" data-v-18b5b6e1${_scopeId}><div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><h4 class="text-sm font-black tracking-tight" data-v-18b5b6e1${_scopeId}>Sync Complete!</h4><p class="text-[10px] text-slate-400 font-medium whitespace-nowrap" data-v-18b5b6e1${_scopeId}>All links have been verified and updated.</p></div><button class="text-slate-500 hover:text-white transition-colors p-2" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="fixed bottom-10 right-10 z-[200] animate-slide-up" style="${ssrRenderStyle(showErrorToast.value ? null : { display: "none" })}" data-v-18b5b6e1${_scopeId}><div class="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6" data-v-18b5b6e1${_scopeId}><div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white" data-v-18b5b6e1${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-18b5b6e1${_scopeId}></path></svg></div><div data-v-18b5b6e1${_scopeId}><h4 class="text-sm font-black tracking-tight" data-v-18b5b6e1${_scopeId}>Analysis Failed</h4><p class="text-[10px] text-red-100 font-medium whitespace-nowrap" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(errorToastMessage.value)}</p></div><button class="text-red-200 hover:text-white transition-colors p-2" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button></div></div>`);
            if (showImportToast.value) {
              _push2(`<div class="fixed bottom-28 right-10 z-[300] bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-blue-400/50 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white/20 p-2 rounded-full" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-18b5b6e1${_scopeId}></path></svg></div><div class="flex flex-col" data-v-18b5b6e1${_scopeId}><span class="text-[10px] font-black uppercase tracking-widest text-blue-100" data-v-18b5b6e1${_scopeId}>Import Complete</span><span class="text-sm font-bold truncate max-w-[220px]" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(importToastMessage.value)}</span></div><button class="text-blue-200 hover:text-white transition-colors p-1" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-18b5b6e1${_scopeId}></path></svg></button></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(``);
            if (showLinkToast.value) {
              _push2(`<div class="fixed bottom-10 right-10 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-subtle border border-emerald-400/50 backdrop-blur-md" data-v-18b5b6e1${_scopeId}><div class="bg-white/20 p-2 rounded-full" data-v-18b5b6e1${_scopeId}><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-18b5b6e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-18b5b6e1${_scopeId}></path></svg></div><div class="flex flex-col" data-v-18b5b6e1${_scopeId}><span class="text-[10px] font-black uppercase tracking-widest text-emerald-100" data-v-18b5b6e1${_scopeId}>Synchronized</span><span class="text-sm font-bold truncate max-w-[200px]" data-v-18b5b6e1${_scopeId}>${ssrInterpolate(lastDiscoveredUrl.value)}</span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.sitemap ? (openBlock(), createBlock("div", {
                key: 0,
                class: "max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-8 py-10 relative"
              }, [
                createVNode("div", { class: "flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm" }, [
                  createVNode("div", { class: "flex items-center gap-6" }, [
                    createVNode(unref(Link), {
                      href: "/sitemaps",
                      class: "w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-standard"
                    }, {
                      default: withCtx(() => [
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
                            d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                          })
                        ]))
                      ]),
                      _: 1
                    }),
                    createVNode("div", null, [
                      createVNode("h1", { class: "text-3xl font-black text-slate-900 tracking-tight" }, toDisplayString(__props.sitemap.name), 1),
                      createVNode("p", { class: "text-slate-500 font-medium text-sm mt-1" }, [
                        createTextVNode("Stored as "),
                        createVNode("code", null, "/" + toDisplayString(__props.sitemap.filename), 1)
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "flex flex-wrap items-center gap-3 w-full md:w-auto" }, [
                    createVNode("div", { class: "flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100" }, [
                      createVNode("button", {
                        onClick: ($event) => showRecrawlModal.value = true,
                        disabled: crawling.value,
                        class: "h-10 bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 shadow-lg flex items-center gap-2 disabled:opacity-50"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: ["w-3 h-3", { "animate-spin": crawling.value }],
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
                        ], 2)),
                        createTextVNode(" Recrawl ")
                      ], 8, ["onClick", "disabled"]),
                      __props.links.total > 0 ? (openBlock(), createBlock("a", {
                        key: 0,
                        href: _ctx.route("sitemaps.export", __props.sitemap.id),
                        class: "h-10 bg-white hover:bg-emerald-50 text-emerald-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-emerald-200",
                        title: "Export CSV"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-3.5 h-3.5",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          })
                        ])),
                        createTextVNode(" CSV ")
                      ], 8, ["href"])) : createCommentVNode("", true),
                      __props.links.total > 0 ? (openBlock(), createBlock("a", {
                        key: 1,
                        href: _ctx.route("sitemaps.export-pdf", __props.sitemap.id),
                        class: "h-10 bg-white hover:bg-rose-50 text-rose-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard flex items-center gap-2 border border-slate-200 hover:border-rose-200",
                        title: "Export PDF"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-3.5 h-3.5",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          })
                        ])),
                        createTextVNode(" PDF ")
                      ], 8, ["href"])) : createCommentVNode("", true),
                      createVNode("button", {
                        onClick: deleteSitemap,
                        class: "h-10 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-standard active:scale-95 border border-slate-200 hover:border-red-200",
                        title: "Delete Container"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-3.5 h-3.5",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          })
                        ]))
                      ])
                    ]),
                    createVNode("div", { class: "flex items-center gap-2" }, [
                      crawling.value || __props.sitemap.last_crawl_status === "dispatched" || __props.sitemap.last_crawl_status === "crawling" ? (openBlock(), createBlock("button", {
                        key: 0,
                        onClick: openLiveConsole,
                        class: "h-12 bg-blue-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard flex items-center gap-3 shadow-xl shadow-blue-200"
                      }, [
                        createVNode("span", { class: "relative flex h-2 w-2" }, [
                          createVNode("span", { class: "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" }),
                          createVNode("span", { class: "relative inline-flex rounded-full h-2 w-2 bg-white" })
                        ]),
                        createTextVNode(" Console ")
                      ])) : createCommentVNode("", true),
                      createVNode("button", {
                        type: "button",
                        onClick: withModifiers(triggerCrawl, ["stop"]),
                        disabled: crawling.value,
                        class: "h-12 bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl shadow-indigo-200 disabled:opacity-50"
                      }, toDisplayString(crawling.value ? "Scanning..." : "Start Scan"), 9, ["disabled"]),
                      createVNode("button", {
                        onClick: generateXml,
                        disabled: generating.value,
                        class: "h-12 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard active:scale-95 shadow-xl"
                      }, toDisplayString(generating.value ? "Building..." : "Build XML"), 9, ["disabled"])
                    ])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-4 gap-10" }, [
                  createVNode("div", { class: "space-y-8" }, [
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium" }, [
                      createVNode("h4", { class: "text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between" }, [
                        createTextVNode(" Bulk Data "),
                        createVNode("span", { class: "bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] lowercase" }, "csv import")
                      ]),
                      createVNode("form", {
                        onSubmit: withModifiers(importLinks, ["prevent"]),
                        class: "space-y-6"
                      }, [
                        createVNode("div", { class: "group relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-standard" }, [
                          createVNode("input", {
                            type: "file",
                            onChange: handleFileUpload,
                            class: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                            accept: ".csv,.txt,.xml"
                          }, null, 32),
                          createVNode("div", { class: "space-y-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-8 h-8 text-slate-300 mx-auto group-hover:text-blue-500 transition-colors",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              })
                            ])),
                            createVNode("p", { class: "text-[10px] font-bold text-slate-500 uppercase tracking-widest" }, toDisplayString(selectedFile.value ? selectedFile.value.name : "Choose CSV"), 1)
                          ])
                        ]),
                        createVNode("button", {
                          type: "submit",
                          disabled: importing.value || !selectedFile.value,
                          class: "w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black transition-standard active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                        }, toDisplayString(importing.value ? "Syncing..." : "Sync Links"), 9, ["disabled"])
                      ], 32)
                    ]),
                    __props.duplicateCount > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "bg-amber-50 rounded-[2.5rem] border border-amber-100 p-8"
                    }, [
                      createVNode("div", { class: "flex items-center gap-4 mb-4" }, [
                        createVNode("div", { class: "w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200" }, [
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
                        createVNode("h4", { class: "text-sm font-black text-amber-900 uppercase tracking-widest leading-tight" }, "Optimization Alert")
                      ]),
                      createVNode("p", { class: "text-amber-800 text-xs font-medium leading-relaxed" }, [
                        createTextVNode("We detected "),
                        createVNode("strong", null, toDisplayString(__props.duplicateCount) + " duplicate URLs", 1),
                        createTextVNode(" present in other sitemaps. Auto-canonical tags will be prioritized for these links.")
                      ])
                    ])) : createCommentVNode("", true),
                    crawling.value || crawlProgress.value.status !== "pending" ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm"
                    }, [
                      createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center" }, [
                        createTextVNode(" Crawl Activity "),
                        crawling.value ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                        })) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode("div", { class: "flex justify-between items-end" }, [
                          createVNode("span", { class: "text-[10px] font-bold text-slate-500 uppercase" }, "Progress"),
                          createVNode("span", { class: "text-xs font-black text-slate-900" }, toDisplayString(Math.round(crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100)) + "%", 1)
                        ]),
                        createVNode("div", { class: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" }, [
                          createVNode("div", {
                            class: "h-full bg-blue-600 transition-all duration-500",
                            style: { width: `${crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100}%` }
                          }, null, 4)
                        ]),
                        createVNode("div", { class: "pt-2" }, [
                          createVNode("p", { class: "text-[9px] font-medium text-slate-400 truncate" }, toDisplayString(crawlProgress.value.current_url || "Waiting..."), 1)
                        ]),
                        crawlProgress.value.status === "completed" ? (openBlock(), createBlock("button", {
                          key: 0,
                          onClick: ($event) => unref(router).reload(),
                          class: "w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-colors"
                        }, " Refresh List ", 8, ["onClick"])) : createCommentVNode("", true)
                      ])
                    ])) : createCommentVNode("", true),
                    createVNode("div", { class: "bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl" }, [
                      createVNode("h4", { class: "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6" }, "Internal Addition"),
                      createVNode("form", {
                        onSubmit: withModifiers(addSingleLink, ["prevent"]),
                        class: "space-y-4"
                      }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(linkForm).url = $event,
                          type: "url",
                          placeholder: "https://...",
                          class: "w-full bg-white/10 border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard",
                          required: ""
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(linkForm).url]
                        ]),
                        createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(linkForm).changefreq = $event,
                            class: "bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-widest appearance-none focus:bg-white focus:text-slate-900 transition-standard"
                          }, [
                            createVNode("option", { value: "daily" }, "Daily"),
                            createVNode("option", { value: "weekly" }, "Weekly"),
                            createVNode("option", { value: "monthly" }, "Monthly")
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(linkForm).changefreq]
                          ]),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(linkForm).priority = $event,
                            type: "number",
                            step: "0.1",
                            min: "0",
                            max: "1",
                            class: "bg-white/10 border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:bg-white focus:text-slate-900 transition-standard",
                            placeholder: "0.5"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(linkForm).priority]
                          ])
                        ]),
                        createVNode("button", {
                          type: "submit",
                          class: "w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-standard active:scale-95 shadow-lg shadow-blue-900/40 mt-2"
                        }, " Add Link ")
                      ], 32)
                    ])
                  ]),
                  createVNode("div", {
                    class: [
                      "lg:col-span-3 space-y-6 transition-all duration-500",
                      isFullScreen.value ? "fixed inset-0 z-[100] bg-slate-50 p-8 overflow-y-auto" : ""
                    ]
                  }, [
                    createVNode("div", { class: "flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                      createVNode("div", { class: "relative flex-grow w-full" }, [
                        createVNode("div", { class: "absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none" }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-4 w-4 text-slate-400",
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
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => searchQuery.value = $event,
                          type: "text",
                          placeholder: "Search URLs or page titles...",
                          class: "block w-full pl-12 pr-4 h-14 border-slate-100 bg-slate-50/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:bg-white focus:border-indigo-300 transition-standard"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, searchQuery.value]
                        ])
                      ]),
                      createVNode("div", { class: "flex items-center gap-4 w-full md:w-auto" }, [
                        createVNode("div", { class: "flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100" }, [
                          (openBlock(), createBlock(Fragment, null, renderList(["all", "good", "issues", "redirects", "discovered"], (filter) => {
                            return createVNode("button", {
                              key: filter,
                              onClick: ($event) => currentFilter.value = filter,
                              class: [
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                currentFilter.value === filter ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                              ]
                            }, toDisplayString(filter), 11, ["onClick"]);
                          }), 64))
                        ]),
                        createVNode("button", {
                          onClick: ($event) => isFullScreen.value = !isFullScreen.value,
                          class: [
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-standard active:scale-95 border",
                            isFullScreen.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                          ],
                          title: isFullScreen.value ? "Exit Full Screen" : "Expand to Full Screen"
                        }, [
                          !isFullScreen.value ? (openBlock(), createBlock("svg", {
                            key: 0,
                            class: "w-5 h-5",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                            })
                          ])) : (openBlock(), createBlock("svg", {
                            key: 1,
                            class: "w-5 h-5",
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
                        ], 10, ["onClick", "title"])
                      ])
                    ]),
                    createVNode("div", { class: "grid grid-cols-2 lg:grid-cols-5 gap-4" }, [
                      (openBlock(), createBlock(Fragment, null, renderList(["all", "good", "issues", "redirects", "discovered"], (filter) => {
                        return createVNode("button", {
                          key: "card-" + filter,
                          onClick: ($event) => currentFilter.value = filter,
                          class: [
                            "p-5 rounded-2xl border flex flex-col gap-3 transition-all text-left group relative overflow-hidden",
                            currentFilter.value === filter ? filter === "good" ? "bg-emerald-600 border-emerald-600 shadow-lg text-white" : filter === "issues" ? "bg-amber-500 border-amber-500 shadow-lg text-white" : filter === "redirects" ? "bg-indigo-600 border-indigo-600 shadow-lg text-white" : filter === "discovered" ? "bg-blue-600 border-blue-600 shadow-lg text-white" : "bg-slate-900 border-slate-900 shadow-lg text-white" : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                          ]
                        }, [
                          createVNode("div", { class: "flex items-center justify-between w-full" }, [
                            createVNode("span", {
                              class: ["text-[9px] font-black uppercase tracking-[0.2em]", currentFilter.value === filter ? "opacity-70" : "text-slate-400"]
                            }, toDisplayString(filter === "redirects" ? "Non-Canonical" : filter === "good" ? "Indexable" : filter), 3),
                            createVNode("div", {
                              class: ["w-8 h-8 rounded-lg flex items-center justify-center transition-colors", currentFilter.value === filter ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"]
                            }, [
                              filter === "all" ? (openBlock(), createBlock("svg", {
                                key: 0,
                                class: "w-4 h-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M4 6h16M4 10h16M4 14h16M4 18h16"
                                })
                              ])) : createCommentVNode("", true),
                              filter === "good" ? (openBlock(), createBlock("svg", {
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
                                  d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                              ])) : createCommentVNode("", true),
                              filter === "issues" ? (openBlock(), createBlock("svg", {
                                key: 2,
                                class: "w-4 h-4",
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
                              ])) : createCommentVNode("", true),
                              filter === "redirects" ? (openBlock(), createBlock("svg", {
                                key: 3,
                                class: "w-4 h-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                })
                              ])) : createCommentVNode("", true),
                              filter === "discovered" ? (openBlock(), createBlock("svg", {
                                key: 4,
                                class: "w-4 h-4",
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
                              ])) : createCommentVNode("", true)
                            ], 2)
                          ]),
                          createVNode("div", { class: "text-2xl font-black tracking-tight leading-none" }, toDisplayString(stats.value[filter]), 1)
                        ], 10, ["onClick"]);
                      }), 64))
                    ]),
                    createVNode("div", { class: "bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden" }, [
                      createVNode("div", { class: "overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar" }, [
                        createVNode("table", { class: "w-full text-left border-collapse" }, [
                          createVNode("thead", { class: "sticky top-0 z-10 bg-slate-50 shadow-sm" }, [
                            createVNode("tr", { class: "bg-slate-50 border-b border-slate-100" }, [
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Live URL Intelligence"),
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" }, "Audit Score"),
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" }, "SEO Health"),
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" }, "Freq"),
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center" }, "Priority"),
                              createVNode("th", { class: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right" }, "Actions")
                            ])
                          ]),
                          createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                            filteredLinks.value.length === 0 ? (openBlock(), createBlock("tr", {
                              key: 0,
                              class: "bg-white"
                            }, [
                              createVNode("td", {
                                colspan: "6",
                                class: "px-8 py-20 text-center"
                              }, [
                                createVNode("div", { class: "space-y-4" }, [
                                  createVNode("div", { class: "w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300" }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "w-8 h-8",
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
                                  createVNode("p", { class: "text-sm font-bold text-slate-500 uppercase tracking-widest" }, "No links found for this filter."),
                                  createVNode("button", {
                                    onClick: ($event) => currentFilter.value = "all",
                                    class: "text-xs font-black text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]"
                                  }, "Reset All Filters", 8, ["onClick"])
                                ])
                              ])
                            ])) : createCommentVNode("", true),
                            (openBlock(true), createBlock(Fragment, null, renderList(filteredLinks.value, (link) => {
                              return openBlock(), createBlock("tr", {
                                key: link.id,
                                class: "group hover:bg-slate-50/50 transition-colors"
                              }, [
                                createVNode("td", { class: "px-8 py-5" }, [
                                  createVNode("div", { class: "flex items-center gap-3" }, [
                                    createVNode("div", {
                                      class: [
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        link.status === "completed" ? "bg-emerald-500" : link.status === "crawling" ? "bg-blue-500 animate-pulse" : link.status === "discovered" ? "bg-amber-400 animate-pulse" : "bg-slate-300"
                                      ]
                                    }, null, 2),
                                    createVNode("div", { class: "flex flex-col min-w-0" }, [
                                      createVNode("span", { class: "text-sm font-bold text-slate-900 tracking-tight truncate" }, toDisplayString(link.url), 1),
                                      createVNode("div", { class: "flex items-center gap-2" }, [
                                        link.title ? (openBlock(), createBlock("span", {
                                          key: 0,
                                          class: "text-[9px] font-medium text-slate-400 line-clamp-1"
                                        }, toDisplayString(link.title), 1)) : createCommentVNode("", true),
                                        link.status === "discovered" ? (openBlock(), createBlock("span", {
                                          key: 1,
                                          class: "text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase"
                                        }, "Discovered")) : createCommentVNode("", true),
                                        link.is_canonical === false && link.status === "completed" ? (openBlock(), createBlock("span", {
                                          key: 2,
                                          class: "text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase",
                                          title: "Points to: " + link.canonical_url
                                        }, "Non-Canonical", 8, ["title"])) : createCommentVNode("", true),
                                        link.http_status && link.http_status >= 300 ? (openBlock(), createBlock("span", {
                                          key: 3,
                                          class: "text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase"
                                        }, "Redirect " + toDisplayString(link.http_status), 1)) : createCommentVNode("", true),
                                        link.depth_from_root > 0 ? (openBlock(), createBlock("span", {
                                          key: 4,
                                          class: "text-[8px] font-bold text-slate-400"
                                        }, "Depth " + toDisplayString(link.depth_from_root), 1)) : createCommentVNode("", true)
                                      ])
                                    ])
                                  ])
                                ]),
                                createVNode("td", { class: "px-8 py-5 text-center" }, [
                                  link.seo_audit ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: [
                                      "inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-black border-4",
                                      link.seo_audit.score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : link.seo_audit.score >= 70 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-red-600 bg-red-50 border-red-100"
                                    ]
                                  }, toDisplayString(link.seo_audit.score), 3)) : (openBlock(), createBlock("span", {
                                    key: 1,
                                    class: "text-[10px] font-bold text-slate-300"
                                  }, "--"))
                                ]),
                                createVNode("td", { class: "px-8 py-5 text-center" }, [
                                  link.url_slug_quality ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "flex flex-col items-center gap-1"
                                  }, [
                                    createVNode("span", {
                                      class: [
                                        "inline-block w-3 h-3 rounded-full",
                                        link.url_slug_quality === "good" ? "bg-emerald-400" : link.url_slug_quality === "warning" ? "bg-amber-400" : "bg-red-400"
                                      ]
                                    }, null, 2),
                                    createVNode("span", {
                                      class: [
                                        "text-[8px] font-black uppercase tracking-wider",
                                        link.url_slug_quality === "good" ? "text-emerald-600" : link.url_slug_quality === "warning" ? "text-amber-600" : "text-red-600"
                                      ]
                                    }, toDisplayString(link.url_slug_quality), 3),
                                    link.seo_bottlenecks && link.seo_bottlenecks.length ? (openBlock(), createBlock("div", {
                                      key: 0,
                                      class: "group/tip relative"
                                    }, [
                                      createVNode("span", { class: "text-[8px] font-bold text-slate-400 cursor-help underline decoration-dotted" }, toDisplayString(link.seo_bottlenecks.length) + " issue" + toDisplayString(link.seo_bottlenecks.length > 1 ? "s" : ""), 1),
                                      createVNode("div", { class: "hidden group-hover/tip:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white p-3 rounded-xl text-[9px] font-medium z-50 shadow-xl" }, [
                                        (openBlock(true), createBlock(Fragment, null, renderList(link.seo_bottlenecks, (b, bi) => {
                                          return openBlock(), createBlock("div", {
                                            key: bi,
                                            class: "py-1 border-b border-slate-700 last:border-0"
                                          }, toDisplayString(b.message), 1);
                                        }), 128))
                                      ])
                                    ])) : createCommentVNode("", true)
                                  ])) : (openBlock(), createBlock("span", {
                                    key: 1,
                                    class: "text-[10px] font-bold text-slate-300"
                                  }, "--"))
                                ]),
                                createVNode("td", { class: "px-8 py-5 text-center" }, [
                                  createVNode("span", { class: "text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest" }, toDisplayString(link.changefreq), 1)
                                ]),
                                createVNode("td", { class: "px-8 py-5 text-center" }, [
                                  createVNode("div", { class: "w-12 mx-auto bg-slate-100 rounded-lg py-1 text-[11px] font-bold text-slate-600" }, toDisplayString(link.priority), 1)
                                ]),
                                createVNode("td", { class: "px-8 py-5 text-right" }, [
                                  createVNode("div", { class: "flex items-center justify-end gap-1" }, [
                                    createVNode("button", {
                                      onClick: ($event) => analyzeLink(link),
                                      class: "p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard",
                                      title: "Analyze Link Results"
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
                                          d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        })
                                      ]))
                                    ], 8, ["onClick"]),
                                    createVNode("button", {
                                      onClick: ($event) => analyzeAi(link),
                                      class: [
                                        "p-2 rounded-xl transition-standard group/ai",
                                        link.ai_schema_data ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                      ],
                                      title: link.ai_schema_data ? "AI Data Ready" : "AI Content Analysis"
                                    }, [
                                      (openBlock(), createBlock("svg", {
                                        class: ["w-4 h-4", { "animate-pulse": !link.ai_schema_data && analysisLink.value === link.id }],
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
                                      ], 2))
                                    ], 10, ["onClick", "title"]),
                                    createVNode("button", {
                                      onClick: ($event) => recrawlLink(link),
                                      class: "p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-standard",
                                      title: "Recrawl Individual Link"
                                    }, [
                                      (openBlock(), createBlock("svg", {
                                        class: ["w-4 h-4", { "animate-spin-slow": link.status === "crawling" }],
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
                                      ], 2))
                                    ], 8, ["onClick"]),
                                    createVNode("button", {
                                      onClick: ($event) => editLink(link),
                                      class: "p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard",
                                      title: "Edit Link"
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
                                          d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        })
                                      ]))
                                    ], 8, ["onClick"]),
                                    createVNode("button", {
                                      onClick: ($event) => deleteLink(link),
                                      class: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard",
                                      title: "Remove Link"
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
                                          d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        })
                                      ]))
                                    ], 8, ["onClick"]),
                                    createVNode("span", { class: "text-[10px] font-bold text-slate-400 ml-2" }, toDisplayString(new Date(link.created_at).toLocaleDateString()), 1)
                                  ])
                                ])
                              ]);
                            }), 128))
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "px-8 py-8 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center" }, [
                        createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Page " + toDisplayString(__props.links.current_page) + " of " + toDisplayString(__props.links.last_page), 1),
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.links.links, (pLink) => {
                            return openBlock(), createBlock(unref(Link), {
                              key: pLink.label,
                              href: pLink.url || "#",
                              class: [
                                "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-standard",
                                pLink.active ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-100"
                              ],
                              innerHTML: pLink.label
                            }, null, 8, ["href", "class", "innerHTML"]);
                          }), 128))
                        ])
                      ])
                    ])
                  ], 2)
                ])
              ])) : createCommentVNode("", true),
              showEditLinkModal.value ? (openBlock(), createBlock("div", {
                key: 1,
                class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" }, [
                  createVNode("button", {
                    onClick: closeEditModal,
                    class: "absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"
                  }, [
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
                        d: "M6 18L18 6M6 6l12 12"
                      })
                    ]))
                  ]),
                  createVNode("h2", { class: "text-3xl font-black text-slate-900 mb-8 tracking-tight" }, "Edit Link"),
                  createVNode("form", {
                    onSubmit: withModifiers(updateLink, ["prevent"]),
                    class: "space-y-8"
                  }, [
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "URL"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(editLinkForm).url = $event,
                        type: "url",
                        placeholder: "https://...",
                        class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold",
                        required: ""
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, unref(editLinkForm).url]
                      ])
                    ]),
                    createVNode("div", { class: "grid grid-cols-2 gap-6" }, [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Change Frequency"),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => unref(editLinkForm).changefreq = $event,
                          class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold appearance-none"
                        }, [
                          createVNode("option", { value: "daily" }, "Daily"),
                          createVNode("option", { value: "weekly" }, "Weekly"),
                          createVNode("option", { value: "monthly" }, "Monthly")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, unref(editLinkForm).changefreq]
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Priority"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(editLinkForm).priority = $event,
                          type: "number",
                          step: "0.1",
                          min: "0",
                          max: "1",
                          class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(editLinkForm).priority]
                        ])
                      ])
                    ]),
                    createVNode("button", {
                      disabled: unref(editLinkForm).processing,
                      type: "submit",
                      class: "w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4"
                    }, " Save Link ", 8, ["disabled"])
                  ], 32)
                ])
              ])) : createCommentVNode("", true),
              showDeleteLinkModal.value ? (openBlock(), createBlock("div", {
                key: 2,
                class: "fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" }, [
                  createVNode("div", { class: "absolute top-0 left-0 w-full h-2 bg-red-500" }),
                  createVNode("div", { class: "flex flex-col items-center text-center space-y-6" }, [
                    createVNode("div", { class: "w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" }, [
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
                          d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("h2", { class: "text-2xl font-black text-slate-900 mb-2" }, "Remove Link?"),
                      createVNode("p", { class: "text-slate-500 font-medium px-4" }, [
                        createTextVNode("This will remove "),
                        createVNode("span", { class: "text-slate-900 font-bold break-all" }, toDisplayString(linkToDelete.value?.url), 1),
                        createTextVNode(" from the sitemap.")
                      ])
                    ]),
                    createVNode("div", { class: "flex flex-col w-full gap-3 pt-4" }, [
                      createVNode("button", {
                        onClick: confirmDeleteLink,
                        class: "w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95"
                      }, " Confirm Removal "),
                      createVNode("button", {
                        onClick: ($event) => showDeleteLinkModal.value = false,
                        class: "w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95"
                      }, " Cancel ", 8, ["onClick"])
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true),
              showDeleteContainerModal.value ? (openBlock(), createBlock("div", {
                key: 3,
                class: "fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" }, [
                  createVNode("div", { class: "absolute top-0 left-0 w-full h-2 bg-red-500" }),
                  createVNode("div", { class: "flex flex-col items-center text-center space-y-6" }, [
                    createVNode("div", { class: "w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" }, [
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
                          d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("h2", { class: "text-2xl font-black text-slate-900 mb-2" }, "Delete Entire Sitemap?"),
                      createVNode("p", { class: "text-slate-500 font-medium px-4" }, [
                        createTextVNode("All links within "),
                        createVNode("span", { class: "text-slate-900 font-bold" }, '"' + toDisplayString(__props.sitemap.name) + '"', 1),
                        createTextVNode(" will be permanently lost. This action is irreversible.")
                      ])
                    ]),
                    createVNode("div", { class: "flex flex-col w-full gap-3 pt-4" }, [
                      createVNode("button", {
                        onClick: confirmDeleteContainer,
                        class: "w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95"
                      }, " Yes, Delete Container "),
                      createVNode("button", {
                        onClick: ($event) => showDeleteContainerModal.value = false,
                        class: "w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95"
                      }, " Cancel ", 8, ["onClick"])
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true),
              showRecrawlModal.value ? (openBlock(), createBlock("div", {
                key: 4,
                class: "fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden border border-slate-100" }, [
                  createVNode("div", { class: "absolute top-0 left-0 w-full h-2 bg-slate-900" }),
                  createVNode("div", { class: "flex flex-col items-center text-center space-y-6" }, [
                    createVNode("div", { class: "w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg shadow-slate-200/50" }, [
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
                          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("h2", { class: "text-2xl font-black text-slate-900 mb-2" }, "Recrawl All Links?"),
                      createVNode("p", { class: "text-slate-500 font-medium px-4" }, "This will reset all internal statuses and restart the intelligence scan. Existing links will be re-verified.")
                    ]),
                    createVNode("div", { class: "flex flex-col w-full gap-3 pt-4" }, [
                      createVNode("button", {
                        onClick: confirmRecrawlAll,
                        class: "w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-standard active:scale-95"
                      }, " Yes, Start Sync "),
                      createVNode("button", {
                        onClick: ($event) => showRecrawlModal.value = false,
                        class: "w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95"
                      }, " Back to Safety ", 8, ["onClick"])
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true),
              showCrawlModeModal.value ? (openBlock(), createBlock("div", {
                key: 5,
                class: "fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-lg rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] p-10 relative scale-in-center overflow-hidden border border-slate-100" }, [
                  createVNode("div", { class: "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-t-[3rem]" }),
                  createVNode("button", {
                    onClick: ($event) => {
                      showCrawlModeModal.value = false;
                      manualCrawling.value = false;
                    },
                    class: "absolute top-8 right-8 w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
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
                  ], 8, ["onClick"]),
                  createVNode("div", { class: "mb-8 text-center pt-4" }, [
                    createVNode("div", { class: "w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-7 h-7 text-indigo-600",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        })
                      ]))
                    ]),
                    createVNode("h2", { class: "text-2xl font-black text-slate-900 tracking-tight" }, "Choose Analysis Mode"),
                    createVNode("p", { class: "text-slate-500 text-sm font-medium mt-2 px-4 truncate" }, toDisplayString(selectedLink.value?.url), 1)
                  ]),
                  !manualCrawling.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-2 gap-4"
                  }, [
                    createVNode("button", {
                      onClick: openIntelligenceReport,
                      class: "group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-left"
                    }, [
                      createVNode("div", { class: "w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-blue-100 group-hover:bg-blue-100 transition-all" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          }),
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-700" }, "View Report"),
                        createVNode("p", { class: "text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" }, "See last crawled data instantly")
                      ]),
                      createVNode("span", { class: "text-[9px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors" }, "Instant")
                    ]),
                    createVNode("button", {
                      onClick: ($event) => selectAutoCrawl(selectedLink.value),
                      class: "group relative flex flex-col items-start gap-3 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 text-left"
                    }, [
                      createVNode("div", { class: "w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 group-hover:bg-indigo-100 transition-all" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2M12 3v1"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-700" }, "Auto Crawl"),
                        createVNode("p", { class: "text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" }, "Python + Playwright full render")
                      ]),
                      createVNode("span", { class: "text-[9px] bg-indigo-50 text-indigo-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors" }, "Async")
                    ], 8, ["onClick"]),
                    createVNode("button", {
                      onClick: ($event) => manualCrawl(selectedLink.value),
                      class: "group col-span-2 relative flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 text-left"
                    }, [
                      createVNode("div", { class: "w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-emerald-100 group-hover:bg-emerald-100 transition-all flex-shrink-0" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          })
                        ]))
                      ]),
                      createVNode("div", { class: "flex-grow" }, [
                        createVNode("p", { class: "text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-emerald-700" }, "Manual Crawl"),
                        createVNode("p", { class: "text-[10px] text-slate-400 font-medium mt-1 leading-relaxed" }, "Real browser headers. Works on bot-resistant sites. Extracts full SEO data synchronously.")
                      ]),
                      createVNode("span", { class: "text-[9px] bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors flex-shrink-0" }, "Live")
                    ], 8, ["onClick"])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "py-10 flex flex-col items-center gap-5"
                  }, [
                    createVNode("div", { class: "relative w-16 h-16" }, [
                      createVNode("div", { class: "w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" }),
                      createVNode("div", { class: "absolute inset-0 flex items-center justify-center" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6 text-emerald-500",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          })
                        ]))
                      ])
                    ]),
                    createVNode("div", { class: "text-center" }, [
                      createVNode("p", { class: "font-black text-slate-900 text-sm" }, "Manual Crawler Running..."),
                      createVNode("p", { class: "text-[10px] text-slate-400 font-medium mt-1 tracking-widest uppercase" }, "Fetching · Parsing · Auditing")
                    ]),
                    createVNode("div", { class: "flex gap-1.5" }, [
                      createVNode("span", {
                        class: "w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce",
                        style: { "animation-delay": "0ms" }
                      }),
                      createVNode("span", {
                        class: "w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce",
                        style: { "animation-delay": "150ms" }
                      }),
                      createVNode("span", {
                        class: "w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce",
                        style: { "animation-delay": "300ms" }
                      })
                    ])
                  ]))
                ])
              ])) : createCommentVNode("", true),
              showAnalysisModal.value ? (openBlock(), createBlock("div", {
                key: 6,
                class: "fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 relative scale-in-center overflow-y-auto max-h-[90vh] border border-slate-100" }, [
                  createVNode("button", {
                    onClick: ($event) => showAnalysisModal.value = false,
                    class: "absolute top-10 right-10 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                  }, [
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
                        d: "M6 18L18 6M6 6l12 12"
                      })
                    ]))
                  ], 8, ["onClick"]),
                  createVNode("div", { class: "flex flex-col md:flex-row items-start md:items-center gap-8 mb-12 border-b border-slate-50 pb-10" }, [
                    createVNode("div", {
                      class: [
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black border-4 shadow-2xl",
                        selectedLink.value?.seo_audit?.score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100" : selectedLink.value?.seo_audit?.score >= 70 ? "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100" : "text-red-600 bg-red-50 border-red-100 shadow-red-100"
                      ]
                    }, toDisplayString(selectedLink.value?.seo_audit?.score || "--"), 3),
                    createVNode("div", { class: "space-y-1" }, [
                      createVNode("h2", { class: "text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3" }, [
                        createTextVNode(" Intelligence Report "),
                        selectedLink.value?.status === "completed" ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest"
                        }, "Live Audit")) : createCommentVNode("", true)
                      ]),
                      createVNode("p", { class: "text-slate-500 font-medium text-sm flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 text-slate-300",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                          })
                        ])),
                        createTextVNode(" " + toDisplayString(selectedLink.value?.url), 1)
                      ])
                    ]),
                    createVNode("div", { class: "md:ml-auto flex gap-4" }, [
                      createVNode("button", {
                        onClick: autoGenerateAiSchema,
                        disabled: generatingJsonLd.value,
                        class: "bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs transition-standard active:scale-95 shadow-2xl flex items-center gap-3"
                      }, [
                        generatingJsonLd.value ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        })) : (openBlock(), createBlock("svg", {
                          key: 1,
                          class: "w-4 h-4 text-indigo-400",
                          fill: "currentColor",
                          viewBox: "0 0 20 20"
                        }, [
                          createVNode("path", { d: "M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM15.657 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zM5.757 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zM5.757 4.343a1 1 0 101.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" })
                        ])),
                        createTextVNode(" Auto-Generate AI Schema ")
                      ], 8, ["disabled"])
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-12" }, [
                    createVNode("div", { class: "lg:col-span-2 space-y-10" }, [
                      createVNode("div", { class: "space-y-6" }, [
                        createVNode("h4", { class: "text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3" }, [
                          createVNode("div", { class: "w-1.5 h-1.5 bg-blue-500 rounded-full" }),
                          createTextVNode(" Optimization Analysis ")
                        ]),
                        selectedLink.value?.seo_audit ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "grid grid-cols-1 md:grid-cols-2 gap-4"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(selectedLink.value.seo_audit.errors, (err) => {
                            return openBlock(), createBlock("div", {
                              key: err,
                              class: "bg-red-50/50 p-5 rounded-3xl border border-red-100 flex gap-4 items-start shadow-sm"
                            }, [
                              createVNode("div", { class: "w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4 text-red-600",
                                  fill: "currentColor",
                                  viewBox: "0 0 20 20"
                                }, [
                                  createVNode("path", {
                                    "fill-rule": "evenodd",
                                    d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
                                    "clip-rule": "evenodd"
                                  })
                                ]))
                              ]),
                              createVNode("span", { class: "text-sm font-bold text-red-900 leading-tight" }, toDisplayString(err), 1)
                            ]);
                          }), 128)),
                          (openBlock(true), createBlock(Fragment, null, renderList(selectedLink.value.seo_audit.warnings, (warn) => {
                            return openBlock(), createBlock("div", {
                              key: warn,
                              class: "bg-amber-50/50 p-5 rounded-3xl border border-amber-100 flex gap-4 items-start shadow-sm"
                            }, [
                              createVNode("div", { class: "w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4 text-amber-600",
                                  fill: "currentColor",
                                  viewBox: "0 0 20 20"
                                }, [
                                  createVNode("path", {
                                    "fill-rule": "evenodd",
                                    d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
                                    "clip-rule": "evenodd"
                                  })
                                ]))
                              ]),
                              createVNode("span", { class: "text-sm font-bold text-amber-900 leading-tight" }, toDisplayString(warn), 1)
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200"
                        }, [
                          createVNode("p", { class: "text-slate-400 font-bold uppercase text-[10px] tracking-widest" }, "No audit data available for this link yet.")
                        ]))
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8" }, [
                        createVNode("div", { class: "bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group" }, [
                          createVNode("div", { class: "absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" }),
                          createVNode("h4", { class: "text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1" }, "Infrastructure Health"),
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("div", { class: "flex justify-between items-center bg-white/5 p-4 rounded-2xl" }, [
                              createVNode("span", { class: "text-[10px] uppercase font-bold text-slate-400 pr-2" }, "Security"),
                              createVNode("div", { class: "flex items-center gap-2" }, [
                                createVNode("div", {
                                  class: ["w-2 h-2 rounded-full", selectedLink.value?.ssl_info?.is_secure ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400"]
                                }, null, 2),
                                createVNode("span", { class: "text-xs font-black" }, toDisplayString(selectedLink.value?.ssl_info?.is_secure ? "SSL PROTECTED" : "INSECURE"), 1)
                              ])
                            ]),
                            createVNode("div", { class: "flex justify-between items-center bg-white/5 p-4 rounded-2xl" }, [
                              createVNode("span", { class: "text-[10px] uppercase font-bold text-slate-400 pr-2" }, "Response"),
                              createVNode("span", { class: "text-xs font-black text-blue-400" }, toDisplayString((selectedLink.value?.load_time || 0).toFixed(2)) + "S", 1)
                            ])
                          ])
                        ]),
                        createVNode("div", { class: "bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm relative overflow-hidden group" }, [
                          createVNode("h4", { class: "text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6" }, "Page Resources"),
                          createVNode("div", { class: "space-y-4" }, [
                            selectedLink.value?.request_analysis ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "flex justify-between items-center"
                            }, [
                              createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase" }, "Payload Size"),
                              createVNode("span", { class: "text-lg font-black text-indigo-900 tracking-tight" }, [
                                createTextVNode(toDisplayString((selectedLink.value.request_analysis.size_kb || 0).toFixed(1)) + " ", 1),
                                createVNode("small", { class: "text-[10px] opacity-60" }, "KB")
                              ])
                            ])) : createCommentVNode("", true),
                            createVNode("div", { class: "h-2 bg-indigo-100 rounded-full overflow-hidden" }, [
                              createVNode("div", { class: "h-full bg-indigo-500 rounded-full w-2/3" })
                            ])
                          ])
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "space-y-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100" }, [
                      createVNode("div", { class: "space-y-6" }, [
                        createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" }, "Content Metadata"),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, [
                            createVNode("span", { class: "text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2" }, "Primary Title"),
                            createVNode("p", { class: "text-xs font-black text-slate-800 leading-snug" }, toDisplayString(selectedLink.value?.title || "Unknown Title"), 1)
                          ]),
                          createVNode("div", { class: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm" }, [
                            createVNode("span", { class: "text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-2" }, "Snippet Description"),
                            createVNode("p", { class: "text-xs font-bold text-slate-500 leading-relaxed" }, toDisplayString(selectedLink.value?.description || "No description found."), 1)
                          ])
                        ])
                      ]),
                      selectedLink.value?.extracted_json_ld?.length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-6"
                      }, [
                        createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none" }, "Embedded Schemas"),
                        createVNode("div", { class: "grid grid-cols-1 gap-3" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(selectedLink.value.extracted_json_ld, (schema, idx) => {
                            return openBlock(), createBlock("div", {
                              key: idx,
                              class: "p-4 bg-white rounded-2xl border border-blue-50 flex items-center gap-3 shadow-sm hover:border-blue-200 transition-colors"
                            }, [
                              createVNode("div", { class: "w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-4 h-4",
                                  fill: "currentColor",
                                  viewBox: "0 0 20 20"
                                }, [
                                  createVNode("path", {
                                    "fill-rule": "evenodd",
                                    d: "M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z",
                                    "clip-rule": "evenodd"
                                  })
                                ]))
                              ]),
                              createVNode("span", { class: "text-[10px] font-black text-slate-700 uppercase" }, toDisplayString(schema["@type"]), 1)
                            ]);
                          }), 128))
                        ])
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true),
              showProgressModal.value ? (openBlock(), createBlock("div", {
                key: 7,
                class: "fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-lg rounded-3xl shadow-xl p-10 relative scale-in-center border border-slate-200" }, [
                  createVNode("div", { class: "space-y-6" }, [
                    createVNode("div", null, [
                      createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Site Sweep in Progress"),
                      createVNode("p", { class: "text-sm text-slate-500 mt-1" }, "Analyzing internal structure and SEO health.")
                    ]),
                    createVNode("div", { class: "space-y-2" }, [
                      createVNode("div", { class: "flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest" }, [
                        createVNode("span", null, "Current Deep Scan"),
                        createVNode("span", null, toDisplayString(crawlProgress.value.total_crawled) + " / " + toDisplayString(crawlProgress.value.total_discovered), 1)
                      ]),
                      createVNode("div", { class: "w-full h-2 bg-slate-100 rounded-full overflow-hidden" }, [
                        createVNode("div", {
                          class: "h-full bg-blue-600 transition-all duration-500",
                          style: { width: `${crawlProgress.value.total_crawled / (crawlProgress.value.total_discovered || 1) * 100}%` }
                        }, null, 4)
                      ])
                    ]),
                    createVNode("div", { class: "bg-slate-50 rounded-xl p-4 h-32 overflow-y-auto border border-slate-100" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(crawlProgress.value.logs, (log, idx) => {
                        return openBlock(), createBlock("div", {
                          key: idx,
                          class: "text-[10px] text-slate-600 font-medium py-1 border-b border-slate-100 last:border-0"
                        }, toDisplayString(log), 1);
                      }), 128)),
                      !crawlProgress.value.logs.length ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-[10px] text-slate-400 italic"
                      }, "Initializing engine outputs...")) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "flex flex-col gap-3" }, [
                      createVNode("button", {
                        onClick: ($event) => showProgressModal.value = false,
                        class: "w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm transition-standard hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-200"
                      }, " Keep Scanning in Background ", 8, ["onClick"]),
                      createVNode("button", {
                        onClick: cancelCrawl,
                        class: "w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-standard hover:bg-red-100 active:scale-95 border border-red-100/50"
                      }, " Terminate Sync & Discard ")
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true),
              showCompletionToast.value ? (openBlock(), createBlock("div", {
                key: 8,
                class: "fixed bottom-10 right-10 z-[200] animate-slide-up"
              }, [
                createVNode("div", { class: "bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6" }, [
                  createVNode("div", { class: "w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white" }, [
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
                        d: "M5 13l4 4L19 7"
                      })
                    ]))
                  ]),
                  createVNode("div", null, [
                    createVNode("h4", { class: "text-sm font-black tracking-tight" }, "Sync Complete!"),
                    createVNode("p", { class: "text-[10px] text-slate-400 font-medium whitespace-nowrap" }, "All links have been verified and updated.")
                  ]),
                  createVNode("button", {
                    onClick: ($event) => showCompletionToast.value = false,
                    class: "text-slate-500 hover:text-white transition-colors p-2"
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
              ])) : createCommentVNode("", true),
              withDirectives(createVNode("div", { class: "fixed bottom-10 right-10 z-[200] animate-slide-up" }, [
                createVNode("div", { class: "bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6" }, [
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
                        "stroke-width": "2",
                        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      })
                    ]))
                  ]),
                  createVNode("div", null, [
                    createVNode("h4", { class: "text-sm font-black tracking-tight" }, "Analysis Failed"),
                    createVNode("p", { class: "text-[10px] text-red-100 font-medium whitespace-nowrap" }, toDisplayString(errorToastMessage.value), 1)
                  ]),
                  createVNode("button", {
                    onClick: ($event) => showErrorToast.value = false,
                    class: "text-red-200 hover:text-white transition-colors p-2"
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
              ], 512), [
                [vShow, showErrorToast.value]
              ]),
              createVNode(Transition, { name: "fade" }, {
                default: withCtx(() => [
                  showImportToast.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed bottom-28 right-10 z-[300] bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-blue-400/50 backdrop-blur-md"
                  }, [
                    createVNode("div", { class: "bg-white/20 p-2 rounded-full" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-white",
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
                    createVNode("div", { class: "flex flex-col" }, [
                      createVNode("span", { class: "text-[10px] font-black uppercase tracking-widest text-blue-100" }, "Import Complete"),
                      createVNode("span", { class: "text-sm font-bold truncate max-w-[220px]" }, toDisplayString(importToastMessage.value), 1)
                    ]),
                    createVNode("button", {
                      onClick: ($event) => showImportToast.value = false,
                      class: "text-blue-200 hover:text-white transition-colors p-1"
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
                  ])) : createCommentVNode("", true)
                ]),
                _: 1
              }),
              createVNode(Transition, { name: "fade" }, {
                default: withCtx(() => [
                  showLinkToast.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed bottom-10 right-10 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-subtle border border-emerald-400/50 backdrop-blur-md"
                  }, [
                    createVNode("div", { class: "bg-white/20 p-2 rounded-full" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-white",
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
                    createVNode("div", { class: "flex flex-col" }, [
                      createVNode("span", { class: "text-[10px] font-black uppercase tracking-widest text-emerald-100" }, "Synchronized"),
                      createVNode("span", { class: "text-sm font-bold truncate max-w-[200px]" }, toDisplayString(lastDiscoveredUrl.value), 1)
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
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Sitemaps/Manager.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Manager = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-18b5b6e1"]]);
export {
  Manager as default
};
