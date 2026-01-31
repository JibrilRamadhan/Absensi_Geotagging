<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AttendanceModal from '../../components/Attendance/AttendanceModal.vue'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useAuthStore } from '../../stores/authStore'
import Toast from '../../components/Allert/allert.vue'
import {
  Users,
  UserCheck,
  Clock,
  MapPin,
  MoreHorizontal,
  ArrowUpRight,
  Building2,
  Navigation,
  Calendar,
  TrendingUp,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next'

import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LTooltip, LCircle, LPopup } from '@vue-leaflet/vue-leaflet'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()
const toastRef = ref(null)
const gpsAccuracy = ref(0)
const watchId = ref(null)
const mapRef = ref(null)
const zoom = ref(16)
const isMounted = ref(false)
const userLocation = ref(null)
const officeLocation = ref(null)
const officeRadius = ref(100)
const gpsLoading = ref(true)

const showAttendanceModal = ref(false)
const attendanceType = ref('IN')
const isDarkMode = ref(false) // Deteksi dark mode untuk Map

// --- LOGIC MAP & GPS ---
const mapOptions = {
  zoomControl: false,
  attributionControl: false,
  dragging: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
}

// Deteksi perubahan tema browser/sistem untuk mengganti Tile Map
const updateTheme = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark')
}

// Tile Layer URL yang berubah sesuai tema
const tileLayerUrl = computed(() => {
  return isDarkMode.value
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' // Peta Gelap Premium
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' // Peta Terang
})

