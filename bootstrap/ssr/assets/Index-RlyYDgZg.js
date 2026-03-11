import { ref, mergeProps, withCtx, unref, openBlock, createBlock, createVNode, createTextVNode, Fragment, renderList, createCommentVNode, toDisplayString, withModifiers, withDirectives, vModelText, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { useForm, Link, router } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-CRphHsV-.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-wIKyrnft.js";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    sitemaps: Array
  },
  setup(__props) {
    const showCreateModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const editingId = ref(null);
    const sitemapToDelete = ref(null);
    const form = useForm({
      name: "",
      site_url: "",
      filename: "",
      is_index: false
    });
    const editSitemap = (sitemap) => {
      isEditing.value = true;
      editingId.value = sitemap.id;
      form.name = sitemap.name;
      form.site_url = sitemap.site_url;
      form.filename = sitemap.filename;
      form.is_index = !!sitemap.is_index;
      showCreateModal.value = true;
    };
    const closeModal = () => {
      showCreateModal.value = false;
      setTimeout(() => {
        isEditing.value = false;
        editingId.value = null;
        form.reset();
      }, 400);
    };
    const submitForm = () => {
      if (isEditing.value) {
        form.put(route("sitemaps.update", editingId.value), {
          onSuccess: () => closeModal()
        });
      } else {
        form.post(route("sitemaps.store"), {
          onSuccess: () => closeModal()
        });
      }
    };
    const deleteSitemap = (sitemap) => {
      sitemapToDelete.value = sitemap;
      showDeleteModal.value = true;
    };
    const confirmDelete = () => {
      if (!sitemapToDelete.value) return;
      router.delete(route("sitemaps.destroy", sitemapToDelete.value.id), {
        onSuccess: () => {
          showDeleteModal.value = false;
          sitemapToDelete.value = null;
        }
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Sitemap Dashboard" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-7xl mx-auto space-y-10 pb-20" data-v-4780a5bb${_scopeId}><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6" data-v-4780a5bb${_scopeId}><div data-v-4780a5bb${_scopeId}><h1 class="text-4xl font-black text-slate-900 tracking-tight" data-v-4780a5bb${_scopeId}>Sitemap Intelligence</h1><p class="text-slate-500 font-medium mt-2 text-lg" data-v-4780a5bb${_scopeId}>Manage, generate, and optimize your XML sitemaps for maximum indexing.</p></div><button class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-standard shadow-xl shadow-blue-100 flex items-center gap-3 active:scale-95" data-v-4780a5bb${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" data-v-4780a5bb${_scopeId}></path></svg> New Sitemap </button>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/crawl-schedules",
              class: "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-standard active:scale-95"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-4780a5bb${_scopeId2}></path></svg> Schedules `);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4 text-emerald-500",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Schedules ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-v-4780a5bb${_scopeId}><!--[-->`);
            ssrRenderList(__props.sitemaps, (sitemap) => {
              _push2(`<div class="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium hover:shadow-2xl transition-all duration-500 relative overflow-hidden" data-v-4780a5bb${_scopeId}><div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" data-v-4780a5bb${_scopeId}><svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" data-v-4780a5bb${_scopeId}></path></svg></div><div class="relative z-10 flex flex-col h-full" data-v-4780a5bb${_scopeId}><div class="flex justify-between items-start mb-6" data-v-4780a5bb${_scopeId}><div class="${ssrRenderClass([sitemap.is_index ? "bg-indigo-500" : "bg-blue-600", "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100"])}" data-v-4780a5bb${_scopeId}>`);
              if (sitemap.is_index) {
                _push2(`<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" data-v-4780a5bb${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" data-v-4780a5bb${_scopeId}></path></svg>`);
              }
              _push2(`</div><div class="flex items-center gap-2" data-v-4780a5bb${_scopeId}><button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard" title="Edit Sitemap" data-v-4780a5bb${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" data-v-4780a5bb${_scopeId}></path></svg></button><button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard" title="Delete Sitemap" data-v-4780a5bb${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-4780a5bb${_scopeId}></path></svg></button>`);
              if (sitemap.is_index) {
                _push2(`<span class="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" data-v-4780a5bb${_scopeId}>Master Index</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (sitemap.schedule) {
                _push2(`<span class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1" data-v-4780a5bb${_scopeId}><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-4780a5bb${_scopeId}></path></svg> ${ssrInterpolate(sitemap.schedule.frequency)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><h3 class="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2" data-v-4780a5bb${_scopeId}>${ssrInterpolate(sitemap.name)}</h3>`);
              if (sitemap.site_url) {
                _push2(`<p class="text-xs font-bold text-blue-500 mb-1 truncate" data-v-4780a5bb${_scopeId}>${ssrInterpolate(sitemap.site_url)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<code class="text-xs font-mono text-slate-400 mb-6 block" data-v-4780a5bb${_scopeId}>/${ssrInterpolate(sitemap.filename)}</code><div class="grid grid-cols-2 gap-4 mt-auto border-t border-slate-50 pt-6" data-v-4780a5bb${_scopeId}><div data-v-4780a5bb${_scopeId}><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1" data-v-4780a5bb${_scopeId}>Total Links</span><span class="text-xl font-bold text-slate-900" data-v-4780a5bb${_scopeId}>${ssrInterpolate(sitemap.links_count)}</span></div><div data-v-4780a5bb${_scopeId}><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1" data-v-4780a5bb${_scopeId}>Last Build</span><span class="text-xs font-medium text-slate-500" data-v-4780a5bb${_scopeId}>${ssrInterpolate(sitemap.last_generated_at ? new Date(sitemap.last_generated_at).toLocaleDateString() : "Never")}</span></div></div>`);
              _push2(ssrRenderComponent(unref(Link), {
                href: _ctx.route("sitemaps.show", sitemap.id),
                class: "mt-8 bg-slate-900 text-white w-full py-4 rounded-2xl font-bold text-center group-hover:bg-blue-600 transition-standard active:scale-95"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Manage Sitemap `);
                  } else {
                    return [
                      createTextVNode(" Manage Sitemap ")
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
              _push2(`</div></div>`);
            });
            _push2(`<!--]--></div>`);
            if (__props.sitemaps.length === 0) {
              _push2(`<div class="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200" data-v-4780a5bb${_scopeId}><div class="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-slate-300" data-v-4780a5bb${_scopeId}><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L15 17l-6 3z" data-v-4780a5bb${_scopeId}></path></svg></div><h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4" data-v-4780a5bb${_scopeId}>No sitemaps generated yet</h2><p class="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed" data-v-4780a5bb${_scopeId}>Create your first sitemap container to start importing links and building your XML structure.</p><button class="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-standard" data-v-4780a5bb${_scopeId}> Initialize First Sitemap </button></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showCreateModal.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-4780a5bb${_scopeId}><div class="bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" data-v-4780a5bb${_scopeId}><button class="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors" data-v-4780a5bb${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-4780a5bb${_scopeId}></path></svg></button><h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight" data-v-4780a5bb${_scopeId}>${ssrInterpolate(isEditing.value ? "Edit Sitemap" : "Init Sitemap")}</h2><form class="space-y-8" data-v-4780a5bb${_scopeId}><div class="space-y-3" data-v-4780a5bb${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-4780a5bb${_scopeId}>Internal Label</label><input${ssrRenderAttr("value", unref(form).name)} type="text" placeholder="e.g., SEO Game Pages" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required data-v-4780a5bb${_scopeId}></div><div class="space-y-3" data-v-4780a5bb${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-4780a5bb${_scopeId}>Site Link / Domain</label><input${ssrRenderAttr("value", unref(form).site_url)} type="url" placeholder="https://example.com" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" data-v-4780a5bb${_scopeId}>`);
              if (unref(form).errors.site_url) {
                _push2(`<p class="text-red-500 text-[10px] font-bold ml-4" data-v-4780a5bb${_scopeId}>${ssrInterpolate(unref(form).errors.site_url)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-3" data-v-4780a5bb${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" data-v-4780a5bb${_scopeId}>XML Filename</label><div class="relative" data-v-4780a5bb${_scopeId}><input${ssrRenderAttr("value", unref(form).filename)} type="text" placeholder="sitemap-pages.xml" class="w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold" required data-v-4780a5bb${_scopeId}></div></div><div class="${ssrRenderClass([unref(form).is_index ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100", "flex items-center gap-6 p-6 rounded-2xl border-2 cursor-pointer transition-standard"])}" data-v-4780a5bb${_scopeId}><div class="${ssrRenderClass([unref(form).is_index ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400", "w-12 h-12 rounded-xl flex items-center justify-center transition-standard shadow-lg"])}" data-v-4780a5bb${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" data-v-4780a5bb${_scopeId}></path></svg></div><div data-v-4780a5bb${_scopeId}><p class="font-black text-slate-900 text-sm" data-v-4780a5bb${_scopeId}>Sitemap Index File</p><p class="text-xs text-slate-500 font-medium" data-v-4780a5bb${_scopeId}>Link other sitemaps to this master file.</p></div></div><button${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} type="submit" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4" data-v-4780a5bb${_scopeId}>${ssrInterpolate(isEditing.value ? "Save Changes" : "Create Container")}</button></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showDeleteModal.value) {
              _push2(`<div class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" data-v-4780a5bb${_scopeId}><div class="bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" data-v-4780a5bb${_scopeId}><div class="absolute top-0 left-0 w-full h-2 bg-red-500" data-v-4780a5bb${_scopeId}></div><div class="flex flex-col items-center text-center space-y-6" data-v-4780a5bb${_scopeId}><div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" data-v-4780a5bb${_scopeId}><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4780a5bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-4780a5bb${_scopeId}></path></svg></div><div data-v-4780a5bb${_scopeId}><h2 class="text-2xl font-black text-slate-900 mb-2" data-v-4780a5bb${_scopeId}>Are you sure?</h2><p class="text-slate-500 font-medium px-4" data-v-4780a5bb${_scopeId}>You are about to delete <span class="text-slate-900 font-bold" data-v-4780a5bb${_scopeId}>&quot;${ssrInterpolate(sitemapToDelete.value?.name)}&quot;</span>. All links within this sitemap will be permanently removed.</p></div><div class="flex flex-col w-full gap-3 pt-4" data-v-4780a5bb${_scopeId}><button class="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95" data-v-4780a5bb${_scopeId}> Yes, Delete It </button><button class="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95" data-v-4780a5bb${_scopeId}> No, Keep It </button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-7xl mx-auto space-y-10 pb-20" }, [
                createVNode("div", { class: "flex flex-col md:flex-row justify-between items-start md:items-center gap-6" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-4xl font-black text-slate-900 tracking-tight" }, "Sitemap Intelligence"),
                    createVNode("p", { class: "text-slate-500 font-medium mt-2 text-lg" }, "Manage, generate, and optimize your XML sitemaps for maximum indexing.")
                  ]),
                  createVNode("button", {
                    onClick: ($event) => showCreateModal.value = true,
                    class: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-standard shadow-xl shadow-blue-100 flex items-center gap-3 active:scale-95"
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
                        d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                      })
                    ])),
                    createTextVNode(" New Sitemap ")
                  ], 8, ["onClick"]),
                  createVNode(unref(Link), {
                    href: "/crawl-schedules",
                    class: "flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-standard active:scale-95"
                  }, {
                    default: withCtx(() => [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-emerald-500",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        })
                      ])),
                      createTextVNode(" Schedules ")
                    ]),
                    _: 1
                  })
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(__props.sitemaps, (sitemap) => {
                    return openBlock(), createBlock("div", {
                      key: sitemap.id,
                      class: "group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-premium hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                    }, [
                      createVNode("div", { class: "absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-24 h-24",
                          fill: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", { d: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" })
                        ]))
                      ]),
                      createVNode("div", { class: "relative z-10 flex flex-col h-full" }, [
                        createVNode("div", { class: "flex justify-between items-start mb-6" }, [
                          createVNode("div", {
                            class: [sitemap.is_index ? "bg-indigo-500" : "bg-blue-600", "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100"]
                          }, [
                            sitemap.is_index ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "w-8 h-8",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M4 6h16M4 12h16m-7 6h7"
                              })
                            ])) : (openBlock(), createBlock("svg", {
                              key: 1,
                              class: "w-8 h-8",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                              })
                            ]))
                          ], 2),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("button", {
                              onClick: ($event) => editSitemap(sitemap),
                              class: "p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-standard",
                              title: "Edit Sitemap"
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
                                  d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                })
                              ]))
                            ], 8, ["onClick"]),
                            createVNode("button", {
                              onClick: ($event) => deleteSitemap(sitemap),
                              class: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-standard",
                              title: "Delete Sitemap"
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
                                  d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                })
                              ]))
                            ], 8, ["onClick"]),
                            sitemap.is_index ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                            }, "Master Index")) : createCommentVNode("", true),
                            sitemap.schedule ? (openBlock(), createBlock("span", {
                              key: 1,
                              class: "bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-3 h-3",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                              ])),
                              createTextVNode(" " + toDisplayString(sitemap.schedule.frequency), 1)
                            ])) : createCommentVNode("", true)
                          ])
                        ]),
                        createVNode("h3", { class: "text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2" }, toDisplayString(sitemap.name), 1),
                        sitemap.site_url ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "text-xs font-bold text-blue-500 mb-1 truncate"
                        }, toDisplayString(sitemap.site_url), 1)) : createCommentVNode("", true),
                        createVNode("code", { class: "text-xs font-mono text-slate-400 mb-6 block" }, "/" + toDisplayString(sitemap.filename), 1),
                        createVNode("div", { class: "grid grid-cols-2 gap-4 mt-auto border-t border-slate-50 pt-6" }, [
                          createVNode("div", null, [
                            createVNode("span", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1" }, "Total Links"),
                            createVNode("span", { class: "text-xl font-bold text-slate-900" }, toDisplayString(sitemap.links_count), 1)
                          ]),
                          createVNode("div", null, [
                            createVNode("span", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1" }, "Last Build"),
                            createVNode("span", { class: "text-xs font-medium text-slate-500" }, toDisplayString(sitemap.last_generated_at ? new Date(sitemap.last_generated_at).toLocaleDateString() : "Never"), 1)
                          ])
                        ]),
                        createVNode(unref(Link), {
                          href: _ctx.route("sitemaps.show", sitemap.id),
                          class: "mt-8 bg-slate-900 text-white w-full py-4 rounded-2xl font-bold text-center group-hover:bg-blue-600 transition-standard active:scale-95"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(" Manage Sitemap ")
                          ]),
                          _: 1
                        }, 8, ["href"])
                      ])
                    ]);
                  }), 128))
                ]),
                __props.sitemaps.length === 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200"
                }, [
                  createVNode("div", { class: "w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-slate-300" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-12 h-12",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L15 17l-6 3z"
                      })
                    ]))
                  ]),
                  createVNode("h2", { class: "text-3xl font-black text-slate-900 tracking-tight mb-4" }, "No sitemaps generated yet"),
                  createVNode("p", { class: "text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed" }, "Create your first sitemap container to start importing links and building your XML structure."),
                  createVNode("button", {
                    onClick: ($event) => showCreateModal.value = true,
                    class: "bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-standard"
                  }, " Initialize First Sitemap ", 8, ["onClick"])
                ])) : createCommentVNode("", true),
                showCreateModal.value ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                }, [
                  createVNode("div", { class: "bg-white w-full max-w-xl rounded-[3rem] shadow-premium p-12 relative scale-in-center" }, [
                    createVNode("button", {
                      onClick: closeModal,
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
                    ]),
                    createVNode("h2", { class: "text-3xl font-black text-slate-900 mb-8 tracking-tight" }, toDisplayString(isEditing.value ? "Edit Sitemap" : "Init Sitemap"), 1),
                    createVNode("form", {
                      onSubmit: withModifiers(submitForm, ["prevent"]),
                      class: "space-y-8"
                    }, [
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Internal Label"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).name = $event,
                          type: "text",
                          placeholder: "e.g., SEO Game Pages",
                          class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold",
                          required: ""
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).name]
                        ])
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "Site Link / Domain"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(form).site_url = $event,
                          type: "url",
                          placeholder: "https://example.com",
                          class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(form).site_url]
                        ]),
                        unref(form).errors.site_url ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "text-red-500 text-[10px] font-bold ml-4"
                        }, toDisplayString(unref(form).errors.site_url), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "space-y-3" }, [
                        createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4" }, "XML Filename"),
                        createVNode("div", { class: "relative" }, [
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(form).filename = $event,
                            type: "text",
                            placeholder: "sitemap-pages.xml",
                            class: "w-full px-8 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard font-bold",
                            required: ""
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(form).filename]
                          ])
                        ])
                      ]),
                      createVNode("div", {
                        onClick: ($event) => unref(form).is_index = !unref(form).is_index,
                        class: ["flex items-center gap-6 p-6 rounded-2xl border-2 cursor-pointer transition-standard", unref(form).is_index ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100"]
                      }, [
                        createVNode("div", {
                          class: [unref(form).is_index ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400", "w-12 h-12 rounded-xl flex items-center justify-center transition-standard shadow-lg"]
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
                              d: "M4 6h16M4 12h16m-7 6h7"
                            })
                          ]))
                        ], 2),
                        createVNode("div", null, [
                          createVNode("p", { class: "font-black text-slate-900 text-sm" }, "Sitemap Index File"),
                          createVNode("p", { class: "text-xs text-slate-500 font-medium" }, "Link other sitemaps to this master file.")
                        ])
                      ], 10, ["onClick"]),
                      createVNode("button", {
                        disabled: unref(form).processing,
                        type: "submit",
                        class: "w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-standard mt-4"
                      }, toDisplayString(isEditing.value ? "Save Changes" : "Create Container"), 9, ["disabled"])
                    ], 32)
                  ])
                ])) : createCommentVNode("", true),
                showDeleteModal.value ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                }, [
                  createVNode("div", { class: "bg-white w-full max-w-md rounded-[3rem] shadow-premium p-10 relative scale-in-center overflow-hidden" }, [
                    createVNode("div", { class: "absolute top-0 left-0 w-full h-2 bg-red-500" }),
                    createVNode("div", { class: "flex flex-col items-center text-center space-y-6" }, [
                      createVNode("div", { class: "w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-lg shadow-red-100/50" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-10 h-10",
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
                      ]),
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-2xl font-black text-slate-900 mb-2" }, "Are you sure?"),
                        createVNode("p", { class: "text-slate-500 font-medium px-4" }, [
                          createTextVNode("You are about to delete "),
                          createVNode("span", { class: "text-slate-900 font-bold" }, '"' + toDisplayString(sitemapToDelete.value?.name) + '"', 1),
                          createTextVNode(". All links within this sitemap will be permanently removed.")
                        ])
                      ]),
                      createVNode("div", { class: "flex flex-col w-full gap-3 pt-4" }, [
                        createVNode("button", {
                          onClick: confirmDelete,
                          class: "w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-standard active:scale-95"
                        }, " Yes, Delete It "),
                        createVNode("button", {
                          onClick: ($event) => showDeleteModal.value = false,
                          class: "w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-standard active:scale-95"
                        }, " No, Keep It ", 8, ["onClick"])
                      ])
                    ])
                  ])
                ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Sitemaps/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4780a5bb"]]);
export {
  Index as default
};
