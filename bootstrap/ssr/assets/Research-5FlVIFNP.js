import { ref, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, createCommentVNode, withModifiers, withDirectives, vModelText, vModelSelect, Fragment, renderList, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { useForm, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Research",
  __ssrInlineRender: true,
  props: {
    results: Object,
    intent: String,
    niche: String,
    growth_rate: [String, Number],
    current_interest: [String, Number],
    cached: Boolean,
    last_searched: String,
    filters: Object
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      q: props.filters?.q || "",
      gl: props.filters?.gl || "ke",
      hl: props.filters?.hl || "en"
    });
    const loading = ref(false);
    function handleSearch() {
      if (!form.q) return;
      loading.value = true;
      form.get(route("keywords.research"), {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => loading.value = false
      });
    }
    function quickSearch(query) {
      form.q = query;
      handleSearch();
    }
    function detectIntent(snippet) {
      if (!snippet) return "Informational";
      const s = snippet.toLowerCase();
      if (s.includes("buy") || s.includes("price") || s.includes("shop") || s.includes("discount")) return "Commercial";
      if (s.includes("how to") || s.includes("what is") || s.includes("guide") || s.includes("tutorial")) return "Informational";
      if (s.includes("best") || s.includes("review") || s.includes("top")) return "Transactional";
      return "Navigational";
    }
    function getIntentClass(snippet) {
      const intent = detectIntent(snippet);
      const classes = {
        "Commercial": "bg-green-100 text-green-700",
        "Informational": "bg-blue-100 text-blue-700",
        "Transactional": "bg-purple-100 text-purple-700",
        "Navigational": "bg-slate-100 text-slate-700"
      };
      return classes[intent];
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Keyword Research" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="min-h-screen bg-slate-50/50 pb-20" data-v-31ee4cec${_scopeId}><div class="bg-white border-b border-slate-200 pt-12 pb-8 mb-8" data-v-31ee4cec${_scopeId}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-v-31ee4cec${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6" data-v-31ee4cec${_scopeId}><div data-v-31ee4cec${_scopeId}><h1 class="text-3xl font-extrabold text-slate-900 tracking-tight" data-v-31ee4cec${_scopeId}>Keyword Research</h1><div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner self-start mt-4 w-fit" data-v-31ee4cec${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.trending"),
              class: "px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-1.5"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-v-31ee4cec${_scopeId2}></path></svg><span class="hidden sm:inline" data-v-31ee4cec${_scopeId2}>Back</span>`);
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
            _push2(`<div class="w-px h-4 bg-slate-200 mx-1" data-v-31ee4cec${_scopeId}></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.trending"),
              class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" data-v-31ee4cec${_scopeId2}></path></svg> Trends `);
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
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("keywords.intelligence"),
              class: "px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all duration-300 flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" data-v-31ee4cec${_scopeId2}></path></svg> Intelligence `);
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
            _push2(`<button class="px-4 py-2 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-sm transition-all duration-300 flex items-center gap-2" data-v-31ee4cec${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-31ee4cec${_scopeId}></path></svg> Research </button></div><p class="text-slate-500" data-v-31ee4cec${_scopeId}>Discover search trends and analyze organic competition.</p>`);
            if (__props.results) {
              _push2(`<div class="flex gap-2" data-v-31ee4cec${_scopeId}>`);
              if (__props.cached) {
                _push2(`<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider" data-v-31ee4cec${_scopeId}> Cached ${ssrInterpolate(__props.last_searched)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.niche) {
                _push2(`<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider" data-v-31ee4cec${_scopeId}> Niche: ${ssrInterpolate(__props.niche)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.intent) {
                _push2(`<span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase tracking-wider" data-v-31ee4cec${_scopeId}> Global Intent: ${ssrInterpolate(__props.intent)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.growth_rate > 0) {
                _push2(`<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1" data-v-31ee4cec${_scopeId}><svg class="w-2 h-2" fill="currentColor" viewBox="0 0 20 20" data-v-31ee4cec${_scopeId}><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" data-v-31ee4cec${_scopeId}></path></svg> +${ssrInterpolate(__props.growth_rate)}% Growth </span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.current_interest > 50) {
                _push2(`<span class="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider" data-v-31ee4cec${_scopeId}> Rising Trend </span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><form class="flex-1 max-w-2xl" data-v-31ee4cec${_scopeId}><div class="relative group" data-v-31ee4cec${_scopeId}><input${ssrRenderAttr("value", unref(form).q)} type="text" placeholder="Enter a keyword or topic..." class="w-full pl-6 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400" data-v-31ee4cec${_scopeId}><div class="absolute inset-y-2 right-2 flex gap-2" data-v-31ee4cec${_scopeId}><select class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors" data-v-31ee4cec${_scopeId}><option value="ke" data-v-31ee4cec${ssrIncludeBooleanAttr(Array.isArray(unref(form).gl) ? ssrLooseContain(unref(form).gl, "ke") : ssrLooseEqual(unref(form).gl, "ke")) ? " selected" : ""}${_scopeId}>KE (Kenya)</option><option value="ng" data-v-31ee4cec${ssrIncludeBooleanAttr(Array.isArray(unref(form).gl) ? ssrLooseContain(unref(form).gl, "ng") : ssrLooseEqual(unref(form).gl, "ng")) ? " selected" : ""}${_scopeId}>NG (Nigeria)</option><option value="za" data-v-31ee4cec${ssrIncludeBooleanAttr(Array.isArray(unref(form).gl) ? ssrLooseContain(unref(form).gl, "za") : ssrLooseEqual(unref(form).gl, "za")) ? " selected" : ""}${_scopeId}>ZA (South Africa)</option><option value="us" data-v-31ee4cec${ssrIncludeBooleanAttr(Array.isArray(unref(form).gl) ? ssrLooseContain(unref(form).gl, "us") : ssrLooseEqual(unref(form).gl, "us")) ? " selected" : ""}${_scopeId}>US</option><option value="uk" data-v-31ee4cec${ssrIncludeBooleanAttr(Array.isArray(unref(form).gl) ? ssrLooseContain(unref(form).gl, "uk") : ssrLooseEqual(unref(form).gl, "uk")) ? " selected" : ""}${_scopeId}>UK</option></select><button type="submit"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""} class="px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-50" data-v-31ee4cec${_scopeId}>`);
            if (!loading.value) {
              _push2(`<span data-v-31ee4cec${_scopeId}>Search</span>`);
            } else {
              _push2(`<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-31ee4cec${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-31ee4cec${_scopeId}></path></svg>`);
            }
            _push2(`</button></div></div></form></div></div></div><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-v-31ee4cec${_scopeId}>`);
            if (!__props.results && !loading.value) {
              _push2(`<div class="text-center py-20 px-6 glass rounded-[3rem] border-white/40 shadow-premium" data-v-31ee4cec${_scopeId}><div class="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8" data-v-31ee4cec${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-31ee4cec${_scopeId}></path></svg></div><h2 class="text-2xl font-bold text-slate-900 mb-4" data-v-31ee4cec${_scopeId}>Start your research</h2><p class="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed" data-v-31ee4cec${_scopeId}> Enter a keyword above to see organic search results, related queries, and analyze competitor strategies. </p><div class="flex flex-wrap justify-center gap-3" data-v-31ee4cec${_scopeId}><!--[-->`);
              ssrRenderList(["best seo tools", "meta descriptions", "json-ld generator"], (tag) => {
                _push2(`<button class="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all duration-200" data-v-31ee4cec${_scopeId}>${ssrInterpolate(tag)}</button>`);
              });
              _push2(`<!--]--></div></div>`);
            } else if (__props.results) {
              _push2(`<div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" data-v-31ee4cec${_scopeId}><div class="grid lg:grid-cols-3 gap-8" data-v-31ee4cec${_scopeId}><div class="lg:col-span-2 space-y-6" data-v-31ee4cec${_scopeId}><h3 class="text-lg font-bold text-slate-900 flex items-center gap-2" data-v-31ee4cec${_scopeId}><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" data-v-31ee4cec${_scopeId}></path></svg> Organic Search Results </h3>`);
              if (__props.results.organic && __props.results.organic.length) {
                _push2(`<!--[-->`);
                ssrRenderList(__props.results.organic, (item, index) => {
                  _push2(`<div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300" data-v-31ee4cec${_scopeId}><div class="flex items-start gap-4" data-v-31ee4cec${_scopeId}><div class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0" data-v-31ee4cec${_scopeId}>${ssrInterpolate(index + 1)}</div><div class="flex-1 min-w-0" data-v-31ee4cec${_scopeId}><a${ssrRenderAttr("href", item.link)} target="_blank" class="block group" data-v-31ee4cec${_scopeId}><p class="text-xs text-slate-400 truncate mb-1" data-v-31ee4cec${_scopeId}>${ssrInterpolate(item.link)}</p><h4 class="text-lg font-bold text-primary group-hover:underline truncate" data-v-31ee4cec${_scopeId}>${ssrInterpolate(item.title)}</h4></a><p class="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed" data-v-31ee4cec${_scopeId}>${ssrInterpolate(item.snippet)}</p><div class="flex items-center gap-3 mt-4" data-v-31ee4cec${_scopeId}><span class="${ssrRenderClass([getIntentClass(item.snippet), "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"])}" data-v-31ee4cec${_scopeId}>${ssrInterpolate(detectIntent(item.snippet))}</span>`);
                  if (item.date) {
                    _push2(`<span class="text-xs text-slate-400 font-medium" data-v-31ee4cec${_scopeId}>Published: ${ssrInterpolate(item.date)}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div></div></div>`);
                });
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-8" data-v-31ee4cec${_scopeId}><div class="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl" data-v-31ee4cec${_scopeId}><h3 class="text-lg font-bold mb-6 flex items-center gap-2" data-v-31ee4cec${_scopeId}><svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" data-v-31ee4cec${_scopeId}></path></svg> Related Searches </h3>`);
              if (__props.results.relatedSearches && __props.results.relatedSearches.length) {
                _push2(`<div class="space-y-3" data-v-31ee4cec${_scopeId}><!--[-->`);
                ssrRenderList(__props.results.relatedSearches, (rel) => {
                  _push2(`<button class="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group" data-v-31ee4cec${_scopeId}><div class="flex items-center justify-between" data-v-31ee4cec${_scopeId}><span class="text-sm font-medium text-slate-300 group-hover:text-white" data-v-31ee4cec${_scopeId}>${ssrInterpolate(rel.query)}</span><svg class="w-4 h-4 text-slate-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-31ee4cec${_scopeId}></path></svg></div></button>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (__props.results.peopleAlsoAsk) {
                _push2(`<div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm" data-v-31ee4cec${_scopeId}><h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2" data-v-31ee4cec${_scopeId}><svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-31ee4cec${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-31ee4cec${_scopeId}></path></svg> People Also Ask </h3><div class="space-y-4" data-v-31ee4cec${_scopeId}><!--[-->`);
                ssrRenderList(__props.results.peopleAlsoAsk, (ask) => {
                  _push2(`<div class="p-4 bg-slate-50 rounded-2xl" data-v-31ee4cec${_scopeId}><p class="text-sm font-bold text-slate-800 leading-snug" data-v-31ee4cec${_scopeId}>${ssrInterpolate(ask.question)}</p><p class="text-xs text-slate-500 mt-2 line-clamp-2" data-v-31ee4cec${_scopeId}>${ssrInterpolate(ask.snippet)}</p></div>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (loading.value) {
              _push2(`<div class="flex flex-col items-center justify-center py-40" data-v-31ee4cec${_scopeId}><div class="relative w-20 h-20" data-v-31ee4cec${_scopeId}><div class="absolute inset-0 border-4 border-primary/20 rounded-full" data-v-31ee4cec${_scopeId}></div><div class="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" data-v-31ee4cec${_scopeId}></div></div><p class="mt-6 text-slate-500 font-bold animate-pulse text-lg tracking-widest uppercase" data-v-31ee4cec${_scopeId}>Analyzing Keywords...</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "min-h-screen bg-slate-50/50 pb-20" }, [
                createVNode("div", { class: "bg-white border-b border-slate-200 pt-12 pb-8 mb-8" }, [
                  createVNode("div", { class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" }, [
                    createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6" }, [
                      createVNode("div", null, [
                        createVNode("h1", { class: "text-3xl font-extrabold text-slate-900 tracking-tight" }, "Keyword Research"),
                        createVNode("div", { class: "flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner self-start mt-4 w-fit" }, [
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
                                d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              })
                            ])),
                            createTextVNode(" Research ")
                          ])
                        ]),
                        createVNode("p", { class: "text-slate-500" }, "Discover search trends and analyze organic competition."),
                        __props.results ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "flex gap-2"
                        }, [
                          __props.cached ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider"
                          }, " Cached " + toDisplayString(__props.last_searched), 1)) : createCommentVNode("", true),
                          __props.niche ? (openBlock(), createBlock("span", {
                            key: 1,
                            class: "px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider"
                          }, " Niche: " + toDisplayString(__props.niche), 1)) : createCommentVNode("", true),
                          __props.intent ? (openBlock(), createBlock("span", {
                            key: 2,
                            class: "px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase tracking-wider"
                          }, " Global Intent: " + toDisplayString(__props.intent), 1)) : createCommentVNode("", true),
                          __props.growth_rate > 0 ? (openBlock(), createBlock("span", {
                            key: 3,
                            class: "px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-2 h-2",
                              fill: "currentColor",
                              viewBox: "0 0 20 20"
                            }, [
                              createVNode("path", { d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" })
                            ])),
                            createTextVNode(" +" + toDisplayString(__props.growth_rate) + "% Growth ", 1)
                          ])) : createCommentVNode("", true),
                          __props.current_interest > 50 ? (openBlock(), createBlock("span", {
                            key: 4,
                            class: "px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider"
                          }, " Rising Trend ")) : createCommentVNode("", true)
                        ])) : createCommentVNode("", true)
                      ]),
                      createVNode("form", {
                        onSubmit: withModifiers(handleSearch, ["prevent"]),
                        class: "flex-1 max-w-2xl"
                      }, [
                        createVNode("div", { class: "relative group" }, [
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(form).q = $event,
                            type: "text",
                            placeholder: "Enter a keyword or topic...",
                            class: "w-full pl-6 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-slate-900 font-medium placeholder:text-slate-400"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(form).q]
                          ]),
                          createVNode("div", { class: "absolute inset-y-2 right-2 flex gap-2" }, [
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => unref(form).gl = $event,
                              class: "bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
                            }, [
                              createVNode("option", { value: "ke" }, "KE (Kenya)"),
                              createVNode("option", { value: "ng" }, "NG (Nigeria)"),
                              createVNode("option", { value: "za" }, "ZA (South Africa)"),
                              createVNode("option", { value: "us" }, "US"),
                              createVNode("option", { value: "uk" }, "UK")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, unref(form).gl]
                            ]),
                            createVNode("button", {
                              type: "submit",
                              disabled: loading.value,
                              class: "px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-50"
                            }, [
                              !loading.value ? (openBlock(), createBlock("span", { key: 0 }, "Search")) : (openBlock(), createBlock("svg", {
                                key: 1,
                                class: "animate-spin h-5 w-5",
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
                              ]))
                            ], 8, ["disabled"])
                          ])
                        ])
                      ], 32)
                    ])
                  ])
                ]),
                createVNode("div", { class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" }, [
                  !__props.results && !loading.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "text-center py-20 px-6 glass rounded-[3rem] border-white/40 shadow-premium"
                  }, [
                    createVNode("div", { class: "w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8" }, [
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
                          d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        })
                      ]))
                    ]),
                    createVNode("h2", { class: "text-2xl font-bold text-slate-900 mb-4" }, "Start your research"),
                    createVNode("p", { class: "text-slate-500 max-w-md mx-auto mb-10 leading-relaxed" }, " Enter a keyword above to see organic search results, related queries, and analyze competitor strategies. "),
                    createVNode("div", { class: "flex flex-wrap justify-center gap-3" }, [
                      (openBlock(), createBlock(Fragment, null, renderList(["best seo tools", "meta descriptions", "json-ld generator"], (tag) => {
                        return createVNode("button", {
                          onClick: ($event) => quickSearch(tag),
                          class: "px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all duration-200"
                        }, toDisplayString(tag), 9, ["onClick"]);
                      }), 64))
                    ])
                  ])) : __props.results ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  }, [
                    createVNode("div", { class: "grid lg:grid-cols-3 gap-8" }, [
                      createVNode("div", { class: "lg:col-span-2 space-y-6" }, [
                        createVNode("h3", { class: "text-lg font-bold text-slate-900 flex items-center gap-2" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 text-primary",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            })
                          ])),
                          createTextVNode(" Organic Search Results ")
                        ]),
                        __props.results.organic && __props.results.organic.length ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(__props.results.organic, (item, index) => {
                          return openBlock(), createBlock("div", {
                            key: index,
                            class: "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
                          }, [
                            createVNode("div", { class: "flex items-start gap-4" }, [
                              createVNode("div", { class: "w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0" }, toDisplayString(index + 1), 1),
                              createVNode("div", { class: "flex-1 min-w-0" }, [
                                createVNode("a", {
                                  href: item.link,
                                  target: "_blank",
                                  class: "block group"
                                }, [
                                  createVNode("p", { class: "text-xs text-slate-400 truncate mb-1" }, toDisplayString(item.link), 1),
                                  createVNode("h4", { class: "text-lg font-bold text-primary group-hover:underline truncate" }, toDisplayString(item.title), 1)
                                ], 8, ["href"]),
                                createVNode("p", { class: "text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed" }, toDisplayString(item.snippet), 1),
                                createVNode("div", { class: "flex items-center gap-3 mt-4" }, [
                                  createVNode("span", {
                                    class: [getIntentClass(item.snippet), "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"]
                                  }, toDisplayString(detectIntent(item.snippet)), 3),
                                  item.date ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "text-xs text-slate-400 font-medium"
                                  }, "Published: " + toDisplayString(item.date), 1)) : createCommentVNode("", true)
                                ])
                              ])
                            ])
                          ]);
                        }), 128)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "space-y-8" }, [
                        createVNode("div", { class: "bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl" }, [
                          createVNode("h3", { class: "text-lg font-bold mb-6 flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5 text-blue-400",
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
                            createTextVNode(" Related Searches ")
                          ]),
                          __props.results.relatedSearches && __props.results.relatedSearches.length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-3"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(__props.results.relatedSearches, (rel) => {
                              return openBlock(), createBlock("button", {
                                onClick: ($event) => quickSearch(rel.query),
                                class: "w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group"
                              }, [
                                createVNode("div", { class: "flex items-center justify-between" }, [
                                  createVNode("span", { class: "text-sm font-medium text-slate-300 group-hover:text-white" }, toDisplayString(rel.query), 1),
                                  (openBlock(), createBlock("svg", {
                                    class: "w-4 h-4 text-slate-500 group-hover:text-blue-400",
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
                                ])
                              ], 8, ["onClick"]);
                            }), 256))
                          ])) : createCommentVNode("", true)
                        ]),
                        __props.results.peopleAlsoAsk ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm"
                        }, [
                          createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-6 flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5 text-purple-500",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              })
                            ])),
                            createTextVNode(" People Also Ask ")
                          ]),
                          createVNode("div", { class: "space-y-4" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(__props.results.peopleAlsoAsk, (ask) => {
                              return openBlock(), createBlock("div", { class: "p-4 bg-slate-50 rounded-2xl" }, [
                                createVNode("p", { class: "text-sm font-bold text-slate-800 leading-snug" }, toDisplayString(ask.question), 1),
                                createVNode("p", { class: "text-xs text-slate-500 mt-2 line-clamp-2" }, toDisplayString(ask.snippet), 1)
                              ]);
                            }), 256))
                          ])
                        ])) : createCommentVNode("", true)
                      ])
                    ])
                  ])) : createCommentVNode("", true),
                  loading.value ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "flex flex-col items-center justify-center py-40"
                  }, [
                    createVNode("div", { class: "relative w-20 h-20" }, [
                      createVNode("div", { class: "absolute inset-0 border-4 border-primary/20 rounded-full" }),
                      createVNode("div", { class: "absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" })
                    ]),
                    createVNode("p", { class: "mt-6 text-slate-500 font-bold animate-pulse text-lg tracking-widest uppercase" }, "Analyzing Keywords...")
                  ])) : createCommentVNode("", true)
                ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Keywords/Research.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Research = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-31ee4cec"]]);
export {
  Research as default
};
