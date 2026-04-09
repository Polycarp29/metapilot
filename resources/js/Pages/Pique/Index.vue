<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import { Head, usePage } from '@inertiajs/vue3';
import axios from 'axios';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/useToastStore';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markdown';

const props = defineProps({
    initialBalance: Number
});

// State Management
const messages = ref([
    {
        id: 1,
        role: 'agent',
        content: "Hello! I'm **Pique**, your AI SEO specialist. I've been analyzing your site's performance and noticed some opportunities for optimization. How can I help you today?",
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
        id: 2,
        role: 'agent',
        content: "I can help you with:",
        type: 'suggestions',
        items: [
            { id: 'audit', label: 'Run Full SEO Audit', icon: 'ChartBarIcon' },
            { id: 'keywords', label: 'Research Keywords', icon: 'MagnifyingGlassIcon' },
            { id: 'schema', label: 'Generate JSON-LD Schema', icon: 'CodeBracketIcon' },
            { id: 'content', label: 'Humanize Content', icon: 'UserIcon' },
            { id: 'google_analytics', label: 'Analyse GA4 & GSC', icon: 'TrendsData'},
            { id: 'pixel', label: 'Metapilot Pixel Data', icon: 'PixelData'},
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
]);

const userInput = ref('');
const isTyping = ref(false);
const chatContainer = ref(null);
const currentSessionId = ref(null);
const selectedModel = ref('pique-gpt');
const balance = ref(props.initialBalance || 0);
const selectedToggles = ref([]);
const history = ref([]);
const toast = useToastStore();

const showDeleteModal = ref(false);
const sessionToDelete = ref(null);
const isDeleting = ref(false);

// ─── Crawl Container Panel State ───────────────────────────────────────────
const crawlPanelMsgId = ref(null); // ID of the crawl_ui message in the feed
const crawlStep = ref('select');   // 'select' | 'create' | 'progress'
const crawlContainers = ref([]);
const crawlForm = ref({ name: '', sitemap_name: '', site_url: '' });
const crawlFormError = ref('');
const crawlFormSubmitting = ref(false);
const activeSitemapId = ref(null);
const activeCrawlJobId = ref(null);
const crawlProgress = ref({ status: 'dispatched', total_crawled: 0, total_discovered: 0, current_url: '', logs: [], manage_url: '' });
const crawlPollInterval = ref(null);

const startCrawlPoll = (sitemapId) => {
    if (crawlPollInterval.value) clearInterval(crawlPollInterval.value);
    crawlPollInterval.value = setInterval(async () => {
        try {
            const res = await axios.get(route('api.pique.containers.crawl-status', sitemapId));
            const data = res.data;
            const pct = data.total_discovered > 0
                ? Math.round((data.total_crawled / data.total_discovered) * 100)
                : 0;
            crawlProgress.value = {
                status: data.status,
                total_crawled: data.total_crawled ?? 0,
                total_discovered: data.total_discovered ?? 0,
                current_url: data.current_url ?? '',
                pct,
                manage_url: data.manage_url ?? '',
                links_count: data.links_count ?? 0,
                logs: data.logs ?? [],
            };
            // Stop polling when done
            if (['completed', 'failed', 'error'].includes(data.status)) {
                clearInterval(crawlPollInterval.value);
                crawlPollInterval.value = null;
            }
        } catch (e) {
            console.error('Crawl poll error', e);
        }
    }, 3000);
};

const launchCrawlForContainer = async (container) => {
    try {
        crawlFormSubmitting.value = true;
        activeSitemapId.value = container.id;
        const res = await axios.post(route('api.pique.containers.crawl', container.id));
        activeCrawlJobId.value = res.data.job_id;
        crawlProgress.value = { status: 'dispatched', total_crawled: 0, total_discovered: 0, current_url: '', pct: 0, manage_url: res.data.manage_url ?? '', logs: [] };
        crawlStep.value = 'progress';
        startCrawlPoll(container.id);
    } catch (e) {
        toast.error(e.response?.data?.error ?? 'Failed to start crawl', 'Error');
    } finally {
        crawlFormSubmitting.value = false;
    }
};

const submitCreateContainer = async () => {
    crawlFormError.value = '';
    if (!crawlForm.value.name || !crawlForm.value.sitemap_name || !crawlForm.value.site_url) {
        crawlFormError.value = 'All fields are required.';
        return;
    }
    try {
        crawlFormSubmitting.value = true;
        const res = await axios.post(route('api.pique.containers.store'), crawlForm.value);
        const newContainer = res.data;
        await launchCrawlForContainer(newContainer);
    } catch (e) {
        crawlFormError.value = e.response?.data?.message ?? 'Failed to create container.';
    } finally {
        crawlFormSubmitting.value = false;
    }
};

// ─── SEO Report Panel State ───────────────────────────────────────────────
const reportStep = ref('select'); // 'select' | 'sections' | 'generating' | 'ready'
const reportProperties = ref([]);
const reportSelectedProps = ref([]);
const reportDateRange = ref('30'); // '7' | '30' | '90'
const reportSections = ref(['overview', 'traffic', 'acquisition', 'seo_intelligence', 'insights', 'forecasts']);
const reportGenerating = ref(false);
const reportResult = ref(null);
const reportError = ref('');
const reportJobId = ref(null);
let reportPollInterval = null;

const stopReportPoll = () => {
    if (reportPollInterval) {
        clearInterval(reportPollInterval);
        reportPollInterval = null;
    }
};

const startReportPoll = (jobId) => {
    stopReportPoll();
    reportJobId.value = jobId;
    
    reportPollInterval = setInterval(async () => {
        try {
            const res = await axios.get(route('api.pique.report.status', jobId));
            const status = res.data.status;
            
            if (status === 'completed') {
                reportResult.value = res.data.data;
                reportStep.value = 'ready';
                stopReportPoll();
            } else if (status === 'failed') {
                reportError.value = res.data.error || 'Report generation failed.';
                reportStep.value = 'sections';
                stopReportPoll();
            } else if (status === 'not_found' || status === 'expired') {
                reportError.value = 'Report job timed out or not found.';
                reportStep.value = 'sections';
                stopReportPoll();
            }
        } catch (e) {
            console.error('Report poll error:', e);
        }
    }, 3000);
};

onUnmounted(() => {
    stopCrawlPoll();
    stopReportPoll();
});

const toggleReportSection = (section) => {
    const idx = reportSections.value.indexOf(section);
    if (idx > -1) reportSections.value.splice(idx, 1);
    else reportSections.value.push(section);
};

const submitGenerateReport = async () => {
    if (reportSelectedProps.value.length === 0) {
        reportError.value = 'Please select at least one property.';
        return;
    }
    try {
        reportGenerating.value = true;
        reportError.value = '';
        reportStep.value = 'generating';
        
        const res = await axios.post(route('api.pique.report.generate'), {
            property_ids: reportSelectedProps.value,
            days: parseInt(reportDateRange.value),
            sections: reportSections.value
        });
        
        if (res.data.job_id) {
            startReportPoll(res.data.job_id);
        } else {
             // Fallback for old direct response if any
            reportResult.value = res.data;
            reportStep.value = 'ready';
        }
    } catch (e) {
        reportError.value = e.response?.data?.error ?? 'Failed to generate report.';
        reportStep.value = 'sections'; // Go back to allow fix
    } finally {
        reportGenerating.value = false;
    }
};

const models = [
    { id: 'pique-gpt', label: 'Pique GPT', description: 'Advanced Reasoning' },
    { id: 'pique-claude', label: 'Pique Claude', description: 'Technical Expert' },
    { id: 'pique-gemini', label: 'Pique Gemini', description: 'Google Ecosystem' },
];

const fetchHistory = async () => {
    try {
        const response = await axios.get(route('api.pique.history'));
        history.value = response.data;
    } catch (e) {
        console.error('Failed to fetch history', e);
    }
};

const switchSession = async (sessionId) => {
    if (isTyping.value) return;
    try {
        isTyping.value = true;
        const response = await axios.get(route('api.pique.session', sessionId));
        currentSessionId.value = response.data.session_id;
        messages.value = response.data.messages.map(m => ({
            ...m,
            role: m.role === 'user' ? 'user' : 'agent',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Simple fallback
        }));
        isTyping.value = false;
        scrollToBottom();
    } catch (e) {
        isTyping.value = false;
        console.error('Failed to switch session', e);
    }
};

const startNewChat = () => {
    currentSessionId.value = null;
    messages.value = [
        {
            id: 1,
            role: 'agent',
            content: "Hello! I'm **Pique**, your AI SEO specialist. I've been analyzing your site's performance and noticed some opportunities for optimization. How can I help you today?",
            type: 'text',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
            id: 2,
            role: 'agent',
            content: "I can help you with:",
            type: 'suggestions',
            items: [
                { id: 'audit', label: 'Run Full SEO Audit', icon: 'ChartBarIcon' },
                { id: 'keywords', label: 'Research Keywords', icon: 'MagnifyingGlassIcon' },
                { id: 'schema', label: 'Generate JSON-LD Schema', icon: 'CodeBracketIcon' },
                { id: 'content', label: 'Humanize Content', icon: 'UserIcon' },
                { id: 'google_analytics', label: 'Analyse GA4 & GSC', icon: 'TrendsData'},
                { id: 'pixel', label: 'Metapilot Pixel Data', icon: 'PixelData'},
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        await axios.delete(route('api.pique.session.destroy', sid));
        
        if (currentSessionId.value === sid) {
            startNewChat();
        }
        
        await fetchHistory();
        toast.success('Conversation deleted successfully', 'Deleted');
        
        showDeleteModal.value = false;
        sessionToDelete.value = null;
    } catch (e) {
        toast.error('Failed to delete conversation', 'Error');
        console.error('Failed to delete session', e);
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
        role: 'user',
        content: userText,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.value.push(newMsg);
    userInput.value = '';
    scrollToBottom();

    isTyping.value = true;

    try {
        const response = await axios.post(route('api.pique.ask'), {
            prompt: userText,
            model: selectedModel.value,
            session_id: currentSessionId.value
        });

        isTyping.value = false;
        
        if (response.data.response) {
            const action = response.data.action;

            // Handle crawl container selector as a special in-chat UI message
            if (action?.action === 'crawl_container_select') {
                crawlContainers.value = action.containers ?? [];
                crawlStep.value = 'select';
                crawlForm.value = { name: '', sitemap_name: '', site_url: '' };
                crawlFormError.value = '';
                activeSitemapId.value = null;
                activeCrawlJobId.value = null;
                const crawlMsgId = Date.now() + 1;
                crawlPanelMsgId.value = crawlMsgId;
                messages.value.push({
                    id: crawlMsgId,
                    role: 'agent',
                    content: response.data.response,
                    type: 'crawl_ui',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
            } else if (action?.action === 'report_property_select') {
                // Initialize report UI state
                reportProperties.value = action.properties ?? [];
                reportSelectedProps.value = reportProperties.value.map(p => p.id); // Select all by default
                reportStep.value = 'select';
                reportGenerating.value = false;
                reportResult.value = null;
                reportError.value = '';

                messages.value.push({
                    id: Date.now() + 1,
                    role: 'agent',
                    content: response.data.response || "Which properties should I include in the SEO report?",
                    type: 'report_ui',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
            } else {
                messages.value.push({
                    id: Date.now() + 1,
                    role: 'agent',
                    content: response.data.response,
                    type: 'text',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    action,
                });
            }

            currentSessionId.value = response.data.session_id;

            // Refresh balance and history
            const balanceRes = await axios.get(route('api.pique.credits'));
            balance.value = balanceRes.data.balance;
            fetchHistory();
        }

        scrollToBottom();
    } catch (error) {
        isTyping.value = false;
        const errorMsg = error.response?.data?.error || 'Something went wrong. Please try again.';
        
        messages.value.push({
            id: Date.now() + 1,
            role: 'agent',
            content: `Error: ${errorMsg}`,
            type: 'text',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        scrollToBottom();
    }
};

const handleAction = (input) => {
    // Legacy support for suggestion strings
    const btn = typeof input === 'string' 
        ? { type: 'button', action: input } 
        : input;

    if (btn.type === 'toggle') {
        if (selectedToggles.value.includes(btn.value)) {
            selectedToggles.value = selectedToggles.value.filter(v => v !== btn.value);
        } else {
            selectedToggles.value.push(btn.value);
        }
        return;
    }

    let actionLabel = btn.action;
    if (selectedToggles.value.length > 0) {
        actionLabel += ` with modules: ${selectedToggles.value.join(',')}`;
    }

    userInput.value = `Can you ${actionLabel.replace(/_/g, ' ')} for me?`;
    selectedToggles.value = []; // Clear toggles after use
    sendMessage();
};

const renderMarkdown = (content) => {
    if (!content) return '';
    
    const renderer = new marked.Renderer();
    
    // Custom Code Block Renderer (VS Code Style)
    renderer.code = (codeOrObj, language) => {
        const codeText = typeof codeOrObj === 'object' ? codeOrObj.text : codeOrObj;
        const validLang = (typeof codeOrObj === 'object' ? codeOrObj.lang : language) || 'javascript';
        let highlighted = codeText;
        
        try {
            const prismLang = Prism.languages[validLang] || Prism.languages.markup || Prism.languages.javascript;
            highlighted = Prism.highlight(codeText, prismLang, validLang);
        } catch (e) {
            console.error('Prism highlighting failed', e);
            // Fallback: simple escaping for security/rendering
            highlighted = codeText.replace(/[&<>"']/g, (m) => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[m]));
        }

        // Use a safe ID or hidden attribute instead of btoa which fails on Unicode
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

    // Parse Markdown
    let html = marked.parse(content, { renderer });
    
    // Sanitize
    return DOMPurify.sanitize(html);
};

// Helper to extract buttons from content (regex for [[Action: Label | Command]])
const extractButtons = (content) => {
    const buttons = [];
    if (!content) return buttons;
    
    // Pattern: [[Button: Label | action_id]] or [[Toggle: Label | value]]
    const btnRegex = /\[\[Button:\s*(.*?)\|\s*(.*?)\]\]/g;
    const tglRegex = /\[\[Toggle:\s*(.*?)\|\s*(.*?)\]\]/g;
    
    let match;
    while ((match = btnRegex.exec(content)) !== null) {
        buttons.push({ type: 'button', label: match[1].trim(), action: match[2].trim() });
    }
    while ((match = tglRegex.exec(content)) !== null) {
        buttons.push({ type: 'toggle', label: match[1].trim(), value: match[2].trim() });
    }
    return buttons;
};

// Clean content by removing the button syntax for display
const cleanContent = (content) => {
    if (!content) return '';
    return content.replace(/\[\[Button:.*?\]\]/g, '').trim();
};

onMounted(() => {
    fetchHistory();
    scrollToBottom();
    
    // Handle dynamic copy buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            try {
                const encodedCode = e.target.getAttribute('data-code');
                const code = decodeURIComponent(encodedCode);
                navigator.clipboard.writeText(code);
                e.target.innerText = 'Copied!';
                setTimeout(() => e.target.innerText = 'Copy', 2000);
                toast.success('Code copied to clipboard', 'Copied');
            } catch (err) {
                console.error('Copy failed', err);
            }
        }
    });
});

</script>

<template>

    <Head title="Pique AI Agent" />
    <AppLayout>
        <div
            class="h-[calc(100vh-140px)] flex flex-col lg:flex-row overflow-hidden bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40">

            <!-- Side Navigation: Chat History & Tools -->
            <aside class="w-full lg:w-80 flex flex-col border-r border-slate-200/50 bg-slate-50/50">
                <div class="p-6 border-b border-slate-200/50 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-slate-900 tracking-tight">Conversations</h2>
                    <button
                        @click="startNewChat"
                        class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <div class="px-3 pb-2">
                        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Chats</h3>
                    </div>
                    <div v-for="session in history" :key="session.id"
                        class="group p-3 border rounded-xl cursor-pointer transition-all relative"
                        :class="currentSessionId === session.id ? 'bg-white border-blue-200 shadow-sm' : 'hover:bg-white/60 border-transparent'">
                        
                        <div @click="switchSession(session.id)" class="pr-8">
                            <div class="font-semibold text-slate-800 text-sm truncate" :class="currentSessionId === session.id ? 'text-blue-600' : ''">
                                {{ session.title }}
                            </div>
                            <div class="text-xs text-slate-400 mt-1">{{ session.updated_at }}</div>
                        </div>

                        <!-- Delete Button -->
                        <button @click.stop="deleteSession(session.id)" 
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Footer Sidebar Tools -->
                <div class="p-6 bg-slate-100/30 border-t border-slate-200/50">
                    <div class="mb-4">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Active Model</label>
                        <select v-model="selectedModel" class="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold p-2.5 focus:ring-blue-500 focus:border-blue-500">
                            <option v-for="model in models" :key="model.id" :value="model.id">
                                {{ model.label }}
                            </option>
                        </select>
                    </div>

                    <div
                        class="flex items-center space-x-3 p-3 rounded-2xl bg-white border border-slate-200/50 shadow-sm shadow-slate-100">
                        <div
                            class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <div class="text-xs font-bold text-slate-900 leading-tight">Credits Remaining</div>
                            <div class="text-sm text-blue-600 font-extrabold">{{ balance.toFixed(2) }}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Chat Area -->
            <main class="flex-1 flex flex-col relative bg-white/20 backdrop-blur-sm shadow-inner">

                <!-- Chat Feed -->
                <div ref="chatContainer"
                    class="flex-1 overflow-y-auto overflow-x-auto p-6 lg:p-10 space-y-8 scroll-smooth scrollbar-hide">

                    <div v-for="msg in messages" :key="msg.id"
                        class="flex animate-in fade-in slide-in-from-bottom-4 duration-500"
                        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">

                        <!-- Pique Avatar -->
                        <div v-if="msg.role === 'agent'"
                            class="w-10 h-10 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg mr-4 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                            </svg>
                        </div>

                        <!-- Message Content -->
                        <div class="max-w-[85%] lg:max-w-[70%] space-y-3">
                            <div class="px-5 py-4 rounded-3xl text-slate-800  transition-all" :class="msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-slate-100 rounded-tl-none'">

                                <div class="prose prose-slate prose-sm max-w-none text-[15px] leading-relaxed markdown-content" 
                                     v-html="renderMarkdown(cleanContent(msg.content))"></div>
                                
                                <!-- Inline Action Buttons -->
                                <div v-if="extractButtons(msg.content).length > 0" class="mt-4 flex flex-wrap gap-2">
                                    <button v-for="btn in extractButtons(msg.content)" :key="btn.label"
                                        @click="handleAction(btn)"
                                        :class="[
                                            'px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm border',
                                            btn.type === 'toggle' 
                                                ? (selectedToggles.includes(btn.value) 
                                                    ? 'bg-blue-600 border-blue-700 text-white' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400')
                                                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white'
                                        ]">
                                        <span v-if="btn.type === 'toggle' && selectedToggles.includes(btn.value)" class="mr-1">✓</span>
                                        {{ btn.label }}
                                    </button>
                                </div>
                                
                                <!-- Action Status Badge -->
                                <div v-if="msg.action" class="mt-4 p-3 bg-blue-50/80 border border-blue-200/50 rounded-2xl shadow-sm">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                        <span class="text-[10px] font-extrabold text-blue-800 uppercase tracking-widest">{{ msg.action.label || msg.action }}</span>
                                    </div>

                                    <!-- Action Result Previews -->
                                    <div v-if="msg.action.data" class="bg-white/60 rounded-xl p-2.5 space-y-2">
                                        <!-- Keyword Research Preview -->
                                        <div v-if="msg.action.action === 'keyword_research'" class="space-y-1.5">
                                            <div v-for="kw in (msg.action.data.organic || []).slice(0, 3)" :key="kw.query" class="flex justify-between items-center text-[13px]">
                                                <span class="text-slate-700 font-medium font-mono text-[11px]">{{ kw.query }}</span>
                                                <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">POS {{ kw.position }}</span>
                                            </div>
                                            <a v-if="msg.action.query" :href="route('keywords.research', { q: msg.action.query })" class="block text-center text-[10px] font-bold text-blue-600 hover:text-blue-700 pt-1">
                                                View All Results →
                                            </a>
                                        </div>

                                        <!-- Forecast Preview -->
                                        <div v-if="msg.action.action === 'forecast'" class="flex items-center justify-around py-1">
                                            <div v-for="(val, metric) in msg.action.data" :key="metric" class="text-center">
                                                <div class="text-[9px] text-slate-400 uppercase font-bold">{{ metric }}</div>
                                                <div class="text-[13px] font-bold text-slate-800">{{ val.toFixed(0) }}</div>
                                            </div>
                                        </div>

                                        <!-- Schema Validation Preview -->
                                        <div v-if="msg.action.action === 'schema_validation'" class="space-y-1">
                                            <div v-for="res in msg.action.data" :key="res.name" class="flex items-center justify-between text-[11px]">
                                                <span class="text-slate-600 truncate mr-2">{{ res.name }}</span>
                                                <span :class="res.validation?.valid ? 'text-green-600' : 'text-red-500'" class="font-bold uppercase text-[9px]">
                                                    {{ res.validation?.valid ? 'Valid' : 'Errors' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Special Message Types: Analysis Result -->
                            <div v-if="msg.type === 'analysis'"
                                class="bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 delay-200">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="text-sm font-bold text-slate-900">SEO Health Score</div>
                                    <div
                                        class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                                        {{ msg.data.health }}</div>
                                </div>
                                <div class="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                                        :style="{ width: msg.data.score + '%' }"></div>
                                </div>
                                <div class="space-y-2">
                                    <div v-for="issue in msg.data.issues" :key="issue"
                                        class="flex items-center text-xs text-slate-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                            class="w-4 h-4 text-amber-500 mr-2">
                                            <path fill-rule="evenodd"
                                                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        {{ issue }}
                                    </div>
                                </div>
                                <button
                                    class="w-full mt-4 py-2 border border-blue-600 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors">Generate
                                    Fix Plan</button>
                            </div>

                            <!-- Special Message Types: Suggestions -->
                            <div v-if="msg.type === 'suggestions'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                <button v-for="item in msg.items" :key="item.id" @click="handleAction(item.id)"
                                    class="flex items-center p-3 text-left bg-white/80 hover:bg-blue-600 hover:text-white border border-slate-200 rounded-2xl group transition-all duration-300 active:scale-95 shadow-sm">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-white/20 flex items-center justify-center mr-3 transition-colors">
                                        <svg v-if="item.id === 'audit'" xmlns="http://www.w3.org/2000/svg" fill="none"
                                            viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                                            class="w-4 h-4 text-blue-600 group-hover:text-white">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                        </svg>
                                        <svg v-if="item.id === 'keywords'" xmlns="http://www.w3.org/2000/svg"
                                            fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                                            class="w-4 h-4 text-blue-600 group-hover:text-white">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                        </svg>
                                        <svg v-if="item.id === 'schema'" xmlns="http://www.w3.org/2000/svg" fill="none"
                                            viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                                            class="w-4 h-4 text-blue-600 group-hover:text-white">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                                        </svg>
                                        <svg v-if="item.id === 'content'" xmlns="http://www.w3.org/2000/svg" fill="none"
                                            viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                                            class="w-4 h-4 text-blue-600 group-hover:text-white">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                        <svg v-if="item.id==='google_analytics'"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-600">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                        </svg>
                                         <svg v-if="item.id==='pixel'"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-600">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                        </svg>

                                    </div>
                                    <span class="text-sm font-semibold">{{ item.label }}</span>
                                </button>
                            </div>

                            <!-- ═══ Crawl UI Panel ═══════════════════════════════════════════ -->
                            <div v-if="msg.type === 'crawl_ui'" class="mt-4 w-full">

                                <!-- STEP 1: Container Selector -->
                                <div v-if="crawlStep === 'select'" class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                            </div>
                                            <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Crawl Containers</span>
                                        </div>
                                        <span class="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{{ crawlContainers.length }} container{{ crawlContainers.length !== 1 ? 's' : '' }}</span>
                                    </div>

                                    <!-- Empty state -->
                                    <div v-if="crawlContainers.length === 0" class="px-5 py-8 text-center">
                                        <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                            <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                        </div>
                                        <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">No containers yet</p>
                                        <p class="text-[10px] text-slate-400">Create your first crawl container to start scanning your site.</p>
                                    </div>

                                    <!-- Container list -->
                                    <div v-else class="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                                        <div v-for="c in crawlContainers" :key="c.id" class="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors">
                                            <div class="flex-1 min-w-0">
                                                <p class="text-[12px] font-bold text-slate-800 truncate">{{ c.name }}</p>
                                                <p class="text-[9px] text-slate-400 truncate">{{ c.site_url }}</p>
                                                <div class="flex items-center gap-2 mt-1">
                                                    <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" :class="{
                                                        'bg-emerald-50 text-emerald-700': c.last_crawl_status === 'completed',
                                                        'bg-blue-50 text-blue-700': c.last_crawl_status === 'dispatched' || c.last_crawl_status === 'crawling',
                                                        'bg-slate-100 text-slate-500': !c.last_crawl_status,
                                                        'bg-red-50 text-red-600': c.last_crawl_status === 'failed',
                                                    }">{{ c.last_crawl_status || 'not crawled' }}</span>
                                                    <span class="text-[8px] text-slate-400 font-medium">{{ c.links_count }} links</span>
                                                </div>
                                            </div>
                                            <button @click="launchCrawlForContainer(c)" :disabled="crawlFormSubmitting" class="ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex-shrink-0">
                                                {{ crawlFormSubmitting && activeSitemapId === c.id ? 'Starting…' : 'Crawl' }}
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Create new -->
                                    <div class="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                                        <button @click="crawlStep = 'create'" class="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-blue-50 border border-dashed border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                            Create New Container
                                        </button>
                                    </div>
                                </div>

                                <!-- STEP 2: Create Container Form -->
                                <div v-if="crawlStep === 'create'" class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div class="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                                        <button @click="crawlStep = 'select'" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <div class="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                        </div>
                                        <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest">New Container</span>
                                    </div>
                                    <div class="px-5 py-4 space-y-3">
                                        <div class="space-y-1">
                                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Container Name</label>
                                            <input v-model="crawlForm.name" type="text" placeholder="e.g. Main Website" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none">
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Sitemap Name</label>
                                            <input v-model="crawlForm.sitemap_name" type="text" placeholder="e.g. main-sitemap" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none">
                                            <p class="text-[9px] text-slate-400">Becomes the filename: <code class="text-indigo-600">{{ crawlForm.sitemap_name ? crawlForm.sitemap_name.toLowerCase().replace(/\s+/g,'-') + '.xml' : 'sitemap.xml' }}</code></p>
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Site URL</label>
                                            <input v-model="crawlForm.site_url" type="url" placeholder="https://yoursite.com" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none">
                                        </div>
                                        <p v-if="crawlFormError" class="text-[10px] font-bold text-red-500 bg-red-50 rounded-xl px-3 py-2">{{ crawlFormError }}</p>
                                        <button @click="submitCreateContainer" :disabled="crawlFormSubmitting" class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-100 flex items-center justify-center gap-2">
                                            <div v-if="crawlFormSubmitting" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {{ crawlFormSubmitting ? 'Creating & Launching…' : 'Create & Start Crawl' }}
                                        </button>
                                    </div>
                                </div>

                                <!-- STEP 3: Live Progress -->
                                <div v-if="crawlStep === 'progress'" class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="relative flex h-2 w-2 flex-shrink-0">
                                                <span v-if="crawlProgress.status !== 'completed'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span class="relative inline-flex rounded-full h-2 w-2" :class="crawlProgress.status === 'completed' ? 'bg-emerald-500' : crawlProgress.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'"></span>
                                            </span>
                                            <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Crawl in Progress</span>
                                        </div>
                                        <span class="text-[10px] font-black" :class="crawlProgress.status === 'completed' ? 'text-emerald-600' : crawlProgress.status === 'failed' ? 'text-red-600' : 'text-blue-600'">
                                            {{ crawlProgress.status?.toUpperCase() }}
                                        </span>
                                    </div>
                                    <div class="px-5 py-4 space-y-4">
                                        <!-- Progress bar -->
                                        <div class="space-y-1.5">
                                            <div class="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Pages Crawled</span>
                                                <span>{{ crawlProgress.total_crawled }} / {{ crawlProgress.total_discovered || '?' }}</span>
                                            </div>
                                            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div class="h-full rounded-full transition-all duration-500" :class="crawlProgress.status === 'completed' ? 'bg-emerald-500' : crawlProgress.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'" :style="{ width: `${crawlProgress.pct || 0}%` }"></div>
                                            </div>
                                            <p class="text-[9px] text-slate-400 truncate">{{ crawlProgress.current_url || 'Initializing scanner…' }}</p>
                                        </div>

                                        <!-- Stats row -->
                                        <div class="grid grid-cols-3 gap-2">
                                            <div class="bg-slate-50 rounded-xl p-2.5 text-center">
                                                <div class="text-[14px] font-black text-slate-900">{{ crawlProgress.pct || 0 }}%</div>
                                                <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Progress</div>
                                            </div>
                                            <div class="bg-slate-50 rounded-xl p-2.5 text-center">
                                                <div class="text-[14px] font-black text-slate-900">{{ crawlProgress.total_crawled }}</div>
                                                <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Crawled</div>
                                            </div>
                                            <div class="bg-slate-50 rounded-xl p-2.5 text-center">
                                                <div class="text-[14px] font-black text-slate-900">{{ crawlProgress.links_count || 0 }}</div>
                                                <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Indexed</div>
                                            </div>
                                        </div>

                                        <!-- Log output -->
                                        <div v-if="crawlProgress.logs && crawlProgress.logs.length > 0" class="bg-slate-950 rounded-xl p-3 max-h-28 overflow-y-auto space-y-0.5">
                                            <p v-for="(log, i) in crawlProgress.logs" :key="i" class="text-[9px] font-mono text-slate-400 leading-snug">{{ log }}</p>
                                        </div>
                                        <div v-else class="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                                            <div v-if="crawlProgress.status !== 'completed'" class="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0"></div>
                                            <p class="text-[9px] font-medium text-slate-400 italic">Waiting for crawler logs…</p>
                                        </div>

                                        <!-- Completion CTA -->
                                        <div v-if="crawlProgress.status === 'completed' && crawlProgress.manage_url" class="flex gap-2">
                                            <a :href="crawlProgress.manage_url" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center shadow-md shadow-emerald-100">
                                                View in Sitemap Manager →
                                            </a>
                                            <button @click="crawlStep = 'select'" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                Done
                                            </button>
                                        </div>
                                        <div v-else-if="crawlProgress.status === 'failed'" class="flex gap-2">
                                            <button @click="crawlStep = 'select'" class="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- ═══ /Crawl UI Panel ═══════════════════════════════════════════ -->

                            <!-- ═══ SEO Report UI Panel ══════════════════════════════════════ -->
                            <div v-if="msg.type === 'report_ui'" class="mt-4 w-full">
                                
                                <!-- STEP 1: Property Selection -->
                                <div v-if="reportStep === 'select'" class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                    <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                            </div>
                                            <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Select Properties</span>
                                        </div>
                                    </div>
                                    <div class="px-5 py-4 space-y-4">
                                        <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                                            <div v-for="prop in reportProperties" :key="prop.id" 
                                                @click="reportSelectedProps.includes(prop.id) ? reportSelectedProps.splice(reportSelectedProps.indexOf(prop.id), 1) : reportSelectedProps.push(prop.id)"
                                                class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                                                :class="reportSelectedProps.includes(prop.id) ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-transparent hover:border-slate-200'">
                                                <div class="w-5 h-5 rounded-md flex items-center justify-center border transition-all"
                                                    :class="reportSelectedProps.includes(prop.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'">
                                                    <svg v-if="reportSelectedProps.includes(prop.id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <div class="text-[12px] font-bold text-slate-800 truncate">{{ prop.name }}</div>
                                                    <div class="text-[9px] text-slate-500 truncate">{{ prop.website_url }}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="space-y-2">
                                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Date Range</label>
                                            <div class="grid grid-cols-3 gap-2">
                                                <button v-for="range in ['7', '30', '90']" :key="range" @click="reportDateRange = range"
                                                    class="py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
                                                    :class="reportDateRange === range ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'">
                                                    Last {{ range }}d
                                                </button>
                                            </div>
                                        </div>

                                        <button @click="reportStep = 'sections'" :disabled="reportSelectedProps.length === 0" class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                                            Continue to Configuration
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- STEP 2: Section Configuration -->
                                <div v-if="reportStep === 'sections'" class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                                    <div class="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                                        <button @click="reportStep = 'select'" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <div class="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                        </div>
                                        <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Report Sections</span>
                                    </div>
                                    <div class="px-5 py-4 space-y-4">
                                        <div class="grid grid-cols-1 gap-2">
                                            <div v-for="section in ['overview', 'traffic', 'acquisition', 'seo_intelligence', 'insights', 'forecasts']" :key="section"
                                                @click="toggleReportSection(section)"
                                                class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all"
                                                :class="reportSections.includes(section) ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-transparent'">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-4 h-4 rounded-full flex items-center justify-center border transition-all"
                                                        :class="reportSections.includes(section) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'">
                                                        <svg v-if="reportSections.includes(section)" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                                    </div>
                                                    <span class="text-[11px] font-bold text-slate-700 capitalize">{{ section.replace('_', ' ') }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p v-if="reportError" class="text-[10px] font-bold text-red-500 bg-red-50 rounded-xl px-3 py-2">{{ reportError }}</p>

                                        <button @click="submitGenerateReport" :disabled="reportGenerating" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center justify-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                            Compile Professional Report
                                        </button>
                                    </div>
                                </div>

                                <!-- STEP 3: Generating -->
                                <div v-if="reportStep === 'generating'" class="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 text-center animate-in zoom-in-95 duration-500">
                                    <div class="relative w-20 h-20 mx-auto mb-6">
                                        <div class="absolute inset-0 rounded-full border-4 border-blue-50"></div>
                                        <div class="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                        </div>
                                    </div>
                                    <h3 class="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-2">Compiling Report</h3>
                                    <p class="text-[11px] text-slate-500 leading-relaxed">Pique is aggregating analytics data, generating AI insights, and formatting your professional PDF report...</p>
                                </div>

                                <!-- STEP 4: Ready -->
                                <div v-if="reportStep === 'ready' && reportResult" class="bg-white border border-emerald-100 rounded-2xl shadow-xl shadow-emerald-500/10 overflow-hidden animate-in zoom-in-95 duration-500">
                                    <div class="bg-emerald-600 px-5 py-6 text-center">
                                        <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 scale-110">
                                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                        <h3 class="text-[16px] font-black text-white uppercase tracking-widest">Report Ready</h3>
                                    </div>
                                    <div class="px-5 py-5 space-y-4">
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="bg-slate-50 rounded-xl p-3">
                                                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Properties</div>
                                                <div class="text-[11px] font-extrabold text-slate-700 truncate">{{ reportResult.properties }}</div>
                                            </div>
                                            <div class="bg-slate-50 rounded-xl p-3">
                                                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Range</div>
                                                <div class="text-[11px] font-extrabold text-slate-700">{{ reportResult.date_range }}</div>
                                            </div>
                                        </div>
                                        
                                        <a :href="reportResult.url" target="_blank" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-emerald-200">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                            Download PDF Report
                                        </a>
                                        
                                        <button @click="reportStep = 'select'" class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            Generate Another
                                        </button>
                                    </div>
                                </div>

                            </div>
                            <!-- ═══ /SEO Report UI Panel ══════════════════════════════════════ -->

                            <div class="text-[10px] text-slate-400 mt-1"
                                :class="msg.role === 'user' ? 'text-right' : ''">
                                {{ msg.timestamp }}
                            </div>
                        </div>

                        <!-- User Avatar -->
                        <div v-if="msg.role === 'user'"
                            class="w-10 h-10 rounded-2xl bg-slate-200 border-2 border-white flex-shrink-0 flex items-center justify-center text-slate-600 shadow-sm ml-4 mt-1 overflow-hidden">
                            <img v-if="$page.props.auth.user.profile_photo_url"
                                :src="$page.props.auth.user.profile_photo_url" alt=""
                                class="w-full h-full object-cover">
                            <div v-else class="text-xs font-bold">{{ $page.props.auth.user.name.charAt(0) }}</div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div v-if="isTyping" class="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div
                            class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg mr-4 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" class="w-6 h-6 animate-pulse">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                            </svg>
                        </div>
                        <div
                            class="px-5 py-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                            <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                            <div class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-6 bg-white/40 backdrop-blur-md border-t border-white/40">
                    <div
                        class="max-w-4xl mx-auto relative flex items-end bg-white rounded-3xl  border border-slate-200 p-2 pl-6 focus-within:ring-1 focus-within:ring-blue-950/20 transition-all duration-300">
                        <textarea v-model="userInput" @keydown.enter.prevent="sendMessage" rows="1"
                            placeholder="Message Pique..."
                            class="flex-1 bg-transparent border-none focus:ring-0 py-4 px-2 text-[15px] resize-none overflow-hidden max-h-40 placeholder:text-slate-400"
                            @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"></textarea>

                        <div class="flex items-center p-2">
                            <button class="p-2.5 text-slate-400 hover:text-blue-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                    stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                </svg>
                            </button>
                            <button @click="sendMessage" :disabled="!userInput.trim()"
                                class="p-3 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl transition-all  active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="text-center mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        Pique may occasionally provide AI-generated SEO insights. Verify important data.
                    </div>
                </div>
            </main>
        </div>

        <!-- Confirmation Modal -->
        <ConfirmationModal
            :show="showDeleteModal"
            title="Delete Conversation?"
            message="Are you sure you want to permanently delete this conversation? This action cannot be undone."
            confirmText="Delete"
            @close="showDeleteModal = false"
            @confirm="confirmDelete"
        />
    </AppLayout>
</template>
<style>
/* Global Markdown Override for Pique */
.markdown-content h1, .markdown-content h2, .markdown-content h3 {
    font-weight: 800;
    color: #0f172a;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.2;
}
.markdown-content h1 { font-size: 1.3rem; }
.markdown-content h2 { font-size: 1.1rem; }
.markdown-content h3 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
.markdown-content p { margin-bottom: 1rem; }
.markdown-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.markdown-content li { margin-bottom: 0.5rem; }
.markdown-content strong { font-weight: 700; color: #1e293b; }
.markdown-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #475569; font-style: italic; }

/* Table horizontal scroll fix */
.markdown-content table {
    display: block;
    width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin-bottom: 1rem;
}
.markdown-content th, .markdown-content td {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    text-align: left;
}
.markdown-content th {
    background-color: #f8fafc;
    font-weight: 700;
}

/* Code highlights */
.token.string { color: #ce9178; }
.token.number { color: #b5cea8; }
.token.keyword { color: #569cd6; }
.token.function { color: #dcdcaa; }
.token.comment { color: #6a9955; }
.token.property { color: #9cdcfe; }
.token.punctuation { color: #d4d4d4; }
.token.operator { color: #d4d4d4; }
.token.class-name { color: #4ec9b0; }
</style>
<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.animate-in {
    animation: slideIn 0.3s ease-out fill-mode-forwards;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Custom transitions for high-fidelity feel */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>