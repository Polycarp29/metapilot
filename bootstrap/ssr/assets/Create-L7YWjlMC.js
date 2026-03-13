import { mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, withModifiers, withDirectives, vModelText, Transition, toDisplayString, createCommentVNode, Fragment, renderList, vModelSelect, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from "vue/server-renderer";
import { useForm, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-D17_izsv.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Create",
  __ssrInlineRender: true,
  props: {
    schemaTypes: Array,
    containers: Array
  },
  setup(__props) {
    const form = useForm({
      name: "",
      schema_type_id: "",
      schema_id: "",
      url: "",
      use_existing_container: false,
      selected_container_id: "",
      sub_path: "",
      is_active: true
    });
    const submit = () => {
      form.post("/schemas");
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Create Schema" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-4xl mx-auto space-y-10"${_scopeId}><div class="flex items-center gap-6"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas",
              class: "inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId2}></path></svg>`);
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
            _push2(`<div${_scopeId}><h1 class="text-4xl font-extrabold text-slate-900 tracking-tight"${_scopeId}>New Schema</h1><p class="text-slate-500 font-medium"${_scopeId}>Configure the foundation of your structured data.</p></div></div><form class="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] border border-slate-100 overflow-hidden"${_scopeId}><div class="p-10 md:p-16 space-y-10"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10"${_scopeId}><div class="space-y-3"${_scopeId}><label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Internal Name</label><input${ssrRenderAttr("value", unref(form).name)} type="text" placeholder="e.g., Football Betting Page" class="${ssrRenderClass([{ "border-red-300 ring-4 ring-red-50": unref(form).errors.name }, "block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"])}"${_scopeId}>`);
            if (unref(form).errors.name) {
              _push2(`<p class="text-red-500 text-xs font-bold ml-1"${_scopeId}>${ssrInterpolate(unref(form).errors.name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-3"${_scopeId}><label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Schema Type</label><select class="${ssrRenderClass([{ "border-red-300 ring-4 ring-red-50": unref(form).errors.schema_type_id }, "block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium appearance-none"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).schema_type_id) ? ssrLooseContain(unref(form).schema_type_id, "") : ssrLooseEqual(unref(form).schema_type_id, "")) ? " selected" : ""}${_scopeId}>Select a category...</option><!--[-->`);
            ssrRenderList(__props.schemaTypes, (type) => {
              _push2(`<option${ssrRenderAttr("value", type.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).schema_type_id) ? ssrLooseContain(unref(form).schema_type_id, type.id) : ssrLooseEqual(unref(form).schema_type_id, type.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(type.name)}</option>`);
            });
            _push2(`<!--]--></select>`);
            if (unref(form).errors.schema_type_id) {
              _push2(`<p class="text-red-500 text-xs font-bold ml-1"${_scopeId}>${ssrInterpolate(unref(form).errors.schema_type_id)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="md:col-span-2 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 space-y-6"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div${_scopeId}><h5 class="text-xs font-black text-slate-800 uppercase tracking-widest"${_scopeId}>Architecture Strategy</h5><p class="text-[10px] text-slate-500 font-medium"${_scopeId}>Decide how this schema integrates with your brand root.</p></div><div class="flex gap-2"${_scopeId}><button type="button" class="${ssrRenderClass([!unref(form).use_existing_container ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"])}"${_scopeId}> New Root </button><button type="button" class="${ssrRenderClass([unref(form).use_existing_container ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"])}"${_scopeId}> Existing Root </button></div></div>`);
            if (unref(form).use_existing_container) {
              _push2(`<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/50"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"${_scopeId}>Select Root Container</label><select class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold appearance-none"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).selected_container_id) ? ssrLooseContain(unref(form).selected_container_id, "") : ssrLooseEqual(unref(form).selected_container_id, "")) ? " selected" : ""}${_scopeId}>Select a brand root...</option><!--[-->`);
              ssrRenderList(__props.containers, (c) => {
                _push2(`<option${ssrRenderAttr("value", c.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).selected_container_id) ? ssrLooseContain(unref(form).selected_container_id, c.id) : ssrLooseEqual(unref(form).selected_container_id, c.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(c.name)} (${ssrInterpolate(c.identifier)})</option>`);
              });
              _push2(`<!--]--></select></div><div class="space-y-2"${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"${_scopeId}>Sub-path Variation</label><input${ssrRenderAttr("value", unref(form).sub_path)} type="text" placeholder="e.g., /en or /mobile" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold"${_scopeId}><p class="text-[9px] text-slate-400 font-medium ml-2 italic"${_scopeId}>The schema @id will be: root_id + sub_path</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (!unref(form).use_existing_container) {
              _push2(`<div class="space-y-3"${_scopeId}><label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Schema ID (@id)</label><input${ssrRenderAttr("value", unref(form).schema_id)} type="url" placeholder="https://www.9ubet.co.ke/#organization" class="${ssrRenderClass([{ "border-red-300 ring-4 ring-red-50": unref(form).errors.schema_id }, "block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"])}"${_scopeId}>`);
              if (unref(form).errors.schema_id) {
                _push2(`<p class="text-red-500 text-xs font-bold ml-1"${_scopeId}>${ssrInterpolate(unref(form).errors.schema_id)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="space-y-3"${_scopeId}><label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"${_scopeId}>Context / Page URL</label><input${ssrRenderAttr("value", unref(form).url)} type="url" placeholder="https://www.9ubet.co.ke/sports/football" class="${ssrRenderClass([{ "border-red-300 ring-4 ring-red-50": unref(form).errors.url }, "block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300"])}"${_scopeId}>`);
            if (unref(form).errors.url) {
              _push2(`<p class="text-red-500 text-xs font-bold ml-1"${_scopeId}>${ssrInterpolate(unref(form).errors.url)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 flex gap-6 items-start"${_scopeId}><div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 flex-shrink-0"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><div class="space-y-1"${_scopeId}><h4 class="font-bold text-slate-900 uppercase tracking-widest text-xs"${_scopeId}>Ready for Next Steps</h4><p class="text-slate-600 font-medium text-sm leading-relaxed"${_scopeId}> Saving this primary configuration will automatically unlock the <strong${_scopeId}>Dynamic Property Editor</strong>. SEO-standard fields for your selected type will be pre-populated instantly. </p></div></div></div><div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas",
              class: "px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-standard active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Go Back `);
                } else {
                  return [
                    createTextVNode(" Go Back ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"${_scopeId}>`);
            if (unref(form).processing) {
              _push2(`<span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"${_scopeId}></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(form).processing ? "Establishing Connection..." : "Save & Continue to Editor")}</button></div></form></div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-4xl mx-auto space-y-10" }, [
                createVNode("div", { class: "flex items-center gap-6" }, [
                  createVNode(unref(Link), {
                    href: "/schemas",
                    class: "inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
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
                    createVNode("h1", { class: "text-4xl font-extrabold text-slate-900 tracking-tight" }, "New Schema"),
                    createVNode("p", { class: "text-slate-500 font-medium" }, "Configure the foundation of your structured data.")
                  ])
                ]),
                createVNode("form", {
                  onSubmit: withModifiers(submit, ["prevent"]),
                  class: "bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] border border-slate-100 overflow-hidden"
                }, [
                  createVNode("div", { class: "p-10 md:p-16 space-y-10" }, [
                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10" }, [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Internal Name"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).name = $event,
                          type: "text",
                          placeholder: "e.g., Football Betting Page",
                          class: ["block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300", { "border-red-300 ring-4 ring-red-50": unref(form).errors.name }]
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).name]
                        ]),
                        createVNode(Transition, {
                          "enter-active-class": "transition duration-200 ease-out",
                          "enter-from-class": "-translate-y-2 opacity-0",
                          "enter-to-class": "translate-y-0 opacity-100"
                        }, {
                          default: withCtx(() => [
                            unref(form).errors.name ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-xs font-bold ml-1"
                            }, toDisplayString(unref(form).errors.name), 1)) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Schema Type"),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => unref(form).schema_type_id = $event,
                          class: ["block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium appearance-none", { "border-red-300 ring-4 ring-red-50": unref(form).errors.schema_type_id }]
                        }, [
                          createVNode("option", { value: "" }, "Select a category..."),
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.schemaTypes, (type) => {
                            return openBlock(), createBlock("option", {
                              key: type.id,
                              value: type.id
                            }, toDisplayString(type.name), 9, ["value"]);
                          }), 128))
                        ], 10, ["onUpdate:modelValue"]), [
                          [vModelSelect, unref(form).schema_type_id]
                        ]),
                        createVNode(Transition, {
                          "enter-active-class": "transition duration-200 ease-out",
                          "enter-from-class": "-translate-y-2 opacity-0",
                          "enter-to-class": "translate-y-0 opacity-100"
                        }, {
                          default: withCtx(() => [
                            unref(form).errors.schema_type_id ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-xs font-bold ml-1"
                            }, toDisplayString(unref(form).errors.schema_type_id), 1)) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ]),
                      createVNode("div", { class: "md:col-span-2 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 space-y-6" }, [
                        createVNode("div", { class: "flex items-center justify-between" }, [
                          createVNode("div", null, [
                            createVNode("h5", { class: "text-xs font-black text-slate-800 uppercase tracking-widest" }, "Architecture Strategy"),
                            createVNode("p", { class: "text-[10px] text-slate-500 font-medium" }, "Decide how this schema integrates with your brand root.")
                          ]),
                          createVNode("div", { class: "flex gap-2" }, [
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => unref(form).use_existing_container = false,
                              class: [!unref(form).use_existing_container ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"]
                            }, " New Root ", 10, ["onClick"]),
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => unref(form).use_existing_container = true,
                              class: [unref(form).use_existing_container ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"]
                            }, " Existing Root ", 10, ["onClick"])
                          ])
                        ]),
                        createVNode(Transition, {
                          "enter-active-class": "transition duration-500 ease-out",
                          "enter-from-class": "opacity-0 -translate-y-4",
                          "enter-to-class": "opacity-100 translate-y-0"
                        }, {
                          default: withCtx(() => [
                            unref(form).use_existing_container ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/50"
                            }, [
                              createVNode("div", { class: "space-y-2" }, [
                                createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Select Root Container"),
                                withDirectives(createVNode("select", {
                                  "onUpdate:modelValue": ($event) => unref(form).selected_container_id = $event,
                                  class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold appearance-none"
                                }, [
                                  createVNode("option", { value: "" }, "Select a brand root..."),
                                  (openBlock(true), createBlock(Fragment, null, renderList(__props.containers, (c) => {
                                    return openBlock(), createBlock("option", {
                                      key: c.id,
                                      value: c.id
                                    }, toDisplayString(c.name) + " (" + toDisplayString(c.identifier) + ")", 9, ["value"]);
                                  }), 128))
                                ], 8, ["onUpdate:modelValue"]), [
                                  [vModelSelect, unref(form).selected_container_id]
                                ])
                              ]),
                              createVNode("div", { class: "space-y-2" }, [
                                createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Sub-path Variation"),
                                withDirectives(createVNode("input", {
                                  "onUpdate:modelValue": ($event) => unref(form).sub_path = $event,
                                  type: "text",
                                  placeholder: "e.g., /en or /mobile",
                                  class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold"
                                }, null, 8, ["onUpdate:modelValue"]), [
                                  [vModelText, unref(form).sub_path]
                                ]),
                                createVNode("p", { class: "text-[9px] text-slate-400 font-medium ml-2 italic" }, "The schema @id will be: root_id + sub_path")
                              ])
                            ])) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ]),
                      !unref(form).use_existing_container ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        createVNode("label", { class: "block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Schema ID (@id)"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).schema_id = $event,
                          type: "url",
                          placeholder: "https://www.9ubet.co.ke/#organization",
                          class: ["block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300", { "border-red-300 ring-4 ring-red-50": unref(form).errors.schema_id }]
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).schema_id]
                        ]),
                        createVNode(Transition, {
                          "enter-active-class": "transition duration-200 ease-out",
                          "enter-from-class": "-translate-y-2 opacity-0",
                          "enter-to-class": "translate-y-0 opacity-100"
                        }, {
                          default: withCtx(() => [
                            unref(form).errors.schema_id ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-xs font-bold ml-1"
                            }, toDisplayString(unref(form).errors.schema_id), 1)) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1" }, "Context / Page URL"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).url = $event,
                          type: "url",
                          placeholder: "https://www.9ubet.co.ke/sports/football",
                          class: ["block w-full px-6 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium placeholder:text-slate-300", { "border-red-300 ring-4 ring-red-50": unref(form).errors.url }]
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).url]
                        ]),
                        createVNode(Transition, {
                          "enter-active-class": "transition duration-200 ease-out",
                          "enter-from-class": "-translate-y-2 opacity-0",
                          "enter-to-class": "translate-y-0 opacity-100"
                        }, {
                          default: withCtx(() => [
                            unref(form).errors.url ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-xs font-bold ml-1"
                            }, toDisplayString(unref(form).errors.url), 1)) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    createVNode("div", { class: "bg-blue-50/50 rounded-3xl p-8 border border-blue-100 flex gap-6 items-start" }, [
                      createVNode("div", { class: "w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 flex-shrink-0" }, [
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
                            d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          })
                        ]))
                      ]),
                      createVNode("div", { class: "space-y-1" }, [
                        createVNode("h4", { class: "font-bold text-slate-900 uppercase tracking-widest text-xs" }, "Ready for Next Steps"),
                        createVNode("p", { class: "text-slate-600 font-medium text-sm leading-relaxed" }, [
                          createTextVNode(" Saving this primary configuration will automatically unlock the "),
                          createVNode("strong", null, "Dynamic Property Editor"),
                          createTextVNode(". SEO-standard fields for your selected type will be pre-populated instantly. ")
                        ])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4" }, [
                    createVNode(unref(Link), {
                      href: "/schemas",
                      class: "px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-standard active:scale-95"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Go Back ")
                      ]),
                      _: 1
                    }),
                    createVNode("button", {
                      type: "submit",
                      disabled: unref(form).processing,
                      class: "bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-standard shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    }, [
                      unref(form).processing ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      })) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(unref(form).processing ? "Establishing Connection..." : "Save & Continue to Editor"), 1)
                    ], 8, ["disabled"])
                  ])
                ], 32)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Schemas/Create.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
