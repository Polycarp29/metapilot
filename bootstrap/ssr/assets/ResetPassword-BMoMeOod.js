import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-DhDYxbtK.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "ResetPassword",
  __ssrInlineRender: true,
  props: {
    email: String,
    token: String
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      token: props.token,
      email: props.email,
      password: "",
      password_confirmation: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-65a2410b><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-65a2410b></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-65a2410b></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-65a2410b></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-65a2410b><div class="relative z-10 w-full max-w-md mx-auto px-6" data-v-65a2410b><div class="text-center mb-10" data-v-65a2410b><div class="flex flex-col items-center justify-center mb-4" data-v-65a2410b>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><p class="text-slate-500 font-medium mt-4" data-v-65a2410b>Set your fresh credentials below.</p></div><div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8" data-v-65a2410b><form class="space-y-5" data-v-65a2410b><div data-v-65a2410b><label for="email" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-65a2410b>Email Address</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" required readonly class="block w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed" data-v-65a2410b></div><div data-v-65a2410b><label for="password" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-65a2410b>New Password</label><div class="relative group" data-v-65a2410b><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" required autocomplete="new-password" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-65a2410b><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" data-v-65a2410b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-65a2410b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" data-v-65a2410b></path></svg></div></div>`);
      if (unref(form).errors.password) {
        _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-65a2410b>${ssrInterpolate(unref(form).errors.password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div data-v-65a2410b><label for="password_confirmation" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-65a2410b>Confirm New Password</label><div class="relative group" data-v-65a2410b><input id="password_confirmation"${ssrRenderAttr("value", unref(form).password_confirmation)} type="password" required autocomplete="new-password" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-65a2410b><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 transition-colors" data-v-65a2410b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-65a2410b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-65a2410b></path></svg></div></div></div><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0" data-v-65a2410b>`);
      if (!unref(form).processing) {
        _push(`<span data-v-65a2410b>Reset Password</span>`);
      } else {
        _push(`<span class="flex items-center justify-center" data-v-65a2410b><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-65a2410b><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-65a2410b></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-65a2410b></path></svg> Updating... </span>`);
      }
      _push(`</button></form></div><p class="text-center text-sm font-medium text-slate-500 mb-12" data-v-65a2410b> Need help? <a href="mailto:support@metapilot.ai" class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all" data-v-65a2410b>Support Center</a></p></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-65a2410b><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-65a2410b><p class="text-slate-500 text-sm font-medium" data-v-65a2410b>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-65a2410b><a${ssrRenderAttr("href", _ctx.route("privacy"))} class="text-slate-400 hover:text-primary transition-colors" data-v-65a2410b>Privacy</a><a${ssrRenderAttr("href", _ctx.route("terms"))} class="text-slate-400 hover:text-primary transition-colors" data-v-65a2410b>Terms</a><a${ssrRenderAttr("href", _ctx.route("cookies"))} class="text-slate-400 hover:text-primary transition-colors" data-v-65a2410b>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/ResetPassword.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ResetPassword = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-65a2410b"]]);
export {
  ResetPassword as default
};
