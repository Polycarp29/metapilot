import { ref, computed, onMounted, mergeProps, withCtx, unref, createVNode, openBlock, createBlock, Fragment, renderList, toDisplayString, withModifiers, withDirectives, vModelText, createCommentVNode, vModelSelect, createTextVNode, Transition, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { usePage, useForm, router } from "@inertiajs/vue3";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import { _ as _sfc_main$2 } from "./ConfirmationModal-EXlnTAwk.js";
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
    currentUserRole: String,
    aiModels: Array,
    analyticsProperties: Array,
    piqueScheduledTasks: Array,
    industries: Array
  },
  setup(__props) {
    const props = __props;
    const page = usePage();
    const authUser = page.props.auth.user;
    const tabs = [
      { id: "general", name: "General" },
      { id: "brand_ai", name: "Brand & AI Context" },
      { id: "account", name: "Account" },
      { id: "ai", name: "AI Configuration" },
      { id: "analytics", name: "Analytics" },
      { id: "schedules", name: "Schedules" },
      { id: "team", name: "Team Members" }
    ];
    const activeTab = ref("general");
    const hasInvalidTokens = computed(
      () => props.analyticsProperties?.some((p) => p.google_token_invalid) ?? false
    );
    onMounted(() => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && tabs.find((t) => t.id === tab)) {
        activeTab.value = tab;
      }
    });
    const showInviteModal = ref(false);
    const showEditPropertyModal = ref(false);
    const editingProperty = ref(null);
    const showConfirmModal = ref(false);
    const confirmTitle = ref("");
    const confirmMessage = ref("");
    const confirmAction = ref(null);
    const confirmButtonText = ref("Confirm");
    const orgForm = useForm({
      name: props.organization.name,
      keyword_discovery_frequency: props.organization.keyword_discovery_frequency || 24,
      settings: {
        ai_model: props.organization.settings?.ai_model || "gpt-4",
        ai_insights_enabled: props.organization.settings?.ai_insights_enabled !== false,
        industry: props.organization.settings?.industry || "",
        business_profile: {
          target_audience: props.organization.settings?.business_profile?.target_audience || "",
          value_proposition: props.organization.settings?.business_profile?.value_proposition || "",
          competitors: props.organization.settings?.business_profile?.competitors || ""
        },
        analytics_period: props.organization.settings?.analytics_period || "30d",
        notifications_enabled: props.organization.settings?.notifications_enabled || false
      }
    });
    const propertyForm = useForm({
      name: "",
      property_id: "",
      website_url: "",
      gsc_site_url: ""
    });
    const editPropertyForm = useForm({
      name: "",
      gsc_site_url: ""
    });
    const inviteForm = useForm({
      email: "",
      role: "member"
    });
    const profileForm = useForm({
      name: authUser.name,
      email: authUser.email
    });
    const passwordForm = useForm({
      current_password: "",
      password: "",
      password_confirmation: ""
    });
    const updateOrganization = () => {
      orgForm.put(route("organization.update"), {
        preserveScroll: true
      });
    };
    const updateProfileInformation = () => {
      profileForm.patch(route("profile.update"), {
        preserveScroll: true
      });
    };
    const updatePassword = () => {
      passwordForm.put(route("password.update"), {
        preserveScroll: true,
        onSuccess: () => passwordForm.reset(),
        onError: () => {
          if (passwordForm.errors.password) {
            passwordForm.reset("password", "password_confirmation");
          }
          if (passwordForm.errors.current_password) {
            passwordForm.reset("current_password");
          }
        }
      });
    };
    const addProperty = () => {
      propertyForm.post(route("analytics.properties.store"), {
        onSuccess: () => propertyForm.reset(),
        preserveScroll: true
      });
    };
    const disconnectProperty = (id) => {
      openConfirmModal(
        "Disconnect GA4 Property",
        "Are you sure you want to disconnect this GA4 property? Historical data will remain but no new data will be fetched.",
        () => router.delete(route("analytics.properties.destroy", id)),
        "Disconnect Property"
      );
    };
    const editProperty = (property) => {
      editingProperty.value = property;
      editPropertyForm.name = property.name;
      editPropertyForm.gsc_site_url = property.gsc_site_url || "";
      showEditPropertyModal.value = true;
    };
    const submitEditProperty = () => {
      editPropertyForm.put(route("analytics.properties.update", editingProperty.value.id), {
        preserveScroll: true,
        onSuccess: () => {
          showEditPropertyModal.value = false;
          editPropertyForm.reset();
          editingProperty.value = null;
        }
      });
    };
    const submitInvite = () => {
      inviteForm.post(route("team-invitations.store"), {
        onSuccess: () => {
          showInviteModal.value = false;
          inviteForm.reset();
        }
      });
    };
    const openConfirmModal = (title, message, action, buttonText = "Confirm") => {
      confirmTitle.value = title;
      confirmMessage.value = message;
      confirmAction.value = action;
      confirmButtonText.value = buttonText;
      showConfirmModal.value = true;
    };
    const executeConfirm = () => {
      if (confirmAction.value) {
        confirmAction.value();
      }
      showConfirmModal.value = false;
    };
    const removeMember = (id) => {
      openConfirmModal(
        "Remove Team Member",
        "Are you sure you want to remove this member from the organization? They will lose access immediately.",
        () => router.delete(route("team-members.destroy", id)),
        "Remove Member"
      );
    };
    const cancelInvite = (id) => {
      openConfirmModal(
        "Revoke Invitation",
        "Are you sure you want to revoke this invitation? The link sent to the user will become invalid.",
        () => router.delete(route("team-invitations.destroy", id)),
        "Revoke Invitation"
      );
    };
    const toggleSchedule = (id) => {
      router.patch(route("api.pique.schedules.toggle", id), {}, {
        preserveScroll: true
      });
    };
    const deleteSchedule = (id) => {
      openConfirmModal(
        "Delete AI Schedule",
        "Are you sure you want to remove this automated task? This cannot be undone.",
        () => router.delete(route("api.pique.schedules.destroy", id)),
        "Delete Schedule"
      );
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Organization Settings" }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-5xl mx-auto space-y-8"${_scopeId}><div class="border-b border-slate-200 pb-5"${_scopeId}><h1 class="text-3xl font-bold text-slate-900 tracking-tight"${_scopeId}>Settings</h1><p class="text-slate-500 mt-2"${_scopeId}>Manage your workspace configuration, personal account, and team members.</p></div><div class="flex flex-wrap gap-1 bg-slate-100/50 p-1.5 rounded-xl w-fit max-w-full"${_scopeId}><!--[-->`);
            ssrRenderList(tabs, (tab) => {
              _push2(`<button class="${ssrRenderClass([activeTab.value === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50", "px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap"])}"${_scopeId}>${ssrInterpolate(tab.name)}</button>`);
            });
            _push2(`<!--]--></div>`);
            if (activeTab.value === "general") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><h2 class="text-xl font-bold text-slate-900 mb-6"${_scopeId}>Workspace Details</h2><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Organization Name</label><input${ssrRenderAttr("value", unref(orgForm).name)} type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(orgForm).errors.name) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(orgForm).errors.name)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex justify-end"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(orgForm).processing) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"${_scopeId}> Save Changes </button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "brand_ai") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><div class="flex items-start justify-between mb-8"${_scopeId}><div${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>Brand &amp; AI Context</h2><p class="text-slate-500 mt-1"${_scopeId}>Provide details about your business to help AI generate more accurate recommendations.</p></div><div class="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"${_scopeId}> AI Knowledge Base </div></div><form class="space-y-6"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Industry / Niche</label><select class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium appearance-none bg-white"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.industry) ? ssrLooseContain(unref(orgForm).settings.industry, "") : ssrLooseEqual(unref(orgForm).settings.industry, "")) ? " selected" : ""}${_scopeId}>Select an Industry</option><!--[-->`);
              ssrRenderList(__props.industries, (industry) => {
                _push2(`<option${ssrRenderAttr("value", industry.slug)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.industry) ? ssrLooseContain(unref(orgForm).settings.industry, industry.slug) : ssrLooseEqual(unref(orgForm).settings.industry, industry.slug)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(industry.name)}</option>`);
              });
              _push2(`<!--]--><option value="other"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.industry) ? ssrLooseContain(unref(orgForm).settings.industry, "other") : ssrLooseEqual(unref(orgForm).settings.industry, "other")) ? " selected" : ""}${_scopeId}>Other / General</option></select>`);
              if (unref(orgForm).errors["settings.industry"]) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(orgForm).errors["settings.industry"])}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Target Audience</label><input${ssrRenderAttr("value", unref(orgForm).settings.business_profile.target_audience)} type="text" placeholder="e.g. Small business owners in Florida" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(orgForm).errors["settings.business_profile.target_audience"]) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(orgForm).errors["settings.business_profile.target_audience"])}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Unique Value Proposition</label><textarea rows="3" placeholder="What makes your business different? e.g. Fastest delivery, eco-friendly materials, 24/7 support." class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium resize-none"${_scopeId}>${ssrInterpolate(unref(orgForm).settings.business_profile.value_proposition)}</textarea>`);
              if (unref(orgForm).errors["settings.business_profile.value_proposition"]) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(orgForm).errors["settings.business_profile.value_proposition"])}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><textarea rows="2" placeholder="List main competitors to help AI understand your market positioning." class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium resize-none"${_scopeId}>${ssrInterpolate(unref(orgForm).settings.business_profile.competitors)}</textarea>`);
              if (unref(orgForm).errors["settings.business_profile.competitors"]) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(orgForm).errors["settings.business_profile.competitors"])}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex justify-end pt-4 border-t border-slate-100"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(orgForm).processing) ? " disabled" : ""} class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70"${_scopeId}> Save Context </button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "account") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><h2 class="text-xl font-bold text-slate-900 mb-6"${_scopeId}>Profile Information</h2><form class="space-y-6"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Name</label><input${ssrRenderAttr("value", unref(profileForm).name)} type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(profileForm).errors.name) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(profileForm).errors.name)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Email</label><input${ssrRenderAttr("value", unref(profileForm).email)} type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(profileForm).errors.email) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(profileForm).errors.email)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="flex justify-end"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(profileForm).processing) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"${_scopeId}>Save Profile</button></div></form></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><h2 class="text-xl font-bold text-slate-900 mb-6"${_scopeId}>Update Password</h2><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Current Password</label><input${ssrRenderAttr("value", unref(passwordForm).current_password)} type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(passwordForm).errors.current_password) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(passwordForm).errors.current_password)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>New Password</label><input${ssrRenderAttr("value", unref(passwordForm).password)} type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(passwordForm).errors.password) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(passwordForm).errors.password)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Confirm Password</label><input${ssrRenderAttr("value", unref(passwordForm).password_confirmation)} type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}></div></div><div class="flex justify-end"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(passwordForm).processing) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"${_scopeId}>Update Password</button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "ai") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><div class="flex items-center gap-4 mb-6"${_scopeId}><div class="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"${_scopeId}></path></svg></div><div${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>AI Configuration</h2><p class="text-sm text-slate-500"${_scopeId}>System-wide AI settings are managed by administrators.</p></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8"${_scopeId}><div class="space-y-4"${_scopeId}><label class="block font-bold text-slate-700"${_scopeId}>Generative AI Model</label><div class="relative"${_scopeId}><select class="w-full bg-slate-50 border-slate-200 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"${_scopeId}>`);
              if (__props.aiModels && __props.aiModels.length) {
                _push2(`<!--[-->`);
                ssrRenderList(__props.aiModels, (model) => {
                  _push2(`<option${ssrRenderAttr("value", model.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.ai_model) ? ssrLooseContain(unref(orgForm).settings.ai_model, model.id) : ssrLooseEqual(unref(orgForm).settings.ai_model, model.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(model.name)}</option>`);
                });
                _push2(`<!--]-->`);
              } else {
                _push2(`<!--[--><option value="gpt-4o"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.ai_model) ? ssrLooseContain(unref(orgForm).settings.ai_model, "gpt-4o") : ssrLooseEqual(unref(orgForm).settings.ai_model, "gpt-4o")) ? " selected" : ""}${_scopeId}>GPT-4o</option><option value="gpt-4"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.ai_model) ? ssrLooseContain(unref(orgForm).settings.ai_model, "gpt-4") : ssrLooseEqual(unref(orgForm).settings.ai_model, "gpt-4")) ? " selected" : ""}${_scopeId}>GPT-4</option><option value="gpt-3.5-turbo"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.ai_model) ? ssrLooseContain(unref(orgForm).settings.ai_model, "gpt-3.5-turbo") : ssrLooseEqual(unref(orgForm).settings.ai_model, "gpt-3.5-turbo")) ? " selected" : ""}${_scopeId}>GPT-3.5 Turbo</option><!--]-->`);
              }
              _push2(`</select><div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><p class="text-sm text-slate-500"${_scopeId}>Select the underlying intelligence engine for your automated schema analysis. &#39;User Based&#39; configuration applies to this entire organization.</p></div><div class="space-y-4 pt-6 border-t border-slate-100"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div${_scopeId}><p class="font-bold text-slate-900 text-lg"${_scopeId}>Enable AI Insights</p><p class="text-sm text-slate-500"${_scopeId}>Automatically generate SEO performance summaries and keyword strategies.</p></div><button type="button" class="${ssrRenderClass([unref(orgForm).settings.ai_insights_enabled ? "bg-purple-600" : "bg-slate-200", "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"])}"${_scopeId}><span class="${ssrRenderClass([unref(orgForm).settings.ai_insights_enabled ? "translate-x-5" : "translate-x-0", "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"])}"${_scopeId}></span></button></div></div><div class="space-y-4 pt-6 border-t border-slate-100"${_scopeId}><label class="block font-bold text-slate-700"${_scopeId}>Keyword Discovery Frequency</label><div class="relative"${_scopeId}><select class="w-full bg-slate-50 border-slate-200 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"${_scopeId}><option${ssrRenderAttr("value", 3)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).keyword_discovery_frequency) ? ssrLooseContain(unref(orgForm).keyword_discovery_frequency, 3) : ssrLooseEqual(unref(orgForm).keyword_discovery_frequency, 3)) ? " selected" : ""}${_scopeId}>Every 3 hours</option><option${ssrRenderAttr("value", 6)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).keyword_discovery_frequency) ? ssrLooseContain(unref(orgForm).keyword_discovery_frequency, 6) : ssrLooseEqual(unref(orgForm).keyword_discovery_frequency, 6)) ? " selected" : ""}${_scopeId}>Every 6 hours</option><option${ssrRenderAttr("value", 12)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).keyword_discovery_frequency) ? ssrLooseContain(unref(orgForm).keyword_discovery_frequency, 12) : ssrLooseEqual(unref(orgForm).keyword_discovery_frequency, 12)) ? " selected" : ""}${_scopeId}>Every 12 hours</option><option${ssrRenderAttr("value", 24)}${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).keyword_discovery_frequency) ? ssrLooseContain(unref(orgForm).keyword_discovery_frequency, 24) : ssrLooseEqual(unref(orgForm).keyword_discovery_frequency, 24)) ? " selected" : ""}${_scopeId}>Every 24 hours (Daily)</option></select><div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><p class="text-sm text-slate-500"${_scopeId}>Determine how often the Smart Engine should scan for new trending keywords tailored to your niche.</p></div><div class="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4"${_scopeId}><div class="text-blue-500 shrink-0"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><p class="text-sm text-blue-800 leading-relaxed"${_scopeId}><strong${_scopeId}>Note:</strong> This setting controls the analysis phase logic. AI Insights require an active OpenAI API key to be configured in the system environment. </p></div><div class="pt-4 flex justify-end"${_scopeId}><button${ssrIncludeBooleanAttr(unref(orgForm).processing) ? " disabled" : ""} class="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-standard shadow-lg active:scale-95 disabled:opacity-50"${_scopeId}>${ssrInterpolate(unref(orgForm).processing ? "Saving..." : "Save Configuration")}</button></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "analytics") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><div class="flex items-center gap-4 mb-6"${_scopeId}><div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"${_scopeId}></path></svg></div><div${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>Analytics Settings</h2><p class="text-sm text-slate-500"${_scopeId}>Configure how data is reported in your dashboard.</p></div></div><div class="space-y-10"${_scopeId}><div class="p-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50"${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"${_scopeId}><div${_scopeId}><h3 class="text-lg font-bold text-slate-900"${_scopeId}>Connect GA4 Property</h3><p class="text-sm text-slate-500 mt-1"${_scopeId}>Link your website&#39;s analytics data to track performance.</p></div><a${ssrRenderAttr("href", _ctx.route("auth.google", { intent: "connect" }))} class="flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold hover:shadow-md hover:border-blue-200 transition-all text-sm shrink-0"${_scopeId}><img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-5 h-5" alt="Google"${_scopeId}> Connect Google Account </a></div>`);
              if (_ctx.$page.props.flash.success) {
                _push2(`<div class="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-medium text-sm flex items-center gap-3"${_scopeId}><svg class="w-5 h-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg> ${ssrInterpolate(_ctx.$page.props.flash.success)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (_ctx.$page.props.flash.message) {
                _push2(`<div class="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium text-sm"${_scopeId}>${ssrInterpolate(_ctx.$page.props.flash.message)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (hasInvalidTokens.value) {
                _push2(`<div class="mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-medium text-sm flex items-start gap-3"${_scopeId}><svg class="w-5 h-5 shrink-0 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="font-bold"${_scopeId}>Google connection expired</p><p class="mt-0.5"${_scopeId}>One or more of your GA4 properties can&#39;t connect to Google. Please reconnect your Google account to restore analytics data.</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<form class="flex flex-col gap-5"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-5"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Display Name</label><input${ssrRenderAttr("value", unref(propertyForm).name)} type="text" placeholder="e.g. My Main Site" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"${_scopeId}></div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>GA4 Property ID</label><input${ssrRenderAttr("value", unref(propertyForm).property_id)} type="text" placeholder="e.g. 123456789" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"${_scopeId}></div></div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Website URL</label><input${ssrRenderAttr("value", unref(propertyForm).website_url)} type="url" placeholder="https://example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"${_scopeId}></div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Search Console Site URL</label><input${ssrRenderAttr("value", unref(propertyForm).gsc_site_url)} type="text" placeholder="sc-domain:example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"${_scopeId}></div><div class="flex justify-end pt-2"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(propertyForm).processing) ? " disabled" : ""} class="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"${_scopeId}>${ssrInterpolate(unref(propertyForm).processing ? "Connecting..." : "Connect Property")}</button></div></form></div><div class="space-y-6"${_scopeId}><div class="flex items-center justify-between px-2"${_scopeId}><h3 class="text-lg font-bold text-slate-900"${_scopeId}>Connected GA4 Properties</h3><span class="text-xs font-bold text-slate-400 uppercase tracking-widest"${_scopeId}>${ssrInterpolate(__props.analyticsProperties.length)} Properties</span></div>`);
              if (__props.analyticsProperties.length) {
                _push2(`<div class="grid grid-cols-1 gap-4"${_scopeId}><!--[-->`);
                ssrRenderList(__props.analyticsProperties, (prop) => {
                  _push2(`<div class="${ssrRenderClass([prop.google_token_invalid ? "border-amber-300 bg-amber-50/30" : "border-slate-100 hover:border-blue-500/30", "p-4 md:p-6 bg-white rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"])}"${_scopeId}><div class="flex items-start md:items-center gap-4 md:gap-5"${_scopeId}><div class="${ssrRenderClass([prop.google_token_invalid ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400", "w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center"])}"${_scopeId}>`);
                  if (prop.google_token_invalid) {
                    _push2(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"${_scopeId}></path></svg>`);
                  }
                  _push2(`</div><div class="min-w-0"${_scopeId}><p class="font-bold text-slate-900 truncate"${_scopeId}>${ssrInterpolate(prop.name)}</p><p class="text-sm text-slate-400 font-medium truncate"${_scopeId}>GA4: ${ssrInterpolate(prop.property_id)} • GSC: ${ssrInterpolate(prop.gsc_site_url || "Not set")}</p><p class="text-xs text-slate-400 break-all"${_scopeId}>${ssrInterpolate(prop.website_url)}</p>`);
                  if (prop.google_token_invalid) {
                    _push2(`<span class="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"${_scopeId}><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"${_scopeId}></path></svg> Token expired — reconnect required </span>`);
                  } else if (prop.has_google_token) {
                    _push2(`<span class="inline-flex items-center gap-1 mt-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"${_scopeId}><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"${_scopeId}></path></svg> Google connected </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div><div class="flex items-center gap-4 md:gap-6 pt-3 md:pt-0 border-t md:border-0 border-slate-50 justify-end md:justify-start"${_scopeId}>`);
                  if (prop.google_token_invalid) {
                    _push2(`<a${ssrRenderAttr("href", _ctx.route("auth.google", { intent: "connect" }))} class="flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-bold text-sm transition-colors bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg"${_scopeId}><img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-4 h-4" alt="Google"${_scopeId}> Reconnect </a>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<button class="text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors"${_scopeId}>Edit</button><button class="text-slate-400 hover:text-red-600 font-bold text-sm transition-colors"${_scopeId}>Disconnect</button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<div class="text-center py-12 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"${_scopeId}><p class="text-slate-500 font-medium"${_scopeId}>No properties connected yet.</p></div>`);
              }
              _push2(`</div><div class="pt-10 border-t border-slate-100"${_scopeId}><h3 class="text-lg font-bold text-slate-900 mb-6"${_scopeId}>General Preferences</h3><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Default Reporting Period</label><select class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-standard outline-none font-medium"${_scopeId}><option value="7d"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.analytics_period) ? ssrLooseContain(unref(orgForm).settings.analytics_period, "7d") : ssrLooseEqual(unref(orgForm).settings.analytics_period, "7d")) ? " selected" : ""}${_scopeId}>Last 7 Days</option><option value="30d"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.analytics_period) ? ssrLooseContain(unref(orgForm).settings.analytics_period, "30d") : ssrLooseEqual(unref(orgForm).settings.analytics_period, "30d")) ? " selected" : ""}${_scopeId}>Last 30 Days</option><option value="90d"${ssrIncludeBooleanAttr(Array.isArray(unref(orgForm).settings.analytics_period) ? ssrLooseContain(unref(orgForm).settings.analytics_period, "90d") : ssrLooseEqual(unref(orgForm).settings.analytics_period, "90d")) ? " selected" : ""}${_scopeId}>Last 90 Days</option></select></div><div class="space-y-4 pt-4 border-t border-slate-100"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div${_scopeId}><p class="font-bold text-slate-900"${_scopeId}>Weekly Email Reports</p><p class="text-sm text-slate-500"${_scopeId}>Receive a summary of your schema performance every Monday.</p></div><button type="button" class="${ssrRenderClass([unref(orgForm).settings.notifications_enabled ? "bg-blue-600" : "bg-slate-200", "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"])}"${_scopeId}><span class="${ssrRenderClass([unref(orgForm).settings.notifications_enabled ? "translate-x-5" : "translate-x-0", "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"])}"${_scopeId}></span></button></div></div><div class="flex justify-end"${_scopeId}><button type="submit"${ssrIncludeBooleanAttr(unref(orgForm).processing) ? " disabled" : ""} class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"${_scopeId}>Save Preferences</button></div></form></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "schedules") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8"${_scopeId}><div class="flex items-center gap-4 mb-8"${_scopeId}><div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"${_scopeId}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><div${_scopeId}><h2 class="text-xl font-bold text-slate-900"${_scopeId}>AI Schedules</h2><p class="text-sm text-slate-500"${_scopeId}>Manage your automated AI tasks, alerts, and periodic reports.</p></div></div>`);
              if (__props.piqueScheduledTasks.length) {
                _push2(`<div class="grid grid-cols-1 gap-4"${_scopeId}><!--[-->`);
                ssrRenderList(__props.piqueScheduledTasks, (task) => {
                  _push2(`<div class="group bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-slate-100"${_scopeId}><div class="flex items-center gap-5"${_scopeId}><div class="${ssrRenderClass([task.is_active ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400", "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"])}"${_scopeId}>`);
                  if (task.task_type === "crawl") {
                    _push2(`<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"${_scopeId}></path></svg>`);
                  }
                  _push2(`</div><div${_scopeId}><div class="flex items-center gap-2"${_scopeId}><h3 class="font-bold text-slate-900 text-lg capitalize"${_scopeId}>${ssrInterpolate(task.task_type)}</h3><span class="${ssrRenderClass([task.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500", "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"])}"${_scopeId}>${ssrInterpolate(task.is_active ? "Active" : "Paused")}</span></div><p class="text-sm text-slate-500 font-medium"${_scopeId}>Frequency: <span class="text-slate-900 font-bold capitalize"${_scopeId}>${ssrInterpolate(task.frequency)}</span></p><p class="text-xs text-slate-400 mt-1"${_scopeId}>Next Run: <span class="text-slate-600 font-bold"${_scopeId}>${ssrInterpolate(task.next_run_at || "Never")}</span></p></div></div><div class="flex items-center gap-4 justify-end"${_scopeId}><button class="${ssrRenderClass([task.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-blue-200 text-blue-700 hover:bg-blue-50", "px-4 py-2 rounded-xl text-sm font-bold transition-all border"])}"${_scopeId}>${ssrInterpolate(task.is_active ? "Pause" : "Resume")}</button><button class="px-4 py-2 rounded-xl text-sm font-bold border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all"${_scopeId}> Delete </button></div></div>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<div class="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200"${_scopeId}><div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"${_scopeId}><svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"${_scopeId}></path></svg></div><h3 class="text-xl font-bold text-slate-900 mb-2"${_scopeId}>No active schedules</h3><p class="text-slate-500 max-w-sm mx-auto"${_scopeId}>You can ask Pique to schedule weekly crawls or set up automated alerts in the chat interface.</p></div>`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "team") {
              _push2(`<div class="space-y-6 animate-fade-in"${_scopeId}><div class="flex justify-between items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100"${_scopeId}><div${_scopeId}><h3 class="font-bold text-blue-900"${_scopeId}>Invite Team Members</h3><p class="text-sm text-blue-700"${_scopeId}>Add colleagues to collaborate on schemas.</p></div><button class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg> Invite Member </button></div><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"${_scopeId}><div class="divide-y divide-slate-100"${_scopeId}><!--[-->`);
              ssrRenderList(__props.members, (member) => {
                _push2(`<div class="p-6 flex items-center justify-between group hover:bg-slate-50 transition-standard"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden"${_scopeId}>`);
                if (member.avatar_url) {
                  _push2(`<img${ssrRenderAttr("src", member.avatar_url)}${ssrRenderAttr("alt", member.name)} class="w-full h-full object-cover"${_scopeId}>`);
                } else {
                  _push2(`<span${_scopeId}>${ssrInterpolate(member.name.charAt(0))}</span>`);
                }
                _push2(`</div><div${_scopeId}><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(member.name)}</p><p class="text-sm text-slate-500"${_scopeId}>${ssrInterpolate(member.email)}</p></div></div><div class="flex items-center gap-4"${_scopeId}><span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600"${_scopeId}>${ssrInterpolate(member.role)}</span>`);
                if (__props.currentUserRole === "owner" && member.id !== _ctx.$page.props.auth.user.id) {
                  _push2(`<button class="text-slate-400 hover:text-red-600 transition-colors p-2"${_scopeId}> Remove </button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              });
              _push2(`<!--]--></div></div>`);
              if (__props.invitations.length > 0) {
                _push2(`<div${_scopeId}><h3 class="text-lg font-bold text-slate-900 mb-4 ml-2"${_scopeId}>Pending Invitations</h3><div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden"${_scopeId}><div class="divide-y divide-slate-100"${_scopeId}><!--[-->`);
                ssrRenderList(__props.invitations, (invite) => {
                  _push2(`<div class="p-6 flex items-center justify-between"${_scopeId}><div${_scopeId}><p class="font-bold text-slate-900"${_scopeId}>${ssrInterpolate(invite.email)}</p><p class="text-sm text-slate-500"${_scopeId}>Role: ${ssrInterpolate(invite.role)}</p></div><button class="text-red-600 font-bold text-sm hover:underline"${_scopeId}>Revoke</button></div>`);
                });
                _push2(`<!--]--></div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showInviteModal.value) {
              _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"${_scopeId}><div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"${_scopeId}><h3 class="text-2xl font-bold text-slate-900 mb-6"${_scopeId}>Invite Team Member</h3><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Email Address</label><input${ssrRenderAttr("value", unref(inviteForm).email)} type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(inviteForm).errors.email) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(inviteForm).errors.email)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Role</label><select class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"${_scopeId}><option value="member"${ssrIncludeBooleanAttr(Array.isArray(unref(inviteForm).role) ? ssrLooseContain(unref(inviteForm).role, "member") : ssrLooseEqual(unref(inviteForm).role, "member")) ? " selected" : ""}${_scopeId}>Member</option><option value="admin"${ssrIncludeBooleanAttr(Array.isArray(unref(inviteForm).role) ? ssrLooseContain(unref(inviteForm).role, "admin") : ssrLooseEqual(unref(inviteForm).role, "admin")) ? " selected" : ""}${_scopeId}>Admin</option></select></div><div class="flex gap-4 pt-2"${_scopeId}><button type="button" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100"${_scopeId}>Cancel</button><button type="submit"${ssrIncludeBooleanAttr(unref(inviteForm).processing) ? " disabled" : ""} class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20"${_scopeId}>Send Invite</button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showEditPropertyModal.value) {
              _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"${_scopeId}><div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"${_scopeId}><h3 class="text-2xl font-bold text-slate-900 mb-6"${_scopeId}>Edit Property</h3><form class="space-y-6"${_scopeId}><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Property Name</label><input${ssrRenderAttr("value", unref(editPropertyForm).name)} type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(editPropertyForm).errors.name) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(editPropertyForm).errors.name)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-2"${_scopeId}><label class="text-sm font-bold text-slate-700"${_scopeId}>Search Console Site URL</label><input${ssrRenderAttr("value", unref(editPropertyForm).gsc_site_url)} type="text" placeholder="https://www.example.com/ or sc-domain:example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"${_scopeId}>`);
              if (unref(editPropertyForm).errors.gsc_site_url) {
                _push2(`<div class="text-red-500 text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(editPropertyForm).errors.gsc_site_url)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<p class="text-xs text-slate-500"${_scopeId}>Copy the property URL exactly as shown in Google Search Console.</p></div><div class="flex gap-4 pt-2"${_scopeId}><button type="button" class="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100"${_scopeId}>Cancel</button><button type="submit"${ssrIncludeBooleanAttr(unref(editPropertyForm).processing) ? " disabled" : ""} class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20"${_scopeId}>Save Changes</button></div></form></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_sfc_main$2, {
              show: showConfirmModal.value,
              title: confirmTitle.value,
              message: confirmMessage.value,
              "confirm-text": confirmButtonText.value,
              onClose: ($event) => showConfirmModal.value = false,
              onConfirm: executeConfirm
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "max-w-5xl mx-auto space-y-8" }, [
                createVNode("div", { class: "border-b border-slate-200 pb-5" }, [
                  createVNode("h1", { class: "text-3xl font-bold text-slate-900 tracking-tight" }, "Settings"),
                  createVNode("p", { class: "text-slate-500 mt-2" }, "Manage your workspace configuration, personal account, and team members.")
                ]),
                createVNode("div", { class: "flex flex-wrap gap-1 bg-slate-100/50 p-1.5 rounded-xl w-fit max-w-full" }, [
                  (openBlock(), createBlock(Fragment, null, renderList(tabs, (tab) => {
                    return createVNode("button", {
                      key: tab.id,
                      onClick: ($event) => activeTab.value = tab.id,
                      class: ["px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap", activeTab.value === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"]
                    }, toDisplayString(tab.name), 11, ["onClick"]);
                  }), 64))
                ]),
                activeTab.value === "general" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900 mb-6" }, "Workspace Details"),
                    createVNode("form", {
                      onSubmit: withModifiers(updateOrganization, ["prevent"]),
                      class: "space-y-6"
                    }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Organization Name"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(orgForm).name = $event,
                          type: "text",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(orgForm).name]
                        ]),
                        unref(orgForm).errors.name ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(orgForm).errors.name), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "flex justify-end" }, [
                        createVNode("button", {
                          type: "submit",
                          disabled: unref(orgForm).processing,
                          class: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"
                        }, " Save Changes ", 8, ["disabled"])
                      ])
                    ], 32)
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "brand_ai" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("div", { class: "flex items-start justify-between mb-8" }, [
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Brand & AI Context"),
                        createVNode("p", { class: "text-slate-500 mt-1" }, "Provide details about your business to help AI generate more accurate recommendations.")
                      ]),
                      createVNode("div", { class: "bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider" }, " AI Knowledge Base ")
                    ]),
                    createVNode("form", {
                      onSubmit: withModifiers(updateOrganization, ["prevent"]),
                      class: "space-y-6"
                    }, [
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Industry / Niche"),
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(orgForm).settings.industry = $event,
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium appearance-none bg-white"
                          }, [
                            createVNode("option", { value: "" }, "Select an Industry"),
                            (openBlock(true), createBlock(Fragment, null, renderList(__props.industries, (industry) => {
                              return openBlock(), createBlock("option", {
                                key: industry.slug,
                                value: industry.slug
                              }, toDisplayString(industry.name), 9, ["value"]);
                            }), 128)),
                            createVNode("option", { value: "other" }, "Other / General")
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(orgForm).settings.industry]
                          ]),
                          unref(orgForm).errors["settings.industry"] ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(orgForm).errors["settings.industry"]), 1)) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Target Audience"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(orgForm).settings.business_profile.target_audience = $event,
                            type: "text",
                            placeholder: "e.g. Small business owners in Florida",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(orgForm).settings.business_profile.target_audience]
                          ]),
                          unref(orgForm).errors["settings.business_profile.target_audience"] ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(orgForm).errors["settings.business_profile.target_audience"]), 1)) : createCommentVNode("", true)
                        ])
                      ]),
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Unique Value Proposition"),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(orgForm).settings.business_profile.value_proposition = $event,
                          rows: "3",
                          placeholder: "What makes your business different? e.g. Fastest delivery, eco-friendly materials, 24/7 support.",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium resize-none"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(orgForm).settings.business_profile.value_proposition]
                        ]),
                        unref(orgForm).errors["settings.business_profile.value_proposition"] ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(orgForm).errors["settings.business_profile.value_proposition"]), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "space-y-2" }, [
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => unref(orgForm).settings.business_profile.competitors = $event,
                          rows: "2",
                          placeholder: "List main competitors to help AI understand your market positioning.",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium resize-none"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(orgForm).settings.business_profile.competitors]
                        ]),
                        unref(orgForm).errors["settings.business_profile.competitors"] ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(orgForm).errors["settings.business_profile.competitors"]), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "flex justify-end pt-4 border-t border-slate-100" }, [
                        createVNode("button", {
                          type: "submit",
                          disabled: unref(orgForm).processing,
                          class: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70"
                        }, " Save Context ", 8, ["disabled"])
                      ])
                    ], 32)
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "account" ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900 mb-6" }, "Profile Information"),
                    createVNode("form", {
                      onSubmit: withModifiers(updateProfileInformation, ["prevent"]),
                      class: "space-y-6"
                    }, [
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Name"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(profileForm).name = $event,
                            type: "text",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(profileForm).name]
                          ]),
                          unref(profileForm).errors.name ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(profileForm).errors.name), 1)) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Email"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(profileForm).email = $event,
                            type: "email",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(profileForm).email]
                          ]),
                          unref(profileForm).errors.email ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(profileForm).errors.email), 1)) : createCommentVNode("", true)
                        ])
                      ]),
                      createVNode("div", { class: "flex justify-end" }, [
                        createVNode("button", {
                          type: "submit",
                          disabled: unref(profileForm).processing,
                          class: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"
                        }, "Save Profile", 8, ["disabled"])
                      ])
                    ], 32)
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900 mb-6" }, "Update Password"),
                    createVNode("form", {
                      onSubmit: withModifiers(updatePassword, ["prevent"]),
                      class: "space-y-6"
                    }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Current Password"),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(passwordForm).current_password = $event,
                          type: "password",
                          class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, unref(passwordForm).current_password]
                        ]),
                        unref(passwordForm).errors.current_password ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-red-500 text-sm font-medium"
                        }, toDisplayString(unref(passwordForm).errors.current_password), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "New Password"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(passwordForm).password = $event,
                            type: "password",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(passwordForm).password]
                          ]),
                          unref(passwordForm).errors.password ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "text-red-500 text-sm font-medium"
                          }, toDisplayString(unref(passwordForm).errors.password), 1)) : createCommentVNode("", true)
                        ]),
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Confirm Password"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => unref(passwordForm).password_confirmation = $event,
                            type: "password",
                            class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, unref(passwordForm).password_confirmation]
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "flex justify-end" }, [
                        createVNode("button", {
                          type: "submit",
                          disabled: unref(passwordForm).processing,
                          class: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"
                        }, "Update Password", 8, ["disabled"])
                      ])
                    ], 32)
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "ai" ? (openBlock(), createBlock("div", {
                  key: 3,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("div", { class: "flex items-center gap-4 mb-6" }, [
                      createVNode("div", { class: "w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600" }, [
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
                            d: "M13 10V3L4 14h7v7l9-11h-7z"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "AI Configuration"),
                        createVNode("p", { class: "text-sm text-slate-500" }, "System-wide AI settings are managed by administrators.")
                      ])
                    ]),
                    createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8" }, [
                      createVNode("div", { class: "space-y-4" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Generative AI Model"),
                        createVNode("div", { class: "relative" }, [
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(orgForm).settings.ai_model = $event,
                            class: "w-full bg-slate-50 border-slate-200 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                          }, [
                            __props.aiModels && __props.aiModels.length ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(__props.aiModels, (model) => {
                              return openBlock(), createBlock("option", {
                                key: model.id,
                                value: model.id
                              }, toDisplayString(model.name), 9, ["value"]);
                            }), 128)) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                              createVNode("option", { value: "gpt-4o" }, "GPT-4o"),
                              createVNode("option", { value: "gpt-4" }, "GPT-4"),
                              createVNode("option", { value: "gpt-3.5-turbo" }, "GPT-3.5 Turbo")
                            ], 64))
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(orgForm).settings.ai_model]
                          ]),
                          createVNode("div", { class: "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" }, [
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
                        createVNode("p", { class: "text-sm text-slate-500" }, "Select the underlying intelligence engine for your automated schema analysis. 'User Based' configuration applies to this entire organization.")
                      ]),
                      createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-100" }, [
                        createVNode("div", { class: "flex items-center justify-between" }, [
                          createVNode("div", null, [
                            createVNode("p", { class: "font-bold text-slate-900 text-lg" }, "Enable AI Insights"),
                            createVNode("p", { class: "text-sm text-slate-500" }, "Automatically generate SEO performance summaries and keyword strategies.")
                          ]),
                          createVNode("button", {
                            type: "button",
                            onClick: ($event) => unref(orgForm).settings.ai_insights_enabled = !unref(orgForm).settings.ai_insights_enabled,
                            class: ["relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", unref(orgForm).settings.ai_insights_enabled ? "bg-purple-600" : "bg-slate-200"]
                          }, [
                            createVNode("span", {
                              class: ["pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", unref(orgForm).settings.ai_insights_enabled ? "translate-x-5" : "translate-x-0"]
                            }, null, 2)
                          ], 10, ["onClick"])
                        ])
                      ]),
                      createVNode("div", { class: "space-y-4 pt-6 border-t border-slate-100" }, [
                        createVNode("label", { class: "block font-bold text-slate-700" }, "Keyword Discovery Frequency"),
                        createVNode("div", { class: "relative" }, [
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => unref(orgForm).keyword_discovery_frequency = $event,
                            class: "w-full bg-slate-50 border-slate-200 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                          }, [
                            createVNode("option", { value: 3 }, "Every 3 hours"),
                            createVNode("option", { value: 6 }, "Every 6 hours"),
                            createVNode("option", { value: 12 }, "Every 12 hours"),
                            createVNode("option", { value: 24 }, "Every 24 hours (Daily)")
                          ], 8, ["onUpdate:modelValue"]), [
                            [vModelSelect, unref(orgForm).keyword_discovery_frequency]
                          ]),
                          createVNode("div", { class: "absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" }, [
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
                        createVNode("p", { class: "text-sm text-slate-500" }, "Determine how often the Smart Engine should scan for new trending keywords tailored to your niche.")
                      ]),
                      createVNode("div", { class: "p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4" }, [
                        createVNode("div", { class: "text-blue-500 shrink-0" }, [
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
                              d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            })
                          ]))
                        ]),
                        createVNode("p", { class: "text-sm text-blue-800 leading-relaxed" }, [
                          createVNode("strong", null, "Note:"),
                          createTextVNode(" This setting controls the analysis phase logic. AI Insights require an active OpenAI API key to be configured in the system environment. ")
                        ])
                      ]),
                      createVNode("div", { class: "pt-4 flex justify-end" }, [
                        createVNode("button", {
                          onClick: updateOrganization,
                          disabled: unref(orgForm).processing,
                          class: "bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-standard shadow-lg active:scale-95 disabled:opacity-50"
                        }, toDisplayString(unref(orgForm).processing ? "Saving..." : "Save Configuration"), 9, ["disabled"])
                      ])
                    ])
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "analytics" ? (openBlock(), createBlock("div", {
                  key: 4,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("div", { class: "flex items-center gap-4 mb-6" }, [
                      createVNode("div", { class: "w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600" }, [
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
                            d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "Analytics Settings"),
                        createVNode("p", { class: "text-sm text-slate-500" }, "Configure how data is reported in your dashboard.")
                      ])
                    ]),
                    createVNode("div", { class: "space-y-10" }, [
                      createVNode("div", { class: "p-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50" }, [
                        createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" }, [
                          createVNode("div", null, [
                            createVNode("h3", { class: "text-lg font-bold text-slate-900" }, "Connect GA4 Property"),
                            createVNode("p", { class: "text-sm text-slate-500 mt-1" }, "Link your website's analytics data to track performance.")
                          ]),
                          createVNode("a", {
                            href: _ctx.route("auth.google", { intent: "connect" }),
                            class: "flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold hover:shadow-md hover:border-blue-200 transition-all text-sm shrink-0"
                          }, [
                            createVNode("img", {
                              src: "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png",
                              class: "w-5 h-5",
                              alt: "Google"
                            }),
                            createTextVNode(" Connect Google Account ")
                          ], 8, ["href"])
                        ]),
                        _ctx.$page.props.flash.success ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-medium text-sm flex items-center gap-3"
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 shrink-0 text-green-600",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M5 13l4 4L19 7"
                            })
                          ])),
                          createTextVNode(" " + toDisplayString(_ctx.$page.props.flash.success), 1)
                        ])) : createCommentVNode("", true),
                        _ctx.$page.props.flash.message ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium text-sm"
                        }, toDisplayString(_ctx.$page.props.flash.message), 1)) : createCommentVNode("", true),
                        hasInvalidTokens.value ? (openBlock(), createBlock("div", {
                          key: 2,
                          class: "mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-medium text-sm flex items-start gap-3"
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-5 h-5 shrink-0 text-amber-600 mt-0.5",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            })
                          ])),
                          createVNode("div", null, [
                            createVNode("p", { class: "font-bold" }, "Google connection expired"),
                            createVNode("p", { class: "mt-0.5" }, "One or more of your GA4 properties can't connect to Google. Please reconnect your Google account to restore analytics data.")
                          ])
                        ])) : createCommentVNode("", true),
                        createVNode("form", {
                          onSubmit: withModifiers(addProperty, ["prevent"]),
                          class: "flex flex-col gap-5"
                        }, [
                          createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-5" }, [
                            createVNode("div", { class: "space-y-2" }, [
                              createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Display Name"),
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => unref(propertyForm).name = $event,
                                type: "text",
                                placeholder: "e.g. My Main Site",
                                class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelText, unref(propertyForm).name]
                              ])
                            ]),
                            createVNode("div", { class: "space-y-2" }, [
                              createVNode("label", { class: "text-sm font-bold text-slate-700" }, "GA4 Property ID"),
                              withDirectives(createVNode("input", {
                                "onUpdate:modelValue": ($event) => unref(propertyForm).property_id = $event,
                                type: "text",
                                placeholder: "e.g. 123456789",
                                class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                              }, null, 8, ["onUpdate:modelValue"]), [
                                [vModelText, unref(propertyForm).property_id]
                              ])
                            ])
                          ]),
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Website URL"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(propertyForm).website_url = $event,
                              type: "url",
                              placeholder: "https://example.com",
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(propertyForm).website_url]
                            ])
                          ]),
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Search Console Site URL"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(propertyForm).gsc_site_url = $event,
                              type: "text",
                              placeholder: "sc-domain:example.com",
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(propertyForm).gsc_site_url]
                            ])
                          ]),
                          createVNode("div", { class: "flex justify-end pt-2" }, [
                            createVNode("button", {
                              type: "submit",
                              disabled: unref(propertyForm).processing,
                              class: "bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                            }, toDisplayString(unref(propertyForm).processing ? "Connecting..." : "Connect Property"), 9, ["disabled"])
                          ])
                        ], 32)
                      ]),
                      createVNode("div", { class: "space-y-6" }, [
                        createVNode("div", { class: "flex items-center justify-between px-2" }, [
                          createVNode("h3", { class: "text-lg font-bold text-slate-900" }, "Connected GA4 Properties"),
                          createVNode("span", { class: "text-xs font-bold text-slate-400 uppercase tracking-widest" }, toDisplayString(__props.analyticsProperties.length) + " Properties", 1)
                        ]),
                        __props.analyticsProperties.length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "grid grid-cols-1 gap-4"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(__props.analyticsProperties, (prop) => {
                            return openBlock(), createBlock("div", {
                              key: prop.id,
                              class: ["p-4 md:p-6 bg-white rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all", prop.google_token_invalid ? "border-amber-300 bg-amber-50/30" : "border-slate-100 hover:border-blue-500/30"]
                            }, [
                              createVNode("div", { class: "flex items-start md:items-center gap-4 md:gap-5" }, [
                                createVNode("div", {
                                  class: ["w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center", prop.google_token_invalid ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400"]
                                }, [
                                  prop.google_token_invalid ? (openBlock(), createBlock("svg", {
                                    key: 0,
                                    class: "w-6 h-6",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    })
                                  ])) : (openBlock(), createBlock("svg", {
                                    key: 1,
                                    class: "w-6 h-6",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    })
                                  ]))
                                ], 2),
                                createVNode("div", { class: "min-w-0" }, [
                                  createVNode("p", { class: "font-bold text-slate-900 truncate" }, toDisplayString(prop.name), 1),
                                  createVNode("p", { class: "text-sm text-slate-400 font-medium truncate" }, "GA4: " + toDisplayString(prop.property_id) + " • GSC: " + toDisplayString(prop.gsc_site_url || "Not set"), 1),
                                  createVNode("p", { class: "text-xs text-slate-400 break-all" }, toDisplayString(prop.website_url), 1),
                                  prop.google_token_invalid ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"
                                  }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "w-3 h-3",
                                      fill: "currentColor",
                                      viewBox: "0 0 20 20"
                                    }, [
                                      createVNode("path", {
                                        "fill-rule": "evenodd",
                                        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
                                        "clip-rule": "evenodd"
                                      })
                                    ])),
                                    createTextVNode(" Token expired — reconnect required ")
                                  ])) : prop.has_google_token ? (openBlock(), createBlock("span", {
                                    key: 1,
                                    class: "inline-flex items-center gap-1 mt-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"
                                  }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "w-3 h-3",
                                      fill: "currentColor",
                                      viewBox: "0 0 20 20"
                                    }, [
                                      createVNode("path", {
                                        "fill-rule": "evenodd",
                                        d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                                        "clip-rule": "evenodd"
                                      })
                                    ])),
                                    createTextVNode(" Google connected ")
                                  ])) : createCommentVNode("", true)
                                ])
                              ]),
                              createVNode("div", { class: "flex items-center gap-4 md:gap-6 pt-3 md:pt-0 border-t md:border-0 border-slate-50 justify-end md:justify-start" }, [
                                prop.google_token_invalid ? (openBlock(), createBlock("a", {
                                  key: 0,
                                  href: _ctx.route("auth.google", { intent: "connect" }),
                                  class: "flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-bold text-sm transition-colors bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg"
                                }, [
                                  createVNode("img", {
                                    src: "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png",
                                    class: "w-4 h-4",
                                    alt: "Google"
                                  }),
                                  createTextVNode(" Reconnect ")
                                ], 8, ["href"])) : createCommentVNode("", true),
                                createVNode("button", {
                                  onClick: ($event) => editProperty(prop),
                                  class: "text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors"
                                }, "Edit", 8, ["onClick"]),
                                createVNode("button", {
                                  onClick: ($event) => disconnectProperty(prop.id),
                                  class: "text-slate-400 hover:text-red-600 font-bold text-sm transition-colors"
                                }, "Disconnect", 8, ["onClick"])
                              ])
                            ], 2);
                          }), 128))
                        ])) : (openBlock(), createBlock("div", {
                          key: 1,
                          class: "text-center py-12 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"
                        }, [
                          createVNode("p", { class: "text-slate-500 font-medium" }, "No properties connected yet.")
                        ]))
                      ]),
                      createVNode("div", { class: "pt-10 border-t border-slate-100" }, [
                        createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-6" }, "General Preferences"),
                        createVNode("form", {
                          onSubmit: withModifiers(updateOrganization, ["prevent"]),
                          class: "space-y-6"
                        }, [
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Default Reporting Period"),
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => unref(orgForm).settings.analytics_period = $event,
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-standard outline-none font-medium"
                            }, [
                              createVNode("option", { value: "7d" }, "Last 7 Days"),
                              createVNode("option", { value: "30d" }, "Last 30 Days"),
                              createVNode("option", { value: "90d" }, "Last 90 Days")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, unref(orgForm).settings.analytics_period]
                            ])
                          ]),
                          createVNode("div", { class: "space-y-4 pt-4 border-t border-slate-100" }, [
                            createVNode("div", { class: "flex items-center justify-between" }, [
                              createVNode("div", null, [
                                createVNode("p", { class: "font-bold text-slate-900" }, "Weekly Email Reports"),
                                createVNode("p", { class: "text-sm text-slate-500" }, "Receive a summary of your schema performance every Monday.")
                              ]),
                              createVNode("button", {
                                type: "button",
                                onClick: ($event) => unref(orgForm).settings.notifications_enabled = !unref(orgForm).settings.notifications_enabled,
                                class: ["relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", unref(orgForm).settings.notifications_enabled ? "bg-blue-600" : "bg-slate-200"]
                              }, [
                                createVNode("span", {
                                  class: ["pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", unref(orgForm).settings.notifications_enabled ? "translate-x-5" : "translate-x-0"]
                                }, null, 2)
                              ], 10, ["onClick"])
                            ])
                          ]),
                          createVNode("div", { class: "flex justify-end" }, [
                            createVNode("button", {
                              type: "submit",
                              disabled: unref(orgForm).processing,
                              class: "bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-standard shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-70"
                            }, "Save Preferences", 8, ["disabled"])
                          ])
                        ], 32)
                      ])
                    ])
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "schedules" ? (openBlock(), createBlock("div", {
                  key: 5,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8" }, [
                    createVNode("div", { class: "flex items-center gap-4 mb-8" }, [
                      createVNode("div", { class: "w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600" }, [
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
                            d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          })
                        ]))
                      ]),
                      createVNode("div", null, [
                        createVNode("h2", { class: "text-xl font-bold text-slate-900" }, "AI Schedules"),
                        createVNode("p", { class: "text-sm text-slate-500" }, "Manage your automated AI tasks, alerts, and periodic reports.")
                      ])
                    ]),
                    __props.piqueScheduledTasks.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "grid grid-cols-1 gap-4"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.piqueScheduledTasks, (task) => {
                        return openBlock(), createBlock("div", {
                          key: task.id,
                          class: "group bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-slate-100"
                        }, [
                          createVNode("div", { class: "flex items-center gap-5" }, [
                            createVNode("div", {
                              class: ["w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", task.is_active ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"]
                            }, [
                              task.task_type === "crawl" ? (openBlock(), createBlock("svg", {
                                key: 0,
                                class: "w-7 h-7",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                })
                              ])) : (openBlock(), createBlock("svg", {
                                key: 1,
                                class: "w-7 h-7",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                })
                              ]))
                            ], 2),
                            createVNode("div", null, [
                              createVNode("div", { class: "flex items-center gap-2" }, [
                                createVNode("h3", { class: "font-bold text-slate-900 text-lg capitalize" }, toDisplayString(task.task_type), 1),
                                createVNode("span", {
                                  class: ["px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", task.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"]
                                }, toDisplayString(task.is_active ? "Active" : "Paused"), 3)
                              ]),
                              createVNode("p", { class: "text-sm text-slate-500 font-medium" }, [
                                createTextVNode("Frequency: "),
                                createVNode("span", { class: "text-slate-900 font-bold capitalize" }, toDisplayString(task.frequency), 1)
                              ]),
                              createVNode("p", { class: "text-xs text-slate-400 mt-1" }, [
                                createTextVNode("Next Run: "),
                                createVNode("span", { class: "text-slate-600 font-bold" }, toDisplayString(task.next_run_at || "Never"), 1)
                              ])
                            ])
                          ]),
                          createVNode("div", { class: "flex items-center gap-4 justify-end" }, [
                            createVNode("button", {
                              onClick: ($event) => toggleSchedule(task.id),
                              class: ["px-4 py-2 rounded-xl text-sm font-bold transition-all border", task.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-blue-200 text-blue-700 hover:bg-blue-50"]
                            }, toDisplayString(task.is_active ? "Pause" : "Resume"), 11, ["onClick"]),
                            createVNode("button", {
                              onClick: ($event) => deleteSchedule(task.id),
                              class: "px-4 py-2 rounded-xl text-sm font-bold border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all"
                            }, " Delete ", 8, ["onClick"])
                          ])
                        ]);
                      }), 128))
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200"
                    }, [
                      createVNode("div", { class: "w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm" }, [
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
                            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          })
                        ]))
                      ]),
                      createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "No active schedules"),
                      createVNode("p", { class: "text-slate-500 max-w-sm mx-auto" }, "You can ask Pique to schedule weekly crawls or set up automated alerts in the chat interface.")
                    ]))
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "team" ? (openBlock(), createBlock("div", {
                  key: 6,
                  class: "space-y-6 animate-fade-in"
                }, [
                  createVNode("div", { class: "flex justify-between items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100" }, [
                    createVNode("div", null, [
                      createVNode("h3", { class: "font-bold text-blue-900" }, "Invite Team Members"),
                      createVNode("p", { class: "text-sm text-blue-700" }, "Add colleagues to collaborate on schemas.")
                    ]),
                    createVNode("button", {
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
                    ], 8, ["onClick"])
                  ]),
                  createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden" }, [
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
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("span", { class: "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600" }, toDisplayString(member.role), 1),
                            __props.currentUserRole === "owner" && member.id !== _ctx.$page.props.auth.user.id ? (openBlock(), createBlock("button", {
                              key: 0,
                              onClick: ($event) => removeMember(member.id),
                              class: "text-slate-400 hover:text-red-600 transition-colors p-2"
                            }, " Remove ", 8, ["onClick"])) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ]),
                  __props.invitations.length > 0 ? (openBlock(), createBlock("div", { key: 0 }, [
                    createVNode("h3", { class: "text-lg font-bold text-slate-900 mb-4 ml-2" }, "Pending Invitations"),
                    createVNode("div", { class: "bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden" }, [
                      createVNode("div", { class: "divide-y divide-slate-100" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(__props.invitations, (invite) => {
                          return openBlock(), createBlock("div", {
                            key: invite.id,
                            class: "p-6 flex items-center justify-between"
                          }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "font-bold text-slate-900" }, toDisplayString(invite.email), 1),
                              createVNode("p", { class: "text-sm text-slate-500" }, "Role: " + toDisplayString(invite.role), 1)
                            ]),
                            createVNode("button", {
                              onClick: ($event) => cancelInvite(invite.id),
                              class: "text-red-600 font-bold text-sm hover:underline"
                            }, "Revoke", 8, ["onClick"])
                          ]);
                        }), 128))
                      ])
                    ])
                  ])) : createCommentVNode("", true)
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
                      createVNode("div", { class: "bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" }, [
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
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                            }, [
                              createVNode("option", { value: "member" }, "Member"),
                              createVNode("option", { value: "admin" }, "Admin")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, unref(inviteForm).role]
                            ])
                          ]),
                          createVNode("div", { class: "flex gap-4 pt-2" }, [
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => showInviteModal.value = false,
                              class: "flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                            }, "Cancel", 8, ["onClick"]),
                            createVNode("button", {
                              type: "submit",
                              disabled: unref(inviteForm).processing,
                              class: "flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                            }, "Send Invite", 8, ["disabled"])
                          ])
                        ], 32)
                      ])
                    ], 8, ["onClick"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                }),
                createVNode(Transition, {
                  "enter-active-class": "transition duration-200 ease-out",
                  "enter-from-class": "transform opacity-0 scale-95",
                  "enter-to-class": "transform opacity-100 scale-100",
                  "leave-active-class": "transition duration-75 ease-in",
                  "leave-from-class": "transform opacity-100 scale-100",
                  "leave-to-class": "transform opacity-0 scale-95"
                }, {
                  default: withCtx(() => [
                    showEditPropertyModal.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm",
                      onClick: withModifiers(($event) => showEditPropertyModal.value = false, ["self"])
                    }, [
                      createVNode("div", { class: "bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" }, [
                        createVNode("h3", { class: "text-2xl font-bold text-slate-900 mb-6" }, "Edit Property"),
                        createVNode("form", {
                          onSubmit: withModifiers(submitEditProperty, ["prevent"]),
                          class: "space-y-6"
                        }, [
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Property Name"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(editPropertyForm).name = $event,
                              type: "text",
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(editPropertyForm).name]
                            ]),
                            unref(editPropertyForm).errors.name ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "text-red-500 text-sm font-medium"
                            }, toDisplayString(unref(editPropertyForm).errors.name), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("div", { class: "space-y-2" }, [
                            createVNode("label", { class: "text-sm font-bold text-slate-700" }, "Search Console Site URL"),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(editPropertyForm).gsc_site_url = $event,
                              type: "text",
                              placeholder: "https://www.example.com/ or sc-domain:example.com",
                              class: "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-standard outline-none font-medium"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, unref(editPropertyForm).gsc_site_url]
                            ]),
                            unref(editPropertyForm).errors.gsc_site_url ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "text-red-500 text-sm font-medium"
                            }, toDisplayString(unref(editPropertyForm).errors.gsc_site_url), 1)) : createCommentVNode("", true),
                            createVNode("p", { class: "text-xs text-slate-500" }, "Copy the property URL exactly as shown in Google Search Console.")
                          ]),
                          createVNode("div", { class: "flex gap-4 pt-2" }, [
                            createVNode("button", {
                              type: "button",
                              onClick: ($event) => showEditPropertyModal.value = false,
                              class: "flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                            }, "Cancel", 8, ["onClick"]),
                            createVNode("button", {
                              type: "submit",
                              disabled: unref(editPropertyForm).processing,
                              class: "flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                            }, "Save Changes", 8, ["disabled"])
                          ])
                        ], 32)
                      ])
                    ], 8, ["onClick"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                }),
                createVNode(_sfc_main$2, {
                  show: showConfirmModal.value,
                  title: confirmTitle.value,
                  message: confirmMessage.value,
                  "confirm-text": confirmButtonText.value,
                  onClose: ($event) => showConfirmModal.value = false,
                  onConfirm: executeConfirm
                }, null, 8, ["show", "title", "message", "confirm-text", "onClose"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Settings/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
