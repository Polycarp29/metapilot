import { withCtx, createVNode, createTextVNode, useSSRContext } from "vue";
import { ssrRenderComponent } from "vue/server-renderer";
import { L as LegalLayout } from "./LegalLayout-B38dI_5b.js";
import "@inertiajs/vue3";
import "./BrandLogo-wIKyrnft.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {
  __name: "Cookies",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(LegalLayout, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h1${_scopeId}>Cookie Policy</h1><p class="text-slate-400 text-sm mb-12"${_scopeId}>Last Updated: February 20, 2026</p><section${_scopeId}><h2${_scopeId}>1. What are Cookies</h2><p${_scopeId}> Cookies are small text files stored on your device to help websites function better and provide a personalized experience. </p></section><section${_scopeId}><h2${_scopeId}>2. How We Use Cookies</h2><p${_scopeId}> MetaPilot uses cookies for the following purposes: </p><ul${_scopeId}><li${_scopeId}><strong${_scopeId}>Authentication</strong>: To keep you logged in to your account.</li><li${_scopeId}><strong${_scopeId}>Preferences</strong>: To remember settings like your active organization.</li><li${_scopeId}><strong${_scopeId}>Security</strong>: To protect against CSRF attacks and maintain session integrity.</li></ul></section><section${_scopeId}><h2${_scopeId}>3. Third-Party Cookies</h2><p${_scopeId}> When you connect Google services, Google may set cookies to handle authentication and API requests. We do not control these cookies. </p></section><section${_scopeId}><h2${_scopeId}>4. Managing Cookies</h2><p${_scopeId}> Most browsers allow you to refuse or delete cookies through their settings. Note that disabling essential cookies may break core functionality of the MetaPilot platform. </p></section>`);
          } else {
            return [
              createVNode("h1", null, "Cookie Policy"),
              createVNode("p", { class: "text-slate-400 text-sm mb-12" }, "Last Updated: February 20, 2026"),
              createVNode("section", null, [
                createVNode("h2", null, "1. What are Cookies"),
                createVNode("p", null, " Cookies are small text files stored on your device to help websites function better and provide a personalized experience. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "2. How We Use Cookies"),
                createVNode("p", null, " MetaPilot uses cookies for the following purposes: "),
                createVNode("ul", null, [
                  createVNode("li", null, [
                    createVNode("strong", null, "Authentication"),
                    createTextVNode(": To keep you logged in to your account.")
                  ]),
                  createVNode("li", null, [
                    createVNode("strong", null, "Preferences"),
                    createTextVNode(": To remember settings like your active organization.")
                  ]),
                  createVNode("li", null, [
                    createVNode("strong", null, "Security"),
                    createTextVNode(": To protect against CSRF attacks and maintain session integrity.")
                  ])
                ])
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "3. Third-Party Cookies"),
                createVNode("p", null, " When you connect Google services, Google may set cookies to handle authentication and API requests. We do not control these cookies. ")
              ]),
              createVNode("section", null, [
                createVNode("h2", null, "4. Managing Cookies"),
                createVNode("p", null, " Most browsers allow you to refuse or delete cookies through their settings. Note that disabling essential cookies may break core functionality of the MetaPilot platform. ")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Legal/Cookies.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
