import { ref, onMounted, unref, withCtx, createVNode, openBlock, createBlock, Fragment, renderList, toDisplayString, withModifiers, withDirectives, vModelSelect, createCommentVNode, createTextVNode, vModelText, withKeys, nextTick, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderStyle } from "vue/server-renderer";
import { _ as _sfc_main$1 } from "./AppLayout-Oqd_r1Cw.js";
import { Head } from "@inertiajs/vue3";
import axios from "axios";
import { _ as _sfc_main$2 } from "./ConfirmationModal-EXlnTAwk.js";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-php.js";
import "prismjs/components/prism-markdown.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./Toaster-DHWaylML.js";
import "./BrandLogo-DhDYxbtK.js";
import "pinia";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    initialBalance: Number
  },
  setup(__props) {
    const props = __props;
    const messages = ref([
      {
        id: 1,
        role: "agent",
        content: "Hello! I'm **Pique**, your AI SEO specialist. I've been analyzing your site's performance and noticed some opportunities for optimization. How can I help you today?",
        type: "text",
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      },
      {
        id: 2,
        role: "agent",
        content: "I can help you with:",
        type: "suggestions",
        items: [
          { id: "audit", label: "Run Full SEO Audit", icon: "ChartBarIcon" },
          { id: "keywords", label: "Research Keywords", icon: "MagnifyingGlassIcon" },
          { id: "schema", label: "Generate JSON-LD Schema", icon: "CodeBracketIcon" },
          { id: "content", label: "Humanize Content", icon: "UserIcon" },
          { id: "google_analytics", label: "Analyse GA4 & GSC", icon: "TrendsData" },
          { id: "pixel", label: "Metapilot Pixel Data", icon: "PixelData" }
        ],
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    const userInput = ref("");
    const isTyping = ref(false);
    const chatContainer = ref(null);
    const currentSessionId = ref(null);
    const selectedModel = ref("pique-gpt");
    const balance = ref(props.initialBalance || 0);
    const selectedToggles = ref([]);
    const history = ref([]);
    const toast = useToastStore();
    const showDeleteModal = ref(false);
    const sessionToDelete = ref(null);
    const isDeleting = ref(false);
    const crawlPanelMsgId = ref(null);
    const crawlStep = ref("select");
    const crawlContainers = ref([]);
    const crawlForm = ref({ name: "", sitemap_name: "", site_url: "" });
    const crawlFormError = ref("");
    const crawlFormSubmitting = ref(false);
    const activeSitemapId = ref(null);
    const activeCrawlJobId = ref(null);
    const crawlProgress = ref({ status: "dispatched", total_crawled: 0, total_discovered: 0, current_url: "", logs: [], manage_url: "" });
    const crawlPollInterval = ref(null);
    const startCrawlPoll = (sitemapId) => {
      if (crawlPollInterval.value) clearInterval(crawlPollInterval.value);
      crawlPollInterval.value = setInterval(async () => {
        try {
          const res = await axios.get(route("api.pique.containers.crawl-status", sitemapId));
          const data = res.data;
          const pct = data.total_discovered > 0 ? Math.round(data.total_crawled / data.total_discovered * 100) : 0;
          crawlProgress.value = {
            status: data.status,
            total_crawled: data.total_crawled ?? 0,
            total_discovered: data.total_discovered ?? 0,
            current_url: data.current_url ?? "",
            pct,
            manage_url: data.manage_url ?? "",
            links_count: data.links_count ?? 0,
            logs: data.logs ?? []
          };
          if (["completed", "failed", "error"].includes(data.status)) {
            clearInterval(crawlPollInterval.value);
            crawlPollInterval.value = null;
          }
        } catch (e) {
          console.error("Crawl poll error", e);
        }
      }, 3e3);
    };
    const launchCrawlForContainer = async (container) => {
      try {
        crawlFormSubmitting.value = true;
        activeSitemapId.value = container.id;
        const res = await axios.post(route("api.pique.containers.crawl", container.id));
        activeCrawlJobId.value = res.data.job_id;
        crawlProgress.value = { status: "dispatched", total_crawled: 0, total_discovered: 0, current_url: "", pct: 0, manage_url: res.data.manage_url ?? "", logs: [] };
        crawlStep.value = "progress";
        startCrawlPoll(container.id);
      } catch (e) {
        toast.error(e.response?.data?.error ?? "Failed to start crawl", "Error");
      } finally {
        crawlFormSubmitting.value = false;
      }
    };
    const submitCreateContainer = async () => {
      crawlFormError.value = "";
      if (!crawlForm.value.name || !crawlForm.value.sitemap_name || !crawlForm.value.site_url) {
        crawlFormError.value = "All fields are required.";
        return;
      }
      try {
        crawlFormSubmitting.value = true;
        const res = await axios.post(route("api.pique.containers.store"), crawlForm.value);
        const newContainer = res.data;
        await launchCrawlForContainer(newContainer);
      } catch (e) {
        crawlFormError.value = e.response?.data?.message ?? "Failed to create container.";
      } finally {
        crawlFormSubmitting.value = false;
      }
    };
    const models = [
      { id: "pique-gpt", label: "Pique GPT", description: "Advanced Reasoning" },
      { id: "pique-claude", label: "Pique Claude", description: "Technical Expert" },
      { id: "pique-gemini", label: "Pique Gemini", description: "Google Ecosystem" }
    ];
    const fetchHistory = async () => {
      try {
        const response = await axios.get(route("api.pique.history"));
        history.value = response.data;
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    const switchSession = async (sessionId) => {
      if (isTyping.value) return;
      try {
        isTyping.value = true;
        const response = await axios.get(route("api.pique.session", sessionId));
        currentSessionId.value = response.data.session_id;
        messages.value = response.data.messages.map((m) => ({
          ...m,
          role: m.role === "user" ? "user" : "agent",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          // Simple fallback
        }));
        isTyping.value = false;
        scrollToBottom();
      } catch (e) {
        isTyping.value = false;
        console.error("Failed to switch session", e);
      }
    };
    const startNewChat = () => {
      currentSessionId.value = null;
      messages.value = [
        {
          id: 1,
          role: "agent",
          content: "Hello! I'm **Pique**, your AI SEO specialist. I've been analyzing your site's performance and noticed some opportunities for optimization. How can I help you today?",
          type: "text",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        },
        {
          id: 2,
          role: "agent",
          content: "I can help you with:",
          type: "suggestions",
          items: [
            { id: "audit", label: "Run Full SEO Audit", icon: "ChartBarIcon" },
            { id: "keywords", label: "Research Keywords", icon: "MagnifyingGlassIcon" },
            { id: "schema", label: "Generate JSON-LD Schema", icon: "CodeBracketIcon" },
            { id: "content", label: "Humanize Content", icon: "UserIcon" },
            { id: "google_analytics", label: "Analyse GA4 & GSC", icon: "TrendsData" },
            { id: "pixel", label: "Metapilot Pixel Data", icon: "PixelData" }
          ],
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
    };
    const deleteSession = (sessionId) => {
      sessionToDelete.value = sessionId;
      showDeleteModal.value = true;
    };
    const confirmDelete = async () => {
      if (!sessionToDelete.value || isDeleting.value) return;
      try {
        isDeleting.value = true;
        const sid = sessionToDelete.value;
        await axios.delete(route("api.pique.session.destroy", sid));
        if (currentSessionId.value === sid) {
          startNewChat();
        }
        await fetchHistory();
        toast.success("Conversation deleted successfully", "Deleted");
        showDeleteModal.value = false;
        sessionToDelete.value = null;
      } catch (e) {
        toast.error("Failed to delete conversation", "Error");
        console.error("Failed to delete session", e);
      } finally {
        isDeleting.value = false;
      }
    };
    const scrollToBottom = async () => {
      await nextTick();
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    };
    const sendMessage = async () => {
      if (!userInput.value.trim() || isTyping.value) return;
      const userText = userInput.value;
      const newMsg = {
        id: Date.now(),
        role: "user",
        content: userText,
        type: "text",
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      messages.value.push(newMsg);
      userInput.value = "";
      scrollToBottom();
      isTyping.value = true;
      try {
        const response = await axios.post(route("api.pique.ask"), {
          prompt: userText,
          model: selectedModel.value,
          session_id: currentSessionId.value
        });
        isTyping.value = false;
        if (response.data.response) {
          const action = response.data.action;
          if (action?.action === "crawl_container_select") {
            crawlContainers.value = action.containers ?? [];
            crawlStep.value = "select";
            crawlForm.value = { name: "", sitemap_name: "", site_url: "" };
            crawlFormError.value = "";
            activeSitemapId.value = null;
            activeCrawlJobId.value = null;
            const crawlMsgId = Date.now() + 1;
            crawlPanelMsgId.value = crawlMsgId;
            messages.value.push({
              id: crawlMsgId,
              role: "agent",
              content: response.data.response,
              type: "crawl_ui",
              timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
          } else {
            messages.value.push({
              id: Date.now() + 1,
              role: "agent",
              content: response.data.response,
              type: "text",
              timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              action
            });
          }
          currentSessionId.value = response.data.session_id;
          const balanceRes = await axios.get(route("api.pique.credits"));
          balance.value = balanceRes.data.balance;
          fetchHistory();
        }
        scrollToBottom();
      } catch (error) {
        isTyping.value = false;
        const errorMsg = error.response?.data?.error || "Something went wrong. Please try again.";
        messages.value.push({
          id: Date.now() + 1,
          role: "agent",
          content: `Error: ${errorMsg}`,
          type: "text",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
        scrollToBottom();
      }
    };
    const handleAction = (input) => {
      const btn = typeof input === "string" ? { type: "button", action: input } : input;
      if (btn.type === "toggle") {
        if (selectedToggles.value.includes(btn.value)) {
          selectedToggles.value = selectedToggles.value.filter((v) => v !== btn.value);
        } else {
          selectedToggles.value.push(btn.value);
        }
        return;
      }
      let actionLabel = btn.action;
      if (selectedToggles.value.length > 0) {
        actionLabel += ` with modules: ${selectedToggles.value.join(",")}`;
      }
      userInput.value = `Can you ${actionLabel.replace(/_/g, " ")} for me?`;
      selectedToggles.value = [];
      sendMessage();
    };
    const renderMarkdown = (content) => {
      if (!content) return "";
      const renderer = new marked.Renderer();
      renderer.code = (codeOrObj, language) => {
        const codeText = typeof codeOrObj === "object" ? codeOrObj.text : codeOrObj;
        const validLang = (typeof codeOrObj === "object" ? codeOrObj.lang : language) || "javascript";
        let highlighted = codeText;
        try {
          const prismLang = Prism.languages[validLang] || Prism.languages.markup || Prism.languages.javascript;
          highlighted = Prism.highlight(codeText, prismLang, validLang);
        } catch (e) {
          console.error("Prism highlighting failed", e);
          highlighted = codeText.replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          })[m]);
        }
        const safeCode = encodeURIComponent(codeText);
        return `
            <div class="my-4 rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e1e]">
                <div class="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-slate-800/50">
                    <div class="flex items-center space-x-2">
                        <span class="w-3 h-3 rounded-full bg-red-500/50"></span>
                        <span class="w-3 h-3 rounded-full bg-amber-500/50"></span>
                        <span class="w-3 h-3 rounded-full bg-green-500/50"></span>
                        <span class="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">${validLang}</span>
                    </div>
                    <button class="copy-btn text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest" data-code="${safeCode}">
                        Copy
                    </button>
                </div>
                <pre class="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-[#d4d4d4] line-numbers"><code class="language-${validLang}">${highlighted}</code></pre>
            </div>
        `;
      };
      let html = marked.parse(content, { renderer });
      return DOMPurify.sanitize(html);
    };
    const extractButtons = (content) => {
      const buttons = [];
      if (!content) return buttons;
      const btnRegex = /\[\[Button:\s*(.*?)\|\s*(.*?)\]\]/g;
      const tglRegex = /\[\[Toggle:\s*(.*?)\|\s*(.*?)\]\]/g;
      let match;
      while ((match = btnRegex.exec(content)) !== null) {
        buttons.push({ type: "button", label: match[1].trim(), action: match[2].trim() });
      }
      while ((match = tglRegex.exec(content)) !== null) {
        buttons.push({ type: "toggle", label: match[1].trim(), value: match[2].trim() });
      }
      return buttons;
    };
    const cleanContent = (content) => {
      if (!content) return "";
      return content.replace(/\[\[Button:.*?\]\]/g, "").trim();
    };
    onMounted(() => {
      fetchHistory();
      scrollToBottom();
      document.addEventListener("click", (e) => {
        if (e.target.classList.contains("copy-btn")) {
          try {
            const encodedCode = e.target.getAttribute("data-code");
            const code = decodeURIComponent(encodedCode);
            navigator.clipboard.writeText(code);
            e.target.innerText = "Copied!";
            setTimeout(() => e.target.innerText = "Copy", 2e3);
            toast.success("Code copied to clipboard", "Copied");
          } catch (err) {
            console.error("Copy failed", err);
          }
        }
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(unref(Head), { title: "Pique AI Agent" }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$1, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="h-[calc(100vh-140px)] flex flex-col lg:flex-row overflow-hidden bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40" data-v-a83446d6${_scopeId}><aside class="w-full lg:w-80 flex flex-col border-r border-slate-200/50 bg-slate-50/50" data-v-a83446d6${_scopeId}><div class="p-6 border-b border-slate-200/50 flex justify-between items-center" data-v-a83446d6${_scopeId}><h2 class="text-xl font-bold text-slate-900 tracking-tight" data-v-a83446d6${_scopeId}>Conversations</h2><button class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" data-v-a83446d6${_scopeId}></path></svg></button></div><div class="flex-1 overflow-y-auto p-4 space-y-2" data-v-a83446d6${_scopeId}><div class="px-3 pb-2" data-v-a83446d6${_scopeId}><h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Recent Chats</h3></div><!--[-->`);
            ssrRenderList(history.value, (session) => {
              _push2(`<div class="${ssrRenderClass([currentSessionId.value === session.id ? "bg-white border-blue-200 shadow-sm" : "hover:bg-white/60 border-transparent", "group p-3 border rounded-xl cursor-pointer transition-all relative"])}" data-v-a83446d6${_scopeId}><div class="pr-8" data-v-a83446d6${_scopeId}><div class="${ssrRenderClass([currentSessionId.value === session.id ? "text-blue-600" : "", "font-semibold text-slate-800 text-sm truncate"])}" data-v-a83446d6${_scopeId}>${ssrInterpolate(session.title)}</div><div class="text-xs text-slate-400 mt-1" data-v-a83446d6${_scopeId}>${ssrInterpolate(session.updated_at)}</div></div><button class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" data-v-a83446d6${_scopeId}></path></svg></button></div>`);
            });
            _push2(`<!--]--></div><div class="p-6 bg-slate-100/30 border-t border-slate-200/50" data-v-a83446d6${_scopeId}><div class="mb-4" data-v-a83446d6${_scopeId}><label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block" data-v-a83446d6${_scopeId}>Active Model</label><select class="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold p-2.5 focus:ring-blue-500 focus:border-blue-500" data-v-a83446d6${_scopeId}><!--[-->`);
            ssrRenderList(models, (model) => {
              _push2(`<option${ssrRenderAttr("value", model.id)} data-v-a83446d6${ssrIncludeBooleanAttr(Array.isArray(selectedModel.value) ? ssrLooseContain(selectedModel.value, model.id) : ssrLooseEqual(selectedModel.value, model.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(model.label)}</option>`);
            });
            _push2(`<!--]--></select></div><div class="flex items-center space-x-3 p-3 rounded-2xl bg-white border border-slate-200/50 shadow-sm shadow-slate-100" data-v-a83446d6${_scopeId}><div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" data-v-a83446d6${_scopeId}></path></svg></div><div class="flex-1" data-v-a83446d6${_scopeId}><div class="text-xs font-bold text-slate-900 leading-tight" data-v-a83446d6${_scopeId}>Credits Remaining</div><div class="text-sm text-blue-600 font-extrabold" data-v-a83446d6${_scopeId}>${ssrInterpolate(balance.value.toFixed(2))}</div></div></div></div></aside><main class="flex-1 flex flex-col relative bg-white/20 backdrop-blur-sm shadow-inner" data-v-a83446d6${_scopeId}><div class="flex-1 overflow-y-auto overflow-x-auto p-6 lg:p-10 space-y-8 scroll-smooth scrollbar-hide" data-v-a83446d6${_scopeId}><!--[-->`);
            ssrRenderList(messages.value, (msg) => {
              _push2(`<div class="${ssrRenderClass([msg.role === "user" ? "justify-end" : "justify-start", "flex animate-in fade-in slide-in-from-bottom-4 duration-500"])}" data-v-a83446d6${_scopeId}>`);
              if (msg.role === "agent") {
                _push2(`<div class="w-10 h-10 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg mr-4 mt-1" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" data-v-a83446d6${_scopeId}></path></svg></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="max-w-[85%] lg:max-w-[70%] space-y-3" data-v-a83446d6${_scopeId}><div class="${ssrRenderClass([msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none", "px-5 py-4 rounded-3xl text-slate-800 transition-all"])}" data-v-a83446d6${_scopeId}><div class="prose prose-slate prose-sm max-w-none text-[15px] leading-relaxed markdown-content" data-v-a83446d6${_scopeId}>${renderMarkdown(cleanContent(msg.content)) ?? ""}</div>`);
              if (extractButtons(msg.content).length > 0) {
                _push2(`<div class="mt-4 flex flex-wrap gap-2" data-v-a83446d6${_scopeId}><!--[-->`);
                ssrRenderList(extractButtons(msg.content), (btn) => {
                  _push2(`<button class="${ssrRenderClass([
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm border",
                    btn.type === "toggle" ? selectedToggles.value.includes(btn.value) ? "bg-blue-600 border-blue-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white"
                  ])}" data-v-a83446d6${_scopeId}>`);
                  if (btn.type === "toggle" && selectedToggles.value.includes(btn.value)) {
                    _push2(`<span class="mr-1" data-v-a83446d6${_scopeId}>✓</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(` ${ssrInterpolate(btn.label)}</button>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (msg.action) {
                _push2(`<div class="mt-4 p-3 bg-blue-50/80 border border-blue-200/50 rounded-2xl shadow-sm" data-v-a83446d6${_scopeId}><div class="flex items-center space-x-2 mb-2" data-v-a83446d6${_scopeId}><div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse" data-v-a83446d6${_scopeId}></div><span class="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest" data-v-a83446d6${_scopeId}>${ssrInterpolate(msg.action.label || msg.action)}</span></div>`);
                if (msg.action.data) {
                  _push2(`<div class="bg-white/60 rounded-xl p-2.5 space-y-2" data-v-a83446d6${_scopeId}>`);
                  if (msg.action.action === "keyword_research") {
                    _push2(`<div class="space-y-1.5" data-v-a83446d6${_scopeId}><!--[-->`);
                    ssrRenderList((msg.action.data.organic || []).slice(0, 3), (kw) => {
                      _push2(`<div class="flex justify-between items-center text-[13px]" data-v-a83446d6${_scopeId}><span class="text-slate-700 font-medium font-mono text-[11px]" data-v-a83446d6${_scopeId}>${ssrInterpolate(kw.query)}</span><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold" data-v-a83446d6${_scopeId}>POS ${ssrInterpolate(kw.position)}</span></div>`);
                    });
                    _push2(`<!--]-->`);
                    if (msg.action.query) {
                      _push2(`<a${ssrRenderAttr("href", _ctx.route("keywords.research", { q: msg.action.query }))} class="block text-center text-[10px] font-bold text-blue-600 hover:text-blue-700 pt-1" data-v-a83446d6${_scopeId}> View All Results → </a>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (msg.action.action === "forecast") {
                    _push2(`<div class="flex items-center justify-around py-1" data-v-a83446d6${_scopeId}><!--[-->`);
                    ssrRenderList(msg.action.data, (val, metric) => {
                      _push2(`<div class="text-center" data-v-a83446d6${_scopeId}><div class="text-[9px] text-slate-400 uppercase font-bold" data-v-a83446d6${_scopeId}>${ssrInterpolate(metric)}</div><div class="text-[13px] font-bold text-slate-800" data-v-a83446d6${_scopeId}>${ssrInterpolate(val.toFixed(0))}</div></div>`);
                    });
                    _push2(`<!--]--></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (msg.action.action === "schema_validation") {
                    _push2(`<div class="space-y-1" data-v-a83446d6${_scopeId}><!--[-->`);
                    ssrRenderList(msg.action.data, (res) => {
                      _push2(`<div class="flex items-center justify-between text-[11px]" data-v-a83446d6${_scopeId}><span class="text-slate-600 truncate mr-2" data-v-a83446d6${_scopeId}>${ssrInterpolate(res.name)}</span><span class="${ssrRenderClass([res.validation?.valid ? "text-green-600" : "text-red-500", "font-bold uppercase text-[9px]"])}" data-v-a83446d6${_scopeId}>${ssrInterpolate(res.validation?.valid ? "Valid" : "Errors")}</span></div>`);
                    });
                    _push2(`<!--]--></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (msg.type === "analysis") {
                _push2(`<div class="bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 delay-200" data-v-a83446d6${_scopeId}><div class="flex items-center justify-between mb-4" data-v-a83446d6${_scopeId}><div class="text-sm font-bold text-slate-900" data-v-a83446d6${_scopeId}>SEO Health Score</div><div class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter" data-v-a83446d6${_scopeId}>${ssrInterpolate(msg.data.health)}</div></div><div class="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-6" data-v-a83446d6${_scopeId}><div class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000" style="${ssrRenderStyle({ width: msg.data.score + "%" })}" data-v-a83446d6${_scopeId}></div></div><div class="space-y-2" data-v-a83446d6${_scopeId}><!--[-->`);
                ssrRenderList(msg.data.issues, (issue) => {
                  _push2(`<div class="flex items-center text-xs text-slate-600" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-amber-500 mr-2" data-v-a83446d6${_scopeId}><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" data-v-a83446d6${_scopeId}></path></svg> ${ssrInterpolate(issue)}</div>`);
                });
                _push2(`<!--]--></div><button class="w-full mt-4 py-2 border border-blue-600 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors" data-v-a83446d6${_scopeId}>Generate Fix Plan</button></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (msg.type === "suggestions") {
                _push2(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4" data-v-a83446d6${_scopeId}><!--[-->`);
                ssrRenderList(msg.items, (item) => {
                  _push2(`<button class="flex items-center p-3 text-left bg-white/80 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-2xl group transition-all duration-300 active:scale-95 shadow-sm" data-v-a83446d6${_scopeId}><div class="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-white/20 flex items-center justify-center mr-3 transition-colors" data-v-a83446d6${_scopeId}>`);
                  if (item.id === "audit") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-600 group-hover:text-white" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (item.id === "keywords") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-600 group-hover:text-white" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (item.id === "schema") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-600 group-hover:text-white" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (item.id === "content") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-600 group-hover:text-white" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (item.id === "google_analytics") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-600" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (item.id === "pixel") {
                    _push2(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-600" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" data-v-a83446d6${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><span class="text-sm font-semibold" data-v-a83446d6${_scopeId}>${ssrInterpolate(item.label)}</span></button>`);
                });
                _push2(`<!--]--></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (msg.type === "crawl_ui") {
                _push2(`<div class="mt-4 w-full" data-v-a83446d6${_scopeId}>`);
                if (crawlStep.value === "select") {
                  _push2(`<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" data-v-a83446d6${_scopeId}><div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between" data-v-a83446d6${_scopeId}><div class="flex items-center gap-2" data-v-a83446d6${_scopeId}><div class="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center" data-v-a83446d6${_scopeId}><svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" data-v-a83446d6${_scopeId}></path></svg></div><span class="text-[11px] font-black text-slate-700 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Crawl Containers</span></div><span class="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlContainers.value.length)} container${ssrInterpolate(crawlContainers.value.length !== 1 ? "s" : "")}</span></div>`);
                  if (crawlContainers.value.length === 0) {
                    _push2(`<div class="px-5 py-8 text-center" data-v-a83446d6${_scopeId}><div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3" data-v-a83446d6${_scopeId}><svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" data-v-a83446d6${_scopeId}></path></svg></div><p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3" data-v-a83446d6${_scopeId}>No containers yet</p><p class="text-[10px] text-slate-400" data-v-a83446d6${_scopeId}>Create your first crawl container to start scanning your site.</p></div>`);
                  } else {
                    _push2(`<div class="divide-y divide-slate-50 max-h-60 overflow-y-auto" data-v-a83446d6${_scopeId}><!--[-->`);
                    ssrRenderList(crawlContainers.value, (c) => {
                      _push2(`<div class="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors" data-v-a83446d6${_scopeId}><div class="flex-1 min-w-0" data-v-a83446d6${_scopeId}><p class="text-[12px] font-bold text-slate-800 truncate" data-v-a83446d6${_scopeId}>${ssrInterpolate(c.name)}</p><p class="text-[9px] text-slate-400 truncate" data-v-a83446d6${_scopeId}>${ssrInterpolate(c.site_url)}</p><div class="flex items-center gap-2 mt-1" data-v-a83446d6${_scopeId}><span class="${ssrRenderClass([{
                        "bg-emerald-50 text-emerald-700": c.last_crawl_status === "completed",
                        "bg-blue-50 text-blue-700": c.last_crawl_status === "dispatched" || c.last_crawl_status === "crawling",
                        "bg-slate-100 text-slate-500": !c.last_crawl_status,
                        "bg-red-50 text-red-600": c.last_crawl_status === "failed"
                      }, "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"])}" data-v-a83446d6${_scopeId}>${ssrInterpolate(c.last_crawl_status || "not crawled")}</span><span class="text-[8px] text-slate-400 font-medium" data-v-a83446d6${_scopeId}>${ssrInterpolate(c.links_count)} links</span></div></div><button${ssrIncludeBooleanAttr(crawlFormSubmitting.value) ? " disabled" : ""} class="ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex-shrink-0" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlFormSubmitting.value && activeSitemapId.value === c.id ? "Starting…" : "Crawl")}</button></div>`);
                    });
                    _push2(`<!--]--></div>`);
                  }
                  _push2(`<div class="px-5 py-3 bg-slate-50/50 border-t border-slate-100" data-v-a83446d6${_scopeId}><button class="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-50 border border-dashed border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" data-v-a83446d6${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-a83446d6${_scopeId}></path></svg> Create New Container </button></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (crawlStep.value === "create") {
                  _push2(`<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" data-v-a83446d6${_scopeId}><div class="px-5 py-4 border-b border-slate-50 flex items-center gap-2" data-v-a83446d6${_scopeId}><button class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0" data-v-a83446d6${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-a83446d6${_scopeId}></path></svg></button><div class="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center" data-v-a83446d6${_scopeId}><svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-a83446d6${_scopeId}></path></svg></div><span class="text-[11px] font-black text-slate-700 uppercase tracking-widest" data-v-a83446d6${_scopeId}>New Container</span></div><div class="px-5 py-4 space-y-3" data-v-a83446d6${_scopeId}><div class="space-y-1" data-v-a83446d6${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block" data-v-a83446d6${_scopeId}>Container Name</label><input${ssrRenderAttr("value", crawlForm.value.name)} type="text" placeholder="e.g. Main Website" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none" data-v-a83446d6${_scopeId}></div><div class="space-y-1" data-v-a83446d6${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block" data-v-a83446d6${_scopeId}>Sitemap Name</label><input${ssrRenderAttr("value", crawlForm.value.sitemap_name)} type="text" placeholder="e.g. main-sitemap" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none" data-v-a83446d6${_scopeId}><p class="text-[9px] text-slate-400" data-v-a83446d6${_scopeId}>Becomes the filename: <code class="text-indigo-600" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlForm.value.sitemap_name ? crawlForm.value.sitemap_name.toLowerCase().replace(/\s+/g, "-") + ".xml" : "sitemap.xml")}</code></p></div><div class="space-y-1" data-v-a83446d6${_scopeId}><label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block" data-v-a83446d6${_scopeId}>Site URL</label><input${ssrRenderAttr("value", crawlForm.value.site_url)} type="url" placeholder="https://yoursite.com" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none" data-v-a83446d6${_scopeId}></div>`);
                  if (crawlFormError.value) {
                    _push2(`<p class="text-[10px] font-bold text-red-500 bg-red-50 rounded-xl px-3 py-2" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlFormError.value)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<button${ssrIncludeBooleanAttr(crawlFormSubmitting.value) ? " disabled" : ""} class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-100 flex items-center justify-center gap-2" data-v-a83446d6${_scopeId}>`);
                  if (crawlFormSubmitting.value) {
                    _push2(`<div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" data-v-a83446d6${_scopeId}></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(` ${ssrInterpolate(crawlFormSubmitting.value ? "Creating & Launching…" : "Create & Start Crawl")}</button></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (crawlStep.value === "progress") {
                  _push2(`<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" data-v-a83446d6${_scopeId}><div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between" data-v-a83446d6${_scopeId}><div class="flex items-center gap-2" data-v-a83446d6${_scopeId}><span class="relative flex h-2 w-2 flex-shrink-0" data-v-a83446d6${_scopeId}>`);
                  if (crawlProgress.value.status !== "completed") {
                    _push2(`<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" data-v-a83446d6${_scopeId}></span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<span class="${ssrRenderClass([crawlProgress.value.status === "completed" ? "bg-emerald-500" : crawlProgress.value.status === "failed" ? "bg-red-500" : "bg-blue-500", "relative inline-flex rounded-full h-2 w-2"])}" data-v-a83446d6${_scopeId}></span></span><span class="text-[11px] font-black text-slate-700 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Crawl in Progress</span></div><span class="${ssrRenderClass([crawlProgress.value.status === "completed" ? "text-emerald-600" : crawlProgress.value.status === "failed" ? "text-red-600" : "text-blue-600", "text-[10px] font-black"])}" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.status?.toUpperCase())}</span></div><div class="px-5 py-4 space-y-4" data-v-a83446d6${_scopeId}><div class="space-y-1.5" data-v-a83446d6${_scopeId}><div class="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest" data-v-a83446d6${_scopeId}><span data-v-a83446d6${_scopeId}>Pages Crawled</span><span data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.total_crawled)} / ${ssrInterpolate(crawlProgress.value.total_discovered || "?")}</span></div><div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden" data-v-a83446d6${_scopeId}><div class="${ssrRenderClass([crawlProgress.value.status === "completed" ? "bg-emerald-500" : crawlProgress.value.status === "failed" ? "bg-red-500" : "bg-blue-500", "h-full rounded-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: `${crawlProgress.value.pct || 0}%` })}" data-v-a83446d6${_scopeId}></div></div><p class="text-[9px] text-slate-400 truncate" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.current_url || "Initializing scanner…")}</p></div><div class="grid grid-cols-3 gap-2" data-v-a83446d6${_scopeId}><div class="bg-slate-50 rounded-xl p-2.5 text-center" data-v-a83446d6${_scopeId}><div class="text-[14px] font-black text-slate-900" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.pct || 0)}%</div><div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Progress</div></div><div class="bg-slate-50 rounded-xl p-2.5 text-center" data-v-a83446d6${_scopeId}><div class="text-[14px] font-black text-slate-900" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.total_crawled)}</div><div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Crawled</div></div><div class="bg-slate-50 rounded-xl p-2.5 text-center" data-v-a83446d6${_scopeId}><div class="text-[14px] font-black text-slate-900" data-v-a83446d6${_scopeId}>${ssrInterpolate(crawlProgress.value.links_count || 0)}</div><div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest" data-v-a83446d6${_scopeId}>Indexed</div></div></div>`);
                  if (crawlProgress.value.logs && crawlProgress.value.logs.length > 0) {
                    _push2(`<div class="bg-slate-950 rounded-xl p-3 max-h-28 overflow-y-auto space-y-0.5" data-v-a83446d6${_scopeId}><!--[-->`);
                    ssrRenderList(crawlProgress.value.logs, (log, i) => {
                      _push2(`<p class="text-[9px] font-mono text-slate-400 leading-snug" data-v-a83446d6${_scopeId}>${ssrInterpolate(log)}</p>`);
                    });
                    _push2(`<!--]--></div>`);
                  } else {
                    _push2(`<div class="bg-slate-50 rounded-xl p-3 flex items-center gap-2" data-v-a83446d6${_scopeId}>`);
                    if (crawlProgress.value.status !== "completed") {
                      _push2(`<div class="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0" data-v-a83446d6${_scopeId}></div>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`<p class="text-[9px] font-medium text-slate-400 italic" data-v-a83446d6${_scopeId}>Waiting for crawler logs…</p></div>`);
                  }
                  if (crawlProgress.value.status === "completed" && crawlProgress.value.manage_url) {
                    _push2(`<div class="flex gap-2" data-v-a83446d6${_scopeId}><a${ssrRenderAttr("href", crawlProgress.value.manage_url)} class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center shadow-md shadow-emerald-100" data-v-a83446d6${_scopeId}> View in Sitemap Manager → </a><button class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" data-v-a83446d6${_scopeId}> Done </button></div>`);
                  } else if (crawlProgress.value.status === "failed") {
                    _push2(`<div class="flex gap-2" data-v-a83446d6${_scopeId}><button class="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" data-v-a83446d6${_scopeId}> Try Again </button></div>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="${ssrRenderClass([msg.role === "user" ? "text-right" : "", "text-[10px] text-slate-400 mt-1"])}" data-v-a83446d6${_scopeId}>${ssrInterpolate(msg.timestamp)}</div></div>`);
              if (msg.role === "user") {
                _push2(`<div class="w-10 h-10 rounded-2xl bg-slate-200 border-2 border-white flex-shrink-0 flex items-center justify-center text-slate-600 shadow-sm ml-4 mt-1 overflow-hidden" data-v-a83446d6${_scopeId}>`);
                if (_ctx.$page.props.auth.user.profile_photo_url) {
                  _push2(`<img${ssrRenderAttr("src", _ctx.$page.props.auth.user.profile_photo_url)} alt="" class="w-full h-full object-cover" data-v-a83446d6${_scopeId}>`);
                } else {
                  _push2(`<div class="text-xs font-bold" data-v-a83446d6${_scopeId}>${ssrInterpolate(_ctx.$page.props.auth.user.name.charAt(0))}</div>`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            });
            _push2(`<!--]-->`);
            if (isTyping.value) {
              _push2(`<div class="flex justify-start animate-in fade-in slide-in-from-bottom-2" data-v-a83446d6${_scopeId}><div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg mr-4 flex-shrink-0" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 animate-pulse" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" data-v-a83446d6${_scopeId}></path></svg></div><div class="px-5 py-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-1.5" data-v-a83446d6${_scopeId}><div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" data-v-a83446d6${_scopeId}></div><div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100" data-v-a83446d6${_scopeId}></div><div class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200" data-v-a83446d6${_scopeId}></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="p-6 bg-white/40 backdrop-blur-md border-t border-white/40" data-v-a83446d6${_scopeId}><div class="max-w-4xl mx-auto relative flex items-end bg-white rounded-3xl border border-slate-200 p-2 pl-6 focus-within:ring-1 focus-within:ring-blue-950/20 transition-all duration-300" data-v-a83446d6${_scopeId}><textarea rows="1" placeholder="Message Pique..." class="flex-1 bg-transparent border-none focus:ring-0 py-4 px-2 text-[15px] resize-none overflow-hidden max-h-40 placeholder:text-slate-400" data-v-a83446d6${_scopeId}>${ssrInterpolate(userInput.value)}</textarea><div class="flex items-center p-2" data-v-a83446d6${_scopeId}><button class="p-2.5 text-slate-400 hover:text-blue-600 transition-colors" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" data-v-a83446d6${_scopeId}></path></svg></button><button${ssrIncludeBooleanAttr(!userInput.value.trim()) ? " disabled" : ""} class="p-3 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl transition-all active:scale-90" data-v-a83446d6${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5" data-v-a83446d6${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" data-v-a83446d6${_scopeId}></path></svg></button></div></div><div class="text-center mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest" data-v-a83446d6${_scopeId}> Pique may occasionally provide AI-generated SEO insights. Verify important data. </div></div></main></div>`);
            _push2(ssrRenderComponent(_sfc_main$2, {
              show: showDeleteModal.value,
              title: "Delete Conversation?",
              message: "Are you sure you want to permanently delete this conversation? This action cannot be undone.",
              confirmText: "Delete",
              onClose: ($event) => showDeleteModal.value = false,
              onConfirm: confirmDelete
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "h-[calc(100vh-140px)] flex flex-col lg:flex-row overflow-hidden bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40" }, [
                createVNode("aside", { class: "w-full lg:w-80 flex flex-col border-r border-slate-200/50 bg-slate-50/50" }, [
                  createVNode("div", { class: "p-6 border-b border-slate-200/50 flex justify-between items-center" }, [
                    createVNode("h2", { class: "text-xl font-bold text-slate-900 tracking-tight" }, "Conversations"),
                    createVNode("button", {
                      onClick: startNewChat,
                      class: "p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95"
                    }, [
                      (openBlock(), createBlock("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        "stroke-width": "2",
                        stroke: "currentColor",
                        class: "w-5 h-5"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          d: "M12 4.5v15m7.5-7.5h-15"
                        })
                      ]))
                    ])
                  ]),
                  createVNode("div", { class: "flex-1 overflow-y-auto p-4 space-y-2" }, [
                    createVNode("div", { class: "px-3 pb-2" }, [
                      createVNode("h3", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest" }, "Recent Chats")
                    ]),
                    (openBlock(true), createBlock(Fragment, null, renderList(history.value, (session) => {
                      return openBlock(), createBlock("div", {
                        key: session.id,
                        class: ["group p-3 border rounded-xl cursor-pointer transition-all relative", currentSessionId.value === session.id ? "bg-white border-blue-200 shadow-sm" : "hover:bg-white/60 border-transparent"]
                      }, [
                        createVNode("div", {
                          onClick: ($event) => switchSession(session.id),
                          class: "pr-8"
                        }, [
                          createVNode("div", {
                            class: ["font-semibold text-slate-800 text-sm truncate", currentSessionId.value === session.id ? "text-blue-600" : ""]
                          }, toDisplayString(session.title), 3),
                          createVNode("div", { class: "text-xs text-slate-400 mt-1" }, toDisplayString(session.updated_at), 1)
                        ], 8, ["onClick"]),
                        createVNode("button", {
                          onClick: withModifiers(($event) => deleteSession(session.id), ["stop"]),
                          class: "absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        }, [
                          (openBlock(), createBlock("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            "stroke-width": "2",
                            stroke: "currentColor",
                            class: "w-4 h-4"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            })
                          ]))
                        ], 8, ["onClick"])
                      ], 2);
                    }), 128))
                  ]),
                  createVNode("div", { class: "p-6 bg-slate-100/30 border-t border-slate-200/50" }, [
                    createVNode("div", { class: "mb-4" }, [
                      createVNode("label", { class: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block" }, "Active Model"),
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => selectedModel.value = $event,
                        class: "w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold p-2.5 focus:ring-blue-500 focus:border-blue-500"
                      }, [
                        (openBlock(), createBlock(Fragment, null, renderList(models, (model) => {
                          return createVNode("option", {
                            key: model.id,
                            value: model.id
                          }, toDisplayString(model.label), 9, ["value"]);
                        }), 64))
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, selectedModel.value]
                      ])
                    ]),
                    createVNode("div", { class: "flex items-center space-x-3 p-3 rounded-2xl bg-white border border-slate-200/50 shadow-sm shadow-slate-100" }, [
                      createVNode("div", { class: "w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold" }, [
                        (openBlock(), createBlock("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          "stroke-width": "2",
                          stroke: "currentColor",
                          class: "w-5 h-5"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            d: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          })
                        ]))
                      ]),
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("div", { class: "text-xs font-bold text-slate-900 leading-tight" }, "Credits Remaining"),
                        createVNode("div", { class: "text-sm text-blue-600 font-extrabold" }, toDisplayString(balance.value.toFixed(2)), 1)
                      ])
                    ])
                  ])
                ]),
                createVNode("main", { class: "flex-1 flex flex-col relative bg-white/20 backdrop-blur-sm shadow-inner" }, [
                  createVNode("div", {
                    ref_key: "chatContainer",
                    ref: chatContainer,
                    class: "flex-1 overflow-y-auto overflow-x-auto p-6 lg:p-10 space-y-8 scroll-smooth scrollbar-hide"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(messages.value, (msg) => {
                      return openBlock(), createBlock("div", {
                        key: msg.id,
                        class: ["flex animate-in fade-in slide-in-from-bottom-4 duration-500", msg.role === "user" ? "justify-end" : "justify-start"]
                      }, [
                        msg.role === "agent" ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "w-10 h-10 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg mr-4 mt-1"
                        }, [
                          (openBlock(), createBlock("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            "stroke-width": "2",
                            stroke: "currentColor",
                            class: "w-6 h-6"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              d: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                            })
                          ]))
                        ])) : createCommentVNode("", true),
                        createVNode("div", { class: "max-w-[85%] lg:max-w-[70%] space-y-3" }, [
                          createVNode("div", {
                            class: ["px-5 py-4 rounded-3xl text-slate-800 transition-all", msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none"]
                          }, [
                            createVNode("div", {
                              class: "prose prose-slate prose-sm max-w-none text-[15px] leading-relaxed markdown-content",
                              innerHTML: renderMarkdown(cleanContent(msg.content))
                            }, null, 8, ["innerHTML"]),
                            extractButtons(msg.content).length > 0 ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "mt-4 flex flex-wrap gap-2"
                            }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(extractButtons(msg.content), (btn) => {
                                return openBlock(), createBlock("button", {
                                  key: btn.label,
                                  onClick: ($event) => handleAction(btn),
                                  class: [
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm border",
                                    btn.type === "toggle" ? selectedToggles.value.includes(btn.value) ? "bg-blue-600 border-blue-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white"
                                  ]
                                }, [
                                  btn.type === "toggle" && selectedToggles.value.includes(btn.value) ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "mr-1"
                                  }, "✓")) : createCommentVNode("", true),
                                  createTextVNode(" " + toDisplayString(btn.label), 1)
                                ], 10, ["onClick"]);
                              }), 128))
                            ])) : createCommentVNode("", true),
                            msg.action ? (openBlock(), createBlock("div", {
                              key: 1,
                              class: "mt-4 p-3 bg-blue-50/80 border border-blue-200/50 rounded-2xl shadow-sm"
                            }, [
                              createVNode("div", { class: "flex items-center space-x-2 mb-2" }, [
                                createVNode("div", { class: "w-2 h-2 bg-blue-600 rounded-full animate-pulse" }),
                                createVNode("span", { class: "text-[10px] font-extrabold text-blue-800 uppercase tracking-widest" }, toDisplayString(msg.action.label || msg.action), 1)
                              ]),
                              msg.action.data ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "bg-white/60 rounded-xl p-2.5 space-y-2"
                              }, [
                                msg.action.action === "keyword_research" ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "space-y-1.5"
                                }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList((msg.action.data.organic || []).slice(0, 3), (kw) => {
                                    return openBlock(), createBlock("div", {
                                      key: kw.query,
                                      class: "flex justify-between items-center text-[13px]"
                                    }, [
                                      createVNode("span", { class: "text-slate-700 font-medium font-mono text-[11px]" }, toDisplayString(kw.query), 1),
                                      createVNode("span", { class: "px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold" }, "POS " + toDisplayString(kw.position), 1)
                                    ]);
                                  }), 128)),
                                  msg.action.query ? (openBlock(), createBlock("a", {
                                    key: 0,
                                    href: _ctx.route("keywords.research", { q: msg.action.query }),
                                    class: "block text-center text-[10px] font-bold text-blue-600 hover:text-blue-700 pt-1"
                                  }, " View All Results → ", 8, ["href"])) : createCommentVNode("", true)
                                ])) : createCommentVNode("", true),
                                msg.action.action === "forecast" ? (openBlock(), createBlock("div", {
                                  key: 1,
                                  class: "flex items-center justify-around py-1"
                                }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(msg.action.data, (val, metric) => {
                                    return openBlock(), createBlock("div", {
                                      key: metric,
                                      class: "text-center"
                                    }, [
                                      createVNode("div", { class: "text-[9px] text-slate-400 uppercase font-bold" }, toDisplayString(metric), 1),
                                      createVNode("div", { class: "text-[13px] font-bold text-slate-800" }, toDisplayString(val.toFixed(0)), 1)
                                    ]);
                                  }), 128))
                                ])) : createCommentVNode("", true),
                                msg.action.action === "schema_validation" ? (openBlock(), createBlock("div", {
                                  key: 2,
                                  class: "space-y-1"
                                }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(msg.action.data, (res) => {
                                    return openBlock(), createBlock("div", {
                                      key: res.name,
                                      class: "flex items-center justify-between text-[11px]"
                                    }, [
                                      createVNode("span", { class: "text-slate-600 truncate mr-2" }, toDisplayString(res.name), 1),
                                      createVNode("span", {
                                        class: [res.validation?.valid ? "text-green-600" : "text-red-500", "font-bold uppercase text-[9px]"]
                                      }, toDisplayString(res.validation?.valid ? "Valid" : "Errors"), 3)
                                    ]);
                                  }), 128))
                                ])) : createCommentVNode("", true)
                              ])) : createCommentVNode("", true)
                            ])) : createCommentVNode("", true)
                          ], 2),
                          msg.type === "analysis" ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 delay-200"
                          }, [
                            createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                              createVNode("div", { class: "text-sm font-bold text-slate-900" }, "SEO Health Score"),
                              createVNode("div", { class: "px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter" }, toDisplayString(msg.data.health), 1)
                            ]),
                            createVNode("div", { class: "relative h-2 bg-slate-100 rounded-full overflow-hidden mb-6" }, [
                              createVNode("div", {
                                class: "absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000",
                                style: { width: msg.data.score + "%" }
                              }, null, 4)
                            ]),
                            createVNode("div", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(msg.data.issues, (issue) => {
                                return openBlock(), createBlock("div", {
                                  key: issue,
                                  class: "flex items-center text-xs text-slate-600"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    xmlns: "http://www.w3.org/2000/svg",
                                    viewBox: "0 0 20 20",
                                    fill: "currentColor",
                                    class: "w-4 h-4 text-amber-500 mr-2"
                                  }, [
                                    createVNode("path", {
                                      "fill-rule": "evenodd",
                                      d: "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
                                      "clip-rule": "evenodd"
                                    })
                                  ])),
                                  createTextVNode(" " + toDisplayString(issue), 1)
                                ]);
                              }), 128))
                            ]),
                            createVNode("button", { class: "w-full mt-4 py-2 border border-blue-600 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors" }, "Generate Fix Plan")
                          ])) : createCommentVNode("", true),
                          msg.type === "suggestions" ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4"
                          }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(msg.items, (item) => {
                              return openBlock(), createBlock("button", {
                                key: item.id,
                                onClick: ($event) => handleAction(item.id),
                                class: "flex items-center p-3 text-left bg-white/80 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-2xl group transition-all duration-300 active:scale-95 shadow-sm"
                              }, [
                                createVNode("div", { class: "w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-white/20 flex items-center justify-center mr-3 transition-colors" }, [
                                  item.id === "audit" ? (openBlock(), createBlock("svg", {
                                    key: 0,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "2",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600 group-hover:text-white"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                                    })
                                  ])) : createCommentVNode("", true),
                                  item.id === "keywords" ? (openBlock(), createBlock("svg", {
                                    key: 1,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "2",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600 group-hover:text-white"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                    })
                                  ])) : createCommentVNode("", true),
                                  item.id === "schema" ? (openBlock(), createBlock("svg", {
                                    key: 2,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "2",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600 group-hover:text-white"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                                    })
                                  ])) : createCommentVNode("", true),
                                  item.id === "content" ? (openBlock(), createBlock("svg", {
                                    key: 3,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "2",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600 group-hover:text-white"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                    })
                                  ])) : createCommentVNode("", true),
                                  item.id === "google_analytics" ? (openBlock(), createBlock("svg", {
                                    key: 4,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "1.5",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                                    })
                                  ])) : createCommentVNode("", true),
                                  item.id === "pixel" ? (openBlock(), createBlock("svg", {
                                    key: 5,
                                    xmlns: "http://www.w3.org/2000/svg",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    "stroke-width": "1.5",
                                    stroke: "currentColor",
                                    class: "w-4 h-4 text-blue-600"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      d: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                                    })
                                  ])) : createCommentVNode("", true)
                                ]),
                                createVNode("span", { class: "text-sm font-semibold" }, toDisplayString(item.label), 1)
                              ], 8, ["onClick"]);
                            }), 128))
                          ])) : createCommentVNode("", true),
                          msg.type === "crawl_ui" ? (openBlock(), createBlock("div", {
                            key: 2,
                            class: "mt-4 w-full"
                          }, [
                            crawlStep.value === "select" ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                            }, [
                              createVNode("div", { class: "px-5 py-4 border-b border-slate-50 flex items-center justify-between" }, [
                                createVNode("div", { class: "flex items-center gap-2" }, [
                                  createVNode("div", { class: "w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center" }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "w-3.5 h-3.5 text-indigo-600",
                                      fill: "none",
                                      stroke: "currentColor",
                                      viewBox: "0 0 24 24"
                                    }, [
                                      createVNode("path", {
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                        "stroke-width": "2",
                                        d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                      })
                                    ]))
                                  ]),
                                  createVNode("span", { class: "text-[11px] font-black text-slate-700 uppercase tracking-widest" }, "Crawl Containers")
                                ]),
                                createVNode("span", { class: "text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest" }, toDisplayString(crawlContainers.value.length) + " container" + toDisplayString(crawlContainers.value.length !== 1 ? "s" : ""), 1)
                              ]),
                              crawlContainers.value.length === 0 ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "px-5 py-8 text-center"
                              }, [
                                createVNode("div", { class: "w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3" }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-6 h-6 text-slate-300",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                                    })
                                  ]))
                                ]),
                                createVNode("p", { class: "text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3" }, "No containers yet"),
                                createVNode("p", { class: "text-[10px] text-slate-400" }, "Create your first crawl container to start scanning your site.")
                              ])) : (openBlock(), createBlock("div", {
                                key: 1,
                                class: "divide-y divide-slate-50 max-h-60 overflow-y-auto"
                              }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(crawlContainers.value, (c) => {
                                  return openBlock(), createBlock("div", {
                                    key: c.id,
                                    class: "flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors"
                                  }, [
                                    createVNode("div", { class: "flex-1 min-w-0" }, [
                                      createVNode("p", { class: "text-[12px] font-bold text-slate-800 truncate" }, toDisplayString(c.name), 1),
                                      createVNode("p", { class: "text-[9px] text-slate-400 truncate" }, toDisplayString(c.site_url), 1),
                                      createVNode("div", { class: "flex items-center gap-2 mt-1" }, [
                                        createVNode("span", {
                                          class: ["text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", {
                                            "bg-emerald-50 text-emerald-700": c.last_crawl_status === "completed",
                                            "bg-blue-50 text-blue-700": c.last_crawl_status === "dispatched" || c.last_crawl_status === "crawling",
                                            "bg-slate-100 text-slate-500": !c.last_crawl_status,
                                            "bg-red-50 text-red-600": c.last_crawl_status === "failed"
                                          }]
                                        }, toDisplayString(c.last_crawl_status || "not crawled"), 3),
                                        createVNode("span", { class: "text-[8px] text-slate-400 font-medium" }, toDisplayString(c.links_count) + " links", 1)
                                      ])
                                    ]),
                                    createVNode("button", {
                                      onClick: ($event) => launchCrawlForContainer(c),
                                      disabled: crawlFormSubmitting.value,
                                      class: "ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex-shrink-0"
                                    }, toDisplayString(crawlFormSubmitting.value && activeSitemapId.value === c.id ? "Starting…" : "Crawl"), 9, ["onClick", "disabled"])
                                  ]);
                                }), 128))
                              ])),
                              createVNode("div", { class: "px-5 py-3 bg-slate-50/50 border-t border-slate-100" }, [
                                createVNode("button", {
                                  onClick: ($event) => crawlStep.value = "create",
                                  class: "w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-50 border border-dashed border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-3.5 h-3.5",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M12 4v16m8-8H4"
                                    })
                                  ])),
                                  createTextVNode(" Create New Container ")
                                ], 8, ["onClick"])
                              ])
                            ])) : createCommentVNode("", true),
                            crawlStep.value === "create" ? (openBlock(), createBlock("div", {
                              key: 1,
                              class: "bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                            }, [
                              createVNode("div", { class: "px-5 py-4 border-b border-slate-50 flex items-center gap-2" }, [
                                createVNode("button", {
                                  onClick: ($event) => crawlStep.value = "select",
                                  class: "w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-3.5 h-3.5",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M15 19l-7-7 7-7"
                                    })
                                  ]))
                                ], 8, ["onClick"]),
                                createVNode("div", { class: "w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center" }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-3.5 h-3.5 text-emerald-600",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M12 4v16m8-8H4"
                                    })
                                  ]))
                                ]),
                                createVNode("span", { class: "text-[11px] font-black text-slate-700 uppercase tracking-widest" }, "New Container")
                              ]),
                              createVNode("div", { class: "px-5 py-4 space-y-3" }, [
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest block" }, "Container Name"),
                                  withDirectives(createVNode("input", {
                                    "onUpdate:modelValue": ($event) => crawlForm.value.name = $event,
                                    type: "text",
                                    placeholder: "e.g. Main Website",
                                    class: "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none"
                                  }, null, 8, ["onUpdate:modelValue"]), [
                                    [vModelText, crawlForm.value.name]
                                  ])
                                ]),
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest block" }, "Sitemap Name"),
                                  withDirectives(createVNode("input", {
                                    "onUpdate:modelValue": ($event) => crawlForm.value.sitemap_name = $event,
                                    type: "text",
                                    placeholder: "e.g. main-sitemap",
                                    class: "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none"
                                  }, null, 8, ["onUpdate:modelValue"]), [
                                    [vModelText, crawlForm.value.sitemap_name]
                                  ]),
                                  createVNode("p", { class: "text-[9px] text-slate-400" }, [
                                    createTextVNode("Becomes the filename: "),
                                    createVNode("code", { class: "text-indigo-600" }, toDisplayString(crawlForm.value.sitemap_name ? crawlForm.value.sitemap_name.toLowerCase().replace(/\s+/g, "-") + ".xml" : "sitemap.xml"), 1)
                                  ])
                                ]),
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("label", { class: "text-[9px] font-black text-slate-400 uppercase tracking-widest block" }, "Site URL"),
                                  withDirectives(createVNode("input", {
                                    "onUpdate:modelValue": ($event) => crawlForm.value.site_url = $event,
                                    type: "url",
                                    placeholder: "https://yoursite.com",
                                    class: "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none"
                                  }, null, 8, ["onUpdate:modelValue"]), [
                                    [vModelText, crawlForm.value.site_url]
                                  ])
                                ]),
                                crawlFormError.value ? (openBlock(), createBlock("p", {
                                  key: 0,
                                  class: "text-[10px] font-bold text-red-500 bg-red-50 rounded-xl px-3 py-2"
                                }, toDisplayString(crawlFormError.value), 1)) : createCommentVNode("", true),
                                createVNode("button", {
                                  onClick: submitCreateContainer,
                                  disabled: crawlFormSubmitting.value,
                                  class: "w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                                }, [
                                  crawlFormSubmitting.value ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                  })) : createCommentVNode("", true),
                                  createTextVNode(" " + toDisplayString(crawlFormSubmitting.value ? "Creating & Launching…" : "Create & Start Crawl"), 1)
                                ], 8, ["disabled"])
                              ])
                            ])) : createCommentVNode("", true),
                            crawlStep.value === "progress" ? (openBlock(), createBlock("div", {
                              key: 2,
                              class: "bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
                            }, [
                              createVNode("div", { class: "px-5 py-4 border-b border-slate-50 flex items-center justify-between" }, [
                                createVNode("div", { class: "flex items-center gap-2" }, [
                                  createVNode("span", { class: "relative flex h-2 w-2 flex-shrink-0" }, [
                                    crawlProgress.value.status !== "completed" ? (openBlock(), createBlock("span", {
                                      key: 0,
                                      class: "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                                    })) : createCommentVNode("", true),
                                    createVNode("span", {
                                      class: ["relative inline-flex rounded-full h-2 w-2", crawlProgress.value.status === "completed" ? "bg-emerald-500" : crawlProgress.value.status === "failed" ? "bg-red-500" : "bg-blue-500"]
                                    }, null, 2)
                                  ]),
                                  createVNode("span", { class: "text-[11px] font-black text-slate-700 uppercase tracking-widest" }, "Crawl in Progress")
                                ]),
                                createVNode("span", {
                                  class: ["text-[10px] font-black", crawlProgress.value.status === "completed" ? "text-emerald-600" : crawlProgress.value.status === "failed" ? "text-red-600" : "text-blue-600"]
                                }, toDisplayString(crawlProgress.value.status?.toUpperCase()), 3)
                              ]),
                              createVNode("div", { class: "px-5 py-4 space-y-4" }, [
                                createVNode("div", { class: "space-y-1.5" }, [
                                  createVNode("div", { class: "flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest" }, [
                                    createVNode("span", null, "Pages Crawled"),
                                    createVNode("span", null, toDisplayString(crawlProgress.value.total_crawled) + " / " + toDisplayString(crawlProgress.value.total_discovered || "?"), 1)
                                  ]),
                                  createVNode("div", { class: "w-full h-2 bg-slate-100 rounded-full overflow-hidden" }, [
                                    createVNode("div", {
                                      class: ["h-full rounded-full transition-all duration-500", crawlProgress.value.status === "completed" ? "bg-emerald-500" : crawlProgress.value.status === "failed" ? "bg-red-500" : "bg-blue-500"],
                                      style: { width: `${crawlProgress.value.pct || 0}%` }
                                    }, null, 6)
                                  ]),
                                  createVNode("p", { class: "text-[9px] text-slate-400 truncate" }, toDisplayString(crawlProgress.value.current_url || "Initializing scanner…"), 1)
                                ]),
                                createVNode("div", { class: "grid grid-cols-3 gap-2" }, [
                                  createVNode("div", { class: "bg-slate-50 rounded-xl p-2.5 text-center" }, [
                                    createVNode("div", { class: "text-[14px] font-black text-slate-900" }, toDisplayString(crawlProgress.value.pct || 0) + "%", 1),
                                    createVNode("div", { class: "text-[8px] font-bold text-slate-400 uppercase tracking-widest" }, "Progress")
                                  ]),
                                  createVNode("div", { class: "bg-slate-50 rounded-xl p-2.5 text-center" }, [
                                    createVNode("div", { class: "text-[14px] font-black text-slate-900" }, toDisplayString(crawlProgress.value.total_crawled), 1),
                                    createVNode("div", { class: "text-[8px] font-bold text-slate-400 uppercase tracking-widest" }, "Crawled")
                                  ]),
                                  createVNode("div", { class: "bg-slate-50 rounded-xl p-2.5 text-center" }, [
                                    createVNode("div", { class: "text-[14px] font-black text-slate-900" }, toDisplayString(crawlProgress.value.links_count || 0), 1),
                                    createVNode("div", { class: "text-[8px] font-bold text-slate-400 uppercase tracking-widest" }, "Indexed")
                                  ])
                                ]),
                                crawlProgress.value.logs && crawlProgress.value.logs.length > 0 ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "bg-slate-950 rounded-xl p-3 max-h-28 overflow-y-auto space-y-0.5"
                                }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(crawlProgress.value.logs, (log, i) => {
                                    return openBlock(), createBlock("p", {
                                      key: i,
                                      class: "text-[9px] font-mono text-slate-400 leading-snug"
                                    }, toDisplayString(log), 1);
                                  }), 128))
                                ])) : (openBlock(), createBlock("div", {
                                  key: 1,
                                  class: "bg-slate-50 rounded-xl p-3 flex items-center gap-2"
                                }, [
                                  crawlProgress.value.status !== "completed" ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0"
                                  })) : createCommentVNode("", true),
                                  createVNode("p", { class: "text-[9px] font-medium text-slate-400 italic" }, "Waiting for crawler logs…")
                                ])),
                                crawlProgress.value.status === "completed" && crawlProgress.value.manage_url ? (openBlock(), createBlock("div", {
                                  key: 2,
                                  class: "flex gap-2"
                                }, [
                                  createVNode("a", {
                                    href: crawlProgress.value.manage_url,
                                    class: "flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center shadow-md shadow-emerald-100"
                                  }, " View in Sitemap Manager → ", 8, ["href"]),
                                  createVNode("button", {
                                    onClick: ($event) => crawlStep.value = "select",
                                    class: "px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                  }, " Done ", 8, ["onClick"])
                                ])) : crawlProgress.value.status === "failed" ? (openBlock(), createBlock("div", {
                                  key: 3,
                                  class: "flex gap-2"
                                }, [
                                  createVNode("button", {
                                    onClick: ($event) => crawlStep.value = "select",
                                    class: "flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                  }, " Try Again ", 8, ["onClick"])
                                ])) : createCommentVNode("", true)
                              ])
                            ])) : createCommentVNode("", true)
                          ])) : createCommentVNode("", true),
                          createVNode("div", {
                            class: ["text-[10px] text-slate-400 mt-1", msg.role === "user" ? "text-right" : ""]
                          }, toDisplayString(msg.timestamp), 3)
                        ]),
                        msg.role === "user" ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "w-10 h-10 rounded-2xl bg-slate-200 border-2 border-white flex-shrink-0 flex items-center justify-center text-slate-600 shadow-sm ml-4 mt-1 overflow-hidden"
                        }, [
                          _ctx.$page.props.auth.user.profile_photo_url ? (openBlock(), createBlock("img", {
                            key: 0,
                            src: _ctx.$page.props.auth.user.profile_photo_url,
                            alt: "",
                            class: "w-full h-full object-cover"
                          }, null, 8, ["src"])) : (openBlock(), createBlock("div", {
                            key: 1,
                            class: "text-xs font-bold"
                          }, toDisplayString(_ctx.$page.props.auth.user.name.charAt(0)), 1))
                        ])) : createCommentVNode("", true)
                      ], 2);
                    }), 128)),
                    isTyping.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "flex justify-start animate-in fade-in slide-in-from-bottom-2"
                    }, [
                      createVNode("div", { class: "w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg mr-4 flex-shrink-0" }, [
                        (openBlock(), createBlock("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          "stroke-width": "2",
                          stroke: "currentColor",
                          class: "w-6 h-6 animate-pulse"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            d: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                          })
                        ]))
                      ]),
                      createVNode("div", { class: "px-5 py-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-1.5" }, [
                        createVNode("div", { class: "w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" }),
                        createVNode("div", { class: "w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100" }),
                        createVNode("div", { class: "w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200" })
                      ])
                    ])) : createCommentVNode("", true)
                  ], 512),
                  createVNode("div", { class: "p-6 bg-white/40 backdrop-blur-md border-t border-white/40" }, [
                    createVNode("div", { class: "max-w-4xl mx-auto relative flex items-end bg-white rounded-3xl border border-slate-200 p-2 pl-6 focus-within:ring-1 focus-within:ring-blue-950/20 transition-all duration-300" }, [
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => userInput.value = $event,
                        onKeydown: withKeys(withModifiers(sendMessage, ["prevent"]), ["enter"]),
                        rows: "1",
                        placeholder: "Message Pique...",
                        class: "flex-1 bg-transparent border-none focus:ring-0 py-4 px-2 text-[15px] resize-none overflow-hidden max-h-40 placeholder:text-slate-400",
                        onInput: (e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                        }
                      }, null, 40, ["onUpdate:modelValue", "onKeydown", "onInput"]), [
                        [vModelText, userInput.value]
                      ]),
                      createVNode("div", { class: "flex items-center p-2" }, [
                        createVNode("button", { class: "p-2.5 text-slate-400 hover:text-blue-600 transition-colors" }, [
                          (openBlock(), createBlock("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            "stroke-width": "2",
                            stroke: "currentColor",
                            class: "w-5 h-5"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              d: "m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                            })
                          ]))
                        ]),
                        createVNode("button", {
                          onClick: sendMessage,
                          disabled: !userInput.value.trim(),
                          class: "p-3 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl transition-all active:scale-90"
                        }, [
                          (openBlock(), createBlock("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            "stroke-width": "2.5",
                            stroke: "currentColor",
                            class: "w-5 h-5"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              d: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                            })
                          ]))
                        ], 8, ["disabled"])
                      ])
                    ]),
                    createVNode("div", { class: "text-center mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest" }, " Pique may occasionally provide AI-generated SEO insights. Verify important data. ")
                  ])
                ])
              ]),
              createVNode(_sfc_main$2, {
                show: showDeleteModal.value,
                title: "Delete Conversation?",
                message: "Are you sure you want to permanently delete this conversation? This action cannot be undone.",
                confirmText: "Delete",
                onClose: ($event) => showDeleteModal.value = false,
                onConfirm: confirmDelete
              }, null, 8, ["show", "onClose"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Pique/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a83446d6"]]);
export {
  Index as default
};
