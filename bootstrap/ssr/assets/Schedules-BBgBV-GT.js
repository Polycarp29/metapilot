import { ref, reactive, withCtx, unref, createTextVNode, createVNode, openBlock, createBlock, createCommentVNode, Fragment, renderList, toDisplayString, Teleport, withModifiers, withDirectives, vModelSelect, vModelText, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderTeleport, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr } from "vue/server-renderer";
import { Link, router } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-D17_izsv.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Schedules",
  __ssrInlineRender: true,
  props: {
    schedules: Array,
    availableSitemaps: Array
  },
  setup(__props) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const editingSchedule = ref(null);
    const deletingSchedule = ref(null);
    const form = reactive({
      sitemap_id: "",
      frequency: "daily",
      run_at: "02:00",
      day_of_week: 1,
      max_depth: 3
    });
    function resetForm() {
      form.sitemap_id = "";
      form.frequency = "daily";
      form.run_at = "02:00";
      form.day_of_week = 1;
      form.max_depth = 3;
    }
    function closeModals() {
      showCreateModal.value = false;
      showEditModal.value = false;
      editingSchedule.value = null;
      resetForm();
    }
    function submitCreate() {
      router.post("/crawl-schedules", { ...form }, {
        preserveScroll: true,
        onSuccess: () => closeModals()
      });
    }
    function editSchedule(schedule) {
      editingSchedule.value = schedule;
      form.frequency = schedule.frequency;
      form.run_at = schedule.run_at || "02:00";
      form.day_of_week = schedule.day_of_week ?? 1;
      form.max_depth = schedule.max_depth;
      showEditModal.value = true;
    }
    function submitEdit() {
      router.put(`/crawl-schedules/${editingSchedule.value.id}`, { ...form }, {
        preserveScroll: true,
        onSuccess: () => closeModals()
      });
    }
    function toggleActive(schedule) {
      router.put(`/crawl-schedules/${schedule.id}`, { is_active: !schedule.is_active }, {
        preserveScroll: true
      });
    }
    function confirmDelete(schedule) {
      deletingSchedule.value = schedule;
      showDeleteModal.value = true;
    }
    function executeDelete() {
      router.delete(`/crawl-schedules/${deletingSchedule.value.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          showDeleteModal.value = false;
          deletingSchedule.value = null;
        }
      });
    }
    function freqBadgeClass(freq) {
      return {
        hourly: "bg-amber-100 text-amber-700",
        daily: "bg-blue-100 text-blue-700",
        weekly: "bg-indigo-100 text-indigo-700",
        monthly: "bg-violet-100 text-violet-700"
      }[freq] || "bg-slate-100 text-slate-700";
    }
    function statusColorClass(status) {
      if (!status) return "text-slate-400";
      if (status === "completed" || status === "dispatched") return "text-emerald-600";
      if (status === "failed") return "text-red-500";
      return "text-amber-500";
    }
    function formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString(void 0, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-8" data-v-6e57b2bb${_scopeId}><div class="flex items-center justify-between" data-v-6e57b2bb${_scopeId}><div data-v-6e57b2bb${_scopeId}><h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600" data-v-6e57b2bb${_scopeId}>Crawl Schedules</h1><p class="text-slate-500 mt-1" data-v-6e57b2bb${_scopeId}>Automate your sitemap crawling with recurring schedules</p></div><div class="flex items-center space-x-3" data-v-6e57b2bb${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Link), {
              href: "/sitemaps",
              class: "px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` ← Back to Sitemaps `);
                } else {
                  return [
                    createTextVNode(" ← Back to Sitemaps ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (__props.availableSitemaps.length > 0) {
              _push2(`<button class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95" data-v-6e57b2bb${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6e57b2bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" data-v-6e57b2bb${_scopeId}></path></svg><span data-v-6e57b2bb${_scopeId}>New Schedule</span></button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
            if (__props.schedules.length > 0) {
              _push2(`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-v-6e57b2bb${_scopeId}><!--[-->`);
              ssrRenderList(__props.schedules, (schedule) => {
                _push2(`<div class="group bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" data-v-6e57b2bb${_scopeId}><div class="p-6 pb-4" data-v-6e57b2bb${_scopeId}><div class="flex items-start justify-between mb-3" data-v-6e57b2bb${_scopeId}><div class="flex-1 min-w-0" data-v-6e57b2bb${_scopeId}><h3 class="font-bold text-lg text-slate-900 truncate" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.sitemap?.name || "Unknown Sitemap")}</h3><p class="text-xs text-slate-400 truncate mt-0.5" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.sitemap?.site_url || schedule.sitemap?.filename)}</p></div><button class="${ssrRenderClass([schedule.is_active ? "bg-emerald-500" : "bg-slate-300", "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"])}" data-v-6e57b2bb${_scopeId}><span class="${ssrRenderClass([schedule.is_active ? "translate-x-5" : "translate-x-0", "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"])}" data-v-6e57b2bb${_scopeId}></span></button></div><div class="flex items-center space-x-2 mb-4" data-v-6e57b2bb${_scopeId}><span class="${ssrRenderClass([freqBadgeClass(schedule.frequency), "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"])}" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.frequency)}</span>`);
                if (schedule.run_at && schedule.frequency !== "hourly") {
                  _push2(`<span class="text-xs text-slate-500" data-v-6e57b2bb${_scopeId}> at ${ssrInterpolate(schedule.run_at)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (schedule.day_of_week !== null && schedule.frequency === "weekly") {
                  _push2(`<span class="text-xs text-slate-500" data-v-6e57b2bb${_scopeId}> on ${ssrInterpolate(dayNames[schedule.day_of_week])}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="grid grid-cols-2 gap-3 text-sm" data-v-6e57b2bb${_scopeId}><div class="bg-slate-50 rounded-xl p-3" data-v-6e57b2bb${_scopeId}><div class="text-slate-400 text-xs font-medium mb-0.5" data-v-6e57b2bb${_scopeId}>Max Depth</div><div class="font-bold text-slate-900" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.max_depth)}</div></div><div class="bg-slate-50 rounded-xl p-3" data-v-6e57b2bb${_scopeId}><div class="text-slate-400 text-xs font-medium mb-0.5" data-v-6e57b2bb${_scopeId}>Last Status</div><div class="${ssrRenderClass([statusColorClass(schedule.last_run_status), "font-bold text-sm capitalize"])}" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.last_run_status || "Never run")}</div></div><div class="bg-slate-50 rounded-xl p-3 col-span-2" data-v-6e57b2bb${_scopeId}><div class="text-slate-400 text-xs font-medium mb-0.5" data-v-6e57b2bb${_scopeId}>Next Run</div><div class="font-bold text-slate-900 text-sm" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(schedule.next_run_at ? formatDate(schedule.next_run_at) : "Pending")}</div></div></div></div><div class="border-t border-slate-100 px-6 py-3 flex justify-end space-x-2 bg-slate-50/50" data-v-6e57b2bb${_scopeId}><button class="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all" data-v-6e57b2bb${_scopeId}> Edit </button><button class="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all" data-v-6e57b2bb${_scopeId}> Delete </button></div></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300" data-v-6e57b2bb${_scopeId}><div class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6" data-v-6e57b2bb${_scopeId}><svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6e57b2bb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-6e57b2bb${_scopeId}></path></svg></div><h3 class="text-xl font-bold text-slate-900 mb-2" data-v-6e57b2bb${_scopeId}>No Crawl Schedules Yet</h3><p class="text-slate-500 max-w-md mx-auto mb-6" data-v-6e57b2bb${_scopeId}> Set up automated crawl schedules to keep your sitemaps up-to-date automatically. </p>`);
              if (__props.availableSitemaps.length > 0) {
                _push2(`<button class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200" data-v-6e57b2bb${_scopeId}> Create First Schedule </button>`);
              } else {
                _push2(`<p class="text-sm text-slate-400 mt-4" data-v-6e57b2bb${_scopeId}>Create a sitemap first to set up a schedule.</p>`);
              }
              _push2(`</div>`);
            }
            _push2(`</div>`);
            ssrRenderTeleport(_push2, (_push3) => {
              if (showCreateModal.value || showEditModal.value) {
                _push3(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-6e57b2bb${_scopeId}><div class="fixed inset-0 bg-black/40 backdrop-blur-sm" data-v-6e57b2bb${_scopeId}></div><div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-modal-in" data-v-6e57b2bb${_scopeId}><h2 class="text-xl font-bold text-slate-900 mb-6" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(showEditModal.value ? "Edit Schedule" : "Create Crawl Schedule")}</h2><form class="space-y-5" data-v-6e57b2bb${_scopeId}>`);
                if (!showEditModal.value) {
                  _push3(`<div data-v-6e57b2bb${_scopeId}><label class="block text-sm font-semibold text-slate-700 mb-1.5" data-v-6e57b2bb${_scopeId}>Sitemap</label><select class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" required data-v-6e57b2bb${_scopeId}><option value="" disabled data-v-6e57b2bb${ssrIncludeBooleanAttr(Array.isArray(form.sitemap_id) ? ssrLooseContain(form.sitemap_id, "") : ssrLooseEqual(form.sitemap_id, "")) ? " selected" : ""}${_scopeId}>Select a sitemap...</option><!--[-->`);
                  ssrRenderList(__props.availableSitemaps, (sm) => {
                    _push3(`<option${ssrRenderAttr("value", sm.id)} data-v-6e57b2bb${ssrIncludeBooleanAttr(Array.isArray(form.sitemap_id) ? ssrLooseContain(form.sitemap_id, sm.id) : ssrLooseEqual(form.sitemap_id, sm.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(sm.name)} ${ssrInterpolate(sm.site_url ? `(${sm.site_url})` : "")}</option>`);
                  });
                  _push3(`<!--]--></select></div>`);
                } else {
                  _push3(`<!---->`);
                }
                _push3(`<div data-v-6e57b2bb${_scopeId}><label class="block text-sm font-semibold text-slate-700 mb-1.5" data-v-6e57b2bb${_scopeId}>Frequency</label><div class="grid grid-cols-4 gap-2" data-v-6e57b2bb${_scopeId}><!--[-->`);
                ssrRenderList(["hourly", "daily", "weekly", "monthly"], (freq) => {
                  _push3(`<button type="button" class="${ssrRenderClass([form.frequency === freq ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300", "px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center"])}" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(freq)}</button>`);
                });
                _push3(`<!--]--></div></div>`);
                if (form.frequency !== "hourly") {
                  _push3(`<div data-v-6e57b2bb${_scopeId}><label class="block text-sm font-semibold text-slate-700 mb-1.5" data-v-6e57b2bb${_scopeId}>Run At (Time of Day)</label><input${ssrRenderAttr("value", form.run_at)} type="time" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" data-v-6e57b2bb${_scopeId}></div>`);
                } else {
                  _push3(`<!---->`);
                }
                if (form.frequency === "weekly") {
                  _push3(`<div data-v-6e57b2bb${_scopeId}><label class="block text-sm font-semibold text-slate-700 mb-1.5" data-v-6e57b2bb${_scopeId}>Day of Week</label><select class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" data-v-6e57b2bb${_scopeId}><!--[-->`);
                  ssrRenderList(dayNames, (name, idx) => {
                    _push3(`<option${ssrRenderAttr("value", idx)} data-v-6e57b2bb${ssrIncludeBooleanAttr(Array.isArray(form.day_of_week) ? ssrLooseContain(form.day_of_week, idx) : ssrLooseEqual(form.day_of_week, idx)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(name)}</option>`);
                  });
                  _push3(`<!--]--></select></div>`);
                } else {
                  _push3(`<!---->`);
                }
                _push3(`<div data-v-6e57b2bb${_scopeId}><label class="block text-sm font-semibold text-slate-700 mb-1.5" data-v-6e57b2bb${_scopeId}>Max Crawl Depth</label><input${ssrRenderAttr("value", form.max_depth)} type="number" min="1" max="10" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm" data-v-6e57b2bb${_scopeId}></div><div class="flex justify-end space-x-3 pt-2" data-v-6e57b2bb${_scopeId}><button type="button" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all" data-v-6e57b2bb${_scopeId}>Cancel</button><button type="submit" class="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200" data-v-6e57b2bb${_scopeId}>${ssrInterpolate(showEditModal.value ? "Save Changes" : "Create Schedule")}</button></div></form></div></div>`);
              } else {
                _push3(`<!---->`);
              }
            }, "body", false, _parent2);
            ssrRenderTeleport(_push2, (_push3) => {
              if (showDeleteModal.value) {
                _push3(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-6e57b2bb${_scopeId}><div class="fixed inset-0 bg-black/40 backdrop-blur-sm" data-v-6e57b2bb${_scopeId}></div><div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8" data-v-6e57b2bb${_scopeId}><h3 class="text-lg font-bold text-slate-900 mb-3" data-v-6e57b2bb${_scopeId}>Delete Schedule?</h3><p class="text-sm text-slate-500 mb-6" data-v-6e57b2bb${_scopeId}>This will permanently delete the crawl schedule for <strong data-v-6e57b2bb${_scopeId}>${ssrInterpolate(deletingSchedule.value?.sitemap?.name)}</strong>.</p><div class="flex justify-end space-x-3" data-v-6e57b2bb${_scopeId}><button class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all" data-v-6e57b2bb${_scopeId}>Cancel</button><button class="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200" data-v-6e57b2bb${_scopeId}>Delete</button></div></div></div>`);
              } else {
                _push3(`<!---->`);
              }
            }, "body", false, _parent2);
          } else {
            return [
              createVNode("div", { class: "space-y-8" }, [
                createVNode("div", { class: "flex items-center justify-between" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600" }, "Crawl Schedules"),
                    createVNode("p", { class: "text-slate-500 mt-1" }, "Automate your sitemap crawling with recurring schedules")
                  ]),
                  createVNode("div", { class: "flex items-center space-x-3" }, [
                    createVNode(unref(Link), {
                      href: "/sitemaps",
                      class: "px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" ← Back to Sitemaps ")
                      ]),
                      _: 1
                    }),
                    __props.availableSitemaps.length > 0 ? (openBlock(), createBlock("button", {
                      key: 0,
                      onClick: ($event) => showCreateModal.value = true,
                      class: "flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
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
                          d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        })
                      ])),
                      createVNode("span", null, "New Schedule")
                    ], 8, ["onClick"])) : createCommentVNode("", true)
                  ])
                ]),
                __props.schedules.length > 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(__props.schedules, (schedule) => {
                    return openBlock(), createBlock("div", {
                      key: schedule.id,
                      class: "group bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    }, [
                      createVNode("div", { class: "p-6 pb-4" }, [
                        createVNode("div", { class: "flex items-start justify-between mb-3" }, [
                          createVNode("div", { class: "flex-1 min-w-0" }, [
                            createVNode("h3", { class: "font-bold text-lg text-slate-900 truncate" }, toDisplayString(schedule.sitemap?.name || "Unknown Sitemap"), 1),
                            createVNode("p", { class: "text-xs text-slate-400 truncate mt-0.5" }, toDisplayString(schedule.sitemap?.site_url || schedule.sitemap?.filename), 1)
                          ]),
                          createVNode("button", {
                            onClick: ($event) => toggleActive(schedule),
                            class: [schedule.is_active ? "bg-emerald-500" : "bg-slate-300", "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"]
                          }, [
                            createVNode("span", {
                              class: [schedule.is_active ? "translate-x-5" : "translate-x-0", "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"]
                            }, null, 2)
                          ], 10, ["onClick"])
                        ]),
                        createVNode("div", { class: "flex items-center space-x-2 mb-4" }, [
                          createVNode("span", {
                            class: [freqBadgeClass(schedule.frequency), "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"]
                          }, toDisplayString(schedule.frequency), 3),
                          schedule.run_at && schedule.frequency !== "hourly" ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "text-xs text-slate-500"
                          }, " at " + toDisplayString(schedule.run_at), 1)) : createCommentVNode("", true),
                          schedule.day_of_week !== null && schedule.frequency === "weekly" ? (openBlock(), createBlock("span", {
                            key: 1,
                            class: "text-xs text-slate-500"
                          }, " on " + toDisplayString(dayNames[schedule.day_of_week]), 1)) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "grid grid-cols-2 gap-3 text-sm" }, [
                          createVNode("div", { class: "bg-slate-50 rounded-xl p-3" }, [
                            createVNode("div", { class: "text-slate-400 text-xs font-medium mb-0.5" }, "Max Depth"),
                            createVNode("div", { class: "font-bold text-slate-900" }, toDisplayString(schedule.max_depth), 1)
                          ]),
                          createVNode("div", { class: "bg-slate-50 rounded-xl p-3" }, [
                            createVNode("div", { class: "text-slate-400 text-xs font-medium mb-0.5" }, "Last Status"),
                            createVNode("div", {
                              class: [statusColorClass(schedule.last_run_status), "font-bold text-sm capitalize"]
                            }, toDisplayString(schedule.last_run_status || "Never run"), 3)
                          ]),
                          createVNode("div", { class: "bg-slate-50 rounded-xl p-3 col-span-2" }, [
                            createVNode("div", { class: "text-slate-400 text-xs font-medium mb-0.5" }, "Next Run"),
                            createVNode("div", { class: "font-bold text-slate-900 text-sm" }, toDisplayString(schedule.next_run_at ? formatDate(schedule.next_run_at) : "Pending"), 1)
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "border-t border-slate-100 px-6 py-3 flex justify-end space-x-2 bg-slate-50/50" }, [
                        createVNode("button", {
                          onClick: ($event) => editSchedule(schedule),
                          class: "text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                        }, " Edit ", 8, ["onClick"]),
                        createVNode("button", {
                          onClick: ($event) => confirmDelete(schedule),
                          class: "text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                        }, " Delete ", 8, ["onClick"])
                      ])
                    ]);
                  }), 128))
                ])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"
                }, [
                  createVNode("div", { class: "w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-10 h-10 text-blue-500",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "1.5",
                        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ]))
                  ]),
                  createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "No Crawl Schedules Yet"),
                  createVNode("p", { class: "text-slate-500 max-w-md mx-auto mb-6" }, " Set up automated crawl schedules to keep your sitemaps up-to-date automatically. "),
                  __props.availableSitemaps.length > 0 ? (openBlock(), createBlock("button", {
                    key: 0,
                    onClick: ($event) => showCreateModal.value = true,
                    class: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                  }, " Create First Schedule ", 8, ["onClick"])) : (openBlock(), createBlock("p", {
                    key: 1,
                    class: "text-sm text-slate-400 mt-4"
                  }, "Create a sitemap first to set up a schedule."))
                ]))
              ]),
              (openBlock(), createBlock(Teleport, { to: "body" }, [
                showCreateModal.value || showEditModal.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "fixed inset-0 z-50 flex items-center justify-center p-4"
                }, [
                  createVNode("div", {
                    class: "fixed inset-0 bg-black/40 backdrop-blur-sm",
                    onClick: closeModals
                  }),
                  createVNode("div", { class: "relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-modal-in" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900 mb-6" }, toDisplayString(showEditModal.value ? "Edit Schedule" : "Create Crawl Schedule"), 1),
                    createVNode("form", {
                      onSubmit: withModifiers(($event) => showEditModal.value ? submitEdit() : submitCreate(), ["prevent"]),
                      class: "space-y-5"
                    }, [
                      !showEditModal.value ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("label", { class: "block text-sm font-semibold text-slate-700 mb-1.5" }, "Sitemap"),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.sitemap_id = $event,
                          class: "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm",
                          required: ""
                        }, [
                          createVNode("option", {
                            value: "",
                            disabled: ""
                          }, "Select a sitemap..."),
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.availableSitemaps, (sm) => {
                            return openBlock(), createBlock("option", {
                              key: sm.id,
                              value: sm.id
                            }, toDisplayString(sm.name) + " " + toDisplayString(sm.site_url ? `(${sm.site_url})` : ""), 9, ["value"]);
                          }), 128))
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, form.sitemap_id]
                        ])
                      ])) : createCommentVNode("", true),
                      createVNode("div", null, [
                        createVNode("label", { class: "block text-sm font-semibold text-slate-700 mb-1.5" }, "Frequency"),
                        createVNode("div", { class: "grid grid-cols-4 gap-2" }, [
                          (openBlock(), createBlock(Fragment, null, renderList(["hourly", "daily", "weekly", "monthly"], (freq) => {
                            return createVNode("button", {
                              key: freq,
                              type: "button",
                              onClick: ($event) => form.frequency = freq,
                              class: [form.frequency === freq ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300", "px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center"]
                            }, toDisplayString(freq), 11, ["onClick"]);
                          }), 64))
                        ])
                      ]),
                      form.frequency !== "hourly" ? (openBlock(), createBlock("div", { key: 1 }, [
                        createVNode("label", { class: "block text-sm font-semibold text-slate-700 mb-1.5" }, "Run At (Time of Day)"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => form.run_at = $event,
                          type: "time",
                          class: "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, form.run_at]
                        ])
                      ])) : createCommentVNode("", true),
                      form.frequency === "weekly" ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("label", { class: "block text-sm font-semibold text-slate-700 mb-1.5" }, "Day of Week"),
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.day_of_week = $event,
                          class: "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                        }, [
                          (openBlock(), createBlock(Fragment, null, renderList(dayNames, (name, idx) => {
                            return createVNode("option", {
                              key: idx,
                              value: idx
                            }, toDisplayString(name), 9, ["value"]);
                          }), 64))
                        ], 8, ["onUpdate:modelValue"]), [
                          [
                            vModelSelect,
                            form.day_of_week,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ])) : createCommentVNode("", true),
                      createVNode("div", null, [
                        createVNode("label", { class: "block text-sm font-semibold text-slate-700 mb-1.5" }, "Max Crawl Depth"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => form.max_depth = $event,
                          type: "number",
                          min: "1",
                          max: "10",
                          class: "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [
                            vModelText,
                            form.max_depth,
                            void 0,
                            { number: true }
                          ]
                        ])
                      ]),
                      createVNode("div", { class: "flex justify-end space-x-3 pt-2" }, [
                        createVNode("button", {
                          type: "button",
                          onClick: closeModals,
                          class: "px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                        }, "Cancel"),
                        createVNode("button", {
                          type: "submit",
                          class: "px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                        }, toDisplayString(showEditModal.value ? "Save Changes" : "Create Schedule"), 1)
                      ])
                    ], 40, ["onSubmit"])
                  ])
                ])) : createCommentVNode("", true)
              ])),
              (openBlock(), createBlock(Teleport, { to: "body" }, [
                showDeleteModal.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "fixed inset-0 z-50 flex items-center justify-center p-4"
                }, [
                  createVNode("div", {
                    class: "fixed inset-0 bg-black/40 backdrop-blur-sm",
                    onClick: ($event) => showDeleteModal.value = false
                  }, null, 8, ["onClick"]),
                  createVNode("div", { class: "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8" }, [
                    createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-3" }, "Delete Schedule?"),
                    createVNode("p", { class: "text-sm text-slate-500 mb-6" }, [
                      createTextVNode("This will permanently delete the crawl schedule for "),
                      createVNode("strong", null, toDisplayString(deletingSchedule.value?.sitemap?.name), 1),
                      createTextVNode(".")
                    ]),
                    createVNode("div", { class: "flex justify-end space-x-3" }, [
                      createVNode("button", {
                        onClick: ($event) => showDeleteModal.value = false,
                        class: "px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                      }, "Cancel", 8, ["onClick"]),
                      createVNode("button", {
                        onClick: executeDelete,
                        class: "px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                      }, "Delete")
                    ])
                  ])
                ])) : createCommentVNode("", true)
              ]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Sitemaps/Schedules.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Schedules = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6e57b2bb"]]);
export {
  Schedules as default
};
