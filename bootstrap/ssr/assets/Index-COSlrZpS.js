import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick, mergeProps, withCtx, createVNode, toDisplayString, openBlock, createBlock, createTextVNode, createCommentVNode, Fragment, renderList, withDirectives, vModelText, vModelSelect, Transition, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { router } from "@inertiajs/vue3";
import axios from "axios";
import _ from "lodash";
import { _ as _sfc_main$1 } from "./AppLayout-_8C90KQ4.js";
import { u as useToastStore } from "./useToastStore-CP66SL3r.js";
import { _ as _sfc_main$2 } from "./ConfirmationModal-EXlnTAwk.js";
import "./Toaster-DHWaylML.js";
import "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./BrandLogo-DhDYxbtK.js";
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
    const focusMode = ref(false);
    const validationErrors = reactive({
      title: false,
      focus_keyword: false
    });
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
      canonical_url: "",
      featured_image_url: "",
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
    const seoTier = computed(() => {
      const score = form.seo_score || 0;
      if (score >= 90) return { label: "Perfect", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" };
      if (score >= 80) return { label: "Optimized", color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100" };
      if (score >= 60) return { label: "Good", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" };
      if (score >= 40) return { label: "Fair", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" };
      return { label: "Critical", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" };
    });
    const scoreBreakdown = computed(() => {
      const checks = seoResults.value.checks || [];
      const breakdown = {
        content: { count: 0, total: 0, label: "Content" },
        keywords: { count: 0, total: 0, label: "Keywords" },
        meta: { count: 0, total: 0, label: "Structure" }
      };
      checks.forEach((c) => {
        const cat = (c.category || "").toLowerCase();
        let key = "content";
        if (cat.includes("keyword")) key = "keywords";
        if (cat.includes("meta") || cat.includes("title")) key = "meta";
        breakdown[key].total++;
        if (c.status === "success") breakdown[key].count++;
      });
      return Object.values(breakdown).map((b) => ({
        ...b,
        percent: b.total > 0 ? Math.round(b.count / b.total * 100) : 0
      }));
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
    const isGeneratingOutline = ref(false);
    const isRefining = ref(false);
    const hasSelection = ref(false);
    const addKeyword = (kw) => {
      if (!form.content.includes(kw)) {
        const p = document.createElement("p");
        p.innerHTML = `<em>${kw}</em>`;
        if (editor.value) {
          editor.value.appendChild(p);
          form.content = editor.value.innerHTML;
        }
        toast.success(`Keyword added: ${kw}`);
        debouncedAnalysis();
      } else {
        toast.warning("Keyword already exists in content");
      }
    };
    const format = (command, value = null) => {
      document.execCommand(command, false, value);
      if (editor.value) form.content = editor.value.innerHTML;
    };
    const handleAiError = (err) => {
      console.error("[AI Error]", err.response?.status, err.response?.data);
      if (err.response?.status === 402) {
        toast.error("Insufficient Credits — top up your balance to use AI features.");
        return;
      }
      if (err.response?.status === 422) {
        const messages = Object.values(err.response?.data?.errors || {}).flat().join(" ");
        toast.error("Validation error: " + (messages || "Check your inputs."));
        return;
      }
      if (err.response?.status === 500) {
        toast.error("Server error — the AI service may be unavailable. Check your API key.");
        return;
      }
      toast.error(err.response?.data?.error || err.response?.data?.message || "AI request failed.");
    };
    const generateIntro = async () => {
      validationErrors.title = !form.title;
      validationErrors.focus_keyword = !form.focus_keyword;
      if (validationErrors.title || validationErrors.focus_keyword) {
        toast.error("Post Title and Focus Keyword are required for AI drafting.");
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
        handleAiError(e);
      } finally {
        isGeneratingIntro.value = false;
      }
    };
    const generateOutline = async () => {
      validationErrors.title = !form.title;
      if (validationErrors.title) {
        toast.error("A Post Title is required to generate an outline.");
        return;
      }
      isGeneratingOutline.value = true;
      try {
        const resp = await axios.post(route("api.content.generate-outline"), {
          topic: form.title,
          keywords: form.focus_keyword ? [form.focus_keyword] : []
        });
        if (resp.data && resp.data.outline) {
          const outlineHtml = resp.data.outline.map((section) => {
            const subsHtml = (section.subsections || []).map((sub) => `<li>${sub}</li>`).join("");
            return `<h2>${section.heading}</h2>${subsHtml ? `<ul>${subsHtml}</ul>` : ""}`;
          }).join("");
          form.content = outlineHtml + form.content;
          if (editor.value) editor.value.innerHTML = form.content;
          toast.success("Outline generated — start filling in each section!");
          updateLocalDensity();
          debouncedAnalysis();
        }
      } catch (e) {
        handleAiError(e);
      } finally {
        isGeneratingOutline.value = false;
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
        handleAiError(e);
      } finally {
        isRefining.value = false;
      }
    };
    const onSelectionChange = () => {
      hasSelection.value = !!window.getSelection().toString();
    };
    onMounted(() => document.addEventListener("selectionchange", onSelectionChange));
    onUnmounted(() => document.removeEventListener("selectionchange", onSelectionChange));
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
    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab !== "audit") auditResult.value = null;
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
        meta_description: "",
        canonical_url: "",
        featured_image_url: ""
      });
      editingPost.value = true;
    };
    const editPost = (post) => {
      Object.assign(form, {
        ...post,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        canonical_url: post.canonical_url || "",
        featured_image_url: post.featured_image_url || ""
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
      updateLocalDensity();
      debouncedAnalysis();
    };
    const runAnalysis = async () => {
      if (!editingPost.value) return;
      if (!form.id) {
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
        handleAiError(err);
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
        if (res.data.success === false) {
          toast.error(res.data.message || "Humanization failed via AI.");
          return;
        }
        humanizer.output = res.data.humanized_text;
        humanizer.result = res.data;
        toast.success("Content humanized successfully");
      } catch (err) {
        handleAiError(err);
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
        handleAiError(err);
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
    watch(() => form.focus_keyword, () => updateLocalDensity());
    onMounted(() => {
      updateLocalDensity();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, mergeProps({ title: "Content Hub" }, _attrs), {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="max-w-[1440px] mx-auto pb-24"${_scopeId}><div class="relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl"${_scopeId}><div class="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl"${_scopeId}></div><div class="pointer-events-none absolute -bottom-16 left-10 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl"${_scopeId}></div><div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between"${_scopeId}><div${_scopeId}><p class="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400"${_scopeId}>Metapilot Platform</p><h1 class="mb-3 text-4xl font-black tracking-tight text-white"${_scopeId}>Content Hub</h1><p class="max-w-md text-sm font-medium leading-relaxed text-slate-400"${_scopeId}>Create, optimize, and publish SEO-ready content — powered by AI at every step.</p><div class="mt-6 flex items-center gap-6"${_scopeId}><div class="text-center"${_scopeId}><p class="text-2xl font-black text-white"${_scopeId}>${ssrInterpolate(__props.posts.length)}</p><p class="text-[10px] font-bold uppercase tracking-widest text-slate-500"${_scopeId}>Posts</p></div><div class="h-8 w-px bg-white/10"${_scopeId}></div><div class="text-center"${_scopeId}><p class="text-2xl font-black text-white"${_scopeId}>${ssrInterpolate(__props.posts.filter((p) => p.status === "published").length)}</p><p class="text-[10px] font-bold uppercase tracking-widest text-slate-500"${_scopeId}>Published</p></div><div class="h-8 w-px bg-white/10"${_scopeId}></div><div class="text-center"${_scopeId}><p class="text-2xl font-black text-white"${_scopeId}>${ssrInterpolate(__props.posts.reduce((a, p) => a + (p.word_count || 0), 0).toLocaleString())}</p><p class="text-[10px] font-bold uppercase tracking-widest text-slate-500"${_scopeId}>Total Words</p></div></div></div><div class="flex flex-col items-end gap-4"${_scopeId}><div class="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm"${_scopeId}><button class="${ssrRenderClass([activeTab.value === "write" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white", "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"])}"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Write </button><button class="${ssrRenderClass([activeTab.value === "humanizer" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white", "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"])}"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"${_scopeId}></path></svg> Humanizer </button><button class="${ssrRenderClass([activeTab.value === "audit" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white", "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"])}"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"${_scopeId}></path></svg> SEO Audit </button></div>`);
            if (activeTab.value === "write") {
              _push2(`<button class="group flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl"${_scopeId}><svg class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg> New Post </button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div>`);
            if (activeTab.value === "write" && !editingPost.value) {
              _push2(`<div${_scopeId}>`);
              if (__props.posts.length === 0) {
                _push2(`<div class="flex flex-col items-center justify-center py-32 text-center"${_scopeId}><div class="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-indigo-50 shadow-inner"${_scopeId}><svg class="h-14 w-14 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h-3a1 1 0 01-1-1V4"${_scopeId}></path></svg></div><h3 class="mb-2 text-2xl font-black text-slate-900"${_scopeId}>Your content canvas is empty</h3><p class="mb-8 max-w-sm text-sm font-medium text-slate-500"${_scopeId}>Start writing SEO-optimized content and watch your rankings climb. Powered by AI from outline to publish.</p><button class="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-2xl"${_scopeId}><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId}></path></svg> Write your first post </button></div>`);
              } else {
                _push2(`<div class="space-y-3"${_scopeId}><!--[-->`);
                ssrRenderList(__props.posts, (post) => {
                  _push2(`<div class="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"${_scopeId}><div class="${ssrRenderClass([{
                    "bg-emerald-400": post.status === "published",
                    "bg-amber-400": post.status === "review",
                    "bg-slate-300": post.status === "draft",
                    "bg-slate-200": post.status === "archived"
                  }, "absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-all duration-300"])}"${_scopeId}></div><div class="mr-5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-indigo-50"${_scopeId}><svg class="h-6 w-6 text-slate-400 transition-colors group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg></div><div class="flex flex-1 flex-col gap-1 min-w-0"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><h3 class="truncate text-base font-black text-slate-900"${_scopeId}>${ssrInterpolate(post.title)}</h3><span class="${ssrRenderClass([{
                    "bg-emerald-100 text-emerald-700": post.status === "published",
                    "bg-amber-100 text-amber-700": post.status === "review",
                    "bg-slate-100 text-slate-500": post.status === "draft",
                    "bg-red-50 text-red-400": post.status === "archived"
                  }, "flex-shrink-0 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest"])}"${_scopeId}>${ssrInterpolate(post.status)}</span></div><div class="flex items-center gap-3 text-[11px] font-bold text-slate-400"${_scopeId}><span class="flex items-center gap-1"${_scopeId}><svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"${_scopeId}></path></svg> ${ssrInterpolate(post.category?.name || "Uncategorized")}</span><span class="text-slate-200"${_scopeId}>•</span><span${_scopeId}>${ssrInterpolate((post.word_count || 0).toLocaleString())} words</span><span class="text-slate-200"${_scopeId}>•</span><span${_scopeId}>${ssrInterpolate(formatDate(post.updated_at))}</span></div></div><div class="ml-6 flex items-center gap-6"${_scopeId}><div class="flex flex-col items-center gap-1"${_scopeId}><p class="text-[9px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>SEO</p><div class="relative h-12 w-12"${_scopeId}><svg class="h-full w-full -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle cx="18" cy="18" r="15" fill="none" class="stroke-slate-100" stroke-width="3"${_scopeId}></circle><circle cx="18" cy="18" r="15" fill="none" class="${ssrRenderClass([getScoreColorClass(post.seo_score), "transition-all duration-1000"])}" stroke-width="3" stroke-dasharray="94.25"${ssrRenderAttr("stroke-dashoffset", 94.25 - 94.25 * (post.seo_score || 0) / 100)} stroke-linecap="round" style="${ssrRenderStyle({ "stroke": "currentColor" })}"${_scopeId}></circle></svg><div class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-800"${_scopeId}>${ssrInterpolate(post.seo_score || 0)}</div></div></div><div class="flex flex-col items-center gap-1"${_scopeId}><p class="text-[9px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>AI</p><span class="${ssrRenderClass([getAiScoreClass(post.ai_content_score), "rounded-xl px-3 py-1.5 text-[11px] font-black"])}"${_scopeId}>${ssrInterpolate(post.ai_content_score || 0)}%</span></div><div class="flex items-center gap-1.5"${_scopeId}><button class="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="Edit"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg></button><button class="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600" title="Delete"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></div></div></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "humanizer") {
              _push2(`<div${_scopeId}><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"${_scopeId}><div class="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-sm font-black uppercase tracking-wider text-slate-900"${_scopeId}>Input</h3><p class="text-[10px] font-bold text-slate-400"${_scopeId}>Paste AI-generated text (min 100 words)</p></div></div><textarea placeholder="Paste your AI-generated content here..." class="h-80 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}>${ssrInterpolate(humanizer.input)}</textarea><div class="flex items-center justify-between"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><p class="text-[10px] font-black uppercase tracking-widest text-slate-500"${_scopeId}>Tone:</p><select class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50"${_scopeId}><option value="professional"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "professional") : ssrLooseEqual(humanizer.tone, "professional")) ? " selected" : ""}${_scopeId}>Professional</option><option value="conversational"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "conversational") : ssrLooseEqual(humanizer.tone, "conversational")) ? " selected" : ""}${_scopeId}>Conversational</option><option value="academic"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "academic") : ssrLooseEqual(humanizer.tone, "academic")) ? " selected" : ""}${_scopeId}>Academic</option><option value="creative"${ssrIncludeBooleanAttr(Array.isArray(humanizer.tone) ? ssrLooseContain(humanizer.tone, "creative") : ssrLooseEqual(humanizer.tone, "creative")) ? " selected" : ""}${_scopeId}>Creative</option></select></div><button${ssrIncludeBooleanAttr(humanizing.value || humanizer.input.length < 100) ? " disabled" : ""} class="flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-black hover:shadow-xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40"${_scopeId}>`);
              if (humanizing.value) {
                _push2(`<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(humanizing.value ? "Humanizing..." : "Humanize Content")}</button></div></div><div class="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"${_scopeId}>`);
              if (!humanizer.output) {
                _push2(`<div class="flex h-full flex-col items-center justify-center gap-5 py-16 text-center"${_scopeId}><div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50"${_scopeId}><svg class="h-8 w-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-base font-black text-slate-400"${_scopeId}>Results appear here</p><p class="mt-1 text-xs font-bold text-slate-300"${_scopeId}>AI-rewritten content with before/after score</p></div></div>`);
              } else {
                _push2(`<div class="flex h-full flex-col gap-5"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-sm font-black uppercase tracking-wider text-slate-900"${_scopeId}>Humanized Result</h3><p class="text-[10px] font-bold text-slate-400"${_scopeId}>AI rewrite complete</p></div></div><button class="flex items-center gap-1.5 rounded-xl border border-slate-100 px-4 py-2 text-xs font-black text-indigo-600 transition-all hover:bg-indigo-50"${_scopeId}><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"${_scopeId}></path></svg> Copy </button></div><div class="grid grid-cols-2 gap-3"${_scopeId}><div class="rounded-2xl border border-rose-100 bg-rose-50 p-4"${_scopeId}><p class="mb-1 text-[9px] font-black uppercase tracking-widest text-rose-500"${_scopeId}>Before</p><p class="text-3xl font-black text-rose-600"${_scopeId}>${ssrInterpolate(humanizer.result.initial_ai_score)}<span class="text-base"${_scopeId}>%</span></p><p class="mt-0.5 text-[10px] font-bold text-rose-400"${_scopeId}>AI Detected</p></div><div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"${_scopeId}><p class="mb-1 text-[9px] font-black uppercase tracking-widest text-emerald-600"${_scopeId}>After</p><p class="text-3xl font-black text-emerald-600"${_scopeId}>${ssrInterpolate(humanizer.result.final_ai_score)}<span class="text-base"${_scopeId}>%</span></p><p class="mt-0.5 text-[10px] font-bold text-emerald-500"${_scopeId}>AI Detected</p></div></div><div${_scopeId}><div class="mb-1.5 flex justify-between"${_scopeId}><p class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Improvement</p><p class="text-[10px] font-black text-emerald-600"${_scopeId}>-${ssrInterpolate(humanizer.result.initial_ai_score - humanizer.result.final_ai_score)}% AI</p></div><div class="h-2 w-full overflow-hidden rounded-full bg-slate-100"${_scopeId}><div class="h-full rounded-full bg-emerald-400 transition-all duration-1000" style="${ssrRenderStyle(`width: ${Math.min(100, (humanizer.result.initial_ai_score - humanizer.result.final_ai_score) / Math.max(humanizer.result.initial_ai_score, 1) * 100)}%`)}"${_scopeId}></div></div></div><div class="max-h-56 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium leading-relaxed text-slate-700 custom-scrollbar"${_scopeId}>${ssrInterpolate(humanizer.output)}</div></div>`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "audit") {
              _push2(`<div${_scopeId}><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"${_scopeId}><div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"${_scopeId}><div class="mb-8"${_scopeId}><h2 class="mb-1 text-xl font-black text-slate-900"${_scopeId}>Deep Content Audit</h2><p class="text-sm font-medium text-slate-500"${_scopeId}>Analyze any URL or content against your target keywords.</p></div><div class="space-y-5"${_scopeId}><div${_scopeId}><label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Target URL</label><div class="relative"${_scopeId}><div class="pointer-events-none absolute inset-y-0 left-4 flex items-center"${_scopeId}><svg class="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"${_scopeId}></path></svg></div><input${ssrRenderAttr("value", audit.url)} type="url" placeholder="https://example.com/blog-post" class="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}></div></div><div class="flex items-center gap-3"${_scopeId}><div class="h-px flex-1 bg-slate-100"${_scopeId}></div><span class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Or paste content</span><div class="h-px flex-1 bg-slate-100"${_scopeId}></div></div><textarea placeholder="Paste your content here for analysis..." class="h-36 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}>${ssrInterpolate(audit.content)}</textarea><div${_scopeId}><label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Target Keywords <span class="normal-case font-bold text-indigo-400"${_scopeId}>(one per line)</span></label><textarea placeholder="primary keyword
secondary keyword
long-tail keyword..." class="h-28 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}>${ssrInterpolate(audit.keywordsRaw)}</textarea></div><button${ssrIncludeBooleanAttr(auditing.value || !audit.keywordsRaw) ? " disabled" : ""} class="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.01] hover:bg-indigo-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-50"${_scopeId}>`);
              if (auditing.value) {
                _push2(`<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg>`);
              }
              _push2(` ${ssrInterpolate(auditing.value ? "Analyzing Content..." : "Run SEO Audit")}</button></div></div><div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"${_scopeId}>`);
              if (!auditResult.value) {
                _push2(`<div class="flex h-full flex-col items-center justify-center gap-4 py-20 text-center"${_scopeId}><div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100"${_scopeId}><svg class="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg></div><p class="text-base font-black text-slate-400"${_scopeId}>Audit results appear here</p><p class="max-w-xs text-xs font-bold text-slate-300"${_scopeId}>Run an audit on the left to see keyword gaps, opportunities, and priority fixes.</p></div>`);
              } else {
                _push2(`<div class="custom-scrollbar max-h-[680px] overflow-y-auto pr-1"${_scopeId}><div class="mb-6 flex items-center gap-6"${_scopeId}><div class="relative h-20 w-20 flex-shrink-0"${_scopeId}><svg class="h-full w-full -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle cx="18" cy="18" r="15" fill="none" class="stroke-slate-100" stroke-width="3"${_scopeId}></circle><circle cx="18" cy="18" r="15" fill="none" class="text-indigo-500" stroke-width="3" stroke-dasharray="94.25"${ssrRenderAttr("stroke-dashoffset", 94.25 - 94.25 * (auditResult.value.seo_score || 0) / 100)} stroke-linecap="round" style="${ssrRenderStyle({ "stroke": "currentColor", "transition": "stroke-dashoffset 1s ease" })}"${_scopeId}></circle></svg><div class="absolute inset-0 flex items-center justify-center"${_scopeId}><span class="text-lg font-black text-slate-900"${_scopeId}>${ssrInterpolate(auditResult.value.seo_score)}</span></div></div><div${_scopeId}><h3 class="text-xl font-black text-slate-900"${_scopeId}>Audit Report</h3><p class="mt-1 text-sm font-medium leading-snug text-slate-500"${_scopeId}>${ssrInterpolate(auditResult.value.summary)}</p></div></div><div class="space-y-4"${_scopeId}><div class="rounded-2xl border border-indigo-100 bg-indigo-50 p-5"${_scopeId}><h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-600"${_scopeId}>Keyword Gaps</h4><ul class="space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(auditResult.value.keyword_gaps, (gap) => {
                  _push2(`<li class="flex items-start gap-2 text-sm font-bold text-indigo-900"${_scopeId}><span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"${_scopeId}></span> ${ssrInterpolate(gap)}</li>`);
                });
                _push2(`<!--]--></ul></div><div class="rounded-2xl border border-amber-100 bg-amber-50 p-5"${_scopeId}><h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600"${_scopeId}>High Priority Fixes</h4><ul class="space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(auditResult.value.fix_priorities, (fix) => {
                  _push2(`<li class="flex items-start gap-2 text-sm font-bold text-amber-900"${_scopeId}><svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg> ${ssrInterpolate(fix)}</li>`);
                });
                _push2(`<!--]--></ul></div><div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"${_scopeId}><h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-700"${_scopeId}>Optimization Tips</h4><ul class="space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(auditResult.value.optimization_tips, (tip) => {
                  _push2(`<li class="flex items-start gap-2 text-sm font-bold text-emerald-900"${_scopeId}><svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"${_scopeId}></path></svg> ${ssrInterpolate(tip)}</li>`);
                });
                _push2(`<!--]--></ul></div></div></div>`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (editingPost.value) {
              _push2(`<div class="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"${_scopeId}><div class="flex h-full w-full max-w-[96%] flex-col bg-slate-50 shadow-2xl"${_scopeId}><div class="flex h-18 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-4"${_scopeId}><div class="flex items-center gap-5"${_scopeId}><button class="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"${_scopeId}><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button><div class="h-6 w-px bg-slate-100"${_scopeId}></div><input${ssrRenderAttr("value", form.title)} type="text" placeholder="Post Title..." class="${ssrRenderClass([validationErrors.title ? "border-rose-200 focus:border-rose-400" : "border-transparent focus:border-indigo-400", "w-96 border-b-2 bg-transparent p-0 text-lg font-black text-slate-900 transition-all outline-none ring-0 placeholder:text-slate-300 focus:ring-0"])}"${_scopeId}></div><div class="flex items-center gap-6"${_scopeId}><button class="${ssrRenderClass([focusMode.value ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100", "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"])}"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId}></path></svg> ${ssrInterpolate(focusMode.value ? "Focusing" : "Focus Mode")}</button><span class="text-xs font-bold text-slate-400"${_scopeId}>${ssrInterpolate(metrics.word_count.toLocaleString())} words • ${ssrInterpolate(metrics.reading_time_minutes)}m read</span><div class="h-5 w-px bg-slate-100"${_scopeId}></div><button${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"${_scopeId}>${ssrInterpolate(saving.value ? "Saving..." : "Save Draft")}</button><button class="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-lg"${_scopeId}> Publish </button></div></div><div class="flex flex-1 overflow-hidden"${_scopeId}><div class="flex-1 overflow-y-auto bg-white p-10 custom-scrollbar"${_scopeId}><div class="mx-auto max-w-3xl"${_scopeId}><div class="mb-8 grid grid-cols-2 gap-6"${_scopeId}><div${_scopeId}><label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Focus Keyword</label><input${ssrRenderAttr("value", form.focus_keyword)} type="text" placeholder="e.g. SEO Content Guide" class="${ssrRenderClass([validationErrors.focus_keyword ? "border-rose-200 focus:border-rose-400 focus:ring-rose-50" : "border-slate-100 focus:border-indigo-200 focus:ring-indigo-50", "w-full rounded-2xl border bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4"])}"${_scopeId}></div><div${_scopeId}><label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Category</label><select class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}><option${ssrRenderAttr("value", null)}${ssrIncludeBooleanAttr(Array.isArray(form.blog_category_id) ? ssrLooseContain(form.blog_category_id, null) : ssrLooseEqual(form.blog_category_id, null)) ? " selected" : ""}${_scopeId}>Uncategorized</option><!--[-->`);
              ssrRenderList(__props.categories, (cat) => {
                _push2(`<option${ssrRenderAttr("value", cat.id)}${ssrIncludeBooleanAttr(Array.isArray(form.blog_category_id) ? ssrLooseContain(form.blog_category_id, cat.id) : ssrLooseEqual(form.blog_category_id, cat.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(cat.name)}</option>`);
              });
              _push2(`<!--]--></select></div></div><div class="mb-8 rounded-2xl border border-slate-100 bg-slate-50/60 p-6"${_scopeId}><div class="mb-5 flex items-center gap-3"${_scopeId}><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"${_scopeId}><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"${_scopeId}></path></svg></div><h4 class="text-[10px] font-black uppercase tracking-widest text-slate-700"${_scopeId}>Search Appearance</h4></div><div class="grid gap-4"${_scopeId}><div${_scopeId}><div class="mb-1.5 flex justify-between"${_scopeId}><label class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>SEO Title</label><span class="${ssrRenderClass([(form.meta_title || "").length > 60 ? "text-rose-500" : "text-slate-400", "text-[10px] font-bold"])}"${_scopeId}>${ssrInterpolate((form.meta_title || "").length)} / 60</span></div><input${ssrRenderAttr("value", form.meta_title)} type="text"${ssrRenderAttr("placeholder", form.title)} class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}></div><div${_scopeId}><div class="mb-1.5 flex justify-between"${_scopeId}><label class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Meta Description</label><span class="${ssrRenderClass([(form.meta_description || "").length > 160 ? "text-rose-500" : "text-slate-400", "text-[10px] font-bold"])}"${_scopeId}>${ssrInterpolate((form.meta_description || "").length)} / 160</span></div><textarea rows="2" placeholder="Briefly summarize your post..." class="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}>${ssrInterpolate(form.meta_description)}</textarea></div><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Canonical URL</label><input${ssrRenderAttr("value", form.canonical_url)} type="url" placeholder="https://..." class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}></div><div${_scopeId}><label class="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Featured Image URL</label><input${ssrRenderAttr("value", form.featured_image_url)} type="url" placeholder="https://cdn.example.com/..." class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"${_scopeId}></div></div></div></div><div class="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-md"${_scopeId}><button class="toolbar-btn font-black text-xs" title="Bold"${_scopeId}>B</button><button class="toolbar-btn italic font-serif text-xs" title="Italic"${_scopeId}>I</button><button class="toolbar-btn underline font-serif text-xs" title="Underline"${_scopeId}>U</button><div class="mx-1 h-5 w-px bg-slate-200"${_scopeId}></div><button class="toolbar-btn text-[10px] font-black" title="H2"${_scopeId}>H2</button><button class="toolbar-btn text-[10px] font-black" title="H3"${_scopeId}>H3</button><div class="mx-1 h-5 w-px bg-slate-200"${_scopeId}></div><button class="toolbar-btn" title="Bullet List"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"${_scopeId}></path></svg></button><button class="toolbar-btn" title="Numbered List"${_scopeId}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7m2 0h2m-2 0v4m0 0H7m2 0h2m-2 0v4m0 0H7m2 0h2"${_scopeId}></path></svg></button><div class="mx-1 h-5 w-px bg-slate-200"${_scopeId}></div><button class="toolbar-btn text-[10px] font-bold text-slate-400" title="Clear Format"${_scopeId}>Clear</button></div><div contenteditable="true" class="${ssrRenderClass([focusMode.value ? "px-12 py-8" : "", "prose prose-slate prose-lg max-w-none min-h-[600px] transition-all focus:outline-none editor-placeholder"])}" data-placeholder="Start your story here..."${_scopeId}></div></div></div>`);
              if (!focusMode.value) {
                _push2(`<div class="w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 custom-scrollbar transition-all"${_scopeId}><div class="border-b border-slate-100 bg-white p-6 text-center"${_scopeId}><div class="mb-5 flex items-center justify-between"${_scopeId}><p class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Master SEO Score</p><span class="${ssrRenderClass([[seoTier.value.color, seoTier.value.bg, seoTier.value.border, "border"], "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all"])}"${_scopeId}>${ssrInterpolate(seoTier.value.label)}</span></div><div class="relative mx-auto mb-8 inline-flex"${_scopeId}><div class="${ssrRenderClass([seoTier.value.bg, "absolute inset-0 rounded-full blur-2xl transition-all duration-1000 opacity-20"])}"${_scopeId}></div><svg class="relative h-32 w-32 -rotate-90" viewBox="0 0 36 36"${_scopeId}><circle class="text-slate-100" stroke-width="3" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18"${_scopeId}></circle><circle class="${ssrRenderClass([getScoreColorClass(form.seo_score), "transition-all duration-1000"])}" stroke-width="3" stroke-dasharray="94.25"${ssrRenderAttr("stroke-dashoffset", 94.25 - 94.25 * (form.seo_score || 0) / 100)} stroke-linecap="round" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18"${_scopeId}></circle></svg><span class="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900"${_scopeId}>${ssrInterpolate(form.seo_score || 0)}</span></div><div class="mb-6 grid grid-cols-3 gap-2"${_scopeId}><!--[-->`);
                ssrRenderList(scoreBreakdown.value, (item) => {
                  _push2(`<div class="flex flex-col items-center"${_scopeId}><div class="mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-100"${_scopeId}><div class="h-full bg-indigo-500 transition-all duration-1000" style="${ssrRenderStyle({ width: item.percent + "%" })}"${_scopeId}></div></div><span class="text-[8px] font-black uppercase tracking-tighter text-slate-400"${_scopeId}>${ssrInterpolate(item.label)}</span></div>`);
                });
                _push2(`<!--]--></div><button${ssrIncludeBooleanAttr(analyzing.value) ? " disabled" : ""} class="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-wide text-white transition-all hover:bg-black disabled:opacity-50"${_scopeId}>`);
                if (analyzing.value) {
                  _push2(`<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(` ${ssrInterpolate(analyzing.value ? "Analyzing..." : "Refresh Audit")}</button></div><div class="border-b border-slate-100 bg-white p-6"${_scopeId}><p class="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Content Stats</p><div class="space-y-3"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><span class="text-[11px] font-black uppercase tracking-wide text-slate-400"${_scopeId}>Word Count</span><span class="text-sm font-black text-slate-900"${_scopeId}>${ssrInterpolate(metrics.word_count.toLocaleString())}</span></div><div class="flex items-center justify-between"${_scopeId}><span class="text-[11px] font-black uppercase tracking-wide text-slate-400"${_scopeId}>Read Time</span><span class="text-sm font-black text-slate-900"${_scopeId}>${ssrInterpolate(metrics.reading_time_minutes)}m</span></div><div class="flex items-center justify-between"${_scopeId}><span class="text-[11px] font-black uppercase tracking-wide text-slate-400"${_scopeId}>KW Density</span><span class="${ssrRenderClass([density.primary > 1 && density.primary < 3 ? "text-emerald-500" : "text-amber-500", "text-sm font-black"])}"${_scopeId}>${ssrInterpolate(density.primary.toFixed(1))}%</span></div></div></div><div class="border-b border-slate-100 bg-white p-6"${_scopeId}><p class="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>SERP Preview</p><div class="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left"${_scopeId}><p class="mb-1 truncate text-[9px] text-slate-400"${_scopeId}>https://${ssrInterpolate(__props.organization?.slug || "site")}.ai/blog/...</p><h5 class="mb-1 line-clamp-2 cursor-pointer text-xs font-bold text-blue-600 hover:underline"${_scopeId}>${ssrInterpolate(form.meta_title || form.title || "Untitled Post")}</h5><p class="line-clamp-3 text-[10px] leading-relaxed text-slate-500"${_scopeId}>${ssrInterpolate(form.meta_description || "Start writing to preview your meta description here...")}</p></div></div><div class="border-b border-slate-100 bg-white p-6"${_scopeId}><div class="mb-4 flex items-center justify-between"${_scopeId}><p class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>AI Probability</p><span class="${ssrRenderClass([getAiScoreClass(form.ai_content_score), "rounded-lg px-2.5 py-1 text-[10px] font-black"])}"${_scopeId}>${ssrInterpolate(form.ai_content_score || 0)}%</span></div><div class="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"${_scopeId}><div class="${ssrRenderClass([getAiBgClass(form.ai_content_score), "h-full rounded-full transition-all duration-1000"])}" style="${ssrRenderStyle({ width: (form.ai_content_score || 0) + "%" })}"${_scopeId}></div></div>`);
                if (form.ai_detection_notes) {
                  _push2(`<p class="text-[10px] font-bold italic leading-relaxed text-slate-400"${_scopeId}>${ssrInterpolate(form.ai_detection_notes)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="border-b border-slate-100 bg-white p-6"${_scopeId}><p class="mb-5 text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Actionable Audit</p><div class="space-y-6"${_scopeId}><!--[-->`);
                ssrRenderList(groupedChecks.value, (checks, category) => {
                  _push2(`<div${_scopeId}><h5 class="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400"${_scopeId}>${ssrInterpolate(category)}</h5><div class="space-y-3"${_scopeId}><!--[-->`);
                  ssrRenderList(checks, (check) => {
                    _push2(`<div class="group flex items-start gap-2.5"${_scopeId}><div class="mt-0.5 flex-shrink-0"${_scopeId}>`);
                    if (check.status === "success") {
                      _push2(`<svg class="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"${_scopeId}></path></svg>`);
                    } else if (check.status === "error") {
                      _push2(`<svg class="h-3.5 w-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg>`);
                    } else {
                      _push2(`<svg class="h-3.5 w-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M12 9v2m0 4h.01"${_scopeId}></path></svg>`);
                    }
                    _push2(`</div><div${_scopeId}><p class="${ssrRenderClass([check.status === "success" ? "text-slate-700" : "text-slate-500", "text-[10px] font-black leading-tight"])}"${_scopeId}>${ssrInterpolate(check.message)}</p>`);
                    if (check.action && check.status !== "success") {
                      _push2(`<p class="mt-0.5 text-[9px] font-bold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"${_scopeId}>${ssrInterpolate(check.action)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  });
                  _push2(`<!--]--></div></div>`);
                });
                _push2(`<!--]--></div></div><div class="bg-white p-6"${_scopeId}><div class="mb-5 flex items-center justify-between"${_scopeId}><p class="text-[10px] font-black uppercase tracking-widest text-slate-400"${_scopeId}>Writing Assistant</p><span class="rounded bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-tighter text-indigo-600"${_scopeId}>AI LIVE</span></div><div class="space-y-4"${_scopeId}><div class="rounded-2xl border border-slate-100 bg-slate-50 p-4"${_scopeId}><p class="mb-2 text-[10px] font-black italic uppercase tracking-widest text-slate-400"${_scopeId}>Semantic Keywords</p><div class="flex flex-wrap gap-1.5"${_scopeId}><!--[-->`);
                ssrRenderList(semanticKeywords.value, (kw) => {
                  _push2(`<span class="cursor-pointer rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600"${_scopeId}>+ ${ssrInterpolate(kw)}</span>`);
                });
                _push2(`<!--]--></div></div><div class="flex gap-2"${_scopeId}><button${ssrIncludeBooleanAttr(isGeneratingIntro.value) ? " disabled" : ""} class="flex-1 rounded-2xl border-2 border-slate-900 bg-white py-3 text-[10px] font-black uppercase text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-50"${_scopeId}>${ssrInterpolate(isGeneratingIntro.value ? "Drafting..." : "Gen Intro")}</button><button${ssrIncludeBooleanAttr(isGeneratingOutline.value) ? " disabled" : ""} class="flex-1 rounded-2xl border-2 border-indigo-600 bg-white py-3 text-[10px] font-black uppercase text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white disabled:opacity-50"${_scopeId}>${ssrInterpolate(isGeneratingOutline.value ? "Building..." : "Outline")}</button></div>`);
                if (validationErrors.title || validationErrors.focus_keyword) {
                  _push2(`<div class="rounded-xl border border-rose-100 bg-rose-50 p-3"${_scopeId}><div class="flex gap-2"${_scopeId}><svg class="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><p class="text-[9px] font-black uppercase tracking-widest text-rose-600"${_scopeId}>Action Required</p></div><p class="mt-1 text-[10px] font-bold leading-relaxed text-rose-900"${_scopeId}>${ssrInterpolate(validationErrors.title ? "• Post Title is missing" : "")} ${ssrInterpolate(validationErrors.focus_keyword ? "• Focus Keyword is missing (required for Intro)" : "")}</p></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (hasSelection.value) {
                  _push2(`<div class="border-t border-slate-100 pt-4"${_scopeId}><p class="mb-3 text-[9px] font-black uppercase tracking-widest text-indigo-500"${_scopeId}>Selection Tools</p><button${ssrIncludeBooleanAttr(isRefining.value) ? " disabled" : ""} class="w-full rounded-2xl bg-indigo-600 py-3 text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"${_scopeId}>${ssrInterpolate(isRefining.value ? "Refining..." : "Refine Tone")}</button></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
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
              createVNode("div", { class: "max-w-[1440px] mx-auto pb-24" }, [
                createVNode("div", { class: "relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl" }, [
                  createVNode("div", { class: "pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" }),
                  createVNode("div", { class: "pointer-events-none absolute -bottom-16 left-10 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" }),
                  createVNode("div", { class: "relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between" }, [
                    createVNode("div", null, [
                      createVNode("p", { class: "mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400" }, "Metapilot Platform"),
                      createVNode("h1", { class: "mb-3 text-4xl font-black tracking-tight text-white" }, "Content Hub"),
                      createVNode("p", { class: "max-w-md text-sm font-medium leading-relaxed text-slate-400" }, "Create, optimize, and publish SEO-ready content — powered by AI at every step."),
                      createVNode("div", { class: "mt-6 flex items-center gap-6" }, [
                        createVNode("div", { class: "text-center" }, [
                          createVNode("p", { class: "text-2xl font-black text-white" }, toDisplayString(__props.posts.length), 1),
                          createVNode("p", { class: "text-[10px] font-bold uppercase tracking-widest text-slate-500" }, "Posts")
                        ]),
                        createVNode("div", { class: "h-8 w-px bg-white/10" }),
                        createVNode("div", { class: "text-center" }, [
                          createVNode("p", { class: "text-2xl font-black text-white" }, toDisplayString(__props.posts.filter((p) => p.status === "published").length), 1),
                          createVNode("p", { class: "text-[10px] font-bold uppercase tracking-widest text-slate-500" }, "Published")
                        ]),
                        createVNode("div", { class: "h-8 w-px bg-white/10" }),
                        createVNode("div", { class: "text-center" }, [
                          createVNode("p", { class: "text-2xl font-black text-white" }, toDisplayString(__props.posts.reduce((a, p) => a + (p.word_count || 0), 0).toLocaleString()), 1),
                          createVNode("p", { class: "text-[10px] font-bold uppercase tracking-widest text-slate-500" }, "Total Words")
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "flex flex-col items-end gap-4" }, [
                      createVNode("div", { class: "flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm" }, [
                        createVNode("button", {
                          onClick: ($event) => switchTab("write"),
                          class: ["flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300", activeTab.value === "write" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white"]
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-4 w-4",
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
                          createTextVNode(" Write ")
                        ], 10, ["onClick"]),
                        createVNode("button", {
                          onClick: ($event) => switchTab("humanizer"),
                          class: ["flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300", activeTab.value === "humanizer" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white"]
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-4 w-4",
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
                          createTextVNode(" Humanizer ")
                        ], 10, ["onClick"]),
                        createVNode("button", {
                          onClick: ($event) => switchTab("audit"),
                          class: ["flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300", activeTab.value === "audit" ? "bg-white text-indigo-700 shadow-lg" : "text-slate-400 hover:text-white"]
                        }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-4 w-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            })
                          ])),
                          createTextVNode(" SEO Audit ")
                        ], 10, ["onClick"])
                      ]),
                      activeTab.value === "write" ? (openBlock(), createBlock("button", {
                        key: 0,
                        onClick: createNewPost,
                        class: "group flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "h-5 w-5 transition-transform duration-300 group-hover:rotate-90",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2.5",
                            d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                          })
                        ])),
                        createTextVNode(" New Post ")
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ]),
                activeTab.value === "write" && !editingPost.value ? (openBlock(), createBlock("div", { key: 0 }, [
                  __props.posts.length === 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex flex-col items-center justify-center py-32 text-center"
                  }, [
                    createVNode("div", { class: "mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-indigo-50 shadow-inner" }, [
                      (openBlock(), createBlock("svg", {
                        class: "h-14 w-14 text-indigo-300",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "1.5",
                          d: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"
                        }),
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "1.5",
                          d: "M17 8h-3a1 1 0 01-1-1V4"
                        })
                      ]))
                    ]),
                    createVNode("h3", { class: "mb-2 text-2xl font-black text-slate-900" }, "Your content canvas is empty"),
                    createVNode("p", { class: "mb-8 max-w-sm text-sm font-medium text-slate-500" }, "Start writing SEO-optimized content and watch your rankings climb. Powered by AI from outline to publish."),
                    createVNode("button", {
                      onClick: createNewPost,
                      class: "flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-2xl"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "h-5 w-5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2.5",
                          d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        })
                      ])),
                      createTextVNode(" Write your first post ")
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "space-y-3"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.posts, (post) => {
                      return openBlock(), createBlock("div", {
                        key: post.id,
                        class: "group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
                      }, [
                        createVNode("div", {
                          class: ["absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-all duration-300", {
                            "bg-emerald-400": post.status === "published",
                            "bg-amber-400": post.status === "review",
                            "bg-slate-300": post.status === "draft",
                            "bg-slate-200": post.status === "archived"
                          }]
                        }, null, 2),
                        createVNode("div", { class: "mr-5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-indigo-50" }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-6 w-6 text-slate-400 transition-colors group-hover:text-indigo-500",
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
                        createVNode("div", { class: "flex flex-1 flex-col gap-1 min-w-0" }, [
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("h3", { class: "truncate text-base font-black text-slate-900" }, toDisplayString(post.title), 1),
                            createVNode("span", {
                              class: ["flex-shrink-0 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest", {
                                "bg-emerald-100 text-emerald-700": post.status === "published",
                                "bg-amber-100 text-amber-700": post.status === "review",
                                "bg-slate-100 text-slate-500": post.status === "draft",
                                "bg-red-50 text-red-400": post.status === "archived"
                              }]
                            }, toDisplayString(post.status), 3)
                          ]),
                          createVNode("div", { class: "flex items-center gap-3 text-[11px] font-bold text-slate-400" }, [
                            createVNode("span", { class: "flex items-center gap-1" }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-3 w-3",
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
                            createVNode("span", { class: "text-slate-200" }, "•"),
                            createVNode("span", null, toDisplayString((post.word_count || 0).toLocaleString()) + " words", 1),
                            createVNode("span", { class: "text-slate-200" }, "•"),
                            createVNode("span", null, toDisplayString(formatDate(post.updated_at)), 1)
                          ])
                        ]),
                        createVNode("div", { class: "ml-6 flex items-center gap-6" }, [
                          createVNode("div", { class: "flex flex-col items-center gap-1" }, [
                            createVNode("p", { class: "text-[9px] font-black uppercase tracking-widest text-slate-400" }, "SEO"),
                            createVNode("div", { class: "relative h-12 w-12" }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-full w-full -rotate-90",
                                viewBox: "0 0 36 36"
                              }, [
                                createVNode("circle", {
                                  cx: "18",
                                  cy: "18",
                                  r: "15",
                                  fill: "none",
                                  class: "stroke-slate-100",
                                  "stroke-width": "3"
                                }),
                                createVNode("circle", {
                                  cx: "18",
                                  cy: "18",
                                  r: "15",
                                  fill: "none",
                                  class: [getScoreColorClass(post.seo_score), "transition-all duration-1000"],
                                  "stroke-width": "3",
                                  "stroke-dasharray": "94.25",
                                  "stroke-dashoffset": 94.25 - 94.25 * (post.seo_score || 0) / 100,
                                  "stroke-linecap": "round",
                                  style: { "stroke": "currentColor" }
                                }, null, 10, ["stroke-dashoffset"])
                              ])),
                              createVNode("div", { class: "absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-800" }, toDisplayString(post.seo_score || 0), 1)
                            ])
                          ]),
                          createVNode("div", { class: "flex flex-col items-center gap-1" }, [
                            createVNode("p", { class: "text-[9px] font-black uppercase tracking-widest text-slate-400" }, "AI"),
                            createVNode("span", {
                              class: ["rounded-xl px-3 py-1.5 text-[11px] font-black", getAiScoreClass(post.ai_content_score)]
                            }, toDisplayString(post.ai_content_score || 0) + "%", 3)
                          ]),
                          createVNode("div", { class: "flex items-center gap-1.5" }, [
                            createVNode("button", {
                              onClick: ($event) => editPost(post),
                              class: "rounded-xl p-2.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600",
                              title: "Edit"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-4 w-4",
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
                              class: "rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600",
                              title: "Delete"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-4 w-4",
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
                  createVNode("div", { class: "grid grid-cols-1 gap-6 lg:grid-cols-2" }, [
                    createVNode("div", { class: "flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm" }, [
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        createVNode("div", { class: "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white" }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-4 w-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                            })
                          ]))
                        ]),
                        createVNode("div", null, [
                          createVNode("h3", { class: "text-sm font-black uppercase tracking-wider text-slate-900" }, "Input"),
                          createVNode("p", { class: "text-[10px] font-bold text-slate-400" }, "Paste AI-generated text (min 100 words)")
                        ])
                      ]),
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => humanizer.input = $event,
                        placeholder: "Paste your AI-generated content here...",
                        class: "h-80 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, humanizer.input]
                      ]),
                      createVNode("div", { class: "flex items-center justify-between" }, [
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("p", { class: "text-[10px] font-black uppercase tracking-widest text-slate-500" }, "Tone:"),
                          withDirectives(createVNode("select", {
                            "onUpdate:modelValue": ($event) => humanizer.tone = $event,
                            class: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50"
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
                          class: "flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-black hover:shadow-xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40"
                        }, [
                          humanizing.value ? (openBlock(), createBlock("svg", {
                            key: 0,
                            class: "h-4 w-4 animate-spin",
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
                    createVNode("div", { class: "flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm" }, [
                      !humanizer.output ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex h-full flex-col items-center justify-center gap-5 py-16 text-center"
                      }, [
                        createVNode("div", { class: "flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50" }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-8 w-8 text-indigo-300",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "1.5",
                              d: "M13 10V3L4 14h7v7l9-11h-7z"
                            })
                          ]))
                        ]),
                        createVNode("div", null, [
                          createVNode("p", { class: "text-base font-black text-slate-400" }, "Results appear here"),
                          createVNode("p", { class: "mt-1 text-xs font-bold text-slate-300" }, "AI-rewritten content with before/after score")
                        ])
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "flex h-full flex-col gap-5"
                      }, [
                        createVNode("div", { class: "flex items-center justify-between" }, [
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("div", { class: "flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white" }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-4 w-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2.5",
                                  d: "M5 13l4 4L19 7"
                                })
                              ]))
                            ]),
                            createVNode("div", null, [
                              createVNode("h3", { class: "text-sm font-black uppercase tracking-wider text-slate-900" }, "Humanized Result"),
                              createVNode("p", { class: "text-[10px] font-bold text-slate-400" }, "AI rewrite complete")
                            ])
                          ]),
                          createVNode("button", {
                            onClick: copyOutput,
                            class: "flex items-center gap-1.5 rounded-xl border border-slate-100 px-4 py-2 text-xs font-black text-indigo-600 transition-all hover:bg-indigo-50"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "h-3.5 w-3.5",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              })
                            ])),
                            createTextVNode(" Copy ")
                          ])
                        ]),
                        createVNode("div", { class: "grid grid-cols-2 gap-3" }, [
                          createVNode("div", { class: "rounded-2xl border border-rose-100 bg-rose-50 p-4" }, [
                            createVNode("p", { class: "mb-1 text-[9px] font-black uppercase tracking-widest text-rose-500" }, "Before"),
                            createVNode("p", { class: "text-3xl font-black text-rose-600" }, [
                              createTextVNode(toDisplayString(humanizer.result.initial_ai_score), 1),
                              createVNode("span", { class: "text-base" }, "%")
                            ]),
                            createVNode("p", { class: "mt-0.5 text-[10px] font-bold text-rose-400" }, "AI Detected")
                          ]),
                          createVNode("div", { class: "rounded-2xl border border-emerald-100 bg-emerald-50 p-4" }, [
                            createVNode("p", { class: "mb-1 text-[9px] font-black uppercase tracking-widest text-emerald-600" }, "After"),
                            createVNode("p", { class: "text-3xl font-black text-emerald-600" }, [
                              createTextVNode(toDisplayString(humanizer.result.final_ai_score), 1),
                              createVNode("span", { class: "text-base" }, "%")
                            ]),
                            createVNode("p", { class: "mt-0.5 text-[10px] font-bold text-emerald-500" }, "AI Detected")
                          ])
                        ]),
                        createVNode("div", null, [
                          createVNode("div", { class: "mb-1.5 flex justify-between" }, [
                            createVNode("p", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Improvement"),
                            createVNode("p", { class: "text-[10px] font-black text-emerald-600" }, "-" + toDisplayString(humanizer.result.initial_ai_score - humanizer.result.final_ai_score) + "% AI", 1)
                          ]),
                          createVNode("div", { class: "h-2 w-full overflow-hidden rounded-full bg-slate-100" }, [
                            createVNode("div", {
                              class: "h-full rounded-full bg-emerald-400 transition-all duration-1000",
                              style: `width: ${Math.min(100, (humanizer.result.initial_ai_score - humanizer.result.final_ai_score) / Math.max(humanizer.result.initial_ai_score, 1) * 100)}%`
                            }, null, 4)
                          ])
                        ]),
                        createVNode("div", { class: "max-h-56 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium leading-relaxed text-slate-700 custom-scrollbar" }, toDisplayString(humanizer.output), 1)
                      ]))
                    ])
                  ])
                ])) : createCommentVNode("", true),
                activeTab.value === "audit" ? (openBlock(), createBlock("div", { key: 2 }, [
                  createVNode("div", { class: "grid grid-cols-1 gap-6 lg:grid-cols-2" }, [
                    createVNode("div", { class: "rounded-3xl border border-slate-100 bg-white p-8 shadow-sm" }, [
                      createVNode("div", { class: "mb-8" }, [
                        createVNode("h2", { class: "mb-1 text-xl font-black text-slate-900" }, "Deep Content Audit"),
                        createVNode("p", { class: "text-sm font-medium text-slate-500" }, "Analyze any URL or content against your target keywords.")
                      ]),
                      createVNode("div", { class: "space-y-5" }, [
                        createVNode("div", null, [
                          createVNode("label", { class: "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Target URL"),
                          createVNode("div", { class: "relative" }, [
                            createVNode("div", { class: "pointer-events-none absolute inset-y-0 left-4 flex items-center" }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-4 w-4 text-slate-300",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                })
                              ]))
                            ]),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => audit.url = $event,
                              type: "url",
                              placeholder: "https://example.com/blog-post",
                              class: "w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                            }, null, 8, ["onUpdate:modelValue"]), [
                              [vModelText, audit.url]
                            ])
                          ])
                        ]),
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("div", { class: "h-px flex-1 bg-slate-100" }),
                          createVNode("span", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Or paste content"),
                          createVNode("div", { class: "h-px flex-1 bg-slate-100" })
                        ]),
                        withDirectives(createVNode("textarea", {
                          "onUpdate:modelValue": ($event) => audit.content = $event,
                          placeholder: "Paste your content here for analysis...",
                          class: "h-36 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                        }, "              ", 8, ["onUpdate:modelValue"]), [
                          [vModelText, audit.content]
                        ]),
                        createVNode("div", null, [
                          createVNode("label", { class: "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, [
                            createTextVNode("Target Keywords "),
                            createVNode("span", { class: "normal-case font-bold text-indigo-400" }, "(one per line)")
                          ]),
                          withDirectives(createVNode("textarea", {
                            "onUpdate:modelValue": ($event) => audit.keywordsRaw = $event,
                            placeholder: "primary keyword\nsecondary keyword\nlong-tail keyword...",
                            class: "h-28 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                          }, "                ", 8, ["onUpdate:modelValue"]), [
                            [vModelText, audit.keywordsRaw]
                          ])
                        ]),
                        createVNode("button", {
                          onClick: runAudit,
                          disabled: auditing.value || !audit.keywordsRaw,
                          class: "flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.01] hover:bg-indigo-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-50"
                        }, [
                          auditing.value ? (openBlock(), createBlock("svg", {
                            key: 0,
                            class: "h-5 w-5 animate-spin",
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
                          ])) : (openBlock(), createBlock("svg", {
                            key: 1,
                            class: "h-5 w-5",
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
                          ])),
                          createTextVNode(" " + toDisplayString(auditing.value ? "Analyzing Content..." : "Run SEO Audit"), 1)
                        ], 8, ["disabled"])
                      ])
                    ]),
                    createVNode("div", { class: "rounded-3xl border border-slate-100 bg-white p-8 shadow-sm" }, [
                      !auditResult.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "flex h-full flex-col items-center justify-center gap-4 py-20 text-center"
                      }, [
                        createVNode("div", { class: "flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100" }, [
                          (openBlock(), createBlock("svg", {
                            class: "h-8 w-8 text-slate-300",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "1.5",
                              d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            })
                          ]))
                        ]),
                        createVNode("p", { class: "text-base font-black text-slate-400" }, "Audit results appear here"),
                        createVNode("p", { class: "max-w-xs text-xs font-bold text-slate-300" }, "Run an audit on the left to see keyword gaps, opportunities, and priority fixes.")
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "custom-scrollbar max-h-[680px] overflow-y-auto pr-1"
                      }, [
                        createVNode("div", { class: "mb-6 flex items-center gap-6" }, [
                          createVNode("div", { class: "relative h-20 w-20 flex-shrink-0" }, [
                            (openBlock(), createBlock("svg", {
                              class: "h-full w-full -rotate-90",
                              viewBox: "0 0 36 36"
                            }, [
                              createVNode("circle", {
                                cx: "18",
                                cy: "18",
                                r: "15",
                                fill: "none",
                                class: "stroke-slate-100",
                                "stroke-width": "3"
                              }),
                              createVNode("circle", {
                                cx: "18",
                                cy: "18",
                                r: "15",
                                fill: "none",
                                class: "text-indigo-500",
                                "stroke-width": "3",
                                "stroke-dasharray": "94.25",
                                "stroke-dashoffset": 94.25 - 94.25 * (auditResult.value.seo_score || 0) / 100,
                                "stroke-linecap": "round",
                                style: { "stroke": "currentColor", "transition": "stroke-dashoffset 1s ease" }
                              }, null, 8, ["stroke-dashoffset"])
                            ])),
                            createVNode("div", { class: "absolute inset-0 flex items-center justify-center" }, [
                              createVNode("span", { class: "text-lg font-black text-slate-900" }, toDisplayString(auditResult.value.seo_score), 1)
                            ])
                          ]),
                          createVNode("div", null, [
                            createVNode("h3", { class: "text-xl font-black text-slate-900" }, "Audit Report"),
                            createVNode("p", { class: "mt-1 text-sm font-medium leading-snug text-slate-500" }, toDisplayString(auditResult.value.summary), 1)
                          ])
                        ]),
                        createVNode("div", { class: "space-y-4" }, [
                          createVNode("div", { class: "rounded-2xl border border-indigo-100 bg-indigo-50 p-5" }, [
                            createVNode("h4", { class: "mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-600" }, "Keyword Gaps"),
                            createVNode("ul", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.keyword_gaps, (gap) => {
                                return openBlock(), createBlock("li", {
                                  key: gap,
                                  class: "flex items-start gap-2 text-sm font-bold text-indigo-900"
                                }, [
                                  createVNode("span", { class: "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" }),
                                  createTextVNode(" " + toDisplayString(gap), 1)
                                ]);
                              }), 128))
                            ])
                          ]),
                          createVNode("div", { class: "rounded-2xl border border-amber-100 bg-amber-50 p-5" }, [
                            createVNode("h4", { class: "mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600" }, "High Priority Fixes"),
                            createVNode("ul", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.fix_priorities, (fix) => {
                                return openBlock(), createBlock("li", {
                                  key: fix,
                                  class: "flex items-start gap-2 text-sm font-bold text-amber-900"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500",
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
                          ]),
                          createVNode("div", { class: "rounded-2xl border border-emerald-100 bg-emerald-50 p-5" }, [
                            createVNode("h4", { class: "mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-700" }, "Optimization Tips"),
                            createVNode("ul", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(auditResult.value.optimization_tips, (tip) => {
                                return openBlock(), createBlock("li", {
                                  key: tip,
                                  class: "flex items-start gap-2 text-sm font-bold text-emerald-900"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2.5",
                                      d: "M5 13l4 4L19 7"
                                    })
                                  ])),
                                  createTextVNode(" " + toDisplayString(tip), 1)
                                ]);
                              }), 128))
                            ])
                          ])
                        ])
                      ]))
                    ])
                  ])
                ])) : createCommentVNode("", true),
                createVNode(Transition, {
                  "enter-active-class": "transition duration-500 ease-out",
                  "enter-from-class": "translate-x-full",
                  "enter-to-class": "translate-x-0",
                  "leave-active-class": "transition duration-300 ease-in",
                  "leave-from-class": "translate-x-0",
                  "leave-to-class": "translate-x-full"
                }, {
                  default: withCtx(() => [
                    editingPost.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"
                    }, [
                      createVNode("div", { class: "flex h-full w-full max-w-[96%] flex-col bg-slate-50 shadow-2xl" }, [
                        createVNode("div", { class: "flex h-18 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-4" }, [
                          createVNode("div", { class: "flex items-center gap-5" }, [
                            createVNode("button", {
                              onClick: closeEditor,
                              class: "rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-5 w-5",
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
                            createVNode("div", { class: "h-6 w-px bg-slate-100" }),
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => form.title = $event,
                              type: "text",
                              placeholder: "Post Title...",
                              class: ["w-96 border-b-2 bg-transparent p-0 text-lg font-black text-slate-900 transition-all outline-none ring-0 placeholder:text-slate-300 focus:ring-0", validationErrors.title ? "border-rose-200 focus:border-rose-400" : "border-transparent focus:border-indigo-400"],
                              onInput: ($event) => validationErrors.title = false
                            }, null, 42, ["onUpdate:modelValue", "onInput"]), [
                              [vModelText, form.title]
                            ])
                          ]),
                          createVNode("div", { class: "flex items-center gap-6" }, [
                            createVNode("button", {
                              onClick: ($event) => focusMode.value = !focusMode.value,
                              class: ["flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all", focusMode.value ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"]
                            }, [
                              (openBlock(), createBlock("svg", {
                                class: "h-4 w-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24"
                              }, [
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                }),
                                createVNode("path", {
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                  "stroke-width": "2",
                                  d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                })
                              ])),
                              createTextVNode(" " + toDisplayString(focusMode.value ? "Focusing" : "Focus Mode"), 1)
                            ], 10, ["onClick"]),
                            createVNode("span", { class: "text-xs font-bold text-slate-400" }, toDisplayString(metrics.word_count.toLocaleString()) + " words • " + toDisplayString(metrics.reading_time_minutes) + "m read", 1),
                            createVNode("div", { class: "h-5 w-px bg-slate-100" }),
                            createVNode("button", {
                              onClick: saveDraft,
                              disabled: saving.value,
                              class: "rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                            }, toDisplayString(saving.value ? "Saving..." : "Save Draft"), 9, ["disabled"]),
                            createVNode("button", {
                              onClick: publishPost,
                              class: "rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-lg"
                            }, " Publish ")
                          ])
                        ]),
                        createVNode("div", { class: "flex flex-1 overflow-hidden" }, [
                          createVNode("div", { class: "flex-1 overflow-y-auto bg-white p-10 custom-scrollbar" }, [
                            createVNode("div", { class: "mx-auto max-w-3xl" }, [
                              createVNode("div", { class: "mb-8 grid grid-cols-2 gap-6" }, [
                                createVNode("div", null, [
                                  createVNode("label", { class: "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Focus Keyword"),
                                  withDirectives(createVNode("input", {
                                    "onUpdate:modelValue": ($event) => form.focus_keyword = $event,
                                    onBlur: runAnalysis,
                                    onInput: ($event) => validationErrors.focus_keyword = false,
                                    type: "text",
                                    placeholder: "e.g. SEO Content Guide",
                                    class: ["w-full rounded-2xl border bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4", validationErrors.focus_keyword ? "border-rose-200 focus:border-rose-400 focus:ring-rose-50" : "border-slate-100 focus:border-indigo-200 focus:ring-indigo-50"]
                                  }, null, 42, ["onUpdate:modelValue", "onInput"]), [
                                    [vModelText, form.focus_keyword]
                                  ])
                                ]),
                                createVNode("div", null, [
                                  createVNode("label", { class: "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Category"),
                                  withDirectives(createVNode("select", {
                                    "onUpdate:modelValue": ($event) => form.blog_category_id = $event,
                                    class: "w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
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
                                ])
                              ]),
                              createVNode("div", { class: "mb-8 rounded-2xl border border-slate-100 bg-slate-50/60 p-6" }, [
                                createVNode("div", { class: "mb-5 flex items-center gap-3" }, [
                                  createVNode("div", { class: "flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600" }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "h-3.5 w-3.5",
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
                                  createVNode("h4", { class: "text-[10px] font-black uppercase tracking-widest text-slate-700" }, "Search Appearance")
                                ]),
                                createVNode("div", { class: "grid gap-4" }, [
                                  createVNode("div", null, [
                                    createVNode("div", { class: "mb-1.5 flex justify-between" }, [
                                      createVNode("label", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "SEO Title"),
                                      createVNode("span", {
                                        class: ["text-[10px] font-bold", (form.meta_title || "").length > 60 ? "text-rose-500" : "text-slate-400"]
                                      }, toDisplayString((form.meta_title || "").length) + " / 60", 3)
                                    ]),
                                    withDirectives(createVNode("input", {
                                      "onUpdate:modelValue": ($event) => form.meta_title = $event,
                                      type: "text",
                                      placeholder: form.title,
                                      class: "w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                                    }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                                      [vModelText, form.meta_title]
                                    ])
                                  ]),
                                  createVNode("div", null, [
                                    createVNode("div", { class: "mb-1.5 flex justify-between" }, [
                                      createVNode("label", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Meta Description"),
                                      createVNode("span", {
                                        class: ["text-[10px] font-bold", (form.meta_description || "").length > 160 ? "text-rose-500" : "text-slate-400"]
                                      }, toDisplayString((form.meta_description || "").length) + " / 160", 3)
                                    ]),
                                    withDirectives(createVNode("textarea", {
                                      "onUpdate:modelValue": ($event) => form.meta_description = $event,
                                      rows: "2",
                                      placeholder: "Briefly summarize your post...",
                                      class: "w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                                    }, "                        ", 8, ["onUpdate:modelValue"]), [
                                      [vModelText, form.meta_description]
                                    ])
                                  ]),
                                  createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                                    createVNode("div", null, [
                                      createVNode("label", { class: "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Canonical URL"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => form.canonical_url = $event,
                                        type: "url",
                                        placeholder: "https://...",
                                        class: "w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, form.canonical_url]
                                      ])
                                    ]),
                                    createVNode("div", null, [
                                      createVNode("label", { class: "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Featured Image URL"),
                                      withDirectives(createVNode("input", {
                                        "onUpdate:modelValue": ($event) => form.featured_image_url = $event,
                                        type: "url",
                                        placeholder: "https://cdn.example.com/...",
                                        class: "w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
                                      }, null, 8, ["onUpdate:modelValue"]), [
                                        [vModelText, form.featured_image_url]
                                      ])
                                    ])
                                  ])
                                ])
                              ]),
                              createVNode("div", { class: "sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-md" }, [
                                createVNode("button", {
                                  onClick: ($event) => format("bold"),
                                  class: "toolbar-btn font-black text-xs",
                                  title: "Bold"
                                }, "B", 8, ["onClick"]),
                                createVNode("button", {
                                  onClick: ($event) => format("italic"),
                                  class: "toolbar-btn italic font-serif text-xs",
                                  title: "Italic"
                                }, "I", 8, ["onClick"]),
                                createVNode("button", {
                                  onClick: ($event) => format("underline"),
                                  class: "toolbar-btn underline font-serif text-xs",
                                  title: "Underline"
                                }, "U", 8, ["onClick"]),
                                createVNode("div", { class: "mx-1 h-5 w-px bg-slate-200" }),
                                createVNode("button", {
                                  onClick: ($event) => format("formatBlock", "h2"),
                                  class: "toolbar-btn text-[10px] font-black",
                                  title: "H2"
                                }, "H2", 8, ["onClick"]),
                                createVNode("button", {
                                  onClick: ($event) => format("formatBlock", "h3"),
                                  class: "toolbar-btn text-[10px] font-black",
                                  title: "H3"
                                }, "H3", 8, ["onClick"]),
                                createVNode("div", { class: "mx-1 h-5 w-px bg-slate-200" }),
                                createVNode("button", {
                                  onClick: ($event) => format("insertUnorderedList"),
                                  class: "toolbar-btn",
                                  title: "Bullet List"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "h-4 w-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M4 6h16M4 12h16M4 18h16"
                                    })
                                  ]))
                                ], 8, ["onClick"]),
                                createVNode("button", {
                                  onClick: ($event) => format("insertOrderedList"),
                                  class: "toolbar-btn",
                                  title: "Numbered List"
                                }, [
                                  (openBlock(), createBlock("svg", {
                                    class: "h-4 w-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24"
                                  }, [
                                    createVNode("path", {
                                      "stroke-linecap": "round",
                                      "stroke-linejoin": "round",
                                      "stroke-width": "2",
                                      d: "M9 5H7m2 0h2m-2 0v4m0 0H7m2 0h2m-2 0v4m0 0H7m2 0h2"
                                    })
                                  ]))
                                ], 8, ["onClick"]),
                                createVNode("div", { class: "mx-1 h-5 w-px bg-slate-200" }),
                                createVNode("button", {
                                  onClick: ($event) => format("removeFormat"),
                                  class: "toolbar-btn text-[10px] font-bold text-slate-400",
                                  title: "Clear Format"
                                }, "Clear", 8, ["onClick"])
                              ]),
                              createVNode("div", {
                                ref_key: "editor",
                                ref: editor,
                                contenteditable: "true",
                                class: ["prose prose-slate prose-lg max-w-none min-h-[600px] transition-all focus:outline-none editor-placeholder", focusMode.value ? "px-12 py-8" : ""],
                                onInput: handleEditorInput,
                                "data-placeholder": "Start your story here..."
                              }, null, 34)
                            ])
                          ]),
                          !focusMode.value ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 custom-scrollbar transition-all"
                          }, [
                            createVNode("div", { class: "border-b border-slate-100 bg-white p-6 text-center" }, [
                              createVNode("div", { class: "mb-5 flex items-center justify-between" }, [
                                createVNode("p", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Master SEO Score"),
                                createVNode("span", {
                                  class: ["rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all", [seoTier.value.color, seoTier.value.bg, seoTier.value.border, "border"]]
                                }, toDisplayString(seoTier.value.label), 3)
                              ]),
                              createVNode("div", { class: "relative mx-auto mb-8 inline-flex" }, [
                                createVNode("div", {
                                  class: ["absolute inset-0 rounded-full blur-2xl transition-all duration-1000 opacity-20", seoTier.value.bg]
                                }, null, 2),
                                (openBlock(), createBlock("svg", {
                                  class: "relative h-32 w-32 -rotate-90",
                                  viewBox: "0 0 36 36"
                                }, [
                                  createVNode("circle", {
                                    class: "text-slate-100",
                                    "stroke-width": "3",
                                    stroke: "currentColor",
                                    fill: "transparent",
                                    r: "15",
                                    cx: "18",
                                    cy: "18"
                                  }),
                                  createVNode("circle", {
                                    class: [getScoreColorClass(form.seo_score), "transition-all duration-1000"],
                                    "stroke-width": "3",
                                    "stroke-dasharray": "94.25",
                                    "stroke-dashoffset": 94.25 - 94.25 * (form.seo_score || 0) / 100,
                                    "stroke-linecap": "round",
                                    stroke: "currentColor",
                                    fill: "transparent",
                                    r: "15",
                                    cx: "18",
                                    cy: "18"
                                  }, null, 10, ["stroke-dashoffset"])
                                ])),
                                createVNode("span", { class: "absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900" }, toDisplayString(form.seo_score || 0), 1)
                              ]),
                              createVNode("div", { class: "mb-6 grid grid-cols-3 gap-2" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(scoreBreakdown.value, (item) => {
                                  return openBlock(), createBlock("div", {
                                    key: item.label,
                                    class: "flex flex-col items-center"
                                  }, [
                                    createVNode("div", { class: "mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-100" }, [
                                      createVNode("div", {
                                        class: "h-full bg-indigo-500 transition-all duration-1000",
                                        style: { width: item.percent + "%" }
                                      }, null, 4)
                                    ]),
                                    createVNode("span", { class: "text-[8px] font-black uppercase tracking-tighter text-slate-400" }, toDisplayString(item.label), 1)
                                  ]);
                                }), 128))
                              ]),
                              createVNode("button", {
                                onClick: runAnalysis,
                                disabled: analyzing.value,
                                class: "flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-wide text-white transition-all hover:bg-black disabled:opacity-50"
                              }, [
                                analyzing.value ? (openBlock(), createBlock("svg", {
                                  key: 0,
                                  class: "h-3.5 w-3.5 animate-spin",
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
                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                  })
                                ])) : createCommentVNode("", true),
                                createTextVNode(" " + toDisplayString(analyzing.value ? "Analyzing..." : "Refresh Audit"), 1)
                              ], 8, ["disabled"])
                            ]),
                            createVNode("div", { class: "border-b border-slate-100 bg-white p-6" }, [
                              createVNode("p", { class: "mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Content Stats"),
                              createVNode("div", { class: "space-y-3" }, [
                                createVNode("div", { class: "flex items-center justify-between" }, [
                                  createVNode("span", { class: "text-[11px] font-black uppercase tracking-wide text-slate-400" }, "Word Count"),
                                  createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString(metrics.word_count.toLocaleString()), 1)
                                ]),
                                createVNode("div", { class: "flex items-center justify-between" }, [
                                  createVNode("span", { class: "text-[11px] font-black uppercase tracking-wide text-slate-400" }, "Read Time"),
                                  createVNode("span", { class: "text-sm font-black text-slate-900" }, toDisplayString(metrics.reading_time_minutes) + "m", 1)
                                ]),
                                createVNode("div", { class: "flex items-center justify-between" }, [
                                  createVNode("span", { class: "text-[11px] font-black uppercase tracking-wide text-slate-400" }, "KW Density"),
                                  createVNode("span", {
                                    class: ["text-sm font-black", density.primary > 1 && density.primary < 3 ? "text-emerald-500" : "text-amber-500"]
                                  }, toDisplayString(density.primary.toFixed(1)) + "%", 3)
                                ])
                              ])
                            ]),
                            createVNode("div", { class: "border-b border-slate-100 bg-white p-6" }, [
                              createVNode("p", { class: "mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400" }, "SERP Preview"),
                              createVNode("div", { class: "rounded-xl border border-slate-100 bg-slate-50 p-4 text-left" }, [
                                createVNode("p", { class: "mb-1 truncate text-[9px] text-slate-400" }, "https://" + toDisplayString(__props.organization?.slug || "site") + ".ai/blog/...", 1),
                                createVNode("h5", { class: "mb-1 line-clamp-2 cursor-pointer text-xs font-bold text-blue-600 hover:underline" }, toDisplayString(form.meta_title || form.title || "Untitled Post"), 1),
                                createVNode("p", { class: "line-clamp-3 text-[10px] leading-relaxed text-slate-500" }, toDisplayString(form.meta_description || "Start writing to preview your meta description here..."), 1)
                              ])
                            ]),
                            createVNode("div", { class: "border-b border-slate-100 bg-white p-6" }, [
                              createVNode("div", { class: "mb-4 flex items-center justify-between" }, [
                                createVNode("p", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "AI Probability"),
                                createVNode("span", {
                                  class: [getAiScoreClass(form.ai_content_score), "rounded-lg px-2.5 py-1 text-[10px] font-black"]
                                }, toDisplayString(form.ai_content_score || 0) + "%", 3)
                              ]),
                              createVNode("div", { class: "mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100" }, [
                                createVNode("div", {
                                  class: [getAiBgClass(form.ai_content_score), "h-full rounded-full transition-all duration-1000"],
                                  style: { width: (form.ai_content_score || 0) + "%" }
                                }, null, 6)
                              ]),
                              form.ai_detection_notes ? (openBlock(), createBlock("p", {
                                key: 0,
                                class: "text-[10px] font-bold italic leading-relaxed text-slate-400"
                              }, toDisplayString(form.ai_detection_notes), 1)) : createCommentVNode("", true)
                            ]),
                            createVNode("div", { class: "border-b border-slate-100 bg-white p-6" }, [
                              createVNode("p", { class: "mb-5 text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Actionable Audit"),
                              createVNode("div", { class: "space-y-6" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(groupedChecks.value, (checks, category) => {
                                  return openBlock(), createBlock("div", { key: category }, [
                                    createVNode("h5", { class: "mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400" }, toDisplayString(category), 1),
                                    createVNode("div", { class: "space-y-3" }, [
                                      (openBlock(true), createBlock(Fragment, null, renderList(checks, (check) => {
                                        return openBlock(), createBlock("div", {
                                          key: check.id,
                                          class: "group flex items-start gap-2.5"
                                        }, [
                                          createVNode("div", { class: "mt-0.5 flex-shrink-0" }, [
                                            check.status === "success" ? (openBlock(), createBlock("svg", {
                                              key: 0,
                                              class: "h-3.5 w-3.5 text-emerald-500",
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
                                              class: "h-3.5 w-3.5 text-rose-500",
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
                                              class: "h-3.5 w-3.5 text-amber-500",
                                              fill: "none",
                                              stroke: "currentColor",
                                              viewBox: "0 0 24 24"
                                            }, [
                                              createVNode("path", {
                                                "stroke-linecap": "round",
                                                "stroke-linejoin": "round",
                                                "stroke-width": "4",
                                                d: "M12 9v2m0 4h.01"
                                              })
                                            ]))
                                          ]),
                                          createVNode("div", null, [
                                            createVNode("p", {
                                              class: ["text-[10px] font-black leading-tight", check.status === "success" ? "text-slate-700" : "text-slate-500"]
                                            }, toDisplayString(check.message), 3),
                                            check.action && check.status !== "success" ? (openBlock(), createBlock("p", {
                                              key: 0,
                                              class: "mt-0.5 text-[9px] font-bold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                                            }, toDisplayString(check.action), 1)) : createCommentVNode("", true)
                                          ])
                                        ]);
                                      }), 128))
                                    ])
                                  ]);
                                }), 128))
                              ])
                            ]),
                            createVNode("div", { class: "bg-white p-6" }, [
                              createVNode("div", { class: "mb-5 flex items-center justify-between" }, [
                                createVNode("p", { class: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Writing Assistant"),
                                createVNode("span", { class: "rounded bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-tighter text-indigo-600" }, "AI LIVE")
                              ]),
                              createVNode("div", { class: "space-y-4" }, [
                                createVNode("div", { class: "rounded-2xl border border-slate-100 bg-slate-50 p-4" }, [
                                  createVNode("p", { class: "mb-2 text-[10px] font-black italic uppercase tracking-widest text-slate-400" }, "Semantic Keywords"),
                                  createVNode("div", { class: "flex flex-wrap gap-1.5" }, [
                                    (openBlock(true), createBlock(Fragment, null, renderList(semanticKeywords.value, (kw) => {
                                      return openBlock(), createBlock("span", {
                                        key: kw,
                                        onClick: ($event) => addKeyword(kw),
                                        class: "cursor-pointer rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600"
                                      }, "+ " + toDisplayString(kw), 9, ["onClick"]);
                                    }), 128))
                                  ])
                                ]),
                                createVNode("div", { class: "flex gap-2" }, [
                                  createVNode("button", {
                                    onClick: generateIntro,
                                    disabled: isGeneratingIntro.value,
                                    class: "flex-1 rounded-2xl border-2 border-slate-900 bg-white py-3 text-[10px] font-black uppercase text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-50"
                                  }, toDisplayString(isGeneratingIntro.value ? "Drafting..." : "Gen Intro"), 9, ["disabled"]),
                                  createVNode("button", {
                                    onClick: generateOutline,
                                    disabled: isGeneratingOutline.value,
                                    class: "flex-1 rounded-2xl border-2 border-indigo-600 bg-white py-3 text-[10px] font-black uppercase text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white disabled:opacity-50"
                                  }, toDisplayString(isGeneratingOutline.value ? "Building..." : "Outline"), 9, ["disabled"])
                                ]),
                                validationErrors.title || validationErrors.focus_keyword ? (openBlock(), createBlock("div", {
                                  key: 0,
                                  class: "rounded-xl border border-rose-100 bg-rose-50 p-3"
                                }, [
                                  createVNode("div", { class: "flex gap-2" }, [
                                    (openBlock(), createBlock("svg", {
                                      class: "h-4 w-4 shrink-0 text-rose-500",
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
                                    createVNode("p", { class: "text-[9px] font-black uppercase tracking-widest text-rose-600" }, "Action Required")
                                  ]),
                                  createVNode("p", { class: "mt-1 text-[10px] font-bold leading-relaxed text-rose-900" }, toDisplayString(validationErrors.title ? "• Post Title is missing" : "") + " " + toDisplayString(validationErrors.focus_keyword ? "• Focus Keyword is missing (required for Intro)" : ""), 1)
                                ])) : createCommentVNode("", true),
                                hasSelection.value ? (openBlock(), createBlock("div", {
                                  key: 1,
                                  class: "border-t border-slate-100 pt-4"
                                }, [
                                  createVNode("p", { class: "mb-3 text-[9px] font-black uppercase tracking-widest text-indigo-500" }, "Selection Tools"),
                                  createVNode("button", {
                                    onClick: refineSelection,
                                    disabled: isRefining.value,
                                    class: "w-full rounded-2xl bg-indigo-600 py-3 text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
                                  }, toDisplayString(isRefining.value ? "Refining..." : "Refine Tone"), 9, ["disabled"])
                                ])) : createCommentVNode("", true)
                              ])
                            ])
                          ])) : createCommentVNode("", true)
                        ])
                      ])
                    ])) : createCommentVNode("", true)
                  ]),
                  _: 2
                }, 1024)
              ]),
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
