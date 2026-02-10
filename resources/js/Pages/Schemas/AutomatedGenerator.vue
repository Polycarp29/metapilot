<template>
  <AppLayout title="Modular Schema Builder">
    <div class="max-w-5xl mx-auto space-y-12 pb-24">
      <!-- Mega Header -->
      <div class="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-20 shadow-2xl">
        <div class="absolute top-0 right-0 -m-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 -m-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div class="text-center md:text-left">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-500/30">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Universal Intelligence
            </div>
            <h1 class="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
              Modular <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Flex-Builder</span>
            </h1>
            <p class="text-slate-400 font-medium text-lg max-w-xl leading-relaxed">
              Create highly adaptive structured data for any website. Toggle brand identity, add custom categories, and tailor every page context.
            </p>
          </div>
          <Link 
            href="/schemas" 
            class="group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-3xl font-bold transition-standard border border-white/10 backdrop-blur-xl"
          >
            <svg class="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancel
          </Link>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <!-- Progress -->
        <div class="lg:sticky lg:top-24 space-y-4">
          <div 
            v-for="(step, idx) in steps" 
            :key="idx"
            class="group relative flex items-center gap-6 p-6 rounded-[2rem] transition-standard border shadow-sm"
            :class="[
              currentStep === idx ? 'bg-white border-blue-200 shadow-blue-100 ring-1 ring-blue-50' : 'bg-slate-50 border-transparent opacity-60 grayscale'
            ]"
          >
            <div 
              class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-standard"
              :class="[
                currentStep === idx ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-200 text-slate-500'
              ]"
            >
              {{ idx + 1 }}
            </div>
            <div>
              <h4 class="font-bold text-slate-900 leading-tight uppercase tracking-widest text-[10px]">{{ step.label }}</h4>
              <p class="text-slate-500 text-xs font-medium">{{ step.title }}</p>
            </div>
          </div>
        </div>

        <!-- Canvas -->
        <div class="lg:col-span-2">
          <form @submit.prevent="submit" class="bg-white rounded-[3.5rem] shadow-premium border border-slate-100 overflow-hidden">
            <!-- Step 1: Base -->
            <div v-show="currentStep === 0" class="p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="grid grid-cols-1 gap-10">
                <div class="space-y-4">
                  <label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Internal Recognition Name</label>
                  <input v-model="form.name" type="text" placeholder="e.g., Dynamic Subpage Markup" class="block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-standard text-slate-900 font-bold text-lg placeholder:text-slate-300" :class="{'ring-2 ring-red-500 border-red-500': errors.name}" />
                  <p v-if="errors.name" class="text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2">{{ errors.name }}</p>
                </div>
                <div class="space-y-4">
                  <label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Contextual Meta Description</label>
                  <textarea v-model="form.meta_description" rows="4" placeholder="Description for this specific page..." class="block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"></textarea>
                </div>
                <div class="space-y-4">
                  <label class="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Canonical Link Destination</label>
                  <div class="flex gap-4">
                    <input v-model="form.page_link" type="url" class="block w-full px-8 py-5 rounded-3xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" :class="{'ring-2 ring-red-500 border-red-500': errors.page_link}" />
                    <button 
                      type="button" 
                      @click="analyzeUrl" 
                      :disabled="isAnalyzing"
                      class="shrink-0 bg-slate-900 text-white px-8 py-5 rounded-3xl font-black transition-standard hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                    >
                      <svg v-if="isAnalyzing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ isAnalyzing ? 'Scanning...' : 'Scan URL' }}
                    </button>
                  </div>
                  <p v-if="errors.page_link" class="text-red-500 text-[10px] font-black uppercase tracking-widest ml-4 mt-2">{{ errors.page_link }}</p>
                </div>
              </div>
            </div>

            <!-- Step 2: Module Configuration -->
            <div v-show="currentStep === 1" class="p-10 md:p-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <!-- Assistant Header -->
               <div class="flex items-start gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group mb-12">
                 <div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                   <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <div class="space-y-1 relative z-10">
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">Strategy Phase</h3>
                   <p class="text-slate-500 text-sm font-medium leading-relaxed">
                     "What should we focus on for this page? Toggle your brand identity or add specific category blocks below."
                   </p>
                 </div>
               </div>
               
               <div class="space-y-6">
                  <!-- Core Module Toggle -->
                  <div class="space-y-4">
                    <div 
                      @click="form.include_brand_identity = !form.include_brand_identity"
                      :class="form.include_brand_identity ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-200'"
                      class="group p-8 rounded-[2.5rem] border-2 cursor-pointer transition-standard flex justify-between items-center"
                    >
                      <div class="flex items-center gap-6">
                        <div :class="form.include_brand_identity ? 'bg-blue-500' : 'bg-slate-100 text-slate-400'" class="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-standard">
                          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h4 :class="form.include_brand_identity ? 'text-white' : 'text-slate-900'" class="text-xl font-black">Brand Identity</h4>
                          <p :class="form.include_brand_identity ? 'text-slate-400' : 'text-slate-500'" class="text-xs font-medium">Injects Organization & WebSite JSON-LD.</p>
                        </div>
                      </div>
                      <div :class="form.include_brand_identity ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {{ form.include_brand_identity ? 'Active' : 'Disabled' }}
                      </div>
                    </div>

                    <!-- Sub-options for Brand Identity (Conversational) -->
                    <Transition 
                      enter-active-class="transition duration-500 ease-out" 
                      enter-from-class="opacity-0 -translate-y-8" 
                      enter-to-class="opacity-100 translate-y-0"
                    >
                      <div v-if="form.include_brand_identity" class="space-y-6">
                        <div class="bg-indigo-50/40 p-10 rounded-[2.5rem] border border-indigo-100 space-y-10 ml-4 relative overflow-hidden">
                          <div class="absolute top-0 right-0 p-4 opacity-5">
                            <svg class="w-32 h-32 text-indigo-900" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                          </div>

                          <div class="flex items-center gap-4">
                            <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60">Guided Building</span>
                          </div>
                          <h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight">Define your brand identity details.</h5>
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Name</label>
                                <input v-model="form.brand_name" type="text" placeholder="e.g., Acme Corp" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Logo URL</label>
                                <input v-model="form.brand_logo" type="url" placeholder="https://..." class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" />
                            </div>
                            <div class="space-y-2 md:col-span-2">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternate Name / Trademarks</label>
                                <input v-model="form.brand_alternate_name" type="text" placeholder="e.g., Acme, Acme Co" class="w-full bg-white border-slate-200 rounded-xl px-5 py-3 text-xs font-bold" />
                            </div>
                          </div>

                          <!-- Question 1: Products -->
                          <div class="space-y-4 pt-6 border-t border-indigo-100/50">
                            <h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight">Do you want to list your brand's flagship products?</h5>
                            <div class="flex gap-3">
                              <button 
                                type="button"
                                @click="toggleBrandProducts"
                                :class="form.brand_show_products ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'"
                                class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                              >
                                {{ form.brand_show_products ? 'Yes, Include Products' : 'No Products' }}
                              </button>
                              <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0 scale-95">
                                <label v-if="form.brand_show_products" class="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                                  <input v-model="form.brand_link_products" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                  <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Link to pages?</span>
                                </label>
                              </Transition>
                            </div>
                          </div>

                          <!-- Question 2: Services -->
                          <div class="space-y-4 pt-6 border-t border-indigo-100/50">
                            <h5 class="text-lg font-black text-slate-800 tracking-tight leading-tight">Should we also detail the services you provide?</h5>
                            <div class="flex gap-3">
                              <button 
                                type="button"
                                @click="toggleBrandServices"
                                :class="form.brand_show_services ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'"
                                class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                              >
                                {{ form.brand_show_services ? 'Yes, Add Services' : 'No Services' }}
                              </button>
                              <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0 scale-95">
                                <label v-if="form.brand_show_services" class="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                                  <input v-model="form.brand_link_services" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Include Landing Links?</span>
                                </label>
                              </Transition>
                            </div>
                          </div>

                          <!-- Question 3: Offers -->
                          <div class="space-y-4 pt-6 border-t border-indigo-100/50">
                            <label class="flex items-center gap-4 cursor-pointer group">
                              <div class="relative">
                                <input v-model="form.brand_show_offers" type="checkbox" class="sr-only peer" />
                                <div class="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-600 transition-colors shadow-inner"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform shadow-sm"></div>
                              </div>
                              <div>
                                <span class="text-xs font-black text-slate-700 uppercase tracking-widest block">Standard Market Offers</span>
                                <span class="text-[10px] text-slate-400 font-medium">Include general promotions & value propositions.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>

                  <!-- Dynamic Schema Modules -->
                  <div class="space-y-4">
                    <div class="flex justify-between items-center px-4">
                      <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Additional Schema Modules</label>
                      <button @click.prevent="addModule" class="text-blue-600 font-bold text-xs uppercase tracking-widest hover:blue-700">+ Add Module</button>
                    </div>

                    <TransitionGroup 
                      enter-active-class="transition duration-300 ease-out" 
                      enter-from-class="opacity-0 translate-y-4" 
                      enter-to-class="opacity-100 translate-y-0"
                      leave-active-class="transition duration-200 ease-in"
                      leave-from-class="opacity-100 translate-y-0"
                      leave-to-class="opacity-0 translate-y-4"
                    >
                      <div v-for="(module, idx) in form.modules" :key="idx" class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6">
                        <div class="flex-grow">
                          <select v-model="module.schema_type_id" class="w-full bg-white border-slate-200 rounded-2xl px-5 py-3 font-bold text-sm h-14 appearance-none">
                            <option value="">Select Schema Category...</option>
                            <option v-for="type in schemaTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                          </select>
                        </div>
                        <button @click.prevent="removeModule(idx)" class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shadow-sm">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TransitionGroup>
                    
                    <div v-if="form.modules.length === 0" class="text-center py-10 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <p class="text-slate-400 text-xs font-bold italic">No custom modules added.</p>
                    </div>
                  </div>
               </div>
            </div>

            <!-- Step 3: Module Data (Guided Interview Flow) -->
            <div v-show="currentStep === 2" class="p-10 md:p-16 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <!-- Brand Identity Data (If on) -->
               <div v-if="form.include_brand_identity" class="space-y-16">
                  <!-- Assistant Header -->
                  <div class="flex items-start gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg class="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                      <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div class="space-y-2 relative z-10">
                      <h3 class="text-xl font-black text-white tracking-tight">Personal Schema Assistant</h3>
                      <p class="text-slate-400 text-sm font-medium leading-relaxed">
                        "Great! Let's fill out your catalog. I'll guide you through each entry one field at a time to ensure your schema is optimized."
                      </p>
                    </div>
                  </div>

                  <!-- Brand Products Panel (Guided) -->
                  <div v-if="form.brand_show_products" class="space-y-10">
                    <div class="flex justify-between items-center px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-black text-xs shadow-sm">P</div>
                        <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">Brand Product Catalog</h4>
                      </div>
                      <button @click.prevent="addBrandProduct" class="group flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:blue-700 transition-all">
                        <span class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">+</span>
                        Add New Product
                      </button>
                    </div>

                    <div class="space-y-8">
                      <div v-for="(p, pIdx) in form.brand_products" :key="pIdx" class="relative">
                        <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-blue-100 space-y-8">
                          <!-- Question 1: Type Selection -->
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "What type of item is this?"</label>
                            <div class="flex flex-wrap gap-2">
                              <button 
                                v-for="type in ['Product', 'Service', 'FinancialProduct', 'Offer']" 
                                :key="type"
                                type="button"
                                @click="p['@type'] = type"
                                :class="p['@type'] === type ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 border border-slate-200'"
                                class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                {{ type }}
                              </button>
                            </div>
                          </div>

                          <!-- Question 2: Name -->
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "What's the name of this {{ p['@type'].toLowerCase() }}?"</label>
                            <input v-model="p.name" placeholder="e.g., Enterprise Plan" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" />
                          </div>

                          <!-- Question 3: Description (Reveals after name) -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="p.name.length > 2" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "Excellent. Can you provide a brief description for SEO context?"</label>
                              <textarea v-model="p.description" rows="2" placeholder="Tell Google what this item is about..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"></textarea>
                            </div>
                          </Transition>

                          <!-- Question 4: URL (Reveals after description if linked) -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="form.brand_link_products && p.description.length > 5" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "And the landing page URL for this specific item?"</label>
                              <input v-model="p.url" type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" />
                            </div>
                          </Transition>

                          <button @click.prevent="removeBrandProduct(pIdx)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Brand Services Panel (Guided) -->
                  <div v-if="form.brand_show_services" class="space-y-10">
                    <div class="flex justify-between items-center px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-black text-xs shadow-sm">S</div>
                        <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">Brand Services</h4>
                      </div>
                      <button @click.prevent="addBrandService" class="group flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:indigo-700 transition-all">
                        <span class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">+</span>
                        Add New Service
                      </button>
                    </div>

                    <div class="space-y-8">
                      <div v-for="(s, sIdx) in form.brand_services" :key="sIdx" class="relative">
                        <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium transition-all hover:shadow-2xl hover:border-indigo-100 space-y-8">
                          <!-- Question 1: Type Selection -->
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "What type of service or offer is this?"</label>
                            <div class="flex flex-wrap gap-2">
                              <button 
                                v-for="type in ['Service', 'FinancialProduct', 'Product', 'Offer']" 
                                :key="type"
                                type="button"
                                @click="s['@type'] = type"
                                :class="s['@type'] === type ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 border border-slate-200'"
                                class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                {{ type }}
                              </button>
                            </div>
                          </div>

                          <!-- Question 2: Name -->
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "What's the name of this {{ s['@type'].toLowerCase() }}?"</label>
                            <input v-model="s.name" placeholder="e.g., 24/7 Support Desk" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" />
                          </div>

                          <!-- Question 3: Description (Reveals after name) -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="s.name.length > 2" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "Got it. How would you describe the value of this item?"</label>
                              <textarea v-model="s.description" rows="2" placeholder="Briefly explain the item..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"></textarea>
                            </div>
                          </Transition>

                          <!-- Question 4: URL (Reveals after description if linked) -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="form.brand_link_services && s.description.length > 5" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "And finally, which page should users visit for this?"</label>
                              <input v-model="s.url" type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" />
                            </div>
                          </Transition>

                          <button @click.prevent="removeBrandService(sIdx)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- General Info Info -->
                  <div class="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden group">
                    <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div class="flex items-center gap-6 relative z-10">
                      <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h5 class="text-sm font-black text-slate-900 mb-1 tracking-tight">System Note</h5>
                        <p class="text-slate-500 font-medium text-xs leading-relaxed">
                          Brand identity creates standard Organization/WebSite entries. 
                          {{ form.brand_show_offers ? 'I will also append a Master Deposit Offer to your profile.' : '' }}
                        </p>
                      </div>
                    </div>
                  </div>
               </div>

               <!-- Dynamic Modules Data (Guided) -->
               <div v-for="(module, mIdx) in form.modules" :key="mIdx" class="space-y-10">
                  <div class="flex justify-between items-center px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 font-black text-xs shadow-sm">
                        {{ mIdx + 1 }}
                      </div>
                      <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">{{ getTypeName(module.schema_type_id) }} Module</h4>
                    </div>
                  </div>
                  
                  <div class="space-y-8 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 relative">
                    <!-- Product Module Guided -->
                    <div v-if="getTypeKey(module.schema_type_id) === 'product'" class="space-y-8">
                       <div class="flex justify-between items-center">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assistant: "Add items for this {{ getTypeName(module.schema_type_id) }} category below."</label>
                        <button @click.prevent="addProduct(mIdx)" class="text-blue-600 font-bold text-[10px] uppercase tracking-widest">+ Add Item</button>
                      </div>

                      <div v-for="(p, pIdx) in module.data.items" :key="pIdx" class="relative group">
                        <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8">
                          <!-- Question 1: Name -->
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "Name of the item?"</label>
                            <input v-model="p.name" placeholder="Item name..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" />
                          </div>

                          <!-- Question 2: Description -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="p.name.length > 2" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "Briefly describe it for the schema."</label>
                              <textarea v-model="p.description" rows="2" placeholder="Description..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"></textarea>
                            </div>
                          </Transition>

                          <!-- Question 3: URL -->
                          <Transition enter-active-class="transition duration-500 delay-100" enter-from-class="opacity-0 -translate-y-4">
                            <div v-if="p.description.length > 5" class="space-y-4 pt-6 border-t border-slate-50">
                              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assistant: "Specific URL for this item?"</label>
                              <input v-model="p.url" type="url" placeholder="https://..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium" />
                            </div>
                          </Transition>

                          <button @click.prevent="removeProduct(mIdx, pIdx)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- FAQ Module Guided -->
                    <div v-else-if="getTypeKey(module.schema_type_id) === 'faq'" class="space-y-8">
                       <div class="flex justify-between items-center">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assistant: "Add your Frequently Asked Questions below."</label>
                        <button @click.prevent="addFAQItem(mIdx)" class="text-blue-600 font-bold text-[10px] uppercase tracking-widest">+ Add Question</button>
                      </div>

                      <div v-for="(q, qIdx) in module.data.items" :key="qIdx" class="relative group">
                        <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl space-y-8">
                          <div class="space-y-4">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question Text</label>
                            <input v-model="q.name" placeholder="What is your return policy?" class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-bold text-lg" />
                          </div>
                          <div class="space-y-4 pt-6 border-t border-slate-50">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Accepted Answer</label>
                            <textarea v-model="q.description" rows="3" placeholder="Provide the answer here..." class="block w-full px-8 py-5 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-standard text-slate-900 font-medium"></textarea>
                          </div>
                          <button @click.prevent="removeFAQItem(mIdx, qIdx)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- HowTo Module Guided -->
                    <div v-else-if="getTypeKey(module.schema_type_id) === 'howto'" class="space-y-8">
                       <div class="flex justify-between items-center">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assistant: "Detail your step-by-step instructions."</label>
                        <button @click.prevent="addHowToStep(mIdx)" class="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">+ Add Step</button>
                      </div>

                      <div v-for="(s, sIdx) in module.data.items" :key="sIdx" class="relative group">
                        <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl flex gap-8">
                          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-100">{{ sIdx + 1 }}</div>
                          <div class="flex-grow space-y-6">
                            <div class="space-y-2">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Step Headline</label>
                              <input v-model="s.name" placeholder="First Step..." class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Step Details</label>
                                <textarea v-model="s.description" rows="2" placeholder="Details for this step..." class="w-full bg-slate-50/50 border-slate-200 rounded-xl px-5 py-3 text-sm font-medium"></textarea>
                            </div>
                          </div>
                          <button @click.prevent="removeHowToStep(mIdx, sIdx)" class="w-10 h-10 rounded-full bg-red-50 text-red-400 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- LocalBusiness Module Guided -->
                    <div v-else-if="getTypeKey(module.schema_type_id) === 'localbusiness'" class="space-y-8">
                        <div v-if="module.data.items.length === 0" class="flex flex-col items-center py-10 bg-white rounded-[2.5rem] border border-slate-100">
                          <button @click.prevent="setupLocalBusiness(mIdx)" class="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Initialize Business Details</button>
                        </div>
                        <div v-else class="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-10">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="space-y-3 md:col-span-2">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Street Address</label>
                              <input v-model="module.data.items[0].address" placeholder="123 Innovation Drive" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" />
                            </div>
                            <div class="space-y-3">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">City</label>
                              <input v-model="module.data.items[0].city" placeholder="Nairobi" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" />
                            </div>
                            <div class="space-y-3">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Region/State</label>
                              <input v-model="module.data.items[0].region" placeholder="Nairobi County" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" />
                            </div>
                            <div class="space-y-3">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telephone</label>
                              <input v-model="module.data.items[0].phone" type="tel" placeholder="+254..." class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-display" />
                            </div>
                            <div class="space-y-3">
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Price Range</label>
                              <select v-model="module.data.items[0].price_range" class="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-sm font-black focus:bg-white transition-all appearance-none uppercase tracking-widest">
                                <option value="$">$ (Economy)</option>
                                <option value="$$">$$ (Standard)</option>
                                <option value="$$$">$$$ (Premium)</option>
                                <option value="$$$$">$$$$ (Luxury)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
                      <p class="text-slate-400 font-bold text-xs italic tracking-tight uppercase tracking-widest leading-loose">
                        Guided logic for {{ getTypeName(module.schema_type_id) }} is evolving.<br/>
                        <span class="text-[10px]">Generic fields are available in the post-build editor.</span>
                      </p>
                    </div>
                  </div>
               </div>

               <div v-if="!form.include_brand_identity && form.modules.length === 0" class="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <p class="text-slate-400 font-black text-xl italic mb-4">Empty Schema Architecture</p>
                  <p class="text-slate-500 font-medium">Please enable Brand Identity or add at least one module in Step 2.</p>
               </div>
            </div>

            <!-- Wizard Nav -->
            <div class="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <button type="button" @click="prevStep" v-if="currentStep > 0" class="px-10 py-5 rounded-3xl text-sm font-black text-slate-600 hover:bg-slate-200 transition-standard uppercase tracking-widest">Previous</button>
              <div v-else></div>

              <div class="flex gap-4">
                <button v-if="currentStep < 2" type="button" @click="nextStep" class="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 uppercase tracking-widest text-sm">Continue</button>
                <button v-else type="submit" :disabled="form.processing" class="bg-blue-600 text-white px-16 py-5 rounded-3xl font-black transition-standard shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm">
                  {{ form.processing ? 'Syncing...' : 'Build Modular Schema' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useForm, Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import axios from 'axios'
import { useToastStore } from '../../stores/useToastStore'

const toastStore = useToastStore()

const props = defineProps({
  schemaTypes: Array
})

const currentStep = ref(0)
const isAnalyzing = ref(false)
const steps = [
  { label: 'Foundation', title: 'SEO Context' },
  { label: 'Modular', title: 'Schema Blocks' },
  { label: 'Catalog', title: 'Data Entry' }
]

const form = useForm({
  name: '',
  meta_description: '',
  page_link: '',
  include_brand_identity: true,
  brand_name: '',
  brand_logo: '',
  brand_alternate_name: '',
  brand_show_products: false,
  brand_link_products: true,
  brand_show_services: false,
  brand_link_services: true,
  brand_show_offers: true,
  brand_products: [],
  brand_services: [],
  modules: []
})

const analyzeUrl = async () => {
  if (!form.page_link) {
    toastStore.error('Please enter a URL first.')
    return
  }

  isAnalyzing.value = true
  try {
    const response = await axios.post(route('api.analyze-url'), { url: form.page_link })
    
    // Priority: H1 -> Title -> Fallback
    form.name = response.data.h1 || response.data.title || 'Dynamic Page'
    form.meta_description = response.data.description || ''
    
    // Improved brand detection
    if (response.data.title) {
      let brandName = ''
      if (response.data.title.includes('|')) {
        brandName = response.data.title.split('|').pop().trim()
      } else if (response.data.title.includes('-')) {
        brandName = response.data.title.split('-').pop().trim()
      } else {
        brandName = response.data.title
      }
      form.brand_name = brandName
    }

    if (response.data.og_image) {
      form.brand_logo = response.data.og_image
    }

    // Handle suggestions
    if (response.data.suggestions && response.data.suggestions.length > 0) {
      response.data.suggestions.forEach(suggestionKey => {
        const type = props.schemaTypes.find(t => t.type_key === suggestionKey)
        if (type && !form.modules.find(m => m.schema_type_id === type.id)) {
          form.modules.push({
            schema_type_id: type.id,
            data: { items: suggestionKey === 'localbusiness' ? [] : [{ name: '', description: '' }] }
          })
          
          // Auto-initialize if localbusiness
          if (suggestionKey === 'localbusiness') {
            setupLocalBusiness(form.modules.length - 1)
          }
        }
      })
    }

    toastStore.success('URL Intelligence has populated the foundational fields and suggested modules!')
  } catch (e) {
    toastStore.error('Failed to reach site. You can still enter details manually.')
  } finally {
    isAnalyzing.value = false
  }
}

const addBrandProduct = () => {
  form.brand_products.push({ 
    '@type': 'Product',
    name: '', 
    description: '', 
    url: '' 
  })
}

const toggleBrandProducts = () => {
  form.brand_show_products = !form.brand_show_products
  if (form.brand_show_products && form.brand_products.length === 0) {
    addBrandProduct()
  }
}

const removeBrandProduct = (idx) => {
  form.brand_products.splice(idx, 1)
}

const addBrandService = () => {
  form.brand_services.push({ 
    '@type': 'Service',
    name: '', 
    description: '', 
    url: '' 
  })
}

const toggleBrandServices = () => {
  form.brand_show_services = !form.brand_show_services
  if (form.brand_show_services && form.brand_services.length === 0) {
    addBrandService()
  }
}

const addModule = () => {
  form.modules.push({
    schema_type_id: '',
    data: { items: [] }
  })
}

const removeModule = (idx) => {
  form.modules.splice(idx, 1)
}

const addProduct = (mIdx) => {
  form.modules[mIdx].data.items.push({ name: '', description: '', url: '' })
}

const removeProduct = (mIdx, pIdx) => {
  form.modules[mIdx].data.items.splice(pIdx, 1)
}

const removeService = (mIdx, sIdx) => {
  form.modules[mIdx].data.items.splice(sIdx, 1)
}

const addFAQItem = (mIdx) => {
  form.modules[mIdx].data.items.push({ name: '', description: '' })
}

const removeFAQItem = (mIdx, qIdx) => {
  form.modules[mIdx].data.items.splice(qIdx, 1)
}

const addHowToStep = (mIdx) => {
  form.modules[mIdx].data.items.push({ name: '', description: '', url: '' })
}

const removeHowToStep = (mIdx, sIdx) => {
  form.modules[mIdx].data.items.splice(sIdx, 1)
}

const setupLocalBusiness = (mIdx) => {
  form.modules[mIdx].data.items = [{
    address: '',
    city: '',
    region: '',
    country: 'Kenya',
    phone: '',
    price_range: '$$'
  }]
}

const getTypeName = (id) => props.schemaTypes.find(t => t.id === id)?.name || 'Custom'
const getTypeKey = (id) => props.schemaTypes.find(t => t.id === id)?.type_key || ''

const errors = ref({})

const nextStep = () => {
  errors.value = {}
  
  if (currentStep.value === 0) {
    if (!form.name || form.name.length < 3) {
      errors.value.name = "Assistant: 'I need a name for this schema (at least 3 characters).'"
    }
    if (!form.page_link || !form.page_link.startsWith('http')) {
      errors.value.page_link = "Assistant: 'Please provide a valid URL for the canonical link.'"
    }
    
    if (Object.keys(errors.value).length > 0) return
  }

  if (currentStep.value < 2) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const submit = () => {
  form.post('/schemas/automated')
}
</script>

<style scoped>
.transition-standard {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-from-bottom-4 { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-in { animation-fill-mode: both; }
</style>
