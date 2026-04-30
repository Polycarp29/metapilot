import { ref, mergeProps, withCtx, unref, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, renderList, Transition, withModifiers, withDirectives, vModelText, vModelSelect, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { useForm, router } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import "./Toaster-DHWaylML.js";
import "./useToastStore-CP66SL3r.js";
import "pinia";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    organization: Object,
    members: Array,
    invitations: Array,
    currentUserRole: String
  },
  setup(__props) {
    const showInviteModal = ref(false);
    const inviteForm = useForm({
      email: "",
      role: "member"
    });
    const submitInvite = () => {
      inviteForm.post(route("team-invitations.store"), {
        onSuccess: () => {
          showInviteModal.value = false;
          inviteForm.reset();
        }
      });
    };
    const removeMember = (id) => {
      if (confirm("Are you sure you want to remove this member?")) {
        router.delete(route("team-members.destroy", id));
      }
    };
    const cancelInvite = (id) => {
      if (confirm("Revoke this invitation?")) {
        router.delete(route("team-invitations.destroy", id));
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Team Members" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-5xl mx-auto space-y-8"${_scopeId}><div class="flex justify-between items-end"${_scopeId}><div${_scopeId}><h1 class="text-3xl font-bold text-slate-900 tracking-tight"${_scopeId}>Team Management</h1><p class="text-slate-500 mt-2"${_scopeId}>Manage members of <span class="font-bold text-slate-700"${_scopeId}>${ssrInterpolate(__props.organization.name)}</span>.</p></div>`);
            if (__props.currentUserRole !== "member") {
              _push2(`<button class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg> Invite Member </button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"${_scopeId}><div class="p-8 border-b border-slate-100 bg-slate-50/50"${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>Active Members</h2></div><div class="divide-y divide-slate-100"${_scopeId}><!--[-->`);
            ssrRenderList(__props.members, (member) => {
              _push2(`<div class="p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden"${_scopeId}>`);
              if (member.avatar_url) {
                _push2(`<img${ssrRenderAttr("src", member.avatar_url)}${ssrRenderAttr("alt", member.name)} class="w-full h-full object-cover"${_scopeId}>`);
              } else {
                _push2(`<span${_scopeId}>${ssrInterpolate(member.name.charAt(0))}</span>`);
              }
              _push2(`</div><div${_scopeId}><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(member.name)}</p><p class="text-sm text-slate-500"${_scopeId}>${ssrInterpolate(member.email)}</p></div></div><div class="flex items-center gap-6"${_scopeId}><div class="flex flex-col items-end"${_scopeId}><span class="${ssrRenderClass([{
                "bg-purple-100 text-purple-700": member.role === "owner",
                "bg-blue-100 text-blue-700": member.role === "admin",
                "bg-slate-100 text-slate-600": member.role === "member"
              }, "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"])}"${_scopeId}>${ssrInterpolate(member.role)}</span></div>`);
              if (__props.currentUserRole === "owner" && member.id !== _ctx.$page.props.auth.user.id) {
                _push2(`<div class="relative"${_scopeId}><button class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-standard" title="Remove Member"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            });
            _push2(`<!--]--></div></div>`);
            if (__props.invitations.length > 0) {
              _push2(`<div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"${_scopeId}><div class="p-8 border-b border-slate-100 bg-slate-50/50"${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>Pending Invitations</h2></div><div class="divide-y divide-slate-100"${_scopeId}><!--[-->`);
              ssrRenderList(__props.invitations, (invite) => {
                _push2(`<div class="p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(invite.email)}</p><p class="text-sm text-slate-500"${_scopeId}>Invited as <span class="font-semibold text-slate-700"${_scopeId}>${ssrInterpolate(invite.role)}</span></p></div></div><button class="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"${_scopeId}> Revoke </button></div>`);
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showInviteModal.value) {
              _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"${_scopeId}><div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"${_scopeId}><h3 class="text-2xl font-bold text-slate-900 mb-6"${_scopeId}>Invite Team Member</h3><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Email Address</label><input${ssrRenderAttr("value", unref(inviteForm).email)} type="email" placeholder="colleague@example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(inviteForm).errors.email) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(inviteForm).errors.email)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Role</label><select class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium bg-white"${_scopeId}><option value="member"${ssrIncludeBooleanAttr(Array.isArray(unref(inviteForm).role) ? ssrLooseContain(unref(inviteForm).role, "member") : ssrLooseEqual(unref(inviteForm).role, "member")) ? " selected" : ""}${_scopeId}>Member (Read/Write)</option><option value="admin"${ssrIncludeBooleanAttr(Array.isArray(unref(inviteForm).role) ? ssrLooseContain(unref(inviteForm).role, "admin") : ssrLooseEqual(unref(inviteForm).role, "admin")) ? " selected" : ""}${_scopeId}>Admin (Manage Users)</option></select></div><div class="flex gap-4 pt-2"${_scopeId}><button type="button" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"${_scopeId}> Cancel </button><button type="submit"${ssrIncludeBooleanAttr(unref(inviteForm).processing) ? " disabled" : ""} class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70"${_scopeId}> Send Invite </button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-5xl mx-auto space-y-8" }, [
                createVNode("div", { class: "flex justify-between items-end" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-bold text-slate-900 tracking-tight" }, "Team Management"),
                    createVNode("p", { class: "text-slate-500 mt-2" }, [
                      createTextVNode("Manage members of "),
                      createVNode("span", { class: "font-bold text-slate-700" }, toDisplayString(__props.organization.name), 1),
                      createTextVNode(".")
                    ])
                  ]),
                  __props.currentUserRole !== "member" ? (openBlock(), createBlock("button", {
                    key: 0,
                    onClick: ($event) => showInviteModal.value = true,
                    class: "bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
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
                        d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                      })
                    ])),
                    createTextVNode(" Invite Member ")
                  ], 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden" }, [
                  createVNode("div", { class: "p-8 border-b border-slate-100 bg-slate-50/50" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Active Members")
                  ]),
                  createVNode("div", { class: "divide-y divide-slate-100" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.members, (member) => {
                      return openBlock(), createBlock("div", {
                        key: member.id,
                        class: "p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard"
                      }, [
                        createVNode("div", { class: "flex items-center gap-4" }, [
                          createVNode("div", { class: "w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden" }, [
                            member.avatar_url ? (openBlock(), createBlock("img", {
                              key: 0,
                              src: member.avatar_url,
                              alt: member.name,
                              class: "w-full h-full object-cover"
                            }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(member.name.charAt(0)), 1))
                          ]),
                          createVNode("div", null, [
                            createVNode("p", { class: "font-bold text-slate-900" }, toDisplayString(member.name), 1),
                            createVNode("p", { class: "text-sm text-slate-500" }, toDisplayString(member.email), 1)
                          ])
                        ]),
                        createVNode("div", { class: "flex items-center gap-6" }, [
                          createVNode("div", { class: "flex flex-col items-end" }, [
                            createVNode("span", {
                              class: ["px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", {
                                "bg-purple-100 text-purple-700": member.role === "owner",
                                "bg-blue-100 text-blue-700": member.role === "admin",
                                "bg-slate-100 text-slate-600": member.role === "member"
                              }]
                            }, toDisplayString(member.role), 3)
                          ]),
                          __props.currentUserRole === "owner" && member.id !== _ctx.$page.props.auth.user.id ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "relative"
                          }, [
                            createVNode("button", {
                              onClick: ($event) => removeMember(member.id),
                              class: "w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-standard",
                              title: "Remove Member"
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
                            ], 8, ["onClick"])
                          ])) : createCommentVNode("", true)
                        ])
                      ]);
                    }), 128))
                  ])
                ]),
                __props.invitations.length > 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"
                }, [
                  createVNode("div", { class: "p-8 border-b border-slate-100 bg-slate-50/50" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Pending Invitations")
                  ]),
                  createVNode("div", { class: "divide-y divide-slate-100" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.invitations, (invite) => {
                      return openBlock(), createBlock("div", {
                        key: invite.id,
                        class: "p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard"
                      }, [
                        createVNode("div", { class: "flex items-center gap-4" }, [
                          createVNode("div", { class: "w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500" }, [
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
                                d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              })
                            ]))
                          ]),
                          createVNode("div", null, [
                            createVNode("p", { class: "font-bold text-slate-900" }, toDisplayString(invite.email), 1),
                            createVNode("p", { class: "text-sm text-slate-500" }, [
                              createTextVNode("Invited as "),
                              createVNode("span", { class: "font-semibold text-slate-700" }, toDisplayString(invite.role), 1)
                            ])
                          ])
                        ]),
                        createVNode("button", {
                          onClick: ($event) => cancelInvite(invite.id),
                          class: "px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        }, " Revoke ", 8, ["onClick"])
                      ]);
                    }), 128))
                  ])
                ])) : createCommentVNode("", true),
                createVNode(Transition, {
                  "enter-active-class": "transition duration-200 ease-out",
                  "enter-from-class": "transform opacity-0 scale-95",
                  "enter-to-class": "transform opacity-100 scale-100",
                  "leave-active-class": "transition duration-75 ease-in",
                  "leave-from-class": "transform opacity-100 scale-100",
                  "leave-to-class": "transform opacity-0 scale-95"
                }, {
                  default: withCtx(() => [
                    showInviteModal.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm",
                      onClick: withModifiers(($event) => showInviteModal.value = false, ["self"])
                    }, [
                      createVNode("div", { class: "bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative" }, [
                        createVNode("h3", { class: "text-2xl font-bold text-slate-900 mb-6" }, "Invite Team Member"),
                        createVNode("form", {
                          onSubmit: withModifiers(submitInvite, ["prevent"]),
                          class: "space-y-6"
                        }, [
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Email Address"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(inviteForm).email = $event,
                              type: "email",
                              placeholder: "colleague@example.com",
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(inviteForm).email]
                            ]),
                            unref(inviteForm).errors.email ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "text-red-500 text-sm font-medium"
                            }, toDisplayString(unref(inviteForm).errors.email), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Role"),
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => unref(inviteForm).role = $event,
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium bg-white"
                            }, [
                              createVNode("option", { value: "member" }, "Member (Read/Write)"),
                              createVNode("option", { value: "admin" }, "Admin (Manage Users)")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, unref(inviteForm).role]
                            ])
                          ]),
                          createVNode("div", { class: "flex gap-4 pt-2" }, [
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => showInviteModal.value = false,
                              class: "flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            }, " Cancel ", 8, ["onClick"]),
                            createVNode("button", {
                              type: "submit",
                              disabled: unref(inviteForm).processing,
                              class: "flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70"
                            }, " Send Invite ", 8, ["disabled"])
                          ])
                        ], 32)
                      ])
                    ], 8, ["onClick"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Team/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
