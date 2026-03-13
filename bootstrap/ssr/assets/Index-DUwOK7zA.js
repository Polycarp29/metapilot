import { ref, watch, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, withDirectives, vModelText, Fragment, renderList, toDisplayString, vModelSelect, createCommentVNode, Transition, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass } from "vue/server-renderer";
import { router, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-D17_izsv.js";
import { debounce } from "lodash";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    schemas: Object,
    schemaTypes: Array,
    filters: Object
  },
  setup(__props) {
    const props = __props;
    const search = ref(props.filters.search || "");
    const typeFilter = ref(props.filters.type || "");
    const updateFilters = debounce(() => {
      router.get("/schemas", {
        search: search.value,
        type: typeFilter.value
      }, {
        preserveState: true,
        replace: true
      });
    }, 300);
    watch([search, typeFilter], updateFilters);
    const resetFilters = () => {
      search.value = "";
      typeFilter.value = "";
    };
    const showDeleteModal = ref(false);
    const selectedSchemaId = ref(null);
    const openDeleteModal = (id) => {
      selectedSchemaId.value = id;
      showDeleteModal.value = true;
    };
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      selectedSchemaId.value = null;
    };
    const confirmDeletion = () => {
      if (selectedSchemaId.value) {
        router.delete(`/schemas/${selectedSchemaId.value}`, {
          onSuccess: () => closeDeleteModal(),
          onError: () => closeDeleteModal()
        });
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "All Schemas" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-10"${_scopeId}><div class="flex flex-col md:flex-row md:items-end justify-between gap-6"${_scopeId}><div${_scopeId}><h1 class="text-4xl font-extrabold text-slate-900 tracking-tight mb-2"${_scopeId}>Schema Repository</h1><p class="text-slate-500 font-medium"${_scopeId}>Browse and manage all structured data configurations for 9UBET.</p></div><div class="flex items-center gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas/automated/create",
              class: "inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-slate-200 active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"${_scopeId2}></path></svg> Automated Builder `);
                } else {
                  return [
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
                        d: "M13 10V3L4 14h7v7l9-11h-7z"
                      })
                    ])),
                    createTextVNode(" Automated Builder ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas/create",
              class: "inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-200 active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId2}></path></svg> Build New Schema `);
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
                    createTextVNode(" Build New Schema ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div><div class="bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 flex flex-wrap gap-8 items-end"${_scopeId}><div class="flex-grow space-y-3"${_scopeId}><label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Search Database</label><div class="relative group"${_scopeId}><div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div><input${ssrRenderAttr("value", search.value)} type="text" placeholder="Filter by name, URL, or type..." class="block w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 placeholder:text-slate-400 sm:text-sm font-medium"${_scopeId}></div></div><div class="w-full md:w-64 space-y-3"${_scopeId}><label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Filter by Type</label><select class="block w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium sm:text-sm appearance-none"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(typeFilter.value) ? ssrLooseContain(typeFilter.value, "") : ssrLooseEqual(typeFilter.value, "")) ? " selected" : ""}${_scopeId}>All Categories</option><!--[-->`);
            ssrRenderList(__props.schemaTypes, (type) => {
              _push2(`<option${ssrRenderAttr("value", type.type_key)}${ssrIncludeBooleanAttr(Array.isArray(typeFilter.value) ? ssrLooseContain(typeFilter.value, type.type_key) : ssrLooseEqual(typeFilter.value, type.type_key)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(type.name)}</option>`);
            });
            _push2(`<!--]--></select></div><button class="px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-standard active:scale-95"${_scopeId}> Reset Filters </button></div><div class="bg-white shadow-premium rounded-[2.5rem] border border-slate-100 overflow-hidden"${_scopeId}><table class="w-full"${_scopeId}><thead class="bg-slate-50/50 border-b border-slate-100"${_scopeId}><tr class="text-left"${_scopeId}><th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Configuration</th><th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Type</th><th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Context URL</th><th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>Status</th><th class="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right"${_scopeId}>Settings</th></tr></thead><tbody class="divide-y divide-slate-100"${_scopeId}><!--[-->`);
            ssrRenderList(__props.schemas.data, (schema) => {
              _push2(`<tr class="group hover:bg-slate-50/30 transition-standard"${_scopeId}><td class="px-8 py-7"${_scopeId}><div class="flex items-center gap-2 mb-1"${_scopeId}><div class="font-bold text-slate-900 text-lg tracking-tight"${_scopeId}>${ssrInterpolate(schema.name)}</div>`);
              if (schema.container) {
                _push2(`<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tight"${ssrRenderAttr("title", schema.container.identifier)}${_scopeId}> Part of Container </span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="text-xs text-slate-400 font-mono uppercase"${_scopeId}>${ssrInterpolate(schema.schema_id)}</div></td><td class="px-8 py-7"${_scopeId}><span class="inline-flex items-center px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-blue-100"${_scopeId}>${ssrInterpolate(schema.schema_type?.name)}</span></td><td class="px-8 py-7"${_scopeId}><div class="flex items-center gap-2 group/url"${_scopeId}><span class="text-xs text-slate-500 font-medium max-w-[200px] truncate"${_scopeId}>${ssrInterpolate(schema.url)}</span><a${ssrRenderAttr("href", schema.url)} target="_blank" class="text-slate-300 hover:text-blue-500 transition-colors"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"${_scopeId}></path></svg></a></div></td><td class="px-8 py-7"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><div class="${ssrRenderClass([schema.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300", "w-2 h-2 rounded-full"])}"${_scopeId}></div><span class="${ssrRenderClass([schema.is_active ? "text-emerald-700" : "text-slate-500", "text-xs font-bold uppercase tracking-widest"])}"${_scopeId}>${ssrInterpolate(schema.is_active ? "Active" : "Draft")}</span></div></td><td class="px-8 py-7 text-right space-x-2"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: `/schemas/${schema.id}/edit`,
                class: "inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-standard shadow-sm active:scale-95",
                title: "Configure"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"${_scopeId2}></path></svg>`);
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
                          d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        })
                      ]))
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(unref(Link), {
                href: `/schemas/${schema.id}`,
                class: "inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-2xl transition-standard shadow-sm active:scale-95",
                title: "Raw View"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId2}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId2}></path></svg>`);
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
                          d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        }),
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        })
                      ]))
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
              _push2(`<button class="inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-standard shadow-sm active:scale-95" title="Remove"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></td></tr>`);
            });
            _push2(`<!--]-->`);
            if (__props.schemas.data.length === 0) {
              _push2(`<tr${_scopeId}><td colspan="5" class="px-8 py-24 text-center"${_scopeId}><div class="flex flex-col items-center"${_scopeId}><div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100"${_scopeId}><svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z"${_scopeId}></path></svg></div><h3 class="text-2xl font-bold text-slate-900 mb-2"${_scopeId}>Infinite Possibilities, Zero Schemas</h3><p class="text-slate-500 font-medium mb-10 max-w-sm"${_scopeId}>You haven&#39;t generated any structured data yet. Let&#39;s fix that by building your first schema.</p>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: "/schemas/create",
                class: "bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-standard active:scale-95 shadow-xl shadow-slate-200"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Create First Schema `);
                  } else {
                    return [
                      createTextVNode(" Create First Schema ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></td></tr>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</tbody></table></div>`);
            if (__props.schemas.total > 0) {
              _push2(`<div class="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 gap-6"${_scopeId}><span class="text-sm font-bold text-slate-400 uppercase tracking-widest"${_scopeId}> Displaying <span class="text-slate-900"${_scopeId}>${ssrInterpolate(__props.schemas.from)}-${ssrInterpolate(__props.schemas.to)}</span> of <span class="text-slate-900"${_scopeId}>${ssrInterpolate(__props.schemas.total)}</span> results </span><div class="flex items-center gap-2"${_scopeId}><!--[-->`);
              ssrRenderList(__props.schemas.links, (link) => {
                _push2(ssrRenderComponent(unref(Link), {
                  key: link.label,
                  href: link.url || "#",
                  class: ["px-5 py-3 rounded-2xl text-sm font-bold border transition-standard", [
                    link.active ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                    !link.url ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                  ]]
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (showDeleteModal.value) {
              _push2(`<div class="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"${_scopeId}><div class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"${_scopeId}><div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" aria-hidden="true"${_scopeId}></div><div class="relative z-10 inline-block align-middle bg-white rounded-[3rem] text-left overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100 animate-in zoom-in-95 duration-300"${_scopeId}><div class="bg-white p-12"${_scopeId}><div class="text-center"${_scopeId}><div class="mx-auto flex items-center justify-center h-24 w-24 rounded-[2rem] bg-red-50 mb-8 border border-red-100 shadow-inner"${_scopeId}><svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></div><h3 class="text-3xl font-black text-slate-900 tracking-tight mb-4" id="modal-title"${_scopeId}>Confirm Removal</h3><p class="text-slate-500 font-medium leading-relaxed"${_scopeId}> Are you sure you want to delete this schema? This action will archive the configuration. You can restore it later, but it will be deactivated immediately. </p></div></div><div class="bg-slate-50 p-10 flex flex-col-reverse sm:flex-row sm:justify-center gap-6"${_scopeId}><button class="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-standard active:scale-95 shadow-sm"${_scopeId}> No, Keep it safe </button><button class="w-full sm:w-auto px-10 py-5 bg-red-600 border border-transparent rounded-2xl text-sm font-black text-white hover:bg-red-500 shadow-xl shadow-red-200 transition-standard active:scale-95"${_scopeId}> Yes, Delete now </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "space-y-10" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-end justify-between gap-6" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-4xl font-extrabold text-slate-900 tracking-tight mb-2" }, "Schema Repository"),
                    createVNode("p", { class: "text-slate-500 font-medium" }, "Browse and manage all structured data configurations for 9UBET.")
                  ]),
                  createVNode("div", { class: "flex items-center gap-4" }, [
                    createVNode(unref(Link), {
                      href: "/schemas/automated/create",
                      class: "inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-slate-200 active:scale-95"
                    }, {
                      default: withCtx(() => [
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
                            d: "M13 10V3L4 14h7v7l9-11h-7z"
                          })
                        ])),
                        createTextVNode(" Automated Builder ")
                      ]),
                      _: 1
                    }),
                    createVNode(unref(Link), {
                      href: "/schemas/create",
                      class: "inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-standard shadow-lg shadow-blue-200 active:scale-95"
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
                        createTextVNode(" Build New Schema ")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                createVNode("div", { class: "bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 flex flex-wrap gap-8 items-end" }, [
                  createVNode("div", { class: "flex-grow space-y-3" }, [
                    createVNode("label", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Search Database"),
                    createVNode("div", { class: "relative group" }, [
                      createVNode("div", { class: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors" }, [
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
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ]))
                      ]),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => search.value = $event,
                        type: "text",
                        placeholder: "Filter by name, URL, or type...",
                        class: "block w-full pl-12 pr-4 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 placeholder:text-slate-400 sm:text-sm font-medium"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, search.value]
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "w-full md:w-64 space-y-3" }, [
                    createVNode("label", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Filter by Type"),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => typeFilter.value = $event,
                      class: "block w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium sm:text-sm appearance-none"
                    }, [
                      createVNode("option", { value: "" }, "All Categories"),
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.schemaTypes, (type) => {
                        return openBlock(), createBlock("option", {
                          key: type.id,
                          value: type.type_key
                        }, toDisplayString(type.name), 9, ["value"]);
                      }), 128))
                    ], 8, ["onUpdate:modelValue"]), [
                      [vModelSelect, typeFilter.value]
                    ])
                  ]),
                  createVNode("button", {
                    onClick: resetFilters,
                    class: "px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-standard active:scale-95"
                  }, " Reset Filters ")
                ]),
                createVNode("div", { class: "bg-white shadow-premium rounded-[2.5rem] border border-slate-100 overflow-hidden" }, [
                  createVNode("table", { class: "w-full" }, [
                    createVNode("thead", { class: "bg-slate-50/50 border-b border-slate-100" }, [
                      createVNode("tr", { class: "text-left" }, [
                        createVNode("th", { class: "px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Configuration"),
                        createVNode("th", { class: "px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Type"),
                        createVNode("th", { class: "px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Context URL"),
                        createVNode("th", { class: "px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest" }, "Status"),
                        createVNode("th", { class: "px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right" }, "Settings")
                      ])
                    ]),
                    createVNode("tbody", { class: "divide-y divide-slate-100" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.schemas.data, (schema) => {
                        return openBlock(), createBlock("tr", {
                          key: schema.id,
                          class: "group hover:bg-slate-50/30 transition-standard"
                        }, [
                          createVNode("td", { class: "px-8 py-7" }, [
                            createVNode("div", { class: "flex items-center gap-2 mb-1" }, [
                              createVNode("div", { class: "font-bold text-slate-900 text-lg tracking-tight" }, toDisplayString(schema.name), 1),
                              schema.container ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tight",
                                title: schema.container.identifier
                              }, " Part of Container ", 8, ["title"])) : createCommentVNode("", true)
                            ]),
                            createVNode("div", { class: "text-xs text-slate-400 font-mono uppercase" }, toDisplayString(schema.schema_id), 1)
                          ]),
                          createVNode("td", { class: "px-8 py-7" }, [
                            createVNode("span", { class: "inline-flex items-center px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-blue-100" }, toDisplayString(schema.schema_type?.name), 1)
                          ]),
                          createVNode("td", { class: "px-8 py-7" }, [
                            createVNode("div", { class: "flex items-center gap-2 group/url" }, [
                              createVNode("span", { class: "text-xs text-slate-500 font-medium max-w-[200px] truncate" }, toDisplayString(schema.url), 1),
                              createVNode("a", {
                                href: schema.url,
                                target: "_blank",
                                class: "text-slate-300 hover:text-blue-500 transition-colors"
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
                                    d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  })
                                ]))
                              ], 8, ["href"])
                            ])
                          ]),
                          createVNode("td", { class: "px-8 py-7" }, [
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode("div", {
                                class: [schema.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300", "w-2 h-2 rounded-full"]
                              }, null, 2),
                              createVNode("span", {
                                class: [schema.is_active ? "text-emerald-700" : "text-slate-500", "text-xs font-bold uppercase tracking-widest"]
                              }, toDisplayString(schema.is_active ? "Active" : "Draft"), 3)
                            ])
                          ]),
                          createVNode("td", { class: "px-8 py-7 text-right space-x-2" }, [
                            createVNode(unref(Link), {
                              href: `/schemas/${schema.id}/edit`,
                              class: "inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-2xl transition-standard shadow-sm active:scale-95",
                              title: "Configure"
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
                                    d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                  })
                                ]))
                              ]),
                              _: 1
                            }, 8, ["href"]),
                            createVNode(unref(Link), {
                              href: `/schemas/${schema.id}`,
                              class: "inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-2xl transition-standard shadow-sm active:scale-95",
                              title: "Raw View"
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
                              _: 1
                            }, 8, ["href"]),
                            createVNode("button", {
                              onClick: ($event) => openDeleteModal(schema.id),
                              class: "inline-flex items-center justify-center w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-2xl transition-standard shadow-sm active:scale-95",
                              title: "Remove"
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
                                  d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                })
                              ]))
                            ], 8, ["onClick"])
                          ])
                        ]);
                      }), 128)),
                      __props.schemas.data.length === 0 ? (openBlock(), createBlock("tr", { key: 0 }, [
                        createVNode("td", {
                          colspan: "5",
                          class: "px-8 py-24 text-center"
                        }, [
                          createVNode("div", { class: "flex flex-col items-center" }, [
                            createVNode("div", { class: "w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-12 h-12 text-slate-300",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                })
                              ]))
                            ]),
                            createVNode("h3", { class: "text-2xl font-bold text-slate-900 mb-2" }, "Infinite Possibilities, Zero Schemas"),
                            createVNode("p", { class: "text-slate-500 font-medium mb-10 max-w-sm" }, "You haven't generated any structured data yet. Let's fix that by building your first schema."),
                            createVNode(unref(Link), {
                              href: "/schemas/create",
                              class: "bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-standard active:scale-95 shadow-xl shadow-slate-200"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" Create First Schema ")
                              ]),
                              _: 1
                            })
                          ])
                        ])
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ]),
                __props.schemas.total > 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 gap-6"
                }, [
                  createVNode("span", { class: "text-sm font-bold text-slate-400 uppercase tracking-widest" }, [
                    createTextVNode(" Displaying "),
                    createVNode("span", { class: "text-slate-900" }, toDisplayString(__props.schemas.from) + "-" + toDisplayString(__props.schemas.to), 1),
                    createTextVNode(" of "),
                    createVNode("span", { class: "text-slate-900" }, toDisplayString(__props.schemas.total), 1),
                    createTextVNode(" results ")
                  ]),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.schemas.links, (link) => {
                      return openBlock(), createBlock(unref(Link), {
                        key: link.label,
                        href: link.url || "#",
                        innerHTML: link.label,
                        class: ["px-5 py-3 rounded-2xl text-sm font-bold border transition-standard", [
                          link.active ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                          !link.url ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                        ]]
                      }, null, 8, ["href", "innerHTML", "class"]);
                    }), 128))
                  ])
                ])) : createCommentVNode("", true)
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
                  showDeleteModal.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed inset-0 z-[100] overflow-y-auto",
                    "aria-labelledby": "modal-title",
                    role: "dialog",
                    "aria-modal": "true"
                  }, [
                    createVNode("div", { class: "flex items-center justify-center min-h-screen p-4 text-center sm:p-0" }, [
                      createVNode("div", {
                        onClick: closeDeleteModal,
                        class: "fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity",
                        "aria-hidden": "true"
                      }),
                      createVNode("div", { class: "relative z-10 inline-block align-middle bg-white rounded-[3rem] text-left overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100 animate-in zoom-in-95 duration-300" }, [
                        createVNode("div", { class: "bg-white p-12" }, [
                          createVNode("div", { class: "text-center" }, [
                            createVNode("div", { class: "mx-auto flex items-center justify-center h-24 w-24 rounded-[2rem] bg-red-50 mb-8 border border-red-100 shadow-inner" }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-12 w-12 text-red-500",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                })
                              ]))
                            ]),
                            createVNode("h3", {
                              class: "text-3xl font-black text-slate-900 tracking-tight mb-4",
                              id: "modal-title"
                            }, "Confirm Removal"),
                            createVNode("p", { class: "text-slate-500 font-medium leading-relaxed" }, " Are you sure you want to delete this schema? This action will archive the configuration. You can restore it later, but it will be deactivated immediately. ")
                          ])
                        ]),
                        createVNode("div", { class: "bg-slate-50 p-10 flex flex-col-reverse sm:flex-row sm:justify-center gap-6" }, [
                          createVNode("button", {
                            onClick: closeDeleteModal,
                            class: "w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-standard active:scale-95 shadow-sm"
                          }, " No, Keep it safe "),
                          createVNode("button", {
                            onClick: confirmDeletion,
                            class: "w-full sm:w-auto px-10 py-5 bg-red-600 border border-transparent rounded-2xl text-sm font-black text-white hover:bg-red-500 shadow-xl shadow-red-200 transition-standard active:scale-95"
                          }, " Yes, Delete now ")
                        ])
                      ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Schemas/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
