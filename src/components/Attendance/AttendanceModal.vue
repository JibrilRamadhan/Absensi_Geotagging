<script setup>
import { ref, onMounted, onUnmounted, computed, watchEffect } from 'vue'
import {
  Camera,
  X,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  MapPin,
  Satellite,
  Wifi,
} from 'lucide-vue-next'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useLocationStore } from '../../stores/locationStore'

const props = defineProps(['type']) // Kita ambil lokasi dari Store, bukan props lagi
const emit = defineEmits(['close', 'success', 'error'])

const attendanceStore = useAttendanceStore()
const locationStore = useLocationStore() // Import Store Global

const videoEl = ref(null)
const canvasEl = ref(null)

const isCameraReady = ref(false)
const photoTaken = ref(null)
const photoBlob = ref(null)

const isSubmitting = ref(false)
const distanceToOffice = ref(0)
const isWithinRadius = ref(false)

// --- 1. AMBIL DATA LOKASI INSTANT DARI STORE ---
const liveLocation = computed(() => {
  if (locationStore.coords.latitude) {
    return {
      latitude: locationStore.coords.latitude,
      longitude: locationStore.coords.longitude,
    }
  }
  return null
})

const liveAccuracy = computed(() => locationStore.accuracy)
const signalSource = computed(() => {
  return locationStore.satelliteReady || (locationStore.accuracy && locationStore.accuracy <= 20)
    ? 'satelit'
    : 'wifi'
})

// --- 2. LOGIKA JARAK (Haversine) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Watcher Jarak Realtime
watchEffect(() => {
  if (liveLocation.value && attendanceStore.office) {
    const dist = calculateDistance(
      liveLocation.value.latitude,
      liveLocation.value.longitude,
      parseFloat(attendanceStore.office.latitude),
      parseFloat(attendanceStore.office.longitude),
    )
    distanceToOffice.value = dist
    const maxRadius = parseFloat(attendanceStore.office.radius)
    isWithinRadius.value = dist <= maxRadius
  }
})

// --- 3. CAMERA LOGIC (Sama seperti sebelumnya) ---
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 720 },
      },
    })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      isCameraReady.value = true
    }
  } catch (err) {
    console.error('Camera Error:', err)
    emit('error', 'Gagal mengakses kamera. Izinkan akses kamera.')
  }
}

const stopCamera = () => {
  const stream = videoEl.value?.srcObject
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

const takePhoto = () => {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (video && canvas) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        photoBlob.value = blob
        photoTaken.value = URL.createObjectURL(blob)
      },
      'image/jpeg',
      0.8,
    )
  }
}

const retakePhoto = () => {
  photoTaken.value = null
  photoBlob.value = null
}

// --- 4. SUBMIT LOGIC ---
const handleSubmit = async () => {
  if (!photoBlob.value || !liveLocation.value) return

  // Validasi Radius (Hanya untuk Check-IN)
  if (!isWithinRadius.value && props.type === 'IN') {
    emit('error', `Jarak terlalu jauh (${distanceToOffice.value}m). Harap mendekat ke kantor.`)
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      type: props.type,
      latitude: liveLocation.value.latitude,
      longitude: liveLocation.value.longitude,
      accuracy: liveAccuracy.value,
      provider: signalSource.value,
    }
    // Kirim Foto + Lokasi ke Store
    const res = await attendanceStore.submitAttendance(props.type, photoBlob.value, {
      latitude: liveLocation.value.latitude,
      longitude: liveLocation.value.longitude,
    })

    emit('success', res.message || 'Absensi Berhasil')
    emit('close')
  } catch (err) {
    emit('error', err.message || 'Gagal memproses absensi')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  startCamera()
  // Lokasi sudah otomatis jalan dari Store, tidak perlu startLocationWatch manual
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
  >
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="emit('close')"></div>

    <div
      class="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]"
    >
      <div
        class="relative p-4 flex items-center justify-between border-b dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-20"
      >
        <div class="flex items-center gap-3">
          <div
            class="size-10 rounded-xl flex items-center justify-center shadow-lg"
            :class="props.type === 'IN' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'"
          >
            <CheckCircle2 v-if="props.type === 'IN'" size="20" />
            <RefreshCcw v-else size="20" />
          </div>
          <div>
            <h2 class="text-lg font-black text-gray-900 dark:text-white leading-tight">
              {{ props.type === 'IN' ? 'Check In' : 'Check Out' }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Ambil foto selfie bukti kehadiran
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="size-8 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center transition"
        >
          <X size="18" class="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div class="relative w-full aspect-[4/5] bg-black overflow-hidden group">
        <video
          v-show="!photoTaken"
          ref="videoEl"
          autoplay
          playsinline
          class="w-full h-full object-cover transform -scale-x-100"
        ></video>

        <div v-if="photoTaken" class="w-full h-full">
          <img :src="photoTaken" class="w-full h-full object-cover animate-in fade-in" />
        </div>

        <canvas ref="canvasEl" class="hidden"></canvas>

        <div
          v-if="!photoTaken"
          class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
        >
          <div class="w-48 h-64 border-2 border-dashed border-white/50 rounded-3xl"></div>
        </div>

        <div class="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div
            class="bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10"
          >
            <MapPin size="12" class="text-white" />
            <span
              class="text-xs font-bold font-mono"
              :class="isWithinRadius ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ distanceToOffice }}m
            </span>
          </div>

          <div
            class="bg-black/60 backdrop-blur-md rounded-lg px-2 py-1.5 flex items-center gap-1.5 border border-white/10"
          >
            <Satellite
              v-if="signalSource === 'satelit'"
              size="12"
              class="text-indigo-400 animate-pulse"
            />
            <Wifi v-else size="12" class="text-orange-400" />
            <span class="text-[10px] font-bold text-white uppercase">{{
              signalSource === 'satelit' ? 'GPS' : 'WIFI'
            }}</span>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
        <div
          v-if="!isWithinRadius && props.type === 'IN'"
          class="mb-3 flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl"
        >
          <AlertTriangle class="w-4 h-4 text-rose-500 flex-shrink-0" />
          <p class="text-xs font-medium text-rose-600 dark:text-rose-300 leading-tight">
            Anda berada di luar jangkauan kantor (Max {{ attendanceStore.office?.radius }}m).
          </p>
        </div>

        <div class="flex gap-3">
          <button
            v-if="!photoTaken"
            @click="takePhoto"
            :disabled="!isCameraReady"
            class="w-full py-3.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
          >
            <Camera size="18" />
            <span>Ambil Foto</span>
          </button>

          <template v-else>
            <button
              @click="retakePhoto"
              class="flex-1 py-3.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCcw size="18" />
              <span class="text-sm">Ulang</span>
            </button>

            <button
              @click="handleSubmit"
              :disabled="isSubmitting || (!isWithinRadius && props.type === 'IN')"
              class="flex-[2] py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              :class="
                props.type === 'IN'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
              "
            >
              <Loader2 v-if="isSubmitting" size="18" class="animate-spin" />
              <template v-else>
                <CheckCircle2 size="18" />
                <span>{{ props.type === 'IN' ? 'Absen Masuk' : 'Absen Pulang' }}</span>
              </template>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transisi Halus */
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
</style>
