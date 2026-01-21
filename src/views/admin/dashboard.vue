<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import { Users, UserCheck, UserX, Building2, LogOut } from 'lucide-vue-next'
import Toast from '../../components/Allert/allert.vue'

const stats = ref({
  total_users: 0,
  present_today: 0,
  absent_today: 0,
  checked_out_today: 0,
  active_offices: 0,
})

const isLoading = ref(true)
const toastRef = ref(null)

const fetchDashboard = async () => {
  try {
    const { data } = await api.get('/api/admin/dashboard')
    stats.value = data
  } catch (error) {
    console.error(error)
    toastRef.value.addToast('Gagal memuat data dashboard', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 dark:bg-zinc-950 min-h-screen">
    <Toast ref="toastRef" />

    <Transition name="fade" appear>
      <div>
        <h1 class="text-3xl font-bold dark:text-white mb-2">Admin Dashboard</h1>
        <p class="text-gray-500 dark:text-zinc-400">Ringkasan aktivitas hari ini.</p>
      </div>
    </Transition>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 bg-white dark:bg-zinc-900 rounded-2xl animate-pulse"
      ></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div class="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Users class="text-blue-600 dark:text-blue-400" size="24" />
          </div>
          <span
            class="text-xs font-bold bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-gray-500"
            >Total</span
          >
        </div>
        <div>
          <h3 class="text-3xl font-bold dark:text-white mt-4">{{ stats.total_users }}</h3>
          <p class="text-sm text-gray-500">Anak Magang Terdaftar</p>
        </div>
      </div>

      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div class="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
            <UserCheck class="text-green-600 dark:text-green-400" size="24" />
          </div>
          <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md"
            >Live</span
          >
        </div>
        <div>
          <h3 class="text-3xl font-bold dark:text-white mt-4">{{ stats.present_today }}</h3>
          <p class="text-sm text-gray-500">Hadir Hari Ini</p>
        </div>
      </div>

      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div class="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
            <UserX class="text-red-600 dark:text-red-400" size="24" />
          </div>
          <span class="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md">Alert</span>
        </div>
        <div>
          <h3 class="text-3xl font-bold dark:text-white mt-4">{{ stats.absent_today }}</h3>
          <p class="text-sm text-gray-500">Belum Hadir</p>
        </div>
      </div>

      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div class="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
            <LogOut class="text-orange-600 dark:text-orange-400" size="24" />
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-bold dark:text-white mt-4">{{ stats.checked_out_today }}</h3>
          <p class="text-sm text-gray-500">Sudah Check-Out</p>
        </div>
      </div>

      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300 lg:col-span-4"
      >
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
            <Building2 class="text-purple-600 dark:text-purple-400" size="24" />
          </div>
          <div>
            <h3 class="text-2xl font-bold dark:text-white">{{ stats.active_offices }}</h3>
            <p class="text-sm text-gray-500">Lokasi Kantor Aktif</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
