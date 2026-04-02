import { ref, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, Fragment, renderList, toDisplayString, withModifiers, withDirectives, vModelText, createCommentVNode, Transition, vModelSelect, vShow, vModelCheckbox, TransitionGroup, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { useForm, Link } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-Bc8-cOZM.js";
import axios from "axios";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./BrandLogo-DhDYxbtK.js";
import "pinia";
const _sfc_main = {
  __name: "AutomatedGenerator",
  __ssrInlineRender: true,
  props: {
    schemaTypes: Array,
    containers: Array,
    errors: Object
  },
  setup(__props) {
    const toastStore = useToastStore();
    const props = __props;
    const currentStep = ref(0);
    const isAnalyzing = ref(false);
    const scanScore = ref(null);
    const steps = [
      { label: "Foundation", title: "SEO Context" },
      { label: "Modular", title: "Schema Blocks" },
      { label: "Catalog", title: "Data Entry" }
    ];
    const form = useForm({
      name: "",
      meta_description: "",
      page_link: "",
      use_existing_container: false,
      selected_container_id: "",
      sub_path: "",
      include_brand_identity: true,
      brand_name: "",
      brand_logo: "",
      brand_alternate_name: "",
      brand_show_products: false,
      brand_link_products: true,
      brand_show_services: false,
      brand_link_services: true,
      brand_show_offers: true,
      brand_products: [],
      brand_services: [],
      modules: []
    });
    const analyzeUrl = async () => {
      if (!form.page_link) {
        toastStore.error("Please enter a URL first.");
        return;
      }
      isAnalyzing.value = true;
      try {
        const response = await axios.post(route("api.analyze-url"), { url: form.page_link });
        form.name = response.data.h1 || response.data.title || "Dynamic Page";
        let derivedDescription = response.data.description || "";
        if (response.data.keywords && !derivedDescription.includes(response.data.keywords)) {
          if (derivedDescription) {
            derivedDescription += " | Keywords: " + response.data.keywords;
          } else {
            derivedDescription = response.data.keywords;
          }
        }
        form.meta_description = derivedDescription;
        if (response.data.title) {
          let brandName = "";
          if (response.data.title.includes("|")) {
            brandName = response.data.title.split("|").pop().trim();
          } else if (response.data.title.includes("-")) {
            brandName = response.data.title.split("-").pop().trim();
          } else {
            brandName = response.data.title;
          }
          form.brand_name = brandName;
        }
        if (response.data.og_image) {
          form.brand_logo = response.data.og_image;
        }
        scanScore.value = response.data.quality_score;
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          response.data.suggestions.forEach((suggestionKey) => {
            const type = props.schemaTypes.find((t) => t.type_key === suggestionKey);
            if (type && !form.modules.find((m) => m.schema_type_id === type.id)) {
              let defaultData = { items: [{ name: "", description: "" }] };
              if (suggestionKey === "localbusiness") {
                defaultData = { items: [] };
              } else if (suggestionKey === "breadcrumb") {
                defaultData = { items: [{ name: "Home", url: "/" }] };
              } else if (suggestionKey === "event") {
                defaultData = { items: [{ name: "", description: "", startDate: "", location: "" }] };
              }
              form.modules.push({
                schema_type_id: type.id,
                data: defaultData
              });
              if (suggestionKey === "localbusiness") {
                setupLocalBusiness(form.modules.length - 1);
              }
            }
          });
        }
        toastStore.success("URL Intelligence has populated the foundational fields and suggested modules!");
      } catch (e) {
        toastStore.error("Failed to reach site. You can still enter details manually.");
      } finally {
        isAnalyzing.value = false;
      }
    };
    const addBrandProduct = () => {
      form.brand_products.push({
        "@type": "Product",
        name: "",
        description: "",
        url: ""
      });
    };
    const toggleBrandProducts = () => {
      form.brand_show_products = !form.brand_show_products;
      if (form.brand_show_products && form.brand_products.length === 0) {
        addBrandProduct();
      }
    };
    const removeBrandProduct = (idx) => {
      form.brand_products.splice(idx, 1);
    };
    const addBrandService = () => {
      form.brand_services.push({
        "@type": "Service",
        name: "",
        description: "",
        url: ""
      });
    };
    const toggleBrandServices = () => {
      form.brand_show_services = !form.brand_show_services;
      if (form.brand_show_services && form.brand_services.length === 0) {
        addBrandService();
      }
    };
    const addModule = () => {
      form.modules.push({
        schema_type_id: "",
        data: { items: [] }
      });
    };
    const removeModule = (idx) => {
      form.modules.splice(idx, 1);
    };
    const addProduct = (mIdx) => {
      form.modules[mIdx].data.items.push({ name: "", description: "", url: "" });
    };
    const removeProduct = (mIdx, pIdx) => {
      form.modules[mIdx].data.items.splice(pIdx, 1);
    };
    const addFAQItem = (mIdx) => {
      form.modules[mIdx].data.items.push({ name: "", description: "" });
    };
    const removeFAQItem = (mIdx, qIdx) => {
      form.modules[mIdx].data.items.splice(qIdx, 1);
    };
    const addHowToStep = (mIdx) => {
      form.modules[mIdx].data.items.push({ name: "", description: "", url: "" });
    };
    const removeHowToStep = (mIdx, sIdx) => {
      form.modules[mIdx].data.items.splice(sIdx, 1);
    };
    const addBreadcrumb = (mIdx) => {
      form.modules[mIdx].data.items.push({ name: "", url: "" });
    };
    const removeBreadcrumb = (mIdx, bIdx) => {
      form.modules[mIdx].data.items.splice(bIdx, 1);
    };
    const setupLocalBusiness = (mIdx) => {
      form.modules[mIdx].data.items = [{
        address: "",
        city: "",
        region: "",
        country: "Kenya",
        phone: "",
        price_range: "$$"
      }];
    };
    const hasStepErrors = (idx) => {
      if (idx === 0) {
        return !!(errors.value.name || errors.value.page_link || errors.value.meta_description);
      }
      if (idx === 1) {
        return !!(errors.value.brand_name || errors.value.brand_logo);
      }
      if (idx === 2) {
        return Object.keys(errors.value).some((k) => k.startsWith("modules."));
      }
      return false;
    };
    const getTypeName = (id) => props.schemaTypes.find((t) => t.id === id)?.name || "Custom";
    const getTypeKey = (id) => props.schemaTypes.find((t) => t.id === id)?.type_key || "";
    const errors = ref({});
    const nextStep = () => {
      errors.value = {};
      if (currentStep.value === 0) {
        if (!form.name || form.name.length < 3) {
          errors.value.name = "Assistant: 'I need a name for this schema (at least 3 characters).'";
        }
        if (!form.page_link || !form.page_link.startsWith("http")) {
          errors.value.page_link = "Assistant: 'Please provide a valid URL for the canonical link.'";
        }
        if (!form.meta_description || form.meta_description.length < 10) {
          errors.value.meta_description = "Assistant: 'I need a meta description for this page (at least 10 chars).'";
        }
        if (Object.keys(errors.value).length > 0) return;
      }
      if (currentStep.value < 2) currentStep.value++;
    };
    const prevStep = () => {
      if (currentStep.value > 0) currentStep.value--;
    };
    const submit = () => {
      form.post("/schemas/automated", {
        onSuccess: () => {
          toastStore.success("Modular Schema successfully generated and saved!");
        },
        onError: (errs) => {
          errors.value = errs;
          toastStore.error("Failed to save. Please check the required fields in the 'Foundation' step.");
          if (errs.name || errs.meta_description || errs.page_link) {
            currentStep.value = 0;
          }
        }
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Modular Schema Builder" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-5xl mx-auto space-y-12 pb-24" data-v-a0503ef4${_scopeId}><div class="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-20 shadow-2xl" data-v-a0503ef4${_scopeId}><div class="absolute top-0 right-0 -m-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" data-v-a0503ef4${_scopeId}></div><div class="absolute bottom-0 left-0 -m-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" data-v-a0503ef4${_scopeId}></div><div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10" data-v-a0503ef4${_scopeId}><div class="text-center md:text-left" data-v-a0503ef4${_scopeId}><div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-500/30" data-v-a0503ef4${_scopeId}><span class="relative flex h-2 w-2" data-v-a0503ef4${_scopeId}><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" data-v-a0503ef4${_scopeId}></span><span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500" data-v-a0503ef4${_scopeId}></span></span> Universal Intelligence </div><h1 class="text-5xl md:text-6xl font-black text-white tracking-tight mb-6" data-v-a0503ef4${_scopeId}> Modular <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400" data-v-a0503ef4${_scopeId}>Flex-Builder</span></h1><p class="text-slate-400 font-medium text-lg max-w-xl leading-relaxed" data-v-a0503ef4${_scopeId}> Create highly adaptive structured data for any website. Toggle brand identity, add custom categories, and tailor every page context. </p></div>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/schemas",
              class: "group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-3xl font-bold transition-standard border border-white/10 backdrop-blur-xl"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-v-a0503ef4${_scopeId2}></path></svg> Cancel `);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6 text-slate-500 group-hover:text-white transition-colors",
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
                    ])),
                    createTextVNode(" Cancel ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start" data-v-a0503ef4${_scopeId}><div class="lg:sticky lg:top-24 space-y-4" data-v-a0503ef4${_scopeId}><!--[-->`);
            ssrRenderList(steps, (step, idx) => {
              _push2(`<div class="${ssrRenderClass([[
                currentStep.value === idx ? "bg-white border-blue-200 shadow-blue-100 ring-1 ring-blue-50" : "bg-slate-50 border-transparent opacity-60 grayscale"
              ], "group relative flex items-center gap-6 p-6 rounded-[2rem] transition-standard border shadow-sm"])}" data-v-a0503ef4${_scopeId}><div class="${ssrRenderClass([[
                currentStep.value === idx ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : hasStepErrors(idx) ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500"
              ], "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-standard"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(idx + 1)}</div><div data-v-a0503ef4${_scopeId}><h4 class="font-bold text-slate-900 leading-tight uppercase tracking-widest text-[10px]" data-v-a0503ef4${_scopeId}>${ssrInterpolate(step.label)}</h4><p class="text-slate-500 text-xs font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(step.title)}</p></div></div>`);
            });
            _push2(`<!--]--></div><div class="lg:col-span-2" data-v-a0503ef4${_scopeId}><form class="bg-white rounded-[3.5rem] shadow-premium border border-slate-100 overflow-hidden" data-v-a0503ef4${_scopeId}><div class="p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style="${ssrRenderStyle(currentStep.value === 0 ? null : { display: "none" })}" data-v-a0503ef4${_scopeId}><div class="grid grid-cols-1 gap-10" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" data-v-a0503ef4${_scopeId}>Internal Recognition Name</label><input${ssrRenderAttr("value", unref(form).name)} type="text" placeholder="e.g., Dynamic Subpage Markup" class="${ssrRenderClass([{ "ring-2 ring-red-500 border-red-500": errors.value.name }, "block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-bold text-lg placeholder:text-slate-300"])}" data-v-a0503ef4${_scopeId}>`);
            if (errors.value.name) {
              _push2(`<p class="text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2" data-v-a0503ef4${_scopeId}>${ssrInterpolate(errors.value.name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" data-v-a0503ef4${_scopeId}>Contextual Meta Description</label><textarea rows="4" placeholder="Description for this specific page..." class="${ssrRenderClass([{ "ring-2 ring-red-500 border-red-500": errors.value.meta_description }, "block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(unref(form).meta_description)}</textarea>`);
            if (errors.value.meta_description) {
              _push2(`<p class="text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2" data-v-a0503ef4${_scopeId}>${ssrInterpolate(errors.value.meta_description)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" data-v-a0503ef4${_scopeId}>Canonical Link Destination</label><div class="flex gap-4" data-v-a0503ef4${_scopeId}><input${ssrRenderAttr("value", unref(form).page_link)} type="url" class="${ssrRenderClass([{ "ring-2 ring-red-500 border-red-500": errors.value.page_link }, "block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"])}" data-v-a0503ef4${_scopeId}><button type="button"${ssrIncludeBooleanAttr(isAnalyzing.value) ? " disabled" : ""} class="shrink-0 bg-slate-900 text-white px-8 py-5 rounded-3xl font-black transition-standard hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2" data-v-a0503ef4${_scopeId}>`);
            if (isAnalyzing.value) {
              _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-a0503ef4${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-a0503ef4${_scopeId}></path></svg>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(isAnalyzing.value ? "Scanning..." : "Scan URL")}</button></div>`);
            if (errors.value.page_link) {
              _push2(`<p class="text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2" data-v-a0503ef4${_scopeId}>${ssrInterpolate(errors.value.page_link)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="mt-8 space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50" data-v-a0503ef4${_scopeId}><h5 class="text-xs font-black text-slate-800 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Architecture Strategy</h5><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-a0503ef4${_scopeId}><button type="button" class="${ssrRenderClass([!unref(form).use_existing_container ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-600 border border-slate-200", "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center"])}" data-v-a0503ef4${_scopeId}> New Root Schema </button><button type="button" class="${ssrRenderClass([unref(form).use_existing_container ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-600 border border-slate-200", "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center"])}" data-v-a0503ef4${_scopeId}> Build on Existing Root </button></div>`);
            if (unref(form).use_existing_container) {
              _push2(`<div class="space-y-4 pt-4 border-t border-slate-200/50" data-v-a0503ef4${_scopeId}><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Select Root Container</label><select class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold appearance-none" data-v-a0503ef4${_scopeId}><option value="" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(unref(form).selected_container_id) ? ssrLooseContain(unref(form).selected_container_id, "") : ssrLooseEqual(unref(form).selected_container_id, "")) ? " selected" : ""}${_scopeId}>Select a brand root...</option><!--[-->`);
              ssrRenderList(__props.containers, (c) => {
                _push2(`<option${ssrRenderAttr("value", c.id)} data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(unref(form).selected_container_id) ? ssrLooseContain(unref(form).selected_container_id, c.id) : ssrLooseEqual(unref(form).selected_container_id, c.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(c.name)} (${ssrInterpolate(c.identifier)})</option>`);
              });
              _push2(`<!--]--></select></div><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Sub-path Variation</label><input${ssrRenderAttr("value", unref(form).sub_path)} type="text" placeholder="e.g., /en or /mobile" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" data-v-a0503ef4${_scopeId}><p class="text-[9px] text-slate-400 font-medium ml-2 italic text-left" data-v-a0503ef4${_scopeId}>The schema @id will be: root_id + sub_path</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (scanScore.value !== null) {
              _push2(`<div class="mt-8 flex items-center justify-between bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50" data-v-a0503ef4${_scopeId}><div class="flex items-center gap-4" data-v-a0503ef4${_scopeId}><div class="w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center relative" data-v-a0503ef4${_scopeId}><svg class="w-full h-full -rotate-90 absolute" data-v-a0503ef4${_scopeId}><circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" stroke-width="4" class="text-blue-200" style="${ssrRenderStyle({ "cx": "50%", "cy": "50%", "r": "40%" })}" data-v-a0503ef4${_scopeId}></circle><circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" stroke-width="4" class="text-blue-500" style="${ssrRenderStyle({ strokeDasharray: "100", strokeDashoffset: 100 - scanScore.value, cx: "50%", cy: "50%", r: "40%" })}" data-v-a0503ef4${_scopeId}></circle></svg><span class="text-[10px] font-black text-blue-700" data-v-a0503ef4${_scopeId}>${ssrInterpolate(scanScore.value)}%</span></div><div data-v-a0503ef4${_scopeId}><h5 class="text-xs font-black text-blue-900 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>SEO Quality Score</h5><p class="text-[10px] text-blue-600 font-medium" data-v-a0503ef4${_scopeId}>Auto-derived from URL metadata analysis.</p></div></div><div class="${ssrRenderClass([scanScore.value > 70 ? "text-emerald-600" : "text-amber-600", "text-xs font-bold"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(scanScore.value > 70 ? "Excellent Match" : "Manual Refinement Recommended")}</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div><div class="p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style="${ssrRenderStyle(currentStep.value === 1 ? null : { display: "none" })}" data-v-a0503ef4${_scopeId}><div class="flex items-start gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group mb-12" data-v-a0503ef4${_scopeId}><div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-a0503ef4${_scopeId}></path></svg></div><div class="space-y-1 relative z-10" data-v-a0503ef4${_scopeId}><h3 class="text-xl font-black text-slate-900 tracking-tight" data-v-a0503ef4${_scopeId}>Strategy Phase</h3><p class="text-slate-500 text-sm font-medium leading-relaxed" data-v-a0503ef4${_scopeId}> &quot;What should we focus on for this page? Toggle your brand identity or add specific category blocks below.&quot; </p></div></div><div class="space-y-6" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><div class="${ssrRenderClass([unref(form).include_brand_identity ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-slate-200", "group p-8 rounded-[2.5rem] border-2 cursor-pointer transition-standard flex justify-between items-center"])}" data-v-a0503ef4${_scopeId}><div class="flex items-center gap-6" data-v-a0503ef4${_scopeId}><div class="${ssrRenderClass([unref(form).include_brand_identity ? "bg-blue-500" : "bg-slate-100 text-slate-400", "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-standard"])}" data-v-a0503ef4${_scopeId}><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-a0503ef4${_scopeId}></path></svg></div><div data-v-a0503ef4${_scopeId}><h4 class="${ssrRenderClass([unref(form).include_brand_identity ? "text-white" : "text-slate-900", "text-xl font-black"])}" data-v-a0503ef4${_scopeId}>Brand Identity</h4><p class="${ssrRenderClass([unref(form).include_brand_identity ? "text-slate-400" : "text-slate-500", "text-xs font-medium"])}" data-v-a0503ef4${_scopeId}>Injects Organization &amp; WebSite JSON-LD.</p></div></div><div class="${ssrRenderClass([unref(form).include_brand_identity ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(unref(form).include_brand_identity ? "Active" : "Disabled")}</div></div>`);
            if (unref(form).include_brand_identity) {
              _push2(`<div class="space-y-6" data-v-a0503ef4${_scopeId}><div class="bg-indigo-50/40 p-10 rounded-[2.5rem] border border-indigo-100 space-y-10 ml-4 relative overflow-hidden" data-v-a0503ef4${_scopeId}><div class="absolute top-0 right-0 p-4 opacity-5" data-v-a0503ef4${_scopeId}><svg class="w-32 h-32 text-indigo-900" fill="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" data-v-a0503ef4${_scopeId}></path></svg></div><div class="flex items-center gap-4" data-v-a0503ef4${_scopeId}><div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" data-v-a0503ef4${_scopeId}></div><span class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60" data-v-a0503ef4${_scopeId}>Guided Building</span></div><h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight" data-v-a0503ef4${_scopeId}>Define your brand identity details.</h5><div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-v-a0503ef4${_scopeId}><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Brand Name</label><input${ssrRenderAttr("value", unref(form).brand_name)} type="text" placeholder="e.g., Acme Corp" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Brand Logo URL</label><input${ssrRenderAttr("value", unref(form).brand_logo)} type="url" placeholder="https://..." class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-2 md:col-span-2" data-v-a0503ef4${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Alternate Name / Trademarks</label><input${ssrRenderAttr("value", unref(form).brand_alternate_name)} type="text" placeholder="e.g., Acme, Acme Co" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" data-v-a0503ef4${_scopeId}></div></div><div class="space-y-4 pt-6 border-t border-indigo-100/50" data-v-a0503ef4${_scopeId}><h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight" data-v-a0503ef4${_scopeId}>Do you want to list your brand&#39;s flagship products?</h5><div class="flex gap-3" data-v-a0503ef4${_scopeId}><button type="button" class="${ssrRenderClass([unref(form).brand_show_products ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(unref(form).brand_show_products ? "Yes, Include Products" : "No Products")}</button>`);
              if (unref(form).brand_show_products) {
                _push2(`<label class="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" data-v-a0503ef4${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).brand_link_products) ? ssrLooseContain(unref(form).brand_link_products, null) : unref(form).brand_link_products) ? " checked" : ""} type="checkbox" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-v-a0503ef4${_scopeId}><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none" data-v-a0503ef4${_scopeId}>Link to pages?</span></label>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="space-y-4 pt-6 border-t border-indigo-100/50" data-v-a0503ef4${_scopeId}><h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight" data-v-a0503ef4${_scopeId}>Should we also detail the services you provide?</h5><div class="flex gap-3" data-v-a0503ef4${_scopeId}><button type="button" class="${ssrRenderClass([unref(form).brand_show_services ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(unref(form).brand_show_services ? "Yes, Add Services" : "No Services")}</button>`);
              if (unref(form).brand_show_services) {
                _push2(`<label class="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" data-v-a0503ef4${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).brand_link_services) ? ssrLooseContain(unref(form).brand_link_services, null) : unref(form).brand_link_services) ? " checked" : ""} type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" data-v-a0503ef4${_scopeId}><span class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none" data-v-a0503ef4${_scopeId}>Include Landing Links?</span></label>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="space-y-4 pt-6 border-t border-indigo-100/50" data-v-a0503ef4${_scopeId}><label class="flex items-center gap-4 cursor-pointer group" data-v-a0503ef4${_scopeId}><div class="relative" data-v-a0503ef4${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).brand_show_offers) ? ssrLooseContain(unref(form).brand_show_offers, null) : unref(form).brand_show_offers) ? " checked" : ""} type="checkbox" class="sr-only peer" data-v-a0503ef4${_scopeId}><div class="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 transition-colors shadow-inner" data-v-a0503ef4${_scopeId}></div><div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" data-v-a0503ef4${_scopeId}></div></div><div data-v-a0503ef4${_scopeId}><span class="text-xs font-black text-slate-700 uppercase tracking-widest block" data-v-a0503ef4${_scopeId}>Standard Market Offers</span><span class="text-[10px] text-slate-400 font-medium" data-v-a0503ef4${_scopeId}>Include general promotions &amp; value propositions.</span></div></label></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-4" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center px-4" data-v-a0503ef4${_scopeId}><label class="text-xs font-black text-slate-400 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Additional Schema Modules</label><button class="text-blue-600 font-bold text-xs uppercase tracking-widest hover:blue-700" data-v-a0503ef4${_scopeId}>+ Add Module</button></div><!--[-->`);
            ssrRenderList(unref(form).modules, (module, idx) => {
              _push2(`<div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6" data-v-a0503ef4${_scopeId}><div class="flex-grow" data-v-a0503ef4${_scopeId}><select class="w-full bg-white border-slate-200 rounded-2xl px-5 py-3 font-bold text-sm h-14 appearance-none" data-v-a0503ef4${_scopeId}><option value="" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.schema_type_id) ? ssrLooseContain(module.schema_type_id, "") : ssrLooseEqual(module.schema_type_id, "")) ? " selected" : ""}${_scopeId}>Select Schema Category...</option><!--[-->`);
              ssrRenderList(__props.schemaTypes, (type) => {
                _push2(`<option${ssrRenderAttr("value", type.id)} data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.schema_type_id) ? ssrLooseContain(module.schema_type_id, type.id) : ssrLooseEqual(module.schema_type_id, type.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(type.name)}</option>`);
              });
              _push2(`<!--]--></select></div><button class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-a0503ef4${_scopeId}></path></svg></button></div>`);
            });
            _push2(`<!--]-->`);
            if (unref(form).modules.length === 0) {
              _push2(`<div class="text-center py-10 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200" data-v-a0503ef4${_scopeId}><p class="text-slate-400 text-xs font-bold italic" data-v-a0503ef4${_scopeId}>No custom modules added.</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div><div class="p-10 md:p-16 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500" style="${ssrRenderStyle(currentStep.value === 2 ? null : { display: "none" })}" data-v-a0503ef4${_scopeId}>`);
            if (unref(form).include_brand_identity) {
              _push2(`<div class="space-y-16" data-v-a0503ef4${_scopeId}><div class="flex items-start gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group" data-v-a0503ef4${_scopeId}><div class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity" data-v-a0503ef4${_scopeId}><svg class="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" data-v-a0503ef4${_scopeId}></path></svg></div><div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20" data-v-a0503ef4${_scopeId}><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" data-v-a0503ef4${_scopeId}></path></svg></div><div class="space-y-2 relative z-10" data-v-a0503ef4${_scopeId}><h3 class="text-xl font-black text-white tracking-tight" data-v-a0503ef4${_scopeId}>Personal Schema Assistant</h3><p class="text-slate-400 text-sm font-medium leading-relaxed" data-v-a0503ef4${_scopeId}> &quot;Great! Let&#39;s fill out your catalog. I&#39;ll guide you through each entry one field at a time to ensure your schema is optimized.&quot; </p></div></div>`);
              if (unref(form).brand_show_products) {
                _push2(`<div class="space-y-10" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center px-4" data-v-a0503ef4${_scopeId}><div class="flex items-center gap-3" data-v-a0503ef4${_scopeId}><div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-black text-xs shadow-sm" data-v-a0503ef4${_scopeId}>P</div><h4 class="text-sm font-black text-slate-800 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Brand Product Catalog</h4></div><button class="group flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:blue-700 transition-all" data-v-a0503ef4${_scopeId}><span class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all" data-v-a0503ef4${_scopeId}>+</span> Add New Product </button></div><div class="space-y-8" data-v-a0503ef4${_scopeId}><!--[-->`);
                ssrRenderList(unref(form).brand_products, (p, pIdx) => {
                  _push2(`<div class="relative" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-blue-100 space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;What type of item is this?&quot;</label><div class="flex flex-wrap gap-2" data-v-a0503ef4${_scopeId}><!--[-->`);
                  ssrRenderList(["Product", "Service", "FinancialProduct", "Offer"], (type) => {
                    _push2(`<button type="button" class="${ssrRenderClass([p["@type"] === type ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(type)}</button>`);
                  });
                  _push2(`<!--]--></div></div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;What&#39;s the name of this ${ssrInterpolate(p["@type"].toLowerCase())}?&quot;</label><input${ssrRenderAttr("value", p.name)} placeholder="e.g., Enterprise Plan" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div>`);
                  if (p.name.length > 2) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;Excellent. Can you provide a brief description for SEO context?&quot;</label><textarea rows="2" placeholder="Tell Google what this item is about..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(p.description)}</textarea></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (unref(form).brand_link_products && p.description.length > 5) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;And the landing page URL for this specific item?&quot;</label><input${ssrRenderAttr("value", p.url)} type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<button class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (unref(form).brand_show_services) {
                _push2(`<div class="space-y-10" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center px-4" data-v-a0503ef4${_scopeId}><div class="flex items-center gap-3" data-v-a0503ef4${_scopeId}><div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-black text-xs shadow-sm" data-v-a0503ef4${_scopeId}>S</div><h4 class="text-sm font-black text-slate-800 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Brand Services</h4></div><button class="group flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:indigo-700 transition-all" data-v-a0503ef4${_scopeId}><span class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all" data-v-a0503ef4${_scopeId}>+</span> Add New Service </button></div><div class="space-y-8" data-v-a0503ef4${_scopeId}><!--[-->`);
                ssrRenderList(unref(form).brand_services, (s, sIdx) => {
                  _push2(`<div class="relative" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-indigo-100 space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;What type of service or offer is this?&quot;</label><div class="flex flex-wrap gap-2" data-v-a0503ef4${_scopeId}><!--[-->`);
                  ssrRenderList(["Service", "FinancialProduct", "Product", "Offer"], (type) => {
                    _push2(`<button type="button" class="${ssrRenderClass([s["@type"] === type ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"])}" data-v-a0503ef4${_scopeId}>${ssrInterpolate(type)}</button>`);
                  });
                  _push2(`<!--]--></div></div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;What&#39;s the name of this ${ssrInterpolate(s["@type"].toLowerCase())}?&quot;</label><input${ssrRenderAttr("value", s.name)} placeholder="e.g., 24/7 Support Desk" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div>`);
                  if (s.name.length > 2) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;Got it. How would you describe the value of this item?&quot;</label><textarea rows="2" placeholder="Briefly explain the item..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(s.description)}</textarea></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (unref(form).brand_link_services && s.description.length > 5) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;And finally, which page should users visit for this?&quot;</label><input${ssrRenderAttr("value", s.url)} type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<button class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden group" data-v-a0503ef4${_scopeId}><div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" data-v-a0503ef4${_scopeId}></div><div class="flex items-center gap-6 relative z-10" data-v-a0503ef4${_scopeId}><div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-a0503ef4${_scopeId}></path></svg></div><div data-v-a0503ef4${_scopeId}><h5 class="text-sm font-black text-slate-900 mb-1 tracking-tight" data-v-a0503ef4${_scopeId}>System Note</h5><p class="text-slate-500 font-medium text-xs leading-relaxed" data-v-a0503ef4${_scopeId}> Brand identity creates standard Organization/WebSite entries. ${ssrInterpolate(unref(form).brand_show_offers ? "I will also append a Master Deposit Offer to your profile." : "")}</p></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<!--[-->`);
            ssrRenderList(unref(form).modules, (module, mIdx) => {
              _push2(`<div class="space-y-10" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center px-4" data-v-a0503ef4${_scopeId}><div class="flex items-center gap-3" data-v-a0503ef4${_scopeId}><div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 font-black text-xs shadow-sm" data-v-a0503ef4${_scopeId}>${ssrInterpolate(mIdx + 1)}</div><h4 class="text-sm font-black text-slate-800 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>${ssrInterpolate(getTypeName(module.schema_type_id))} Module</h4></div></div><div class="space-y-8 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 relative" data-v-a0503ef4${_scopeId}>`);
              if (getTypeKey(module.schema_type_id) === "product") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Assistant: &quot;Add items for this ${ssrInterpolate(getTypeName(module.schema_type_id))} category below.&quot;</label><button class="text-blue-600 font-bold text-[10px] uppercase tracking-widest" data-v-a0503ef4${_scopeId}>+ Add Item</button></div><!--[-->`);
                ssrRenderList(module.data.items, (p, pIdx) => {
                  _push2(`<div class="relative group" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;Name of the item?&quot;</label><input${ssrRenderAttr("value", p.name)} placeholder="Item name..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div>`);
                  if (p.name.length > 2) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;Briefly describe it for the schema.&quot;</label><textarea rows="2" placeholder="Description..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(p.description)}</textarea></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (p.description.length > 5) {
                    _push2(`<div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Assistant: &quot;Specific URL for this item?&quot;</label><input${ssrRenderAttr("value", p.url)} type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<button class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else if (getTypeKey(module.schema_type_id) === "faq") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Assistant: &quot;Add your Frequently Asked Questions below.&quot;</label><button class="text-blue-600 font-bold text-[10px] uppercase tracking-widest" data-v-a0503ef4${_scopeId}>+ Add Question</button></div><!--[-->`);
                ssrRenderList(module.data.items, (q, qIdx) => {
                  _push2(`<div class="relative group" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Question Text</label><input${ssrRenderAttr("value", q.name)} placeholder="What is your return policy?" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div><div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Accepted Answer</label><textarea rows="3" placeholder="Provide the answer here..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(q.description)}</textarea></div><button class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else if (getTypeKey(module.schema_type_id) === "howto") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Assistant: &quot;Detail your step-by-step instructions.&quot;</label><button class="text-emerald-600 font-bold text-[10px] uppercase tracking-widest" data-v-a0503ef4${_scopeId}>+ Add Step</button></div><!--[-->`);
                ssrRenderList(module.data.items, (s, sIdx) => {
                  _push2(`<div class="relative group" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl flex gap-8" data-v-a0503ef4${_scopeId}><div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-100" data-v-a0503ef4${_scopeId}>${ssrInterpolate(sIdx + 1)}</div><div class="flex-grow space-y-6" data-v-a0503ef4${_scopeId}><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Step Headline</label><input${ssrRenderAttr("value", s.name)} placeholder="First Step..." class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Step Details</label><textarea rows="2" placeholder="Details for this step..." class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(s.description)}</textarea></div></div><button class="w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else if (getTypeKey(module.schema_type_id) === "localbusiness") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}>`);
                if (module.data.items.length === 0) {
                  _push2(`<div class="flex flex-col items-center py-10 bg-white rounded-[2.5rem] border border-slate-100" data-v-a0503ef4${_scopeId}><button class="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all" data-v-a0503ef4${_scopeId}>Initialize Business Details</button></div>`);
                } else {
                  _push2(`<div class="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-10" data-v-a0503ef4${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-8" data-v-a0503ef4${_scopeId}><div class="space-y-3 md:col-span-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Street Address</label><input${ssrRenderAttr("value", module.data.items[0].address)} placeholder="123 Innovation Drive" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" data-v-a0503ef4${_scopeId}></div><div class="space-y-3" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>City</label><input${ssrRenderAttr("value", module.data.items[0].city)} placeholder="Nairobi" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" data-v-a0503ef4${_scopeId}></div><div class="space-y-3" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Region/State</label><input${ssrRenderAttr("value", module.data.items[0].region)} placeholder="Nairobi County" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" data-v-a0503ef4${_scopeId}></div><div class="space-y-3" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Telephone</label><input${ssrRenderAttr("value", module.data.items[0].phone)} type="tel" placeholder="+254..." class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" data-v-a0503ef4${_scopeId}></div><div class="space-y-3" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" data-v-a0503ef4${_scopeId}>Price Range</label><select class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-black focus:bg-white transition-all appearance-none uppercase tracking-widest" data-v-a0503ef4${_scopeId}><option value="$" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.data.items[0].price_range) ? ssrLooseContain(module.data.items[0].price_range, "$") : ssrLooseEqual(module.data.items[0].price_range, "$")) ? " selected" : ""}${_scopeId}>$ (Economy)</option><option value="$$" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.data.items[0].price_range) ? ssrLooseContain(module.data.items[0].price_range, "$$") : ssrLooseEqual(module.data.items[0].price_range, "$$")) ? " selected" : ""}${_scopeId}>$$ (Standard)</option><option value="$$$" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.data.items[0].price_range) ? ssrLooseContain(module.data.items[0].price_range, "$$$") : ssrLooseEqual(module.data.items[0].price_range, "$$$")) ? " selected" : ""}${_scopeId}>$$$ (Premium)</option><option value="$$$$" data-v-a0503ef4${ssrIncludeBooleanAttr(Array.isArray(module.data.items[0].price_range) ? ssrLooseContain(module.data.items[0].price_range, "$$$$") : ssrLooseEqual(module.data.items[0].price_range, "$$$$")) ? " selected" : ""}${_scopeId}>$$$$ (Luxury)</option></select></div></div></div>`);
                }
                _push2(`</div>`);
              } else if (getTypeKey(module.schema_type_id) === "article") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Article Headline</label><input${ssrRenderAttr("value", module.data.items[0].name)} placeholder="How to Professionalize your Brand..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Author Name</label><input${ssrRenderAttr("value", module.data.items[0].author)} placeholder="John Doe" class="block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Publish Date</label><input${ssrRenderAttr("value", module.data.items[0].datePublished)} type="date" class="block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold" data-v-a0503ef4${_scopeId}></div></div><div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Full Content Body</label><textarea rows="5" placeholder="The main content of the article..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(module.data.items[0].description)}</textarea></div></div></div>`);
              } else if (getTypeKey(module.schema_type_id) === "breadcrumb") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="flex justify-between items-center" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Assistant: &quot;Add your site navigation hierarchy below.&quot;</label><button class="text-blue-600 font-bold text-[10px] uppercase tracking-widest" data-v-a0503ef4${_scopeId}>+ Add Breadcrumb</button></div><!--[-->`);
                ssrRenderList(module.data.items, (b, bIdx) => {
                  _push2(`<div class="relative group" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl flex gap-8" data-v-a0503ef4${_scopeId}><div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0 border border-indigo-100" data-v-a0503ef4${_scopeId}>${ssrInterpolate(bIdx + 1)}</div><div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6" data-v-a0503ef4${_scopeId}><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Crumbs Title</label><input${ssrRenderAttr("value", b.name)} placeholder="Home..." class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-2" data-v-a0503ef4${_scopeId}><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" data-v-a0503ef4${_scopeId}>Destination URL</label><input${ssrRenderAttr("value", b.url)} placeholder="/" class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-medium" data-v-a0503ef4${_scopeId}></div></div><button class="w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" data-v-a0503ef4${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a0503ef4${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-a0503ef4${_scopeId}></path></svg></button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else if (getTypeKey(module.schema_type_id) === "event") {
                _push2(`<div class="space-y-8" data-v-a0503ef4${_scopeId}><div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Event Name</label><input${ssrRenderAttr("value", module.data.items[0].name)} placeholder="Global SEO Summit 2026..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" data-v-a0503ef4${_scopeId}></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8" data-v-a0503ef4${_scopeId}><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Start Date &amp; Time</label><input${ssrRenderAttr("value", module.data.items[0].startDate)} type="datetime-local" class="block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold" data-v-a0503ef4${_scopeId}></div><div class="space-y-4" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Location / Venue</label><input${ssrRenderAttr("value", module.data.items[0].location)} placeholder="Convention Center or Online" class="block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold" data-v-a0503ef4${_scopeId}></div></div><div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Location Address</label><input${ssrRenderAttr("value", module.data.items[0].address)} placeholder="123 Summit Way, NY" class="block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}></div><div class="space-y-4 pt-6 border-t border-slate-50" data-v-a0503ef4${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" data-v-a0503ef4${_scopeId}>Event Description</label><textarea rows="3" placeholder="Brief overview of the event..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" data-v-a0503ef4${_scopeId}>${ssrInterpolate(module.data.items[0].description)}</textarea></div></div></div>`);
              } else {
                _push2(`<div class="text-center py-10 bg-white rounded-[2rem] border border-slate-100" data-v-a0503ef4${_scopeId}><p class="text-slate-400 font-bold text-xs italic tracking-tight uppercase tracking-widest leading-loose" data-v-a0503ef4${_scopeId}> Guided logic for ${ssrInterpolate(getTypeName(module.schema_type_id))} is evolving.<br data-v-a0503ef4${_scopeId}><span class="text-[10px]" data-v-a0503ef4${_scopeId}>Generic fields are available in the post-build editor.</span></p></div>`);
              }
              _push2(`</div></div>`);
            });
            _push2(`<!--]-->`);
            if (!unref(form).include_brand_identity && unref(form).modules.length === 0) {
              _push2(`<div class="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200" data-v-a0503ef4${_scopeId}><p class="text-slate-400 font-black text-xl italic mb-4" data-v-a0503ef4${_scopeId}>Empty Schema Architecture</p><p class="text-slate-500 font-medium" data-v-a0503ef4${_scopeId}>Please enable Brand Identity or add at least one module in Step 2.</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center" data-v-a0503ef4${_scopeId}>`);
            if (currentStep.value > 0) {
              _push2(`<button type="button" class="px-10 py-5 rounded-3xl text-sm font-black text-slate-600 hover:bg-slate-200 transition-standard uppercase tracking-widest" data-v-a0503ef4${_scopeId}>Previous</button>`);
            } else {
              _push2(`<div data-v-a0503ef4${_scopeId}></div>`);
            }
            _push2(`<div class="flex gap-4" data-v-a0503ef4${_scopeId}>`);
            if (currentStep.value < 2) {
              _push2(`<button type="button" class="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 uppercase tracking-widest text-sm" data-v-a0503ef4${_scopeId}>Continue</button>`);
            } else {
              _push2(`<button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="bg-blue-600 text-white px-16 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm" data-v-a0503ef4${_scopeId}>${ssrInterpolate(unref(form).processing ? "Syncing..." : "Build Modular Schema")}</button>`);
            }
            _push2(`</div></div></form></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-5xl mx-auto space-y-12 pb-24" }, [
                createVNode("div", { class: "relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-20 shadow-2xl" }, [
                  createVNode("div", { class: "absolute top-0 right-0 -m-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" }),
                  createVNode("div", { class: "absolute bottom-0 left-0 -m-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" }),
                  createVNode("div", { class: "relative z-10 flex flex-col md:flex-row justify-between items-center gap-10" }, [
                    createVNode("div", { class: "text-center md:text-left" }, [
                      createVNode("div", { class: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-500/30" }, [
                        createVNode("span", { class: "relative flex h-2 w-2" }, [
                          createVNode("span", { class: "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" }),
                          createVNode("span", { class: "relative inline-flex rounded-full h-2 w-2 bg-blue-500" })
                        ]),
                        createTextVNode(" Universal Intelligence ")
                      ]),
                      createVNode("h1", { class: "text-5xl md:text-6xl font-black text-white tracking-tight mb-6" }, [
                        createTextVNode(" Modular "),
                        createVNode("span", { class: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400" }, "Flex-Builder")
                      ]),
                      createVNode("p", { class: "text-slate-400 font-medium text-lg max-w-xl leading-relaxed" }, " Create highly adaptive structured data for any website. Toggle brand identity, add custom categories, and tailor every page context. ")
                    ]),
                    createVNode(unref(Link), {
                      href: "/schemas",
                      class: "group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-3xl font-bold transition-standard border border-white/10 backdrop-blur-xl"
                    }, {
                      default: withCtx(() => [
                        (openBlock(), createBlock("svg", {
                          class: "w-6 h-6 text-slate-500 group-hover:text-white transition-colors",
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
                        ])),
                        createTextVNode(" Cancel ")
                      ]),
                      _: 1
                    })
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-3 gap-12 items-start" }, [
                  createVNode("div", { class: "lg:sticky lg:top-24 space-y-4" }, [
                    (openBlock(), createBlock(Fragment, null, renderList(steps, (step, idx) => {
                      return createVNode("div", {
                        key: idx,
                        class: ["group relative flex items-center gap-6 p-6 rounded-[2rem] transition-standard border shadow-sm", [
                          currentStep.value === idx ? "bg-white border-blue-200 shadow-blue-100 ring-1 ring-blue-50" : "bg-slate-50 border-transparent opacity-60 grayscale"
                        ]]
                      }, [
                        createVNode("div", {
                          class: ["w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-standard", [
                            currentStep.value === idx ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : hasStepErrors(idx) ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500"
                          ]]
                        }, toDisplayString(idx + 1), 3),
                        createVNode("div", null, [
                          createVNode("h4", { class: "font-bold text-slate-900 leading-tight uppercase tracking-widest text-[10px]" }, toDisplayString(step.label), 1),
                          createVNode("p", { class: "text-slate-500 text-xs font-medium" }, toDisplayString(step.title), 1)
                        ])
                      ], 2);
                    }), 64))
                  ]),
                  createVNode("div", { class: "lg:col-span-2" }, [
                    createVNode("form", {
                      onSubmit: withModifiers(submit, ["prevent"]),
                      class: "bg-white rounded-[3.5rem] shadow-premium border border-slate-100 overflow-hidden"
                    }, [
                      withDirectives(createVNode("div", { class: "p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" }, [
                        createVNode("div", { class: "grid grid-cols-1 gap-10" }, [
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("label", { class: "block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" }, "Internal Recognition Name"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(form).name = $event,
                              type: "text",
                              placeholder: "e.g., Dynamic Subpage Markup",
                              class: ["block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-bold text-lg placeholder:text-slate-300", { "ring-2 ring-red-500 border-red-500": errors.value.name }]
                            }, null, 10, ["onUpdate:modelValue"]), [
                              [vModelText, unref(form).name]
                            ]),
                            errors.value.name ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2"
                            }, toDisplayString(errors.value.name), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("label", { class: "block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" }, "Contextual Meta Description"),
                            withDirectives(createVNode("textarea", {
                              "onUpdate:modelValue": ($event) => unref(form).meta_description = $event,
                              rows: "4",
                              placeholder: "Description for this specific page...",
                              class: ["block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium", { "ring-2 ring-red-500 border-red-500": errors.value.meta_description }]
                            }, null, 10, ["onUpdate:modelValue"]), [
                              [vModelText, unref(form).meta_description]
                            ]),
                            errors.value.meta_description ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2"
                            }, toDisplayString(errors.value.meta_description), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("label", { class: "block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2" }, "Canonical Link Destination"),
                            createVNode("div", { class: "flex gap-4" }, [
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => unref(form).page_link = $event,
                                type: "url",
                                class: ["block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium", { "ring-2 ring-red-500 border-red-500": errors.value.page_link }]
                              }, null, 10, ["onUpdate:modelValue"]), [
                                [vModelText, unref(form).page_link]
                              ]),
                              createVNode("button", {
                                type: "button",
                                onClick: analyzeUrl,
                                disabled: isAnalyzing.value,
                                class: "shrink-0 bg-slate-900 text-white px-8 py-5 rounded-3xl font-black transition-standard hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                              }, [
                                isAnalyzing.value ? (openBlock(), createBlock("svg", {
                                  key: 0,
                                  class: "w-4 h-4 animate-spin",
                                  fill: "none",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("circle", {
                                    class: "opacity-25",
                                    cx: "12",
                                    cy: "12",
                                    r: "10",
                                    stroke: "currentColor",
                                    "stroke-width": "4"
                                  }),
                                  createVNode("path", {
                                    class: "opacity-75",
                                    fill: "currentColor",
                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  })
                                ])) : createCommentVNode("", true),
                                createTextVNode(" " + toDisplayString(isAnalyzing.value ? "Scanning..." : "Scan URL"), 1)
                              ], 8, ["disabled"])
                            ]),
                            errors.value.page_link ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2"
                            }, toDisplayString(errors.value.page_link), 1)) : createCommentVNode("", true),
                            createVNode("div", { class: "mt-8 space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50" }, [
                              createVNode("h5", { class: "text-xs font-black text-slate-800 uppercase tracking-widest ml-2" }, "Architecture Strategy"),
                              createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => unref(form).use_existing_container = false,
                                  class: [!unref(form).use_existing_container ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-600 border border-slate-200", "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center"]
                                }, " New Root Schema ", 10, ["onClick"]),
                                createVNode("button", {
                                  type: "button",
                                  onClick: ($event) => unref(form).use_existing_container = true,
                                  class: [unref(form).use_existing_container ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-600 border border-slate-200", "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center"]
                                }, " Build on Existing Root ", 10, ["onClick"])
                              ]),
                              createVNode(Transition, {
                                "enter-active-class": "transition duration-500 ease-out",
                                "enter-from-class": "opacity-0 -translate-y-4",
                                "enter-to-class": "opacity-100 translate-y-0"
                              }, {
                                default: withCtx(() => [
                                  unref(form).use_existing_container ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "space-y-4 pt-4 border-t border-slate-200/50"
                                  }, [
                                    createVNode("div", { class: "space-y-2" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Select Root Container"),
                                      withDirectives(createVNode("select", {
                                        "onUpdate:modelValue": ($event) => unref(form).selected_container_id = $event,
                                        class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold appearance-none"
                                      }, [
                                        createVNode("option", { value: "" }, "Select a brand root..."),
                                        (openBlock(true), createBlock(Fragment, null, renderList(__props.containers, (c) => {
                                          return openBlock(), createBlock("option", {
                                            key: c.id,
                                            value: c.id
                                          }, toDisplayString(c.name) + " (" + toDisplayString(c.identifier) + ")", 9, ["value"]);
                                        }), 128))
                                      ], 8, ["onUpdate:modelValue"]), [
                                        [vModelSelect, unref(form).selected_container_id]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-2" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Sub-path Variation"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => unref(form).sub_path = $event,
                                        type: "text",
                                        placeholder: "e.g., /en or /mobile",
                                        class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-sm font-bold"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, unref(form).sub_path]
                                      ]),
                                      createVNode("p", { class: "text-[9px] text-slate-400 font-medium ml-2 italic text-left" }, "The schema @id will be: root_id + sub_path")
                                    ])
                                  ])) : createCommentVNode("", true)
                                ]),
                                _: 1
                              })
                            ]),
                            createVNode(Transition, {
                              "enter-active-class": "transition duration-700 ease-out",
                              "enter-from-class": "opacity-0 translate-y-4",
                              "enter-to-class": "opacity-100 translate-y-0"
                            }, {
                              default: withCtx(() => [
                                scanScore.value !== null ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "mt-8 flex items-center justify-between bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50"
                                }, [
                                  createVNode("div", { class: "flex items-center gap-4" }, [
                                    createVNode("div", { class: "w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center relative" }, [
                                      (openBlock(), createBlock("svg", { class: "w-full h-full -rotate-90 absolute" }, [
                                        createVNode("circle", {
                                          cx: "24",
                                          cy: "24",
                                          r: "20",
                                          fill: "transparent",
                                          stroke: "currentColor",
                                          "stroke-width": "4",
                                          class: "text-blue-200",
                                          style: { "cx": "50%", "cy": "50%", "r": "40%" }
                                        }),
                                        createVNode("circle", {
                                          cx: "24",
                                          cy: "24",
                                          r: "20",
                                          fill: "transparent",
                                          stroke: "currentColor",
                                          "stroke-width": "4",
                                          class: "text-blue-500",
                                          style: { strokeDasharray: "100", strokeDashoffset: 100 - scanScore.value, cx: "50%", cy: "50%", r: "40%" }
                                        }, null, 4)
                                      ])),
                                      createVNode("span", { class: "text-[10px] font-black text-blue-700" }, toDisplayString(scanScore.value) + "%", 1)
                                    ]),
                                    createVNode("div", null, [
                                      createVNode("h5", { class: "text-xs font-black text-blue-900 uppercase tracking-widest" }, "SEO Quality Score"),
                                      createVNode("p", { class: "text-[10px] text-blue-600 font-medium" }, "Auto-derived from URL metadata analysis.")
                                    ])
                                  ]),
                                  createVNode("div", {
                                    class: ["text-xs font-bold", scanScore.value > 70 ? "text-emerald-600" : "text-amber-600"]
                                  }, toDisplayString(scanScore.value > 70 ? "Excellent Match" : "Manual Refinement Recommended"), 3)
                                ])) : createCommentVNode("", true)
                              ]),
                              _: 1
                            })
                          ])
                        ])
                      ], 512), [
                        [vShow, currentStep.value === 0]
                      ]),
                      withDirectives(createVNode("div", { class: "p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" }, [
                        createVNode("div", { class: "flex items-start gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group mb-12" }, [
                          createVNode("div", { class: "w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-8 h-8 text-blue-600",
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
                            ]))
                          ]),
                          createVNode("div", { class: "space-y-1 relative z-10" }, [
                            createVNode("h3", { class: "text-xl font-black text-slate-900 tracking-tight" }, "Strategy Phase"),
                            createVNode("p", { class: "text-slate-500 text-sm font-medium leading-relaxed" }, ' "What should we focus on for this page? Toggle your brand identity or add specific category blocks below." ')
                          ])
                        ]),
                        createVNode("div", { class: "space-y-6" }, [
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("div", {
                              onClick: ($event) => unref(form).include_brand_identity = !unref(form).include_brand_identity,
                              class: [unref(form).include_brand_identity ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-slate-200", "group p-8 rounded-[2.5rem] border-2 cursor-pointer transition-standard flex justify-between items-center"]
                            }, [
                              createVNode("div", { class: "flex items-center gap-6" }, [
                                createVNode("div", {
                                  class: [unref(form).include_brand_identity ? "bg-blue-500" : "bg-slate-100 text-slate-400", "w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-standard"]
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-7 h-7",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    })
                                  ]))
                                ], 2),
                                createVNode("div", null, [
                                  createVNode("h4", {
                                    class: [unref(form).include_brand_identity ? "text-white" : "text-slate-900", "text-xl font-black"]
                                  }, "Brand Identity", 2),
                                  createVNode("p", {
                                    class: [unref(form).include_brand_identity ? "text-slate-400" : "text-slate-500", "text-xs font-medium"]
                                  }, "Injects Organization & WebSite JSON-LD.", 2)
                                ])
                              ]),
                              createVNode("div", {
                                class: [unref(form).include_brand_identity ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"]
                              }, toDisplayString(unref(form).include_brand_identity ? "Active" : "Disabled"), 3)
                            ], 10, ["onClick"]),
                            createVNode(Transition, {
                              "enter-active-class": "transition duration-500 ease-out",
                              "enter-from-class": "opacity-0 -translate-y-8",
                              "enter-to-class": "opacity-100 translate-y-0"
                            }, {
                              default: withCtx(() => [
                                unref(form).include_brand_identity ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "space-y-6"
                                }, [
                                  createVNode("div", { class: "bg-indigo-50/40 p-10 rounded-[2.5rem] border border-indigo-100 space-y-10 ml-4 relative overflow-hidden" }, [
                                    createVNode("div", { class: "absolute top-0 right-0 p-4 opacity-5" }, [
                                      (openBlock(), createBlock("svg", {
                                        class: "w-32 h-32 text-indigo-900",
                                        fill: "currentColor",
                                        viewBox: "0 0 24 24"
                                      }, [
                                        createVNode("path", { d: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" })
                                      ]))
                                    ]),
                                    createVNode("div", { class: "flex items-center gap-4" }, [
                                      createVNode("div", { class: "w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" }),
                                      createVNode("span", { class: "text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60" }, "Guided Building")
                                    ]),
                                    createVNode("h5", { class: "text-lg font-black text-slate-800 tracking-tight leading-tight" }, "Define your brand identity details."),
                                    createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                                      createVNode("div", { class: "space-y-2" }, [
                                        createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Brand Name"),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => unref(form).brand_name = $event,
                                          type: "text",
                                          placeholder: "e.g., Acme Corp",
                                          class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, unref(form).brand_name]
                                        ])
                                      ]),
                                      createVNode("div", { class: "space-y-2" }, [
                                        createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Brand Logo URL"),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => unref(form).brand_logo = $event,
                                          type: "url",
                                          placeholder: "https://...",
                                          class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, unref(form).brand_logo]
                                        ])
                                      ]),
                                      createVNode("div", { class: "space-y-2 md:col-span-2" }, [
                                        createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Alternate Name / Trademarks"),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => unref(form).brand_alternate_name = $event,
                                          type: "text",
                                          placeholder: "e.g., Acme, Acme Co",
                                          class: "w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, unref(form).brand_alternate_name]
                                        ])
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4 pt-6 border-t border-indigo-100/50" }, [
                                      createVNode("h5", { class: "text-lg font-black text-slate-800 tracking-tight leading-tight" }, "Do you want to list your brand's flagship products?"),
                                      createVNode("div", { class: "flex gap-3" }, [
                                        createVNode("button", {
                                          type: "button",
                                          onClick: toggleBrandProducts,
                                          class: [unref(form).brand_show_products ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"]
                                        }, toDisplayString(unref(form).brand_show_products ? "Yes, Include Products" : "No Products"), 3),
                                        createVNode(Transition, {
                                          "enter-active-class": "transition duration-300",
                                          "enter-from-class": "opacity-0 scale-95"
                                        }, {
                                          default: withCtx(() => [
                                            unref(form).brand_show_products ? (openBlock(), createBlock("label", {
                                              key: 0,
                                              class: "flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                                            }, [
                                              withDirectives(createVNode("input", {
                                                "onUpdate:modelValue": ($event) => unref(form).brand_link_products = $event,
                                                type: "checkbox",
                                                class: "w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                              }, null, 8, ["onUpdate:modelValue"]), [
                                                [vModelCheckbox, unref(form).brand_link_products]
                                              ]),
                                              createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none" }, "Link to pages?")
                                            ])) : createCommentVNode("", true)
                                          ]),
                                          _: 1
                                        })
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4 pt-6 border-t border-indigo-100/50" }, [
                                      createVNode("h5", { class: "text-lg font-black text-slate-800 tracking-tight leading-tight" }, "Should we also detail the services you provide?"),
                                      createVNode("div", { class: "flex gap-3" }, [
                                        createVNode("button", {
                                          type: "button",
                                          onClick: toggleBrandServices,
                                          class: [unref(form).brand_show_services ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200", "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"]
                                        }, toDisplayString(unref(form).brand_show_services ? "Yes, Add Services" : "No Services"), 3),
                                        createVNode(Transition, {
                                          "enter-active-class": "transition duration-300",
                                          "enter-from-class": "opacity-0 scale-95"
                                        }, {
                                          default: withCtx(() => [
                                            unref(form).brand_show_services ? (openBlock(), createBlock("label", {
                                              key: 0,
                                              class: "flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                            }, [
                                              withDirectives(createVNode("input", {
                                                "onUpdate:modelValue": ($event) => unref(form).brand_link_services = $event,
                                                type: "checkbox",
                                                class: "w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              }, null, 8, ["onUpdate:modelValue"]), [
                                                [vModelCheckbox, unref(form).brand_link_services]
                                              ]),
                                              createVNode("span", { class: "text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none" }, "Include Landing Links?")
                                            ])) : createCommentVNode("", true)
                                          ]),
                                          _: 1
                                        })
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4 pt-6 border-t border-indigo-100/50" }, [
                                      createVNode("label", { class: "flex items-center gap-4 cursor-pointer group" }, [
                                        createVNode("div", { class: "relative" }, [
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => unref(form).brand_show_offers = $event,
                                            type: "checkbox",
                                            class: "sr-only peer"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelCheckbox, unref(form).brand_show_offers]
                                          ]),
                                          createVNode("div", { class: "w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 transition-colors shadow-inner" }),
                                          createVNode("div", { class: "absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm" })
                                        ]),
                                        createVNode("div", null, [
                                          createVNode("span", { class: "text-xs font-black text-slate-700 uppercase tracking-widest block" }, "Standard Market Offers"),
                                          createVNode("span", { class: "text-[10px] text-slate-400 font-medium" }, "Include general promotions & value propositions.")
                                        ])
                                      ])
                                    ])
                                  ])
                                ])) : createCommentVNode("", true)
                              ]),
                              _: 1
                            })
                          ]),
                          createVNode("div", { class: "space-y-4" }, [
                            createVNode("div", { class: "flex justify-between items-center px-4" }, [
                              createVNode("label", { class: "text-xs font-black text-slate-400 uppercase tracking-widest" }, "Additional Schema Modules"),
                              createVNode("button", {
                                onClick: withModifiers(addModule, ["prevent"]),
                                class: "text-blue-600 font-bold text-xs uppercase tracking-widest hover:blue-700"
                              }, "+ Add Module")
                            ]),
                            createVNode(TransitionGroup, {
                              "enter-active-class": "transition duration-300 ease-out",
                              "enter-from-class": "opacity-0 translate-y-4",
                              "enter-to-class": "opacity-100 translate-y-0",
                              "leave-active-class": "transition duration-200 ease-in",
                              "leave-from-class": "opacity-100 translate-y-0",
                              "leave-to-class": "opacity-0 translate-y-4"
                            }, {
                              default: withCtx(() => [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(form).modules, (module, idx) => {
                                  return openBlock(), createBlock("div", {
                                    key: idx,
                                    class: "bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6"
                                  }, [
                                    createVNode("div", { class: "flex-grow" }, [
                                      withDirectives(createVNode("select", {
                                        "onUpdate:modelValue": ($event) => module.schema_type_id = $event,
                                        class: "w-full bg-white border-slate-200 rounded-2xl px-5 py-3 font-bold text-sm h-14 appearance-none"
                                      }, [
                                        createVNode("option", { value: "" }, "Select Schema Category..."),
                                        (openBlock(true), createBlock(Fragment, null, renderList(__props.schemaTypes, (type) => {
                                          return openBlock(), createBlock("option", {
                                            key: type.id,
                                            value: type.id
                                          }, toDisplayString(type.name), 9, ["value"]);
                                        }), 128))
                                      ], 8, ["onUpdate:modelValue"]), [
                                        [vModelSelect, module.schema_type_id]
                                      ])
                                    ]),
                                    createVNode("button", {
                                      onClick: withModifiers(($event) => removeModule(idx), ["prevent"]),
                                      class: "w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shadow-sm"
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
                                          d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        })
                                      ]))
                                    ], 8, ["onClick"])
                                  ]);
                                }), 128))
                              ]),
                              _: 1
                            }),
                            unref(form).modules.length === 0 ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "text-center py-10 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200"
                            }, [
                              createVNode("p", { class: "text-slate-400 text-xs font-bold italic" }, "No custom modules added.")
                            ])) : createCommentVNode("", true)
                          ])
                        ])
                      ], 512), [
                        [vShow, currentStep.value === 1]
                      ]),
                      withDirectives(createVNode("div", { class: "p-10 md:p-16 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500" }, [
                        unref(form).include_brand_identity ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-16"
                        }, [
                          createVNode("div", { class: "flex items-start gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group" }, [
                            createVNode("div", { class: "absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-24 h-24 text-blue-400",
                                fill: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" })
                              ]))
                            ]),
                            createVNode("div", { class: "w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-8 h-8 text-white",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                })
                              ]))
                            ]),
                            createVNode("div", { class: "space-y-2 relative z-10" }, [
                              createVNode("h3", { class: "text-xl font-black text-white tracking-tight" }, "Personal Schema Assistant"),
                              createVNode("p", { class: "text-slate-400 text-sm font-medium leading-relaxed" }, ` "Great! Let's fill out your catalog. I'll guide you through each entry one field at a time to ensure your schema is optimized." `)
                            ])
                          ]),
                          unref(form).brand_show_products ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "space-y-10"
                          }, [
                            createVNode("div", { class: "flex justify-between items-center px-4" }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-black text-xs shadow-sm" }, "P"),
                                createVNode("h4", { class: "text-sm font-black text-slate-800 uppercase tracking-widest" }, "Brand Product Catalog")
                              ]),
                              createVNode("button", {
                                onClick: withModifiers(addBrandProduct, ["prevent"]),
                                class: "group flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:blue-700 transition-all"
                              }, [
                                createVNode("span", { class: "w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all" }, "+"),
                                createTextVNode(" Add New Product ")
                              ])
                            ]),
                            createVNode("div", { class: "space-y-8" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(form).brand_products, (p, pIdx) => {
                                return openBlock(), createBlock("div", {
                                  key: pIdx,
                                  class: "relative"
                                }, [
                                  createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-blue-100 space-y-8" }, [
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "What type of item is this?"'),
                                      createVNode("div", { class: "flex flex-wrap gap-2" }, [
                                        (openBlock(), createBlock(Fragment, null, renderList(["Product", "Service", "FinancialProduct", "Offer"], (type) => {
                                          return createVNode("button", {
                                            key: type,
                                            type: "button",
                                            onClick: ($event) => p["@type"] = type,
                                            class: [p["@type"] === type ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"]
                                          }, toDisplayString(type), 11, ["onClick"]);
                                        }), 64))
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, `Assistant: "What's the name of this ` + toDisplayString(p["@type"].toLowerCase()) + '?"', 1),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => p.name = $event,
                                        placeholder: "e.g., Enterprise Plan",
                                        class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, p.name]
                                      ])
                                    ]),
                                    createVNode(Transition, {
                                      "enter-active-class": "transition duration-500 delay-100",
                                      "enter-from-class": "opacity-0 -translate-y-4"
                                    }, {
                                      default: withCtx(() => [
                                        p.name.length > 2 ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          class: "space-y-4 pt-6 border-t border-slate-50"
                                        }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "Excellent. Can you provide a brief description for SEO context?"'),
                                          withDirectives(createVNode("textarea", {
                                            "onUpdate:modelValue": ($event) => p.description = $event,
                                            rows: "2",
                                            placeholder: "Tell Google what this item is about...",
                                            class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, p.description]
                                          ])
                                        ])) : createCommentVNode("", true)
                                      ]),
                                      _: 2
                                    }, 1024),
                                    createVNode(Transition, {
                                      "enter-active-class": "transition duration-500 delay-100",
                                      "enter-from-class": "opacity-0 -translate-y-4"
                                    }, {
                                      default: withCtx(() => [
                                        unref(form).brand_link_products && p.description.length > 5 ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          class: "space-y-4 pt-6 border-t border-slate-50"
                                        }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "And the landing page URL for this specific item?"'),
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => p.url = $event,
                                            type: "url",
                                            placeholder: "https://...",
                                            class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, p.url]
                                          ])
                                        ])) : createCommentVNode("", true)
                                      ]),
                                      _: 2
                                    }, 1024),
                                    createVNode("button", {
                                      onClick: withModifiers(($event) => removeBrandProduct(pIdx), ["prevent"]),
                                      class: "absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                          d: "M6 18L18 6M6 6l12 12"
                                        })
                                      ]))
                                    ], 8, ["onClick"])
                                  ])
                                ]);
                              }), 128))
                            ])
                          ])) : createCommentVNode("", true),
                          unref(form).brand_show_services ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "space-y-10"
                          }, [
                            createVNode("div", { class: "flex justify-between items-center px-4" }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-black text-xs shadow-sm" }, "S"),
                                createVNode("h4", { class: "text-sm font-black text-slate-800 uppercase tracking-widest" }, "Brand Services")
                              ]),
                              createVNode("button", {
                                onClick: withModifiers(addBrandService, ["prevent"]),
                                class: "group flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:indigo-700 transition-all"
                              }, [
                                createVNode("span", { class: "w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all" }, "+"),
                                createTextVNode(" Add New Service ")
                              ])
                            ]),
                            createVNode("div", { class: "space-y-8" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(form).brand_services, (s, sIdx) => {
                                return openBlock(), createBlock("div", {
                                  key: sIdx,
                                  class: "relative"
                                }, [
                                  createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-indigo-100 space-y-8" }, [
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "What type of service or offer is this?"'),
                                      createVNode("div", { class: "flex flex-wrap gap-2" }, [
                                        (openBlock(), createBlock(Fragment, null, renderList(["Service", "FinancialProduct", "Product", "Offer"], (type) => {
                                          return createVNode("button", {
                                            key: type,
                                            type: "button",
                                            onClick: ($event) => s["@type"] = type,
                                            class: [s["@type"] === type ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-600 border border-slate-200", "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"]
                                          }, toDisplayString(type), 11, ["onClick"]);
                                        }), 64))
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, `Assistant: "What's the name of this ` + toDisplayString(s["@type"].toLowerCase()) + '?"', 1),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => s.name = $event,
                                        placeholder: "e.g., 24/7 Support Desk",
                                        class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, s.name]
                                      ])
                                    ]),
                                    createVNode(Transition, {
                                      "enter-active-class": "transition duration-500 delay-100",
                                      "enter-from-class": "opacity-0 -translate-y-4"
                                    }, {
                                      default: withCtx(() => [
                                        s.name.length > 2 ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          class: "space-y-4 pt-6 border-t border-slate-50"
                                        }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "Got it. How would you describe the value of this item?"'),
                                          withDirectives(createVNode("textarea", {
                                            "onUpdate:modelValue": ($event) => s.description = $event,
                                            rows: "2",
                                            placeholder: "Briefly explain the item...",
                                            class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, s.description]
                                          ])
                                        ])) : createCommentVNode("", true)
                                      ]),
                                      _: 2
                                    }, 1024),
                                    createVNode(Transition, {
                                      "enter-active-class": "transition duration-500 delay-100",
                                      "enter-from-class": "opacity-0 -translate-y-4"
                                    }, {
                                      default: withCtx(() => [
                                        unref(form).brand_link_services && s.description.length > 5 ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          class: "space-y-4 pt-6 border-t border-slate-50"
                                        }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "And finally, which page should users visit for this?"'),
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => s.url = $event,
                                            type: "url",
                                            placeholder: "https://...",
                                            class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, s.url]
                                          ])
                                        ])) : createCommentVNode("", true)
                                      ]),
                                      _: 2
                                    }, 1024),
                                    createVNode("button", {
                                      onClick: withModifiers(($event) => _ctx.removeBrandService(sIdx), ["prevent"]),
                                      class: "absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                          d: "M6 18L18 6M6 6l12 12"
                                        })
                                      ]))
                                    ], 8, ["onClick"])
                                  ])
                                ]);
                              }), 128))
                            ])
                          ])) : createCommentVNode("", true),
                          createVNode("div", { class: "bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden group" }, [
                            createVNode("div", { class: "absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" }),
                            createVNode("div", { class: "flex items-center gap-6 relative z-10" }, [
                              createVNode("div", { class: "w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-6 h-6 text-blue-500",
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
                                ]))
                              ]),
                              createVNode("div", null, [
                                createVNode("h5", { class: "text-sm font-black text-slate-900 mb-1 tracking-tight" }, "System Note"),
                                createVNode("p", { class: "text-slate-500 font-medium text-xs leading-relaxed" }, " Brand identity creates standard Organization/WebSite entries. " + toDisplayString(unref(form).brand_show_offers ? "I will also append a Master Deposit Offer to your profile." : ""), 1)
                              ])
                            ])
                          ])
                        ])) : createCommentVNode("", true),
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(form).modules, (module, mIdx) => {
                          return openBlock(), createBlock("div", {
                            key: mIdx,
                            class: "space-y-10"
                          }, [
                            createVNode("div", { class: "flex justify-between items-center px-4" }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 font-black text-xs shadow-sm" }, toDisplayString(mIdx + 1), 1),
                                createVNode("h4", { class: "text-sm font-black text-slate-800 uppercase tracking-widest" }, toDisplayString(getTypeName(module.schema_type_id)) + " Module", 1)
                              ])
                            ]),
                            createVNode("div", { class: "space-y-8 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 relative" }, [
                              getTypeKey(module.schema_type_id) === "product" ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center" }, [
                                  createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, 'Assistant: "Add items for this ' + toDisplayString(getTypeName(module.schema_type_id)) + ' category below."', 1),
                                  createVNode("button", {
                                    onClick: withModifiers(($event) => addProduct(mIdx), ["prevent"]),
                                    class: "text-blue-600 font-bold text-[10px] uppercase tracking-widest"
                                  }, "+ Add Item", 8, ["onClick"])
                                ]),
                                (openBlock(true), createBlock(Fragment, null, renderList(module.data.items, (p, pIdx) => {
                                  return openBlock(), createBlock("div", {
                                    key: pIdx,
                                    class: "relative group"
                                  }, [
                                    createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8" }, [
                                      createVNode("div", { class: "space-y-4" }, [
                                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "Name of the item?"'),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => p.name = $event,
                                          placeholder: "Item name...",
                                          class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, p.name]
                                        ])
                                      ]),
                                      createVNode(Transition, {
                                        "enter-active-class": "transition duration-500 delay-100",
                                        "enter-from-class": "opacity-0 -translate-y-4"
                                      }, {
                                        default: withCtx(() => [
                                          p.name.length > 2 ? (openBlock(), createBlock("div", {
                                            key: 0,
                                            class: "space-y-4 pt-6 border-t border-slate-50"
                                          }, [
                                            createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "Briefly describe it for the schema."'),
                                            withDirectives(createVNode("textarea", {
                                              "onUpdate:modelValue": ($event) => p.description = $event,
                                              rows: "2",
                                              placeholder: "Description...",
                                              class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                            }, null, 8, ["onUpdate:modelValue"]), [
                                              [vModelText, p.description]
                                            ])
                                          ])) : createCommentVNode("", true)
                                        ]),
                                        _: 2
                                      }, 1024),
                                      createVNode(Transition, {
                                        "enter-active-class": "transition duration-500 delay-100",
                                        "enter-from-class": "opacity-0 -translate-y-4"
                                      }, {
                                        default: withCtx(() => [
                                          p.description.length > 5 ? (openBlock(), createBlock("div", {
                                            key: 0,
                                            class: "space-y-4 pt-6 border-t border-slate-50"
                                          }, [
                                            createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, 'Assistant: "Specific URL for this item?"'),
                                            withDirectives(createVNode("input", {
                                              "onUpdate:modelValue": ($event) => p.url = $event,
                                              type: "url",
                                              placeholder: "https://...",
                                              class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                            }, null, 8, ["onUpdate:modelValue"]), [
                                              [vModelText, p.url]
                                            ])
                                          ])) : createCommentVNode("", true)
                                        ]),
                                        _: 2
                                      }, 1024),
                                      createVNode("button", {
                                        onClick: withModifiers(($event) => removeProduct(mIdx, pIdx), ["prevent"]),
                                        class: "absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                            d: "M6 18L18 6M6 6l12 12"
                                          })
                                        ]))
                                      ], 8, ["onClick"])
                                    ])
                                  ]);
                                }), 128))
                              ])) : getTypeKey(module.schema_type_id) === "faq" ? (openBlock(), createBlock("div", {
                                key: 1,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center" }, [
                                  createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, 'Assistant: "Add your Frequently Asked Questions below."'),
                                  createVNode("button", {
                                    onClick: withModifiers(($event) => addFAQItem(mIdx), ["prevent"]),
                                    class: "text-blue-600 font-bold text-[10px] uppercase tracking-widest"
                                  }, "+ Add Question", 8, ["onClick"])
                                ]),
                                (openBlock(true), createBlock(Fragment, null, renderList(module.data.items, (q, qIdx) => {
                                  return openBlock(), createBlock("div", {
                                    key: qIdx,
                                    class: "relative group"
                                  }, [
                                    createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8" }, [
                                      createVNode("div", { class: "space-y-4" }, [
                                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Question Text"),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => q.name = $event,
                                          placeholder: "What is your return policy?",
                                          class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, q.name]
                                        ])
                                      ]),
                                      createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-50" }, [
                                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Accepted Answer"),
                                        withDirectives(createVNode("textarea", {
                                          "onUpdate:modelValue": ($event) => q.description = $event,
                                          rows: "3",
                                          placeholder: "Provide the answer here...",
                                          class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, q.description]
                                        ])
                                      ]),
                                      createVNode("button", {
                                        onClick: withModifiers(($event) => removeFAQItem(mIdx, qIdx), ["prevent"]),
                                        class: "absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                            d: "M6 18L18 6M6 6l12 12"
                                          })
                                        ]))
                                      ], 8, ["onClick"])
                                    ])
                                  ]);
                                }), 128))
                              ])) : getTypeKey(module.schema_type_id) === "howto" ? (openBlock(), createBlock("div", {
                                key: 2,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center" }, [
                                  createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, 'Assistant: "Detail your step-by-step instructions."'),
                                  createVNode("button", {
                                    onClick: withModifiers(($event) => addHowToStep(mIdx), ["prevent"]),
                                    class: "text-emerald-600 font-bold text-[10px] uppercase tracking-widest"
                                  }, "+ Add Step", 8, ["onClick"])
                                ]),
                                (openBlock(true), createBlock(Fragment, null, renderList(module.data.items, (s, sIdx) => {
                                  return openBlock(), createBlock("div", {
                                    key: sIdx,
                                    class: "relative group"
                                  }, [
                                    createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl flex gap-8" }, [
                                      createVNode("div", { class: "w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-100" }, toDisplayString(sIdx + 1), 1),
                                      createVNode("div", { class: "flex-grow space-y-6" }, [
                                        createVNode("div", { class: "space-y-2" }, [
                                          createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Step Headline"),
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => s.name = $event,
                                            placeholder: "First Step...",
                                            class: "w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, s.name]
                                          ])
                                        ]),
                                        createVNode("div", { class: "space-y-2" }, [
                                          createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Step Details"),
                                          withDirectives(createVNode("textarea", {
                                            "onUpdate:modelValue": ($event) => s.description = $event,
                                            rows: "2",
                                            placeholder: "Details for this step...",
                                            class: "w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, s.description]
                                          ])
                                        ])
                                      ]),
                                      createVNode("button", {
                                        onClick: withModifiers(($event) => removeHowToStep(mIdx, sIdx), ["prevent"]),
                                        class: "w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                            d: "M6 18L18 6M6 6l12 12"
                                          })
                                        ]))
                                      ], 8, ["onClick"])
                                    ])
                                  ]);
                                }), 128))
                              ])) : getTypeKey(module.schema_type_id) === "localbusiness" ? (openBlock(), createBlock("div", {
                                key: 3,
                                class: "space-y-8"
                              }, [
                                module.data.items.length === 0 ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "flex flex-col items-center py-10 bg-white rounded-[2.5rem] border border-slate-100"
                                }, [
                                  createVNode("button", {
                                    onClick: withModifiers(($event) => setupLocalBusiness(mIdx), ["prevent"]),
                                    class: "bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                  }, "Initialize Business Details", 8, ["onClick"])
                                ])) : (openBlock(), createBlock("div", {
                                  key: 1,
                                  class: "bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-10"
                                }, [
                                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8" }, [
                                    createVNode("div", { class: "space-y-3 md:col-span-2" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Street Address"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].address = $event,
                                        placeholder: "123 Innovation Drive",
                                        class: "w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].address]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-3" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "City"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].city = $event,
                                        placeholder: "Nairobi",
                                        class: "w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].city]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-3" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Region/State"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].region = $event,
                                        placeholder: "Nairobi County",
                                        class: "w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].region]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-3" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Telephone"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].phone = $event,
                                        type: "tel",
                                        placeholder: "+254...",
                                        class: "w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].phone]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-3" }, [
                                      createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2" }, "Price Range"),
                                      withDirectives(createVNode("select", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].price_range = $event,
                                        class: "w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-black focus:bg-white transition-all appearance-none uppercase tracking-widest"
                                      }, [
                                        createVNode("option", { value: "$" }, "$ (Economy)"),
                                        createVNode("option", { value: "$$" }, "$$ (Standard)"),
                                        createVNode("option", { value: "$$$" }, "$$$ (Premium)"),
                                        createVNode("option", { value: "$$$$" }, "$$$$ (Luxury)")
                                      ], 8, ["onUpdate:modelValue"]), [
                                        [vModelSelect, module.data.items[0].price_range]
                                      ])
                                    ])
                                  ])
                                ]))
                              ])) : getTypeKey(module.schema_type_id) === "article" ? (openBlock(), createBlock("div", {
                                key: 4,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" }, [
                                  createVNode("div", { class: "space-y-4" }, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Article Headline"),
                                    withDirectives(createVNode("input", {
                                      "onUpdate:modelValue": ($event) => module.data.items[0].name = $event,
                                      placeholder: "How to Professionalize your Brand...",
                                      class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                    }, null, 8, ["onUpdate:modelValue"]), [
                                      [vModelText, module.data.items[0].name]
                                    ])
                                  ]),
                                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8" }, [
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Author Name"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].author = $event,
                                        placeholder: "John Doe",
                                        class: "block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].author]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Publish Date"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].datePublished = $event,
                                        type: "date",
                                        class: "block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].datePublished]
                                      ])
                                    ])
                                  ]),
                                  createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-50" }, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Full Content Body"),
                                    withDirectives(createVNode("textarea", {
                                      "onUpdate:modelValue": ($event) => module.data.items[0].description = $event,
                                      rows: "5",
                                      placeholder: "The main content of the article...",
                                      class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                    }, null, 8, ["onUpdate:modelValue"]), [
                                      [vModelText, module.data.items[0].description]
                                    ])
                                  ])
                                ])
                              ])) : getTypeKey(module.schema_type_id) === "breadcrumb" ? (openBlock(), createBlock("div", {
                                key: 5,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "flex justify-between items-center" }, [
                                  createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, 'Assistant: "Add your site navigation hierarchy below."'),
                                  createVNode("button", {
                                    onClick: withModifiers(($event) => addBreadcrumb(mIdx), ["prevent"]),
                                    class: "text-blue-600 font-bold text-[10px] uppercase tracking-widest"
                                  }, "+ Add Breadcrumb", 8, ["onClick"])
                                ]),
                                (openBlock(true), createBlock(Fragment, null, renderList(module.data.items, (b, bIdx) => {
                                  return openBlock(), createBlock("div", {
                                    key: bIdx,
                                    class: "relative group"
                                  }, [
                                    createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl flex gap-8" }, [
                                      createVNode("div", { class: "w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shrink-0 border border-indigo-100" }, toDisplayString(bIdx + 1), 1),
                                      createVNode("div", { class: "flex-grow grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                                        createVNode("div", { class: "space-y-2" }, [
                                          createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Crumbs Title"),
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => b.name = $event,
                                            placeholder: "Home...",
                                            class: "w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, b.name]
                                          ])
                                        ]),
                                        createVNode("div", { class: "space-y-2" }, [
                                          createVNode("label", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" }, "Destination URL"),
                                          withDirectives(createVNode("input", {
                                            "onUpdate:modelValue": ($event) => b.url = $event,
                                            placeholder: "/",
                                            class: "w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-medium"
                                          }, null, 8, ["onUpdate:modelValue"]), [
                                            [vModelText, b.url]
                                          ])
                                        ])
                                      ]),
                                      createVNode("button", {
                                        onClick: withModifiers(($event) => removeBreadcrumb(mIdx, bIdx), ["prevent"]),
                                        class: "w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
                                            d: "M6 18L18 6M6 6l12 12"
                                          })
                                        ]))
                                      ], 8, ["onClick"])
                                    ])
                                  ]);
                                }), 128))
                              ])) : getTypeKey(module.schema_type_id) === "event" ? (openBlock(), createBlock("div", {
                                key: 6,
                                class: "space-y-8"
                              }, [
                                createVNode("div", { class: "bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" }, [
                                  createVNode("div", { class: "space-y-4" }, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Event Name"),
                                    withDirectives(createVNode("input", {
                                      "onUpdate:modelValue": ($event) => module.data.items[0].name = $event,
                                      placeholder: "Global SEO Summit 2026...",
                                      class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg"
                                    }, null, 8, ["onUpdate:modelValue"]), [
                                      [vModelText, module.data.items[0].name]
                                    ])
                                  ]),
                                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8" }, [
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Start Date & Time"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].startDate = $event,
                                        type: "datetime-local",
                                        class: "block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].startDate]
                                      ])
                                    ]),
                                    createVNode("div", { class: "space-y-4" }, [
                                      createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Location / Venue"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => module.data.items[0].location = $event,
                                        placeholder: "Convention Center or Online",
                                        class: "block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, module.data.items[0].location]
                                      ])
                                    ])
                                  ]),
                                  createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-50" }, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Location Address"),
                                    withDirectives(createVNode("input", {
                                      "onUpdate:modelValue": ($event) => module.data.items[0].address = $event,
                                      placeholder: "123 Summit Way, NY",
                                      class: "block w-full px-6 py-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                    }, null, 8, ["onUpdate:modelValue"]), [
                                      [vModelText, module.data.items[0].address]
                                    ])
                                  ]),
                                  createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-50" }, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]" }, "Event Description"),
                                    withDirectives(createVNode("textarea", {
                                      "onUpdate:modelValue": ($event) => module.data.items[0].description = $event,
                                      rows: "3",
                                      placeholder: "Brief overview of the event...",
                                      class: "block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"
                                    }, null, 8, ["onUpdate:modelValue"]), [
                                      [vModelText, module.data.items[0].description]
                                    ])
                                  ])
                                ])
                              ])) : (openBlock(), createBlock("div", {
                                key: 7,
                                class: "text-center py-10 bg-white rounded-[2rem] border border-slate-100"
                              }, [
                                createVNode("p", { class: "text-slate-400 font-bold text-xs italic tracking-tight uppercase tracking-widest leading-loose" }, [
                                  createTextVNode(" Guided logic for " + toDisplayString(getTypeName(module.schema_type_id)) + " is evolving.", 1),
                                  createVNode("br"),
                                  createVNode("span", { class: "text-[10px]" }, "Generic fields are available in the post-build editor.")
                                ])
                              ]))
                            ])
                          ]);
                        }), 128)),
                        !unref(form).include_brand_identity && unref(form).modules.length === 0 ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200"
                        }, [
                          createVNode("p", { class: "text-slate-400 font-black text-xl italic mb-4" }, "Empty Schema Architecture"),
                          createVNode("p", { class: "text-slate-500 font-medium" }, "Please enable Brand Identity or add at least one module in Step 2.")
                        ])) : createCommentVNode("", true)
                      ], 512), [
                        [vShow, currentStep.value === 2]
                      ]),
                      createVNode("div", { class: "px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center" }, [
                        currentStep.value > 0 ? (openBlock(), createBlock("button", {
                          key: 0,
                          type: "button",
                          onClick: prevStep,
                          class: "px-10 py-5 rounded-3xl text-sm font-black text-slate-600 hover:bg-slate-200 transition-standard uppercase tracking-widest"
                        }, "Previous")) : (openBlock(), createBlock("div", { key: 1 })),
                        createVNode("div", { class: "flex gap-4" }, [
                          currentStep.value < 2 ? (openBlock(), createBlock("button", {
                            key: 0,
                            type: "button",
                            onClick: nextStep,
                            class: "bg-slate-900 text-white px-12 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 uppercase tracking-widest text-sm"
                          }, "Continue")) : (openBlock(), createBlock("button", {
                            key: 1,
                            type: "submit",
                            disabled: unref(form).processing,
                            class: "bg-blue-600 text-white px-16 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
                          }, toDisplayString(unref(form).processing ? "Syncing..." : "Build Modular Schema"), 9, ["disabled"]))
                        ])
                      ])
                    ], 32)
                  ])
                ])
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Schemas/AutomatedGenerator.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AutomatedGenerator = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a0503ef4"]]);
export {
  AutomatedGenerator as default
};
