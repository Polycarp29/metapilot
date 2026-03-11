import { mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-wIKyrnft.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "AcceptInvitation",
  __ssrInlineRender: true,
  props: {
    invitation: Object,
    userExists: Boolean
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      name: "",
      password: "",
      password_confirmation: "",
      user_exists: props.userExists
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans" }, _attrs))} data-v-06469e2a><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-06469e2a></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-06469e2a></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-06469e2a></div><div class="flex-grow flex flex-col justify-center py-12 md:py-24" data-v-06469e2a><div class="relative z-10 w-full max-w-md mx-auto px-6" data-v-06469e2a><div class="text-center mb-10" data-v-06469e2a><div class="flex flex-col items-center justify-center mb-4" data-v-06469e2a>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><p class="text-slate-500 font-medium mt-4" data-v-06469e2a>You&#39;ve been invited to join <strong data-v-06469e2a>${ssrInterpolate(__props.invitation.organization.name)}</strong>.</p></div><div class="glass p-8 rounded-3xl shadow-premium border border-white/40 mb-8" data-v-06469e2a>`);
      if (__props.invitation.project) {
        _push(`<div class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4" data-v-06469e2a><div class="p-3 bg-blue-100/50 rounded-xl text-blue-600" data-v-06469e2a><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-06469e2a><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" data-v-06469e2a></path></svg></div><div data-v-06469e2a><p class="text-xs font-bold text-blue-500 uppercase tracking-wider" data-v-06469e2a>Assigned Project</p><p class="text-sm font-bold text-slate-800" data-v-06469e2a>${ssrInterpolate(__props.invitation.project.name)}</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="space-y-5" data-v-06469e2a>`);
      if (!__props.userExists) {
        _push(`<div data-v-06469e2a><div class="mb-5" data-v-06469e2a><label for="name" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-06469e2a>Your Full Name</label><input id="name"${ssrRenderAttr("value", unref(form).name)} type="text" required class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300" placeholder="John Doe" data-v-06469e2a>`);
        if (unref(form).errors.name) {
          _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-06469e2a>${ssrInterpolate(unref(form).errors.name)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="mb-5" data-v-06469e2a><label for="password" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-06469e2a>Create Password</label><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" required class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-06469e2a>`);
        if (unref(form).errors.password) {
          _push(`<p class="mt-2 text-xs font-medium text-red-500 ml-1" data-v-06469e2a>${ssrInterpolate(unref(form).errors.password)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div data-v-06469e2a><label for="password_confirmation" class="block text-sm font-semibold text-slate-700 mb-2 ml-1" data-v-06469e2a>Confirm Password</label><input id="password_confirmation"${ssrRenderAttr("value", unref(form).password_confirmation)} type="password" required class="block w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white transition-all duration-300" placeholder="••••••••" data-v-06469e2a></div></div>`);
      } else {
        _push(`<div class="text-center py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6" data-v-06469e2a><p class="text-sm text-slate-600" data-v-06469e2a>You already have an account with <strong data-v-06469e2a>${ssrInterpolate(__props.invitation.email)}</strong>. Click below to accept the invitation and join.</p></div>`);
      }
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0" data-v-06469e2a>`);
      if (!unref(form).processing) {
        _push(`<span data-v-06469e2a>${ssrInterpolate(!__props.userExists ? "Create Account & Join" : "Accept Invitation & Join")}</span>`);
      } else {
        _push(`<span class="flex items-center justify-center" data-v-06469e2a><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-v-06469e2a><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-06469e2a></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-06469e2a></path></svg> Processing... </span>`);
      }
      _push(`</button></form></div><p class="text-center text-sm font-medium text-slate-500 mb-12" data-v-06469e2a> Signed in as another user? <button class="text-primary hover:text-primary-hover font-bold underline-offset-4 hover:underline transition-all" data-v-06469e2a>Switch Account</button></p></div></div><footer class="relative z-10 py-10 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm mt-auto" data-v-06469e2a><div class="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6" data-v-06469e2a><p class="text-slate-500 text-sm font-medium" data-v-06469e2a>© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-8 text-sm font-bold uppercase tracking-widest" data-v-06469e2a><a${ssrRenderAttr("href", _ctx.route("privacy"))} class="text-slate-400 hover:text-primary transition-colors" data-v-06469e2a>Privacy</a><a${ssrRenderAttr("href", _ctx.route("terms"))} class="text-slate-400 hover:text-primary transition-colors" data-v-06469e2a>Terms</a><a${ssrRenderAttr("href", _ctx.route("cookies"))} class="text-slate-400 hover:text-primary transition-colors" data-v-06469e2a>Cookies</a></div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/AcceptInvitation.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AcceptInvitation = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-06469e2a"]]);
export {
  AcceptInvitation as default
};
