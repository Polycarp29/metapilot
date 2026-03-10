<template>
  <AppLayout title="Content Hub">
    <div class="max-w-[1440px] mx-auto pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Content Hub</h1>
          <p class="text-slate-500 font-medium">Create, optimize, and manage your SEO content with AI assistance.</p>
        </div>

        <!-- Tab Switches (Pill Style) -->
        <div class="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner w-fit">
          <button 
            @click="activeTab = 'write'"
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'write' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Write Content
          </button>
          <button 
            @click="activeTab = 'humanizer'"
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'humanizer' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            AI Humanizer
          </button>
          <button 
            @click="activeTab = 'audit'"
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
            :class="activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            SEO Audit
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="mt-8">
        <!-- Write Content Empty/List State -->
        <div v-if="activeTab === 'write' && !editingPost">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
               <h2 class="text-2xl font-black text-slate-900">Blog Posts</h2>
               <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{{ posts.length }} Total</span>
            </div>
            <button @click="createNewPost" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
               New Post
            </button>
          </div>

          <div v-if="posts.length === 0" class="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">No Blog Posts Yet</h3>
            <p class="text-slate-500 max-w-sm mx-auto">Start creating SEO-optimized content to boost your rankings.</p>
            <button @click="createNewPost" class="mt-6 text-blue-600 font-bold hover:underline">Create your first post →</button>
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
             <div v-for="post in posts" :key="post.id" class="group bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/30 transition-all flex items-center justify-between">
                <div class="flex items-center gap-6 flex-1">
                   <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <svg class="w-7 h-7 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <div>
                      <h3 class="text-lg font-black text-slate-900 mb-1 flex items-center gap-3">
                        {{ post.title }}
                        <span v-if="post.status === 'published'" class="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] uppercase font-black rounded-lg">Published</span>
                        <span v-else class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-black rounded-lg">{{ post.status }}</span>
                      </h3>
                      <div class="flex items-center gap-4 text-sm font-bold text-slate-400">
                         <span class="flex items-center gap-1.5">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                           {{ post.category?.name || 'Uncategorized' }}
                         </span>
                         <span>•</span>
                         <span>{{ post.word_count }} words</span>
                         <span>•</span>
                         <span>Updated {{ formatDate(post.updated_at) }}</span>
                      </div>
                   </div>
                </div>

                <div class="flex items-center gap-8">
                   <div class="flex flex-col items-center">
                      <p class="text-[10px] uppercase font-black text-slate-400 mb-1">SEO Health</p>
                      <div class="relative w-14 h-14">
                         <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="3"></circle>
                            <circle cx="18" cy="18" r="16" fill="none" :class="getScoreColorClass(post.seo_score)" stroke-width="3" stroke-dasharray="100" :stroke-dashoffset="100 - (post.seo_score || 0)" stroke-linecap="round" class="transition-all duration-1000" style="stroke: currentColor;"></circle>
                         </svg>
                         <div class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900">
                            {{ post.seo_score }}%
                         </div>
                      </div>
                   </div>
                   
                   <div class="flex flex-col items-center">
                      <p class="text-[10px] uppercase font-black text-slate-400 mb-1">Human Score</p>
                      <div class="px-3 py-1.5 rounded-full font-black text-[11px]" :class="getAiScoreClass(post.ai_content_score)">
                         {{ post.ai_content_score }}%
                      </div>
                   </div>
                   <div class="flex items-center gap-2">
                      <button @click="editPost(post)" class="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button @click="deletePost(post)" class="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- Tab 2: Humanizer -->
        <div v-if="activeTab === 'humanizer'">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Input -->
            <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                 <span class="w-2 h-8 bg-blue-600 rounded-full"></span>
                 Input Content
               </h3>
               <textarea 
                  v-model="humanizer.input"
                  placeholder="Paste AI-generated content here (min 100 words)..."
                  class="w-full h-96 p-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 placeholder:text-slate-400 transition-all resize-none"
               ></textarea>
               
               <div class="mt-8 flex items-center justify-between">
                  <div class="flex items-center gap-4">
                     <p class="text-sm font-black text-slate-500 uppercase">Tone:</p>
                     <select v-model="humanizer.tone" class="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20">
                        <option value="professional">Professional</option>
                        <option value="conversational">Conversational</option>
                        <option value="academic">Academic</option>
                        <option value="creative">Creative</option>
                     </select>
                  </div>
                  <button 
                    @click="runHumanizer"
                    :disabled="humanizing || humanizer.input.length < 100"
                    class="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <svg v-if="humanizing" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {{ humanizing ? 'Humanizing...' : 'Humanize Content' }}
                  </button>
               </div>
            </div>

            <!-- Output -->
            <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div v-if="!humanizer.output" class="h-full flex flex-col items-center justify-center text-center py-20">
                  <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 class="text-lg font-bold text-slate-400">Humanized output will appear here</h4>
               </div>
               
               <div v-else>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-black text-slate-900 flex items-center gap-3">
                      <span class="w-2 h-8 bg-emerald-500 rounded-full"></span>
                      Humanized Result
                    </h3>
                    <button @click="copyOutput" class="text-blue-600 font-bold hover:underline">Copy Result</button>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4 mb-8">
                     <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <p class="text-[10px] uppercase font-black text-rose-600 mb-1">Before AI Score</p>
                        <p class="text-2xl font-black text-rose-700">{{ humanizer.result.initial_ai_score }}%</p>
                     </div>
                     <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p class="text-[10px] uppercase font-black text-emerald-600 mb-1">After AI Score</p>
                        <p class="text-2xl font-black text-emerald-700">{{ humanizer.result.final_ai_score }}%</p>
                     </div>
                  </div>

                  <div class="p-6 bg-slate-50 rounded-3xl font-medium text-slate-700 leading-relaxed overflow-y-auto max-h-[400px]">
                    {{ humanizer.output }}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: SEO Audit -->
        <div v-if="activeTab === 'audit'">
           <!-- Implementation for Audit Tab -->
           <div class="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center">
              <div class="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                 <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h2 class="text-3xl font-black text-slate-900 mb-4">Deep Content Audit</h2>
              <p class="text-slate-500 font-medium mb-12">Analyze any URL or pasted content against your target keywords to find gaps and optimization opportunities.</p>
              
              <div class="space-y-6 text-left">
                 <div>
                    <label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2">Audit Target</label>
                    <input 
                      v-model="audit.url" 
                      type="url" 
                      placeholder="https://example.com/blog-post" 
                      class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                    >
                 </div>
                 
                  <div>
                    <label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2">Or Paste Content</label>
                    <textarea 
                      v-model="audit.content" 
                      placeholder="Paste your content here for analysis..."
                      class="w-full h-48 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                    ></textarea>
                 </div>
                  
                 <div>
                    <label class="block text-sm font-black text-slate-400 uppercase tracking-wider mb-2">Target Keywords (one per line)</label>
                    <textarea 
                      v-model="audit.keywordsRaw" 
                      placeholder="primary keyword&#10;secondary keyword..."
                      class="w-full h-32 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold"
                    ></textarea>
                 </div>
                 
                 <button 
                   @click="runAudit"
                   :disabled="auditing || !audit.keywordsRaw"
                   class="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   <svg v-if="auditing" class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   {{ auditing ? 'Analyzing Content...' : 'Run SEO Audit' }}
                 </button>
              </div>
           </div>
           
           <!-- Audit Results Modal/Panel (later) -->
        </div>

        <!-- Write Tab: Editor (Slide Over) -->
        <Transition 
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-400 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div v-if="editingPost" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
             <div class="w-full max-w-[95%] h-full bg-slate-50 flex flex-col shadow-2xl relative">
                <!-- Editor Header -->
                <div class="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
                   <div class="flex items-center gap-6">
                      <button @click="closeEditor" class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div>
                        <input v-model="form.title" type="text" placeholder="Post Title..." class="text-xl font-black text-slate-900 border-none bg-transparent focus:ring-0 p-0 w-96">
                      </div>
                   </div>
                   
                   <div class="flex items-center gap-4">
                      <span class="text-sm font-bold text-slate-400">{{ metrics.word_count }} words • {{ metrics.reading_time_minutes }} min read</span>
                      <div class="h-8 w-px bg-slate-100 mx-2"></div>
                      <button @click="saveDraft" :disabled="saving" class="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        {{ saving ? 'Saving...' : 'Save Draft' }}
                      </button>
                      <button @click="publishPost" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 transition-all">
                        Publish
                      </button>
                   </div>
                </div>

                 <div class="flex-1 flex overflow-hidden relative">
                   <!-- Editor Body -->
                   <div class="flex-1 p-12 overflow-y-auto bg-white custom-scrollbar">
                      <div class="max-w-4xl mx-auto">
                         <!-- Focus Keyword & Meta -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div>
                               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Focus Keyword</label>
                               <input v-model="form.focus_keyword" @blur="runAnalysis" type="text" placeholder="e.g. SEO Content Guide" class="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold">
                            </div>
                            <div>
                               <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                               <select v-model="form.blog_category_id" class="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold">
                                  <option :value="null">Uncategorized</option>
                                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                               </select>
                            </div>
                            
                            <!-- Search Optimization (SERP Content) -->
                            <div class="col-span-full bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                               <div class="flex items-center gap-3 mb-6">
                                  <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                  </div>
                                  <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Search Appearance</h4>
                               </div>
                               
                               <div class="grid grid-cols-1 gap-6">
                                  <div>
                                     <div class="flex justify-between items-center mb-2">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">SEO Meta Title</label>
                                        <span class="text-[10px] font-bold" :class="(form.meta_title || '').length > 60 ? 'text-rose-500' : 'text-slate-400'">{{ (form.meta_title || '').length }} / 60</span>
                                     </div>
                                     <input v-model="form.meta_title" type="text" :placeholder="form.title" class="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold">
                                  </div>
                                  <div>
                                     <div class="flex justify-between items-center mb-2">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                                        <span class="text-[10px] font-bold" :class="(form.meta_description || '').length > 160 ? 'text-rose-500' : 'text-slate-400'">{{ (form.meta_description || '').length }} / 160</span>
                                     </div>
                                     <textarea v-model="form.meta_description" rows="2" placeholder="Briefly summarize your post for search engines..." class="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"></textarea>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <!-- Content Editor (Simplified) -->
                         <div 
                           ref="editor"
                           contenteditable="true"
                           class="prose prose-slate prose-xl max-w-none focus:outline-none min-h-[600px]"
                           @input="handleEditorInput"
                         ></div>
                      </div>
                   </div>

                   <!-- Sidebar: SEO & AI -->
                   <div class="w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
                      <!-- SEO Score Dial -->
                      <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                         <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Master SEO Score</p>
                         <div class="relative inline-flex mb-6">
                            <svg class="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                               <circle class="text-slate-100" stroke-width="3" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18" />
                               <circle 
                                 :class="getScoreColorClass(form.seo_score)"
                                 stroke-width="3" 
                                 stroke-dasharray="100"
                                 :stroke-dashoffset="100 - (form.seo_score || 0)"
                                 stroke-linecap="round" 
                                 stroke="currentColor" 
                                 fill="transparent" 
                                 r="16" cx="18" cy="18"
                                 class="transition-all duration-1000"
                               />
                            </svg>
                            <span class="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900">
                               {{ form.seo_score }}
                            </span>
                         </div>
                         <button @click="runAnalysis" :disabled="analyzing" class="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2">
                            <svg v-if="analyzing" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {{ analyzing ? 'Analyzing...' : 'Refresh SEO Audit' }}
                         </button>
                      </div>

                      <!-- Content Stats -->
                       <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Content Stats</h4>
                          <div class="space-y-4">
                             <div class="flex justify-between items-center">
                                <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Word Count</span>
                                <span class="text-sm font-black text-slate-900">{{ metrics.word_count }}</span>
                             </div>
                             <div class="flex justify-between items-center">
                                <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Read Time</span>
                                <span class="text-sm font-black text-slate-900">{{ metrics.reading_time_minutes }}m</span>
                             </div>
                             <div class="flex justify-between items-center">
                                <span class="text-xs font-black text-slate-400 uppercase tracking-wider">KW Density</span>
                                <span class="text-sm font-black" :class="density.primary > 1 && density.primary < 3 ? 'text-emerald-500' : 'text-amber-500'">{{ density.primary.toFixed(1) }}%</span>
                             </div>
                          </div>
                       </div>

                       <!-- SERP Preview -->
                       <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">SERP Preview</h4>
                          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p class="text-[8px] text-slate-400 truncate mb-1">https://{{ organization?.slug || 'site' }}.ai/blog/...</p>
                             <h5 class="text-blue-700 text-xs font-bold hover:underline cursor-pointer line-clamp-2 mb-1">
                                {{ form.meta_title || form.title || 'Untitled Post' }}
                             </h5>
                             <p class="text-slate-600 text-[10px] leading-relaxed line-clamp-3">
                                {{ form.meta_description || 'Start writing to see how your meta description will appear in Google Search results...' }}
                             </p>
                          </div>
                       </div>

                      <!-- AI Detection -->
                      <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                         <div class="flex items-center justify-between mb-6">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Probability</p>
                            <span :class="getAiScoreClass(form.ai_content_score)" class="px-3 py-1 rounded-lg text-xs font-black">{{ form.ai_content_score || 0 }}%</span>
                         </div>
                         <div class="w-full h-2 bg-slate-100 rounded-full mb-6 relative overflow-hidden">
                            <div :class="getAiBgClass(form.ai_content_score)" class="h-full rounded-full transition-all duration-1000" :style="{ width: (form.ai_content_score || 0) + '%' }"></div>
                         </div>
                         <p v-if="form.ai_detection_notes" class="text-[10px] font-bold text-slate-500 leading-relaxed italic">{{ form.ai_detection_notes }}</p>
                      </div>

                      <!-- SEO Checklist -->
                      <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Actionable Audit</p>
                        <div class="space-y-8">
                           <div v-for="(checks, category) in groupedChecks" :key="category">
                              <h5 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{{ category }}</h5>
                              <div class="space-y-4">
                                 <div v-for="check in checks" :key="check.id" class="group">
                                    <div class="flex items-start gap-3">
                                       <div class="mt-1">
                                          <svg v-if="check.status === 'success'" class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
                                          <svg v-else-if="check.status === 'error'" class="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12" /></svg>
                                          <svg v-else class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z" /></svg>
                                       </div>
                                       <div>
                                          <p class="text-[10px] font-black leading-tight" :class="check.status === 'success' ? 'text-slate-700' : 'text-slate-500'">{{ check.message }}</p>
                                          <p v-if="check.action && check.status !== 'success'" class="text-[9px] font-bold text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{{ check.action }}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>

                      <!-- Writing Assistant -->
                      <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                         <div class="flex items-center justify-between mb-6">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Writing Assistant</p>
                            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black tracking-tighter">AI LIVE</span>
                         </div>
                         <div class="space-y-4">
                            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Semantic Keywords</p>
                               <div class="flex flex-wrap gap-2">
                                  <span v-for="kw in semanticKeywords" :key="kw" @click="addKeyword(kw)" class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-500 cursor-pointer transition-colors">
                                     + {{ kw }}
                                  </span>
                               </div>
                            </div>
                            <div class="flex gap-2">
                               <button @click="generateIntro" :disabled="isGeneratingIntro" class="flex-1 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50">
                                  {{ isGeneratingIntro ? 'Drafting...' : 'Generate Intro' }}
                               </button>
                               <button @click="generateNextIdea" class="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase cursor-not-allowed">
                                  Next Section
                               </button>
                            </div>
                            <div v-if="hasSelection" class="pt-4 border-t border-slate-100">
                               <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3">Selection Tools</p>
                               <button @click="refineSelection" :disabled="isRefining" class="w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
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
    </div>

    <!-- Audit Results Modal -->
    <Transition enter-active-class="duration-300 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="duration-200 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
       <div v-if="auditResult" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" @click.self="auditResult = null">
          <div class="bg-white rounded-[3rem] p-12 w-full max-w-4xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
             <button @click="auditResult = null" class="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
                          <div class="flex items-center gap-10 mb-12">
                 <div class="relative w-32 h-32">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                       <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-50" stroke-width="2.5"></circle>
                       <circle cx="18" cy="18" r="16" fill="none" class="text-blue-600" stroke-width="2.5" stroke-dasharray="100" :stroke-dashoffset="100 - auditResult.seo_score" stroke-linecap="round" style="stroke: currentColor;"></circle>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                       <span class="text-4xl font-black text-slate-900 leading-none">{{ auditResult.seo_score }}</span>
                       <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health</span>
                    </div>
                 </div>
                 <div class="text-left">
                   <h2 class="text-4xl font-black text-slate-900 mb-2">Audit Report</h2>
                   <p class="text-slate-500 font-bold text-lg leading-snug">{{ auditResult.summary }}</p>
                   <div class="flex items-center gap-4 mt-4">
                      <span class="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">Technical SEO</span>
                      <span class="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest">Content Quality</span>
                   </div>
                 </div>
              </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
                <div class="bg-slate-50 p-8 rounded-3xl">
                   <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Keyword Gaps</h4>
                   <ul class="space-y-3">
                      <li v-for="gap in auditResult.keyword_gaps" :key="gap" class="flex items-center gap-3 font-bold text-slate-700">
                         <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                         {{ gap }}
                      </li>
                   </ul>
                </div>
                <div class="bg-amber-50 p-8 rounded-3xl">
                   <h4 class="text-xs font-black text-amber-600 uppercase tracking-widest mb-6">High Priority Fixes</h4>
                   <ul class="space-y-3">
                      <li v-for="fix in auditResult.fix_priorities" :key="fix" class="flex items-start gap-3 font-bold text-amber-800">
                         <svg class="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 15.333c-.77 1.333.192 3 1.732 3z" /></svg>
                         {{ fix }}
                      </li>
                   </ul>
                </div>
             </div>

             <div class="bg-indigo-50 p-8 rounded-3xl text-left">
                <h4 class="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Optimization Tips</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 font-bold text-indigo-900">
                   <p v-for="tip in auditResult.optimization_tips" :key="tip">• {{ tip }}</p>
                </div>
             </div>
          </div>
       </div>
     </Transition>

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
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
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

