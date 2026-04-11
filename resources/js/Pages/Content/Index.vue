<template>
  <AppLayout title="Content Hub">
    <div class="max-w-[1440px] mx-auto pb-24">

      <!-- ══════════════════════════════════════════
           HERO HEADER
      ══════════════════════════════════════════ -->
      <div class="relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl">
        <div class="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-16 left-10 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl"></div>

        <div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Metapilot Platform</p>
            <h1 class="mb-3 text-4xl font-black tracking-tight text-white">Content Hub</h1>
            <p class="max-w-md text-sm font-medium leading-relaxed text-slate-400">Create, optimize, and publish SEO-ready content — powered by AI at every step.</p>

            <div class="mt-6 flex items-center gap-6">
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ posts.length }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Posts</p>
              </div>
              <div class="h-8 w-px bg-white/10"></div>
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ posts.filter(p => p.status === 'published').length }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Published</p>
              </div>
              <div class="h-8 w-px bg-white/10"></div>
              <div class="text-center">
                <p class="text-2xl font-black text-white">{{ posts.reduce((a, p) => a + (p.word_count || 0), 0).toLocaleString() }}</p>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Words</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-end gap-4">
            <!-- Glassy tab bar -->
            <div class="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
              <button
                @click="switchTab('write')"
                class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"
                :class="activeTab === 'write' ? 'bg-white text-indigo-700 shadow-lg' : 'text-slate-400 hover:text-white'"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Write
              </button>
              <button
                @click="switchTab('humanizer')"
                class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"
                :class="activeTab === 'humanizer' ? 'bg-white text-indigo-700 shadow-lg' : 'text-slate-400 hover:text-white'"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Humanizer
              </button>
              <button
                @click="switchTab('audit')"
                class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"
                :class="activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-lg' : 'text-slate-400 hover:text-white'"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                SEO Audit
              </button>
            </div>

            <button
              v-if="activeTab === 'write'"
              @click="createNewPost"
              class="group flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl"
            >
              <svg class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              New Post
            </button>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 1 — WRITE (posts list)
      ══════════════════════════════════════════ -->
      <div v-if="activeTab === 'write' && !editingPost">

        <!-- Empty State -->
        <div v-if="posts.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
          <div class="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-indigo-50 shadow-inner">
            <svg class="h-14 w-14 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h-3a1 1 0 01-1-1V4"/>
            </svg>
          </div>
          <h3 class="mb-2 text-2xl font-black text-slate-900">Your content canvas is empty</h3>
          <p class="mb-8 max-w-sm text-sm font-medium text-slate-500">Start writing SEO-optimized content and watch your rankings climb. Powered by AI from outline to publish.</p>
          <button @click="createNewPost" class="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-2xl">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Write your first post
          </button>
        </div>

        <!-- Posts List -->
        <div v-else class="space-y-3">
          <div
            v-for="post in posts"
            :key="post.id"
            class="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
          >
            <!-- Left accent bar -->
            <div
              class="absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-all duration-300"
              :class="{
                'bg-emerald-400': post.status === 'published',
                'bg-amber-400': post.status === 'review',
                'bg-slate-300': post.status === 'draft',
                'bg-slate-200': post.status === 'archived',
              }"
            ></div>

            <!-- Icon -->
            <div class="mr-5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-indigo-50">
              <svg class="h-6 w-6 text-slate-400 transition-colors group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>

            <!-- Meta -->
            <div class="flex flex-1 flex-col gap-1 min-w-0">
              <div class="flex items-center gap-3">
                <h3 class="truncate text-base font-black text-slate-900">{{ post.title }}</h3>
                <span
                  class="flex-shrink-0 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
                  :class="{
                    'bg-emerald-100 text-emerald-700': post.status === 'published',
                    'bg-amber-100 text-amber-700': post.status === 'review',
                    'bg-slate-100 text-slate-500': post.status === 'draft',
                    'bg-red-50 text-red-400': post.status === 'archived',
                  }"
                >{{ post.status }}</span>
              </div>
              <div class="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                <span class="flex items-center gap-1">
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  {{ post.category?.name || 'Uncategorized' }}
                </span>
                <span class="text-slate-200">•</span>
                <span>{{ (post.word_count || 0).toLocaleString() }} words</span>
                <span class="text-slate-200">•</span>
                <span>{{ formatDate(post.updated_at) }}</span>
              </div>
            </div>

            <!-- Scores + Actions -->
            <div class="ml-6 flex items-center gap-6">
              <!-- SEO Ring -->
              <div class="flex flex-col items-center gap-1">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">SEO</p>
                <div class="relative h-12 w-12">
                  <svg class="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" class="stroke-slate-100" stroke-width="3"></circle>
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      :class="getScoreColorClass(post.seo_score)"
                      stroke-width="3"
                      stroke-dasharray="94.25"
                      :stroke-dashoffset="94.25 - (94.25 * (post.seo_score || 0) / 100)"
                      stroke-linecap="round"
                      class="transition-all duration-1000"
                      style="stroke:currentColor"
                    ></circle>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-800">{{ post.seo_score || 0 }}</div>
                </div>
              </div>

              <!-- AI Score -->
              <div class="flex flex-col items-center gap-1">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">AI</p>
                <span class="rounded-xl px-3 py-1.5 text-[11px] font-black" :class="getAiScoreClass(post.ai_content_score)">{{ post.ai_content_score || 0 }}%</span>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5">
                <button @click="editPost(post)" class="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button @click="deletePost(post)" class="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 2 — AI HUMANIZER
      ══════════════════════════════════════════ -->
      <div v-if="activeTab === 'humanizer'">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <!-- Input Panel -->
          <div class="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
              </div>
              <div>
                <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">Input</h3>
                <p class="text-[10px] font-bold text-slate-400">Paste AI-generated text (min 100 words)</p>
              </div>
            </div>

            <textarea
              v-model="humanizer.input"
              placeholder="Paste your AI-generated content here..."
              class="h-80 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50"
            ></textarea>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Tone:</p>
                <select v-model="humanizer.tone" class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50">
                  <option value="professional">Professional</option>
                  <option value="conversational">Conversational</option>
                  <option value="academic">Academic</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
              <button
                @click="runHumanizer"
                :disabled="humanizing || humanizer.input.length < 100"
                class="flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-black hover:shadow-xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40"
              >
                <svg v-if="humanizing" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ humanizing ? 'Humanizing...' : 'Humanize Content' }}
              </button>
            </div>
          </div>

          <!-- Output Panel -->
          <div class="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div v-if="!humanizer.output" class="flex h-full flex-col items-center justify-center gap-5 py-16 text-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <svg class="h-8 w-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <p class="text-base font-black text-slate-400">Results appear here</p>
                <p class="mt-1 text-xs font-bold text-slate-300">AI-rewritten content with before/after score</p>
              </div>
            </div>

            <div v-else class="flex h-full flex-col gap-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">Humanized Result</h3>
                    <p class="text-[10px] font-bold text-slate-400">AI rewrite complete</p>
                  </div>
                </div>
                <button @click="copyOutput" class="flex items-center gap-1.5 rounded-xl border border-slate-100 px-4 py-2 text-xs font-black text-indigo-600 transition-all hover:bg-indigo-50">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  Copy
                </button>
              </div>

              <!-- Score comparison -->
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <p class="mb-1 text-[9px] font-black uppercase tracking-widest text-rose-500">Before</p>
                  <p class="text-3xl font-black text-rose-600">{{ humanizer.result.initial_ai_score }}<span class="text-base">%</span></p>
                  <p class="mt-0.5 text-[10px] font-bold text-rose-400">AI Detected</p>
                </div>
                <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p class="mb-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">After</p>
                  <p class="text-3xl font-black text-emerald-600">{{ humanizer.result.final_ai_score }}<span class="text-base">%</span></p>
                  <p class="mt-0.5 text-[10px] font-bold text-emerald-500">AI Detected</p>
                </div>
              </div>

              <!-- Improvement bar -->
              <div>
                <div class="mb-1.5 flex justify-between">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Improvement</p>
                  <p class="text-[10px] font-black text-emerald-600">-{{ humanizer.result.initial_ai_score - humanizer.result.final_ai_score }}% AI</p>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-emerald-400 transition-all duration-1000"
                    :style="`width: ${Math.min(100, ((humanizer.result.initial_ai_score - humanizer.result.final_ai_score) / Math.max(humanizer.result.initial_ai_score, 1)) * 100)}%`"
                  ></div>
                </div>
              </div>

              <!-- Text output -->
              <div class="max-h-56 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium leading-relaxed text-slate-700 custom-scrollbar">
                {{ humanizer.output }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 3 — SEO AUDIT
      ══════════════════════════════════════════ -->
      <div v-if="activeTab === 'audit'">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <!-- Audit Form -->
          <div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div class="mb-8">
              <h2 class="mb-1 text-xl font-black text-slate-900">Deep Content Audit</h2>
              <p class="text-sm font-medium text-slate-500">Analyze any URL or content against your target keywords.</p>
            </div>

            <div class="space-y-5">
              <div>
                <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Target URL</label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <svg class="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  </div>
                  <input v-model="audit.url" type="url" placeholder="https://example.com/blog-post"
                    class="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="h-px flex-1 bg-slate-100"></div>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Or paste content</span>
                <div class="h-px flex-1 bg-slate-100"></div>
              </div>

              <textarea v-model="audit.content" placeholder="Paste your content here for analysis..."
                class="h-36 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
              </textarea>

              <div>
                <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Target Keywords <span class="normal-case font-bold text-indigo-400">(one per line)</span></label>
                <textarea v-model="audit.keywordsRaw" placeholder="primary keyword&#10;secondary keyword&#10;long-tail keyword..."
                  class="h-28 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                </textarea>
              </div>

              <button
                @click="runAudit"
                :disabled="auditing || !audit.keywordsRaw"
                class="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.01] hover:bg-indigo-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-50"
              >
                <svg v-if="auditing" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                {{ auditing ? 'Analyzing Content...' : 'Run SEO Audit' }}
              </button>
            </div>
          </div>

          <!-- Inline Results (no modal) -->
          <div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div v-if="!auditResult" class="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <svg class="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <p class="text-base font-black text-slate-400">Audit results appear here</p>
              <p class="max-w-xs text-xs font-bold text-slate-300">Run an audit on the left to see keyword gaps, opportunities, and priority fixes.</p>
            </div>

            <div v-else class="custom-scrollbar max-h-[680px] overflow-y-auto pr-1">
              <!-- Score header -->
              <div class="mb-6 flex items-center gap-6">
                <div class="relative h-20 w-20 flex-shrink-0">
                  <svg class="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" class="stroke-slate-100" stroke-width="3"></circle>
                    <circle cx="18" cy="18" r="15" fill="none" class="text-indigo-500" stroke-width="3" stroke-dasharray="94.25" :stroke-dashoffset="94.25 - (94.25 * (auditResult.seo_score || 0) / 100)" stroke-linecap="round" style="stroke:currentColor; transition: stroke-dashoffset 1s ease;"></circle>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-lg font-black text-slate-900">{{ auditResult.seo_score }}</span>
                  </div>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">Audit Report</h3>
                  <p class="mt-1 text-sm font-medium leading-snug text-slate-500">{{ auditResult.summary }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <!-- Keyword gaps -->
                <div class="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">Keyword Gaps</h4>
                  <ul class="space-y-2">
                    <li v-for="gap in auditResult.keyword_gaps" :key="gap" class="flex items-start gap-2 text-sm font-bold text-indigo-900">
                      <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"></span>
                      {{ gap }}
                    </li>
                  </ul>
                </div>

                <!-- Fix priorities -->
                <div class="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600">High Priority Fixes</h4>
                  <ul class="space-y-2">
                    <li v-for="fix in auditResult.fix_priorities" :key="fix" class="flex items-start gap-2 text-sm font-bold text-amber-900">
                      <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"/></svg>
                      {{ fix }}
                    </li>
                  </ul>
                </div>

                <!-- Optimization tips -->
                <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <h4 class="mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-700">Optimization Tips</h4>
                  <ul class="space-y-2">
                    <li v-for="tip in auditResult.optimization_tips" :key="tip" class="flex items-start gap-2 text-sm font-bold text-emerald-900">
                      <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      {{ tip }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           EDITOR SLIDE-OVER
      ══════════════════════════════════════════ -->
      <Transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div v-if="editingPost" class="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div class="flex h-full w-full max-w-[96%] flex-col bg-slate-50 shadow-2xl">

            <!-- Topbar -->
            <div class="flex h-18 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
              <div class="flex items-center gap-5">
                <button @click="closeEditor" class="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <div class="h-6 w-px bg-slate-100"></div>
                <input 
                  v-model="form.title" 
                  type="text" 
                  placeholder="Post Title..."
                  class="w-96 border-b-2 bg-transparent p-0 text-lg font-black text-slate-900 transition-all outline-none ring-0 placeholder:text-slate-300 focus:ring-0"
                  :class="validationErrors.title ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-indigo-400'"
                  @input="validationErrors.title = false"
                >
              </div>

              <div class="flex items-center gap-6">
                <!-- Focus Mode Toggle -->
                <button 
                  @click="focusMode = !focusMode"
                  class="flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
                  :class="focusMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {{ focusMode ? 'Focusing' : 'Focus Mode' }}
                </button>
                <span class="text-xs font-bold text-slate-400">{{ metrics.word_count.toLocaleString() }} words • {{ metrics.reading_time_minutes }}m read</span>
                <div class="h-5 w-px bg-slate-100"></div>
                <button @click="saveDraft" :disabled="saving" class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">
                  {{ saving ? 'Saving...' : 'Save Draft' }}
                </button>
                <button @click="publishPost" class="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-lg">
                  Publish
                </button>
              </div>
            </div>

            <div class="flex flex-1 overflow-hidden">

              <!-- Main Editor Body -->
              <div class="flex-1 overflow-y-auto bg-white p-10 custom-scrollbar">
                <div class="mx-auto max-w-3xl">

                  <!-- Keyword + Category -->
                  <div class="mb-8 grid grid-cols-2 gap-6">
                    <div>
                      <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Focus Keyword</label>
                      <input 
                        v-model="form.focus_keyword" 
                        @blur="runAnalysis" 
                        @input="validationErrors.focus_keyword = false"
                        type="text" 
                        placeholder="e.g. SEO Content Guide"
                        class="w-full rounded-2xl border bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4"
                        :class="validationErrors.focus_keyword ? 'border-rose-200 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-100 focus:border-indigo-200 focus:ring-indigo-50'"
                      >
                    </div>
                    <div>
                      <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                      <select v-model="form.blog_category_id"
                        class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                        <option :value="null">Uncategorized</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Search Appearance Card -->
                  <div class="mb-8 rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
                    <div class="mb-5 flex items-center gap-3">
                      <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      </div>
                      <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-700">Search Appearance</h4>
                    </div>
                    <div class="grid gap-4">
                      <div>
                        <div class="mb-1.5 flex justify-between">
                          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">SEO Title</label>
                          <span class="text-[10px] font-bold" :class="(form.meta_title || '').length > 60 ? 'text-rose-500' : 'text-slate-400'">{{ (form.meta_title || '').length }} / 60</span>
                        </div>
                        <input v-model="form.meta_title" type="text" :placeholder="form.title"
                          class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                      </div>
                      <div>
                        <div class="mb-1.5 flex justify-between">
                          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Description</label>
                          <span class="text-[10px] font-bold" :class="(form.meta_description || '').length > 160 ? 'text-rose-500' : 'text-slate-400'">{{ (form.meta_description || '').length }} / 160</span>
                        </div>
                        <textarea v-model="form.meta_description" rows="2" placeholder="Briefly summarize your post..."
                          class="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                        </textarea>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Canonical URL</label>
                          <input v-model="form.canonical_url" type="url" placeholder="https://..."
                            class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                        </div>
                        <div>
                          <label class="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Image URL</label>
                          <input v-model="form.featured_image_url" type="url" placeholder="https://cdn.example.com/..."
                            class="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Rich Text Toolbar -->
                  <div class="sticky top-0 z-10 mb-5 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-md">
                    <button @click="format('bold')" class="toolbar-btn font-black text-xs" title="Bold">B</button>
                    <button @click="format('italic')" class="toolbar-btn italic font-serif text-xs" title="Italic">I</button>
                    <button @click="format('underline')" class="toolbar-btn underline font-serif text-xs" title="Underline">U</button>
                    <div class="mx-1 h-5 w-px bg-slate-200"></div>
                    <button @click="format('formatBlock', 'h2')" class="toolbar-btn text-[10px] font-black" title="H2">H2</button>
                    <button @click="format('formatBlock', 'h3')" class="toolbar-btn text-[10px] font-black" title="H3">H3</button>
                    <div class="mx-1 h-5 w-px bg-slate-200"></div>
                    <button @click="format('insertUnorderedList')" class="toolbar-btn" title="Bullet List">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                    <button @click="format('insertOrderedList')" class="toolbar-btn" title="Numbered List">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7m2 0h2m-2 0v4m0 0H7m2 0h2m-2 0v4m0 0H7m2 0h2"/></svg>
                    </button>
                    <div class="mx-1 h-5 w-px bg-slate-200"></div>
                    <button @click="format('removeFormat')" class="toolbar-btn text-[10px] font-bold text-slate-400" title="Clear Format">Clear</button>
                  </div>

                  <!-- Main Editor Container (Centered in Focus Mode) -->
                  <div
                    ref="editor"
                    contenteditable="true"
                    class="prose prose-slate prose-lg max-w-none min-h-[600px] transition-all focus:outline-none editor-placeholder"
                    :class="focusMode ? 'px-12 py-8' : ''"
                    @input="handleEditorInput"
                    data-placeholder="Start your story here..."
                  ></div>
                </div>
              </div>

              <!-- Right Sidebar (Conditionally Hidden) -->
              <div 
                v-if="!focusMode"
                class="w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 custom-scrollbar transition-all"
              >

                <!-- SEO Score -->
                <div class="border-b border-slate-100 bg-white p-6 text-center">
                  <div class="mb-5 flex items-center justify-between">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Master SEO Score</p>
                    <span 
                      class="rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all"
                      :class="[seoTier.color, seoTier.bg, seoTier.border, 'border']"
                    >{{ seoTier.label }}</span>
                  </div>

                  <div class="relative mx-auto mb-8 inline-flex">
                    <!-- Glow effect -->
                    <div 
                      class="absolute inset-0 rounded-full blur-2xl transition-all duration-1000 opacity-20"
                      :class="seoTier.bg"
                    ></div>

                    <svg class="relative h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                      <circle class="text-slate-100" stroke-width="3" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18"/>
                      <circle
                        :class="getScoreColorClass(form.seo_score)"
                        stroke-width="3"
                        stroke-dasharray="94.25"
                        :stroke-dashoffset="94.25 - (94.25 * (form.seo_score || 0) / 100)"
                        stroke-linecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="15" cx="18" cy="18"
                        class="transition-all duration-1000"
                      />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900">{{ form.seo_score || 0 }}</span>
                  </div>

                  <!-- Score Breakdown -->
                  <div class="mb-6 grid grid-cols-3 gap-2">
                    <div v-for="item in scoreBreakdown" :key="item.label" class="flex flex-col items-center">
                      <div class="mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div 
                          class="h-full bg-indigo-500 transition-all duration-1000"
                          :style="{ width: item.percent + '%' }"
                        ></div>
                      </div>
                      <span class="text-[8px] font-black uppercase tracking-tighter text-slate-400">{{ item.label }}</span>
                    </div>
                  </div>

                  <button @click="runAnalysis" :disabled="analyzing" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-wide text-white transition-all hover:bg-black disabled:opacity-50">
                    <svg v-if="analyzing" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    {{ analyzing ? 'Analyzing...' : 'Refresh Audit' }}
                  </button>
                </div>

                <!-- Content Stats -->
                <div class="border-b border-slate-100 bg-white p-6">
                  <p class="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Content Stats</p>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-black uppercase tracking-wide text-slate-400">Word Count</span>
                      <span class="text-sm font-black text-slate-900">{{ metrics.word_count.toLocaleString() }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-black uppercase tracking-wide text-slate-400">Read Time</span>
                      <span class="text-sm font-black text-slate-900">{{ metrics.reading_time_minutes }}m</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-black uppercase tracking-wide text-slate-400">KW Density</span>
                      <span class="text-sm font-black" :class="density.primary > 1 && density.primary < 3 ? 'text-emerald-500' : 'text-amber-500'">{{ density.primary.toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>

                <!-- SERP Preview -->
                <div class="border-b border-slate-100 bg-white p-6">
                  <p class="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">SERP Preview</p>
                  <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
                    <p class="mb-1 truncate text-[9px] text-slate-400">https://{{ organization?.slug || 'site' }}.ai/blog/...</p>
                    <h5 class="mb-1 line-clamp-2 cursor-pointer text-xs font-bold text-blue-600 hover:underline">{{ form.meta_title || form.title || 'Untitled Post' }}</h5>
                    <p class="line-clamp-3 text-[10px] leading-relaxed text-slate-500">{{ form.meta_description || 'Start writing to preview your meta description here...' }}</p>
                  </div>
                </div>

                <!-- AI Probability -->
                <div class="border-b border-slate-100 bg-white p-6">
                  <div class="mb-4 flex items-center justify-between">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Probability</p>
                    <span :class="getAiScoreClass(form.ai_content_score)" class="rounded-lg px-2.5 py-1 text-[10px] font-black">{{ form.ai_content_score || 0 }}%</span>
                  </div>
                  <div class="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div :class="getAiBgClass(form.ai_content_score)" class="h-full rounded-full transition-all duration-1000" :style="{ width: (form.ai_content_score || 0) + '%' }"></div>
                  </div>
                  <p v-if="form.ai_detection_notes" class="text-[10px] font-bold italic leading-relaxed text-slate-400">{{ form.ai_detection_notes }}</p>
                </div>

                <!-- SEO Checklist -->
                <div class="border-b border-slate-100 bg-white p-6">
                  <p class="mb-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actionable Audit</p>
                  <div class="space-y-6">
                    <div v-for="(checks, category) in groupedChecks" :key="category">
                      <h5 class="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{{ category }}</h5>
                      <div class="space-y-3">
                        <div v-for="check in checks" :key="check.id" class="group flex items-start gap-2.5">
                          <div class="mt-0.5 flex-shrink-0">
                            <svg v-if="check.status === 'success'" class="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else-if="check.status === 'error'" class="h-3.5 w-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12"/></svg>
                            <svg v-else class="h-3.5 w-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M12 9v2m0 4h.01"/></svg>
                          </div>
                          <div>
                            <p class="text-[10px] font-black leading-tight" :class="check.status === 'success' ? 'text-slate-700' : 'text-slate-500'">{{ check.message }}</p>
                            <p v-if="check.action && check.status !== 'success'" class="mt-0.5 text-[9px] font-bold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">{{ check.action }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Writing Assistant -->
                <div class="bg-white p-6">
                  <div class="mb-5 flex items-center justify-between">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Writing Assistant</p>
                    <span class="rounded bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-tighter text-indigo-600">AI LIVE</span>
                  </div>
                  <div class="space-y-4">
                    <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p class="mb-2 text-[10px] font-black italic uppercase tracking-widest text-slate-400">Semantic Keywords</p>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          v-for="kw in semanticKeywords" :key="kw"
                          @click="addKeyword(kw)"
                          class="cursor-pointer rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600"
                        >+ {{ kw }}</span>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button @click="generateIntro" :disabled="isGeneratingIntro" class="flex-1 rounded-2xl border-2 border-slate-900 bg-white py-3 text-[10px] font-black uppercase text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-50">
                        {{ isGeneratingIntro ? 'Drafting...' : 'Gen Intro' }}
                      </button>
                      <button @click="generateOutline" :disabled="isGeneratingOutline" class="flex-1 rounded-2xl border-2 border-indigo-600 bg-white py-3 text-[10px] font-black uppercase text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white disabled:opacity-50">
                        {{ isGeneratingOutline ? 'Building...' : 'Outline' }}
                      </button>
                    </div>
                    
                    <!-- Diagnostic / Alerts -->
                    <div 
                      v-if="validationErrors.title || validationErrors.focus_keyword" 
                      class="rounded-xl border border-rose-100 bg-rose-50 p-3"
                    >
                      <div class="flex gap-2">
                        <svg class="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z"/></svg>
                        <p class="text-[9px] font-black uppercase tracking-widest text-rose-600">Action Required</p>
                      </div>
                      <p class="mt-1 text-[10px] font-bold leading-relaxed text-rose-900">
                        {{ validationErrors.title ? '• Post Title is missing' : '' }}
                        {{ validationErrors.focus_keyword ? '• Focus Keyword is missing (required for Intro)' : '' }}
                      </p>
                    </div>

                    <div v-if="hasSelection" class="border-t border-slate-100 pt-4">
                      <p class="mb-3 text-[9px] font-black uppercase tracking-widest text-indigo-500">Selection Tools</p>
                      <button @click="refineSelection" :disabled="isRefining" class="w-full rounded-2xl bg-indigo-600 py-3 text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50">
                        {{ isRefining ? 'Refining...' : 'Refine Tone' }}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div>

    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Post"
      :message="`Are you sure you want to delete '${postToDelete?.title}'? This action cannot be undone.`"
      confirm-text="Delete Post"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { Head, Link, router } from '@inertiajs/vue3'
import axios from 'axios'
import _ from 'lodash'
import AppLayout from '../../Layouts/AppLayout.vue'
import { useToastStore } from '../../stores/useToastStore'
import ConfirmationModal from '../../Components/ConfirmationModal.vue'

const props = defineProps({
  posts: Array,
  organization: Object,
  categories: Array
})

const toast = useToastStore()
const activeTab = ref('write')
const editingPost = ref(null)
const isLoading = ref(false)
const saving = ref(false)
const analyzing = ref(false)
const humanizing = ref(false)
const auditing = ref(false)
const showDeleteModal = ref(false)
const postToDelete = ref(null)
const focusMode = ref(false)
const validationErrors = reactive({
  title: false,
  focus_keyword: false
})

// Forms
const form = reactive({
  id: null,
  title: '',
  content: '',
  focus_keyword: '',
  blog_category_id: null,
  status: 'draft',
  seo_score: 0,
  ai_content_score: 0,
  secondary_keywords: [],
  long_tail_keywords: [],
  meta_title: '',
  meta_description: '',
  canonical_url: '',
  featured_image_url: '',
  ai_detection_notes: ''
})

const humanizer = reactive({
  input: '',
  output: '',
  tone: 'professional',
  result: null
})

const audit = reactive({
  url: '',
  content: '',
  keywordsRaw: '',
  result: null
})

const auditResult = ref(null)
const seoResults = ref({ score: 0, checks: [] })
const metrics = reactive({ word_count: 0, reading_time_minutes: 0 })
const density = reactive({ primary: 0 })
const editor = ref(null)

const groupedChecks = computed(() => {
  const groups = {}
  seoResults.value.checks.forEach(check => {
    const cat = check.category || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(check)
  })
  return groups
})

const seoTier = computed(() => {
  const score = form.seo_score || 0
  if (score >= 90) return { label: 'Perfect', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' }
  if (score >= 80) return { label: 'Optimized', color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100' }
  if (score >= 60) return { label: 'Good', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' }
  if (score >= 40) return { label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' }
  return { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' }
})

const scoreBreakdown = computed(() => {
  const checks = seoResults.value.checks || []
  const breakdown = {
    content: { count: 0, total: 0, label: 'Content' },
    keywords: { count: 0, total: 0, label: 'Keywords' },
    meta: { count: 0, total: 0, label: 'Structure' }
  }

  checks.forEach(c => {
    const cat = (c.category || '').toLowerCase()
    let key = 'content'
    if (cat.includes('keyword')) key = 'keywords'
    if (cat.includes('meta') || cat.includes('title')) key = 'meta'
    
    breakdown[key].total++
    if (c.status === 'success') breakdown[key].count++
  })

  return Object.values(breakdown).map(b => ({
    ...b,
    percent: b.total > 0 ? Math.round((b.count / b.total) * 100) : 0
  }))
})

const semanticKeywords = computed(() => {
  if (!form.focus_keyword) return ['SEO', 'Content', 'Optimization']
  return [
    form.focus_keyword + ' Strategy',
    'Best Practices for ' + form.focus_keyword,
    'How to ' + form.focus_keyword,
    'Advanced ' + form.focus_keyword
  ]
})

const isGeneratingIntro = ref(false)
const isGeneratingOutline = ref(false)
const isRefining = ref(false)
const hasSelection = ref(false)

const addKeyword = (kw) => {
   if (!form.content.includes(kw)) {
      const p = document.createElement('p')
      p.innerHTML = `<em>${kw}</em>`
      if (editor.value) {
         editor.value.appendChild(p)
         form.content = editor.value.innerHTML
      }
      toast.success(`Keyword added: ${kw}`)
      debouncedAnalysis()
   } else {
      toast.warning('Keyword already exists in content')
   }
}

const format = (command, value = null) => {
   document.execCommand(command, false, value)
   if (editor.value) form.content = editor.value.innerHTML
}

const handleAiError = (err) => {
   console.error('[AI Error]', err.response?.status, err.response?.data)

   if (err.response?.status === 402) {
      toast.error('Insufficient Credits — top up your balance to use AI features.')
      return
   }
   if (err.response?.status === 422) {
      const messages = Object.values(err.response?.data?.errors || {}).flat().join(' ')
      toast.error('Validation error: ' + (messages || 'Check your inputs.'))
      return
   }
   if (err.response?.status === 500) {
      toast.error('Server error — the AI service may be unavailable. Check your API key.')
      return
   }
   toast.error(err.response?.data?.error || err.response?.data?.message || 'AI request failed.')
}

const generateIntro = async () => {
   validationErrors.title = !form.title
   validationErrors.focus_keyword = !form.focus_keyword

   if (validationErrors.title || validationErrors.focus_keyword) {
      toast.error('Post Title and Focus Keyword are required for AI drafting.')
      return
   }

   isGeneratingIntro.value = true
   try {
      const resp = await axios.post(route('api.content.generate-intro'), {
         title: form.title,
         focus_keyword: form.focus_keyword
      })
      
      if (resp.data.intro) {
         form.content = `<p>${resp.data.intro}</p>` + form.content
         if (editor.value) editor.value.innerHTML = form.content
         toast.success('AI Introduction generated!')
         debouncedAnalysis()
      }
   } catch (e) {
      handleAiError(e)
   } finally {
      isGeneratingIntro.value = false
   }
}

const generateOutline = async () => {
   validationErrors.title = !form.title
   
   if (validationErrors.title) {
      toast.error('A Post Title is required to generate an outline.')
      return
   }

   isGeneratingOutline.value = true
   try {
      const resp = await axios.post(route('api.content.generate-outline'), {
         topic: form.title,
         keywords: form.focus_keyword ? [form.focus_keyword] : []
      })

      if (resp.data && resp.data.outline) {
         const outlineHtml = resp.data.outline
            .map(section => {
               const subsHtml = (section.subsections || [])
                  .map(sub => `<li>${sub}</li>`)
                  .join('')
               return `<h2>${section.heading}</h2>${subsHtml ? `<ul>${subsHtml}</ul>` : ''}`
            })
            .join('')
         form.content = outlineHtml + form.content
         if (editor.value) editor.value.innerHTML = form.content
         toast.success('Outline generated — start filling in each section!')
         updateLocalDensity()
         debouncedAnalysis()
      }
   } catch (e) {
      handleAiError(e)
   } finally {
      isGeneratingOutline.value = false
   }
}

const refineSelection = async () => {
   const selection = window.getSelection().toString()
   if (!selection) return

   isRefining.value = true
   try {
      const resp = await axios.post(route('api.content.refine-content'), {
         content: selection,
         instruction: 'Improve flow and make it more professional.'
      })

      if (resp.data.refined) {
         const range = window.getSelection().getRangeAt(0)
         range.deleteContents()
         range.insertNode(document.createTextNode(resp.data.refined))
         if (editor.value) form.content = editor.value.innerHTML
         toast.success('Content refined!')
         debouncedAnalysis()
      }
   } catch (e) {
      handleAiError(e)
   } finally {
      isRefining.value = false
   }
}

// Update hasSelection state — cleaned up on unmount to avoid memory leaks
const onSelectionChange = () => {
   hasSelection.value = !!window.getSelection().toString()
}
onMounted(() => document.addEventListener('selectionchange', onSelectionChange))
onUnmounted(() => document.removeEventListener('selectionchange', onSelectionChange))

watch(() => editingPost.value, async (newVal) => {
  if (newVal) {
    await nextTick()
    if (editor.value) {
      editor.value.innerHTML = form.content
    }
  }
})

// Helper Functions
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getScoreClass = (score) => {
  if (score >= 80) return 'text-emerald-500 border-emerald-500'
  if (score >= 50) return 'text-amber-500 border-amber-500'
  return 'text-rose-500 border-rose-500'
}

const getScoreColorClass = (score) => {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-rose-500'
}

const getAiScoreClass = (score) => {
  if (score >= 70) return 'bg-rose-100 text-rose-600'
  if (score >= 40) return 'bg-amber-100 text-amber-600'
  return 'bg-emerald-100 text-emerald-600'
}

const getAiBgClass = (score) => {
  if (score >= 70) return 'bg-rose-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}

// Tab switching with side-effects
const switchTab = (tab) => {
  activeTab.value = tab
  // Clear stale audit result when leaving the audit tab
  if (tab !== 'audit') auditResult.value = null
}

// Logic
const createNewPost = () => {
  Object.assign(form, {
    id: null,
    title: 'Untitled Post',
    content: '<p>Start writing...</p>',
    focus_keyword: '',
    blog_category_id: null,
    status: 'draft',
    seo_score: 0,
    ai_content_score: 0,
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    featured_image_url: ''
  })
  editingPost.value = true
}

const editPost = (post) => {
  Object.assign(form, {
    ...post,
    meta_title: post.meta_title || '',
    meta_description: post.meta_description || '',
    canonical_url: post.canonical_url || '',
    featured_image_url: post.featured_image_url || ''
  })
  editingPost.value = post
  runAnalysis()
}

const closeEditor = () => {
   editingPost.value = null
   router.reload()
}

const handleEditorInput = (e) => {
  form.content = e.target.innerHTML
  updateLocalDensity()
  debouncedAnalysis()
}

const runAnalysis = async () => {
  if (!editingPost.value) return
  
  if (!form.id) {
    // Silently skip for unsaved posts — no toast spam
    return
  }
  
  analyzing.value = true
  try {
    const res = await axios.post(route('api.content.posts.analyze', form.id))
    seoResults.value = res.data.seo
    form.seo_score = res.data.post.seo_score
    form.ai_content_score = res.data.post.ai_content_score
    form.ai_detection_notes = res.data.post.ai_detection_notes
    metrics.word_count = res.data.post.word_count
    metrics.reading_time_minutes = res.data.post.reading_time_minutes
    toast.success('Analysis complete')
  } catch (err) {
    handleAiError(err)
  } finally {
    analyzing.value = false
  }
}

const debouncedAnalysis = _.debounce(runAnalysis, 2000)

const saveDraft = async () => {
  saving.value = true
  try {
    const method = form.id ? 'put' : 'post'
    const url = form.id ? route('api.content.posts.update', form.id) : route('api.content.posts.store')
    
    const res = await axios[method](url, form)
    
    if (res.data.success) {
      form.id = res.data.post.id
      toast.success('Draft saved successfully')
    }
  } catch (err) {
    console.error(err)
    toast.error('Failed to save draft')
  } finally {
    saving.value = false
  }
}

const publishPost = async () => {
   form.status = 'published'
   await saveDraft()
   closeEditor()
}

const deletePost = (post) => {
   postToDelete.value = post
   showDeleteModal.value = true
}

const confirmDelete = async () => {
   if (!postToDelete.value) return
   
   try {
     await axios.delete(route('api.content.posts.destroy', postToDelete.value.id))
     toast.success('Post deleted successfully')
     showDeleteModal.value = false
     postToDelete.value = null
     router.reload()
   } catch (err) {
     console.error(err)
     toast.error('Failed to delete post')
   }
}

// Humanizer
const runHumanizer = async () => {
   humanizing.value = true
   try {
     const res = await axios.post(route('api.content.humanize'), {
        content: humanizer.input,
        tone: humanizer.tone
     })
     if (res.data.success === false) {
        toast.error(res.data.message || 'Humanization failed via AI.')
        return
     }
     humanizer.output = res.data.humanized_text
     humanizer.result = res.data
     toast.success('Content humanized successfully')
   } catch (err) {
      handleAiError(err)
   } finally {
      humanizing.value = false
   }
}

const copyOutput = () => {
   navigator.clipboard.writeText(humanizer.output)
   toast.success('Copied to clipboard')
}

// Audit
const runAudit = async () => {
   auditing.value = true
   try {
     const res = await axios.post(route('api.content.audit'), {
        url: audit.url,
        content: audit.content,
        target_keywords: audit.keywordsRaw.split('\n').filter(k => k.trim())
     })
     auditResult.value = res.data
     toast.success('Audit complete')
   } catch (err) {
      handleAiError(err)
   } finally {
      auditing.value = false
   }
}

// Watch keywords for density (client side simplified)
const updateLocalDensity = () => {
   if (!form.content || !form.focus_keyword) {
      density.primary = 0
      return
   }
   const text = form.content.replace(/<[^>]*>/g, '').toLowerCase()
   const words = text.split(/\s+/).filter(w => w.length > 0)
   const occurrences = (text.match(new RegExp(form.focus_keyword.toLowerCase(), 'g')) || []).length
   const kwWordCount = form.focus_keyword.split(/\s+/).length
   density.primary = words.length > 0 ? (occurrences * kwWordCount / words.length) * 100 : 0
}

// Re-calculate density whenever focus keyword changes
watch(() => form.focus_keyword, () => updateLocalDensity())

onMounted(() => {
   updateLocalDensity()
})
</script>

<style>
.prose h1, .prose h2, .prose h3 {
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.025em;
}
.prose p {
  line-height: 1.8;
  color: #334155;
  margin-bottom: 1.5rem;
}
.prose h2, .prose h3 {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Editor Placeholder Logic */
.editor-placeholder:empty:before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  font-weight: 700;
  pointer-events: none;
  display: block; /* For Firefox */
}

/* Toolbar button helper — plain CSS to avoid Tailwind v4 @apply + hover: conflict */
.toolbar-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  color: #475569;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toolbar-btn:hover {
  background-color: #f1f5f9;
}
</style>
