import { mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate } from "vue/server-renderer";
const _sfc_main = {
  __name: "ConfirmationModal",
  __ssrInlineRender: true,
  props: {
    show: Boolean,
    title: String,
    message: String,
    confirmText: {
      type: String,
      default: "Confirm"
    },
    cancelText: {
      type: String,
      default: "Cancel"
    }
  },
  emits: ["close", "confirm"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" }, _attrs))}><div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100"><div class="flex flex-col items-center text-center"><div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><h3 class="text-2xl font-bold text-slate-900 mb-2">${ssrInterpolate(__props.title)}</h3><p class="text-slate-500 mb-8 leading-relaxed">${ssrInterpolate(__props.message)}</p><div class="flex gap-4 w-full"><button type="button" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-standard">${ssrInterpolate(__props.cancelText)}</button><button type="button" class="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-red-500/20 active:scale-95">${ssrInterpolate(__props.confirmText)}</button></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ConfirmationModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
