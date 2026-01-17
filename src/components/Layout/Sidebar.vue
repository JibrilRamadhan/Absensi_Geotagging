<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import SidebarItem from './SidebarItem.vue'
import {
  ChevronLeft,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  FileClock,
  MapPin,
  UserCircle,
  Users,
  Settings,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(false)
const darkMode = ref(false)
const userRole = computed(() => authStore.user?.role)

onMounted(() => {
  darkMode.value = document.documentElement.classList.contains('dark')
})

const menuItems = computed(() => {
  if (userRole.value === 'admin') {
    return [
      { icon: 'LayoutDashboard', label: 'Admin Panel', path: '/admin/dashboard' },
      { icon: 'Users', label: 'Manage Users', path: '/admin/manage-users' },
      { icon: 'UserCircle', label: 'My Profile', path: '/profile' },
    ]
  } else {
    return [
      { icon: 'LayoutDashboard', label: 'Home Dashboard', path: '/dashboard' },
      { icon: 'UserCircle', label: 'My Profile', path: '/profile' },
    ]
  }
})

const toggleTheme = () => {
  const html = document.documentElement
  if (html.classList.contains('dark')) {
    html.classList.remove('dark')
    darkMode.value = false
    localStorage.setItem('theme', 'light')
  } else {
    html.classList.add('dark')
    darkMode.value = true
    localStorage.setItem('theme', 'dark')
  }
}

const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <aside
    :class="[
      'relative z-30 h-screen shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out font-sans',
      collapsed ? 'w-[84px]' : 'w-[280px]',
      'bg-white dark:bg-zinc-900 dark:border-zinc-800 border-gray-100',
    ]"
  >
    <div class="flex items-center justify-between px-6 py-6">
      <div class="flex items-center gap-3 overflow-hidden">
        <img
          src="/image/icon.png"
          alt="GEOTAG Logo"
          class="shrink-0"
          :class="collapsed ? 'w-9 h-9' : 'w-14 h-14'"
        />
        <span v-show="!collapsed" class="text-xl font-bold whitespace-nowrap dark:text-white">
          GeoTAG
        </span>
      </div>

      <button
        @click="collapsed = !collapsed"
        class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-gray-400"
      >
        <ChevronLeft
          size="20"
          class="transition-transform duration-300"
          :class="collapsed && 'rotate-180'"
        />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <p
        v-show="!collapsed"
        class="px-6 text-xs font-bold text-black dark:text-zinc-500 mb-4 uppercase tracking-wider"
      >
        Menu
      </p>

      <nav class="flex flex-col gap-2 px-4 mb-4">
        <SidebarItem
          v-for="item in menuItems"
          :key="item.path"
          :icon="item.icon"
          :label="item.label"
          :collapsed="collapsed"
          :active="route.path === item.path"
          @click="router.push(item.path)"
        />

        <div
          v-if="userRole !== 'admin' && !collapsed"
          class="mt-4 mx-2 p-5 rounded-3xl bg-gradient-to-b from-orange-400 to-orange-600 text-white"
        >
          <p class="text-[10px] opacity-80">Today's Work</p>
          <h4 class="text-xl font-bold">08h : 45m</h4>
          <button
            class="mt-3 w-full py-2 bg-white text-orange-600 rounded-xl text-[10px] font-bold"
          >
            Check Out
          </button>
        </div>
      </nav>

      <div class="px-4 pb-6 space-y-2">
        <div class="h-[1px] bg-gray-100 dark:bg-zinc-800 mx-2 mb-4"></div>
        <SidebarItem icon="Settings" label="Settings" :collapsed="collapsed" />

        <button
          @click="toggleTheme"
          class="flex items-center h-11 w-full rounded-xl px-3 gap-3 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
        >
          <Sun v-if="darkMode" size="20" class="text-orange-400" />
          <Moon v-else size="20" />
          <span v-show="!collapsed" class="text-sm font-medium">Theme</span>
        </button>

        <button @click="handleLogout" class="w-full">
          <SidebarItem icon="LogOut" label="Log out" :collapsed="collapsed" />
        </button>
      </div>
    </div>
  </aside>
</template>
