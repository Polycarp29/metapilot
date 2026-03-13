import { computed, unref, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrRenderAttrs, ssrInterpolate } from "vue/server-renderer";
import { usePage, Link } from "@inertiajs/vue3";
const _sfc_main = {
  __name: "BrandLogo",
  __ssrInlineRender: true,
  setup(__props) {
    const branding = computed(() => usePage().props.branding ?? {});
    const logoUrl = computed(() => branding.value.logo_url || null);
    const siteName = computed(() => branding.value.site_name || "MetaPilot");
    return (_ctx, _push, _parent, _attrs) => {
      if (logoUrl.value) {
        _push(ssrRenderComponent(unref(Link), mergeProps({ href: "/" }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<img${ssrRenderAttr("src", logoUrl.value)}${ssrRenderAttr("alt", siteName.value)} class="h-10 w-auto object-contain max-w-[160px]"${_scopeId}>`);
            } else {
              return [
                createVNode("img", {
                  src: logoUrl.value,
                  alt: siteName.value,
                  class: "h-10 w-auto object-contain max-w-[160px]"
                }, null, 8, ["src", "alt"])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-center space-x-3 group" }, _attrs))}><div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-standard"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg></div>`);
        _push(ssrRenderComponent(unref(Link), {
          href: "/",
          class: "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(siteName.value)}`);
            } else {
              return [
                createTextVNode(toDisplayString(siteName.value), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/BrandLogo.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
