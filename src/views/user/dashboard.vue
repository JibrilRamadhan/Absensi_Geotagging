<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import AttendanceModal from '../../components/Attendance/AttendanceModal.vue'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useAuthStore } from '../../stores/authStore'
import { useLocationStore } from '../../stores/locationStore'
import { useThemeStore } from '../../stores/themeStore'
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
  Maximize2,
  Minimize2,
  Layers,
  Target,
} from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LTooltip, LCircle, LPopup } from '@vue-leaflet/vue-leaflet'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const themeStore = useThemeStore()
const toastRef = ref(null)
const mapRef = ref(null)
const zoom = ref(16)
const isMounted = ref(false)
const officeLocation = ref(null)
const officeRadius = ref(100)
const isMapExpanded = ref(false)
const currentMapStyle = ref('default')
const JAM_MASUK_KANTOR = 9
const JAM_PERINGATAN_CHECKOUT = 18
const JAM_AUTO_CLOSE = 23

const userLocation = computed(() => {
  if (locationStore.coords.latitude && locationStore.coords.longitude) {
    return [locationStore.coords.latitude, locationStore.coords.longitude]
  }
  return null
})
const gpsAccuracy = computed(() => locationStore.accuracy)
const gpsLoading = computed(() => !locationStore.isReady)

const showAttendanceModal = ref(false)
const attendanceType = ref('IN')

const mapOptions = {
  zoomControl: false,
  attributionControl: false,
  dragging: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
}

const userCustomIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-full h-full">
      <div class="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
      <div class="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse-slow"></div>
      <div class="relative">
        <div class="absolute -inset-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-md opacity-60"></div>
        <div class="relative w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 border-3 border-white rounded-full shadow-xl flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

const officeCustomIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-full h-full group">
      <div class="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg"></div>
      <div class="relative">
        <div class="absolute -inset-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl blur-md opacity-40"></div>
        <div class="relative w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-emerald-500 overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10 text-emerald-600 dark:text-emerald-400">
            <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/>
          </svg>
        </div>
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-r-2 border-b-2 border-emerald-500"></div>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 50],
  popupAnchor: [0, -54],
})

const mapStyles = [
  {
    id: 'default',
    name: 'Default',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    preview: 'bg-gradient-to-br from-slate-100 to-slate-200',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    preview: 'bg-gradient-to-br from-green-900 to-blue-900',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    preview: 'bg-gradient-to-br from-amber-100 to-green-100',
  },
]

const tileLayerUrl = computed(() => {
  const style = mapStyles.find((s) => s.id === currentMapStyle.value)
  if (style?.id === 'default') {
    return themeStore.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  }
  return style ? style.url : mapStyles[0].url
})

const fitMapBounds = () => {
  if (userLocation.value && officeLocation.value && mapRef.value) {
    setTimeout(() => {
      const lat = (userLocation.value[0] + officeLocation.value[0]) / 2
      const lng = (userLocation.value[1] + officeLocation.value[1]) / 2
      zoom.value = 15
    }, 500)
  }
}

const centerOnUser = () => {
  if (userLocation.value && mapRef.value?.leafletObject) {
    mapRef.value.leafletObject.flyTo(userLocation.value, 18)
  }
}

const centerOnOffice = () => {
  if (officeLocation.value && mapRef.value?.leafletObject) {
    mapRef.value.leafletObject.flyTo(officeLocation.value, 18)
  }
}

const hasFittedMap = ref(false)
watch([userLocation, officeLocation], ([uLoc, oLoc]) => {
  if (uLoc && oLoc && !hasFittedMap.value) {
    fitMapBounds()
    hasFittedMap.value = true
  }
})

watch(isMapExpanded, async () => {
  await nextTick()

  if (mapRef.value && mapRef.value.leafletObject) {
    setTimeout(() => {
      mapRef.value.leafletObject.invalidateSize()
    }, 500)
  }
})

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
      if (checkIn.getHours() >= JAM_MASUK_KANTOR) late++
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

