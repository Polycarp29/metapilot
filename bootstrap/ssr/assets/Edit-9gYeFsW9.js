import { mergeProps, withCtx, unref, createVNode, withModifiers, withDirectives, vModelText, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-CRphHsV-.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-wIKyrnft.js";
const _sfc_main = {
  __name: "Edit",
  __ssrInlineRender: true,
  props: {
    user: Object,
    status: String
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      name: props.user.name,
      email: props.user.email,
      password: "",
      password_confirmation: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Profile" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-4xl mx-auto space-y-8"${_scopeId}><div${_scopeId}><h1 class="text-3xl font-bold text-slate-900 tracking-tight"${_scopeId}>Your Profile</h1><p class="text-slate-500 mt-2"${_scopeId}>Manage your account settings and preferences.</p></div><div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium"${_scopeId}><form class="space-y-6"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Full Name</label><input${ssrRenderAttr("value", unref(form).name)} type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
            if (unref(form).errors.name) {
              _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(form).errors.name)}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Email Address</label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium text-slate-500 bg-slate-50"${_scopeId}>`);
            if (unref(form).errors.email) {
              _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(form).errors.email)}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="pt-6 border-t border-slate-100"${_scopeId}><h3 class="text-lg font-bold text-slate-900 mb-4"${_scopeId}>Change Password</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>New Password</label><input${ssrRenderAttr("value", unref(form).password)} type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium" placeholder="Leave blank to keep current"${_scopeId}>`);
            if (unref(form).errors.password) {
              _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(form).errors.password)}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Confirm Password</label><input${ssrRenderAttr("value", unref(form).password_confirmation)} type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}></div></div></div><div class="flex justify-end pt-6"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"${_scopeId}> Save Changes </button></div></form></div></div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-4xl mx-auto space-y-8" }, [
                createVNode("div", null, [
                  createVNode("h1", { class: "text-3xl font-bold text-slate-900 tracking-tight" }, "Your Profile"),
                  createVNode("p", { class: "text-slate-500 mt-2" }, "Manage your account settings and preferences.")
                ]),
                createVNode("div", { class: "bg-white rounded-3xl p-8 border border-slate-100 shadow-premium" }, [
                  createVNode("form", {
                    onSubmit: withModifiers(($event) => unref(form).patch("/profile"), ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Full Name"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).name = $event,
                          type: "text",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).name]
                        ]),
                        unref(form).errors.name ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(form).errors.name), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Email Address"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).email = $event,
                          type: "email",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium text-slate-500 bg-slate-50"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).email]
                        ]),
                        unref(form).errors.email ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(form).errors.email), 1)) : createCommentVNode("", true)
                      ])
                    ]),
                    createVNode("div", { class: "pt-6 border-t border-slate-100" }, [
                      createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-4" }, "Change Password"),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "New Password"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(form).password = $event,
                            type: "password",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium",
                            placeholder: "Leave blank to keep current"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(form).password]
                          ]),
                          unref(form).errors.password ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(form).errors.password), 1)) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Confirm Password"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(form).password_confirmation = $event,
                            type: "password",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(form).password_confirmation]
                          ])
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "flex justify-end pt-6" }, [
                      createVNode("button", {
                        type: "submit",
                        disabled: unref(form).processing,
                        class: "bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      }, " Save Changes ", 8, ["disabled"])
                    ])
                  ], 40, ["onSubmit"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Profile/Edit.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