const semanticKeywords = computed(() => {
  if (!form.focus_keyword) return ['SEO', 'Content', 'Optimization']
  // Fake semantic keywords for demo, could be powered by API
  return [
    form.focus_keyword + ' Strategy',
    'Best Practices for ' + form.focus_keyword,
    'How to ' + form.focus_keyword,
    'Advanced ' + form.focus_keyword
  ]
})

const isGeneratingIntro = ref(false)
const isRefining = ref(false)
const hasSelection = ref(false)

const addKeyword = (kw) => {
   if (!form.content.includes(kw)) {
      form.content += ` <p><em>${kw}</em></p>`
      if (editor.value) {
         editor.value.innerHTML = form.content
      }
      toast.success(`Keyword added: ${kw}`)
      debouncedAnalysis()
   } else {
      toast.warning('Keyword already exists in content')
   }
}

const generateIntro = async () => {
   if (!form.title || !form.focus_keyword) {
      toast.error('Post title and Focus Keyword are required for AI drafting.')
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
      toast.error('Failed to generate introduction.')
   } finally {
      isGeneratingIntro.value = false
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
         
         // Update form content from editor innerHTML
         if (editor.value) form.content = editor.value.innerHTML
         toast.success('Content refined!')
         debouncedAnalysis()
      }
   } catch (e) {
      toast.error('Failed to refine content.')
   } finally {
      isRefining.value = false
   }
}

// Update hasSelection state
document.addEventListener('selectionchange', () => {
   hasSelection.value = !!window.getSelection().toString()
})

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
    meta_description: ''
  })
  editingPost.value = true
}

const editPost = (post) => {
  Object.assign(form, {
    ...post,
    meta_title: post.meta_title || '',
    meta_description: post.meta_description || ''
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
  debouncedAnalysis()
}

const runAnalysis = async () => {
  if (!editingPost.value) return
  
  if (!form.id) {
    toast.warning('Please save the post first to run SEO analysis')
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
    console.error(err)
    toast.error('Failed to analyze content')
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
     humanizer.output = res.data.humanized_text
     humanizer.result = res.data
     toast.success('Content humanized successfully')
   } catch (err) {
      console.error(err)
      toast.error('Humanization failed')
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
      console.error(err)
      toast.error('Audit failed')
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
  line-height: 1.75;
  color: #334155;
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
</style>
