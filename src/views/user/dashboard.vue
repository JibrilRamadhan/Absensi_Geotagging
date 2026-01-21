<script setup>
import { ref, computed, onMounted } from 'vue'
import AttendanceModal from '../../components/Attendance/AttendanceModal.vue'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useAuthStore } from '../../stores/authStore'
import Toast from '../../components/Allert/allert.vue'
import { Users, UserCheck, Clock, MapPin, MoreHorizontal, ArrowUpRight } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import VueApexCharts from 'vue3-apexcharts'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const zoom = ref(15)
const isMounted = ref(false)

const showAttendanceModal = ref(false)
const attendanceType = ref('IN')
const toastRef = ref(null)

const userLocation = ref([-6.2, 106.816666])
const locationLoaded = ref(false)
const getUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.value = [pos.coords.latitude, pos.coords.longitude]
        locationLoaded.value = true
      },
      (err) => {
        toastRef.value.addToast('Gagal mengambil lokasi GPS', 'error')
      },
    )
  }
}
const canCheckIn = computed(() => !attendanceStore.alreadyCheckedIn)
const canCheckOut = computed(
  () => attendanceStore.alreadyCheckedIn && !attendanceStore.alreadyCheckedOut,
)
const isDoneToday = computed(
  () => attendanceStore.alreadyCheckedIn && attendanceStore.alreadyCheckedOut,
)

const mapOptions = {
  zoomControl: false,
  attributionControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
}

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'sans-serif',
    background: 'transparent',
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    colors: ['#3b82f6'],
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  dataLabels: { enabled: false },
  grid: {
    show: true,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    strokeDashArray: 4,
    padding: { top: 0, right: 0, bottom: 0, left: 10 },
  },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
  },
  yaxis: { show: false },
  theme: { mode: 'light' },
  tooltip: {
    theme: 'light',
    x: { show: false },
  },
}))

const chartSeries = [{ name: 'Attendance', data: [40, 65, 50, 95, 60, 80, 55] }]

const metrics = [
  { title: 'Total Students', value: '570', icon: Users, change: '+12%', trend: 'up' },
  {
    title: 'Present Today',
    value: '430',
    icon: UserCheck,
    subtitle: '75% Rate',
    change: '+5%',
    trend: 'up',
  },
  { title: 'Late Arrivals', value: '13', icon: Clock, change: '-2%', trend: 'down' },
]

