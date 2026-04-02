import { mergeProps, useSSRContext, ref, onMounted, onUnmounted, unref, withCtx, openBlock, createBlock, createVNode, createTextVNode } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderComponent, ssrRenderSlot } from "vue/server-renderer";
import { Link, usePage, Head } from "@inertiajs/vue3";
import { T as Toaster } from "./Toaster-DHWaylML.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import { _ as _sfc_main$3 } from "./BrandLogo-DhDYxbtK.js";
const _sfc_main$2 = {
  __name: "WorkspaceLoader",
  __ssrInlineRender: true,
  props: {
    show: Boolean
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-50 flex items-center justify-center bg-white border-2 border-slate-100" }, _attrs))} data-v-f3d6752d><div class="relative flex flex-col items-center" data-v-f3d6752d><div class="absolute w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] animate-pulse" data-v-f3d6752d></div><div class="relative z-10 flex flex-col items-center space-y-8" data-v-f3d6752d><div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 animate-bounce-gentle" data-v-f3d6752d><svg class="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f3d6752d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" data-v-f3d6752d></path></svg></div><div class="text-center space-y-2" data-v-f3d6752d><h2 class="text-2xl font-bold text-slate-900 tracking-tight animate-fade-in-up" data-v-f3d6752d> Preparing Workspace </h2><div class="flex items-center justify-center gap-1.5 h-6" data-v-f3d6752d><div class="w-2 h-2 bg-slate-900 rounded-full animate-bounce delay-0" data-v-f3d6752d></div><div class="w-2 h-2 bg-slate-900 rounded-full animate-bounce delay-100" data-v-f3d6752d></div><div class="w-2 h-2 bg-slate-900 rounded-full animate-bounce delay-200" data-v-f3d6752d></div></div></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/WorkspaceLoader.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const WorkspaceLoader = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-f3d6752d"]]);
const _sfc_main$1 = {
  __name: "UserDropdown",
  __ssrInlineRender: true,
  setup(__props) {
    const isOpen = ref(false);
    const dropdownRef = ref(null);
    const closeOnClickOutside = (e) => {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
        isOpen.value = false;
      }
    };
    onMounted(() => {
      document.addEventListener("click", closeOnClickOutside);
    });
    onUnmounted(() => {
      document.removeEventListener("click", closeOnClickOutside);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative",
        ref_key: "dropdownRef",
        ref: dropdownRef
      }, _attrs))}><button class="flex items-center space-x-3 focus:outline-none group"><div class="text-right block"><p class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">${ssrInterpolate(_ctx.$page.props.auth?.user?.name)}</p><p class="text-xs text-slate-500">${ssrInterpolate(_ctx.$page.props.auth?.user?.email)}</p></div><div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:shadow-md transition-all overflow-hidden">`);
      if (_ctx.$page.props.auth.user.profile_photo_url) {
        _push(`<img${ssrRenderAttr("src", _ctx.$page.props.auth.user.profile_photo_url)}${ssrRenderAttr("alt", _ctx.$page.props.auth.user.name)} class="w-full h-full object-cover">`);
      } else {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`);
      }
      _push(`</div></button>`);
      if (isOpen.value) {
        _push(`<div class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right"><div class="px-4 py-3 border-b border-slate-50 mb-2"><p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Account</p></div>`);
        _push(ssrRenderComponent(unref(Link), {
          href: "/profile",
          class: "block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium flex items-center gap-2",
          onClick: ($event) => isOpen.value = false
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"${_scopeId}></path></svg> Profile `);
            } else {
              return [
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
                    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  })
                ])),
                createTextVNode(" Profile ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(Link), {
          href: "/settings",
          class: "block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium flex items-center gap-2",
          onClick: ($event) => isOpen.value = false
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg> Settings `);
            } else {
              return [
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
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="border-t border-slate-100 my-2"></div>`);
        _push(ssrRenderComponent(unref(Link), {
          href: "/logout",
          method: "post",
          as: "button",
          class: "w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold flex items-center gap-2",
          onClick: ($event) => isOpen.value = false
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"${_scopeId}></path></svg> Log Out `);
            } else {
              return [
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
                    d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  })
                ])),
                createTextVNode(" Log Out ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/UserDropdown.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "AppLayout",
  __ssrInlineRender: true,
  props: {
    title: String
  },
  setup(__props) {
    const toaster = ref(null);
    const isLoading = ref(false);
    const page = usePage();
    onMounted(() => {
      if (page.component === "Dashboard" && !sessionStorage.getItem("workspace_loaded")) {
        isLoading.value = true;
        setTimeout(() => {
          isLoading.value = false;
          sessionStorage.setItem("workspace_loaded", "true");
        }, 2e3);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "app",
        class: "min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700"
      }, _attrs))}>`);
      _push(ssrRenderComponent(unref(Head), { title: __props.title }, null, _parent));
      _push(ssrRenderComponent(WorkspaceLoader, { show: isLoading.value }, null, _parent));
      _push(ssrRenderComponent(Toaster, {
        ref_key: "toaster",
        ref: toaster
      }, null, _parent));
      _push(`<nav class="sticky top-0 z-40 glass border-b border-slate-200/50"><div class="max-w-[1440px] mx-auto px-6"><div class="flex justify-between items-center h-20">`);
      _push(ssrRenderComponent(_sfc_main$3, null, null, _parent));
      _push(`<div class="hidden md:flex items-center space-x-1 lg:space-x-4 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/30">`);
      _push(ssrRenderComponent(unref(Link), {
        href: "/",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component === "Dashboard" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Dashboard `);
          } else {
            return [
              createTextVNode(" Dashboard ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/analytics",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Analytics/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Analytics `);
          } else {
            return [
              createTextVNode(" Analytics ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/sitemaps",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Sitemaps/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Sitemaps `);
          } else {
            return [
              createTextVNode(" Sitemaps ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/schemas",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Schemas/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Schemas `);
          } else {
            return [
              createTextVNode(" Schemas ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/campaigns",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Campaigns/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Campaigns `);
          } else {
            return [
              createTextVNode(" Campaigns ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/keywords/trending",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Keywords/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Keywords `);
          } else {
            return [
              createTextVNode(" Keywords ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: "/content",
        class: ["px-5 py-2.5 rounded-xl text-sm font-semibold transition-standard", _ctx.$page.component.startsWith("Content/") ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Content `);
          } else {
            return [
              createTextVNode(" Content ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-center space-x-4"><div class="relative group hidden sm:flex">`);
      _push(ssrRenderComponent(unref(Link), { class: "flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"${_scopeId}></path></svg><span${_scopeId}>Pique</span>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                "stroke-width": "1.5",
                stroke: "currentColor",
                class: "h-4 w-4"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  d: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                })
              ])),
              createVNode("span", null, "Pique")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-200 shadow-lg"> Speak to Pique — your AI SEO specialist </div></div><div class="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      _push(`</div></div></div></nav><main class="max-w-[1440px] mx-auto px-6 py-10">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main><footer class="mt-auto border-t border-slate-200/50 py-10 px-6"><div class="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6"><p class="text-slate-500 text-sm font-medium">© 2026 ${ssrInterpolate(_ctx.$page.props.branding?.site_name || "MetaPilot")} • AI-Powered SEO Management</p><div class="flex items-center space-x-6">`);
      _push(ssrRenderComponent(unref(Link), {
        href: _ctx.route("privacy"),
        class: "text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Privacy`);
          } else {
            return [
              createTextVNode(" Privacy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: _ctx.route("terms"),
        class: "text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Terms`);
          } else {
            return [
              createTextVNode(" Terms")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(Link), {
        href: _ctx.route("cookies"),
        class: "text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors uppercase tracking-widest"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Cookies`);
          } else {
            return [
              createTextVNode(" Cookies")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AppLayout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as _
};
