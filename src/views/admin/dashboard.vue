<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import { useAdminStore } from '../../stores/adminStore'
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  RefreshCw,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  Activity,
  ArrowUpRight,
  Award,
  Target,
} from 'lucide-vue-next'
import Toast from '../../components/Allert/allert.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const adminStore = useAdminStore()
const toastRef = ref(null)

const isLoading = ref(true)
const currentTime = ref(new Date())
const attendanceChartEl = ref(null)
const companyChartEl = ref(null)
const weekTrendChartEl = ref(null)
let attendanceChart = null
let companyChart = null
let weekTrendChart = null
let timeInterval = null

const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([adminStore.fetchAllUsers(), adminStore.fetchCompanies()])
    toastRef.value?.addToast('Data berhasil dimuat', 'success')
  } catch (error) {
    toastRef.value?.addToast('Gagal memuat data dashboard', 'error')
  } finally {
    isLoading.value = false
    nextTick(() => {
      updateCharts()
    })
  }
}

const dashboardData = computed(() => {
  const users = adminStore.allUsers || []
  const companies = adminStore.companies || []
  const interns = users.filter((u) => u.role === 'intern')
  const present = interns.filter((u) => u.check_in).length
  const absent = interns.length - present
  const activeOffices = companies.filter((c) => c.has_office && c.office_is_active).length
  const attendanceRate = interns.length > 0 ? Math.round((present / interns.length) * 100) : 0

  return {
    totalInterns: interns.length,
    present,
    absent,
    activeOffices,
    companiesCount: companies.length,
    attendanceRate,
  }
})

const statCards = computed(() => [
  {
    label: 'Total Peserta',
    sublabel: 'Magang Aktif',
    value: dashboardData.value.totalInterns,
    icon: Users,
    iconBg: 'bg-gray-100 dark:bg-zinc-800',
    iconColor: 'text-black dark:text-white',
    trend: '+12%',
    trendUp: true,
  },
  {
    label: 'Hadir Hari Ini',
    sublabel: `${dashboardData.value.attendanceRate}% Attendance`,
    value: dashboardData.value.present,
    icon: UserCheck,
    iconBg: 'bg-gray-100 dark:bg-zinc-800',
    iconColor: 'text-black dark:text-white',
    trend: '+8%',
    trendUp: true,
  },
  {
    label: 'Belum Hadir',
    sublabel: 'Perlu Tindak Lanjut',
    value: dashboardData.value.absent,
    icon: UserX,
    iconBg: 'bg-gray-100 dark:bg-zinc-800',
    iconColor: 'text-black dark:text-white',
    trend: '-4%',
    trendUp: false,
  },
  {
    label: 'Kantor Aktif',
    sublabel: 'Geofencing Enabled',
    value: dashboardData.value.activeOffices,
    icon: Building2,
    iconBg: 'bg-gray-100 dark:bg-zinc-800',
    iconColor: 'text-black dark:text-white',
    trend: '+2',
    trendUp: true,
  },
])

const liveAttendanceList = computed(() => {
  if (!Array.isArray(adminStore.allUsers)) return []

  return adminStore.allUsers
    .filter((u) => u?.role === 'intern' && u?.check_in)
    .sort((a, b) => new Date(b.check_in) - new Date(a.check_in))
    .slice(0, 8)
})

const topCompanies = computed(() => {
  const users = Array.isArray(adminStore.allUsers) ? adminStore.allUsers : []

  if (users.length === 0) return []

  const companyMap = Object.create(null)

  for (let i = 0; i < users.length; i++) {
    const u = users[i]

    if (u.role !== 'intern') continue

    const name = u.company_name ?? 'No Company'
    companyMap[name] = (companyMap[name] || 0) + 1
  }

  return Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
})

