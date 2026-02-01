<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  User,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-vue-next'
import api from '../../api/axios'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../../stores/themeStore'
import ConfirmModal from '@/components/Modal/ConfirmModal.vue'

const router = useRouter()
const themeStore = useThemeStore()

const user = ref(null)
const showDropdown = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const profileImage = computed(() => {
  if (!user.value?.profile_picture) {
    return `https://ui-avatars.com/api/?name=${user.value?.name || 'User'}&background=random`
  }
  return `${API_BASE}${user.value.profile_picture}`
})

const fetchProfile = async () => {
  try {
    const { data } = await api.get('/api/auth/me')
    user.value = data
  } catch (err) {
    console.error('Failed fetch profile', err)
  }
}

const showLogoutModal = ref(false)
const logoutLoading = ref(false)

const openLogoutModal = () => {
  showDropdown.value = false
  showLogoutModal.value = true
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    localStorage.removeItem('token')
    window.location.href = '/login'
  } finally {
    logoutLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  window.addEventListener('profile-updated', fetchProfile)
})

onUnmounted(() => {
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

      <div class="relative">
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
  <ConfirmModal
    :show="showLogoutModal"
    title="Konfirmasi Logout"
    message="Anda akan keluar dari sistem dan sesi akan diakhiri."
    confirm-text="Ya, Logout"
    cancel-text="Batal"
    :loading="logoutLoading"
    variant="danger"
    @confirm="confirmLogout"
    @cancel="showLogoutModal = false"
  />
</template>
