import { withCtx, createVNode, createTextVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { L as LegalLayout } from "./LegalLayout-CGs70-Bb.js";
import "@inertiajs/vue3";
import "./BrandLogo-DhDYxbtK.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Privacy",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(LegalLayout, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h1${_scopeId}>Privacy Policy</h1><p class="text-slate-400 text-sm mb-12"${_scopeId}>Last Updated: February 20, 2026</p><section${_scopeId}><h2${_scopeId}>1. Introduction</h2><p${_scopeId}> At MetaPilot, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered SEO management platform. </p></section><section${_scopeId}><h2${_scopeId}>2. Data Collection &amp; OAuth Usage</h2><p${_scopeId}> MetaPilot integrates with third-party services like Google to provide analytics and search console data. Specifically: </p><ul${_scopeId}><li${_scopeId}><strong${_scopeId}>Google Analytics 4 (GA4)</strong>: We access your GA4 properties to aggregate traffic, conversion, and user behavior data.</li><li${_scopeId}><strong${_scopeId}>Google Search Console (GSC)</strong>: We access your Search Console data to monitor search impressions, clicks, and page performance.</li></ul><p${_scopeId}> We use the <code${_scopeId}>https://www.googleapis.com/auth/analytics.readonly</code> and <code${_scopeId}>https://www.googleapis.com/auth/webmasters.readonly</code> scopes to read this data. We do not modify or delete your external data. </p></section><section${_scopeId}><h2${_scopeId}>3. How We Use Your Data</h2><p${_scopeId}> The data collected is used strictly for: </p><ul${_scopeId}><li${_scopeId}>Generating AI-driven SEO strategies and insights.</li><li${_scopeId}>Populating your MetaPilot dashboard with performance metrics.</li><li${_scopeId}>Generating structured data (JSON-LD) suggestions.</li></ul><p${_scopeId}>MetaPilot does not sell your data to third parties.</p></section><section${_scopeId}><h2${_scopeId}>4. Data Security</h2><p${_scopeId}> We implement industry-standard security measures, including encryption at rest and in transit (SSL/TLS), to protect your credentials and synchronized data. </p></section><section${_scopeId}><h2${_scopeId}>5. Contact Us</h2><p${_scopeId}> If you have questions about this policy or your data, please contact our privacy team at <strong${_scopeId}>privacy@metapilot.ai</strong>. </p></section>`);
          } else {
            return [
              createVNode("h1", null, "Privacy Policy"),
              createVNode("p", { class: "text-slate-400 text-sm mb-12" }, "Last Updated: February 20, 2026"),
              createVNode("section", null, [
                createVNode("h2", null, "1. Introduction"),
                createVNode("p", null, " At MetaPilot, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered SEO management platform. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "2. Data Collection & OAuth Usage"),
                createVNode("p", null, " MetaPilot integrates with third-party services like Google to provide analytics and search console data. Specifically: "),
                createVNode("ul", null, [
                  createVNode("li", null, [
                    createVNode("strong", null, "Google Analytics 4 (GA4)"),
                    createTextVNode(": We access your GA4 properties to aggregate traffic, conversion, and user behavior data.")
                  ]),
                  createVNode("li", null, [
                    createVNode("strong", null, "Google Search Console (GSC)"),
                    createTextVNode(": We access your Search Console data to monitor search impressions, clicks, and page performance.")
                  ])
                ]),
                createVNode("p", null, [
                  createTextVNode(" We use the "),
                  createVNode("code", null, "https://www.googleapis.com/auth/analytics.readonly"),
                  createTextVNode(" and "),
                  createVNode("code", null, "https://www.googleapis.com/auth/webmasters.readonly"),
                  createTextVNode(" scopes to read this data. We do not modify or delete your external data. ")
                ])
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "3. How We Use Your Data"),
                createVNode("p", null, " The data collected is used strictly for: "),
                createVNode("ul", null, [
                  createVNode("li", null, "Generating AI-driven SEO strategies and insights."),
                  createVNode("li", null, "Populating your MetaPilot dashboard with performance metrics."),
                  createVNode("li", null, "Generating structured data (JSON-LD) suggestions.")
                ]),
                createVNode("p", null, "MetaPilot does not sell your data to third parties.")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "4. Data Security"),
                createVNode("p", null, " We implement industry-standard security measures, including encryption at rest and in transit (SSL/TLS), to protect your credentials and synchronized data. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "5. Contact Us"),
                createVNode("p", null, [
                  createTextVNode(" If you have questions about this policy or your data, please contact our privacy team at "),
                  createVNode("strong", null, "privacy@metapilot.ai"),
                  createTextVNode(". ")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Legal/Privacy.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
