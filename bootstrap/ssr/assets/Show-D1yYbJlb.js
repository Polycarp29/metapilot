import { ref, onMounted, unref, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, Fragment, renderList, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./AppLayout-CRphHsV-.js";
import { Head, Link } from "@inertiajs/vue3";
import axios from "axios";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-wIKyrnft.js";
const _sfc_main = {
  __name: "Show",
  __ssrInlineRender: true,
  props: {
    campaign: Object
  },
  setup(__props) {
    const props = __props;
    const performance = ref(null);
    const isLoading = ref(true);
    const fetchPerformance = async () => {
      try {
        const response = await axios.get(route("api.campaigns.performance", { campaign: props.campaign.id }));
        performance.value = response.data;
      } catch (error) {
        console.error("Failed to fetch performance:", error);
      } finally {
        isLoading.value = false;
      }
    };
    onMounted(() => {
      fetchPerformance();
    });
    const getStatusColor = (status) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-700";
        case "draft":
          return "bg-slate-100 text-slate-600";
        case "paused":
          return "bg-amber-100 text-amber-700";
        case "completed":
          return "bg-blue-100 text-blue-700";
        default:
          return "bg-slate-100 text-slate-600";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(Head), {
        title: __props.campaign.name
      }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" data-v-0c225a06${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6" data-v-0c225a06${_scopeId}><div class="space-y-2" data-v-0c225a06${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("campaigns.index"),
              class: "text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-4"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-0c225a06${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-0c225a06${_scopeId2}></path></svg> Back to Campaigns `);
                } else {
                  return [
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
                    ])),
                    createTextVNode(" Back to Campaigns ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<div class="flex items-center gap-4" data-v-0c225a06${_scopeId}><h1 class="text-4xl font-black text-slate-900 tracking-tight" data-v-0c225a06${_scopeId}>${ssrInterpolate(__props.campaign.name)}</h1><span class="${ssrRenderClass(["px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest", getStatusColor(__props.campaign.status)])}" data-v-0c225a06${_scopeId}>${ssrInterpolate(__props.campaign.status)}</span></div><p class="text-slate-500 font-medium italic" data-v-0c225a06${_scopeId}>&quot;${ssrInterpolate(__props.campaign.objective)}&quot;</p></div><div class="flex items-center gap-4" data-v-0c225a06${_scopeId}><button class="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all" data-v-0c225a06${_scopeId}> Edit Campaign </button><button class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200" data-v-0c225a06${_scopeId}> Generate Report </button></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8" data-v-0c225a06${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-0c225a06${_scopeId}><p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" data-v-0c225a06${_scopeId}>Total Users (Targeted)</p><div class="flex items-end gap-3" data-v-0c225a06${_scopeId}>`);
            if (isLoading.value) {
              _push2(`<span class="text-3xl font-black text-slate-200 animate-pulse" data-v-0c225a06${_scopeId}>---</span>`);
            } else {
              _push2(`<span class="text-4xl font-black text-slate-900" data-v-0c225a06${_scopeId}>${ssrInterpolate(performance.value?.total_users || 0)}</span>`);
            }
            _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-0c225a06${_scopeId}><p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" data-v-0c225a06${_scopeId}>Total Sessions</p><div class="flex items-end gap-3" data-v-0c225a06${_scopeId}>`);
            if (isLoading.value) {
              _push2(`<span class="text-3xl font-black text-slate-200 animate-pulse" data-v-0c225a06${_scopeId}>---</span>`);
            } else {
              _push2(`<span class="text-4xl font-black text-slate-900" data-v-0c225a06${_scopeId}>${ssrInterpolate(performance.value?.total_sessions || 0)}</span>`);
            }
            _push2(`</div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" data-v-0c225a06${_scopeId}><p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" data-v-0c225a06${_scopeId}>Total Conversions</p><div class="flex items-end gap-3" data-v-0c225a06${_scopeId}>`);
            if (isLoading.value) {
              _push2(`<span class="text-3xl font-black text-slate-200 animate-pulse" data-v-0c225a06${_scopeId}>---</span>`);
            } else {
              _push2(`<span class="text-4xl font-black text-slate-900" data-v-0c225a06${_scopeId}>${ssrInterpolate(performance.value?.total_conversions || 0)}</span>`);
            }
            _push2(`</div></div></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden" data-v-0c225a06${_scopeId}><div class="p-8 border-b border-slate-50 flex justify-between items-center" data-v-0c225a06${_scopeId}><h3 class="text-xl font-bold text-slate-900" data-v-0c225a06${_scopeId}>Target URL Performance</h3><span class="text-xs font-bold text-slate-400 uppercase tracking-widest" data-v-0c225a06${_scopeId}>Aggregate across active period</span></div><div class="overflow-x-auto" data-v-0c225a06${_scopeId}><table class="w-full text-left border-collapse" data-v-0c225a06${_scopeId}><thead data-v-0c225a06${_scopeId}><tr class="bg-slate-50/50" data-v-0c225a06${_scopeId}><th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest" data-v-0c225a06${_scopeId}>Page URL</th><th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" data-v-0c225a06${_scopeId}>Users</th><th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" data-v-0c225a06${_scopeId}>Sessions</th><th class="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" data-v-0c225a06${_scopeId}>Conversions</th></tr></thead>`);
            if (!isLoading.value && performance.value?.url_breakdown) {
              _push2(`<tbody data-v-0c225a06${_scopeId}><!--[-->`);
              ssrRenderList(performance.value.url_breakdown, (metrics, url) => {
                _push2(`<tr class="border-t border-slate-50 hover:bg-slate-50/30 transition-colors" data-v-0c225a06${_scopeId}><td class="px-8 py-6" data-v-0c225a06${_scopeId}><span class="text-slate-900 font-bold truncate block max-w-md" data-v-0c225a06${_scopeId}>${ssrInterpolate(url)}</span></td><td class="px-8 py-6 text-right font-bold text-slate-700" data-v-0c225a06${_scopeId}>${ssrInterpolate(metrics.users)}</td><td class="px-8 py-6 text-right font-bold text-slate-700" data-v-0c225a06${_scopeId}>${ssrInterpolate(metrics.sessions)}</td><td class="px-8 py-6 text-right font-bold text-blue-600" data-v-0c225a06${_scopeId}>${ssrInterpolate(metrics.conversions)}</td></tr>`);
              });
              _push2(`<!--]--></tbody>`);
            } else if (isLoading.value) {
              _push2(`<tbody data-v-0c225a06${_scopeId}><!--[-->`);
              ssrRenderList(3, (i) => {
                _push2(`<tr class="border-t border-slate-50" data-v-0c225a06${_scopeId}><td class="px-8 py-6" data-v-0c225a06${_scopeId}><div class="h-4 bg-slate-100 rounded w-1/2 animate-pulse" data-v-0c225a06${_scopeId}></div></td><td class="px-8 py-6 text-right" data-v-0c225a06${_scopeId}><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" data-v-0c225a06${_scopeId}></div></td><td class="px-8 py-6 text-right" data-v-0c225a06${_scopeId}><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" data-v-0c225a06${_scopeId}></div></td><td class="px-8 py-6 text-right" data-v-0c225a06${_scopeId}><div class="h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" data-v-0c225a06${_scopeId}></div></td></tr>`);
              });
              _push2(`<!--]--></tbody>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</table></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6" }, [
                  createVNode("div", { class: "space-y-2" }, [
                    createVNode(unref(Link), {
                      href: _ctx.route("campaigns.index"),
                      class: "text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-4"
                    }, {
                      default: withCtx(() => [
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
                        ])),
                        createTextVNode(" Back to Campaigns ")
                      ]),
                      _: 1
                    }, 8, ["href"]),
                    createVNode("div", { class: "flex items-center gap-4" }, [
                      createVNode("h1", { class: "text-4xl font-black text-slate-900 tracking-tight" }, toDisplayString(__props.campaign.name), 1),
                      createVNode("span", {
                        class: ["px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest", getStatusColor(__props.campaign.status)]
                      }, toDisplayString(__props.campaign.status), 3)
                    ]),
                    createVNode("p", { class: "text-slate-500 font-medium italic" }, '"' + toDisplayString(__props.campaign.objective) + '"', 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-4" }, [
                    createVNode("button", { class: "bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all" }, " Edit Campaign "),
                    createVNode("button", { class: "bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200" }, " Generate Report ")
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-8" }, [
                  createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                    createVNode("p", { class: "text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Total Users (Targeted)"),
                    createVNode("div", { class: "flex items-end gap-3" }, [
                      isLoading.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-3xl font-black text-slate-200 animate-pulse"
                      }, "---")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-4xl font-black text-slate-900"
                      }, toDisplayString(performance.value?.total_users || 0), 1))
                    ])
                  ]),
                  createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                    createVNode("p", { class: "text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Total Sessions"),
                    createVNode("div", { class: "flex items-end gap-3" }, [
                      isLoading.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-3xl font-black text-slate-200 animate-pulse"
                      }, "---")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-4xl font-black text-slate-900"
                      }, toDisplayString(performance.value?.total_sessions || 0), 1))
                    ])
                  ]),
                  createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium" }, [
                    createVNode("p", { class: "text-sm font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Total Conversions"),
                    createVNode("div", { class: "flex items-end gap-3" }, [
                      isLoading.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-3xl font-black text-slate-200 animate-pulse"
                      }, "---")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "text-4xl font-black text-slate-900"
                      }, toDisplayString(performance.value?.total_conversions || 0), 1))
                    ])
                  ])
                ]),
                createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden" }, [
                  createVNode("div", { class: "p-8 border-b border-slate-50 flex justify-between items-center" }, [
                    createVNode("h3", { class: "text-xl font-bold text-slate-900" }, "Target URL Performance"),
                    createVNode("span", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Aggregate across active period")
                  ]),
                  createVNode("div", { class: "overflow-x-auto" }, [
                    createVNode("table", { class: "w-full text-left border-collapse" }, [
                      createVNode("thead", null, [
                        createVNode("tr", { class: "bg-slate-50/50" }, [
                          createVNode("th", { class: "px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Page URL"),
                          createVNode("th", { class: "px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" }, "Users"),
                          createVNode("th", { class: "px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" }, "Sessions"),
                          createVNode("th", { class: "px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" }, "Conversions")
                        ])
                      ]),
                      !isLoading.value && performance.value?.url_breakdown ? (openBlock(), createBlock("tbody", { key: 0 }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(performance.value.url_breakdown, (metrics, url) => {
                          return openBlock(), createBlock("tr", {
                            key: url,
                            class: "border-t border-slate-50 hover:bg-slate-50/30 transition-colors"
                          }, [
                            createVNode("td", { class: "px-8 py-6" }, [
                              createVNode("span", { class: "text-slate-900 font-bold truncate block max-w-md" }, toDisplayString(url), 1)
                            ]),
                            createVNode("td", { class: "px-8 py-6 text-right font-bold text-slate-700" }, toDisplayString(metrics.users), 1),
                            createVNode("td", { class: "px-8 py-6 text-right font-bold text-slate-700" }, toDisplayString(metrics.sessions), 1),
                            createVNode("td", { class: "px-8 py-6 text-right font-bold text-blue-600" }, toDisplayString(metrics.conversions), 1)
                          ]);
                        }), 128))
                      ])) : isLoading.value ? (openBlock(), createBlock("tbody", { key: 1 }, [
                        (openBlock(), createBlock(Fragment, null, renderList(3, (i) => {
                          return createVNode("tr", {
                            key: i,
                            class: "border-t border-slate-50"
                          }, [
                            createVNode("td", { class: "px-8 py-6" }, [
                              createVNode("div", { class: "h-4 bg-slate-100 rounded w-1/2 animate-pulse" })
                            ]),
                            createVNode("td", { class: "px-8 py-6 text-right" }, [
                              createVNode("div", { class: "h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" })
                            ]),
                            createVNode("td", { class: "px-8 py-6 text-right" }, [
                              createVNode("div", { class: "h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" })
                            ]),
                            createVNode("td", { class: "px-8 py-6 text-right" }, [
                              createVNode("div", { class: "h-4 bg-slate-100 rounded ml-auto w-12 animate-pulse" })
                            ])
                          ]);
                        }), 64))
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ])
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Campaigns/Show.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Show = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0c225a06"]]);
export {
  Show as default
};
