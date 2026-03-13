import { ref, unref, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, withDirectives, Fragment, renderList, vModelSelect, vModelText, withKeys, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderComponent, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./AppLayout-D17_izsv.js";
import { useForm, Head, Link } from "@inertiajs/vue3";
import axios from "axios";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Create",
  __ssrInlineRender: true,
  props: {
    properties: Array
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      analytics_property_id: props.properties[0]?.id || "",
      name: "",
      objective: "",
      target_urls: [],
      keywords: [],
      start_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      end_date: ""
    });
    const isProposing = ref(false);
    const rawUrlInput = ref("");
    const addUrl = () => {
      if (rawUrlInput.value && !form.target_urls.includes(rawUrlInput.value)) {
        form.target_urls.push(rawUrlInput.value);
        rawUrlInput.value = "";
      }
    };
    const removeUrl = (index) => {
      form.target_urls.splice(index, 1);
    };
    const fetchAiProposal = async () => {
      if (!form.analytics_property_id) return;
      isProposing.value = true;
      try {
        const response = await axios.get(route("api.campaigns.propose", { property: form.analytics_property_id }));
        const proposal = response.data;
        if (proposal) {
          form.name = proposal.campaign_name || proposal["Campaign Name"] || "";
          form.objective = proposal.objective || proposal["Primary Objective"] || "";
          const urls = proposal.target_urls || proposal["Target URLs"] || [];
          if (Array.isArray(urls)) {
            form.target_urls = [.../* @__PURE__ */ new Set([...form.target_urls, ...urls])];
          }
        }
      } catch (error) {
        console.error("AI Proposal failed:", error);
      } finally {
        isProposing.value = false;
      }
    };
    const rawKeywordInput = ref("");
    const trendingSuggestions = ref(null);
    const isLoadingTrending = ref(false);
    const trendingCounts = ref({});
    const walletKeywords = ref([]);
    const fetchWallet = async () => {
      try {
        const response = await axios.get(route("api.keywords.wallet.index"));
        walletKeywords.value = response.data.data;
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      }
    };
    const addKeyword = () => {
      if (rawKeywordInput.value && !form.keywords.includes(rawKeywordInput.value)) {
        form.keywords.push(rawKeywordInput.value);
        rawKeywordInput.value = "";
      }
    };
    const removeKeyword = (index) => {
      form.keywords.splice(index, 1);
    };
    const addSuggestion = (keyword) => {
      if (!form.keywords.includes(keyword)) {
        form.keywords.push(keyword);
      }
    };
    const discoverTrending = async () => {
      isLoadingTrending.value = true;
      try {
        await axios.post(route("api.trending-keywords.discover"));
        const response = await axios.get(route("api.trending-keywords.suggestions", { days_recent: 30 }));
        trendingSuggestions.value = response.data.suggestions;
        const counts = {};
        Object.values(response.data.suggestions).forEach((geo) => {
          Object.keys(geo).forEach((type) => {
            counts[type] = (counts[type] || 0) + geo[type].length;
          });
        });
        trendingCounts.value = counts;
        await fetchWallet();
      } catch (error) {
        console.error("Failed to fetch trending keywords:", error);
      } finally {
        isLoadingTrending.value = false;
      }
    };
    const getStatusColor = (type) => {
      switch (type) {
        case "high_potential":
          return "bg-green-100 text-green-600";
        case "rising":
          return "bg-blue-100 text-blue-600";
        case "seasonal":
          return "bg-purple-100 text-purple-600";
        default:
          return "bg-gray-100 text-gray-500";
      }
    };
    const getGrowthColor = (rate) => {
      if (rate > 50) return "text-green-600";
      if (rate > 20) return "text-blue-600";
      return "text-slate-400";
    };
    const createCampaign = () => {
      form.post(route("campaigns.store"));
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(Head), { title: "Start SEO Campaign" }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1000px] mx-auto p-6 lg:p-10 space-y-10" data-v-711d9308${_scopeId}><div class="flex items-center justify-between" data-v-711d9308${_scopeId}><div data-v-711d9308${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("campaigns.index"),
              class: "text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-4"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-711d9308${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-711d9308${_scopeId2}></path></svg> Back to Campaigns `);
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
            _push2(`<h1 class="text-4xl font-black text-slate-900 tracking-tight" data-v-711d9308${_scopeId}>Create SEO Campaign</h1></div><button${ssrIncludeBooleanAttr(isProposing.value || !unref(form).analytics_property_id) ? " disabled" : ""} class="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50" data-v-711d9308${_scopeId}>`);
            if (isProposing.value) {
              _push2(`<span class="animate-spin" data-v-711d9308${_scopeId}>🌀</span>`);
            } else {
              _push2(`<span data-v-711d9308${_scopeId}>✨</span>`);
            }
            _push2(` ${ssrInterpolate(isProposing.value ? "Analyzing Data..." : "Get AI Suggestion")}</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-10" data-v-711d9308${_scopeId}><div class="lg:col-span-2 space-y-8" data-v-711d9308${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" data-v-711d9308${_scopeId}><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Analytics Property</label><select class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" data-v-711d9308${_scopeId}><!--[-->`);
            ssrRenderList(__props.properties, (prop) => {
              _push2(`<option${ssrRenderAttr("value", prop.id)} data-v-711d9308${ssrIncludeBooleanAttr(Array.isArray(unref(form).analytics_property_id) ? ssrLooseContain(unref(form).analytics_property_id, prop.id) : ssrLooseEqual(unref(form).analytics_property_id, prop.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(prop.name)}</option>`);
            });
            _push2(`<!--]--></select></div><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Campaign Name</label><input${ssrRenderAttr("value", unref(form).name)} type="text" placeholder="e.g., Q1 Blog Engagement Boost" class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" data-v-711d9308${_scopeId}></div><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Primary Objective</label><textarea rows="4" placeholder="What is the goal of this campaign?" class="w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" data-v-711d9308${_scopeId}>${ssrInterpolate(unref(form).objective)}</textarea></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Target URLs</label><div class="flex gap-4" data-v-711d9308${_scopeId}><input${ssrRenderAttr("value", rawUrlInput.value)} type="text" placeholder="https://example.com/page" class="flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" data-v-711d9308${_scopeId}><button class="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors" data-v-711d9308${_scopeId}>Add</button></div><div class="flex flex-wrap gap-3" data-v-711d9308${_scopeId}><!--[-->`);
            ssrRenderList(unref(form).target_urls, (url, index) => {
              _push2(`<div class="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100 group" data-v-711d9308${_scopeId}><span class="text-sm font-bold text-slate-600" data-v-711d9308${_scopeId}>${ssrInterpolate(url)}</span><button class="text-slate-400 hover:text-red-500 transition-colors" data-v-711d9308${_scopeId}>×</button></div>`);
            });
            _push2(`<!--]--></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" data-v-711d9308${_scopeId}><div class="flex items-center justify-between" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Campaign Keywords</label><button${ssrIncludeBooleanAttr(isLoadingTrending.value) ? " disabled" : ""} class="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl transition-colors" data-v-711d9308${_scopeId}>`);
            if (isLoadingTrending.value) {
              _push2(`<span class="animate-spin" data-v-711d9308${_scopeId}>🌀</span>`);
            } else {
              _push2(`<span data-v-711d9308${_scopeId}>🔥</span>`);
            }
            _push2(` Discover Trending </button></div><div class="flex gap-4" data-v-711d9308${_scopeId}><input${ssrRenderAttr("value", rawKeywordInput.value)} type="text" placeholder="Add keyword..." class="flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" data-v-711d9308${_scopeId}><button class="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors" data-v-711d9308${_scopeId}>Add</button></div><div class="flex flex-wrap gap-3" data-v-711d9308${_scopeId}><!--[-->`);
            ssrRenderList(unref(form).keywords, (keyword, index) => {
              _push2(`<div class="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-blue-100 group" data-v-711d9308${_scopeId}><span class="text-sm font-bold text-blue-700" data-v-711d9308${_scopeId}>${ssrInterpolate(keyword)}</span><button class="text-blue-400 hover:text-red-500 transition-colors" data-v-711d9308${_scopeId}>×</button></div>`);
            });
            _push2(`<!--]--></div>`);
            if (trendingSuggestions.value) {
              _push2(`<div class="border-t border-slate-100 pt-6 mt-6 space-y-6 animate-fade-in" data-v-711d9308${_scopeId}><div class="flex items-center justify-between" data-v-711d9308${_scopeId}><h4 class="font-black text-slate-800" data-v-711d9308${_scopeId}>Trending Suggestions</h4><div class="flex gap-2" data-v-711d9308${_scopeId}><!--[-->`);
              ssrRenderList(trendingCounts.value, (count, type) => {
                _push2(`<button class="${ssrRenderClass([getStatusColor(type), "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"])}" data-v-711d9308${_scopeId}>${ssrInterpolate(type.replace("_", " "))}</button>`);
              });
              _push2(`<!--]--></div></div>`);
              if (walletKeywords.value.length > 0) {
                _push2(`<div class="space-y-4" data-v-711d9308${_scopeId}><div class="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest" data-v-711d9308${_scopeId}><span class="text-lg" data-v-711d9308${_scopeId}>💰</span> My Wallet </div><div class="flex flex-wrap gap-2" data-v-711d9308${_scopeId}><!--[-->`);
                ssrRenderList(walletKeywords.value, (kw) => {
                  _push2(`<button class="bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 transition-all flex items-center gap-2" data-v-711d9308${_scopeId}><span class="w-2 h-2 bg-amber-400 rounded-full" data-v-711d9308${_scopeId}></span> ${ssrInterpolate(kw.keyword)}</button>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--[-->`);
              ssrRenderList(trendingSuggestions.value, (types, country) => {
                _push2(`<div class="space-y-4" data-v-711d9308${_scopeId}><div class="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest" data-v-711d9308${_scopeId}><span class="text-lg" data-v-711d9308${_scopeId}>🌍</span> ${ssrInterpolate(country)}</div><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-711d9308${_scopeId}><!--[-->`);
                ssrRenderList(types, (keywords, type) => {
                  _push2(`<div class="space-y-2" data-v-711d9308${_scopeId}><h5 class="text-xs font-bold text-slate-400 uppercase" data-v-711d9308${_scopeId}>${ssrInterpolate(type.replace("_", " "))}</h5><div class="space-y-2" data-v-711d9308${_scopeId}><!--[-->`);
                  ssrRenderList(keywords, (kw) => {
                    _push2(`<button class="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-3 rounded-xl transition-all group flex items-center justify-between" data-v-711d9308${_scopeId}><span class="font-bold text-slate-700 group-hover:text-indigo-700" data-v-711d9308${_scopeId}>${ssrInterpolate(kw.keyword)}</span><span class="${ssrRenderClass([getGrowthColor(kw.growth_rate), "text-xs font-bold"])}" data-v-711d9308${_scopeId}> +${ssrInterpolate(kw.growth_rate)}% </span></button>`);
                  });
                  _push2(`<!--]--></div></div>`);
                });
                _push2(`<!--]--></div></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="space-y-8" data-v-711d9308${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" data-v-711d9308${_scopeId}><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700 text-sm italic" data-v-711d9308${_scopeId}>Status</label><div class="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-center uppercase tracking-widest text-xs" data-v-711d9308${_scopeId}> Draft </div></div><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>Start Date</label><input${ssrRenderAttr("value", unref(form).start_date)} type="date" class="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700" data-v-711d9308${_scopeId}></div><div class="space-y-3" data-v-711d9308${_scopeId}><label class="block font-bold text-slate-700" data-v-711d9308${_scopeId}>End Date (Optional)</label><input${ssrRenderAttr("value", unref(form).end_date)} type="date" class="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700" data-v-711d9308${_scopeId}></div><button${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50" data-v-711d9308${_scopeId}>${ssrInterpolate(unref(form).processing ? "Saving..." : "Launch Campaign")}</button></div><div class="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl" data-v-711d9308${_scopeId}><h4 class="font-black text-xl" data-v-711d9308${_scopeId}>Strategy Tip</h4><p class="text-indigo-100 text-sm leading-relaxed" data-v-711d9308${_scopeId}>AI suggestions analyze your actual GA4 traffic to find pages with high impressions but low click-through rates. These are your biggest opportunities.</p></div></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-[1000px] mx-auto p-6 lg:p-10 space-y-10" }, [
                createVNode("div", { class: "flex items-center justify-between" }, [
                  createVNode("div", null, [
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
                    createVNode("h1", { class: "text-4xl font-black text-slate-900 tracking-tight" }, "Create SEO Campaign")
                  ]),
                  createVNode("button", {
                    onClick: fetchAiProposal,
                    disabled: isProposing.value || !unref(form).analytics_property_id,
                    class: "flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
                  }, [
                    isProposing.value ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "animate-spin"
                    }, "🌀")) : (openBlock(), createBlock("span", { key: 1 }, "✨")),
                    createTextVNode(" " + toDisplayString(isProposing.value ? "Analyzing Data..." : "Get AI Suggestion"), 1)
                  ], 8, ["disabled"])
                ]),
                createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-10" }, [
                  createVNode("div", { class: "lg:col-span-2 space-y-8" }, [
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" }, [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Analytics Property"),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => unref(form).analytics_property_id = $event,
                          class: "w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.properties, (prop) => {
                            return openBlock(), createBlock("option", {
                              key: prop.id,
                              value: prop.id
                            }, toDisplayString(prop.name), 9, ["value"]);
                          }), 128))
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, unref(form).analytics_property_id]
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Campaign Name"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).name = $event,
                          type: "text",
                          placeholder: "e.g., Q1 Blog Engagement Boost",
                          class: "w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).name]
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Primary Objective"),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(form).objective = $event,
                          rows: "4",
                          placeholder: "What is the goal of this campaign?",
                          class: "w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).objective]
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" }, [
                      createVNode("label", { class: "block font-bold text-slate-700" }, "Target URLs"),
                      createVNode("div", { class: "flex gap-4" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => rawUrlInput.value = $event,
                          onKeyup: withKeys(addUrl, ["enter"]),
                          type: "text",
                          placeholder: "https://example.com/page",
                          class: "flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        }, null, 40, ["onUpdate:modelValue"]), [
                          [vModelText, rawUrlInput.value]
                        ]),
                        createVNode("button", {
                          onClick: addUrl,
                          class: "bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                        }, "Add")
                      ]),
                      createVNode("div", { class: "flex flex-wrap gap-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(form).target_urls, (url, index) => {
                          return openBlock(), createBlock("div", {
                            key: index,
                            class: "bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100 group"
                          }, [
                            createVNode("span", { class: "text-sm font-bold text-slate-600" }, toDisplayString(url), 1),
                            createVNode("button", {
                              onClick: ($event) => removeUrl(index),
                              class: "text-slate-400 hover:text-red-500 transition-colors"
                            }, "×", 8, ["onClick"])
                          ]);
                        }), 128))
                      ])
                    ]),
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" }, [
                      createVNode("div", { class: "flex items-center justify-between" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Campaign Keywords"),
                        createVNode("button", {
                          onClick: discoverTrending,
                          disabled: isLoadingTrending.value,
                          class: "text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                        }, [
                          isLoadingTrending.value ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "animate-spin"
                          }, "🌀")) : (openBlock(), createBlock("span", { key: 1 }, "🔥")),
                          createTextVNode(" Discover Trending ")
                        ], 8, ["disabled"])
                      ]),
                      createVNode("div", { class: "flex gap-4" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => rawKeywordInput.value = $event,
                          onKeyup: withKeys(addKeyword, ["enter"]),
                          type: "text",
                          placeholder: "Add keyword...",
                          class: "flex-1 bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        }, null, 40, ["onUpdate:modelValue"]), [
                          [vModelText, rawKeywordInput.value]
                        ]),
                        createVNode("button", {
                          onClick: addKeyword,
                          class: "bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                        }, "Add")
                      ]),
                      createVNode("div", { class: "flex flex-wrap gap-3" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(form).keywords, (keyword, index) => {
                          return openBlock(), createBlock("div", {
                            key: index,
                            class: "bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-blue-100 group"
                          }, [
                            createVNode("span", { class: "text-sm font-bold text-blue-700" }, toDisplayString(keyword), 1),
                            createVNode("button", {
                              onClick: ($event) => removeKeyword(index),
                              class: "text-blue-400 hover:text-red-500 transition-colors"
                            }, "×", 8, ["onClick"])
                          ]);
                        }), 128))
                      ]),
                      trendingSuggestions.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "border-t border-slate-100 pt-6 mt-6 space-y-6 animate-fade-in"
                      }, [
                        createVNode("div", { class: "flex items-center justify-between" }, [
                          createVNode("h4", { class: "font-black text-slate-800" }, "Trending Suggestions"),
                          createVNode("div", { class: "flex gap-2" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(trendingCounts.value, (count, type) => {
                              return openBlock(), createBlock("button", {
                                key: type,
                                class: ["text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider", getStatusColor(type)]
                              }, toDisplayString(type.replace("_", " ")), 3);
                            }), 128))
                          ])
                        ]),
                        walletKeywords.value.length > 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-4"
                        }, [
                          createVNode("div", { class: "flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest" }, [
                            createVNode("span", { class: "text-lg" }, "💰"),
                            createTextVNode(" My Wallet ")
                          ]),
                          createVNode("div", { class: "flex flex-wrap gap-2" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(walletKeywords.value, (kw) => {
                              return openBlock(), createBlock("button", {
                                key: kw.id,
                                onClick: ($event) => addSuggestion(kw.keyword),
                                class: "bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 transition-all flex items-center gap-2"
                              }, [
                                createVNode("span", { class: "w-2 h-2 bg-amber-400 rounded-full" }),
                                createTextVNode(" " + toDisplayString(kw.keyword), 1)
                              ], 8, ["onClick"]);
                            }), 128))
                          ])
                        ])) : createCommentVNode("", true),
                        (openBlock(true), createBlock(Fragment, null, renderList(trendingSuggestions.value, (types, country) => {
                          return openBlock(), createBlock("div", {
                            key: country,
                            class: "space-y-4"
                          }, [
                            createVNode("div", { class: "flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest" }, [
                              createVNode("span", { class: "text-lg" }, "🌍"),
                              createTextVNode(" " + toDisplayString(country), 1)
                            ]),
                            createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(types, (keywords, type) => {
                                return openBlock(), createBlock("div", {
                                  key: type,
                                  class: "space-y-2"
                                }, [
                                  createVNode("h5", { class: "text-xs font-bold text-slate-400 uppercase" }, toDisplayString(type.replace("_", " ")), 1),
                                  createVNode("div", { class: "space-y-2" }, [
                                    (openBlock(true), createBlock(Fragment, null, renderList(keywords, (kw) => {
                                      return openBlock(), createBlock("button", {
                                        key: kw.id,
                                        onClick: ($event) => addSuggestion(kw.keyword),
                                        class: "w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-3 rounded-xl transition-all group flex items-center justify-between"
                                      }, [
                                        createVNode("span", { class: "font-bold text-slate-700 group-hover:text-indigo-700" }, toDisplayString(kw.keyword), 1),
                                        createVNode("span", {
                                          class: ["text-xs font-bold", getGrowthColor(kw.growth_rate)]
                                        }, " +" + toDisplayString(kw.growth_rate) + "% ", 3)
                                      ], 8, ["onClick"]);
                                    }), 128))
                                  ])
                                ]);
                              }), 128))
                            ])
                          ]);
                        }), 128))
                      ])) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "space-y-8" }, [
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6" }, [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700 text-sm italic" }, "Status"),
                        createVNode("div", { class: "px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-center uppercase tracking-widest text-xs" }, " Draft ")
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Start Date"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).start_date = $event,
                          type: "date",
                          class: "w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).start_date]
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "End Date (Optional)"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).end_date = $event,
                          type: "date",
                          class: "w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).end_date]
                        ])
                      ]),
                      createVNode("button", {
                        onClick: createCampaign,
                        disabled: unref(form).processing,
                        class: "w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                      }, toDisplayString(unref(form).processing ? "Saving..." : "Launch Campaign"), 9, ["disabled"])
                    ]),
                    createVNode("div", { class: "bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl" }, [
                      createVNode("h4", { class: "font-black text-xl" }, "Strategy Tip"),
                      createVNode("p", { class: "text-indigo-100 text-sm leading-relaxed" }, "AI suggestions analyze your actual GA4 traffic to find pages with high impressions but low click-through rates. These are your biggest opportunities.")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Campaigns/Create.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Create = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-711d9308"]]);
export {
  Create as default
};
