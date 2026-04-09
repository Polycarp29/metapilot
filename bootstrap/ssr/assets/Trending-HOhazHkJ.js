import { ref, computed, watch, onMounted, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, Fragment, renderList, createCommentVNode, withDirectives, vModelText, vModelSelect, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { usePage, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-Oqd_r1Cw.js";
import axios from "axios";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Trending",
  __ssrInlineRender: true,
  setup(__props) {
    const page = usePage();
    const activeTab = ref("trends");
    const loading = ref(false);
    const keywords = ref([]);
    const globalKeywords = ref([]);
    const industries = ref(["Real Estate", "Betting", "Tech", "Health", "Finance"]);
    const bookmarkItems = ref([]);
    const savingId = ref(null);
    const filters = ref({
      geo: "KE",
      niche: "",
      search: ""
    });
    const currentOrg = computed(() => page.props.auth.user.current_organization || page.props.auth.user.organizations?.[0]);
    const runDiscovery = async () => {
      loading.value = true;
      try {
        await axios.post(route("api.trending-keywords.discover"));
        await fetchTrends();
      } catch (err) {
        console.error("Discovery failed", err);
      } finally {
        loading.value = false;
      }
    };
    const fetchTrends = async () => {
      loading.value = true;
      try {
        const res = await axios.get(route("api.trending-keywords.index"));
        keywords.value = res.data.keywords;
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        loading.value = false;
      }
    };
    const fetchGlobalIntelligence = async () => {
      loading.value = true;
      try {
        const res = await axios.get(route("api.ki.index"), {
          params: {
            region: filters.value.geo === "GLOBAL" ? "" : filters.value.geo,
            niche: filters.value.niche,
            search: filters.value.search
          }
        });
        globalKeywords.value = res.data.data;
      } catch (err) {
        console.error("Failed to fetch global intelligence", err);
      } finally {
        loading.value = false;
      }
    };
    const fetchBookmarks = async () => {
      try {
        const res = await axios.get(route("api.keywords.wallet.index"));
        bookmarkItems.value = res.data.data;
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      }
    };
    const saveToBookmark = async (kw, isGlobal = false) => {
      savingId.value = kw.id;
      try {
        if (isGlobal) {
          await axios.post(route("api.ki.bookmark", kw.id), {
            organization_id: currentOrg.value.id,
            use_case: "research"
          });
          kw.is_bookmarked = true;
        } else {
          await axios.post(route("api.keywords.wallet.store"), {
            keyword: kw.keyword,
            source: "trending",
            metadata: {
              country: kw.country_code,
              growth: kw.growth_rate,
              type: kw.recommendation_type
            }
          });
        }
        await fetchBookmarks();
      } catch (err) {
        console.error("Save failed", err);
      } finally {
        savingId.value = null;
      }
    };
    const removeFromBookmarks = async (id) => {
      if (!confirm("Remove this keyword?")) return;
      try {
        await axios.delete(route("api.keywords.wallet.destroy", id));
        await fetchBookmarks();
      } catch (err) {
        console.error("Delete failed", err);
      }
    };
    watch(activeTab, (newTab) => {
      if (newTab === "global" && globalKeywords.value.length === 0) {
        fetchGlobalIntelligence();
      }
      if (newTab === "bookmarks") {
        fetchBookmarks();
      }
    });
    onMounted(async () => {
      await fetchTrends();
      await fetchBookmarks();
      if (keywords.value.length === 0) {
        runDiscovery();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Keyword Insights" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1440px] mx-auto" data-v-71489148${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10" data-v-71489148${_scopeId}><div data-v-71489148${_scopeId}><h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2" data-v-71489148${_scopeId}>Keyword Insights</h1><p class="text-slate-500 font-medium" data-v-71489148${_scopeId}>Discover trending topics in your niche and save them for your next campaign.</p></div><div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit" data-v-71489148${_scopeId}><button class="${ssrRenderClass([activeTab.value === "trends" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50", "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"])}" data-v-71489148${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" data-v-71489148${_scopeId}></path></svg> Smart Trends </button><button class="${ssrRenderClass([activeTab.value === "global" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50", "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"])}" data-v-71489148${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" data-v-71489148${_scopeId}></path></svg> Global Discovery </button><button class="${ssrRenderClass([activeTab.value === "bookmarks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50", "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2"])}" data-v-71489148${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" data-v-71489148${_scopeId}></path></svg> Bookmarks </button><div class="w-px h-4 bg-slate-200 mx-1" data-v-71489148${_scopeId}></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.intelligence"),
              class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" data-v-71489148${_scopeId2}></path></svg> Intelligence `);
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
                        "stroke-width": "2",
                        d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      })
                    ])),
                    createTextVNode(" Intelligence ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
            if (activeTab.value === "trends") {
              _push2(`<div class="space-y-8 animate-in fade-in duration-500" data-v-71489148${_scopeId}><div class="flex flex-wrap items-center gap-4" data-v-71489148${_scopeId}><button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} data-v-71489148${_scopeId}>`);
              if (loading.value) {
                _push2(`<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-71489148${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-71489148${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-71489148${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-71489148${_scopeId}></path></svg>`);
              }
              _push2(` ${ssrInterpolate(loading.value ? "Running Smart Discovery..." : "Scan Organization Trends")}</button></div>`);
              if (keywords.value.length > 0) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-v-71489148${_scopeId}><!--[-->`);
                ssrRenderList(keywords.value, (kw) => {
                  _push2(`<div class="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all duration-300 relative overflow-hidden shadow-sm" data-v-71489148${_scopeId}><div class="flex items-center justify-between mb-4" data-v-71489148${_scopeId}><span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase" data-v-71489148${_scopeId}>${ssrInterpolate((kw.recommendation_type || "discovery").replace("_", " "))}</span><span class="text-slate-400 text-xs font-bold" data-v-71489148${_scopeId}>${ssrInterpolate(kw.country_code)}</span></div><h3 class="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors" data-v-71489148${_scopeId}>${ssrInterpolate(kw.keyword)}</h3><div class="flex items-end justify-between mt-6" data-v-71489148${_scopeId}><div data-v-71489148${_scopeId}><p class="text-[10px] uppercase font-bold text-slate-400 mb-1" data-v-71489148${_scopeId}>Growth</p><span class="text-2xl font-black text-slate-900" data-v-71489148${_scopeId}>+${ssrInterpolate(Math.round(kw.growth_rate))}%</span></div><button class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white"${ssrIncludeBooleanAttr(savingId.value === kw.id) ? " disabled" : ""} data-v-71489148${_scopeId}>`);
                  if (savingId.value === kw.id) {
                    _push2(`<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-71489148${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-71489148${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-71489148${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" data-v-71489148${_scopeId}></path></svg>`);
                  }
                  _push2(`</button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "global") {
              _push2(`<div class="space-y-8 animate-in slide-in-from-bottom-4 duration-500" data-v-71489148${_scopeId}><div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6" data-v-71489148${_scopeId}><div class="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto" data-v-71489148${_scopeId}><div class="relative w-full sm:w-80" data-v-71489148${_scopeId}><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="Search global intelligence pool..." class="w-full bg-slate-50 border-none rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" data-v-71489148${_scopeId}><svg class="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-71489148${_scopeId}></path></svg></div><select class="w-full sm:w-auto bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20" data-v-71489148${_scopeId}><option value="KE" data-v-71489148${ssrIncludeBooleanAttr(Array.isArray(filters.value.geo) ? ssrLooseContain(filters.value.geo, "KE") : ssrLooseEqual(filters.value.geo, "KE")) ? " selected" : ""}${_scopeId}>Kenya (KE)</option><option value="US" data-v-71489148${ssrIncludeBooleanAttr(Array.isArray(filters.value.geo) ? ssrLooseContain(filters.value.geo, "US") : ssrLooseEqual(filters.value.geo, "US")) ? " selected" : ""}${_scopeId}>USA (US)</option><option value="GLOBAL" data-v-71489148${ssrIncludeBooleanAttr(Array.isArray(filters.value.geo) ? ssrLooseContain(filters.value.geo, "GLOBAL") : ssrLooseEqual(filters.value.geo, "GLOBAL")) ? " selected" : ""}${_scopeId}>Worldwide Hub</option></select></div><div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full xl:w-auto" data-v-71489148${_scopeId}><button class="${ssrRenderClass([filters.value.niche === "" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100", "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"])}" data-v-71489148${_scopeId}> All Segments </button><!--[-->`);
              ssrRenderList(industries.value, (niche) => {
                _push2(`<button class="${ssrRenderClass([filters.value.niche === niche ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100", "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"])}" data-v-71489148${_scopeId}>${ssrInterpolate(niche)}</button>`);
              });
              _push2(`<!--]--></div></div>`);
              if (globalKeywords.value.length > 0) {
                _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-v-71489148${_scopeId}><!--[-->`);
                ssrRenderList(globalKeywords.value, (kw) => {
                  _push2(`<div class="bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all group shadow-sm flex flex-col justify-between min-h-[220px]" data-v-71489148${_scopeId}><div data-v-71489148${_scopeId}><div class="flex items-center justify-between mb-4" data-v-71489148${_scopeId}><span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic" data-v-71489148${_scopeId}>${ssrInterpolate(kw.category || "Discovery")}</span><div class="flex items-center gap-1.5" data-v-71489148${_scopeId}><span class="${ssrRenderClass([kw.decay_status === "rising" ? "bg-emerald-500" : "bg-slate-400", "w-1.5 h-1.5 rounded-full"])}" data-v-71489148${_scopeId}></span><span class="text-[10px] font-bold text-slate-500 uppercase" data-v-71489148${_scopeId}>${ssrInterpolate(kw.decay_status)}</span></div></div><h3 class="text-lg font-bold text-slate-900 mb-2 leading-tight" data-v-71489148${_scopeId}>${ssrInterpolate(kw.keyword)}</h3></div><div class="flex items-center justify-between pt-6 border-t border-slate-50" data-v-71489148${_scopeId}><div class="flex flex-col" data-v-71489148${_scopeId}><span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter" data-v-71489148${_scopeId}>System Score</span><span class="text-xl font-black text-slate-900 block" data-v-71489148${_scopeId}>${ssrInterpolate(Math.round(kw.global_score))}</span></div><button class="${ssrRenderClass([kw.is_bookmarked ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white", "w-11 h-11 rounded-xl flex items-center justify-center transition-all"])}"${ssrIncludeBooleanAttr(savingId.value === kw.id || kw.is_bookmarked) ? " disabled" : ""} data-v-71489148${_scopeId}>`);
                  if (savingId.value === kw.id) {
                    _push2(`<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-71489148${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-71489148${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-71489148${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-5 h-5"${ssrRenderAttr("fill", kw.is_bookmarked ? "currentColor" : "none")} stroke="currentColor" viewBox="0 0 24 24" data-v-71489148${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" data-v-71489148${_scopeId}></path></svg>`);
                  }
                  _push2(`</button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else if (!loading.value) {
                _push2(`<div class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200" data-v-71489148${_scopeId}><p class="text-slate-400 font-medium" data-v-71489148${_scopeId}>No results found for current filters.</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "bookmarks") {
              _push2(`<div class="animate-in fade-in duration-500" data-v-71489148${_scopeId}>`);
              if (bookmarkItems.value.length > 0) {
                _push2(`<div class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden" data-v-71489148${_scopeId}><table class="w-full text-left" data-v-71489148${_scopeId}><thead data-v-71489148${_scopeId}><tr class="bg-slate-50 border-b border-slate-100" data-v-71489148${_scopeId}><th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400" data-v-71489148${_scopeId}>Keyword</th><th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400" data-v-71489148${_scopeId}>Source</th><th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400" data-v-71489148${_scopeId}>Status</th><th class="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right" data-v-71489148${_scopeId}>Actions</th></tr></thead><tbody class="divide-y divide-slate-50" data-v-71489148${_scopeId}><!--[-->`);
                ssrRenderList(bookmarkItems.value, (item) => {
                  _push2(`<tr class="hover:bg-slate-50/50 transition-colors group" data-v-71489148${_scopeId}><td class="px-8 py-6" data-v-71489148${_scopeId}><span class="font-bold text-slate-900" data-v-71489148${_scopeId}>${ssrInterpolate(item.keyword)}</span></td><td class="px-8 py-6" data-v-71489148${_scopeId}><span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase" data-v-71489148${_scopeId}>${ssrInterpolate(item.source)}</span></td><td class="px-8 py-6" data-v-71489148${_scopeId}>`);
                  if (item.intelligence) {
                    _push2(`<div class="flex items-center gap-2" data-v-71489148${_scopeId}><span class="${ssrRenderClass([item.intelligence.decay_status === "rising" ? "bg-emerald-500" : "bg-slate-300", "w-1.5 h-1.5 rounded-full"])}" data-v-71489148${_scopeId}></span><span class="text-xs font-bold text-slate-700 capitalize" data-v-71489148${_scopeId}>${ssrInterpolate(item.intelligence.decay_status)}</span></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td><td class="px-8 py-6 text-right" data-v-71489148${_scopeId}><button class="text-rose-500 hover:text-rose-700 font-bold text-xs" data-v-71489148${_scopeId}>Remove</button></td></tr>`);
                });
                _push2(`<!--]--></tbody></table></div>`);
              } else {
                _push2(`<div class="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200" data-v-71489148${_scopeId}><h3 class="text-xl font-bold text-slate-900 mb-2" data-v-71489148${_scopeId}>Empty Library</h3><p class="text-slate-500" data-v-71489148${_scopeId}>Discover and save keywords to build your strategy.</p></div>`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-[1440px] mx-auto" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-extrabold text-slate-900 tracking-tight mb-2" }, "Keyword Insights"),
                    createVNode("p", { class: "text-slate-500 font-medium" }, "Discover trending topics in your niche and save them for your next campaign.")
                  ]),
                  createVNode("div", { class: "flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit" }, [
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "trends",
                      class: ["px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "trends" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"]
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
                          d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        })
                      ])),
                      createTextVNode(" Smart Trends ")
                    ], 10, ["onClick"]),
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "global",
                      class: ["px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "global" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"]
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
                          d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                        })
                      ])),
                      createTextVNode(" Global Discovery ")
                    ], 10, ["onClick"]),
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "bookmarks",
                      class: ["px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "bookmarks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"]
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
                          d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        })
                      ])),
                      createTextVNode(" Bookmarks ")
                    ], 10, ["onClick"]),
                    createVNode("div", { class: "w-px h-4 bg-slate-200 mx-1" }),
                    createVNode(unref(Link), {
                      href: _ctx.route("keywords.intelligence"),
                      class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
                    }, {
                      default: withCtx(() => [
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
                            d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          })
                        ])),
                        createTextVNode(" Intelligence ")
                      ]),
                      _: 1
                    }, 8, ["href"])
                  ])
                ]),
                activeTab.value === "trends" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-8 animate-in fade-in duration-500"
                }, [
                  createVNode("div", { class: "flex flex-wrap items-center gap-4" }, [
                    createVNode("button", {
                      onClick: runDiscovery,
                      class: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20",
                      disabled: loading.value
                    }, [
                      loading.value ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "animate-spin h-5 w-5",
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
                        class: "w-5 h-5",
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
                      createTextVNode(" " + toDisplayString(loading.value ? "Running Smart Discovery..." : "Scan Organization Trends"), 1)
                    ], 8, ["disabled"])
                  ]),
                  keywords.value.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(keywords.value, (kw) => {
                      return openBlock(), createBlock("div", {
                        key: kw.id,
                        class: "group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all duration-300 relative overflow-hidden shadow-sm"
                      }, [
                        createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                          createVNode("span", { class: "px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase" }, toDisplayString((kw.recommendation_type || "discovery").replace("_", " ")), 1),
                          createVNode("span", { class: "text-slate-400 text-xs font-bold" }, toDisplayString(kw.country_code), 1)
                        ]),
                        createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors" }, toDisplayString(kw.keyword), 1),
                        createVNode("div", { class: "flex items-end justify-between mt-6" }, [
                          createVNode("div", null, [
                            createVNode("p", { class: "text-[10px] uppercase font-bold text-slate-400 mb-1" }, "Growth"),
                            createVNode("span", { class: "text-2xl font-black text-slate-900" }, "+" + toDisplayString(Math.round(kw.growth_rate)) + "%", 1)
                          ]),
                          createVNode("button", {
                            onClick: ($event) => saveToBookmark(kw),
                            class: "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white",
                            disabled: savingId.value === kw.id
                          }, [
                            savingId.value === kw.id ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "animate-spin h-5 w-5",
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
                              class: "w-6 h-6",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                              })
                            ]))
                          ], 8, ["onClick", "disabled"])
                        ])
                      ]);
                    }), 128))
                  ])) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                activeTab.value === "global" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "space-y-8 animate-in slide-in-from-bottom-4 duration-500"
                }, [
                  createVNode("div", { class: "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6" }, [
                    createVNode("div", { class: "flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto" }, [
                      createVNode("div", { class: "relative w-full sm:w-80" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => filters.value.search = $event,
                          onInput: fetchGlobalIntelligence,
                          type: "text",
                          placeholder: "Search global intelligence pool...",
                          class: "w-full bg-slate-50 border-none rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        }, null, 40, ["onUpdate:modelValue"]), [
                          [vModelText, filters.value.search]
                        ]),
                        (openBlock(), createBlock("svg", {
                          class: "w-5 h-5 text-slate-400 absolute left-4 top-3",
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
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => filters.value.geo = $event,
                        onChange: fetchGlobalIntelligence,
                        class: "w-full sm:w-auto bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20"
                      }, [
                        createVNode("option", { value: "KE" }, "Kenya (KE)"),
                        createVNode("option", { value: "US" }, "USA (US)"),
                        createVNode("option", { value: "GLOBAL" }, "Worldwide Hub")
                      ], 40, ["onUpdate:modelValue"]), [
                        [vModelSelect, filters.value.geo]
                      ])
                    ]),
                    createVNode("div", { class: "flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full xl:w-auto" }, [
                      createVNode("button", {
                        onClick: ($event) => {
                          filters.value.niche = "";
                          fetchGlobalIntelligence();
                        },
                        class: ["px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filters.value.niche === "" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"]
                      }, " All Segments ", 10, ["onClick"]),
                      (openBlock(true), createBlock(Fragment, null, renderList(industries.value, (niche) => {
                        return openBlock(), createBlock("button", {
                          key: niche,
                          onClick: ($event) => {
                            filters.value.niche = niche;
                            fetchGlobalIntelligence();
                          },
                          class: ["px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filters.value.niche === niche ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"]
                        }, toDisplayString(niche), 11, ["onClick"]);
                      }), 128))
                    ])
                  ]),
                  globalKeywords.value.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(globalKeywords.value, (kw) => {
                      return openBlock(), createBlock("div", {
                        key: kw.id,
                        class: "bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 transition-all group shadow-sm flex flex-col justify-between min-h-[220px]"
                      }, [
                        createVNode("div", null, [
                          createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                            createVNode("span", { class: "text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic" }, toDisplayString(kw.category || "Discovery"), 1),
                            createVNode("div", { class: "flex items-center gap-1.5" }, [
                              createVNode("span", {
                                class: ["w-1.5 h-1.5 rounded-full", kw.decay_status === "rising" ? "bg-emerald-500" : "bg-slate-400"]
                              }, null, 2),
                              createVNode("span", { class: "text-[10px] font-bold text-slate-500 uppercase" }, toDisplayString(kw.decay_status), 1)
                            ])
                          ]),
                          createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-2 leading-tight" }, toDisplayString(kw.keyword), 1)
                        ]),
                        createVNode("div", { class: "flex items-center justify-between pt-6 border-t border-slate-50" }, [
                          createVNode("div", { class: "flex flex-col" }, [
                            createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-tighter" }, "System Score"),
                            createVNode("span", { class: "text-xl font-black text-slate-900 block" }, toDisplayString(Math.round(kw.global_score)), 1)
                          ]),
                          createVNode("button", {
                            onClick: ($event) => saveToBookmark(kw, true),
                            class: ["w-11 h-11 rounded-xl flex items-center justify-center transition-all", kw.is_bookmarked ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white"],
                            disabled: savingId.value === kw.id || kw.is_bookmarked
                          }, [
                            savingId.value === kw.id ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "animate-spin h-5 w-5",
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
                              class: "w-5 h-5",
                              fill: kw.is_bookmarked ? "currentColor" : "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                              })
                            ], 8, ["fill"]))
                          ], 10, ["onClick", "disabled"])
                        ])
                      ]);
                    }), 128))
                  ])) : !loading.value ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"
                  }, [
                    createVNode("p", { class: "text-slate-400 font-medium" }, "No results found for current filters.")
                  ])) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                activeTab.value === "bookmarks" ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "animate-in fade-in duration-500"
                }, [
                  bookmarkItems.value.length > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
                  }, [
                    createVNode("table", { class: "w-full text-left" }, [
                      createVNode("thead", null, [
                        createVNode("tr", { class: "bg-slate-50 border-b border-slate-100" }, [
                          createVNode("th", { class: "px-8 py-5 text-[10px] font-black uppercase text-slate-400" }, "Keyword"),
                          createVNode("th", { class: "px-8 py-5 text-[10px] font-black uppercase text-slate-400" }, "Source"),
                          createVNode("th", { class: "px-8 py-5 text-[10px] font-black uppercase text-slate-400" }, "Status"),
                          createVNode("th", { class: "px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right" }, "Actions")
                        ])
                      ]),
                      createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(bookmarkItems.value, (item) => {
                          return openBlock(), createBlock("tr", {
                            key: item.id,
                            class: "hover:bg-slate-50/50 transition-colors group"
                          }, [
                            createVNode("td", { class: "px-8 py-6" }, [
                              createVNode("span", { class: "font-bold text-slate-900" }, toDisplayString(item.keyword), 1)
                            ]),
                            createVNode("td", { class: "px-8 py-6" }, [
                              createVNode("span", { class: "px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase" }, toDisplayString(item.source), 1)
                            ]),
                            createVNode("td", { class: "px-8 py-6" }, [
                              item.intelligence ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "flex items-center gap-2"
                              }, [
                                createVNode("span", {
                                  class: ["w-1.5 h-1.5 rounded-full", item.intelligence.decay_status === "rising" ? "bg-emerald-500" : "bg-slate-300"]
                                }, null, 2),
                                createVNode("span", { class: "text-xs font-bold text-slate-700 capitalize" }, toDisplayString(item.intelligence.decay_status), 1)
                              ])) : createCommentVNode("", true)
                            ]),
                            createVNode("td", { class: "px-8 py-6 text-right" }, [
                              createVNode("button", {
                                onClick: ($event) => removeFromBookmarks(item.id),
                                class: "text-rose-500 hover:text-rose-700 font-bold text-xs"
                              }, "Remove", 8, ["onClick"])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"
                  }, [
                    createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "Empty Library"),
                    createVNode("p", { class: "text-slate-500" }, "Discover and save keywords to build your strategy.")
                  ]))
                ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Keywords/Trending.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Trending = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-71489148"]]);
export {
  Trending as default
};
