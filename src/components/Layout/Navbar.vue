<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ChevronRight, LogOut, User, Sun, Moon } from 'lucide-vue-next'
import api from '../../api/axios'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../../stores/themeStore'

const router = useRouter()
const themeStore = useThemeStore()

const user = ref(null)
const showDropdown = ref(false)

// logout modal state
const showLogoutModal = ref(false)
const logoutLoading = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL

const currentDate = computed(() =>
  new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const profileImage = computed(() => {
  if (!user.value?.profile_picture) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.name || 'User')}`
  }

  if (user.value.profile_picture.startsWith('http')) {
    return user.value.profile_picture
  }

  return `${API_BASE.replace(/\/$/, '')}/${user.value.profile_picture.replace(/^\//, '')}`
})

const fetchProfile = async () => {
  try {
    const { data } = await api.get('/api/auth/me')
    user.value = data
  } catch (err) {
    console.error('Failed fetch profile', err)
  }
}

const openLogoutModal = () => {
  showDropdown.value = false
  showLogoutModal.value = true
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    localStorage.removeItem('token')
    router.replace('/login')
  } finally {
    logoutLoading.value = false
    showLogoutModal.value = false
  }
}

// click outside dropdown
const handleClickOutside = (e) => {
  if (!e.target.closest('.profile-dropdown')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  fetchProfile()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('profile-updated', fetchProfile)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('profile-updated', fetchProfile)
})
</script>

<template>
  <header
    class="flex flex-col md:flex-row items-center justify-between px-8 py-5 bg-gray-50 dark:bg-zinc-950 gap-4 md:gap-0"
  >
    <div class="w-full md:w-auto text-center md:text-left">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Dashboard</h1>
      <p class="text-sm text-gray-400 font-medium mt-1">{{ currentDate }}</p>
    </div>

    <!-- <div class="flex items-center gap-3 w-full md:max-w-md lg:max-w-lg mx-auto md:px-6">
      <div class="relative flex-1 group">
        <Search
          class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors"
          size="20"
        />
        <input
          type="text"
          placeholder="Search anything"
          class="w-full h-12 pl-12 pr-4 rounded-full bg-white dark:bg-zinc-900 border-none outline-none text-sm text-gray-600 dark:text-gray-200 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-orange-100 transition-all"
        />
      </div>

      <button
        class="size-12 shrink-0 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-gray-50 transition text-gray-500 dark:text-zinc-400"
        title="Settings"
      >
        <SlidersHorizontal size="20" />
      </button>
    </div> -->

    <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-center md:justify-end">
      <div class="hidden sm:flex bg-white dark:bg-zinc-900 rounded-full p-1 shadow-sm items-center">
        <button
          @click="themeStore.toggleTheme()"
          class="p-1.5 rounded-full transition-all"
          :class="!themeStore.isDarkMode ? 'bg-black text-white' : 'text-gray-400'"
        >
          <Sun size="18" />
        </button>
        <button
          @click="themeStore.toggleTheme()"
          class="p-1.5 rounded-full transition-all"
          :class="themeStore.isDarkMode ? 'bg-white text-black' : 'text-gray-400'"
        >
          <Moon size="18" />
        </button>
      </div>

      <!-- <button
        class="relative size-12 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:shadow-md transition text-gray-500 dark:text-zinc-400"
      >
        <Bell size="22" />
        <span
          class="absolute top-3 right-3 size-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-900"
        ></span>
      </button> -->

      <div class="relative profile-dropdown">
        <div
          class="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-full pl-1 pr-4 py-1 shadow-sm cursor-pointer hover:shadow-md transition select-none"
          @click="showDropdown = !showDropdown"
        >
          <img
            :src="profileImage"
            class="size-10 rounded-full object-cover border border-gray-100 dark:border-zinc-800"
            alt="Profile"
          />

          <div class="hidden lg:block text-left">
            <p class="text-sm font-bold text-gray-800 dark:text-white leading-tight">
              {{ user?.name || 'Loading...' }}
            </p>
            <p class="text-xs text-gray-400 capitalize mt-0.5">
              {{ user?.role || 'Guest' }}
            </p>
          </div>

          <ChevronRight size="18" class="text-gray-400 ml-1" />
        </div>

        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div
            v-if="showDropdown"
            class="absolute right-0 top-14 w-48 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div class="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 lg:hidden">
              <p class="text-sm font-bold text-gray-800 dark:text-white">{{ user?.name }}</p>
              <p class="text-xs text-gray-500">{{ user?.role }}</p>
            </div>

            <button
              class="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200 transition"
              @click="router.push('/profile')"
            >
              <User size="16" /> Profile
            </button>

            <button
              class="flex items-center gap-2 w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 transition"
              @click="openLogoutModal"
            >
              <LogOut size="16" /> Logout
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
  <!-- Logout Confirmation Modal -->
<transition
  enter-active-class="transition duration-200 ease-out"
  enter-from-class="opacity-0 scale-95"
  enter-to-class="opacity-100 scale-100"
  leave-active-class="transition duration-150 ease-in"
  leave-from-class="opacity-100 scale-100"
  leave-to-class="opacity-0 scale-95"
>
  <div
    v-if="showLogoutModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-xl"
    >
      <h3 class="text-lg font-bold text-gray-800 dark:text-white">
        Konfirmasi Logout
      </h3>
      <p class="text-sm text-gray-500 mt-2">
        Anda akan keluar dari sistem dan sesi akan diakhiri.
      </p>

      <div class="flex justify-end gap-3 mt-6">
        <button
          class="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
          :disabled="logoutLoading"
          @click="showLogoutModal = false"
        >
          Batal
        </button>

        <button
          class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-2"
          :disabled="logoutLoading"
          @click="confirmLogout"
        >
          <span v-if="logoutLoading">Keluar...</span>
          <span v-else>Ya, Logout</span>
        </button>
      </div>
    </div>
  </div>
</transition>
</template>
