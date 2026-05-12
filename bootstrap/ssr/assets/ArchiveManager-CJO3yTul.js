import { ref, onMounted, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, Fragment, renderList, toDisplayString, withDirectives, vModelText, createCommentVNode, Transition, withModifiers, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import axios from "axios";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "ArchiveManager",
  __ssrInlineRender: true,
  props: {
    tableStats: Array
  },
  setup(__props) {
    const props = __props;
    const activeTable = ref(null);
    const loading = ref(false);
    const records = ref([]);
    const columns = ref([]);
    const meta = ref({
      current_page: 1,
      last_page: 1,
      total: 0,
      from: 0,
      to: 0
    });
    const filters = ref({
      from: "",
      to: ""
    });
    const jsonModal = ref({
      show: false,
      data: null
    });
    const formatTableName = (name) => {
      return name.replace(/_/g, " ");
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };
    const formatDateTime = (date) => {
      if (!date) return "—";
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const selectTable = (table) => {
      activeTable.value = table;
      fetchData(1);
    };
    const fetchData = async (page = 1) => {
      if (!activeTable.value) return;
      loading.value = true;
      try {
        const response = await axios.get(`/api/archive/${activeTable.value}`, {
          params: {
            page,
            from: filters.value.from,
            to: filters.value.to,
            per_page: 50
          }
        });
        records.value = response.data.data;
        meta.value = response.data.meta;
        if (records.value.length > 0) {
          columns.value = Object.keys(records.value[0]);
        } else if (page === 1) {
          columns.value = [];
        }
      } catch (error) {
        console.error("Failed to fetch archive data:", error);
      } finally {
        loading.value = false;
      }
    };
    const viewJson = (data) => {
      try {
        jsonModal.value.data = typeof data === "string" ? JSON.parse(data) : data;
        jsonModal.value.show = true;
      } catch (e) {
        jsonModal.value.data = { error: "Invalid JSON format", raw: data };
        jsonModal.value.show = true;
      }
    };
    onMounted(() => {
      if (props.tableStats.length > 0) {
        selectTable(props.tableStats[0].table);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Archive Manager" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-6xl mx-auto space-y-8 pb-20" data-v-17d00009${_scopeId}><div class="flex items-center justify-between border-b border-slate-200 pb-5" data-v-17d00009${_scopeId}><div data-v-17d00009${_scopeId}><h1 class="text-3xl font-bold text-slate-900 tracking-tight" data-v-17d00009${_scopeId}>Archive Manager</h1><p class="text-slate-500 mt-2" data-v-17d00009${_scopeId}>Browse and retrieve historical data from the dedicated archive database.</p></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: _ctx.route("organization.settings", { tab: "analytics" }),
              class: "bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-17d00009${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-v-17d00009${_scopeId2}></path></svg> Back to Settings `);
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
                        d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                      })
                    ])),
                    createTextVNode(" Back to Settings ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="grid grid-cols-1 md:grid-cols-3 gap-6" data-v-17d00009${_scopeId}><!--[-->`);
            ssrRenderList(__props.tableStats, (stat) => {
              _push2(`<div class="${ssrRenderClass([activeTable.value === stat.table ? "border-blue-500 ring-4 ring-blue-500/5" : "border-slate-100", "bg-white rounded-[2rem] border p-6 transition-all hover:shadow-premium cursor-pointer group"])}" data-v-17d00009${_scopeId}><div class="flex items-center gap-4 mb-4" data-v-17d00009${_scopeId}><div class="${ssrRenderClass([activeTable.value === stat.table ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500", "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"])}" data-v-17d00009${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-17d00009${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" data-v-17d00009${_scopeId}></path></svg></div><div class="min-w-0" data-v-17d00009${_scopeId}><h3 class="font-bold text-slate-900 truncate capitalize" data-v-17d00009${_scopeId}>${ssrInterpolate(formatTableName(stat.table))}</h3><p class="text-xs font-bold text-slate-400 uppercase tracking-wider" data-v-17d00009${_scopeId}>${ssrInterpolate((stat.rows || 0).toLocaleString())} Rows</p></div></div><div class="space-y-1" data-v-17d00009${_scopeId}><div class="flex justify-between text-xs font-medium" data-v-17d00009${_scopeId}><span class="text-slate-400" data-v-17d00009${_scopeId}>Oldest:</span><span class="text-slate-600" data-v-17d00009${_scopeId}>${ssrInterpolate(stat.oldest ? formatDate(stat.oldest) : "N/A")}</span></div><div class="flex justify-between text-xs font-medium" data-v-17d00009${_scopeId}><span class="text-slate-400" data-v-17d00009${_scopeId}>Newest:</span><span class="text-slate-600" data-v-17d00009${_scopeId}>${ssrInterpolate(stat.newest ? formatDate(stat.newest) : "N/A")}</span></div></div></div>`);
            });
            _push2(`<!--]--></div>`);
            if (activeTable.value) {
              _push2(`<div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden animate-fade-in" data-v-17d00009${_scopeId}><div class="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30" data-v-17d00009${_scopeId}><div data-v-17d00009${_scopeId}><h2 class="text-xl font-bold text-slate-900" data-v-17d00009${_scopeId}>Browsing: ${ssrInterpolate(formatTableName(activeTable.value))}</h2><p class="text-sm text-slate-500 mt-1" data-v-17d00009${_scopeId}>Viewing records stored in the archive database.</p></div><div class="flex flex-wrap items-center gap-4" data-v-17d00009${_scopeId}><div class="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" data-v-17d00009${_scopeId}><div class="px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100" data-v-17d00009${_scopeId}>FROM</div><input${ssrRenderAttr("value", filters.value.from)} type="date" class="px-3 py-2 text-sm font-bold text-slate-700 outline-none" data-v-17d00009${_scopeId}></div><div class="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" data-v-17d00009${_scopeId}><div class="px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100" data-v-17d00009${_scopeId}>TO</div><input${ssrRenderAttr("value", filters.value.to)} type="date" class="px-3 py-2 text-sm font-bold text-slate-700 outline-none" data-v-17d00009${_scopeId}></div><button class="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm" data-v-17d00009${_scopeId}> Apply Filters </button></div></div><div class="overflow-x-auto" data-v-17d00009${_scopeId}><table class="w-full text-left border-collapse" data-v-17d00009${_scopeId}><thead data-v-17d00009${_scopeId}><tr class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100" data-v-17d00009${_scopeId}><!--[-->`);
              ssrRenderList(columns.value, (col) => {
                _push2(`<th class="px-6 py-4" data-v-17d00009${_scopeId}>${ssrInterpolate(col.replace("_", " "))}</th>`);
              });
              _push2(`<!--]--></tr></thead><tbody class="divide-y divide-slate-50" data-v-17d00009${_scopeId}>`);
              if (loading.value) {
                _push2(`<tr class="bg-white" data-v-17d00009${_scopeId}><td${ssrRenderAttr("colspan", columns.value.length)} class="px-6 py-20 text-center" data-v-17d00009${_scopeId}><div class="flex flex-col items-center gap-4" data-v-17d00009${_scopeId}><div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" data-v-17d00009${_scopeId}></div><p class="text-sm font-bold text-slate-400" data-v-17d00009${_scopeId}>Loading historical records...</p></div></td></tr>`);
              } else if (records.value.length === 0) {
                _push2(`<tr class="bg-white" data-v-17d00009${_scopeId}><td${ssrRenderAttr("colspan", columns.value.length)} class="px-6 py-20 text-center text-slate-400 font-medium italic" data-v-17d00009${_scopeId}> No records found for the selected criteria. </td></tr>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--[-->`);
              ssrRenderList(records.value, (record) => {
                _push2(`<tr class="hover:bg-blue-50/30 transition-colors group" data-v-17d00009${_scopeId}><!--[-->`);
                ssrRenderList(columns.value, (col) => {
                  _push2(`<td class="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap" data-v-17d00009${_scopeId}>`);
                  if (col === "metadata" || col === "raw_response" || col === "by_source") {
                    _push2(`<button class="text-blue-500 hover:underline font-bold text-xs" data-v-17d00009${_scopeId}>View JSON</button>`);
                  } else if (col === "created_at" || col === "updated_at") {
                    _push2(`<!--[-->${ssrInterpolate(formatDateTime(record[col]))}<!--]-->`);
                  } else {
                    _push2(`<span class="truncate max-w-[200px] block"${ssrRenderAttr("title", record[col])} data-v-17d00009${_scopeId}>${ssrInterpolate(record[col] ?? "—")}</span>`);
                  }
                  _push2(`</td>`);
                });
                _push2(`<!--]--></tr>`);
              });
              _push2(`<!--]--></tbody></table></div><div class="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between" data-v-17d00009${_scopeId}><div class="text-sm text-slate-500 font-medium" data-v-17d00009${_scopeId}> Showing <span class="font-bold text-slate-900" data-v-17d00009${_scopeId}>${ssrInterpolate(meta.value.from || 0)}</span> to <span class="font-bold text-slate-900" data-v-17d00009${_scopeId}>${ssrInterpolate(meta.value.to || 0)}</span> of <span class="font-bold text-slate-900" data-v-17d00009${_scopeId}>${ssrInterpolate(meta.value.total || 0)}</span> records </div><div class="flex gap-2" data-v-17d00009${_scopeId}><button${ssrIncludeBooleanAttr(meta.value.current_page === 1 || loading.value) ? " disabled" : ""} class="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all" data-v-17d00009${_scopeId}> Previous </button><button${ssrIncludeBooleanAttr(meta.value.current_page === meta.value.last_page || loading.value) ? " disabled" : ""} class="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all" data-v-17d00009${_scopeId}> Next </button></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (jsonModal.value.show) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" data-v-17d00009${_scopeId}><div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]" data-v-17d00009${_scopeId}><div class="p-6 border-b border-slate-100 flex items-center justify-between" data-v-17d00009${_scopeId}><h3 class="text-lg font-bold text-slate-900" data-v-17d00009${_scopeId}>Record Data</h3><button class="text-slate-400 hover:text-slate-600" data-v-17d00009${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-17d00009${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-17d00009${_scopeId}></path></svg></button></div><div class="p-6 overflow-y-auto bg-slate-50 font-mono text-sm" data-v-17d00009${_scopeId}><pre class="whitespace-pre-wrap" data-v-17d00009${_scopeId}>${ssrInterpolate(JSON.stringify(jsonModal.value.data, null, 2))}</pre></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-6xl mx-auto space-y-8 pb-20" }, [
                createVNode("div", { class: "flex items-center justify-between border-b border-slate-200 pb-5" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-bold text-slate-900 tracking-tight" }, "Archive Manager"),
                    createVNode("p", { class: "text-slate-500 mt-2" }, "Browse and retrieve historical data from the dedicated archive database.")
                  ]),
                  createVNode(unref(Link), {
                    href: _ctx.route("organization.settings", { tab: "analytics" }),
                    class: "bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
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
                          d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                        })
                      ])),
                      createTextVNode(" Back to Settings ")
                    ]),
                    _: 1
                  }, 8, ["href"])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-6" }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(__props.tableStats, (stat) => {
                    return openBlock(), createBlock("div", {
                      key: stat.table,
                      class: ["bg-white rounded-[2rem] border p-6 transition-all hover:shadow-premium cursor-pointer group", activeTable.value === stat.table ? "border-blue-500 ring-4 ring-blue-500/5" : "border-slate-100"],
                      onClick: ($event) => selectTable(stat.table)
                    }, [
                      createVNode("div", { class: "flex items-center gap-4 mb-4" }, [
                        createVNode("div", {
                          class: ["w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", activeTable.value === stat.table ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"]
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
                              d: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                            })
                          ]))
                        ], 2),
                        createVNode("div", { class: "min-w-0" }, [
                          createVNode("h3", { class: "font-bold text-slate-900 truncate capitalize" }, toDisplayString(formatTableName(stat.table)), 1),
                          createVNode("p", { class: "text-xs font-bold text-slate-400 uppercase tracking-wider" }, toDisplayString((stat.rows || 0).toLocaleString()) + " Rows", 1)
                        ])
                      ]),
                      createVNode("div", { class: "space-y-1" }, [
                        createVNode("div", { class: "flex justify-between text-xs font-medium" }, [
                          createVNode("span", { class: "text-slate-400" }, "Oldest:"),
                          createVNode("span", { class: "text-slate-600" }, toDisplayString(stat.oldest ? formatDate(stat.oldest) : "N/A"), 1)
                        ]),
                        createVNode("div", { class: "flex justify-between text-xs font-medium" }, [
                          createVNode("span", { class: "text-slate-400" }, "Newest:"),
                          createVNode("span", { class: "text-slate-600" }, toDisplayString(stat.newest ? formatDate(stat.newest) : "N/A"), 1)
                        ])
                      ])
                    ], 10, ["onClick"]);
                  }), 128))
                ]),
                activeTable.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden animate-fade-in"
                }, [
                  createVNode("div", { class: "p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30" }, [
                    createVNode("div", null, [
                      createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Browsing: " + toDisplayString(formatTableName(activeTable.value)), 1),
                      createVNode("p", { class: "text-sm text-slate-500 mt-1" }, "Viewing records stored in the archive database.")
                    ]),
                    createVNode("div", { class: "flex flex-wrap items-center gap-4" }, [
                      createVNode("div", { class: "flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" }, [
                        createVNode("div", { class: "px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100" }, "FROM"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => filters.value.from = $event,
                          type: "date",
                          class: "px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, filters.value.from]
                        ])
                      ]),
                      createVNode("div", { class: "flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" }, [
                        createVNode("div", { class: "px-3 py-2 text-xs font-bold text-slate-400 border-r border-slate-100" }, "TO"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => filters.value.to = $event,
                          type: "date",
                          class: "px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, filters.value.to]
                        ])
                      ]),
                      createVNode("button", {
                        onClick: ($event) => fetchData(1),
                        class: "bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
                      }, " Apply Filters ", 8, ["onClick"])
                    ])
                  ]),
                  createVNode("div", { class: "overflow-x-auto" }, [
                    createVNode("table", { class: "w-full text-left border-collapse" }, [
                      createVNode("thead", null, [
                        createVNode("tr", { class: "bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(columns.value, (col) => {
                            return openBlock(), createBlock("th", {
                              key: col,
                              class: "px-6 py-4"
                            }, toDisplayString(col.replace("_", " ")), 1);
                          }), 128))
                        ])
                      ]),
                      createVNode("tbody", { class: "divide-y divide-slate-50" }, [
                        loading.value ? (openBlock(), createBlock("tr", {
                          key: 0,
                          class: "bg-white"
                        }, [
                          createVNode("td", {
                            colspan: columns.value.length,
                            class: "px-6 py-20 text-center"
                          }, [
                            createVNode("div", { class: "flex flex-col items-center gap-4" }, [
                              createVNode("div", { class: "w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }),
                              createVNode("p", { class: "text-sm font-bold text-slate-400" }, "Loading historical records...")
                            ])
                          ], 8, ["colspan"])
                        ])) : records.value.length === 0 ? (openBlock(), createBlock("tr", {
                          key: 1,
                          class: "bg-white"
                        }, [
                          createVNode("td", {
                            colspan: columns.value.length,
                            class: "px-6 py-20 text-center text-slate-400 font-medium italic"
                          }, " No records found for the selected criteria. ", 8, ["colspan"])
                        ])) : createCommentVNode("", true),
                        (openBlock(true), createBlock(Fragment, null, renderList(records.value, (record) => {
                          return openBlock(), createBlock("tr", {
                            key: record.id,
                            class: "hover:bg-blue-50/30 transition-colors group"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(columns.value, (col) => {
                              return openBlock(), createBlock("td", {
                                key: col,
                                class: "px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap"
                              }, [
                                col === "metadata" || col === "raw_response" || col === "by_source" ? (openBlock(), createBlock("button", {
                                  key: 0,
                                  onClick: ($event) => viewJson(record[col]),
                                  class: "text-blue-500 hover:underline font-bold text-xs"
                                }, "View JSON", 8, ["onClick"])) : col === "created_at" || col === "updated_at" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                                  createTextVNode(toDisplayString(formatDateTime(record[col])), 1)
                                ], 64)) : (openBlock(), createBlock("span", {
                                  key: 2,
                                  class: "truncate max-w-[200px] block",
                                  title: record[col]
                                }, toDisplayString(record[col] ?? "—"), 9, ["title"]))
                              ]);
                            }), 128))
                          ]);
                        }), 128))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between" }, [
                    createVNode("div", { class: "text-sm text-slate-500 font-medium" }, [
                      createTextVNode(" Showing "),
                      createVNode("span", { class: "font-bold text-slate-900" }, toDisplayString(meta.value.from || 0), 1),
                      createTextVNode(" to "),
                      createVNode("span", { class: "font-bold text-slate-900" }, toDisplayString(meta.value.to || 0), 1),
                      createTextVNode(" of "),
                      createVNode("span", { class: "font-bold text-slate-900" }, toDisplayString(meta.value.total || 0), 1),
                      createTextVNode(" records ")
                    ]),
                    createVNode("div", { class: "flex gap-2" }, [
                      createVNode("button", {
                        onClick: ($event) => fetchData(meta.value.current_page - 1),
                        disabled: meta.value.current_page === 1 || loading.value,
                        class: "px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                      }, " Previous ", 8, ["onClick", "disabled"]),
                      createVNode("button", {
                        onClick: ($event) => fetchData(meta.value.current_page + 1),
                        disabled: meta.value.current_page === meta.value.last_page || loading.value,
                        class: "px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                      }, " Next ", 8, ["onClick", "disabled"])
                    ])
                  ])
                ])) : createCommentVNode("", true),
                createVNode(Transition, {
                  "enter-active-class": "transition duration-200 ease-out",
                  "enter-from-class": "transform opacity-0 scale-95",
                  "enter-to-class": "transform opacity-100 scale-100",
                  "leave-active-class": "transition duration-75 ease-in",
                  "leave-from-class": "transform opacity-100 scale-100",
                  "leave-to-class": "transform opacity-0 scale-95"
                }, {
                  default: withCtx(() => [
                    jsonModal.value.show ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm",
                      onClick: withModifiers(($event) => jsonModal.value.show = false, ["self"])
                    }, [
                      createVNode("div", { class: "bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]" }, [
                        createVNode("div", { class: "p-6 border-b border-slate-100 flex items-center justify-between" }, [
                          createVNode("h3", { class: "text-lg font-bold text-slate-900" }, "Record Data"),
                          createVNode("button", {
                            onClick: ($event) => jsonModal.value.show = false,
                            class: "text-slate-400 hover:text-slate-600"
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
                          ], 8, ["onClick"])
                        ]),
                        createVNode("div", { class: "p-6 overflow-y-auto bg-slate-50 font-mono text-sm" }, [
                          createVNode("pre", { class: "whitespace-pre-wrap" }, toDisplayString(JSON.stringify(jsonModal.value.data, null, 2)), 1)
                        ])
                      ])
                    ], 8, ["onClick"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Settings/ArchiveManager.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ArchiveManager = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-17d00009"]]);
export {
  ArchiveManager as default
};