const showLateCheckoutWarning = computed(() => {
  const now = new Date()
  return (
    attendanceStore.alreadyCheckedIn &&
    !attendanceStore.alreadyCheckedOut &&
    now.getHours() >= JAM_PERINGATAN_CHECKOUT
  )
})

const handleSuccess = async (msg) => {
  toastRef.value.addToast(msg, 'success')
  await attendanceStore.fetchTodayStatus()
}
const handleAttendanceError = (msg) => {
  if (msg.startsWith('HOLIDAY:')) {
    const holidayName = msg.split(':')[1]
    toastRef.value.addToast(`Absen Ditolak: Hari ini libur (${holidayName})`, 'danger')
  } else if (msg.startsWith('LEAVE:')) {
    const leaveType = msg.split(':')[1]
    toastRef.value.addToast(
      `Anda sedang dalam status izin: ${leaveType}. Tidak perlu absen.`,
      'info',
    )
  } else if (msg === 'ALREADY_CHECKIN') {
    toastRef.value.addToast(
      'Anda belum Check-Out dari sesi sebelumnya! Silahkan Check-Out dulu.',
      'warning',
    )
  } else if (msg === 'ATTENDANCE_COMPLETED') {
    toastRef.value.addToast('Anda sudah menyelesaikan absensi hari ini.', 'success')
  } else if (msg.startsWith('OUT_OF_RANGE:')) {
    const parts = msg.split(':')
    toastRef.value.addToast(`Kejauhan! Jarak: ${parts[1]}m (Max: ${parts[2]}m)`, 'danger')
  } else {
    toastRef.value.addToast(msg, 'danger')
  }
}

