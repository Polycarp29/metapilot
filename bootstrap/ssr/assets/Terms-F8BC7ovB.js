import { withCtx, createVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { L as LegalLayout } from "./LegalLayout-B38dI_5b.js";
import "@inertiajs/vue3";
import "./BrandLogo-wIKyrnft.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Terms",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(LegalLayout, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h1${_scopeId}>Terms of Service</h1><p class="text-slate-400 text-sm mb-12"${_scopeId}>Last Updated: February 20, 2026</p><section${_scopeId}><h2${_scopeId}>1. Acceptance of Terms</h2><p${_scopeId}> By accessing or using MetaPilot, you agree to be bound by these Terms of Service and all applicable laws and regulations. </p></section><section${_scopeId}><h2${_scopeId}>2. Service Description</h2><p${_scopeId}> MetaPilot is a SaaS platform providing AI-powered SEO toolsets, including JSON-LD management, sitemap monitoring, and analytics aggregation. </p></section><section${_scopeId}><h2${_scopeId}>3. User Responsibilities</h2><p${_scopeId}> You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate information when connecting third-party properties (GA4, GSC). </p></section><section${_scopeId}><h2${_scopeId}>4. AI-Generated Content</h2><p${_scopeId}> MetaPilot uses artificial intelligence to suggest schema data and strategies. While we strive for accuracy, users should verify AI-generated content before deployment to production environments. </p></section><section${_scopeId}><h2${_scopeId}>5. Limitation of Liability</h2><p${_scopeId}> MetaPilot is provided &quot;as is&quot;. In no event shall MetaPilot be liable for any damages arising out of the use or inability to use the services. </p></section><section${_scopeId}><h2${_scopeId}>6. Governing Law</h2><p${_scopeId}> These terms are governed by and construed in accordance with the laws of your jurisdiction. </p></section>`);
          } else {
            return [
              createVNode("h1", null, "Terms of Service"),
              createVNode("p", { class: "text-slate-400 text-sm mb-12" }, "Last Updated: February 20, 2026"),
              createVNode("section", null, [
                createVNode("h2", null, "1. Acceptance of Terms"),
                createVNode("p", null, " By accessing or using MetaPilot, you agree to be bound by these Terms of Service and all applicable laws and regulations. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "2. Service Description"),
                createVNode("p", null, " MetaPilot is a SaaS platform providing AI-powered SEO toolsets, including JSON-LD management, sitemap monitoring, and analytics aggregation. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "3. User Responsibilities"),
                createVNode("p", null, " You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate information when connecting third-party properties (GA4, GSC). ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "4. AI-Generated Content"),
                createVNode("p", null, " MetaPilot uses artificial intelligence to suggest schema data and strategies. While we strive for accuracy, users should verify AI-generated content before deployment to production environments. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "5. Limitation of Liability"),
                createVNode("p", null, ' MetaPilot is provided "as is". In no event shall MetaPilot be liable for any damages arising out of the use or inability to use the services. ')
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "6. Governing Law"),
                createVNode("p", null, " These terms are governed by and construed in accordance with the laws of your jurisdiction. ")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Legal/Terms.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
