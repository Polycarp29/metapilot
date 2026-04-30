import { ref, computed, onMounted, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, withDirectives, withKeys, vModelText, toDisplayString, createCommentVNode, createTextVNode, Fragment, renderList, vShow, withModifiers, vModelSelect, vModelCheckbox, nextTick, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { useForm, Link, router } from "@inertiajs/vue3";
import axios from "axios";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import _sfc_main$2 from "./FieldItem-Dl4IOwfQ.js";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import "./Toaster-DHWaylML.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
import "pinia";
const _sfc_main = {
  __name: "Edit",
  __ssrInlineRender: true,
  props: {
    schema: Object,
    schemaTypes: Array
  },
  setup(__props) {
    const toastStore = useToastStore();
    const props = __props;
    const generateUid = () => {
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    };
    const mapFields = (fields) => {
      return fields.map((f) => ({
        ...f,
        _uid: generateUid(),
        children: mapFields(f.recursive_children || f.children || [])
      }));
    };
    const localFields = ref(props.schema.root_fields ? mapFields(JSON.parse(JSON.stringify(props.schema.root_fields))) : []);
    const previewJson = ref("");
    const saving = ref(false);
    const showImportModal = ref(false);
    const showSettingsModal = ref(false);
    const importCode = ref("");
    const isEditorMode = ref(false);
    const editableCode = ref("");
    const syntaxError = ref(false);
    const seoErrors = ref([]);
    const seoWarnings = ref([]);
    const isValidating = ref(false);
    const showValidationPanel = ref(true);
    let validationTimeout = null;
    const isEditingName = ref(false);
    const nameInput = ref(null);
    const schemaForm = useForm({
      name: props.schema.name,
      schema_type_id: props.schema.schema_type_id,
      schema_id: props.schema.schema_id,
      url: props.schema.url,
      is_active: !!props.schema.is_active
    });
    const updateSettings = () => {
      schemaForm.put(`/schemas/${props.schema.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          showSettingsModal.value = false;
          toastStore.success("Schema configuration updated successfully.");
          generatePreview();
        },
        onError: () => {
          toastStore.error("Failed to update schema settings.");
        }
      });
    };
    const startEditingName = () => {
      schemaForm.name = props.schema.name;
      isEditingName.value = true;
      nextTick(() => {
        nameInput.value?.focus();
      });
    };
    const saveName = () => {
      if (schemaForm.name === props.schema.name) {
        isEditingName.value = false;
        return;
      }
      if (!schemaForm.name.trim()) {
        toastStore.error("Schema name cannot be empty.");
        return;
      }
      schemaForm.put(`/schemas/${props.schema.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          isEditingName.value = false;
          toastStore.success("Schema renamed successfully.");
        },
        onError: () => {
          toastStore.error("Failed to rename schema.");
        }
      });
    };
    const previewLines = computed(() => previewJson.value.split("\n"));
    const addRootField = () => {
      localFields.value.push({
        _uid: generateUid(),
        field_path: "",
        field_type: "text",
        field_value: "",
        children: []
      });
      generatePreview();
    };
    const removeRootField = (index) => {
      localFields.value.splice(index, 1);
      generatePreview();
    };
    const prepareForDuplication = (field) => {
      const newField = { ...field, _uid: generateUid() };
      if (field.children && field.children.length > 0) {
        newField.children = field.children.map((child) => prepareForDuplication(child));
      }
      return newField;
    };
    const duplicateRootField = (index) => {
      const fieldToDuplicate = JSON.parse(JSON.stringify(localFields.value[index]));
      const newField = prepareForDuplication(fieldToDuplicate);
      localFields.value.splice(index + 1, 0, newField);
      generatePreview();
    };
    const processFieldsForPreview = (fields) => {
      const obj = {};
      fields.forEach((field) => {
        if (!field.field_path) return;
        if (field.field_type === "object") {
          obj[field.field_path] = processFieldsForPreview(field.children || []);
        } else if (field.field_type === "array") {
          obj[field.field_path] = (field.children || []).map((child) => {
            if (child.field_type === "object") return processFieldsForPreview(child.children || []);
            return castValue(child.field_value, child.field_type);
          });
        } else {
          obj[field.field_path] = castValue(field.field_value, field.field_type);
        }
      });
      return obj;
    };
    const castValue = (val, type) => {
      if (type === "number") return parseFloat(val) || 0;
      if (type === "boolean") return val === "true" || val === true;
      return val;
    };
    const generatePreview = () => {
      const result = {
        "@context": "https://schema.org",
        "@type": props.schema.schema_type.name,
        "@id": props.schema.schema_id,
        ...processFieldsForPreview(localFields.value)
      };
      previewJson.value = JSON.stringify(result, null, 2);
      if (!isEditorMode.value) {
        editableCode.value = previewJson.value;
      }
      performLiveValidation();
    };
    const performLiveValidation = () => {
      if (validationTimeout) clearTimeout(validationTimeout);
      validationTimeout = setTimeout(async () => {
        try {
          isValidating.value = true;
          const parsed = JSON.parse(previewJson.value);
          const response = await axios.post("/api/validate-schema", {
            json_ld: parsed
          });
          seoErrors.value = response.data.errors || [];
          seoWarnings.value = response.data.warnings || [];
          isValidating.value = false;
        } catch (e) {
          isValidating.value = false;
        }
      }, 1e3);
    };
    const getTypeOfValue = (val) => {
      if (typeof val === "number") return "number";
      if (typeof val === "boolean") return "boolean";
      if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) return "url";
      return "text";
    };
    const jsonToFields = (obj) => {
      return Object.entries(obj).filter(([key]) => !["@context", "@type", "@id"].includes(key)).map(([key, value]) => {
        let type = "text";
        let val = value;
        let children = [];
        if (Array.isArray(value)) {
          type = "array";
          val = "";
          children = value.map((item) => {
            if (typeof item === "object" && item !== null) {
              return {
                field_path: "",
                field_type: "object",
                field_value: "",
                children: jsonToFields(item)
              };
            } else {
              return {
                field_path: "",
                field_type: getTypeOfValue(item),
                field_value: item,
                children: []
              };
            }
          });
        } else if (typeof value === "object" && value !== null) {
          type = "object";
          val = "";
          children = jsonToFields(value);
        } else {
          type = getTypeOfValue(value);
          val = value;
        }
        return {
          field_path: key,
          field_type: type,
          field_value: val,
          children
        };
      });
    };
    const processImport = () => {
      try {
        const parsed = JSON.parse(importCode.value);
        const newFields = jsonToFields(parsed);
        localFields.value = [...localFields.value, ...newFields];
        generatePreview();
        showImportModal.value = false;
        importCode.value = "";
        toastStore.success("Intelligence Interpreter has expanded the form architecture!");
      } catch (e) {
        toastStore.error("Parse Error: Please ensure you are pasting valid JSON-LD.");
      }
    };
    const toggleEditorMode = () => {
      isEditorMode.value = !isEditorMode.value;
      if (!isEditorMode.value) {
        generatePreview();
      }
    };
    const applyFix = (error) => {
      const pathParts = error.field.split(".").map((part) => {
        if (part.includes("[")) {
          const [name, indexStr] = part.split("[");
          const index = parseInt(indexStr.replace("]", ""));
          return { name, index, isArray: true };
        }
        return { name: part, isArray: false };
      });
      let currentContext = localFields.value;
      let targetFound = true;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        let field = currentContext.find((f) => f.field_path === part.name);
        if (!field) {
          toastStore.error(`Cannot apply fix: Parent field '${part.name}' not found.`);
          targetFound = false;
          break;
        }
        if (part.isArray) {
          if (!field.children || !field.children[part.index]) {
            toastStore.error(`Cannot apply fix: Array index ${part.index} out of bounds.`);
            targetFound = false;
            break;
          }
          currentContext = field.children[part.index].children;
        } else {
          currentContext = field.children;
        }
      }
      if (targetFound) {
        const lastPart = pathParts[pathParts.length - 1];
        const exists = currentContext.some((f) => f.field_path === lastPart.name);
        if (!exists) {
          currentContext.push({
            _uid: generateUid(),
            field_path: lastPart.name,
            field_type: "text",
            // Default to text, user can change
            field_value: "",
            children: []
          });
          generatePreview();
          toastStore.success(`Fixed: Added '${lastPart.name}' property.`);
        }
      }
    };
    const handleCodeInput = () => {
      try {
        const parsed = JSON.parse(editableCode.value);
        syntaxError.value = false;
        localFields.value = jsonToFields(parsed);
      } catch (e) {
        syntaxError.value = true;
      }
    };
    const saveFields = () => {
      saving.value = true;
      router.post(`/schemas/${props.schema.id}/fields/bulk`, {
        fields: localFields.value
      }, {
        onSuccess: () => {
          saving.value = false;
        },
        onError: () => {
          saving.value = false;
        }
      });
    };
    const highlight = (line) => {
      return line.replace(/"([^"]+)"(?=:)/g, '<span class="text-blue-400">"$1"</span>').replace(new RegExp('(?<=: )"([^"]+)"', "g"), '<span class="text-emerald-300">"$1"</span>').replace(new RegExp("(?<=: )(\\d+)", "g"), '<span class="text-amber-400">$1</span>');
    };
    const copyPreview = () => {
      navigator.clipboard.writeText(previewJson.value);
      toastStore.success("Optimized JSON-LD copied to clipboard!");
    };
    onMounted(() => {
      generatePreview();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({
        title: `Editing ${__props.schema.name}`
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-8"${_scopeId}><div class="glass sticky top-[80px] z-30 -mx-6 px-6 py-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 mb-10 shadow-sm"${_scopeId}><div class="flex items-center gap-6"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas",
              class: "hidden lg:flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId2}></path></svg>`);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                      })
                    ]))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<div${_scopeId}><div class="flex items-center gap-3 mb-1"${_scopeId}><div class="flex items-center gap-3 mb-1 group"${_scopeId}>`);
            if (isEditingName.value) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}><input${ssrRenderAttr("value", unref(schemaForm).name)} class="text-3xl font-extrabold text-slate-900 tracking-tight bg-transparent border-b-2 border-blue-500 focus:outline-none px-0 py-0 w-full min-w-[200px]"${_scopeId}></div>`);
            } else {
              _push2(`<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight cursor-text hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-200" title="Click to rename"${_scopeId}>${ssrInterpolate(__props.schema.name)}</h1>`);
            }
            if (!isEditingName.value) {
              _push2(`<button class="text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"${_scopeId}></path></svg></button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100"${_scopeId}>${ssrInterpolate(__props.schema.schema_type.name)}</span></div><p class="text-sm text-slate-400 font-medium tracking-tight truncate max-w-sm"${_scopeId}>${ssrInterpolate(__props.schema.schema_id)}</p></div></div><div class="flex items-center gap-4 w-full md:w-auto"${_scopeId}><a${ssrRenderAttr("href", `/schemas/${__props.schema.id}/export`)} class="flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-standard active:scale-95 text-sm"${_scopeId}><svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"${_scopeId}></path></svg> Export JSON </a><button class="flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-standard active:scale-95 text-sm"${_scopeId}><svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg> Settings </button><button${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-white font-bold px-10 py-3.5 rounded-2xl hover:bg-slate-800 transition-standard shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 text-sm"${_scopeId}>`);
            if (saving.value) {
              _push2(`<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"${_scopeId}></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(saving.value ? "Syncing..." : "Save Changes")}</button></div></div><div class="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start"${_scopeId}><div class="space-y-8 pb-32"${_scopeId}><div class="flex justify-between items-center mb-2"${_scopeId}><h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2"${_scopeId}>Properties Map</h3></div><div class="space-y-6"${_scopeId}><!--[-->`);
            ssrRenderList(localFields.value, (field) => {
              _push2(`<div${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$2, {
                field,
                onRemove: ($event) => removeRootField(localFields.value.indexOf(field)),
                onDuplicate: ($event) => duplicateRootField(localFields.value.indexOf(field)),
                onUpdate: generatePreview
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            });
            _push2(`<!--]--><div class="pt-6"${_scopeId}><button class="group flex items-center gap-3 bg-white border-2 border-dashed border-slate-200 w-full py-6 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-standard active:scale-[0.98]"${_scopeId}><div class="mx-auto flex items-center gap-2"${_scopeId}><div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-standard"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg></div><span class="text-sm font-black uppercase tracking-widest"${_scopeId}>New Property Layer</span></div></button></div>`);
            if (localFields.value.length === 0) {
              _push2(`<div class="flex flex-col items-center justify-center py-32 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center px-10"${_scopeId}><div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6"${_scopeId}><svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><h4 class="text-xl font-bold text-slate-900 mb-2 font-display"${_scopeId}>No Metadata Defined</h4><p class="text-slate-500 font-medium mb-10 max-w-xs"${_scopeId}>Start configuring your JSON-LD by adding properties to the root level.</p><button class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-standard active:scale-95 shadow-lg shadow-blue-100"${_scopeId}> Insert First Property </button></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="sticky top-[200px] space-y-8"${_scopeId}><div class="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[75vh]"${_scopeId}><div class="px-8 py-6 bg-black/40 border-b border-white/5 flex justify-between items-center backdrop-blur-md"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="w-3 h-3 bg-red-500/80 rounded-full"${_scopeId}></div><div class="w-3 h-3 bg-amber-500/80 rounded-full"${_scopeId}></div><div class="w-3 h-3 bg-emerald-500/80 rounded-full"${_scopeId}></div><span class="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"${_scopeId}><svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"${_scopeId}></path></svg> Real-time Intelligence </span></div><div class="flex items-center gap-3"${_scopeId}><button class="${ssrRenderClass([showValidationPanel.value ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-slate-400 border-white/5", "px-3 py-2 rounded-xl transition-standard border text-[10px] font-black uppercase tracking-widest active:scale-90 flex items-center gap-2 hover:bg-indigo-500/20"])}"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> Validation </button><button class="${ssrRenderClass([isEditorMode.value ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 hover:text-white", "px-4 py-2 rounded-xl transition-standard border border-white/5 text-[10px] font-black uppercase tracking-widest active:scale-90"])}"${_scopeId}>${ssrInterpolate(isEditorMode.value ? "Viewing Highlighted" : "Edit as Code")}</button><button class="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl transition-standard border border-blue-500/20 text-[10px] font-black uppercase tracking-widest active:scale-90"${_scopeId}> Import Code </button><button class="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-3 rounded-xl transition-standard border border-white/5 active:scale-90" title="Copy Code"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"${_scopeId}></path></svg></button></div></div><div class="flex-grow p-8 font-mono text-[13px] overflow-auto custom-scrollbar-dark selection:bg-blue-500/30 relative"${_scopeId}>`);
            if (isEditorMode.value) {
              _push2(`<textarea class="absolute inset-0 w-full h-full p-8 bg-transparent text-slate-300 resize-none border-none focus:ring-0 font-mono text-[13px] custom-scrollbar-dark" spellcheck="false"${_scopeId}>${ssrInterpolate(editableCode.value)}</textarea>`);
            } else {
              _push2(`<pre class="bg-transparent"${_scopeId}><code class="grid gap-1"${_scopeId}><!--[-->`);
              ssrRenderList(previewLines.value, (line, i) => {
                _push2(`<span class="flex gap-6"${_scopeId}><span class="text-slate-700 w-8 text-right select-none pr-4 border-r border-slate-800"${_scopeId}>${ssrInterpolate(i + 1)}</span><span class="text-slate-300 whitespace-pre"${_scopeId}>${highlight(line) ?? ""}</span></span>`);
              });
              _push2(`<!--]--></code></pre>`);
            }
            _push2(`</div><div class="px-8 py-5 bg-black/40 border-t border-white/5 flex flex-col gap-4" style="${ssrRenderStyle(showValidationPanel.value ? null : { display: "none" })}"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div class="flex gap-4"${_scopeId}><div class="flex flex-col"${_scopeId}><span class="text-[9px] font-black text-slate-500 uppercase tracking-widest"${_scopeId}>Compiler</span><span class="${ssrRenderClass([syntaxError.value ? "text-red-400" : "text-emerald-400", "text-[11px] font-bold"])}"${_scopeId}>${ssrInterpolate(syntaxError.value ? "SYNTAX ERROR" : "READY")}</span></div><div class="w-px h-8 bg-slate-800 mx-2"${_scopeId}></div><div class="flex flex-col"${_scopeId}><span class="text-[9px] font-black text-slate-500 uppercase tracking-widest"${_scopeId}>Protocol</span><span class="text-[11px] text-blue-400 font-bold"${_scopeId}>JSON-LD 1.1</span></div></div><div class="flex items-center gap-4"${_scopeId}>`);
            if (isValidating.value) {
              _push2(`<div class="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"${_scopeId}></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex items-center gap-2 group cursor-help"${_scopeId}><span class="${ssrRenderClass([seoErrors.value.length > 0 || syntaxError.value ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]", "w-2 h-2 rounded-full"])}"${_scopeId}></span><span class="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors"${_scopeId}>${ssrInterpolate(seoErrors.value.length > 0 || syntaxError.value ? "Action Required" : "SEO Standard Passed")}</span></div></div></div>`);
            if (seoErrors.value.length > 0 || seoWarnings.value.length > 0) {
              _push2(`<div class="pt-4 border-t border-white/5 space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(seoErrors.value, (err, i) => {
                _push2(`<div class="flex gap-3 items-start p-3 bg-red-500/10 rounded-xl border border-red-500/20"${_scopeId}><svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><div class="flex-grow flex items-center justify-between gap-4"${_scopeId}><span class="text-[11px] text-red-400 font-medium leading-relaxed"${_scopeId}>${ssrInterpolate(err.message)}</span>`);
                if (err.code === "missing_field") {
                  _push2(`<button class="text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-standard"${_scopeId}> Quick Fix </button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              });
              _push2(`<!--]--><!--[-->`);
              ssrRenderList(seoWarnings.value, (warn, i) => {
                _push2(`<div class="flex gap-3 items-start p-3 bg-amber-500/10 rounded-xl border border-amber-500/20"${_scopeId}><svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><span class="text-[11px] text-amber-400 font-medium leading-relaxed"${_scopeId}>${ssrInterpolate(warn.message)}</span></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div></div></div>`);
            if (showImportModal.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"${_scopeId}><div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-premium p-12 relative scale-in-center"${_scopeId}><button class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight"${_scopeId}>Import JSON-LD</h2><div class="space-y-8"${_scopeId}><div class="space-y-3"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4"${_scopeId}>Paste code snippet</label><textarea rows="8" placeholder="{ &quot;@context&quot;: &quot;https://schema.org&quot;, ... }" class="w-full px-8 py-6 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-mono text-sm"${_scopeId}>${ssrInterpolate(importCode.value)}</textarea></div><button class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard"${_scopeId}> Populate Form Architecture </button></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showSettingsModal.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"${_scopeId}><div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-premium p-12 relative scale-in-center"${_scopeId}><button class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight"${_scopeId}>Schema Configuration</h2><form class="space-y-6"${_scopeId}><div class="space-y-3"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4"${_scopeId}>Schema Type</label><div class="relative"${_scopeId}><select class="w-full appearance-none px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-bold"${_scopeId}><!--[-->`);
              ssrRenderList(__props.schemaTypes, (type) => {
                _push2(`<option${ssrRenderAttr("value", type.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(schemaForm).schema_type_id) ? ssrLooseContain(unref(schemaForm).schema_type_id, type.id) : ssrLooseEqual(unref(schemaForm).schema_type_id, type.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(type.name)} (${ssrInterpolate(type.type_key)}) </option>`);
              });
              _push2(`<!--]--></select><div class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div>`);
              if (unref(schemaForm).schema_type_id !== __props.schema.schema_type_id) {
                _push2(`<p class="px-4 text-xs text-amber-600 font-medium"${_scopeId}> Warning: Changing the schema type may require updating properties to match the new type&#39;s validation rules. </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-3"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4"${_scopeId}>Page URL (Context)</label><input${ssrRenderAttr("value", unref(schemaForm).url)} type="url" placeholder="https://example.com/page" class="w-full px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-medium"${_scopeId}></div><div class="space-y-3"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4"${_scopeId}>Schema ID (@id)</label><input${ssrRenderAttr("value", unref(schemaForm).schema_id)} type="text" placeholder="https://example.com/page#schema" class="w-full px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-medium"${_scopeId}></div><div class="space-y-3 pt-2"${_scopeId}><label class="flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-3xl border border-transparent hover:border-slate-200 transition-standard"${_scopeId}><div class="relative"${_scopeId}><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(schemaForm).is_active) ? ssrLooseContain(unref(schemaForm).is_active, null) : unref(schemaForm).is_active) ? " checked" : ""} class="sr-only peer"${_scopeId}><div class="w-14 h-8 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors"${_scopeId}></div><div class="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm"${_scopeId}></div></div><div${_scopeId}><span class="block text-sm font-bold text-slate-900"${_scopeId}>Active Status</span><span class="text-xs text-slate-500 font-medium"${_scopeId}>${ssrInterpolate(unref(schemaForm).is_active ? "Schema is published and visible" : "Schema is inactive (draft)")}</span></div></label></div><div class="pt-4 flex gap-4"${_scopeId}><button type="button" class="flex-1 bg-white text-slate-700 py-4 rounded-[2rem] font-bold border border-slate-200 hover:bg-slate-50 transition-standard"${_scopeId}> Cancel </button><button type="submit"${ssrIncludeBooleanAttr(unref(schemaForm).processing) ? " disabled" : ""} class="flex-1 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-standard disabled:opacity-50 disabled:hover:scale-100"${_scopeId}>${ssrInterpolate(unref(schemaForm).processing ? "Saving..." : "Save Configuration")}</button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("div", { class: "space-y-8" }, [
                createVNode("div", { class: "glass sticky top-[80px] z-30 -mx-6 px-6 py-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 mb-10 shadow-sm" }, [
                  createVNode("div", { class: "flex items-center gap-6" }, [
                    createVNode(unref(Link), {
                      href: "/schemas",
                      class: "hidden lg:flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-standard shadow-sm active:scale-90"
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                          })
                        ]))
                      ]),
                      _: 1
                    }),
                    createVNode("div", null, [
                      createVNode("div", { class: "flex items-center gap-3 mb-1" }, [
                        createVNode("div", { class: "flex items-center gap-3 mb-1 group" }, [
                          isEditingName.value ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "flex items-center gap-2"
                          }, [
                            withDirectives(createVNode("input", {
                              ref_key: "nameInput",
                              ref: nameInput,
                              "onUpdate:modelValue": ($event) => unref(schemaForm).name = $event,
                              onBlur: saveName,
                              onKeyup: withKeys(saveName, ["enter"]),
                              class: "text-3xl font-extrabold text-slate-900 tracking-tight bg-transparent border-b-2 border-blue-500 focus:outline-none px-0 py-0 w-full min-w-[200px]"
                            }, null, 40, ["onUpdate:modelValue"]), [
                              [vModelText, unref(schemaForm).name]
                            ])
                          ])) : (openBlock(), createBlock("h1", {
                            key: 1,
                            onClick: startEditingName,
                            class: "text-3xl font-extrabold text-slate-900 tracking-tight cursor-text hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-200",
                            title: "Click to rename"
                          }, toDisplayString(__props.schema.name), 1)),
                          !isEditingName.value ? (openBlock(), createBlock("button", {
                            key: 2,
                            onClick: startEditingName,
                            class: "text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              })
                            ]))
                          ])) : createCommentVNode("", true)
                        ]),
                        createVNode("span", { class: "px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100" }, toDisplayString(__props.schema.schema_type.name), 1)
                      ]),
                      createVNode("p", { class: "text-sm text-slate-400 font-medium tracking-tight truncate max-w-sm" }, toDisplayString(__props.schema.schema_id), 1)
                    ])
                  ]),
                  createVNode("div", { class: "flex items-center gap-4 w-full md:w-auto" }, [
                    createVNode("a", {
                      href: `/schemas/${__props.schema.id}/export`,
                      class: "flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-standard active:scale-95 text-sm"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-slate-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        })
                      ])),
                      createTextVNode(" Export JSON ")
                    ], 8, ["href"]),
                    createVNode("button", {
                      onClick: ($event) => showSettingsModal.value = true,
                      class: "flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-standard active:scale-95 text-sm"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-slate-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        }),
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        })
                      ])),
                      createTextVNode(" Settings ")
                    ], 8, ["onClick"]),
                    createVNode("button", {
                      onClick: saveFields,
                      disabled: saving.value,
                      class: "flex-grow md:flex-grow-0 inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-white font-bold px-10 py-3.5 rounded-2xl hover:bg-slate-800 transition-standard shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 text-sm"
                    }, [
                      saving.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      })) : createCommentVNode("", true),
                      createTextVNode(" " + toDisplayString(saving.value ? "Syncing..." : "Save Changes"), 1)
                    ], 8, ["disabled"])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 xl:grid-cols-2 gap-12 items-start" }, [
                  createVNode("div", { class: "space-y-8 pb-32" }, [
                    createVNode("div", { class: "flex justify-between items-center mb-2" }, [
                      createVNode("h3", { class: "text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" }, "Properties Map")
                    ]),
                    createVNode("div", { class: "space-y-6" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(localFields.value, (field) => {
                        return openBlock(), createBlock("div", {
                          key: field._uid
                        }, [
                          createVNode(_sfc_main$2, {
                            field,
                            onRemove: ($event) => removeRootField(localFields.value.indexOf(field)),
                            onDuplicate: ($event) => duplicateRootField(localFields.value.indexOf(field)),
                            onUpdate: generatePreview
                          }, null, 8, ["field", "onRemove", "onDuplicate"])
                        ]);
                      }), 128)),
                      createVNode("div", { class: "pt-6" }, [
                        createVNode("button", {
                          onClick: addRootField,
                          class: "group flex items-center gap-3 bg-white border-2 border-dashed border-slate-200 w-full py-6 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-standard active:scale-[0.98]"
                        }, [
                          createVNode("div", { class: "mx-auto flex items-center gap-2" }, [
                            createVNode("div", { class: "w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-standard" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                                })
                              ]))
                            ]),
                            createVNode("span", { class: "text-sm font-black uppercase tracking-widest" }, "New Property Layer")
                          ])
                        ])
                      ]),
                      localFields.value.length === 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex flex-col items-center justify-center py-32 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center px-10"
                      }, [
                        createVNode("div", { class: "w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-10 h-10 text-slate-300",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            })
                          ]))
                        ]),
                        createVNode("h4", { class: "text-xl font-bold text-slate-900 mb-2 font-display" }, "No Metadata Defined"),
                        createVNode("p", { class: "text-slate-500 font-medium mb-10 max-w-xs" }, "Start configuring your JSON-LD by adding properties to the root level."),
                        createVNode("button", {
                          onClick: addRootField,
                          class: "bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-standard active:scale-95 shadow-lg shadow-blue-100"
                        }, " Insert First Property ")
                      ])) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "sticky top-[200px] space-y-8" }, [
                    createVNode("div", { class: "bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-[75vh]" }, [
                      createVNode("div", { class: "px-8 py-6 bg-black/40 border-b border-white/5 flex justify-between items-center backdrop-blur-md" }, [
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("div", { class: "w-3 h-3 bg-red-500/80 rounded-full" }),
                          createVNode("div", { class: "w-3 h-3 bg-amber-500/80 rounded-full" }),
                          createVNode("div", { class: "w-3 h-3 bg-emerald-500/80 rounded-full" }),
                          createVNode("span", { class: "ml-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-4 h-4 text-blue-400",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              })
                            ])),
                            createTextVNode(" Real-time Intelligence ")
                          ])
                        ]),
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("button", {
                            onClick: ($event) => showValidationPanel.value = !showValidationPanel.value,
                            class: [showValidationPanel.value ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-slate-400 border-white/5", "px-3 py-2 rounded-xl transition-standard border text-[10px] font-black uppercase tracking-widest active:scale-90 flex items-center gap-2 hover:bg-indigo-500/20"]
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-4 h-4",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              })
                            ])),
                            createTextVNode(" Validation ")
                          ], 10, ["onClick"]),
                          createVNode("button", {
                            onClick: toggleEditorMode,
                            class: [isEditorMode.value ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 hover:text-white", "px-4 py-2 rounded-xl transition-standard border border-white/5 text-[10px] font-black uppercase tracking-widest active:scale-90"]
                          }, toDisplayString(isEditorMode.value ? "Viewing Highlighted" : "Edit as Code"), 3),
                          createVNode("button", {
                            onClick: ($event) => showImportModal.value = true,
                            class: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl transition-standard border border-blue-500/20 text-[10px] font-black uppercase tracking-widest active:scale-90"
                          }, " Import Code ", 8, ["onClick"]),
                          createVNode("button", {
                            onClick: copyPreview,
                            class: "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-3 rounded-xl transition-standard border border-white/5 active:scale-90",
                            title: "Copy Code"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-5 h-5",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              })
                            ]))
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "flex-grow p-8 font-mono text-[13px] overflow-auto custom-scrollbar-dark selection:bg-blue-500/30 relative" }, [
                        isEditorMode.value ? withDirectives((openBlock(), createBlock("textarea", {
                          key: 0,
                          "onUpdate:modelValue": ($event) => editableCode.value = $event,
                          onInput: handleCodeInput,
                          class: "absolute inset-0 w-full h-full p-8 bg-transparent text-slate-300 resize-none border-none focus:ring-0 font-mono text-[13px] custom-scrollbar-dark",
                          spellcheck: "false"
                        }, null, 40, ["onUpdate:modelValue"])), [
                          [vModelText, editableCode.value]
                        ]) : (openBlock(), createBlock("pre", {
                          key: 1,
                          class: "bg-transparent"
                        }, [
                          createVNode("code", { class: "grid gap-1" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(previewLines.value, (line, i) => {
                              return openBlock(), createBlock("span", {
                                key: i,
                                class: "flex gap-6"
                              }, [
                                createVNode("span", { class: "text-slate-700 w-8 text-right select-none pr-4 border-r border-slate-800" }, toDisplayString(i + 1), 1),
                                createVNode("span", {
                                  class: "text-slate-300 whitespace-pre",
                                  innerHTML: highlight(line)
                                }, null, 8, ["innerHTML"])
                              ]);
                            }), 128))
                          ])
                        ]))
                      ]),
                      withDirectives(createVNode("div", { class: "px-8 py-5 bg-black/40 border-t border-white/5 flex flex-col gap-4" }, [
                        createVNode("div", { class: "flex items-center justify-between" }, [
                          createVNode("div", { class: "flex gap-4" }, [
                            createVNode("div", { class: "flex flex-col" }, [
                              createVNode("span", { class: "text-[9px] font-black text-slate-500 uppercase tracking-widest" }, "Compiler"),
                              createVNode("span", {
                                class: [syntaxError.value ? "text-red-400" : "text-emerald-400", "text-[11px] font-bold"]
                              }, toDisplayString(syntaxError.value ? "SYNTAX ERROR" : "READY"), 3)
                            ]),
                            createVNode("div", { class: "w-px h-8 bg-slate-800 mx-2" }),
                            createVNode("div", { class: "flex flex-col" }, [
                              createVNode("span", { class: "text-[9px] font-black text-slate-500 uppercase tracking-widest" }, "Protocol"),
                              createVNode("span", { class: "text-[11px] text-blue-400 font-bold" }, "JSON-LD 1.1")
                            ])
                          ]),
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            isValidating.value ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
                            })) : createCommentVNode("", true),
                            createVNode("div", { class: "flex items-center gap-2 group cursor-help" }, [
                              createVNode("span", {
                                class: [seoErrors.value.length > 0 || syntaxError.value ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]", "w-2 h-2 rounded-full"]
                              }, null, 2),
                              createVNode("span", { class: "text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors" }, toDisplayString(seoErrors.value.length > 0 || syntaxError.value ? "Action Required" : "SEO Standard Passed"), 1)
                            ])
                          ])
                        ]),
                        seoErrors.value.length > 0 || seoWarnings.value.length > 0 ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "pt-4 border-t border-white/5 space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(seoErrors.value, (err, i) => {
                            return openBlock(), createBlock("div", {
                              key: "err-" + i,
                              class: "flex gap-3 items-start p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-4 h-4 text-red-500 shrink-0 mt-0.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                              ])),
                              createVNode("div", { class: "flex-grow flex items-center justify-between gap-4" }, [
                                createVNode("span", { class: "text-[11px] text-red-400 font-medium leading-relaxed" }, toDisplayString(err.message), 1),
                                err.code === "missing_field" ? (openBlock(), createBlock("button", {
                                  key: 0,
                                  onClick: ($event) => applyFix(err),
                                  class: "text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-standard"
                                }, " Quick Fix ", 8, ["onClick"])) : createCommentVNode("", true)
                              ])
                            ]);
                          }), 128)),
                          (openBlock(true), createBlock(Fragment, null, renderList(seoWarnings.value, (warn, i) => {
                            return openBlock(), createBlock("div", {
                              key: "warn-" + i,
                              class: "flex gap-3 items-start p-3 bg-amber-500/10 rounded-xl border border-amber-500/20"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-4 h-4 text-amber-500 shrink-0 mt-0.5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                              ])),
                              createVNode("span", { class: "text-[11px] text-amber-400 font-medium leading-relaxed" }, toDisplayString(warn.message), 1)
                            ]);
                          }), 128))
                        ])) : createCommentVNode("", true)
                      ], 512), [
                        [vShow, showValidationPanel.value]
                      ])
                    ])
                  ])
                ])
              ]),
              showImportModal.value ? (openBlock(), createBlock("div", {
                key: 0,
                class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-2xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" }, [
                  createVNode("button", {
                    onClick: ($event) => showImportModal.value = false,
                    class: "absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M6 18L18 6M6 6l12 12"
                      })
                    ]))
                  ], 8, ["onClick"]),
                  createVNode("h2", { class: "text-3xl font-black text-slate-900 mb-8 tracking-tight" }, "Import JSON-LD"),
                  createVNode("div", { class: "space-y-8" }, [
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Paste code snippet"),
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => importCode.value = $event,
                        rows: "8",
                        placeholder: '{ "@context": "https://schema.org", ... }',
                        class: "w-full px-8 py-6 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-mono text-sm"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, importCode.value]
                      ])
                    ]),
                    createVNode("button", {
                      onClick: processImport,
                      class: "w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard"
                    }, " Populate Form Architecture ")
                  ])
                ])
              ])) : createCommentVNode("", true),
              showSettingsModal.value ? (openBlock(), createBlock("div", {
                key: 1,
                class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              }, [
                createVNode("div", { class: "bg-white w-full max-w-2xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" }, [
                  createVNode("button", {
                    onClick: ($event) => showSettingsModal.value = false,
                    class: "absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M6 18L18 6M6 6l12 12"
                      })
                    ]))
                  ], 8, ["onClick"]),
                  createVNode("h2", { class: "text-3xl font-black text-slate-900 mb-8 tracking-tight" }, "Schema Configuration"),
                  createVNode("form", {
                    onSubmit: withModifiers(updateSettings, ["prevent"]),
                    class: "space-y-6"
                  }, [
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Schema Type"),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => unref(schemaForm).schema_type_id = $event,
                          class: "w-full appearance-none px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-bold"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.schemaTypes, (type) => {
                            return openBlock(), createBlock("option", {
                              key: type.id,
                              value: type.id
                            }, toDisplayString(type.name) + " (" + toDisplayString(type.type_key) + ") ", 9, ["value"]);
                          }), 128))
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, unref(schemaForm).schema_type_id]
                        ]),
                        createVNode("div", { class: "absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M19 9l-7 7-7-7"
                            })
                          ]))
                        ])
                      ]),
                      unref(schemaForm).schema_type_id !== __props.schema.schema_type_id ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "px-4 text-xs text-amber-600 font-medium"
                      }, " Warning: Changing the schema type may require updating properties to match the new type's validation rules. ")) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Page URL (Context)"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(schemaForm).url = $event,
                        type: "url",
                        placeholder: "https://example.com/page",
                        class: "w-full px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-medium"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, unref(schemaForm).url]
                      ])
                    ]),
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Schema ID (@id)"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(schemaForm).schema_id = $event,
                        type: "text",
                        placeholder: "https://example.com/page#schema",
                        class: "w-full px-8 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-medium"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, unref(schemaForm).schema_id]
                      ])
                    ]),
                    createVNode("div", { class: "space-y-3 pt-2" }, [
                      createVNode("label", { class: "flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-3xl border border-transparent hover:border-slate-200 transition-standard" }, [
                        createVNode("div", { class: "relative" }, [
                          withDirectives(createVNode("input", {
                            type: "checkbox",
                            "onUpdate:modelValue": ($event) => unref(schemaForm).is_active = $event,
                            class: "sr-only peer"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelCheckbox, unref(schemaForm).is_active]
                          ]),
                          createVNode("div", { class: "w-14 h-8 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors" }),
                          createVNode("div", { class: "absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm" })
                        ]),
                        createVNode("div", null, [
                          createVNode("span", { class: "block text-sm font-bold text-slate-900" }, "Active Status"),
                          createVNode("span", { class: "text-xs text-slate-500 font-medium" }, toDisplayString(unref(schemaForm).is_active ? "Schema is published and visible" : "Schema is inactive (draft)"), 1)
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "pt-4 flex gap-4" }, [
                      createVNode("button", {
                        type: "button",
                        onClick: ($event) => showSettingsModal.value = false,
                        class: "flex-1 bg-white text-slate-700 py-4 rounded-[2rem] font-bold border border-slate-200 hover:bg-slate-50 transition-standard"
                      }, " Cancel ", 8, ["onClick"]),
                      createVNode("button", {
                        type: "submit",
                        disabled: unref(schemaForm).processing,
                        class: "flex-1 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-standard disabled:opacity-50 disabled:hover:scale-100"
                      }, toDisplayString(unref(schemaForm).processing ? "Saving..." : "Save Configuration"), 9, ["disabled"])
                    ])
                  ], 32)
                ])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Schemas/Edit.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
