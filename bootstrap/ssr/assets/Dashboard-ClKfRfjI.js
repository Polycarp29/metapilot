import { mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, Fragment, renderList, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-Oqd_r1Cw.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Dashboard",
  __ssrInlineRender: true,
  props: {
    stats: Object,
    recentSchemas: Array,
    sitemaps: Array,
    recentInsights: Array,
    organizationName: String
    // branding: Array,
  },
  setup(__props) {
    const formatNumber = (num) => {
      if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
      if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
      return num;
    };
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Dashboard" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-12"${_scopeId}><div class="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-2xl"${_scopeId}><div class="relative z-10 max-w-3xl"${_scopeId}><span class="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"${_scopeId}>${ssrInterpolate(__props.organizationName)} Overview </span><h1 class="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]"${_scopeId}> SEO Performance <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300"${_scopeId}>Command Center</span></h1><p class="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl"${_scopeId}> Monitor sitemap health, track search visibility, and ensure 100% structured data coverage across your digital properties. </p><div class="flex flex-wrap gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas/create",
              class: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId2}></path></svg> Quick Create `);
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
                        d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                      })
                    ])),
                    createTextVNode(" Quick Create ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(Link), {
              href: "/analytics",
              class: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold transition-standard border border-white/10 active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Analytics Deep Dive `);
                } else {
                  return [
                    createTextVNode(" Analytics Deep Dive ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"${_scopeId}><div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group"${_scopeId}><div class="flex justify-between items-start mb-4"${_scopeId}><div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-standard"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"${_scopeId}></path></svg></div><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>SEO Coverage</span></div><div${_scopeId}><div class="flex items-end gap-2 mb-1"${_scopeId}><p class="text-4xl font-black text-slate-900 tracking-tighter"${_scopeId}>${ssrInterpolate(__props.stats.seoCoverage)}%</p></div><div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"${_scopeId}><div class="bg-blue-600 h-full transition-all duration-1000" style="${ssrRenderStyle({ width: `${__props.stats.seoCoverage}%` })}"${_scopeId}></div></div><p class="text-slate-400 text-xs mt-2 font-medium"${_scopeId}>${ssrInterpolate(__props.stats.totalLinks)} pages monitored</p></div></div><div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group"${_scopeId}><div class="flex justify-between items-start mb-4"${_scopeId}><div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-standard"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId}></path></svg></div><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>30D Impressions</span></div><div${_scopeId}><p class="text-4xl font-black text-slate-900 tracking-tighter mb-1"${_scopeId}>${ssrInterpolate(formatNumber(__props.stats.totalImpressions))}</p><p class="text-slate-500 text-xs font-medium"${_scopeId}>Search Visibility</p></div></div><div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group"${_scopeId}><div class="flex justify-between items-start mb-4"${_scopeId}><div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-standard"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"${_scopeId}></path></svg></div><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>30D Clicks</span></div><div${_scopeId}><p class="text-4xl font-black text-slate-900 tracking-tighter mb-1"${_scopeId}>${ssrInterpolate(formatNumber(__props.stats.totalClicks))}</p><p class="text-slate-500 text-xs font-medium"${_scopeId}>Organic Growth</p></div></div><div class="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group"${_scopeId}><div class="flex justify-between items-start mb-4"${_scopeId}><div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-standard"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"${_scopeId}></path></svg></div><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Managed Schemas</span></div><div${_scopeId}><p class="text-4xl font-black text-slate-900 tracking-tighter mb-1"${_scopeId}>${ssrInterpolate(__props.stats.totalSchemas)}</p><p class="text-slate-500 text-xs font-medium"${_scopeId}>Configured Items</p></div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-8"${_scopeId}><div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-10"${_scopeId}><div class="flex justify-between items-center mb-8"${_scopeId}><h2 class="text-2xl font-bold text-slate-900 tracking-tight"${_scopeId}>Active Configurations</h2>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas",
              class: "text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`View All`);
                } else {
                  return [
                    createTextVNode("View All")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="space-y-4"${_scopeId}><!--[-->`);
            ssrRenderList(__props.recentSchemas, (schema) => {
              _push2(`<div class="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-all flex items-center justify-between group"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-bold text-slate-900 text-sm"${_scopeId}>${ssrInterpolate(schema.name)}</p><p class="text-xs text-slate-500"${_scopeId}>${ssrInterpolate(schema.schema_type.name)} • Updated ${ssrInterpolate(formatDate(schema.updated_at))}</p></div></div>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: `/schemas/${schema.id}/edit`,
                class: "text-slate-300 hover:text-blue-600 p-2"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"${_scopeId2}></path></svg>`);
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
                          d: "M9 5l7 7-7 7"
                        })
                      ]))
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
              _push2(`</div>`);
            });
            _push2(`<!--]-->`);
            if (__props.recentSchemas.length === 0) {
              _push2(`<div class="py-12 text-center text-slate-400 text-sm italic"${_scopeId}> No schemas configured yet. </div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="space-y-8"${_scopeId}><div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden"${_scopeId}><div class="absolute top-0 right-0 p-6 opacity-10"${_scopeId}><svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"${_scopeId}><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"${_scopeId}></path></svg></div><div class="relative z-10"${_scopeId}><div class="flex items-center gap-2 mb-6"${_scopeId}><div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg"${_scopeId}><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"${_scopeId}></path></svg></div><span class="text-xs font-bold uppercase tracking-widest text-blue-400"${_scopeId}>AI Strategy</span></div>`);
            if (__props.recentInsights.length > 0) {
              _push2(`<div class="space-y-6"${_scopeId}><!--[-->`);
              ssrRenderList(__props.recentInsights, (insight) => {
                _push2(`<div class="space-y-2"${_scopeId}><h4 class="font-bold text-sm text-slate-100"${_scopeId}>${ssrInterpolate(insight.title)}</h4><p class="text-xs text-slate-400 leading-relaxed line-clamp-3 italic"${_scopeId}>&quot;${ssrInterpolate(insight.body)}&quot;</p></div>`);
              });
              _push2(`<!--]-->`);
              _push2(ssrRenderComponent(unref(Link), {
                href: "/analytics",
                class: "inline-block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors mt-2"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Explore Full Analysis →`);
                  } else {
                    return [
                      createTextVNode("Explore Full Analysis →")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<div class="space-y-4"${_scopeId}><p class="text-sm text-slate-400 leading-relaxed italic"${_scopeId}>&quot;Gathering data to formulate your customized SEO strategy. Connect GA4 &amp; GSC to unlock AI insights.&quot;</p><div class="h-1 w-full bg-white/5 rounded-full overflow-hidden"${_scopeId}><div class="bg-blue-500 h-full w-1/3 animate-pulse"${_scopeId}></div></div></div>`);
            }
            _push2(`</div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><div class="flex justify-between items-center mb-6"${_scopeId}><h3 class="font-bold text-slate-900"${_scopeId}>Sitemap Health</h3><div class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"${_scopeId}></div></div><div class="space-y-6"${_scopeId}><!--[-->`);
            ssrRenderList(__props.sitemaps, (sitemap) => {
              _push2(`<div class="space-y-3"${_scopeId}><div class="flex justify-between items-center text-xs"${_scopeId}><span class="font-bold text-slate-700 truncate max-w-[150px]"${_scopeId}>${ssrInterpolate(sitemap.name)}</span><span class="${ssrRenderClass([{
                "bg-emerald-50 text-emerald-600": sitemap.last_crawl_status === "completed",
                "bg-amber-50 text-amber-600": sitemap.last_crawl_status === "running" || sitemap.last_crawl_status === "queued",
                "bg-slate-50 text-slate-400": !sitemap.last_crawl_status
              }, "px-2 py-0.5 rounded-full font-bold uppercase"])}"${_scopeId}>${ssrInterpolate(sitemap.last_crawl_status || "Pending")}</span></div><div class="grid grid-cols-2 gap-4"${_scopeId}><div class="p-3 bg-slate-50 rounded-xl"${_scopeId}><p class="text-[10px] font-bold text-slate-400 uppercase mb-1"${_scopeId}>Links</p><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(sitemap.links_count)}</p></div><div class="p-3 bg-slate-50 rounded-xl"${_scopeId}><p class="text-[10px] font-bold text-slate-400 uppercase mb-1"${_scopeId}>Last Scan</p><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(sitemap.last_generated_at ? formatDate(sitemap.last_generated_at) : "N/A")}</p></div></div></div>`);
            });
            _push2(`<!--]-->`);
            if (__props.sitemaps.length === 0) {
              _push2(`<div class="py-4 text-center text-xs text-slate-400 italic"${_scopeId}> No active sitemaps configured. </div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(unref(Link), {
              href: "/sitemaps",
              class: "block w-full text-center py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Manage Monitoring `);
                } else {
                  return [
                    createTextVNode(" Manage Monitoring ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-12" }, [
                createVNode("div", { class: "relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-2xl" }, [
                  createVNode("div", { class: "relative z-10 max-w-3xl" }, [
                    createVNode("span", { class: "inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6" }, toDisplayString(__props.organizationName) + " Overview ", 1),
                    createVNode("h1", { class: "text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]" }, [
                      createTextVNode(" SEO Performance "),
                      createVNode("span", { class: "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300" }, "Command Center")
                    ]),
                    createVNode("p", { class: "text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl" }, " Monitor sitemap health, track search visibility, and ensure 100% structured data coverage across your digital properties. "),
                    createVNode("div", { class: "flex flex-wrap gap-4" }, [
                      createVNode(unref(Link), {
                        href: "/schemas/create",
                        class: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
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
                              d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                            })
                          ])),
                          createTextVNode(" Quick Create ")
                        ]),
                        _: 1
                      }),
                      createVNode(unref(Link), {
                        href: "/analytics",
                        class: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold transition-standard border border-white/10 active:scale-95"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Analytics Deep Dive ")
                        ]),
                        _: 1
                      })
                    ])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" }, [
                  createVNode("div", { class: "bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group" }, [
                    createVNode("div", { class: "flex justify-between items-start mb-4" }, [
                      createVNode("div", { class: "w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-standard" }, [
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
                            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          })
                        ]))
                      ]),
                      createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, "SEO Coverage")
                    ]),
                    createVNode("div", null, [
                      createVNode("div", { class: "flex items-end gap-2 mb-1" }, [
                        createVNode("p", { class: "text-4xl font-black text-slate-900 tracking-tighter" }, toDisplayString(__props.stats.seoCoverage) + "%", 1)
                      ]),
                      createVNode("div", { class: "w-full bg-slate-100 h-1.5 rounded-full overflow-hidden" }, [
                        createVNode("div", {
                          class: "bg-blue-600 h-full transition-all duration-1000",
                          style: { width: `${__props.stats.seoCoverage}%` }
                        }, null, 4)
                      ]),
                      createVNode("p", { class: "text-slate-400 text-xs mt-2 font-medium" }, toDisplayString(__props.stats.totalLinks) + " pages monitored", 1)
                    ])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group" }, [
                    createVNode("div", { class: "flex justify-between items-start mb-4" }, [
                      createVNode("div", { class: "w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-standard" }, [
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
                      createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, "30D Impressions")
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-4xl font-black text-slate-900 tracking-tighter mb-1" }, toDisplayString(formatNumber(__props.stats.totalImpressions)), 1),
                      createVNode("p", { class: "text-slate-500 text-xs font-medium" }, "Search Visibility")
                    ])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group" }, [
                    createVNode("div", { class: "flex justify-between items-start mb-4" }, [
                      createVNode("div", { class: "w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-standard" }, [
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
                            d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          })
                        ]))
                      ]),
                      createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, "30D Clicks")
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-4xl font-black text-slate-900 tracking-tighter mb-1" }, toDisplayString(formatNumber(__props.stats.totalClicks)), 1),
                      createVNode("p", { class: "text-slate-500 text-xs font-medium" }, "Organic Growth")
                    ])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2rem] p-8 border border-slate-100 shadow-premium card-hover flex flex-col justify-between group" }, [
                    createVNode("div", { class: "flex justify-between items-start mb-4" }, [
                      createVNode("div", { class: "w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-standard" }, [
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
                            d: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                          })
                        ]))
                      ]),
                      createVNode("span", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, "Managed Schemas")
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-4xl font-black text-slate-900 tracking-tighter mb-1" }, toDisplayString(__props.stats.totalSchemas), 1),
                      createVNode("p", { class: "text-slate-500 text-xs font-medium" }, "Configured Items")
                    ])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-8" }, [
                  createVNode("div", { class: "lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-10" }, [
                    createVNode("div", { class: "flex justify-between items-center mb-8" }, [
                      createVNode("h2", { class: "text-2xl font-bold text-slate-900 tracking-tight" }, "Active Configurations"),
                      createVNode(unref(Link), {
                        href: "/schemas",
                        class: "text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors"
                      }, {
                        default: withCtx(() => [
                          createTextVNode("View All")
                        ]),
                        _: 1
                      })
                    ]),
                    createVNode("div", { class: "space-y-4" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.recentSchemas, (schema) => {
                        return openBlock(), createBlock("div", {
                          key: schema.id,
                          class: "p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-all flex items-center justify-between group"
                        }, [
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("div", { class: "w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors" }, [
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
                                  d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                })
                              ]))
                            ]),
                            createVNode("div", null, [
                              createVNode("p", { class: "font-bold text-slate-900 text-sm" }, toDisplayString(schema.name), 1),
                              createVNode("p", { class: "text-xs text-slate-500" }, toDisplayString(schema.schema_type.name) + " • Updated " + toDisplayString(formatDate(schema.updated_at)), 1)
                            ])
                          ]),
                          createVNode(unref(Link), {
                            href: `/schemas/${schema.id}/edit`,
                            class: "text-slate-300 hover:text-blue-600 p-2"
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
                                  d: "M9 5l7 7-7 7"
                                })
                              ]))
                            ]),
                            _: 1
                          }, 8, ["href"])
                        ]);
                      }), 128)),
                      __props.recentSchemas.length === 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "py-12 text-center text-slate-400 text-sm italic"
                      }, " No schemas configured yet. ")) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "space-y-8" }, [
                    createVNode("div", { class: "bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden" }, [
                      createVNode("div", { class: "absolute top-0 right-0 p-6 opacity-10" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-24 h-24",
                          fill: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", { d: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" })
                        ]))
                      ]),
                      createVNode("div", { class: "relative z-10" }, [
                        createVNode("div", { class: "flex items-center gap-2 mb-6" }, [
                          createVNode("div", { class: "w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-4 h-4 text-white",
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
                          createVNode("span", { class: "text-xs font-bold uppercase tracking-widest text-blue-400" }, "AI Strategy")
                        ]),
                        __props.recentInsights.length > 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-6"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.recentInsights, (insight) => {
                            return openBlock(), createBlock("div", {
                              key: insight.id,
                              class: "space-y-2"
                            }, [
                              createVNode("h4", { class: "font-bold text-sm text-slate-100" }, toDisplayString(insight.title), 1),
                              createVNode("p", { class: "text-xs text-slate-400 leading-relaxed line-clamp-3 italic" }, '"' + toDisplayString(insight.body) + '"', 1)
                            ]);
                          }), 128)),
                          createVNode(unref(Link), {
                            href: "/analytics",
                            class: "inline-block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors mt-2"
                          }, {
                            default: withCtx(() => [
                              createTextVNode("Explore Full Analysis →")
                            ]),
                            _: 1
                          })
                        ])) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "space-y-4"
                        }, [
                          createVNode("p", { class: "text-sm text-slate-400 leading-relaxed italic" }, '"Gathering data to formulate your customized SEO strategy. Connect GA4 & GSC to unlock AI insights."'),
                          createVNode("div", { class: "h-1 w-full bg-white/5 rounded-full overflow-hidden" }, [
                            createVNode("div", { class: "bg-blue-500 h-full w-1/3 animate-pulse" })
                          ])
                        ]))
                      ])
                    ]),
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                      createVNode("div", { class: "flex justify-between items-center mb-6" }, [
                        createVNode("h3", { class: "font-bold text-slate-900" }, "Sitemap Health"),
                        createVNode("div", { class: "w-2 h-2 rounded-full bg-emerald-500 animate-ping" })
                      ]),
                      createVNode("div", { class: "space-y-6" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(__props.sitemaps, (sitemap) => {
                          return openBlock(), createBlock("div", {
                            key: sitemap.id,
                            class: "space-y-3"
                          }, [
                            createVNode("div", { class: "flex justify-between items-center text-xs" }, [
                              createVNode("span", { class: "font-bold text-slate-700 truncate max-w-[150px]" }, toDisplayString(sitemap.name), 1),
                              createVNode("span", {
                                class: ["px-2 py-0.5 rounded-full font-bold uppercase", {
                                  "bg-emerald-50 text-emerald-600": sitemap.last_crawl_status === "completed",
                                  "bg-amber-50 text-amber-600": sitemap.last_crawl_status === "running" || sitemap.last_crawl_status === "queued",
                                  "bg-slate-50 text-slate-400": !sitemap.last_crawl_status
                                }]
                              }, toDisplayString(sitemap.last_crawl_status || "Pending"), 3)
                            ]),
                            createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                              createVNode("div", { class: "p-3 bg-slate-50 rounded-xl" }, [
                                createVNode("p", { class: "text-[10px] font-bold text-slate-400 uppercase mb-1" }, "Links"),
                                createVNode("p", { class: "font-bold text-slate-900" }, toDisplayString(sitemap.links_count), 1)
                              ]),
                              createVNode("div", { class: "p-3 bg-slate-50 rounded-xl" }, [
                                createVNode("p", { class: "text-[10px] font-bold text-slate-400 uppercase mb-1" }, "Last Scan"),
                                createVNode("p", { class: "font-bold text-slate-900" }, toDisplayString(sitemap.last_generated_at ? formatDate(sitemap.last_generated_at) : "N/A"), 1)
                              ])
                            ])
                          ]);
                        }), 128)),
                        __props.sitemaps.length === 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "py-4 text-center text-xs text-slate-400 italic"
                        }, " No active sitemaps configured. ")) : createCommentVNode("", true),
                        createVNode(unref(Link), {
                          href: "/sitemaps",
                          class: "block w-full text-center py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Manage Monitoring ")
                          ]),
                          _: 1
                        })
                      ])
                    ])
                  ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
