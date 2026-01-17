<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Search, Mic, Bell, ChevronDown, LogOut, User } from 'lucide-vue-next'
import api from '../../api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const showDropdown = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL

const profileImage = computed(() => {
  if (!user.value?.profile_picture) {
    return `${API_BASE}/uploads/profiles/default-guest.png`
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

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
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
  <header class="flex items-center justify-between px-8 py-5 bg-gray-50 dark:bg-zinc-950">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      <p class="text-sm text-gray-400 font-medium mt-1">23 September, 2024</p>
    </div>

    <div class="hidden md:flex items-center gap-4 flex-1 max-w-xl mx-12">
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size="20" />
        <input
          type="text"
          placeholder="Search anything"
          class="w-full h-12 pl-12 pr-4 rounded-full bg-white dark:bg-zinc-900 border border-transparent focus:border-orange-200 focus:ring-4 focus:ring-orange-100 dark:focus:ring-zinc-800 outline-none text-sm shadow-sm transition-all"
        />
      </div>
      <button
        class="size-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm hover:shadow-md transition text-gray-500 dark:text-zinc-400"
      >
        <Mic size="20" />
      </button>
    </div>

    <div class="flex items-center gap-6">
      <button
        class="relative p-2 text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition"
      >
        <Bell size="22" />
        <span
          class="absolute top-2 right-2 size-2 bg-orange-500 rounded-full border-2 border-gray-50 dark:border-zinc-950"
        ></span>
      </button>

      <div class="flex items-center gap-3 pl-6 border-l dark:border-zinc-800 relative">
        <img
          :src="profileImage"
          class="size-10 rounded-full object-cover border shadow-sm cursor-pointer"
          @click="showDropdown = !showDropdown"
        />

        <div class="hidden lg:block text-right">
          <p class="text-sm font-bold text-gray-800 dark:text-white">
            {{ user?.name || 'Unknown' }}
          </p>
          <p class="text-xs text-gray-400 capitalize">
            {{ user?.role || '-' }}
          </p>
        </div>

        <ChevronDown size="16" class="text-gray-400" />

        <!-- DROPDOWN -->
        <transition name="fade">
          <div
            v-if="showDropdown"
            class="absolute right-0 top-14 w-48 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <button
              class="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm"
              @click="router.push('/profile')"
            >
              <User size="16" /> Profile
            </button>

            <button
              class="flex items-center gap-2 w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500"
              @click="logout"
            >
              <LogOut size="16" /> Logout
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>