const recentActivity = computed(() => {
  return attendanceStore.history.slice(0, 5).map((log) => {
    let action = 'Checked IN'
    let time = log.check_in
      ? new Date(log.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '-'

    if (log.check_out) {
      action = 'Checked OUT'
      time = new Date(log.check_out).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return {
      user: 'You',
      action: action,
      time: time,
      status: log.status || (log.check_out ? 'present' : 'ongoing'),
      date: log.date,
      avatar: authStore.profileImage,
    }
  })
})

const openAttendance = (type) => {
  if (type === 'IN' && !canCheckIn.value) return
  if (type === 'OUT' && !canCheckOut.value) return

  attendanceType.value = type
  showAttendanceModal.value = true
}

const handleSuccess = (msg) => {
  toastRef.value.addToast(msg, 'success')
  attendanceStore.fetchTodayStatus()
}
const handleError = (msg) => toastRef.value.addToast(msg, 'error')

onMounted(async () => {
  setTimeout(() => {
    isMounted.value = true
  }, 100)

  await Promise.all([
    authStore.fetchUser(),
    attendanceStore.fetchTodayStatus(),
    attendanceStore.fetchHistory(),
    getUserLocation(),
  ])
})
</script>

<template>
  <div
    class="min-h-screen p-6 bg-[#F8F9FB] dark:bg-black text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300"
  >
    <Toast ref="toastRef" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-400 mx-auto">
      <div class="lg:col-span-8 flex flex-col gap-6">
        <div
          class="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group rounded-4xl transition-all duration-300 bg-white dark:bg-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] border border-transparent dark:border-white/20"
        >
          <div
            class="absolute right-0 top-0 w-64 h-full bg-linear-to-l from-gray-100/50 to-transparent dark:from-white/5 pointer-events-none"
          ></div>

          <div class="relative z-10 text-center md:text-left">
            <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Good Morning! 👋
            </h2>
            <p class="text-gray-500 dark:text-gray-400 font-medium">
              You have
              <span
                class="text-gray-900 dark:text-white font-bold underline decoration-2 decoration-gray-300 dark:decoration-white/50"
                >2 tasks</span
              >
              remaining for today.
            </p>
          </div>

          <div class="flex gap-4 relative z-10 w-full md:w-auto">
            <button
              @click="openAttendance('IN')"
              :disabled="!canCheckIn"
              :class="[
                'flex-1 md:flex-none h-14 px-8 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2',
                canCheckIn
                  ? 'bg-[#0f172a] dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95'
                  : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed opacity-50',
              ]"
            >
              <UserCheck size="20" stroke-width="2.5" />
              {{ attendanceStore.alreadyCheckedIn ? 'CHECKED IN' : 'CHECK IN' }}
            </button>

            <button
              @click="openAttendance('OUT')"
              :disabled="!canCheckOut"
              :class="[
                'flex-1 md:flex-none h-14 px-8 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2',
                canCheckOut
                  ? 'border-gray-200 dark:border-white text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-50 bg-gray-100 dark:bg-zinc-900',
              ]"
            >
              {{ attendanceStore.alreadyCheckedOut ? 'COMPLETED' : 'CHECK OUT' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(metric, index) in metrics"
            :key="index"
            class="p-6 flex flex-col justify-between h-40 relative group overflow-hidden rounded-4xl transition-all duration-300 bg-white dark:bg-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] border border-transparent dark:border-white/20"
          >
            <div class="flex justify-between items-start relative z-10">
              <div
                class="p-3 bg-gray-50 dark:bg-white/10 rounded-2xl border border-transparent dark:border-white/10"
              >
                <component
                  :is="metric.icon"
                  class="text-gray-900 dark:text-white"
                  size="24"
                  stroke-width="2"
                />
              </div>
              <span
                class="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 flex items-center gap-1 border border-transparent dark:border-green-500/30"
              >
                {{ metric.change }} <ArrowUpRight size="12" />
              </span>
            </div>

            <div class="relative z-10">
              <h3 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-4">
                {{ metric.value }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                {{ metric.title }}
              </p>
            </div>

            <component
              :is="metric.icon"
              class="absolute -bottom-6 -right-6 text-gray-100 dark:text-white/5 opacity-50 rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
              size="120"
            />
          </div>
        </div>

        <div
          class="p-6 pb-2 rounded-4xl transition-all duration-300 bg-white dark:bg-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] border border-transparent dark:border-white/20"
        >
          <div class="flex items-center justify-between mb-2 px-2">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Attendance Analytics</h3>
              <p class="text-xs text-gray-400 font-medium">Weekly overview</p>
            </div>
            <button class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
              <MoreHorizontal size="20" class="text-gray-400" />
            </button>
          </div>

          <div class="h-70 w-full text-gray-900 dark:text-white chart-wrapper">
            <VueApexCharts
              width="100%"
              height="100%"
              :options="chartOptions"
              :series="chartSeries"
            />
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 flex flex-col gap-6">
        <div
          class="h-80 p-1.5 relative flex flex-col overflow-hidden rounded-4xl transition-all duration-300 bg-white dark:bg-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] border border-transparent dark:border-white/20"
        >
          <div class="absolute top-5 left-5 z-500">
            <div
              class="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-white/20 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3"
            >
              <div
                class="size-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"
              ></div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Current Location
                </p>
                <p class="text-xs font-bold text-gray-900 dark:text-white">Surabaya, ID</p>
              </div>
            </div>
          </div>

          <div
            class="flex-1 w-full h-full rounded-[1.2rem] overflow-hidden relative isolate bg-gray-100 dark:bg-[#111]"
          >
            <div class="absolute inset-0 z-400 pointer-events-none map-vignette"></div>

            <div v-if="isMounted" style="height: 100%; width: 100%">
              <l-map
                ref="map"
                v-model:zoom="zoom"
                :center="userLocation"
                :options="mapOptions"
                class="z-0 map-style"
                style="height: 100%; width: 100%"
              >
                <l-tile-layer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  layer-type="base"
                  name="CartoDB Positron"
                ></l-tile-layer>

                <l-marker :lat-lng="userLocation">
                  <l-tooltip
                    :options="{ permanent: true, direction: 'top', offset: [0, -10] }"
                    class="custom-tooltip"
                  >
                    You
                  </l-tooltip>
                </l-marker>
              </l-map>
            </div>
          </div>
        </div>

        <div
          class="flex-1 p-6 min-h-75 rounded-4xl transition-all duration-300 bg-white dark:bg-black shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] border border-transparent dark:border-white/20"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            Recent Logs
          </h3>
          <div class="relative pl-2">
            <div class="absolute left-4.75 top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-white/10"></div>

            <div class="space-y-8">
              <div
                v-for="(item, index) in recentActivity"
                :key="index"
                class="relative flex items-center gap-4 group"
              >
                <div
                  class="absolute left-3.75 size-2.5 rounded-full bg-white dark:bg-black border-2 border-gray-300 dark:border-white transition-all shadow-[0_0_0_2px_transparent] group-hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
                ></div>

                <img
                  :src="item.avatar"
                  class="size-10 ml-8 rounded-full bg-gray-200 object-cover border-2 border-white dark:border-white/20 shadow-sm"
                />

                <div class="flex-1">
                  <div class="flex justify-between items-center">
                    <h5 class="text-sm font-bold text-gray-900 dark:text-white">{{ item.user }}</h5>
                    <span
                      class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-transparent dark:border-white/5"
                      >{{ item.time }}</span
                    >
                  </div>
                  <p
                    class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"
                  >
                    <span
                      :class="
                        item.action.includes('IN')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      "
                      >●</span
                    >
                    {{ item.action }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            class="w-full mt-8 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-dashed border-gray-300 dark:border-white/20 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            View All History
          </button>
        </div>
      </div>
    </div>

    <AttendanceModal
      v-if="showAttendanceModal"
      :type="attendanceType"
      @close="showAttendanceModal = false"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.map-style :deep(.leaflet-layer) {
  filter: grayscale(100%);
}
:global(.dark) .map-style :deep(.leaflet-layer) {
  filter: invert(100%) hue-rotate(180deg) brightness(70%) contrast(150%);
}

.map-vignette {
  background: radial-gradient(circle, transparent 50%, rgba(255, 255, 255, 1) 100%);
}
:global(.dark) .map-vignette {
  background: radial-gradient(circle, transparent 55%, #000000 100%);
}

/* Custom Tooltip pada Map */
:deep(.custom-tooltip) {
  background-color: #000 !important;
  color: white !important;
  font-weight: 800;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 2px solid white !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
:global(.dark) :deep(.custom-tooltip) {
  background-color: white !important;
  color: black !important;
  border: 2px solid #000 !important;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
:deep(.leaflet-tooltip-top:before) {
  display: none;
}

:global(.dark) .chart-wrapper .apexcharts-series path {
  stroke: #ffffff !important;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}
:global(.dark) .apexcharts-gridline {
  stroke: rgba(255, 255, 255, 0.1) !important;
}
:global(.dark) .apexcharts-xaxis-label {
  fill: #a1a1aa !important;
}
:global(.dark) .apexcharts-tooltip {
  background: #000 !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
}
:global(.dark) .apexcharts-tooltip-title {
  background: #222 !important;
  border-bottom: 1px solid #444 !important;
}
</style>
