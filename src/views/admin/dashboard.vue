<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import { useAdminStore, API_BASE_URL } from '../../stores/adminStore'
import { Users, UserCheck, UserX, Building2, Clock, MapPin } from 'lucide-vue-next'
import Toast from '../../components/Allert/allert.vue'

const adminStore = useAdminStore()
const toastRef = ref(null)
const isLoading = ref(true)
const attendanceChartEl = ref(null)
const companyChartEl = ref(null)
let attendanceChart = null
let companyChart = null
let themeObserver = null

const stats = computed(() => {
  const users = adminStore.users
  const companies = adminStore.companies
  return {
    total_users: users.length,
    present_today: users.filter((u) => u.check_in_at).length,
    absent_today: users.filter((u) => u.role === 'intern' && !u.check_in_at).length,
    active_offices: companies.filter((c) => c.has_office).length,
  }
})

const presentUsers = computed(() => {
  return adminStore.users
    .filter((u) => u.check_in_at)
    .sort((a, b) => new Date(b.check_in_at) - new Date(a.check_in_at))
})

const getAvatarUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'
const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

const initCharts = () => {
  if (attendanceChart) attendanceChart.destroy()
  if (companyChart) companyChart.destroy()

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#a1a1aa' : '#6b7280'
  const gridColor = isDark ? '#27272a' : '#f3f4f6'

  // Donut Chart - Attendance
  const attendanceOptions = {
    series: [stats.value.present_today, stats.value.absent_today],
    labels: ['Hadir', 'Belum Hadir'],
    chart: {
      type: 'donut',
      height: 320,
      background: 'transparent',
      fontFamily: 'inherit',
    },
    colors: ['#22c55e', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Interns',
              color: isDark ? '#fff' : '#374151',
              formatter: () => stats.value.present_today + stats.value.absent_today,
            },
            value: {
              color: isDark ? '#fff' : '#374151',
              fontSize: '24px',
              fontWeight: 600,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      labels: { colors: textColor },
    },
    stroke: { show: false },
    theme: { mode: isDark ? 'dark' : 'light' },
  }

  if (attendanceChartEl.value) {
    attendanceChart = new ApexCharts(attendanceChartEl.value, attendanceOptions)
    attendanceChart.render()
  }

  // Bar Chart - Company Distribution
  const companyCounts = {}
  adminStore.users.forEach((u) => {
    if (u.role === 'intern') {
      const name = u.company_name || 'No Company'
      companyCounts[name] = (companyCounts[name] || 0) + 1
    }
  })

  const companyOptions = {
    series: [{ name: 'Interns', data: Object.values(companyCounts) }],
    chart: {
      type: 'bar',
      height: 320,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#f97316'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%' },
    },
    xaxis: {
      categories: Object.keys(companyCounts),
      labels: { style: { colors: textColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: textColor } },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    theme: { mode: isDark ? 'dark' : 'light' },
  }

  if (companyChartEl.value) {
    companyChart = new ApexCharts(companyChartEl.value, companyOptions)
    companyChart.render()
  }
}

onMounted(async () => {
  isLoading.value = true
  await Promise.all([adminStore.fetchUsers(), adminStore.fetchCompanies()])
  isLoading.value = false
  nextTick(() => {
    initCharts()
    themeObserver = new MutationObserver(() => initCharts())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })
})

onUnmounted(() => {
  if (attendanceChart) attendanceChart.destroy()
  if (companyChart) companyChart.destroy()
  if (themeObserver) themeObserver.disconnect()
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
          <p class="text-sm text-gray-500">Total Users</p>
        </div>
      </div>

      <div
        class="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 flex flex-col justify-between hover:-translate-y-1 transition duration-300"
      >
        <div class="flex justify-between items-start">
          <div class="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
            <UserCheck class="text-green-600 dark:text-green-400" size="24" />
          </div>
          <span
            class="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md"
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
          <span
            class="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-md"
            >Alert</span
          >
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
          <div class="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
            <Building2 class="text-purple-600 dark:text-purple-400" size="24" />
          </div>
          <span
            class="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md"
            >Active</span
          >
        </div>
        <div>
          <h3 class="text-3xl font-bold dark:text-white mt-4">{{ stats.active_offices }}</h3>
          <p class="text-sm text-gray-500">Kantor Terdaftar</p>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border dark:border-zinc-800">
        <h3 class="text-lg font-bold dark:text-white mb-4">Statistik Kehadiran</h3>
        <div ref="attendanceChartEl"></div>
      </div>
      <div
        class="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border dark:border-zinc-800"
      >
        <h3 class="text-lg font-bold dark:text-white mb-4">Distribusi Peserta Magang</h3>
        <div ref="companyChartEl"></div>
      </div>
    </div>

    <!-- Live Attendance Section -->
    <div
      class="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 overflow-hidden"
    >
      <div class="p-6 border-b dark:border-zinc-800 flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold dark:text-white">Live Attendance Monitor</h2>
          <p class="text-sm text-gray-500">Daftar kehadiran real-time hari ini.</p>
        </div>
        <span
          class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full animate-pulse"
        >
          {{ presentUsers.length }} Online
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead
            class="bg-gray-50 dark:bg-zinc-800/50 text-gray-400 text-xs uppercase font-semibold"
          >
            <tr>
              <th class="px-6 py-4">User</th>
              <th class="px-6 py-4">Check In</th>
              <th class="px-6 py-4">Location</th>
              <th class="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
            <tr v-if="presentUsers.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-gray-500 italic">
                Belum ada yang hadir hari ini.
              </td>
            </tr>
            <tr
              v-for="user in presentUsers"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.profile_picture"
                    :src="getAvatarUrl(user.profile_picture)"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <span class="font-medium dark:text-gray-200">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size="14" class="text-green-500" />
                  {{ formatTime(user.check_in_at) }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 size="14" class="text-blue-500" />
                  {{ user.company_name || 'Unknown Office' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="user.check_out_at"
                  class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  >Checked Out</span
                >
                <span
                  v-else
                  class="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1 w-fit"
                >
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Working
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
