import { mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from "vue/server-renderer";
import "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./BrandLogo-DhDYxbtK.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "SelectOrganization",
  __ssrInlineRender: true,
  props: {
    organizations: Array
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden font-sans py-12" }, _attrs))} data-v-59a11bbc><div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" data-v-59a11bbc></div><div class="absolute top-0 -right-4 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" data-v-59a11bbc></div><div class="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" data-v-59a11bbc></div><div class="relative z-10 w-full max-w-2xl mx-auto px-6" data-v-59a11bbc><div class="text-center mb-10" data-v-59a11bbc><div class="flex flex-col items-center justify-center mb-6" data-v-59a11bbc>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div><h1 class="text-4xl font-extrabold tracking-tight text-slate-900 mb-2" data-v-59a11bbc>Select Workspace</h1><p class="text-slate-500 font-medium" data-v-59a11bbc>Which workspace would you like to access today?</p></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-6" data-v-59a11bbc><!--[-->`);
      ssrRenderList(__props.organizations, (org) => {
        _push(`<div class="glass p-6 rounded-3xl shadow-premium border border-white/40 cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group" data-v-59a11bbc><div class="flex items-center gap-4 mb-4" data-v-59a11bbc><div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300" data-v-59a11bbc><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-59a11bbc><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-59a11bbc></path></svg></div><div data-v-59a11bbc><h3 class="text-lg font-bold text-slate-900" data-v-59a11bbc>${ssrInterpolate(org.name)}</h3><p class="text-xs font-semibold text-slate-400 uppercase tracking-widest" data-v-59a11bbc>${ssrInterpolate(org.pivot.role)}</p></div></div><p class="text-sm text-slate-500 line-clamp-2 mb-4" data-v-59a11bbc>${ssrInterpolate(org.description || "No description available")}</p><div class="flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300" data-v-59a11bbc> Enter Workspace <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-59a11bbc><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-59a11bbc></path></svg></div></div>`);
      });
      _push(`<!--]--></div><p class="text-center mt-12 text-sm font-medium text-slate-500" data-v-59a11bbc> Need to join another organization? <a href="#" class="text-primary hover:text-primary-hover font-bold transition-all" data-v-59a11bbc>Contact your administrator</a></p></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Auth/SelectOrganization.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const SelectOrganization = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-59a11bbc"]]);
export {
  SelectOrganization as default
};
