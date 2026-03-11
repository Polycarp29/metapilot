import { watch, onMounted, unref, useSSRContext } from "vue";
import { ssrRenderTeleport, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle } from "vue/server-renderer";
import { usePage } from "@inertiajs/vue3";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Toaster",
  __ssrInlineRender: true,
  setup(__props) {
    const toastStore = useToastStore();
    const page = usePage();
    let lastFlashMessage = null;
    let lastFlashSuccess = null;
    let lastFlashError = null;
    watch(() => page.props.flash, (flash) => {
      if (flash.message && flash.message !== lastFlashMessage) {
        toastStore.success(flash.message);
        lastFlashMessage = flash.message;
      } else if (!flash.message) {
        lastFlashMessage = null;
      }
      if (flash.success && flash.success !== lastFlashSuccess) {
        toastStore.success(flash.success);
        lastFlashSuccess = flash.success;
      } else if (!flash.success) {
        lastFlashSuccess = null;
      }
      if (flash.error && flash.error !== lastFlashError) {
        toastStore.error(flash.error);
        lastFlashError = flash.error;
      } else if (!flash.error) {
        lastFlashError = null;
      }
    }, { deep: true });
    onMounted(() => {
      if (page.props.flash.success) {
        toastStore.success(page.props.flash.success);
        lastFlashSuccess = page.props.flash.success;
      }
      if (page.props.flash.error) {
        toastStore.error(page.props.flash.error);
        lastFlashError = page.props.flash.error;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        _push2(`<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none" data-v-93e0bf05><!--[-->`);
        ssrRenderList(unref(toastStore).toasts, (toast) => {
          _push2(`<div class="${ssrRenderClass([{
            "border-l-4 border-l-blue-500": toast.type === "success",
            "border-l-4 border-l-red-500": toast.type === "error",
            "border-l-4 border-l-amber-500": toast.type === "warning"
          }, "pointer-events-auto bg-white rounded-xl shadow-2xl border border-slate-100 p-4 flex items-start gap-4 overflow-hidden relative group"])}" data-v-93e0bf05><div class="flex-shrink-0 mt-0.5" data-v-93e0bf05>`);
          if (toast.type === "success") {
            _push2(`<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-93e0bf05><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-93e0bf05></path></svg>`);
          } else if (toast.type === "error") {
            _push2(`<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-93e0bf05><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-93e0bf05></path></svg>`);
          } else {
            _push2(`<svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-93e0bf05><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-93e0bf05></path></svg>`);
          }
          _push2(`</div><div class="flex-grow min-w-0" data-v-93e0bf05><p class="text-sm font-semibold text-slate-900 leading-tight" data-v-93e0bf05>${ssrInterpolate(toast.title)}</p><p class="text-xs text-slate-500 mt-1 leading-relaxed" data-v-93e0bf05>${ssrInterpolate(toast.message)}</p></div><button class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1" data-v-93e0bf05><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-93e0bf05><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-93e0bf05></path></svg></button><div class="absolute bottom-0 left-0 h-1 bg-slate-100 group-hover:bg-slate-200 transition-colors" style="${ssrRenderStyle({ "width": "100%" })}" data-v-93e0bf05><div style="${ssrRenderStyle({ width: `${toast.progress}%` })}" class="${ssrRenderClass([{
            "bg-blue-400": toast.type === "success",
            "bg-red-400": toast.type === "error",
            "bg-amber-400": toast.type === "warning"
          }, "h-full bg-slate-300 transition-all duration-linear"])}" data-v-93e0bf05></div></div></div>`);
        });
        _push2(`<!--]--></div>`);
      }, "body", false, _parent);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Toaster.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Toaster = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-93e0bf05"]]);
export {
  Toaster as T
};
