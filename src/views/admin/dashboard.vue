<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { useAdminStore } from '../../stores/adminStore'
import { Users, UserCheck, AlertCircle, Building2, Clock, MapPin, RefreshCw } from 'lucide-vue-next'
import Toast from '../../components/Allert/allert.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const adminStore = useAdminStore()
const toastRef = ref(null)
const isLoading = ref(true)
const attendanceChartEl = ref(null)
const companyChartEl = ref(null)
let attendanceChart = null
let companyChart = null
let resizeObserver = null

const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([adminStore.fetchUsers(), adminStore.fetchCompanies()])
  } catch (error) {
    toastRef.value?.addToast('Gagal memuat data dashboard', 'error')
  } finally {
    isLoading.value = false
    nextTick(initCharts)
  }
}

// --- Computed Stats ---
const stats = computed(() => {
  const users = adminStore.users
  const companies = adminStore.companies

  // Hitung data real
  const totalUsers = users.length
  const present = users.filter((u) => u.check_in_at).length
  const absent = users.filter((u) => u.role === 'intern' && !u.check_in_at).length
  const activeOffices = companies.filter((c) => c.has_office).length

  return [
    {
      label: 'Total Interns',
      value: totalUsers,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Hadir Hari Ini',
      value: present,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Belum Hadir',
      value: absent,
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      label: 'Kantor Aktif',
      value: activeOffices,
      icon: Building2,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ]
})

const liveAttendance = computed(() => {
  return adminStore.users
    .filter((u) => u.check_in_at)
    .sort((a, b) => new Date(b.check_in_at) - new Date(a.check_in_at))
})

// --- Helpers ---
const getAvatar = (path) =>
  path ? (path.startsWith('http') ? path : `${API_BASE_URL}${path}`) : null
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U'
const formatTime = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '-'

// --- Chart Logic ---
const initCharts = () => {
  if (!attendanceChartEl.value || !companyChartEl.value) return

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#a1a1aa' : '#64748b'
  const fontFamily = 'Inter, sans-serif'

  // 1. Attendance Donut Chart
  const presentCount = stats.value[1].value
  const absentCount = stats.value[2].value

  if (attendanceChart) attendanceChart.destroy()
  attendanceChart = new ApexCharts(attendanceChartEl.value, {
    series: [presentCount, absentCount],
    labels: ['Hadir', 'Absen'],
    chart: {
      type: 'donut',
      height: 280,
      background: 'transparent',
      fontFamily,
    },
    colors: ['#10b981', '#f43f5e'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: textColor,
              fontSize: '14px',
              fontWeight: 500,
              formatter: () => presentCount + absentCount,
            },
            value: {
              color: isDark ? '#fff' : '#0f172a',
              fontSize: '24px',
              fontWeight: 700,
              offsetY: 2,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: textColor } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  })
  attendanceChart.render()

  // 2. Company Distribution Bar Chart
  const companyCounts = {}
  adminStore.users.forEach((u) => {
    if (u.role === 'intern') {
      const name = u.company_name || 'Unassigned'
      companyCounts[name] = (companyCounts[name] || 0) + 1
    }
  })

  if (companyChart) companyChart.destroy()
  companyChart = new ApexCharts(companyChartEl.value, {
    series: [{ name: 'Interns', data: Object.values(companyCounts) }],
    chart: {
      type: 'bar',
      height: 280,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily,
    },
    colors: ['#6366f1'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '45%', distributed: true },
    },
    xaxis: {
      categories: Object.keys(companyCounts),
      labels: { style: { colors: textColor, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: {
      borderColor: isDark ? '#27272a' : '#f1f5f9',
      strokeDashArray: 4,
    },
    legend: { show: false },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  })
  companyChart.render()
}

// --- Lifecycle ---
onMounted(async () => {
  await loadData()

  // Auto-refresh chart jika tema berubah atau window resize
  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(initCharts)
  })
  resizeObserver.observe(document.body)
})

onUnmounted(() => {
  if (attendanceChart) attendanceChart.destroy()
  if (companyChart) companyChart.destroy()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div
    class="p-6 min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans transition-colors duration-300"
  >
    <Toast ref="toastRef" />

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Pantau aktivitas kehadiran dan statistik peserta magang.
        </p>
      </div>
      <button
        @click="loadData"
        class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
      >
        <RefreshCw size="16" :class="{ 'animate-spin': isLoading }" />
        Refresh Data
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="(stat, idx) in stats"
        :key="idx"
        class="bg-white dark:bg-[#121212] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/60 hover:border-gray-200 dark:hover:border-zinc-700 transition-all duration-300 group"
      >
        <div class="flex justify-between items-start mb-4">
          <div :class="`p-3 rounded-xl ${stat.bg}`">
            <component :is="stat.icon" :class="`w-6 h-6 ${stat.color}`" />
          </div>
          <div
            v-if="isLoading"
            class="h-8 w-12 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse"
          ></div>
          <span v-else class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{
            stat.value
          }}</span>
        </div>
        <p
          class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
        >
          {{ stat.label }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1 space-y-8">
        <div
          class="bg-white dark:bg-[#121212] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/60"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6">Persentase Kehadiran</h3>
          <div
            v-if="isLoading"
            class="h-[280px] bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse"
          ></div>
          <div v-else ref="attendanceChartEl"></div>
        </div>

        <div
          class="bg-white dark:bg-[#121212] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/60"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Distribusi per Perusahaan
          </h3>
          <div
            v-if="isLoading"
            class="h-[280px] bg-gray-100 dark:bg-zinc-900 rounded-xl animate-pulse"
          ></div>
          <div v-else ref="companyChartEl"></div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div
          class="bg-white dark:bg-[#121212] rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800/60 overflow-hidden flex flex-col h-full"
        >
          <div
            class="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center"
          >
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Live Attendance</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Real-time update hari ini</p>
            </div>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {{ liveAttendance.length }} Hadir
            </span>
          </div>

          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse">
              <thead
                class="bg-gray-50/50 dark:bg-zinc-800/30 text-gray-400 text-xs uppercase font-semibold"
              >
                <tr>
                  <th class="px-6 py-4">User</th>
                  <th class="px-6 py-4">Check In</th>
                  <th class="px-6 py-4 hidden md:table-cell">Kantor</th>
                  <th class="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
                <tr v-if="isLoading">
                  <td colspan="4" class="px-6 py-4">
                    <div class="flex gap-4 animate-pulse">
                      <div class="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
                      <div class="flex-1 space-y-2 py-1">
                        <div class="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
                        <div class="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/3"></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="liveAttendance.length === 0">
                  <td colspan="4" class="px-6 py-12 text-center text-gray-400">
                    <div class="flex flex-col items-center gap-2">
                      <Clock size="32" class="opacity-20" />
                      <p>Belum ada yang check-in hari ini.</p>
                    </div>
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="user in liveAttendance"
                  :key="user.id"
                  class="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"
                      >
                        <img
                          v-if="user.profile_picture"
                          :src="getAvatar(user.profile_picture)"
                          class="w-full h-full object-cover"
                        />
                        <span v-else class="text-xs font-bold text-gray-400">{{
                          getInitials(user.name)
                        }}</span>
                      </div>
                      <div>
                        <p
                          class="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                        >
                          {{ user.name }}
                        </p>
                        <p class="text-xs text-gray-500">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div
                      class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium"
                    >
                      <Clock size="14" class="text-emerald-500" />
                      {{ formatTime(user.check_in_at) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 hidden md:table-cell">
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 size="14" class="text-indigo-500" />
                      <span class="truncate max-w-[150px]">{{ user.company_name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      v-if="user.check_out_at"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400"
                    >
                      Pulang
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      <span class="relative flex h-2 w-2">
                        <span
                          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                        ></span>
                        <span
                          class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                        ></span>
                      </span>
                      Aktif
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
