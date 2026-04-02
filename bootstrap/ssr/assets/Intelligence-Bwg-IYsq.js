import { ref, reactive, onMounted, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, withDirectives, vModelText, Fragment, renderList, toDisplayString, vModelSelect, createCommentVNode, Transition, withModifiers, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass } from "vue/server-renderer";
import { usePage, Link } from "@inertiajs/vue3";
import axios from "axios";
import _ from "lodash";
import { _ as _sfc_main$1 } from "./AppLayout-Bc8-cOZM.js";
import Sparkline from "./Sparkline-CM-EizRb.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
import "chart.js/auto";
const _sfc_main = {
  __name: "Intelligence",
  __ssrInlineRender: true,
  props: {
    organization: Object,
    industries: Array
  },
  setup(__props) {
    const props = __props;
    usePage();
    const keywords = ref([]);
    const loading = ref(false);
    const mlLoading = ref(false);
    const mlResult = ref(null);
    const selectedKeyword = ref(null);
    const showBookmarksOnly = ref(false);
    const filters = reactive({
      search: "",
      niche: "",
      status: "",
      region: ""
    });
    const fetchKeywords = async () => {
      loading.value = true;
      try {
        const routeName = showBookmarksOnly.value ? "api.ki.bookmarks" : "api.ki.index";
        const res = await axios.get(route(routeName), {
          params: filters,
          headers: { "X-Organization-Id": props.organization.id }
        });
        if (showBookmarksOnly.value) {
          keywords.value = res.data.filter((b) => b.intelligence).map((b) => ({
            ...b.intelligence,
            is_bookmarked: true,
            bookmark_id: b.id
          }));
        } else {
          keywords.value = res.data.data;
        }
      } catch (err) {
        console.error(err);
      } finally {
        loading.value = false;
      }
    };
    const debouncedSearch = _.debounce(fetchKeywords, 500);
    const statusClass = (status) => {
      const classes = {
        rising: "bg-emerald-100 text-emerald-600",
        stable: "bg-blue-100 text-blue-600",
        decaying: "bg-rose-100 text-rose-600",
        dormant: "bg-slate-100 text-slate-600",
        resurgent: "bg-amber-100 text-amber-600"
      };
      return classes[status] || "bg-slate-100 text-slate-500";
    };
    const sparklineColor = (status) => {
      const colors = {
        rising: "#10b981",
        stable: "#3b82f6",
        decaying: "#f43f5e",
        dormant: "#94a3b8",
        resurgent: "#f59e0b"
      };
      return colors[status] || "#3b82f6";
    };
    const showDetails = (kw) => {
      selectedKeyword.value = kw;
      mlResult.value = null;
    };
    const toggleBookmarks = () => {
      showBookmarksOnly.value = !showBookmarksOnly.value;
      fetchKeywords();
    };
    const toggleBookmark = async (kw) => {
      try {
        if (kw.is_bookmarked) {
          await axios.delete(route("api.ki.bookmark.destroy", kw.id));
          kw.is_bookmarked = false;
        } else {
          await axios.post(route("api.ki.bookmark", kw.id), {
            organization_id: props.organization.id,
            use_case: "research"
          });
          kw.is_bookmarked = true;
        }
      } catch (err) {
        console.error(err);
      }
    };
    const predictDecay = async (kw) => {
      mlLoading.value = true;
      try {
        const res = await axios.post(route("api.ki.predict-decay", kw.id));
        mlResult.value = res.data.ml_result;
        kw.decay_status = res.data.ml_result.decay_status;
        kw.trend_velocity = res.data.ml_result.velocity;
        kw.relevance_score = res.data.ml_result.resurgence_probability * 100;
      } catch (err) {
        console.error(err);
      } finally {
        mlLoading.value = false;
      }
    };
    onMounted(fetchKeywords);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Keyword Intelligence" }, _attrs), {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1440px] mx-auto pb-20"${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"${_scopeId}><div${_scopeId}><h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2"${_scopeId}>Keyword Intelligence</h1><p class="text-slate-500 font-medium"${_scopeId}>Canonical knowledge base of trending topics with decay &amp; resurgence forecasting.</p></div><div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.trending"),
              class: "px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-1.5"
            }, {
              default: withCtx((_3, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId2}></path></svg><span class="hidden sm:inline"${_scopeId2}>Back</span>`);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-3.5 h-3.5 text-blue-500",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2.5",
                        d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                      })
                    ])),
                    createVNode("span", { class: "hidden sm:inline" }, "Back")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<div class="w-px h-4 bg-slate-200 mx-1"${_scopeId}></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.trending"),
              class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
            }, {
              default: withCtx((_3, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"${_scopeId2}></path></svg> Trends `);
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
                        d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      })
                    ])),
                    createTextVNode(" Trends ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<button class="px-4 py-2 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all duration-300 flex items-center gap-2"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"${_scopeId}></path></svg> Intelligence </button>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.research"),
              class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
            }, {
              default: withCtx((_3, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId2}></path></svg> Research `);
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
                        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      })
                    ])),
                    createTextVNode(" Research ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div><div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-6"${_scopeId}><div class="flex-1 min-w-[300px] relative"${_scopeId}><input${ssrRenderAttr("value", filters.search)} type="text" placeholder="Search keywords..." class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all"${_scopeId}><svg class="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div><div class="flex items-center gap-3"${_scopeId}><select class="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.niche) ? ssrLooseContain(filters.niche, "") : ssrLooseEqual(filters.niche, "")) ? " selected" : ""}${_scopeId}>All Niches</option><!--[-->`);
            ssrRenderList(__props.industries, (industry) => {
              _push2(`<option${ssrRenderAttr("value", industry.slug)}${ssrIncludeBooleanAttr(Array.isArray(filters.niche) ? ssrLooseContain(filters.niche, industry.slug) : ssrLooseEqual(filters.niche, industry.slug)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(industry.name)}</option>`);
            });
            _push2(`<!--]--></select><select class="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}${_scopeId}>All Statuses</option><option value="rising"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "rising") : ssrLooseEqual(filters.status, "rising")) ? " selected" : ""}${_scopeId}>Rising</option><option value="stable"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "stable") : ssrLooseEqual(filters.status, "stable")) ? " selected" : ""}${_scopeId}>Stable</option><option value="decaying"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "decaying") : ssrLooseEqual(filters.status, "decaying")) ? " selected" : ""}${_scopeId}>Decaying</option><option value="dormant"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "dormant") : ssrLooseEqual(filters.status, "dormant")) ? " selected" : ""}${_scopeId}>Dormant</option><option value="resurgent"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "resurgent") : ssrLooseEqual(filters.status, "resurgent")) ? " selected" : ""}${_scopeId}>Resurgent</option></select><button class="${ssrRenderClass([showBookmarksOnly.value ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100", "px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"])}"${_scopeId}><svg class="w-4 h-4"${ssrRenderAttr("fill", showBookmarksOnly.value ? "currentColor" : "none")} stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"${_scopeId}></path></svg> ${ssrInterpolate(showBookmarksOnly.value ? "My Bookmarks" : "Show Bookmarks")}</button></div></div>`);
            if (loading.value) {
              _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"${_scopeId}><!--[-->`);
              ssrRenderList(12, (i) => {
                _push2(`<div class="h-64 bg-slate-100 animate-pulse rounded-3xl"${_scopeId}></div>`);
              });
              _push2(`<!--]--></div>`);
            } else if (keywords.value.length > 0) {
              _push2(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"${_scopeId}><!--[-->`);
              ssrRenderList(keywords.value, (kw) => {
                _push2(`<div class="group bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden flex flex-col"${_scopeId}><div class="flex items-center justify-between mb-4"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><span class="${ssrRenderClass([statusClass(kw.decay_status), "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"])}"${_scopeId}>${ssrInterpolate(kw.decay_status)}</span>`);
                if (kw.category) {
                  _push2(`<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>${ssrInterpolate(kw.category)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
                if (kw.relevance_score) {
                  _push2(`<div class="mb-4"${_scopeId}><div class="${ssrRenderClass([
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                    kw.relevance_score >= 80 ? "bg-purple-50 text-purple-700 border-purple-100" : kw.relevance_score >= 50 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-100"
                  ])}"${_scopeId}><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"${_scopeId}></path></svg> ${ssrInterpolate(kw.relevance_score >= 80 ? "Strategic priority" : kw.relevance_score >= 50 ? "High Relevance" : "Medium Relevance")}</div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<button class="${ssrRenderClass([{ "text-amber-500": kw.is_bookmarked }, "text-slate-300 hover:text-amber-500 transition-colors"])}"${_scopeId}><svg class="w-5 h-5"${ssrRenderAttr("fill", kw.is_bookmarked ? "currentColor" : "none")} stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"${_scopeId}></path></svg></button></div><h3 class="text-xl font-black text-slate-900 mb-4 truncate group-hover:text-blue-600 transition-colors"${_scopeId}>${ssrInterpolate(kw.keyword)}</h3><div class="h-16 mb-6 w-full opacity-60 group-hover:opacity-100 transition-opacity"${_scopeId}>`);
                _push2(ssrRenderComponent(Sparkline, {
                  data: kw.trend_history,
                  color: sparklineColor(kw.decay_status)
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-50"${_scopeId}><div${_scopeId}><p class="text-[10px] uppercase font-bold text-slate-400 mb-0.5"${_scopeId}>Velocity</p><span class="${ssrRenderClass([kw.trend_velocity >= 0 ? "text-emerald-500" : "text-rose-500", "text-lg font-black"])}"${_scopeId}>${ssrInterpolate(kw.trend_velocity >= 0 ? "+" : "")}${ssrInterpolate(Math.round(kw.trend_velocity))}% </span></div><button class="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"${_scopeId}> Analyze <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"${_scopeId}></path></svg></button></div></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"${_scopeId}><div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"${_scopeId}><svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"${_scopeId}></path></svg></div><h3 class="text-xl font-bold text-slate-900 mb-2"${_scopeId}>No Intelligence Available</h3><p class="text-slate-500 max-w-sm mx-auto"${_scopeId}>Discovery jobs will populate this canonical knowledge base automatically.</p>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: _ctx.route("keywords.trending"),
                class: "mt-6 inline-block text-blue-600 font-bold hover:underline"
              }, {
                default: withCtx((_3, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Run a Discovery Scan →`);
                  } else {
                    return [
                      createTextVNode("Run a Discovery Scan →")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            }
            _push2(`</div>`);
            if (selectedKeyword.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"${_scopeId}><div class="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden relative"${_scopeId}><button class="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><div class="flex items-center justify-between mb-8 pr-10"${_scopeId}><h2 class="text-3xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(selectedKeyword.value.keyword)}</h2><span class="${ssrRenderClass([statusClass(selectedKeyword.value.decay_status), "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest"])}"${_scopeId}>${ssrInterpolate(selectedKeyword.value.decay_status)}</span></div><div class="grid grid-cols-3 gap-6 mb-8"${_scopeId}><div class="bg-slate-50 p-6 rounded-3xl"${_scopeId}><p class="text-xs font-bold text-slate-400 uppercase mb-2"${_scopeId}>Trend Velocity</p><p class="text-3xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(selectedKeyword.value.trend_velocity)}%</p></div><div class="bg-slate-50 p-6 rounded-3xl"${_scopeId}><p class="text-xs font-bold text-slate-400 uppercase mb-2"${_scopeId}>Global Score</p><p class="text-3xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(Math.round(selectedKeyword.value.global_score))}</p></div><div class="bg-slate-50 p-6 rounded-3xl"${_scopeId}><p class="text-xs font-bold text-slate-400 uppercase mb-2"${_scopeId}>ML Relevance</p><p class="text-3xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(selectedKeyword.value.relevance_score ? Math.round(selectedKeyword.value.relevance_score) + "%" : "TBD")}</p></div></div><button${ssrIncludeBooleanAttr(mlLoading.value) ? " disabled" : ""} class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"${_scopeId}>`);
              if (mlLoading.value) {
                _push2(`<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(mlLoading.value ? "Running ML Forecast..." : "Run Precision Decay Forecast")}</button>`);
              if (mlResult.value) {
                _push2(`<div class="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2"${_scopeId}><div class="flex items-center gap-3 mb-4"${_scopeId}><div class="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black"${_scopeId}>AI</div><h4 class="font-black text-emerald-900 text-lg"${_scopeId}>Resurgence Prediction</h4></div><p class="text-emerald-800 font-medium leading-relaxed"${_scopeId}> Trend is currently <strong class="uppercase"${_scopeId}>${ssrInterpolate(mlResult.value.decay_status)}</strong> with a forecast value of <strong${_scopeId}>${ssrInterpolate(mlResult.value.forecast_30d)}</strong> in 30 days. Probability of resurgence: <strong${_scopeId}>${ssrInterpolate((mlResult.value.resurgence_probability * 100).toFixed(1))}%</strong>. </p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "max-w-[1440px] mx-auto pb-20" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-extrabold text-slate-900 tracking-tight mb-2" }, "Keyword Intelligence"),
                    createVNode("p", { class: "text-slate-500 font-medium" }, "Canonical knowledge base of trending topics with decay & resurgence forecasting.")
                  ]),
                  createVNode("div", { class: "flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner w-fit" }, [
                    createVNode(unref(Link), {
                      href: _ctx.route("keywords.trending"),
                      class: "px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-1.5"
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createBlock("svg", {
                          class: "w-3.5 h-3.5 text-blue-500",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2.5",
                            d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                          })
                        ])),
                        createVNode("span", { class: "hidden sm:inline" }, "Back")
                      ]),
                      _: 1
                    }, 8, ["href"]),
                    createVNode("div", { class: "w-px h-4 bg-slate-200 mx-1" }),
                    createVNode(unref(Link), {
                      href: _ctx.route("keywords.trending"),
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
                            d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          })
                        ])),
                        createTextVNode(" Trends ")
                      ]),
                      _: 1
                    }, 8, ["href"]),
                    createVNode("button", { class: "px-4 py-2 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all duration-300 flex items-center gap-2" }, [
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
                    createVNode(unref(Link), {
                      href: _ctx.route("keywords.research"),
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
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ])),
                        createTextVNode(" Research ")
                      ]),
                      _: 1
                    }, 8, ["href"])
                  ])
                ]),
                createVNode("div", { class: "bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-6" }, [
                  createVNode("div", { class: "flex-1 min-w-[300px] relative" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => filters.search = $event,
                      type: "text",
                      placeholder: "Search keywords...",
                      class: "w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all",
                      onInput: unref(debouncedSearch)
                    }, null, 40, ["onUpdate:modelValue", "onInput"]), [
                      [vModelText, filters.search]
                    ]),
                    (openBlock(), createBlock("svg", {
                      class: "w-5 h-5 text-slate-400 absolute left-4 top-3.5",
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
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => filters.niche = $event,
                      onChange: fetchKeywords,
                      class: "bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                    }, [
                      createVNode("option", { value: "" }, "All Niches"),
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.industries, (industry) => {
                        return openBlock(), createBlock("option", {
                          key: industry.slug,
                          value: industry.slug
                        }, toDisplayString(industry.name), 9, ["value"]);
                      }), 128))
                    ], 40, ["onUpdate:modelValue"]), [
                      [vModelSelect, filters.niche]
                    ]),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => filters.status = $event,
                      onChange: fetchKeywords,
                      class: "bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                    }, [
                      createVNode("option", { value: "" }, "All Statuses"),
                      createVNode("option", { value: "rising" }, "Rising"),
                      createVNode("option", { value: "stable" }, "Stable"),
                      createVNode("option", { value: "decaying" }, "Decaying"),
                      createVNode("option", { value: "dormant" }, "Dormant"),
                      createVNode("option", { value: "resurgent" }, "Resurgent")
                    ], 40, ["onUpdate:modelValue"]), [
                      [vModelSelect, filters.status]
                    ]),
                    createVNode("button", {
                      onClick: toggleBookmarks,
                      class: ["px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all", showBookmarksOnly.value ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"]
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4",
                        fill: showBookmarksOnly.value ? "currentColor" : "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        })
                      ], 8, ["fill"])),
                      createTextVNode(" " + toDisplayString(showBookmarksOnly.value ? "My Bookmarks" : "Show Bookmarks"), 1)
                    ], 2)
                  ])
                ]),
                loading.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                }, [
                  (openBlock(), createBlock(Fragment, null, renderList(12, (i) => {
                    return createVNode("div", {
                      key: i,
                      class: "h-64 bg-slate-100 animate-pulse rounded-3xl"
                    });
                  }), 64))
                ])) : keywords.value.length > 0 ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(keywords.value, (kw) => {
                    return openBlock(), createBlock("div", {
                      key: kw.id,
                      class: "group bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden flex flex-col"
                    }, [
                      createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                        createVNode("div", { class: "flex items-center gap-2" }, [
                          createVNode("span", {
                            class: ["px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", statusClass(kw.decay_status)]
                          }, toDisplayString(kw.decay_status), 3),
                          kw.category ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                          }, toDisplayString(kw.category), 1)) : createCommentVNode("", true)
                        ]),
                        kw.relevance_score ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mb-4"
                        }, [
                          createVNode("div", {
                            class: [
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                              kw.relevance_score >= 80 ? "bg-purple-50 text-purple-700 border-purple-100" : kw.relevance_score >= 50 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-100"
                            ]
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3 h-3",
                              fill: "currentColor",
                              viewBox: "0 0 20 20"
                            }, [
                              createVNode("path", {
                                "fill-rule": "evenodd",
                                d: "M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z",
                                "clip-rule": "evenodd"
                              })
                            ])),
                            createTextVNode(" " + toDisplayString(kw.relevance_score >= 80 ? "Strategic priority" : kw.relevance_score >= 50 ? "High Relevance" : "Medium Relevance"), 1)
                          ], 2)
                        ])) : createCommentVNode("", true),
                        createVNode("button", {
                          onClick: ($event) => toggleBookmark(kw),
                          class: ["text-slate-300 hover:text-amber-500 transition-colors", { "text-amber-500": kw.is_bookmarked }]
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5",
                            fill: kw.is_bookmarked ? "currentColor" : "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            })
                          ], 8, ["fill"]))
                        ], 10, ["onClick"])
                      ]),
                      createVNode("h3", { class: "text-xl font-black text-slate-900 mb-4 truncate group-hover:text-blue-600 transition-colors" }, toDisplayString(kw.keyword), 1),
                      createVNode("div", { class: "h-16 mb-6 w-full opacity-60 group-hover:opacity-100 transition-opacity" }, [
                        createVNode(Sparkline, {
                          data: kw.trend_history,
                          color: sparklineColor(kw.decay_status)
                        }, null, 8, ["data", "color"])
                      ]),
                      createVNode("div", { class: "mt-auto flex items-center justify-between pt-4 border-t border-slate-50" }, [
                        createVNode("div", null, [
                          createVNode("p", { class: "text-[10px] uppercase font-bold text-slate-400 mb-0.5" }, "Velocity"),
                          createVNode("span", {
                            class: ["text-lg font-black", kw.trend_velocity >= 0 ? "text-emerald-500" : "text-rose-500"]
                          }, toDisplayString(kw.trend_velocity >= 0 ? "+" : "") + toDisplayString(Math.round(kw.trend_velocity)) + "% ", 3)
                        ]),
                        createVNode("button", {
                          onClick: ($event) => showDetails(kw),
                          class: "text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
                        }, [
                          createTextVNode(" Analyze "),
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
                        ], 8, ["onClick"])
                      ])
                    ]);
                  }), 128))
                ])) : (openBlock(), createBlock("div", {
                  key: 2,
                  class: "text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"
                }, [
                  createVNode("div", { class: "w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-10 h-10 text-slate-300",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      })
                    ]))
                  ]),
                  createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "No Intelligence Available"),
                  createVNode("p", { class: "text-slate-500 max-w-sm mx-auto" }, "Discovery jobs will populate this canonical knowledge base automatically."),
                  createVNode(unref(Link), {
                    href: _ctx.route("keywords.trending"),
                    class: "mt-6 inline-block text-blue-600 font-bold hover:underline"
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Run a Discovery Scan →")
                    ]),
                    _: 1
                  }, 8, ["href"])
                ]))
              ]),
              createVNode(Transition, {
                "enter-active-class": "transition duration-300 ease-out",
                "enter-from-class": "opacity-0",
                "enter-to-class": "opacity-100",
                "leave-active-class": "transition duration-200 ease-in",
                "leave-from-class": "opacity-100",
                "leave-to-class": "opacity-0"
              }, {
                default: withCtx(() => [
                  selectedKeyword.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md",
                    onClick: withModifiers(($event) => selectedKeyword.value = null, ["self"])
                  }, [
                    createVNode("div", { class: "bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden relative" }, [
                      createVNode("button", {
                        onClick: ($event) => selectedKeyword.value = null,
                        class: "absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
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
                      ], 8, ["onClick"]),
                      createVNode("div", { class: "flex items-center justify-between mb-8 pr-10" }, [
                        createVNode("h2", { class: "text-3xl font-black text-slate-900" }, toDisplayString(selectedKeyword.value.keyword), 1),
                        createVNode("span", {
                          class: [statusClass(selectedKeyword.value.decay_status), "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest"]
                        }, toDisplayString(selectedKeyword.value.decay_status), 3)
                      ]),
                      createVNode("div", { class: "grid grid-cols-3 gap-6 mb-8" }, [
                        createVNode("div", { class: "bg-slate-50 p-6 rounded-3xl" }, [
                          createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase mb-2" }, "Trend Velocity"),
                          createVNode("p", { class: "text-3xl font-black text-slate-900" }, toDisplayString(selectedKeyword.value.trend_velocity) + "%", 1)
                        ]),
                        createVNode("div", { class: "bg-slate-50 p-6 rounded-3xl" }, [
                          createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase mb-2" }, "Global Score"),
                          createVNode("p", { class: "text-3xl font-black text-slate-900" }, toDisplayString(Math.round(selectedKeyword.value.global_score)), 1)
                        ]),
                        createVNode("div", { class: "bg-slate-50 p-6 rounded-3xl" }, [
                          createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase mb-2" }, "ML Relevance"),
                          createVNode("p", { class: "text-3xl font-black text-slate-900" }, toDisplayString(selectedKeyword.value.relevance_score ? Math.round(selectedKeyword.value.relevance_score) + "%" : "TBD"), 1)
                        ])
                      ]),
                      createVNode("button", {
                        onClick: ($event) => predictDecay(selectedKeyword.value),
                        disabled: mlLoading.value,
                        class: "w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      }, [
                        mlLoading.value ? (openBlock(), createBlock("svg", {
                          key: 0,
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
                        ])) : createCommentVNode("", true),
                        createTextVNode(" " + toDisplayString(mlLoading.value ? "Running ML Forecast..." : "Run Precision Decay Forecast"), 1)
                      ], 8, ["onClick", "disabled"]),
                      mlResult.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2"
                      }, [
                        createVNode("div", { class: "flex items-center gap-3 mb-4" }, [
                          createVNode("div", { class: "w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black" }, "AI"),
                          createVNode("h4", { class: "font-black text-emerald-900 text-lg" }, "Resurgence Prediction")
                        ]),
                        createVNode("p", { class: "text-emerald-800 font-medium leading-relaxed" }, [
                          createTextVNode(" Trend is currently "),
                          createVNode("strong", { class: "uppercase" }, toDisplayString(mlResult.value.decay_status), 1),
                          createTextVNode(" with a forecast value of "),
                          createVNode("strong", null, toDisplayString(mlResult.value.forecast_30d), 1),
                          createTextVNode(" in 30 days. Probability of resurgence: "),
                          createVNode("strong", null, toDisplayString((mlResult.value.resurgence_probability * 100).toFixed(1)) + "%", 1),
                          createTextVNode(". ")
                        ])
                      ])) : createCommentVNode("", true)
                    ])
                  ], 8, ["onClick"])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Keywords/Intelligence.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
