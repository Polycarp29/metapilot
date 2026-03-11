import { ref, reactive, computed, watch, nextTick, onMounted, mergeProps, withCtx, createVNode, openBlock, createBlock, createTextVNode, toDisplayString, Fragment, renderList, createCommentVNode, withDirectives, vModelText, vModelSelect, Transition, withModifiers, useSSRContext } from "vue";
import { ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { router } from "@inertiajs/vue3";
import axios from "axios";
import _ from "lodash";
import { _ as _sfc_main$1 } from "./AppLayout-CRphHsV-.js";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _sfc_main$2 } from "./ConfirmationModal-EXlnTAwk.js";
import "./Toaster-DHWaylML.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-wIKyrnft.js";
import "pinia";
const _sfc_main = {
  __name: "Index",
  __ssrInlineRender: true,
  props: {
    posts: Array,
    organization: Object,
    categories: Array
  },
  setup(__props) {
    const toast = useToastStore();
    const activeTab = ref("write");
    const editingPost = ref(null);
    ref(false);
    const saving = ref(false);
    const analyzing = ref(false);
    const humanizing = ref(false);
    const auditing = ref(false);
    const showDeleteModal = ref(false);
    const postToDelete = ref(null);
    const form = reactive({
      id: null,
      title: "",
      content: "",
      focus_keyword: "",
      blog_category_id: null,
      status: "draft",
      seo_score: 0,
      ai_content_score: 0,
      secondary_keywords: [],
      long_tail_keywords: [],
      meta_title: "",
      meta_description: "",
      ai_detection_notes: ""
    });
    const humanizer = reactive({
      input: "",
      output: "",
      tone: "professional",
      result: null
    });
    const audit = reactive({
      url: "",
      content: "",
      keywordsRaw: "",
      result: null
    });
    const auditResult = ref(null);
    const seoResults = ref({ score: 0, checks: [] });
    const metrics = reactive({ word_count: 0, reading_time_minutes: 0 });
    const density = reactive({ primary: 0 });
    const editor = ref(null);
    const groupedChecks = computed(() => {
      const groups = {};
      seoResults.value.checks.forEach((check) => {
        const cat = check.category || "General";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(check);
      });
      return groups;
    });
    const semanticKeywords = computed(() => {
      if (!form.focus_keyword) return ["SEO", "Content", "Optimization"];
      return [
        form.focus_keyword + " Strategy",
        "Best Practices for " + form.focus_keyword,
        "How to " + form.focus_keyword,
        "Advanced " + form.focus_keyword
      ];
    });
    const isGeneratingIntro = ref(false);
    const isRefining = ref(false);
    const hasSelection = ref(false);
    const addKeyword = (kw) => {
      if (!form.content.includes(kw)) {
        form.content += ` <p><em>${kw}</em></p>`;
        if (editor.value) {
          editor.value.innerHTML = form.content;
        }
        toast.success(`Keyword added: ${kw}`);
        debouncedAnalysis();
      } else {
        toast.warning("Keyword already exists in content");
      }
    };
    const generateIntro = async () => {
      if (!form.title || !form.focus_keyword) {
        toast.error("Post title and Focus Keyword are required for AI drafting.");
        return;
      }
      isGeneratingIntro.value = true;
      try {
        const resp = await axios.post(route("api.content.generate-intro"), {
          title: form.title,
          focus_keyword: form.focus_keyword
        });
        if (resp.data.intro) {
          form.content = `<p>${resp.data.intro}</p>` + form.content;
          if (editor.value) editor.value.innerHTML = form.content;
          toast.success("AI Introduction generated!");
          debouncedAnalysis();
        }
      } catch (e) {
        toast.error("Failed to generate introduction.");
      } finally {
        isGeneratingIntro.value = false;
      }
    };
    const refineSelection = async () => {
      const selection = window.getSelection().toString();
      if (!selection) return;
      isRefining.value = true;
      try {
        const resp = await axios.post(route("api.content.refine-content"), {
          content: selection,
          instruction: "Improve flow and make it more professional."
        });
        if (resp.data.refined) {
          const range = window.getSelection().getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(resp.data.refined));
          if (editor.value) form.content = editor.value.innerHTML;
          toast.success("Content refined!");
          debouncedAnalysis();
        }
      } catch (e) {
        toast.error("Failed to refine content.");
      } finally {
        isRefining.value = false;
      }
    };
    document.addEventListener("selectionchange", () => {
      hasSelection.value = !!window.getSelection().toString();
    });
    watch(() => editingPost.value, async (newVal) => {
      if (newVal) {
        await nextTick();
        if (editor.value) {
          editor.value.innerHTML = form.content;
        }
      }
    });
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };
    const getScoreColorClass = (score) => {
      if (score >= 80) return "text-emerald-500";
      if (score >= 50) return "text-amber-500";
      return "text-rose-500";
    };
    const getAiScoreClass = (score) => {
      if (score >= 70) return "bg-rose-100 text-rose-600";
      if (score >= 40) return "bg-amber-100 text-amber-600";
      return "bg-emerald-100 text-emerald-600";
    };
    const getAiBgClass = (score) => {
      if (score >= 70) return "bg-rose-500";
      if (score >= 40) return "bg-amber-500";
      return "bg-emerald-500";
    };
    const createNewPost = () => {
      Object.assign(form, {
        id: null,
        title: "Untitled Post",
        content: "<p>Start writing...</p>",
        focus_keyword: "",
        blog_category_id: null,
        status: "draft",
        seo_score: 0,
        ai_content_score: 0,
        meta_title: "",
        meta_description: ""
      });
      editingPost.value = true;
    };
    const editPost = (post) => {
      Object.assign(form, {
        ...post,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || ""
      });
      editingPost.value = post;
      runAnalysis();
    };
    const closeEditor = () => {
      editingPost.value = null;
      router.reload();
    };
    const handleEditorInput = (e) => {
      form.content = e.target.innerHTML;
      debouncedAnalysis();
    };
    const runAnalysis = async () => {
      if (!editingPost.value) return;
      if (!form.id) {
        toast.warning("Please save the post first to run SEO analysis");
        return;
      }
      analyzing.value = true;
      try {
        const res = await axios.post(route("api.content.posts.analyze", form.id));
        seoResults.value = res.data.seo;
        form.seo_score = res.data.post.seo_score;
        form.ai_content_score = res.data.post.ai_content_score;
        form.ai_detection_notes = res.data.post.ai_detection_notes;
        metrics.word_count = res.data.post.word_count;
        metrics.reading_time_minutes = res.data.post.reading_time_minutes;
        toast.success("Analysis complete");
      } catch (err) {
        console.error(err);
        toast.error("Failed to analyze content");
      } finally {
        analyzing.value = false;
      }
    };
    const debouncedAnalysis = _.debounce(runAnalysis, 2e3);
    const saveDraft = async () => {
      saving.value = true;
      try {
        const method = form.id ? "put" : "post";
        const url = form.id ? route("api.content.posts.update", form.id) : route("api.content.posts.store");
        const res = await axios[method](url, form);
        if (res.data.success) {
          form.id = res.data.post.id;
          toast.success("Draft saved successfully");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to save draft");
      } finally {
        saving.value = false;
      }
    };
    const publishPost = async () => {
      form.status = "published";
      await saveDraft();
      closeEditor();
    };
    const deletePost = (post) => {
      postToDelete.value = post;
      showDeleteModal.value = true;
    };
    const confirmDelete = async () => {
      if (!postToDelete.value) return;
      try {
        await axios.delete(route("api.content.posts.destroy", postToDelete.value.id));
        toast.success("Post deleted successfully");
        showDeleteModal.value = false;
        postToDelete.value = null;
        router.reload();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete post");
      }
    };
    const runHumanizer = async () => {
      humanizing.value = true;
      try {
        const res = await axios.post(route("api.content.humanize"), {
          content: humanizer.input,
          tone: humanizer.tone
        });
        humanizer.output = res.data.humanized_text;
        humanizer.result = res.data;
        toast.success("Content humanized successfully");
      } catch (err) {
        console.error(err);
        toast.error("Humanization failed");
      } finally {
        humanizing.value = false;
      }
    };
    const copyOutput = () => {
      navigator.clipboard.writeText(humanizer.output);
      toast.success("Copied to clipboard");
    };
    const runAudit = async () => {
      auditing.value = true;
      try {
        const res = await axios.post(route("api.content.audit"), {
          url: audit.url,
          content: audit.content,
          target_keywords: audit.keywordsRaw.split("\n").filter((k) => k.trim())
        });
        auditResult.value = res.data;
        toast.success("Audit complete");
      } catch (err) {
        console.error(err);
        toast.error("Audit failed");
      } finally {
        auditing.value = false;
      }
    };
    const updateLocalDensity = () => {
      if (!form.content || !form.focus_keyword) {
        density.primary = 0;
        return;
      }
      const text = form.content.replace(/<[^>]*>/g, "").toLowerCase();
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      const occurrences = (text.match(new RegExp(form.focus_keyword.toLowerCase(), "g")) || []).length;
      const kwWordCount = form.focus_keyword.split(/\s+/).length;
      density.primary = words.length > 0 ? occurrences * kwWordCount / words.length * 100 : 0;
    };
    onMounted(() => {
      updateLocalDensity();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Content Hub" }, _attrs), {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1440px] mx-auto pb-20"${_scopeId}><div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"${_scopeId}><div${_scopeId}><h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2"${_scopeId}>Content Hub</h1><p class="text-slate-500 font-medium"${_scopeId}>Create, optimize, and manage your SEO content with AI assistance.</p></div><div class="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-fit"${_scopeId}><button class="${ssrRenderClass([activeTab.value === "write" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700", "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"])}"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Write Content </button><button class="${ssrRenderClass([activeTab.value === "humanizer" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700", "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"])}"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"${_scopeId}></path></svg> AI Humanizer </button><button class="${ssrRenderClass([activeTab.value === "audit" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700", "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"])}"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"${_scopeId}></path></svg> SEO Audit </button></div></div><div class="mt-8"${_scopeId}>`);
            if (activeTab.value === "write" && !editingPost.value) {
              _push2(`<div${_scopeId}><div class="flex items-center justify-between mb-8"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><h2 class="text-2xl font-black text-slate-900"${_scopeId}>Blog Posts</h2><span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black"${_scopeId}>${ssrInterpolate(__props.posts.length)} Total</span></div><button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg> New Post </button></div>`);
              if (__props.posts.length === 0) {
                _push2(`<div class="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"${_scopeId}><div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"${_scopeId}><svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"${_scopeId}></path></svg></div><h3 class="text-xl font-bold text-slate-900 mb-2"${_scopeId}>No Blog Posts Yet</h3><p class="text-slate-500 max-w-sm mx-auto"${_scopeId}>Start creating SEO-optimized content to boost your rankings.</p><button class="mt-6 text-blue-600 font-bold hover:underline"${_scopeId}>Create your first post →</button></div>`);
              } else {
                _push2(`<div class="grid grid-cols-1 gap-4"${_scopeId}><!--[-->`);
                ssrRenderList(__props.posts, (post) => {
                  _push2(`<div class="group bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/30 transition-all flex items-center justify-between"${_scopeId}><div class="flex items-center gap-6 flex-1"${_scopeId}><div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors"${_scopeId}><svg class="w-7 h-7 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-lg font-black text-slate-900 mb-1 flex items-center gap-3"${_scopeId}>${ssrInterpolate(post.title)} `);
                  if (post.status === "published") {
                    _push2(`<span class="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black rounded-lg"${_scopeId}>Published</span>`);
                  } else {
                    _push2(`<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-black rounded-lg"${_scopeId}>${ssrInterpolate(post.status)}</span>`);
                  }
                  _push2(`</h3><div class="flex items-center gap-4 text-sm font-bold text-slate-400"${_scopeId}><span class="flex items-center gap-1.5"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"${_scopeId}></path></svg> ${ssrInterpolate(post.category?.name || "Uncategorized")}</span><span${_scopeId}>•</span><span${_scopeId}>${ssrInterpolate(post.word_count)} words</span><span${_scopeId}>•</span><span${_scopeId}>Updated ${ssrInterpolate(formatDate(post.updated_at))}</span></div></div></div><div class="flex items-center gap-8"${_scopeId}><div class="flex flex-col items-center"${_scopeId}><p class="text-[10px] uppercase font-black text-slate-400 mb-1"${_scopeId}>SEO Health</p><div class="relative w-14 h-14"${_scopeId}><svg class="w-full h-full -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="3"${_scopeId}></circle><circle cx="18" cy="18" r="16" fill="none" class="${ssrRenderClass([getScoreColorClass(post.seo_score), "transition-all duration-1000"])}" stroke-width="3" stroke-dasharray="100"${ssrRenderAttr("stroke-dashoffset", 100 - (post.seo_score || 0))} stroke-linecap="round" style="${ssrRenderStyle({ "stroke": "currentColor" })}"${_scopeId}></circle></svg><div class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900"${_scopeId}>${ssrInterpolate(post.seo_score)}% </div></div></div><div class="flex flex-col items-center"${_scopeId}><p class="text-[10px] uppercase font-black text-slate-400 mb-1"${_scopeId}>Human Score</p><div class="${ssrRenderClass([getAiScoreClass(post.ai_content_score), "px-3 py-1.5 rounded-full font-black text-[11px]"])}"${_scopeId}>${ssrInterpolate(post.ai_content_score)}% </div></div><div class="flex items-center gap-2"${_scopeId}><button class="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg></button><button class="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></div></div></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "humanizer") {
              _push2(`<div${_scopeId}><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"${_scopeId}><div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"${_scopeId}><h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"${_scopeId}><span class="w-2 h-8 bg-blue-600 rounded-full"${_scopeId}></span> Input Content </h3><textarea placeholder="Paste AI-generated content here (min 100 words)..." class="w-full h-96 p-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all resize-none"${_scopeId}>${ssrInterpolate(humanizer.input)}</textarea><div class="mt-8 flex items-center justify-between"${_scopeId}><div class="flex items-center gap-4"${_scopeId}><p class="text-sm font-black text-slate-500 uppercase"${_scopeId}>Tone:</p><select class="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"${_scopeId}><option value="professional"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "professional") : ssrLooseEqual(humanizer.tone, "professional")) ? " selected" : ""}${_scopeId}>Professional</option><option value="conversational"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "conversational") : ssrLooseEqual(humanizer.tone, "conversational")) ? " selected" : ""}${_scopeId}>Conversational</option><option value="academic"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "academic") : ssrLooseEqual(humanizer.tone, "academic")) ? " selected" : ""}${_scopeId}>Academic</option><option value="creative"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "creative") : ssrLooseEqual(humanizer.tone, "creative")) ? " selected" : ""}${_scopeId}>Creative</option></select></div><button${ssrIncludeBooleanAttr(humanizing.value || humanizer.input.length < 100) ? " disabled" : ""} class="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all disabled:opacity-50"${_scopeId}>`);
              if (humanizing.value) {
                _push2(`<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(humanizing.value ? "Humanizing..." : "Humanize Content")}</button></div></div><div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"${_scopeId}>`);
              if (!humanizer.output) {
                _push2(`<div class="h-full flex flex-col items-center justify-center text-center py-20"${_scopeId}><div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6"${_scopeId}><svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"${_scopeId}></path></svg></div><h4 class="text-lg font-bold text-slate-400"${_scopeId}>Humanized output will appear here</h4></div>`);
              } else {
                _push2(`<div${_scopeId}><div class="flex items-center justify-between mb-6"${_scopeId}><h3 class="text-xl font-black text-slate-900 flex items-center gap-3"${_scopeId}><span class="w-2 h-8 bg-emerald-500 rounded-full"${_scopeId}></span> Humanized Result </h3><button class="text-blue-600 font-bold hover:underline"${_scopeId}>Copy Result</button></div><div class="grid grid-cols-2 gap-4 mb-8"${_scopeId}><div class="bg-rose-50 p-4 rounded-2xl border border-rose-100"${_scopeId}><p class="text-[10px] uppercase font-black text-rose-600 mb-1"${_scopeId}>Before AI Score</p><p class="text-2xl font-black text-rose-700"${_scopeId}>${ssrInterpolate(humanizer.result.initial_ai_score)}%</p></div><div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100"${_scopeId}><p class="text-[10px] uppercase font-black text-emerald-600 mb-1"${_scopeId}>After AI Score</p><p class="text-2xl font-black text-emerald-700"${_scopeId}>${ssrInterpolate(humanizer.result.final_ai_score)}%</p></div></div><div class="p-6 bg-slate-50 rounded-3xl font-medium text-slate-700 leading-relaxed overflow-y-auto max-h-[400px]"${_scopeId}>${ssrInterpolate(humanizer.output)}</div></div>`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "audit") {
              _push2(`<div${_scopeId}><div class="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center"${_scopeId}><div class="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8"${_scopeId}><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div><h2 class="text-3xl font-black text-slate-900 mb-4"${_scopeId}>Deep Content Audit</h2><p class="text-slate-500 font-medium mb-12"${_scopeId}>Analyze any URL or pasted content against your target keywords to find gaps and optimization opportunities.</p><div class="space-y-6 text-left"${_scopeId}><div${_scopeId}><label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2"${_scopeId}>Audit Target</label><input${ssrRenderAttr("value", audit.url)} type="url" placeholder="https://example.com/blog-post" class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2"${_scopeId}>Or Paste Content</label><textarea placeholder="Paste your content here for analysis..." class="w-full h-48 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}>${ssrInterpolate(audit.content)}</textarea></div><div${_scopeId}><label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2"${_scopeId}>Target Keywords (one per line)</label><textarea placeholder="primary keyword
secondary keyword..." class="w-full h-32 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}>${ssrInterpolate(audit.keywordsRaw)}</textarea></div><button${ssrIncludeBooleanAttr(auditing.value || !audit.keywordsRaw) ? " disabled" : ""} class="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"${_scopeId}>`);
              if (auditing.value) {
                _push2(`<svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(auditing.value ? "Analyzing Content..." : "Run SEO Audit")}</button></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (editingPost.value) {
              _push2(`<div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end"${_scopeId}><div class="w-full max-w-[95%] h-full bg-slate-50 flex flex-col shadow-2xl relative"${_scopeId}><div class="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between"${_scopeId}><div class="flex items-center gap-6"${_scopeId}><button class="p-2 hover:bg-slate-100 rounded-xl transition-colors"${_scopeId}><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><div${_scopeId}><input${ssrRenderAttr("value", form.title)} type="text" placeholder="Post Title..." class="text-xl font-black text-slate-900 border-none bg-transparent focus:ring-0 p-0 w-96"${_scopeId}></div></div><div class="flex items-center gap-4"${_scopeId}><span class="text-sm font-bold text-slate-400"${_scopeId}>${ssrInterpolate(metrics.word_count)} words • ${ssrInterpolate(metrics.reading_time_minutes)} min read</span><div class="h-8 w-px bg-slate-100 mx-2"${_scopeId}></div><button${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"${_scopeId}>${ssrInterpolate(saving.value ? "Saving..." : "Save Draft")}</button><button class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 transition-all"${_scopeId}> Publish </button></div></div><div class="flex-1 flex overflow-hidden relative"${_scopeId}><div class="flex-1 p-12 overflow-y-auto bg-white custom-scrollbar"${_scopeId}><div class="max-w-4xl mx-auto"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"${_scopeId}><div${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"${_scopeId}>Focus Keyword</label><input${ssrRenderAttr("value", form.focus_keyword)} type="text" placeholder="e.g. SEO Content Guide" class="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}></div><div${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"${_scopeId}>Category</label><select class="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}><option${ssrRenderAttr("value", null)}${ssrIncludeBooleanAttr(Array.isArray(form.blog_category_id) ? ssrLooseContain(form.blog_category_id, null) : ssrLooseEqual(form.blog_category_id, null)) ? " selected" : ""}${_scopeId}>Uncategorized</option><!--[-->`);
              ssrRenderList(__props.categories, (cat) => {
                _push2(`<option${ssrRenderAttr("value", cat.id)}${ssrIncludeBooleanAttr(Array.isArray(form.blog_category_id) ? ssrLooseContain(form.blog_category_id, cat.id) : ssrLooseEqual(form.blog_category_id, cat.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(cat.name)}</option>`);
              });
              _push2(`<!--]--></select></div><div class="col-span-full bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100"${_scopeId}><div class="flex items-center gap-3 mb-6"${_scopeId}><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div><h4 class="text-sm font-black text-slate-900 uppercase tracking-widest"${_scopeId}>Search Appearance</h4></div><div class="grid grid-cols-1 gap-6"${_scopeId}><div${_scopeId}><div class="flex justify-between items-center mb-2"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>SEO Meta Title</label><span class="${ssrRenderClass([(form.meta_title || "").length > 60 ? "text-rose-500" : "text-slate-400", "text-[10px] font-bold"])}"${_scopeId}>${ssrInterpolate((form.meta_title || "").length)} / 60</span></div><input${ssrRenderAttr("value", form.meta_title)} type="text"${ssrRenderAttr("placeholder", form.title)} class="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"${_scopeId}></div><div${_scopeId}><div class="flex justify-between items-center mb-2"${_scopeId}><label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Meta Description</label><span class="${ssrRenderClass([(form.meta_description || "").length > 160 ? "text-rose-500" : "text-slate-400", "text-[10px] font-bold"])}"${_scopeId}>${ssrInterpolate((form.meta_description || "").length)} / 160</span></div><textarea rows="2" placeholder="Briefly summarize your post for search engines..." class="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"${_scopeId}>${ssrInterpolate(form.meta_description)}</textarea></div></div></div></div><div contenteditable="true" class="prose prose-slate prose-xl max-w-none focus:outline-none min-h-[600px]"${_scopeId}></div></div></div><div class="w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar"${_scopeId}><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>Master SEO Score</p><div class="relative inline-flex mb-6"${_scopeId}><svg class="w-32 h-32 -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle class="text-slate-100" stroke-width="3" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"${_scopeId}></circle><circle class="${ssrRenderClass([getScoreColorClass(form.seo_score), "transition-all duration-1000"])}" stroke-width="3" stroke-dasharray="100"${ssrRenderAttr("stroke-dashoffset", 100 - (form.seo_score || 0))} stroke-linecap="round" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"${_scopeId}></circle></svg><span class="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(form.seo_score)}</span></div><button${ssrIncludeBooleanAttr(analyzing.value) ? " disabled" : ""} class="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2"${_scopeId}>`);
              if (analyzing.value) {
                _push2(`<svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(analyzing.value ? "Analyzing..." : "Refresh SEO Audit")}</button></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>Content Stats</h4><div class="space-y-4"${_scopeId}><div class="flex justify-between items-center"${_scopeId}><span class="text-xs font-black text-slate-400 uppercase tracking-wider"${_scopeId}>Word Count</span><span class="text-sm font-black text-slate-900"${_scopeId}>${ssrInterpolate(metrics.word_count)}</span></div><div class="flex justify-between items-center"${_scopeId}><span class="text-xs font-black text-slate-400 uppercase tracking-wider"${_scopeId}>Read Time</span><span class="text-sm font-black text-slate-900"${_scopeId}>${ssrInterpolate(metrics.reading_time_minutes)}m</span></div><div class="flex justify-between items-center"${_scopeId}><span class="text-xs font-black text-slate-400 uppercase tracking-wider"${_scopeId}>KW Density</span><span class="${ssrRenderClass([density.primary > 1 && density.primary < 3 ? "text-emerald-500" : "text-amber-500", "text-sm font-black"])}"${_scopeId}>${ssrInterpolate(density.primary.toFixed(1))}%</span></div></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"${_scopeId}><h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>SERP Preview</h4><div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left"${_scopeId}><p class="text-[8px] text-slate-400 truncate mb-1"${_scopeId}>https://${ssrInterpolate(__props.organization?.slug || "site")}.ai/blog/...</p><h5 class="text-blue-700 text-xs font-bold hover:underline cursor-pointer line-clamp-2 mb-1"${_scopeId}>${ssrInterpolate(form.meta_title || form.title || "Untitled Post")}</h5><p class="text-slate-600 text-[10px] leading-relaxed line-clamp-3"${_scopeId}>${ssrInterpolate(form.meta_description || "Start writing to see how your meta description will appear in Google Search results...")}</p></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"${_scopeId}><div class="flex items-center justify-between mb-6"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>AI Probability</p><span class="${ssrRenderClass([getAiScoreClass(form.ai_content_score), "px-3 py-1 rounded-lg text-xs font-black"])}"${_scopeId}>${ssrInterpolate(form.ai_content_score || 0)}%</span></div><div class="w-full h-2 bg-slate-100 rounded-full mb-6 relative overflow-hidden"${_scopeId}><div class="${ssrRenderClass([getAiBgClass(form.ai_content_score), "h-full rounded-full transition-all duration-1000"])}" style="${ssrRenderStyle({ width: (form.ai_content_score || 0) + "%" })}"${_scopeId}></div></div>`);
              if (form.ai_detection_notes) {
                _push2(`<p class="text-[10px] font-bold text-slate-500 leading-relaxed italic"${_scopeId}>${ssrInterpolate(form.ai_detection_notes)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>Actionable Audit</p><div class="space-y-8"${_scopeId}><!--[-->`);
              ssrRenderList(groupedChecks.value, (checks, category) => {
                _push2(`<div${_scopeId}><h5 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"${_scopeId}>${ssrInterpolate(category)}</h5><div class="space-y-4"${_scopeId}><!--[-->`);
                ssrRenderList(checks, (check) => {
                  _push2(`<div class="group"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="mt-1"${_scopeId}>`);
                  if (check.status === "success") {
                    _push2(`<svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"${_scopeId}></path></svg>`);
                  } else if (check.status === "error") {
                    _push2(`<svg class="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg>`);
                  }
                  _push2(`</div><div${_scopeId}><p class="${ssrRenderClass([check.status === "success" ? "text-slate-700" : "text-slate-500", "text-[10px] font-black leading-tight"])}"${_scopeId}>${ssrInterpolate(check.message)}</p>`);
                  if (check.action && check.status !== "success") {
                    _push2(`<p class="text-[9px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"${_scopeId}>${ssrInterpolate(check.action)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div></div>`);
                });
                _push2(`<!--]--></div></div>`);
              });
              _push2(`<!--]--></div></div><div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"${_scopeId}><div class="flex items-center justify-between mb-6"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest"${_scopeId}>Writing Assistant</p><span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black tracking-tighter"${_scopeId}>AI LIVE</span></div><div class="space-y-4"${_scopeId}><div class="p-4 bg-slate-50 rounded-2xl border border-slate-100"${_scopeId}><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic"${_scopeId}>Semantic Keywords</p><div class="flex flex-wrap gap-2"${_scopeId}><!--[-->`);
              ssrRenderList(semanticKeywords.value, (kw) => {
                _push2(`<span class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-500 cursor-pointer transition-colors"${_scopeId}> + ${ssrInterpolate(kw)}</span>`);
              });
              _push2(`<!--]--></div></div><div class="flex gap-2"${_scopeId}><button${ssrIncludeBooleanAttr(isGeneratingIntro.value) ? " disabled" : ""} class="flex-1 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"${_scopeId}>${ssrInterpolate(isGeneratingIntro.value ? "Drafting..." : "Generate Intro")}</button><button class="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase cursor-not-allowed"${_scopeId}> Next Section </button></div>`);
              if (hasSelection.value) {
                _push2(`<div class="pt-4 border-t border-slate-100"${_scopeId}><p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3"${_scopeId}>Selection Tools</p><button${ssrIncludeBooleanAttr(isRefining.value) ? " disabled" : ""} class="w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"${_scopeId}>${ssrInterpolate(isRefining.value ? "Refining..." : "Refine Tone")}</button></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
            if (auditResult.value) {
              _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"${_scopeId}><div class="bg-white rounded-[3rem] p-12 w-full max-w-4xl shadow-2xl relative overflow-y-auto max-h-[90vh]"${_scopeId}><button class="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"${_scopeId}><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><div class="flex items-center gap-10 mb-12"${_scopeId}><div class="relative w-32 h-32"${_scopeId}><svg class="w-full h-full -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-50" stroke-width="2.5"${_scopeId}></circle><circle cx="18" cy="18" r="16" fill="none" class="text-blue-600" stroke-width="2.5" stroke-dasharray="100"${ssrRenderAttr("stroke-dashoffset", 100 - auditResult.value.seo_score)} stroke-linecap="round" style="${ssrRenderStyle({ "stroke": "currentColor" })}"${_scopeId}></circle></svg><div class="absolute inset-0 flex flex-col items-center justify-center"${_scopeId}><span class="text-4xl font-black text-slate-900 leading-none"${_scopeId}>${ssrInterpolate(auditResult.value.seo_score)}</span><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1"${_scopeId}>Health</span></div></div><div class="text-left"${_scopeId}><h2 class="text-4xl font-black text-slate-900 mb-2"${_scopeId}>Audit Report</h2><p class="text-slate-500 font-bold text-lg leading-snug"${_scopeId}>${ssrInterpolate(auditResult.value.summary)}</p><div class="flex items-center gap-4 mt-4"${_scopeId}><span class="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest"${_scopeId}>Technical SEO</span><span class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest"${_scopeId}>Content Quality</span></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left"${_scopeId}><div class="bg-slate-50 p-8 rounded-3xl"${_scopeId}><h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6"${_scopeId}>Keyword Gaps</h4><ul class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(auditResult.value.keyword_gaps, (gap) => {
                _push2(`<li class="flex items-center gap-3 font-bold text-slate-700"${_scopeId}><span class="w-1.5 h-1.5 bg-blue-500 rounded-full"${_scopeId}></span> ${ssrInterpolate(gap)}</li>`);
              });
              _push2(`<!--]--></ul></div><div class="bg-amber-50 p-8 rounded-3xl"${_scopeId}><h4 class="text-xs font-black text-amber-600 uppercase tracking-widest mb-6"${_scopeId}>High Priority Fixes</h4><ul class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(auditResult.value.fix_priorities, (fix) => {
                _push2(`<li class="flex items-start gap-3 font-bold text-amber-800"${_scopeId}><svg class="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg> ${ssrInterpolate(fix)}</li>`);
              });
              _push2(`<!--]--></ul></div></div><div class="bg-indigo-50 p-8 rounded-3xl text-left"${_scopeId}><h4 class="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6"${_scopeId}>Optimization Tips</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 font-bold text-indigo-900"${_scopeId}><!--[-->`);
              ssrRenderList(auditResult.value.optimization_tips, (tip) => {
                _push2(`<p${_scopeId}>• ${ssrInterpolate(tip)}</p>`);
              });
              _push2(`<!--]--></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_sfc_main$2, {
              show: showDeleteModal.value,
              title: "Delete Post",
              message: `Are you sure you want to delete '${postToDelete.value?.title}'? This action cannot be undone.`,
              "confirm-text": "Delete Post",
              onClose: ($event) => showDeleteModal.value = false,
              onConfirm: confirmDelete
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "max-w-[1440px] mx-auto pb-20" }, [
                createVNode("div", { class: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8" }, [
                  createVNode("div", null, [
                    createVNode("h1", { class: "text-3xl font-extrabold text-slate-900 tracking-tight mb-2" }, "Content Hub"),
                    createVNode("p", { class: "text-slate-500 font-medium" }, "Create, optimize, and manage your SEO content with AI assistance.")
                  ]),
                  createVNode("div", { class: "flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-fit" }, [
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "write",
                      class: ["px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "write" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"]
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
                          d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        })
                      ])),
                      createTextVNode(" Write Content ")
                    ], 10, ["onClick"]),
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "humanizer",
                      class: ["px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "humanizer" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"]
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
                          d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        })
                      ])),
                      createTextVNode(" AI Humanizer ")
                    ], 10, ["onClick"]),
                    createVNode("button", {
                      onClick: ($event) => activeTab.value = "audit",
                      class: ["px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2", activeTab.value === "audit" ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"]
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
                          d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        })
                      ])),
                      createTextVNode(" SEO Audit ")
                    ], 10, ["onClick"])
                  ])
                ]),
                createVNode("div", { class: "mt-8" }, [
                  activeTab.value === "write" && !editingPost.value ? (openBlock(), createBlock("div", { key: 0 }, [
                    createVNode("div", { class: "flex items-center justify-between mb-8" }, [
                      createVNode("div", { class: "flex items-center gap-4" }, [
                        createVNode("h2", { class: "text-2xl font-black text-slate-900" }, "Blog Posts"),
                        createVNode("span", { class: "bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black" }, toDisplayString(__props.posts.length) + " Total", 1)
                      ]),
                      createVNode("button", {
                        onClick: createNewPost,
                        class: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
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
                        createTextVNode(" New Post ")
                      ])
                    ]),
                    __props.posts.length === 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"
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
                            d: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"
                          })
                        ]))
                      ]),
                      createVNode("h3", { class: "text-xl font-bold text-slate-900 mb-2" }, "No Blog Posts Yet"),
                      createVNode("p", { class: "text-slate-500 max-w-sm mx-auto" }, "Start creating SEO-optimized content to boost your rankings."),
                      createVNode("button", {
                        onClick: createNewPost,
                        class: "mt-6 text-blue-600 font-bold hover:underline"
                      }, "Create your first post →")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "grid grid-cols-1 gap-4"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.posts, (post) => {
                        return openBlock(), createBlock("div", {
                          key: post.id,
                          class: "group bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/30 transition-all flex items-center justify-between"
                        }, [
                          createVNode("div", { class: "flex items-center gap-6 flex-1" }, [
                            createVNode("div", { class: "w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors" }, [
                              (openBlock(), createBlock("svg", {
                                class: "w-7 h-7 text-slate-400 group-hover:text-blue-500",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                })
                              ]))
                            ]),
                            createVNode("div", null, [
                              createVNode("h3", { class: "text-lg font-black text-slate-900 mb-1 flex items-center gap-3" }, [
                                createTextVNode(toDisplayString(post.title) + " ", 1),
                                post.status === "published" ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: "px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black rounded-lg"
                                }, "Published")) : (openBlock(), createBlock("span", {
                                  key: 1,
                                  class: "px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-black rounded-lg"
                                }, toDisplayString(post.status), 1))
                              ]),
                              createVNode("div", { class: "flex items-center gap-4 text-sm font-bold text-slate-400" }, [
                                createVNode("span", { class: "flex items-center gap-1.5" }, [
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
                                      d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    })
                                  ])),
                                  createTextVNode(" " + toDisplayString(post.category?.name || "Uncategorized"), 1)
                                ]),
                                createVNode("span", null, "•"),
                                createVNode("span", null, toDisplayString(post.word_count) + " words", 1),
                                createVNode("span", null, "•"),
                                createVNode("span", null, "Updated " + toDisplayString(formatDate(post.updated_at)), 1)
                              ])
                            ])
                          ]),
                          createVNode("div", { class: "flex items-center gap-8" }, [
                            createVNode("div", { class: "flex flex-col items-center" }, [
                              createVNode("p", { class: "text-[10px] uppercase font-black text-slate-400 mb-1" }, "SEO Health"),
                              createVNode("div", { class: "relative w-14 h-14" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-full h-full -rotate-90",
                                  viewBox: "0 0 36 36"
                                }, [
                                  createVNode("circle", {
                                    cx: "18",
                                    cy: "18",
                                    r: "16",
                                    fill: "none",
                                    class: "stroke-slate-100",
                                    "stroke-width": "3"
                                  }),
                                  createVNode("circle", {
                                    cx: "18",
                                    cy: "18",
                                    r: "16",
                                    fill: "none",
                                    class: [getScoreColorClass(post.seo_score), "transition-all duration-1000"],
                                    "stroke-width": "3",
                                    "stroke-dasharray": "100",
                                    "stroke-dashoffset": 100 - (post.seo_score || 0),
                                    "stroke-linecap": "round",
                                    style: { "stroke": "currentColor" }
                                  }, null, 10, ["stroke-dashoffset"])
                                ])),
                                createVNode("div", { class: "absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900" }, toDisplayString(post.seo_score) + "% ", 1)
                              ])
                            ]),
                            createVNode("div", { class: "flex flex-col items-center" }, [
                              createVNode("p", { class: "text-[10px] uppercase font-black text-slate-400 mb-1" }, "Human Score"),
                              createVNode("div", {
                                class: ["px-3 py-1.5 rounded-full font-black text-[11px]", getAiScoreClass(post.ai_content_score)]
                              }, toDisplayString(post.ai_content_score) + "% ", 3)
                            ]),
                            createVNode("div", { class: "flex items-center gap-2" }, [
                              createVNode("button", {
                                onClick: ($event) => editPost(post),
                                class: "p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
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
                                onClick: ($event) => deletePost(post),
                                class: "p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
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
                            ])
                          ])
                        ]);
                      }), 128))
                    ]))
                  ])) : createCommentVNode("", true),
                  activeTab.value === "humanizer" ? (openBlock(), createBlock("div", { key: 1 }, [
                    createVNode("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-8" }, [
                      createVNode("div", { class: "bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm" }, [
                        createVNode("h3", { class: "text-xl font-black text-slate-900 mb-6 flex items-center gap-3" }, [
                          createVNode("span", { class: "w-2 h-8 bg-blue-600 rounded-full" }),
                          createTextVNode(" Input Content ")
                        ]),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => humanizer.input = $event,
                          placeholder: "Paste AI-generated content here (min 100 words)...",
                          class: "w-full h-96 p-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all resize-none"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelText, humanizer.input]
                        ]),
                        createVNode("div", { class: "mt-8 flex items-center justify-between" }, [
                          createVNode("div", { class: "flex items-center gap-4" }, [
                            createVNode("p", { class: "text-sm font-black text-slate-500 uppercase" }, "Tone:"),
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => humanizer.tone = $event,
                              class: "bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                            }, [
                              createVNode("option", { value: "professional" }, "Professional"),
                              createVNode("option", { value: "conversational" }, "Conversational"),
                              createVNode("option", { value: "academic" }, "Academic"),
                              createVNode("option", { value: "creative" }, "Creative")
                            ], 8, ["onUpdate:modelValue"]), [
                              [vModelSelect, humanizer.tone]
                            ])
                          ]),
                          createVNode("button", {
                            onClick: runHumanizer,
                            disabled: humanizing.value || humanizer.input.length < 100,
                            class: "bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all disabled:opacity-50"
                          }, [
                            humanizing.value ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "animate-spin h-5 w-5 text-white",
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
                            createTextVNode(" " + toDisplayString(humanizing.value ? "Humanizing..." : "Humanize Content"), 1)
                          ], 8, ["disabled"])
                        ])
                      ]),
                      createVNode("div", { class: "bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden" }, [
                        !humanizer.output ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "h-full flex flex-col items-center justify-center text-center py-20"
                        }, [
                          createVNode("div", { class: "w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-8 h-8 text-slate-300",
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
                          createVNode("h4", { class: "text-lg font-bold text-slate-400" }, "Humanized output will appear here")
                        ])) : (openBlock(), createBlock("div", { key: 1 }, [
                          createVNode("div", { class: "flex items-center justify-between mb-6" }, [
                            createVNode("h3", { class: "text-xl font-black text-slate-900 flex items-center gap-3" }, [
                              createVNode("span", { class: "w-2 h-8 bg-emerald-500 rounded-full" }),
                              createTextVNode(" Humanized Result ")
                            ]),
                            createVNode("button", {
                              onClick: copyOutput,
                              class: "text-blue-600 font-bold hover:underline"
                            }, "Copy Result")
                          ]),
                          createVNode("div", { class: "grid grid-cols-2 gap-4 mb-8" }, [
                            createVNode("div", { class: "bg-rose-50 p-4 rounded-2xl border border-rose-100" }, [
                              createVNode("p", { class: "text-[10px] uppercase font-black text-rose-600 mb-1" }, "Before AI Score"),
                              createVNode("p", { class: "text-2xl font-black text-rose-700" }, toDisplayString(humanizer.result.initial_ai_score) + "%", 1)
                            ]),
                            createVNode("div", { class: "bg-emerald-50 p-4 rounded-2xl border border-emerald-100" }, [
                              createVNode("p", { class: "text-[10px] uppercase font-black text-emerald-600 mb-1" }, "After AI Score"),
                              createVNode("p", { class: "text-2xl font-black text-emerald-700" }, toDisplayString(humanizer.result.final_ai_score) + "%", 1)
                            ])
                          ]),
                          createVNode("div", { class: "p-6 bg-slate-50 rounded-3xl font-medium text-slate-700 leading-relaxed overflow-y-auto max-h-[400px]" }, toDisplayString(humanizer.output), 1)
                        ]))
                      ])
                    ])
                  ])) : createCommentVNode("", true),
                  activeTab.value === "audit" ? (openBlock(), createBlock("div", { key: 2 }, [
                    createVNode("div", { class: "max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center" }, [
                      createVNode("div", { class: "w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8" }, [
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
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          })
                        ]))
                      ]),
                      createVNode("h2", { class: "text-3xl font-black text-slate-900 mb-4" }, "Deep Content Audit"),
                      createVNode("p", { class: "text-slate-500 font-medium mb-12" }, "Analyze any URL or pasted content against your target keywords to find gaps and optimization opportunities."),
                      createVNode("div", { class: "space-y-6 text-left" }, [
                        createVNode("div", null, [
                          createVNode("label", { class: "block text-sm font-black text-slate-400 uppercase tracking-wider mb-2" }, "Audit Target"),
                          withDirectives(createVNode("input", {
                            "onUpdate:modelValue": ($event) => audit.url = $event,
                            type: "url",
                            placeholder: "https://example.com/blog-post",
                            class: "w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, audit.url]
                          ])
                        ]),
                        createVNode("div", null, [
                          createVNode("label", { class: "block text-sm font-black text-slate-400 uppercase tracking-wider mb-2" }, "Or Paste Content"),
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => audit.content = $event,
                            placeholder: "Paste your content here for analysis...",
                            class: "w-full h-48 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, audit.content]
                          ])
                        ]),
                        createVNode("div", null, [
                          createVNode("label", { class: "block text-sm font-black text-slate-400 uppercase tracking-wider mb-2" }, "Target Keywords (one per line)"),
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => audit.keywordsRaw = $event,
                            placeholder: "primary keyword\nsecondary keyword...",
                            class: "w-full h-32 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelText, audit.keywordsRaw]
                          ])
                        ]),
                        createVNode("button", {
                          onClick: runAudit,
                          disabled: auditing.value || !audit.keywordsRaw,
                          class: "w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        }, [
                          auditing.value ? (openBlock(), createBlock("svg", {
                            key: 0,
                            class: "animate-spin h-6 w-6 text-white",
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
                          createTextVNode(" " + toDisplayString(auditing.value ? "Analyzing Content..." : "Run SEO Audit"), 1)
                        ], 8, ["disabled"])
                      ])
                    ])
                  ])) : createCommentVNode("", true),
                  createVNode(Transition, {
                    "enter-active-class": "transition duration-500 ease-out",
                    "enter-from-class": "translate-x-full",
                    "enter-to-class": "translate-x-0",
                    "leave-active-class": "transition duration-400 ease-in",
                    "leave-from-class": "translate-x-0",
                    "leave-to-class": "translate-x-full"
                  }, {
                    default: withCtx(() => [
                      editingPost.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end"
                      }, [
                        createVNode("div", { class: "w-full max-w-[95%] h-full bg-slate-50 flex flex-col shadow-2xl relative" }, [
                          createVNode("div", { class: "h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between" }, [
                            createVNode("div", { class: "flex items-center gap-6" }, [
                              createVNode("button", {
                                onClick: closeEditor,
                                class: "p-2 hover:bg-slate-100 rounded-xl transition-colors"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-6 h-6 text-slate-400",
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
                              createVNode("div", null, [
                                withDirectives(createVNode("input", {
                                  "onUpdate:modelValue": ($event) => form.title = $event,
                                  type: "text",
                                  placeholder: "Post Title...",
                                  class: "text-xl font-black text-slate-900 border-none bg-transparent focus:ring-0 p-0 w-96"
                                }, null, 8, ["onUpdate:modelValue"]), [
                                  [vModelText, form.title]
                                ])
                              ])
                            ]),
                            createVNode("div", { class: "flex items-center gap-4" }, [
                              createVNode("span", { class: "text-sm font-bold text-slate-400" }, toDisplayString(metrics.word_count) + " words • " + toDisplayString(metrics.reading_time_minutes) + " min read", 1),
                              createVNode("div", { class: "h-8 w-px bg-slate-100 mx-2" }),
                              createVNode("button", {
                                onClick: saveDraft,
                                disabled: saving.value,
                                class: "px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                              }, toDisplayString(saving.value ? "Saving..." : "Save Draft"), 9, ["disabled"]),
                              createVNode("button", {
                                onClick: publishPost,
                                class: "px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 transition-all"
                              }, " Publish ")
                            ])
                          ]),
                          createVNode("div", { class: "flex-1 flex overflow-hidden relative" }, [
                            createVNode("div", { class: "flex-1 p-12 overflow-y-auto bg-white custom-scrollbar" }, [
                              createVNode("div", { class: "max-w-4xl mx-auto" }, [
                                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8 mb-12" }, [
                                  createVNode("div", null, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" }, "Focus Keyword"),
                                    withDirectives(createVNode("input", {
                                      "onUpdate:modelValue": ($event) => form.focus_keyword = $event,
                                      onBlur: runAnalysis,
                                      type: "text",
                                      placeholder: "e.g. SEO Content Guide",
                                      class: "w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                                    }, null, 40, ["onUpdate:modelValue"]), [
                                      [vModelText, form.focus_keyword]
                                    ])
                                  ]),
                                  createVNode("div", null, [
                                    createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2" }, "Category"),
                                    withDirectives(createVNode("select", {
                                      "onUpdate:modelValue": ($event) => form.blog_category_id = $event,
                                      class: "w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                                    }, [
                                      createVNode("option", { value: null }, "Uncategorized"),
                                      (openBlock(true), createBlock(Fragment, null, renderList(__props.categories, (cat) => {
                                        return openBlock(), createBlock("option", {
                                          key: cat.id,
                                          value: cat.id
                                        }, toDisplayString(cat.name), 9, ["value"]);
                                      }), 128))
                                    ], 8, ["onUpdate:modelValue"]), [
                                      [vModelSelect, form.blog_category_id]
                                    ])
                                  ]),
                                  createVNode("div", { class: "col-span-full bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100" }, [
                                    createVNode("div", { class: "flex items-center gap-3 mb-6" }, [
                                      createVNode("div", { class: "w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center" }, [
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
                                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                          })
                                        ]))
                                      ]),
                                      createVNode("h4", { class: "text-sm font-black text-slate-900 uppercase tracking-widest" }, "Search Appearance")
                                    ]),
                                    createVNode("div", { class: "grid grid-cols-1 gap-6" }, [
                                      createVNode("div", null, [
                                        createVNode("div", { class: "flex justify-between items-center mb-2" }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "SEO Meta Title"),
                                          createVNode("span", {
                                            class: ["text-[10px] font-bold", (form.meta_title || "").length > 60 ? "text-rose-500" : "text-slate-400"]
                                          }, toDisplayString((form.meta_title || "").length) + " / 60", 3)
                                        ]),
                                        withDirectives(createVNode("input", {
                                          "onUpdate:modelValue": ($event) => form.meta_title = $event,
                                          type: "text",
                                          placeholder: form.title,
                                          class: "w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                                        }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                                          [vModelText, form.meta_title]
                                        ])
                                      ]),
                                      createVNode("div", null, [
                                        createVNode("div", { class: "flex justify-between items-center mb-2" }, [
                                          createVNode("label", { class: "block text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Meta Description"),
                                          createVNode("span", {
                                            class: ["text-[10px] font-bold", (form.meta_description || "").length > 160 ? "text-rose-500" : "text-slate-400"]
                                          }, toDisplayString((form.meta_description || "").length) + " / 160", 3)
                                        ]),
                                        withDirectives(createVNode("textarea", {
                                          "onUpdate:modelValue": ($event) => form.meta_description = $event,
                                          rows: "2",
                                          placeholder: "Briefly summarize your post for search engines...",
                                          class: "w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"
                                        }, null, 8, ["onUpdate:modelValue"]), [
                                          [vModelText, form.meta_description]
                                        ])
                                      ])
                                    ])
                                  ])
                                ]),
                                createVNode("div", {
                                  ref_key: "editor",
                                  ref: editor,
                                  contenteditable: "true",
                                  class: "prose prose-slate prose-xl max-w-none focus:outline-none min-h-[600px]",
                                  onInput: handleEditorInput
                                }, null, 544)
                              ])
                            ]),
                            createVNode("div", { class: "w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar" }, [
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center" }, [
                                createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6" }, "Master SEO Score"),
                                createVNode("div", { class: "relative inline-flex mb-6" }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "w-32 h-32 -rotate-90",
                                    viewBox: "0 0 36 36"
                                  }, [
                                    createVNode("circle", {
                                      class: "text-slate-100",
                                      "stroke-width": "3",
                                      stroke: "currentColor",
                                      fill: "transparent",
                                      r: "16",
                                      cx: "18",
                                      cy: "18"
                                    }),
                                    createVNode("circle", {
                                      class: [getScoreColorClass(form.seo_score), "transition-all duration-1000"],
                                      "stroke-width": "3",
                                      "stroke-dasharray": "100",
                                      "stroke-dashoffset": 100 - (form.seo_score || 0),
                                      "stroke-linecap": "round",
                                      stroke: "currentColor",
                                      fill: "transparent",
                                      r: "16",
                                      cx: "18",
                                      cy: "18"
                                    }, null, 10, ["stroke-dashoffset"])
                                  ])),
                                  createVNode("span", { class: "absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900" }, toDisplayString(form.seo_score), 1)
                                ]),
                                createVNode("button", {
                                  onClick: runAnalysis,
                                  disabled: analyzing.value,
                                  class: "w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2"
                                }, [
                                  analyzing.value ? (openBlock(), createBlock("svg", {
                                    key: 0,
                                    class: "animate-spin h-3.5 w-3.5 text-white",
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
                                  createTextVNode(" " + toDisplayString(analyzing.value ? "Analyzing..." : "Refresh SEO Audit"), 1)
                                ], 8, ["disabled"])
                              ]),
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                                createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6" }, "Content Stats"),
                                createVNode("div", { class: "space-y-4" }, [
                                  createVNode("div", { class: "flex justify-between items-center" }, [
                                    createVNode("span", { class: "text-xs font-black text-slate-400 uppercase tracking-wider" }, "Word Count"),
                                    createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString(metrics.word_count), 1)
                                  ]),
                                  createVNode("div", { class: "flex justify-between items-center" }, [
                                    createVNode("span", { class: "text-xs font-black text-slate-400 uppercase tracking-wider" }, "Read Time"),
                                    createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString(metrics.reading_time_minutes) + "m", 1)
                                  ]),
                                  createVNode("div", { class: "flex justify-between items-center" }, [
                                    createVNode("span", { class: "text-xs font-black text-slate-400 uppercase tracking-wider" }, "KW Density"),
                                    createVNode("span", {
                                      class: ["text-sm font-black", density.primary > 1 && density.primary < 3 ? "text-emerald-500" : "text-amber-500"]
                                    }, toDisplayString(density.primary.toFixed(1)) + "%", 3)
                                  ])
                                ])
                              ]),
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                                createVNode("h4", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6" }, "SERP Preview"),
                                createVNode("div", { class: "p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left" }, [
                                  createVNode("p", { class: "text-[8px] text-slate-400 truncate mb-1" }, "https://" + toDisplayString(__props.organization?.slug || "site") + ".ai/blog/...", 1),
                                  createVNode("h5", { class: "text-blue-700 text-xs font-bold hover:underline cursor-pointer line-clamp-2 mb-1" }, toDisplayString(form.meta_title || form.title || "Untitled Post"), 1),
                                  createVNode("p", { class: "text-slate-600 text-[10px] leading-relaxed line-clamp-3" }, toDisplayString(form.meta_description || "Start writing to see how your meta description will appear in Google Search results..."), 1)
                                ])
                              ]),
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                                createVNode("div", { class: "flex items-center justify-between mb-6" }, [
                                  createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "AI Probability"),
                                  createVNode("span", {
                                    class: [getAiScoreClass(form.ai_content_score), "px-3 py-1 rounded-lg text-xs font-black"]
                                  }, toDisplayString(form.ai_content_score || 0) + "%", 3)
                                ]),
                                createVNode("div", { class: "w-full h-2 bg-slate-100 rounded-full mb-6 relative overflow-hidden" }, [
                                  createVNode("div", {
                                    class: [getAiBgClass(form.ai_content_score), "h-full rounded-full transition-all duration-1000"],
                                    style: { width: (form.ai_content_score || 0) + "%" }
                                  }, null, 6)
                                ]),
                                form.ai_detection_notes ? (openBlock(), createBlock("p", {
                                  key: 0,
                                  class: "text-[10px] font-bold text-slate-500 leading-relaxed italic"
                                }, toDisplayString(form.ai_detection_notes), 1)) : createCommentVNode("", true)
                              ]),
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                                createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6" }, "Actionable Audit"),
                                createVNode("div", { class: "space-y-8" }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(groupedChecks.value, (checks, category) => {
                                    return openBlock(), createBlock("div", { key: category }, [
                                      createVNode("h5", { class: "text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4" }, toDisplayString(category), 1),
                                      createVNode("div", { class: "space-y-4" }, [
                                        (openBlock(true), createBlock(Fragment, null, renderList(checks, (check) => {
                                          return openBlock(), createBlock("div", {
                                            key: check.id,
                                            class: "group"
                                          }, [
                                            createVNode("div", { class: "flex items-start gap-3" }, [
                                              createVNode("div", { class: "mt-1" }, [
                                                check.status === "success" ? (openBlock(), createBlock("svg", {
                                                  key: 0,
                                                  class: "w-3.5 h-3.5 text-emerald-500 shrink-0",
                                                  fill: "none",
                                                  stroke: "currentColor",
                                                  viewBox: "0 0 24 24"
                                                }, [
                                                  createVNode("path", {
                                                    "stroke-linecap": "round",
                                                    "stroke-linejoin": "round",
                                                    "stroke-width": "4",
                                                    d: "M5 13l4 4L19 7"
                                                  })
                                                ])) : check.status === "error" ? (openBlock(), createBlock("svg", {
                                                  key: 1,
                                                  class: "w-3.5 h-3.5 text-rose-500 shrink-0",
                                                  fill: "none",
                                                  stroke: "currentColor",
                                                  viewBox: "0 0 24 24"
                                                }, [
                                                  createVNode("path", {
                                                    "stroke-linecap": "round",
                                                    "stroke-linejoin": "round",
                                                    "stroke-width": "4",
                                                    d: "M6 18L18 6M6 6l12 12"
                                                  })
                                                ])) : (openBlock(), createBlock("svg", {
                                                  key: 2,
                                                  class: "w-3.5 h-3.5 text-amber-500 shrink-0",
                                                  fill: "none",
                                                  stroke: "currentColor",
                                                  viewBox: "0 0 24 24"
                                                }, [
                                                  createVNode("path", {
                                                    "stroke-linecap": "round",
                                                    "stroke-linejoin": "round",
                                                    "stroke-width": "4",
                                                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"
                                                  })
                                                ]))
                                              ]),
                                              createVNode("div", null, [
                                                createVNode("p", {
                                                  class: ["text-[10px] font-black leading-tight", check.status === "success" ? "text-slate-700" : "text-slate-500"]
                                                }, toDisplayString(check.message), 3),
                                                check.action && check.status !== "success" ? (openBlock(), createBlock("p", {
                                                  key: 0,
                                                  class: "text-[9px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                }, toDisplayString(check.action), 1)) : createCommentVNode("", true)
                                              ])
                                            ])
                                          ]);
                                        }), 128))
                                      ])
                                    ]);
                                  }), 128))
                                ])
                              ]),
                              createVNode("div", { class: "bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm" }, [
                                createVNode("div", { class: "flex items-center justify-between mb-6" }, [
                                  createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest" }, "Writing Assistant"),
                                  createVNode("span", { class: "px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black tracking-tighter" }, "AI LIVE")
                                ]),
                                createVNode("div", { class: "space-y-4" }, [
                                  createVNode("div", { class: "p-4 bg-slate-50 rounded-2xl border border-slate-100" }, [
                                    createVNode("p", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic" }, "Semantic Keywords"),
                                    createVNode("div", { class: "flex flex-wrap gap-2" }, [
                                      (openBlock(true), createBlock(Fragment, null, renderList(semanticKeywords.value, (kw) => {
                                        return openBlock(), createBlock("span", {
                                          key: kw,
                                          onClick: ($event) => addKeyword(kw),
                                          class: "px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-500 cursor-pointer transition-colors"
                                        }, " + " + toDisplayString(kw), 9, ["onClick"]);
                                      }), 128))
                                    ])
                                  ]),
                                  createVNode("div", { class: "flex gap-2" }, [
                                    createVNode("button", {
                                      onClick: generateIntro,
                                      disabled: isGeneratingIntro.value,
                                      class: "flex-1 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                                    }, toDisplayString(isGeneratingIntro.value ? "Drafting..." : "Generate Intro"), 9, ["disabled"]),
                                    createVNode("button", {
                                      onClick: _ctx.generateNextIdea,
                                      class: "flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase cursor-not-allowed"
                                    }, " Next Section ", 8, ["onClick"])
                                  ]),
                                  hasSelection.value ? (openBlock(), createBlock("div", {
                                    key: 0,
                                    class: "pt-4 border-t border-slate-100"
                                  }, [
                                    createVNode("p", { class: "text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3" }, "Selection Tools"),
                                    createVNode("button", {
                                      onClick: refineSelection,
                                      disabled: isRefining.value,
                                      class: "w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                    }, toDisplayString(isRefining.value ? "Refining..." : "Refine Tone"), 9, ["disabled"])
                                  ])) : createCommentVNode("", true)
                                ])
                              ])
                            ])
                          ])
                        ])
                      ])) : createCommentVNode("", true)
                    ]),
                    _: 1
                  })
                ])
              ]),
              createVNode(Transition, {
                "enter-active-class": "duration-300 ease-out",
                "enter-from-class": "opacity-0 scale-95",
                "enter-to-class": "opacity-100 scale-100",
                "leave-active-class": "duration-200 ease-in",
                "leave-from-class": "opacity-100 scale-100",
                "leave-to-class": "opacity-0 scale-95"
              }, {
                default: withCtx(() => [
                  auditResult.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md",
                    onClick: withModifiers(($event) => auditResult.value = null, ["self"])
                  }, [
                    createVNode("div", { class: "bg-white rounded-[3rem] p-12 w-full max-w-4xl shadow-2xl relative overflow-y-auto max-h-[90vh]" }, [
                      createVNode("button", {
                        onClick: ($event) => auditResult.value = null,
                        class: "absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-8 h-8",
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
                      ], 8, ["onClick"]),
                      createVNode("div", { class: "flex items-center gap-10 mb-12" }, [
                        createVNode("div", { class: "relative w-32 h-32" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-full h-full -rotate-90",
                            viewBox: "0 0 36 36"
                          }, [
                            createVNode("circle", {
                              cx: "18",
                              cy: "18",
                              r: "16",
                              fill: "none",
                              class: "stroke-slate-50",
                              "stroke-width": "2.5"
                            }),
                            createVNode("circle", {
                              cx: "18",
                              cy: "18",
                              r: "16",
                              fill: "none",
                              class: "text-blue-600",
                              "stroke-width": "2.5",
                              "stroke-dasharray": "100",
                              "stroke-dashoffset": 100 - auditResult.value.seo_score,
                              "stroke-linecap": "round",
                              style: { "stroke": "currentColor" }
                            }, null, 8, ["stroke-dashoffset"])
                          ])),
                          createVNode("div", { class: "absolute inset-0 flex flex-col items-center justify-center" }, [
                            createVNode("span", { class: "text-4xl font-black text-slate-900 leading-none" }, toDisplayString(auditResult.value.seo_score), 1),
                            createVNode("span", { class: "text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1" }, "Health")
                          ])
                        ]),
                        createVNode("div", { class: "text-left" }, [
                          createVNode("h2", { class: "text-4xl font-black text-slate-900 mb-2" }, "Audit Report"),
                          createVNode("p", { class: "text-slate-500 font-bold text-lg leading-snug" }, toDisplayString(auditResult.value.summary), 1),
                          createVNode("div", { class: "flex items-center gap-4 mt-4" }, [
                            createVNode("span", { class: "px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest" }, "Technical SEO"),
                            createVNode("span", { class: "px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest" }, "Content Quality")
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left" }, [
                        createVNode("div", { class: "bg-slate-50 p-8 rounded-3xl" }, [
                          createVNode("h4", { class: "text-xs font-black text-slate-400 uppercase tracking-widest mb-6" }, "Keyword Gaps"),
                          createVNode("ul", { class: "space-y-3" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.keyword_gaps, (gap) => {
                              return openBlock(), createBlock("li", {
                                key: gap,
                                class: "flex items-center gap-3 font-bold text-slate-700"
                              }, [
                                createVNode("span", { class: "w-1.5 h-1.5 bg-blue-500 rounded-full" }),
                                createTextVNode(" " + toDisplayString(gap), 1)
                              ]);
                            }), 128))
                          ])
                        ]),
                        createVNode("div", { class: "bg-amber-50 p-8 rounded-3xl" }, [
                          createVNode("h4", { class: "text-xs font-black text-amber-600 uppercase tracking-widest mb-6" }, "High Priority Fixes"),
                          createVNode("ul", { class: "space-y-3" }, [
                            (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.fix_priorities, (fix) => {
                              return openBlock(), createBlock("li", {
                                key: fix,
                                class: "flex items-start gap-3 font-bold text-amber-800"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-5 h-5 text-amber-600 mt-0.5 shrink-0",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"
                                  })
                                ])),
                                createTextVNode(" " + toDisplayString(fix), 1)
                              ]);
                            }), 128))
                          ])
                        ])
                      ]),
                      createVNode("div", { class: "bg-indigo-50 p-8 rounded-3xl text-left" }, [
                        createVNode("h4", { class: "text-xs font-black text-indigo-600 uppercase tracking-widest mb-6" }, "Optimization Tips"),
                        createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 font-bold text-indigo-900" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.optimization_tips, (tip) => {
                            return openBlock(), createBlock("p", { key: tip }, "• " + toDisplayString(tip), 1);
                          }), 128))
                        ])
                      ])
                    ])
                  ], 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                _: 1
              }),
              createVNode(_sfc_main$2, {
                show: showDeleteModal.value,
                title: "Delete Post",
                message: `Are you sure you want to delete '${postToDelete.value?.title}'? This action cannot be undone.`,
                "confirm-text": "Delete Post",
                onClose: ($event) => showDeleteModal.value = false,
                onConfirm: confirmDelete
              }, null, 8, ["show", "message", "onClose"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Content/Index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
