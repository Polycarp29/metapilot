import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "ForgotPassword",
  __ssrInlineRender: true,
  props: {
    status: String
  },
  setup(__props) {
    const form = useForm({
      email: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-0f9474d5><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-0f9474d5></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-0f9474d5></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-0f9474d5></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-0f9474d5><div class="relative z-10 w-full max-w-md mx-auto px-6" data-v-0f9474d5><div class="text-center mb-10" data-v-0f9474d5><div class="flex flex-col items-center justify-center mb-4" data-v-0f9474d5>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><p class="text-slate-500 font-medium mt-4" data-v-0f9474d5>No worries, we&#39;ll send you instructions.</p></div><div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8" data-v-0f9474d5>`);
      if (__props.status) {
        _push(`<div class="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-sm font-semibold text-green-600 animate-in fade-in slide-in-from-top-4 duration-500" data-v-0f9474d5>${ssrInterpolate(__props.status)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="space-y-6" data-v-0f9474d5><div data-v-0f9474d5><label for="email" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-0f9474d5>Email Address</label><div class="relative group" data-v-0f9474d5><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" required autocomplete="email" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="name@company.com" data-v-0f9474d5><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" data-v-0f9474d5><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-0f9474d5><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" data-v-0f9474d5></path></svg></div></div>`);
      if (unref(form).errors.email) {
        _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-0f9474d5>${ssrInterpolate(unref(form).errors.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0" data-v-0f9474d5>`);
      if (!unref(form).processing) {
        _push(`<span data-v-0f9474d5>Send Reset Link</span>`);
      } else {
        _push(`<span class="flex items-center justify-center" data-v-0f9474d5><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-0f9474d5><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-0f9474d5></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-0f9474d5></path></svg> Sending... </span>`);
      }
      _push(`</button></form></div><p class="text-center text-sm font-medium text-slate-500 mb-12" data-v-0f9474d5> Remembered your password? <a${ssrRenderAttr("href", _ctx.route("login"))} class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all" data-v-0f9474d5>Back to sign in</a></p></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-0f9474d5><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-0f9474d5><p class="text-slate-500 text-sm font-medium" data-v-0f9474d5>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-0f9474d5><a${ssrRenderAttr("href", _ctx.route("privacy"))} class="text-slate-400 hover:text-primary transition-colors" data-v-0f9474d5>Privacy</a><a${ssrRenderAttr("href", _ctx.route("terms"))} class="text-slate-400 hover:text-primary transition-colors" data-v-0f9474d5>Terms</a><a${ssrRenderAttr("href", _ctx.route("cookies"))} class="text-slate-400 hover:text-primary transition-colors" data-v-0f9474d5>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/ForgotPassword.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ForgotPassword = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0f9474d5"]]);
export {
  ForgotPassword as default
};
