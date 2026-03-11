import { computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { T as Toaster } from "./Toaster-DHWaylML.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "pinia";
const _sfc_main = {
  __name: "VerifyEmail",
  __ssrInlineRender: true,
  props: {
    status: String
  },
  setup(__props) {
    const props = __props;
    useToastStore();
    const form = useForm({});
    const verificationLinkSent = computed(() => props.status === "verification-link-sent");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-41bf25b4>`);
      _push(ssrRenderComponent(Toaster, null, null, _parent));
      _push(`<div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-41bf25b4></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-41bf25b4></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-41bf25b4></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-41bf25b4><div class="relative z-10 w-full max-w-md mx-auto px-6" data-v-41bf25b4><div class="text-center mb-10" data-v-41bf25b4><div class="flex flex-col items-center justify-center mb-4" data-v-41bf25b4>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><p class="text-slate-500 font-medium mt-4" data-v-41bf25b4>Thanks for signing up! Please verify your email address to get started.</p></div><div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8" data-v-41bf25b4><div class="mb-6 text-sm text-slate-600 leading-relaxed text-center" data-v-41bf25b4> Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn&#39;t receive the email, we will gladly send you another. </div>`);
      if (verificationLinkSent.value) {
        _push(`<div class="mb-6 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-600 text-center animate-in fade-in slide-in-from-top-2 duration-500" data-v-41bf25b4> A new verification link has been sent to the email address you provided during registration. </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="space-y-4" data-v-41bf25b4><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0" data-v-41bf25b4>`);
      if (!unref(form).processing) {
        _push(`<span data-v-41bf25b4>Resend Verification Email</span>`);
      } else {
        _push(`<span class="flex items-center justify-center" data-v-41bf25b4><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-41bf25b4><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-41bf25b4></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-41bf25b4></path></svg> Sending... </span>`);
      }
      _push(`</button><button type="button" class="w-full py-3.5 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 active:scale-[0.98] text-center" data-v-41bf25b4> Log Out </button></form></div></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-41bf25b4><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-41bf25b4><p class="text-slate-500 text-sm font-medium" data-v-41bf25b4>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-41bf25b4><a${ssrRenderAttr("href", _ctx.route("privacy"))} class="text-slate-400 hover:text-primary transition-colors" data-v-41bf25b4>Privacy</a><a${ssrRenderAttr("href", _ctx.route("terms"))} class="text-slate-400 hover:text-primary transition-colors" data-v-41bf25b4>Terms</a><a${ssrRenderAttr("href", _ctx.route("cookies"))} class="text-slate-400 hover:text-primary transition-colors" data-v-41bf25b4>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/VerifyEmail.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const VerifyEmail = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-41bf25b4"]]);
export {
  VerifyEmail as default
};