const updateCharts = () => {
  if (!attendanceChartEl.value || !companyChartEl.value) return

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#a1a1aa' : '#52525b'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'
  const fontFamily = '"DM Sans", system-ui, sans-serif'
  const primaryColor = isDark ? '#ffffff' : '#000000'
  const secondaryColor = isDark ? '#52525b' : '#d4d4d8'

  const present = dashboardData.value.present
  const absent = dashboardData.value.absent

  const donutOptions = {
    series: [present, absent],
    labels: ['Hadir', 'Belum Hadir'],
    chart: {
      type: 'donut',
      height: 280,
      background: 'transparent',
      fontFamily,
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
      },
    },
    colors: [primaryColor, secondaryColor],
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Magang',
              fontSize: '12px',
              color: textColor,
              formatter: () => present + absent,
            },
            value: {
              fontSize: '32px',
              fontWeight: 700,
              color: primaryColor,
              offsetY: 8,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      labels: { colors: textColor },
      fontSize: '13px',
      fontWeight: 500,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => `${val} orang`,
      },
    },
  }

  if (attendanceChart) attendanceChart.destroy()
  attendanceChart = new ApexCharts(attendanceChartEl.value, donutOptions)
  attendanceChart.render()

  const companyMap = {}
  adminStore.allUsers
    .filter((u) => u.role === 'intern')
    .forEach((u) => {
      const name = u.company_name || 'No Company'
      companyMap[name] = (companyMap[name] || 0) + 1
    })

  const companyNames = Object.keys(companyMap)
  const companyValues = Object.values(companyMap)

  const barOptions = {
    series: [{ name: 'Peserta', data: companyValues }],
    chart: {
      type: 'bar',
      height: 280,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily,
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    colors: [primaryColor],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        distributed: false,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: [textColor],
        fontWeight: 600,
      },
    },
    xaxis: {
      categories: companyNames,
      labels: {
        style: { colors: textColor, fontSize: '11px', fontWeight: 500 },
        rotate: -45,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: true,
      labels: { style: { colors: textColor, fontSize: '11px' } },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      padding: { top: 0, right: 10, bottom: 0, left: 10 },
    },
    legend: { show: false },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => `${val} peserta` },
    },
  }

  if (companyChart) companyChart.destroy()
  companyChart = new ApexCharts(companyChartEl.value, barOptions)
  companyChart.render()

  const weekTrendOptions = {
    series: [
      {
        name: 'Kehadiran',
        data: [65, 72, 68, 75, 70, 78, present],
      },
    ],
    chart: {
      type: 'area',
      height: 280,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily,
      sparkline: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: [primaryColor],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.2,
        opacityTo: 0.05,
        stops: [0, 100],
      },
      colors: [primaryColor],
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      labels: {
        style: { colors: textColor, fontSize: '11px', fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: true,
      labels: {
        style: { colors: textColor, fontSize: '11px' },
        formatter: (val) => Math.round(val),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      padding: { top: 10, right: 10, bottom: 0, left: 0 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => `${val} orang` },
    },
    colors: [primaryColor],
  }

  if (weekTrendChart) weekTrendChart.destroy()
  weekTrendChart = new ApexCharts(weekTrendChartEl.value, weekTrendOptions)
  weekTrendChart.render()
}

const getAvatar = (profilePicture) => {
  if (!profilePicture) return ''
  return profilePicture.startsWith('http') ? profilePicture : `${API_BASE_URL}${profilePicture}`
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatTime = (datetime) => {
  if (!datetime) return '-'
  const date = new Date(datetime)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatGreeting = () => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'Selamat Pagi Admin'
  if (hour < 15) return 'Selamat Siang Admin'
  if (hour < 18) return 'Selamat Sore Admin'
  return 'Selamat Malam Admin'
}

const formatCurrentTime = () => {
  return currentTime.value.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatCurrentDate = () => {
  return currentTime.value.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  await loadData()

  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  const observer = new MutationObserver(() => {
    setTimeout(updateCharts, 200)
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  if (attendanceChart) attendanceChart.destroy()
  if (companyChart) companyChart.destroy()
  if (weekTrendChart) weekTrendChart.destroy()
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 font-sans">
    <Toast ref="toastRef" />

    <div class="relative bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800">
      <div class="relative max-w-7xl mx-auto px-6 py-8">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div class="space-y-1">
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-4xl font-bold text-black dark:text-white tracking-tight">
                {{ formatGreeting() }}!
              </h1>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-lg font-medium">
              Selamat datang di Dashboard Monitoring Magang
            </p>
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                <span>{{ formatCurrentDate() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Clock class="w-4 h-4" />
                <span class="font-mono">{{ formatCurrentTime() }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="loadData"
              :disabled="isLoading"
              class="group relative px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="relative flex items-center gap-2">
                <RefreshCw :class="['w-5 h-5', { 'animate-spin': isLoading }]" />
                <span>{{ isLoading ? 'Loading...' : 'Refresh' }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(stat, idx) in statCards"
          :key="idx"
          class="group relative bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-zinc-700 dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        >
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-4">
              <div :class="`p-3 rounded-xl ${stat.iconBg} transition-transform duration-500`">
                <component :is="stat.icon" :class="`w-6 h-6 ${stat.iconColor}`" />
              </div>
              <div
                class="flex items-center gap-1 text-xs font-bold border border-gray-200 dark:border-zinc-700 px-2 py-1 rounded-lg"
              >
                <ArrowUpRight
                  :class="[
                    'w-3 h-3',
                    stat.trendUp ? 'text-black dark:text-white' : 'text-gray-400 rotate-90',
                  ]"
                />
                <span
                  :class="
                    stat.trendUp ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ stat.trend }}
                </span>
              </div>
            </div>

            <div v-if="isLoading" class="space-y-3">
              <div class="h-10 w-24 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
              <div class="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div v-else class="space-y-2">
              <div class="text-3xl font-bold text-black dark:text-white tracking-tight">
                {{ stat.value }}
              </div>
              <div class="space-y-0.5">
                <p class="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {{ stat.label }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  {{ stat.sublabel }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-zinc-700 dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        >
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold text-black dark:text-white">Kehadiran</h3>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Hari ini</p>
            </div>
            <div class="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <Activity class="w-5 h-5 text-black dark:text-white" />
            </div>
          </div>
          <div
            v-if="isLoading"
            class="h-[280px] bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"
          ></div>
          <div v-else ref="attendanceChartEl" class="min-h-[280px]"></div>
        </div>

        <div
          class="bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-zinc-700 dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        >
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold text-black dark:text-white">Tren Mingguan</h3>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">7 hari terakhir</p>
            </div>
            <div class="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <TrendingUp class="w-5 h-5 text-black dark:text-white" />
            </div>
          </div>
          <div
            v-if="isLoading"
            class="h-[280px] bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"
          ></div>
          <div v-else ref="weekTrendChartEl" class="min-h-[280px]"></div>
        </div>

        <div
          class="bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-zinc-700 dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        >
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-bold text-black dark:text-white">Top Perusahaan</h3>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Paling banyak peserta</p>
            </div>
            <div class="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <Award class="w-5 h-5 text-black dark:text-white" />
            </div>
          </div>

          <div v-if="isLoading" class="space-y-4">
            <div
              v-for="i in 5"
              :key="i"
              class="h-12 bg-gray-100 dark:bg-zinc-800/50 rounded-lg animate-pulse"
            ></div>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(company, idx) in topCompanies"
              :key="idx"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex items-center justify-center w-6 h-6 rounded bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                >
                  {{ idx + 1 }}
                </div>
                <div>
                  <p class="font-bold text-black dark:text-white text-sm">
                    {{ company.name }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-black dark:text-white">
                  {{ company.count }}
                </span>
                <Users class="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div v-if="topCompanies?.length === 0" class="text-center py-8 text-gray-400">
              <Building2 class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p class="text-sm">Belum ada data perusahaan</p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-black rounded-xl p-6 border border-gray-200 dark:border-zinc-700 dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-black dark:text-white">Distribusi Perusahaan</h3>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Sebaran peserta per perusahaan
            </p>
          </div>
          <div class="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            <Target class="w-5 h-5 text-black dark:text-white" />
          </div>
        </div>
        <div
          v-if="isLoading"
          class="h-[280px] bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse"
        ></div>
        <div v-else ref="companyChartEl" class="min-h-[280px]"></div>
      </div>

      <div
        class="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      >
        <div class="bg-black dark:bg-white p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-white/10 dark:bg-black/10 rounded-lg">
                <Clock class="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white dark:text-black">Live Attendance</h3>
                <p class="text-gray-400 dark:text-gray-600 text-sm mt-0.5">
                  Real-time check-in monitoring
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-black/10 rounded-full border border-white/20 dark:border-black/20"
            >
              <span class="relative flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-black opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-black"
                ></span>
              </span>
              <span class="text-white dark:text-black text-xs font-bold uppercase tracking-wider"
                >LIVE</span
              >
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead
              class="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800"
            >
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  Check-In
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Perusahaan
                </th>
                <th
                  class="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-zinc-800">
              <tr v-if="isLoading">
                <td colspan="4" class="px-6 py-12 text-center">
                  <div class="flex justify-center items-center gap-3 text-gray-400">
                    <RefreshCw class="animate-spin w-6 h-6" />
                    <span class="font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>

              <tr v-else-if="liveAttendanceList.length === 0">
                <td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-4 text-gray-400">
                    <Clock class="w-16 h-16 opacity-30" />
                    <div>
                      <p class="font-bold text-lg">Belum Ada Aktivitas</p>
                      <p class="text-sm mt-1">Belum ada peserta yang check-in hari ini</p>
                    </div>
                  </div>
                </td>
              </tr>

              <tr
                v-else
                v-for="(user, idx) in liveAttendanceList"
                :key="user.id"
                class="group hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all duration-300"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <div
                        class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                      >
                        <img
                          v-if="user.profile_picture"
                          :src="getAvatar(user.profile_picture)"
                          class="w-full h-full object-cover"
                        />
                        <div
                          v-else
                          class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400"
                        >
                          {{ getInitials(user.name) }}
                        </div>
                      </div>
                      <div
                        class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-black dark:bg-white border-2 border-white dark:border-black rounded-full"
                      ></div>
                    </div>
                    <div>
                      <p class="font-bold text-black dark:text-white text-sm">
                        {{ user.name }}
                      </p>
                      <p class="text-xs text-gray-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-gray-400" />
                    <span class="font-mono font-medium text-black dark:text-white text-sm">
                      {{ formatTime(user.check_in) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 hidden md:table-cell">
                  <div class="flex items-center gap-2">
                    <Building2 class="w-4 h-4 text-gray-400" />
                    <span
                      class="text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-[200px]"
                    >
                      {{ user.company_name || 'Global' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="user.check_out"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                  >
                    Selesai
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-black dark:border-white text-black dark:text-white"
                  >
                    <span class="relative flex h-2 w-2">
                      <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-75"
                      ></span>
                      <span
                        class="relative inline-flex rounded-full h-1.5 w-1.5 bg-black dark:bg-white"
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
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

* {
  font-family:
    'DM Sans',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark ::-webkit-scrollbar-thumb {
  background: #3f3f46;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
