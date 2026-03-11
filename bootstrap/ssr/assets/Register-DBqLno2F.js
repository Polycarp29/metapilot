import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Register",
  __ssrInlineRender: true,
  setup(__props) {
    const form = useForm({
      name: "",
      email: "",
      password: "",
      password_confirmation: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-2fd90e74><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-2fd90e74></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-2fd90e74></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-2fd90e74></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-2fd90e74><div class="relative z-10 w-full max-w-md mx-auto px-6" data-v-2fd90e74><div class="text-center mb-10" data-v-2fd90e74><div class="flex flex-col items-center justify-center mb-4" data-v-2fd90e74>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><p class="text-slate-500 font-medium mt-4" data-v-2fd90e74>Start your SEO journey in seconds.</p></div><div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8" data-v-2fd90e74><form class="space-y-5" data-v-2fd90e74><div data-v-2fd90e74><label for="name" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-2fd90e74>Full Name</label><div class="relative group" data-v-2fd90e74><input id="name"${ssrRenderAttr("value", unref(form).name)} type="text" required autocomplete="name" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="John Doe" data-v-2fd90e74><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" data-v-2fd90e74><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fd90e74><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" data-v-2fd90e74></path></svg></div></div>`);
      if (unref(form).errors.name) {
        _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-2fd90e74>${ssrInterpolate(unref(form).errors.name)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div data-v-2fd90e74><label for="email" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-2fd90e74>Email Address</label><div class="relative group" data-v-2fd90e74><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" required autocomplete="email" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="name@company.com" data-v-2fd90e74><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" data-v-2fd90e74><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fd90e74><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" data-v-2fd90e74></path></svg></div></div>`);
      if (unref(form).errors.email) {
        _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-2fd90e74>${ssrInterpolate(unref(form).errors.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div data-v-2fd90e74><label for="password" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-2fd90e74>Password</label><div class="relative group" data-v-2fd90e74><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" required autocomplete="new-password" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-2fd90e74><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors" data-v-2fd90e74><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fd90e74><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" data-v-2fd90e74></path></svg></div></div>`);
      if (unref(form).errors.password) {
        _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-2fd90e74>${ssrInterpolate(unref(form).errors.password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-2 text-[10px] text-slate-400 font-medium ml-1 uppercase tracking-wider" data-v-2fd90e74>Must be at least 8 characters</p></div><div data-v-2fd90e74><label for="password_confirmation" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-2fd90e74>Confirm Password</label><div class="relative group" data-v-2fd90e74><input id="password_confirmation"${ssrRenderAttr("value", unref(form).password_confirmation)} type="password" required autocomplete="new-password" class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-2fd90e74><div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 transition-colors" data-v-2fd90e74><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fd90e74><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-2fd90e74></path></svg></div></div></div><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0" data-v-2fd90e74>`);
      if (!unref(form).processing) {
        _push(`<span data-v-2fd90e74>Create Account</span>`);
      } else {
        _push(`<span class="flex items-center justify-center" data-v-2fd90e74><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-2fd90e74><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-2fd90e74></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-2fd90e74></path></svg> Creating Account... </span>`);
      }
      _push(`</button></form><div class="relative my-8" data-v-2fd90e74><div class="absolute inset-0 flex items-center" data-v-2fd90e74><span class="w-full border-t border-slate-200" data-v-2fd90e74></span></div><div class="relative flex justify-center text-sm" data-v-2fd90e74><span class="px-3 bg-transparent text-slate-400 font-medium" data-v-2fd90e74>Or join with</span></div></div><a${ssrRenderAttr("href", _ctx.route("auth.google"))} class="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98]" data-v-2fd90e74><svg class="w-5 h-5 px-0.5" viewBox="0 0 24 24" data-v-2fd90e74><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" data-v-2fd90e74></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" data-v-2fd90e74></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" data-v-2fd90e74></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" data-v-2fd90e74></path></svg> Google </a></div><p class="text-center text-sm font-medium text-slate-500 mb-12" data-v-2fd90e74> Already have an account? <a${ssrRenderAttr("href", _ctx.route("login"))} class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all" data-v-2fd90e74>Sign in here</a></p></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-2fd90e74><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-2fd90e74><p class="text-slate-500 text-sm font-medium" data-v-2fd90e74>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-2fd90e74><a${ssrRenderAttr("href", _ctx.route("privacy"))} class="text-slate-400 hover:text-primary transition-colors" data-v-2fd90e74>Privacy</a><a${ssrRenderAttr("href", _ctx.route("terms"))} class="text-slate-400 hover:text-primary transition-colors" data-v-2fd90e74>Terms</a><a${ssrRenderAttr("href", _ctx.route("cookies"))} class="text-slate-400 hover:text-primary transition-colors" data-v-2fd90e74>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/Register.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Register = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2fd90e74"]]);
export {
  Register as default
};
