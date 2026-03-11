import { computed, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "@inertiajs/vue3";
const _sfc_main = {
  __name: "Error",
  __ssrInlineRender: true,
  props: {
    status: {
      type: Number,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const title = computed(() => {
      return {
        503: "Service Unavailable",
        500: "Server Error",
        404: "Page Not Found",
        403: "Forbidden"
      }[props.status] || "An Error Occurred";
    });
    const description = computed(() => {
      return {
        503: "Sorry, we are doing some maintenance. Please check back soon.",
        500: "Whoops, something went wrong on our servers. We are already on it.",
        404: "The page you're looking for doesn't exist or has been moved to another URL.",
        403: "Sorry, you are forbidden from accessing this page."
      }[props.status] || "Something went wrong. Please try again later.";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-ec48d2c9><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-ec48d2c9></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-ec48d2c9></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-ec48d2c9></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-ec48d2c9><div class="relative z-10 w-full max-w-lg mx-auto px-6" data-v-ec48d2c9><div class="text-center" data-v-ec48d2c9><div class="flex flex-col items-center justify-center mb-12" data-v-ec48d2c9>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><div class="inline-flex items-center justify-center p-6 bg-white rounded-3xl shadow-premium mb-8 animate-bounce-subtle" data-v-ec48d2c9><span class="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-blue-600" data-v-ec48d2c9>${ssrInterpolate(__props.status)}</span></div><h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-4" data-v-ec48d2c9>${ssrInterpolate(title.value)}</h1><p class="text-lg text-slate-500 font-medium mb-10 leading-relaxed" data-v-ec48d2c9>${ssrInterpolate(description.value)}</p><div class="flex flex-col sm:flex-row items-center justify-center gap-4" data-v-ec48d2c9><a href="/" class="w-full sm:w-auto py-4 px-8 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center" data-v-ec48d2c9> Return Home </a><button class="w-full sm:w-auto py-4 px-8 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98] text-center" data-v-ec48d2c9> Go Back </button></div></div></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-ec48d2c9><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-ec48d2c9><p class="text-slate-500 text-sm font-medium" data-v-ec48d2c9>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-ec48d2c9><a href="/privacy" class="text-slate-400 hover:text-primary transition-colors" data-v-ec48d2c9>Privacy</a><a href="/terms" class="text-slate-400 hover:text-primary transition-colors" data-v-ec48d2c9>Terms</a><a href="/cookies" class="text-slate-400 hover:text-primary transition-colors" data-v-ec48d2c9>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Error.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Error = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ec48d2c9"]]);
export {
  Error as default
};