const distanceToOffice = computed(() => {
  if (!userLocation.value || !officeLocation.value) return null

  const R = 6371e3
  const φ1 = (userLocation.value[0] * Math.PI) / 180
  const φ2 = (officeLocation.value[0] * Math.PI) / 180
  const Δφ = ((officeLocation.value[0] - userLocation.value[0]) * Math.PI) / 180
  const Δλ = ((officeLocation.value[1] - userLocation.value[1]) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
})

const isWithinRadius = computed(() => {
  if (!distanceToOffice.value) return false
  return distanceToOffice.value <= officeRadius.value
})

onMounted(async () => {
  isMounted.value = true

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
          <div
            v-if="showLateCheckoutWarning"
            class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 animate-pulse"
          >
            <div
              class="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0"
            >
              <AlertTriangle size="24" />
            </div>
            <div>
              <h4 class="font-bold text-amber-700 dark:text-amber-400 text-lg">Belum Check-Out?</h4>
              <p class="text-sm text-amber-600 dark:text-amber-500/80 mt-1">
                Jam kerja sudah berakhir ({{ JAM_PERINGATAN_CHECKOUT }}:00). Segera lakukan
                <b>Check-OUT</b> sekarang sebelum sistem menutup absen otomatis pada pukul
                {{ JAM_AUTO_CLOSE }}:59.
              </p>
            </div>
          </div>

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

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              v-for="(metric, i) in metrics"
              :key="i"
              class="relative bg-white dark:bg-zinc-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-300 group cursor-pointer hover:-translate-y-1"
            >
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
              <div
                class="absolute top-3 right-3 size-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"
              ></div>
            </div>
          </div>

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

        <div class="lg:col-span-4 space-y-6">
          <div
            class="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
            :class="isMapExpanded ? 'fixed inset-4 z-50' : 'relative'"
          >
            <div
              class="relative p-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-900"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="absolute inset-0 bg-blue-500/20 rounded-xl blur-md"></div>
                    <div
                      class="relative size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg"
                    >
                      <MapPin class="text-white" size="20" />
                    </div>
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white">Live Location</h3>
                    <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      Real-time Tracking
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div class="relative group/styles">
                    <button
                      class="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      <Layers class="text-slate-600 dark:text-zinc-300" size="18" />
                    </button>
                    <div
                      class="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-2 space-y-1 opacity-0 invisible group-hover/styles:opacity-100 group-hover/styles:visible transition-all z-50 min-w-[140px]"
                    >
                      <button
                        v-for="style in mapStyles"
                        :key="style.id"
                        @click="currentMapStyle = style.id"
                        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all group/item"
                        :class="
                          currentMapStyle === style.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                        "
                      >
                        <div class="w-8 h-8 rounded-md" :class="style.preview"></div>
                        <span
                          class="text-xs font-semibold text-slate-700 dark:text-zinc-200"
                          :class="
                            currentMapStyle === style.id ? 'text-blue-600 dark:text-blue-400' : ''
                          "
                        >
                          {{ style.name }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    @click="isMapExpanded = !isMapExpanded"
                    class="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    <Maximize2
                      v-if="!isMapExpanded"
                      class="text-slate-600 dark:text-zinc-300"
                      size="18"
                    />
                    <Minimize2 v-else class="text-slate-600 dark:text-zinc-300" size="18" />
                  </button>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                >
                  <span class="relative flex size-2">
                    <span
                      v-if="!gpsLoading"
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full size-2 transition-colors duration-300"
                      :class="gpsLoading ? 'bg-amber-500' : 'bg-emerald-500'"
                    ></span>
                  </span>
                  <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {{ gpsLoading ? 'Searching...' : 'Active' }}
                  </span>
                </div>

                <div
                  v-if="gpsAccuracy"
                  class="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                >
                  <span class="text-xs font-bold text-blue-600 dark:text-blue-400"
                    >±{{ Math.round(gpsAccuracy) }}m</span
                  >
                </div>

                <div
                  v-if="distanceToOffice"
                  class="px-3 py-1.5 rounded-lg border"
                  :class="
                    isWithinRadius
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                  "
                >
                  <span
                    class="text-xs font-bold"
                    :class="
                      isWithinRadius
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    "
                    >{{ distanceToOffice }}m</span
                  >
                </div>
              </div>
            </div>

            <div
              class="relative bg-slate-100 dark:bg-zinc-950 overflow-hidden"
              :class="isMapExpanded ? 'h-[calc(100vh-200px)]' : 'h-[480px]'"
            >
              <div v-if="isMounted && userLocation" class="w-full h-full">
                <l-map
                  ref="mapRef"
                  v-model:zoom="zoom"
                  :center="userLocation"
                  :options="mapOptions"
                  class="z-0 w-full h-full"
                >
                  <l-tile-layer :url="tileLayerUrl"></l-tile-layer>

                  <l-marker :lat-lng="userLocation" :icon="userCustomIcon">
                    <l-popup :options="{ className: 'professional-popup' }">
                      <div class="p-4 min-w-[280px] bg-white dark:bg-zinc-900">
                        <div
                          class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-zinc-700 pr-8"
                        >
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"
                            ></div>
                            <div
                              class="absolute inset-0 bg-blue-500/20 rounded-full blur-md animate-pulse-gentle"
                            ></div>
                            <img
                              :src="authStore.profileImage"
                              class="relative size-12 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-lg ring-2 ring-blue-500/20 dark:ring-blue-400/30"
                            />
                          </div>
                          <div class="flex-1">
                            <h3 class="font-black text-slate-900 dark:text-white text-sm">
                              {{ authStore.user?.name || 'User' }}
                            </h3>
                            <p
                              class="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1"
                            >
                              <span class="relative flex size-2">
                                <span
                                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"
                                ></span>
                                <span
                                  class="relative inline-flex rounded-full size-2 bg-blue-500"
                                ></span>
                              </span>
                              Posisi Anda Saat Ini
                            </p>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-4">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 border border-slate-100 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                            >
                              <p
                                class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1"
                              >
                                Latitude
                              </p>
                              <p class="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                {{ userLocation[0].toFixed(6) }}
                              </p>
                            </div>
                          </div>
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 border border-slate-100 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                            >
                              <p
                                class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1"
                              >
                                Longitude
                              </p>
                              <p class="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                {{ userLocation[1].toFixed(6) }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="space-y-2">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20"
                            >
                              <span class="text-xs font-semibold text-slate-700 dark:text-zinc-200"
                                >GPS Accuracy</span
                              >
                              <span class="text-xs font-black text-blue-600 dark:text-blue-400"
                                >±{{ Math.round(gpsAccuracy) }}m</span
                              >
                            </div>
                          </div>
                          <div v-if="distanceToOffice" class="relative group">
                            <div
                              class="absolute inset-0 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                              :class="isWithinRadius ? 'bg-emerald-500/10' : 'bg-rose-500/10'"
                            ></div>
                            <div
                              class="relative flex items-center justify-between p-2.5 rounded-lg border"
                              :class="
                                isWithinRadius
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
                              "
                            >
                              <span class="text-xs font-semibold text-slate-700 dark:text-zinc-200"
                                >Jarak ke Kantor</span
                              >
                              <span
                                class="text-xs font-black"
                                :class="
                                  isWithinRadius
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                "
                                >{{ distanceToOffice }}m</span
                              >
                            </div>
                          </div>
                        </div>

                        <div class="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"
                              :class="isWithinRadius ? 'bg-emerald-500/40' : 'bg-rose-500/40'"
                            ></div>
                            <div
                              class="relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg shadow-lg"
                              :class="
                                isWithinRadius
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                  : 'bg-gradient-to-r from-rose-500 to-rose-600'
                              "
                            >
                              <component
                                :is="isWithinRadius ? CheckCircle2 : XCircle"
                                class="text-white"
                                size="16"
                              />
                              <span class="text-sm font-bold text-white">{{
                                isWithinRadius ? 'Dalam Jangkauan' : 'Di Luar Jangkauan'
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </l-popup>
                  </l-marker>

                  <l-marker
                    v-if="officeLocation"
                    :lat-lng="officeLocation"
                    :icon="officeCustomIcon"
                  >
                    <l-popup :options="{ className: 'professional-popup office-popup' }">
                      <div class="p-4 min-w-[280px] bg-white dark:bg-zinc-900">
                        <div
                          class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-zinc-700 pr-8"
                        >
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"
                            ></div>
                            <div
                              class="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md animate-pulse-gentle"
                            ></div>
                            <div
                              class="relative size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-emerald-500/20 dark:ring-emerald-400/30"
                            >
                              <Building2 class="text-white" size="24" />
                            </div>
                          </div>
                          <div class="flex-1">
                            <h3 class="font-black text-slate-900 dark:text-white text-sm">
                              {{ attendanceStore.office?.name || 'Kantor Pusat' }}
                            </h3>
                            <p
                              class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
                            >
                              <span class="relative flex size-2">
                                <span
                                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                                ></span>
                                <span
                                  class="relative inline-flex rounded-full size-2 bg-emerald-500"
                                ></span>
                              </span>
                              Zona Absensi
                            </p>
                          </div>
                        </div>

                        <div class="mb-4">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative flex items-start gap-2 p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-100 dark:border-zinc-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                            >
                              <MapPin
                                class="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0"
                                size="16"
                              />
                              <p
                                class="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed"
                              >
                                {{ attendanceStore.office?.address || 'Alamat tidak tersedia' }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-4">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 border border-slate-100 dark:border-zinc-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                            >
                              <p
                                class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1"
                              >
                                Latitude
                              </p>
                              <p class="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                {{ officeLocation[0].toFixed(6) }}
                              </p>
                            </div>
                          </div>
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <div
                              class="relative bg-slate-50 dark:bg-zinc-800 rounded-lg p-3 border border-slate-100 dark:border-zinc-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                            >
                              <p
                                class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1"
                              >
                                Longitude
                              </p>
                              <p class="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                {{ officeLocation[1].toFixed(6) }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="relative group mb-4">
                          <div
                            class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"
                          ></div>
                          <div
                            class="relative bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800"
                          >
                            <div class="flex items-center justify-between mb-1">
                              <span
                                class="text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                >Radius Absensi</span
                              >
                              <span
                                class="text-lg font-black text-emerald-600 dark:text-emerald-400"
                                >{{ officeRadius }}m</span
                              >
                            </div>
                            <p
                              class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"
                            >
                              Area lingkaran hijau menandakan zona yang diizinkan
                            </p>
                          </div>
                        </div>

                        <div class="pt-3 border-t border-slate-200 dark:border-zinc-700">
                          <div class="relative group">
                            <div
                              class="absolute inset-0 bg-emerald-500/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                            ></div>
                            <button
                              @click="centerOnOffice"
                              class="relative w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                            >
                              <Target size="16" />
                              <span class="text-sm">Pusatkan Peta</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </l-popup>
                  </l-marker>

                  <l-circle
                    v-if="officeLocation"
                    :lat-lng="officeLocation"
                    :radius="officeRadius"
                    :color="'#10b981'"
                    :weight="2"
                    :fill-color="'#10b981'"
                    :fill-opacity="0.15"
                  >
                  </l-circle>
                </l-map>
              </div>

              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-zinc-600"
              >
                <div class="relative">
                  <div class="absolute inset-0 animate-ping">
                    <MapPin size="48" class="text-blue-500 opacity-20" />
                  </div>
                  <MapPin class="relative animate-bounce" size="48" />
                </div>
                <div class="text-center">
                  <p class="text-sm font-bold mb-1">Memuat Peta</p>
                  <p class="text-xs">Mohon tunggu sebentar...</p>
                </div>
              </div>

              <div
                v-if="isMounted && userLocation"
                class="absolute bottom-4 right-4 z-[400] flex flex-col gap-2"
              >
                <button
                  @click="centerOnUser"
                  class="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 hover:scale-110 transition-all group"
                  title="Pusatkan ke lokasi saya"
                >
                  <Navigation
                    class="text-blue-600 dark:text-blue-400 group-hover:rotate-45 transition-transform"
                    size="20"
                  />
                </button>
                <button
                  @click="centerOnOffice"
                  class="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 hover:scale-110 transition-all group"
                  title="Pusatkan ke kantor"
                >
                  <Building2
                    class="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"
                    size="20"
                  />
                </button>
              </div>
            </div>
          </div>

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
                  class="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                >
                  <Building2
                    class="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300"
                    size="18"
                  />
                </div>
                <div>
                  <p
                    class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300"
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
      @close="showAttendanceModal = false"
      @success="handleSuccess"
      @error="handleAttendanceError"
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

:deep(.professional-popup .leaflet-popup-content-wrapper) {
  border-radius: 1rem;
  padding: 0;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition:
    background-color 0.3s,
    border-color 0.3s,
    color 0.3s;
}

:deep(.professional-popup .leaflet-popup-content) {
  margin: 0;
  line-height: 1.4;
}

:deep(.professional-popup .leaflet-popup-tip) {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

:deep(.leaflet-popup-close-button) {
  width: 28px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: 50%;
  background: transparent;
  color: #94a3b8 !important;
  font-size: 18px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 12px !important;
  right: 12px !important;
  padding: 0 !important;
  transition: all 0.2s ease;
}

:deep(.leaflet-popup-close-button):hover {
  background-color: #f1f5f9;
  color: #ef4444 !important;
}

:global(.dark) :deep(.professional-popup .leaflet-popup-content-wrapper) {
  background-color: #18181b;
  border-color: #27272a;
  color: #fff;
}

:global(.dark) :deep(.professional-popup .leaflet-popup-tip) {
  background-color: #18181b;
  border-color: #27272a;
}

:global(.dark) :deep(.leaflet-popup-close-button) {
  color: #71717a !important;
}

:global(.dark) :deep(.leaflet-popup-close-button):hover {
  background-color: #27272a;
  color: #ef4444 !important;
}
</style>
