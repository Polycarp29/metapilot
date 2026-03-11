import { resolveComponent, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderDynamicModel, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderComponent } from "vue/server-renderer";
const _sfc_main = {
  __name: "FieldItem",
  __ssrInlineRender: true,
  props: {
    field: {
      type: Object,
      required: true
    }
  },
  emits: ["remove", "duplicate", "update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const generateUid = () => {
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    };
    const emit = __emit;
    const removeChild = (index) => {
      props.field.children.splice(index, 1);
      emit("update");
    };
    const prepareForDuplication = (field) => {
      const newField = { ...field, _uid: generateUid() };
      if (field.children && field.children.length > 0) {
        newField.children = field.children.map((child) => prepareForDuplication(child));
      }
      return newField;
    };
    const duplicateChild = (index) => {
      const childToDuplicate = JSON.parse(JSON.stringify(props.field.children[index]));
      const newChild = prepareForDuplication(childToDuplicate);
      props.field.children.splice(index + 1, 0, newChild);
      emit("update");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FieldItem = resolveComponent("FieldItem", true);
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "group/item relative bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 transition-standard hover:shadow-premium hover:border-blue-100 hover:bg-white active:scale-[0.99] animate-in fade-in slide-in-from-left-4 duration-300" }, _attrs))}><div class="flex items-start justify-between gap-6"><div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow"><div class="space-y-2"><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Property Key</label><input${ssrRenderAttr("value", __props.field.field_path)} type="text" placeholder="e.g., name, @type" class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-medium placeholder:text-slate-300"></div><div class="space-y-2"><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Structure</label><div class="relative"><select class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-bold text-slate-700 appearance-none"><option value="text"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "text") : ssrLooseEqual(__props.field.field_type, "text")) ? " selected" : ""}>String / Text</option><option value="number"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "number") : ssrLooseEqual(__props.field.field_type, "number")) ? " selected" : ""}>Numeric</option><option value="boolean"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "boolean") : ssrLooseEqual(__props.field.field_type, "boolean")) ? " selected" : ""}>Boolean</option><option value="url"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "url") : ssrLooseEqual(__props.field.field_type, "url")) ? " selected" : ""}>Link / URL</option><option value="object"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "object") : ssrLooseEqual(__props.field.field_type, "object")) ? " selected" : ""}>Nested Object</option><option value="array"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_type) ? ssrLooseContain(__props.field.field_type, "array") : ssrLooseEqual(__props.field.field_type, "array")) ? " selected" : ""}>List / Array</option></select></div></div>`);
      if (!["object", "array"].includes(__props.field.field_type)) {
        _push(`<div class="space-y-2 lg:col-span-2"><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment</label><div class="relative">`);
        if (__props.field.field_type !== "boolean") {
          _push(`<input${ssrRenderDynamicModel(__props.field.field_type === "number" ? "number" : "text", __props.field.field_value, null)}${ssrRenderAttr("type", __props.field.field_type === "number" ? "number" : "text")} placeholder="Enter value..." class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-medium placeholder:text-slate-300">`);
        } else {
          _push(`<select class="block w-full px-4 py-3 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-standard text-sm font-bold appearance-none"><option value="true"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_value) ? ssrLooseContain(__props.field.field_value, "true") : ssrLooseEqual(__props.field.field_value, "true")) ? " selected" : ""}>True</option><option value="false"${ssrIncludeBooleanAttr(Array.isArray(__props.field.field_value) ? ssrLooseContain(__props.field.field_value, "false") : ssrLooseEqual(__props.field.field_value, "false")) ? " selected" : ""}>False</option></select>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<div class="flex items-center h-full pt-6 lg:col-span-2"><div class="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3"><div class="${ssrRenderClass([__props.field.field_type === "object" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600", "w-2 h-2 rounded-full animate-pulse"])}"></div><span class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">${ssrInterpolate(__props.field.field_type === "object" ? "Container Object Active" : "Sequential List Active")}</span></div></div>`);
      }
      _push(`</div><div class="mt-6 flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-standard"><button class="p-2 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-standard active:scale-90" title="Duplicate property"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button><button class="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-standard active:scale-90" title="Remove property"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div>`);
      if (["object", "array"].includes(__props.field.field_type)) {
        _push(`<div class="pl-8 border-l-2 border-slate-100 mt-6 space-y-6"><!--[-->`);
        ssrRenderList(__props.field.children, (child) => {
          _push(`<div>`);
          _push(ssrRenderComponent(_component_FieldItem, {
            field: child,
            onRemove: ($event) => removeChild(__props.field.children.indexOf(child)),
            onDuplicate: ($event) => duplicateChild(__props.field.children.indexOf(child)),
            onUpdate: ($event) => _ctx.$emit("update")
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--><button type="button" class="group/add w-full py-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] hover:border-blue-200 hover:bg-blue-50/50 transition-standard flex items-center justify-center gap-3 active:scale-[0.98]"><div class="w-8 h-8 bg-blue-50 group-hover/add:bg-blue-600 group-hover/add:text-white rounded-lg flex items-center justify-center text-blue-600 transition-standard"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></div><span class="text-xs font-black text-slate-400 group-hover/add:text-blue-600 uppercase tracking-widest transition-standard"> Add New ${ssrInterpolate(__props.field.field_type === "object" ? "Member Property" : "Array Item")}</span></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Schemas/Components/FieldItem.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