const getUserLocation = () => {
  gpsLoading.value = true
  if (navigator.geolocation) {
    watchId.value = navigator.geolocation.watchPosition(
      (pos) => {
        userLocation.value = [pos.coords.latitude, pos.coords.longitude]
        gpsAccuracy.value = Math.round(pos.coords.accuracy)
        gpsLoading.value = false
        if (!isMounted.value) fitMapBounds()
      },
      (err) => {
        console.error(err)
        toastRef.value?.addToast('Gagal update lokasi GPS', 'error')
        gpsLoading.value = false
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )
  } else {
    toastRef.value?.addToast('Browser tidak support GPS', 'error')
    gpsLoading.value = false
  }
}

const fitMapBounds = () => {
  if (userLocation.value && officeLocation.value && mapRef.value) {
    setTimeout(() => {
      const lat = (userLocation.value[0] + officeLocation.value[0]) / 2
      const lng = (userLocation.value[1] + officeLocation.value[1]) / 2
      zoom.value = 15
    }, 500)
  }
}

watch(
  () => attendanceStore.office,
  (newVal) => {
    if (newVal) {
      officeLocation.value = [parseFloat(newVal.latitude), parseFloat(newVal.longitude)]
      officeRadius.value = parseFloat(newVal.radius)
      fitMapBounds()
    }
  },
  { deep: true },
)

const canCheckIn = computed(() => !attendanceStore.alreadyCheckedIn)
const canCheckOut = computed(
  () => attendanceStore.alreadyCheckedIn && !attendanceStore.alreadyCheckedOut,
)

const metrics = computed(() => {
  const history = attendanceStore.history || []
  let present = 0,
    late = 0

  history.forEach((log) => {
    if (log.check_in) {
      present++
      const checkIn = new Date(log.check_in)
      if (checkIn.getHours() >= 9) late++
    }
  })

  return [
    {
      title: 'Total Hadir',
      value: present,
      icon: UserCheck,
      change: 'History',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'dark:border-blue-500/20',
      hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-500/20',
    },
    {
      title: 'Tepat Waktu',
      value: present - late,
      icon: CheckCircle2,
      change: 'On Time',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'dark:border-emerald-500/20',
      hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    },
    {
      title: 'Terlambat',
      value: late,
      icon: Clock,
      change: 'Late',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-500/10',
      borderColor: 'dark:border-rose-500/20',
      hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-500/20',
    },
  ]
})

const recentActivity = computed(() => {
  return attendanceStore.history.slice(0, 5).map((log) => ({
    user: 'Anda',
    action: log.check_out ? 'Check OUT' : 'Check IN',
    time: log.check_out
      ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : log.check_in
        ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '-',
    date: log.check_in
      ? new Date(log.check_in).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-',
    status: log.status,
    avatar: authStore.profileImage,
  }))
})

const currentTime = ref(
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
)
const currentDate = ref(
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const openAttendance = (type) => {
  if (type === 'IN' && !canCheckIn.value) return
  if (type === 'OUT' && !canCheckOut.value) return
  attendanceType.value = type
  showAttendanceModal.value = true
}

const handleSuccess = async (msg) => {
  toastRef.value.addToast(msg, 'success')
  await attendanceStore.fetchTodayStatus()
}
const handleError = (msg) => toastRef.value.addToast(msg, 'error')

onMounted(async () => {
  isMounted.value = true
  updateTheme()

  // Observer untuk mendeteksi perubahan class 'dark' di html
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, 1000)

  await Promise.all([
    authStore.fetchUser(),
    attendanceStore.fetchTodayStatus(),
    attendanceStore.fetchHistory(),
    attendanceStore.fetchMyOffice(),
  ])

  if (attendanceStore.office) {
    officeLocation.value = [
      parseFloat(attendanceStore.office.latitude),
      parseFloat(attendanceStore.office.longitude),
    ]
    officeRadius.value = parseFloat(attendanceStore.office.radius)
  }

  getUserLocation()
})

onUnmounted(() => {
  if (watchId.value !== null) navigator.geolocation.clearWatch(watchId.value)
})
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans transition-colors duration-500"
  >
    <Toast ref="toastRef" />

    <div class="relative overflow-hidden border-b border-slate-200/50 dark:border-white/5">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute -top-[20%] -left-[10%] w-[50%] h-[80%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse-slow"
        ></div>
        <div
          class="absolute top-[10%] right-[0%] w-[30%] h-[60%] bg-blue-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000"
        ></div>
      </div>

      <div class="relative px-6 pt-8 pb-8 max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div class="flex items-center gap-4">
            <div
              class="size-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-lg shadow-indigo-500/10 flex items-center justify-center hover:scale-105 hover:rotate-3 transition-all duration-300 cursor-pointer group"
            >
              <Zap
                class="text-indigo-600 dark:text-indigo-400 fill-indigo-600/20 group-hover:fill-indigo-600/40 transition-all duration-300"
                size="28"
              />
            </div>
            <div>
              <h1
                class="text-3xl font-black text-slate-900 dark:text-white tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-default"
              >
                Halo, {{ authStore.user?.name?.split(' ')[0] || 'User' }}!
              </h1>
              <p class="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                Siap produktif hari ini? 🚀
              </p>
            </div>
          </div>

          <div class="flex items-center gap-5 md:justify-end">
            <div class="text-right">
              <h2
                class="text-5xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none"
              >
                {{ currentTime }}
              </h2>
            </div>

            <div class="h-10 w-px bg-slate-200 dark:bg-zinc-800"></div>

            <div class="flex flex-col justify-center">
              <span
                class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5"
              >
                Hari Ini
              </span>
              <span class="text-sm font-medium text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                {{ currentDate }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-8 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-8">
          <!-- Action Cards with Enhanced Hover -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              @click="openAttendance('IN')"
              :disabled="!canCheckIn"
              class="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-300 border"
              :class="
                canCheckIn
                  ? 'border-transparent bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99]'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-zinc-900 opacity-100 cursor-not-allowed'
              "
            >
              <!-- Floating Particles Effect -->
              <div v-if="canCheckIn" class="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  class="absolute top-0 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-float-1"
                ></div>
                <div
                  class="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-float-2"
                ></div>
                <div
                  class="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-float-3"
                ></div>
              </div>

              <div
                v-if="!canCheckIn"
                class="absolute inset-0 opacity-50 dark:opacity-20 pattern-grid pointer-events-none"
              ></div>

              <div class="relative z-10">
                <div
                  class="size-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
                  :class="
                    canCheckIn
                      ? 'bg-white/20 backdrop-blur-md text-white group-hover:scale-105 group-hover:rotate-6'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600'
                  "
                >
                  <UserCheck size="28" />
                </div>

                <h3
                  class="text-2xl font-black mb-1 transition-transform duration-300"
                  :class="
                    canCheckIn
                      ? 'text-white group-hover:translate-x-1'
                      : 'text-slate-400 dark:text-zinc-500'
                  "
                >
                  {{ attendanceStore.alreadyCheckedIn ? 'Sudah Masuk' : 'Check IN' }}
                </h3>
                <p
                  class="text-sm font-medium transition-all duration-300"
                  :class="
                    canCheckIn
                      ? 'text-emerald-50 group-hover:translate-x-1'
                      : 'text-slate-400 dark:text-zinc-600'
                  "
                >
                  {{ canCheckIn ? 'Mulai sesi kerja anda' : 'Sesi aktif berjalan' }}
                </p>
              </div>

              <!-- Shine Effect on Hover -->
              <div
                v-if="canCheckIn"
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                ></div>
              </div>
            </button>

            <button
              @click="openAttendance('OUT')"
              :disabled="!canCheckOut"
              class="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-300 border"
              :class="
                canCheckOut
                  ? 'border-transparent bg-gradient-to-br from-orange-500 to-rose-600 shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99]'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-zinc-900 cursor-not-allowed'
              "
            >
              <!-- Floating Particles Effect -->
              <div v-if="canCheckOut" class="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  class="absolute top-0 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-float-1"
                ></div>
                <div
                  class="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-float-2"
                ></div>
                <div
                  class="absolute bottom-1/3 right-1/2 w-1 h-1 bg-white/25 rounded-full animate-float-3"
                ></div>
              </div>

              <div
                v-if="!canCheckOut"
                class="absolute inset-0 opacity-50 dark:opacity-20 pattern-grid pointer-events-none"
              ></div>

              <div class="relative z-10">
                <div
                  class="size-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
                  :class="
                    canCheckOut
                      ? 'bg-white/20 backdrop-blur-md text-white group-hover:scale-105 group-hover:rotate-6'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600'
                  "
                >
                  <XCircle size="28" />
                </div>

                <h3
                  class="text-2xl font-black mb-1 transition-transform duration-300"
                  :class="
                    canCheckOut
                      ? 'text-white group-hover:translate-x-1'
                      : 'text-slate-400 dark:text-zinc-500'
                  "
                >
                  {{ attendanceStore.alreadyCheckedOut ? 'Selesai' : 'Check OUT' }}
                </h3>
                <p
                  class="text-sm font-medium transition-all duration-300"
                  :class="
                    canCheckOut
                      ? 'text-orange-50 group-hover:translate-x-1'
                      : 'text-slate-400 dark:text-zinc-600'
                  "
                >
                  {{ canCheckOut ? 'Akhiri sesi kerja' : 'Belum saatnya pulang' }}
                </p>
              </div>

              <!-- Shine Effect on Hover -->
              <div
                v-if="canCheckOut"
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                ></div>
              </div>
            </button>
          </div>

          <!-- Statistics Cards with Enhanced Interactions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              v-for="(metric, i) in metrics"
              :key="i"
              class="relative bg-white dark:bg-zinc-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-300 group cursor-pointer hover:-translate-y-1"
            >
              <!-- Glow Effect -->
              <div
                class="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-xl"
                :class="metric.bgColor"
              ></div>

              <div class="relative z-10">
                <div class="flex items-start justify-between mb-4">
                  <div
                    :class="`size-10 rounded-xl ${metric.bgColor} ${metric.hoverBg} flex items-center justify-center border border-transparent ${metric.borderColor} group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`"
                  >
                    <component
                      :is="metric.icon"
                      :class="metric.color"
                      size="20"
                      class="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <h3
                  class="text-3xl font-black text-slate-900 dark:text-white mb-1 tabular-nums group-hover:scale-105 transition-transform duration-300 origin-left"
                >
                  {{ metric.value }}
                </h3>
                <p
                  class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors duration-300"
                >
                  {{ metric.title }}
                </p>
              </div>

              <!-- Decorative Corner -->
              <div
                class="absolute top-3 right-3 size-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"
              ></div>
            </div>
          </div>

          <!-- Recent Activity with Smooth Interactions -->
          <div
            class="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div class="flex items-center justify-between mb-6">
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 group cursor-pointer"
              >
                <TrendingUp
                  class="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 group-hover:scale-105"
                  size="20"
                />
                <span
                  class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                  >Aktivitas Terakhir</span
                >
              </h3>
              <button
                class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline hover:scale-105 transition-all duration-300"
              >
                View All
              </button>
            </div>

            <div class="space-y-4">
              <div
                v-if="recentActivity.length === 0"
                class="text-center py-8 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-slate-300 dark:hover:border-zinc-700 transition-colors duration-300"
              >
                <p class="text-slate-400 dark:text-zinc-600 text-sm">Belum ada aktivitas.</p>
              </div>

              <div
                v-for="(item, idx) in recentActivity"
                :key="idx"
                class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-300 cursor-pointer group hover:-translate-y-0.5"
              >
                <div class="relative">
                  <img
                    :src="item.avatar"
                    class="size-12 rounded-xl object-cover bg-slate-200 dark:bg-zinc-800 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300"
                  />
                  <div
                    class="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    :class="item.action.includes('IN') ? 'bg-emerald-500' : 'bg-orange-500'"
                  >
                    <component
                      :is="item.action.includes('IN') ? CheckCircle2 : XCircle"
                      class="text-white size-2.5"
                    />
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h5
                    class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                  >
                    {{ item.user }}
                  </h5>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    {{ item.action }} •
                    <span class="text-slate-400 dark:text-zinc-500">{{ item.time }}</span>
                  </p>
                </div>

                <div class="text-right flex items-center gap-2">
                  <span
                    class="text-[10px] font-bold px-2 py-1 rounded-md bg-white dark:bg-zinc-700 text-slate-500 dark:text-zinc-300 border border-slate-100 dark:border-zinc-600 group-hover:scale-105 transition-transform duration-300"
                  >
                    {{ item.date }}
                  </span>
                  <ArrowUpRight
                    class="text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                    size="16"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Map Card with Smooth Transitions -->
          <div
            class="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-3 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 group"
          >
            <div
              class="h-[420px] relative rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-zinc-950 isolate"
            >
              <div class="absolute top-4 left-4 right-4 z-[400]">
                <div
                  class="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200/50 dark:border-white/10 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300"
                >
                  <div class="flex items-center gap-3">
                    <span class="relative flex size-3">
                      <span
                        v-if="!gpsLoading"
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      ></span>
                      <span
                        class="relative inline-flex rounded-full size-3 transition-colors duration-300"
                        :class="gpsLoading ? 'bg-amber-500' : 'bg-emerald-500'"
                      ></span>
                    </span>
                    <div>
                      <p
                        class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-0.5"
                      >
                        Status GPS
                      </p>
                      <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-none">
                        {{ gpsLoading ? 'Mencari...' : 'Live Tracking' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="isMounted && userLocation"
                class="w-full h-full group-hover:scale-[1.01] transition-transform duration-300"
              >
                <l-map
                  ref="mapRef"
                  v-model:zoom="zoom"
                  :center="userLocation"
                  :options="mapOptions"
                  class="z-0 w-full h-full"
                >
                  <l-tile-layer :url="tileLayerUrl"></l-tile-layer>

                  <l-marker :lat-lng="userLocation">
                    <l-tooltip
                      :options="{ permanent: true, direction: 'top', offset: [0, -30] }"
                      class="custom-tooltip user-tooltip"
                    >
                      <div class="flex items-center gap-1.5"><Navigation size="12" /> Anda</div>
                    </l-tooltip>
                  </l-marker>

                  <l-marker v-if="officeLocation" :lat-lng="officeLocation">
                    <l-tooltip
                      :options="{ permanent: true, direction: 'bottom', offset: [0, 10] }"
                      class="custom-tooltip office-tooltip"
                    >
                      <div class="flex items-center gap-1.5"><Building2 size="12" /> Kantor</div>
                    </l-tooltip>
                  </l-marker>

                  <l-circle
                    v-if="officeLocation"
                    :lat-lng="officeLocation"
                    :radius="officeRadius"
                    color="#10b981"
                    :weight="1"
                    fill-color="#10b981"
                    :fill-opacity="0.2"
                  >
                  </l-circle>
                </l-map>
              </div>

              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-600"
              >
                <MapPin class="animate-bounce" size="32" />
                <span class="text-xs font-medium">Memuat Peta...</span>
              </div>
            </div>
          </div>

          <!-- Office Info Card with Enhanced Hover -->
          <div
            class="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <h3
              class="font-bold text-slate-900 dark:text-white mb-4 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-default"
            >
              Lokasi Absensi
            </h3>

            <div class="space-y-4">
              <div
                class="flex gap-4 group cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  class="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                >
                  <MapPin
                    class="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300"
                    size="18"
                  />
                </div>
                <div>
                  <p
                    class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                  >
                    Alamat Kantor
                  </p>
                  <p class="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-snug">
                    {{ attendanceStore.office?.address || 'Memuat...' }}
                  </p>
                </div>
              </div>

              <div
                class="flex gap-4 group cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  class="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                >
                  <Navigation
                    class="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300"
                    size="18"
                  />
                </div>
                <div>
                  <p
                    class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300"
                  >
                    Radius Izin
                  </p>
                  <p class="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    {{ attendanceStore.office?.radius || '...' }} Meter
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <p
                class="text-xs text-center text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors duration-300 cursor-default"
              >
                Pastikan GPS aktif & berada dalam radius.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AttendanceModal
      v-if="showAttendanceModal"
      :type="attendanceType"
      :initial-location="userLocation"
      :initial-accuracy="gpsAccuracy"
      @close="showAttendanceModal = false"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
/* Smooth Animations */
@keyframes float-1 {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) translateX(10px);
    opacity: 0.6;
  }
}

@keyframes float-2 {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-15px) translateX(-10px);
    opacity: 0.5;
  }
}

@keyframes float-3 {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.25;
  }
  50% {
    transform: translateY(-25px) translateX(5px);
    opacity: 0.55;
  }
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-float-1 {
  animation: float-1 3s ease-in-out infinite;
}

.animate-float-2 {
  animation: float-2 4s ease-in-out infinite;
}

.animate-float-3 {
  animation: float-3 3.5s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.pattern-grid {
  background-image: radial-gradient(#64748b 1px, transparent 1px);
  background-size: 20px 20px;
}

:deep(.custom-tooltip) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.custom-tooltip.user-tooltip div) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 5px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  transition: all 0.3s ease;
}

:deep(.custom-tooltip.user-tooltip div:hover) {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.7);
}

:deep(.custom-tooltip.office-tooltip div) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 5px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
  transition: all 0.3s ease;
}

:deep(.custom-tooltip.office-tooltip div:hover) {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.7);
}

:deep(.leaflet-tooltip-top:before),
:deep(.leaflet-tooltip-bottom:before) {
  display: none;
}
</style>
