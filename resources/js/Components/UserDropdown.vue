<template>
  <div class="relative" ref="dropdownRef">
    <button 
      @click="isOpen = !isOpen"
      class="flex items-center space-x-3 focus:outline-none group"
    >
      <div class="text-right block">
        <p class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{{ $page.props.auth?.user?.name }}</p>
        <p class="text-xs text-slate-500">{{ $page.props.auth?.user?.email }}</p>
      </div>
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:shadow-md transition-all overflow-hidden">
        <img 
          v-if="$page.props.auth.user.profile_photo_url" 
          :src="$page.props.auth.user.profile_photo_url" 
          :alt="$page.props.auth.user.name"
          class="w-full h-full object-cover"
        />
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right"
      >
        <div class="px-4 py-3 border-b border-slate-50 mb-2">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Account</p>
        </div>

        <Link 
          href="/profile" 
          class="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium flex items-center gap-2"
          @click="isOpen = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </Link>
        
        <Link 
          href="/settings" 
          class="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium flex items-center gap-2"
          @click="isOpen = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>

        <div class="border-t border-slate-100 my-2"></div>

        <Link 
          href="/logout" 
          method="post" 
          as="button"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold flex items-center gap-2"
          @click="isOpen = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </Link>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Link } from '@inertiajs/vue3'

const isOpen = ref(false)
const dropdownRef = ref(null)

const closeOnClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside)
})
</script>
