import { mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderSlot } from "vue/server-renderer";
import { Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "LegalLayout",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700" }, _attrs))} data-v-30f082de><nav class="bg-white border-b border-slate-200/50 py-6" data-v-30f082de><div class="max-w-4xl mx-auto px-6 flex justify-between items-center" data-v-30f082de>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      if (_ctx.$page.props.auth.user) {
        _push(`<div class="flex items-center gap-4" data-v-30f082de><span class="text-sm font-medium text-slate-500" data-v-30f082de>Hi, ${ssrInterpolate(_ctx.$page.props.auth.user.name)}</span>`);
        _push(ssrRenderComponent(unref(Link), {
          href: "/dashboard",
          class: "text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Go to Dashboard`);
            } else {
              return [
                createTextVNode("Go to Dashboard")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(ssrRenderComponent(unref(Link), {
          href: "/login",
          class: "text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Sign In`);
            } else {
              return [
                createTextVNode("Sign In")
              ];
            }
          }),
          _: 1
        }, _parent));
      }
      _push(`</div></nav><main class="max-w-4xl mx-auto px-6 py-16 md:py-24" data-v-30f082de><div class="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-premium border border-slate-100" data-v-30f082de><div class="prose prose-slate prose-blue max-w-none" data-v-30f082de>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div></main><footer class="py-12 border-t border-slate-200/50 mt-12" data-v-30f082de><div class="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-30f082de><p class="text-slate-500 text-sm" data-v-30f082de>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-6 text-sm" data-v-30f082de>`);
      _push(ssrRenderComponent(unref(Link), {
        href: "/privacy",
        class: "text-slate-400 hover:text-blue-600 font-medium transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Privacy`);
          } else {
            return [
              createTextVNode("Privacy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/terms",
        class: "text-slate-400 hover:text-blue-600 font-medium transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Terms`);
          } else {
            return [
              createTextVNode("Terms")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/cookies",
        class: "text-slate-400 hover:text-blue-600 font-medium transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Cookies`);
          } else {
            return [
              createTextVNode("Cookies")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/LegalLayout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const LegalLayout = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-30f082de"]]);
export {
  LegalLayout as L
};
