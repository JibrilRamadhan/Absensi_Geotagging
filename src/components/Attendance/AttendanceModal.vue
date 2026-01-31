<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Camera, X, RefreshCcw, CheckCircle2, Loader2, AlertTriangle, Clock } from 'lucide-vue-next'
import { useAttendanceStore } from '../../stores/attendanceStore'

const props = defineProps(['type', 'initialLocation', 'initialAccuracy'])
const emit = defineEmits(['close', 'success', 'error'])

const attendanceStore = useAttendanceStore()
const videoEl = ref(null)
const canvasEl = ref(null)

const isCameraReady = ref(false)
const photoTaken = ref(null)
const photoBlob = ref(null)

const location = ref(null)
const accuracy = ref(null)
const locationError = ref(null)
const watchId = ref(null)

const isSubmitting = ref(false)
const currentTime = ref(
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
)

const MAX_ACCURACY_ALLOWED = 500

const timeInterval = ref(null)

// --- CAMERA LOGIC ---
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
  if (!watchId.value) startLocationWatch()
}

// --- LOCATION LOGIC ---
const startLocationWatch = () => {
  if (!navigator.geolocation) {
    locationError.value = 'Browser tidak mendukung Geolocation.'
    return
  }

  locationError.value = null

  watchId.value = navigator.geolocation.watchPosition(
    (pos) => {
      location.value = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }
      accuracy.value = Math.round(pos.coords.accuracy)
    },
    (err) => {
      console.error('Geo Error:', err)
      let msg = 'Gagal mengambil lokasi.'
      if (err.code === 1) msg = 'Izin lokasi ditolak.'
      else if (err.code === 2) msg = 'Sinyal GPS lemah/tidak tersedia.'
      else if (err.code === 3) msg = 'Waktu permintaan habis.'
      locationError.value = msg
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    },
  )
}

const stopLocationWatch = () => {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
}

// --- COMPUTED ---
const isLocationValid = computed(() => {
  return location.value && accuracy.value !== null && accuracy.value <= MAX_ACCURACY_ALLOWED
})

const gpsStatusColor = computed(() => {
  if (!location.value) return 'text-amber-400'
  if (accuracy.value <= 100) return 'text-emerald-400'
  if (accuracy.value <= 300) return 'text-blue-400'
  if (accuracy.value <= 500) return 'text-yellow-400'
  return 'text-red-400'
})

const gpsStatusText = computed(() => {
  if (!location.value) return 'Mencari GPS...'
  if (accuracy.value <= 100) return 'Excellent'
  if (accuracy.value <= 300) return 'Good'
  if (accuracy.value <= 500) return 'Fair'
  return 'Poor'
})

// --- SUBMIT LOGIC ---
const handleSubmit = async () => {
  if (!photoBlob.value || !location.value) return

  if (accuracy.value > MAX_ACCURACY_ALLOWED) {
    emit('error', `Akurasi GPS buruk (${accuracy.value}m). Tunggu sinyal membaik.`)
    return
  }

  isSubmitting.value = true
  try {
    const res = await attendanceStore.submitAttendance(props.type, photoBlob.value, location.value)
    emit('success', res.message)
    emit('close')
  } catch (err) {
    emit('error', err.message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  startCamera()

  timeInterval.value = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, 1000)

  if (props.initialLocation && props.initialAccuracy) {
    location.value = {
      latitude: props.initialLocation[0],
      longitude: props.initialLocation[1],
    }
    accuracy.value = props.initialAccuracy
  }

  startLocationWatch()
})

onUnmounted(() => {
  stopCamera()
  stopLocationWatch()
  if (timeInterval.value) clearInterval(timeInterval.value)
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
  >
    <div
      class="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md"
      @click="emit('close')"
    ></div>

    <div
      class="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-500"
    >
      <!-- Compact Header -->
      <div class="relative overflow-hidden">
        <div
          class="absolute inset-0"
          :class="
            props.type === 'IN'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-orange-500 to-rose-600'
          "
        ></div>

        <div class="relative p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="size-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center"
            >
              <CheckCircle2 v-if="props.type === 'IN'" class="text-white" size="20" />
              <RefreshCcw v-else class="text-white" size="20" />
            </div>
            <div>
              <h2 class="text-lg font-black text-white">
                {{ props.type === 'IN' ? 'Check In' : 'Check Out' }}
              </h2>
              <div class="flex items-center gap-1.5 text-white/90">
                <Clock size="12" />
                <span class="text-xs font-bold tabular-nums">{{ currentTime }}</span>
              </div>
            </div>
          </div>

          <button
            @click="emit('close')"
            class="size-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:scale-110 hover:rotate-90"
          >
            <X size="18" />
          </button>
        </div>
      </div>

      <!-- Camera Section -->
      <div class="relative bg-slate-900 dark:bg-black aspect-square w-full overflow-hidden">
        <video
          v-show="!photoTaken"
          ref="videoEl"
          autoplay
          playsinline
          class="w-full h-full object-cover transform -scale-x-100"
        ></video>

        <div v-if="photoTaken" class="w-full h-full">
          <img
            :src="photoTaken"
            class="w-full h-full object-cover animate-in fade-in duration-500"
          />
        </div>

        <canvas ref="canvasEl" class="hidden"></canvas>

        <!-- Compact GPS Badge -->
        <div class="absolute top-3 left-3 right-3 z-10">
          <div
            class="bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="size-2 rounded-full animate-pulse"
                :class="
                  !location
                    ? 'bg-amber-400'
                    : accuracy <= MAX_ACCURACY_ALLOWED
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                "
              ></div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">GPS</p>
                <p v-if="locationError" class="text-xs font-bold text-red-400">Error</p>
                <p v-else-if="!location" class="text-xs font-bold text-amber-400">Mencari...</p>
                <p v-else class="text-xs font-bold" :class="gpsStatusColor">
                  {{ accuracy }}m • {{ gpsStatusText }}
                </p>
              </div>
            </div>

            <span
              v-if="location"
              class="text-[9px] font-bold px-2 py-1 rounded-md uppercase"
              :class="
                accuracy <= MAX_ACCURACY_ALLOWED
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              "
            >
              {{ accuracy <= MAX_ACCURACY_ALLOWED ? 'Ready' : 'Wait' }}
            </span>
          </div>
        </div>

        <!-- Simple Frame Guide -->
        <div
          v-if="!photoTaken"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div class="relative w-56 h-56 border-2 border-white/30 rounded-3xl">
            <div
              class="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-2xl"
            ></div>
            <div
              class="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-2xl"
            ></div>
            <div
              class="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-2xl"
            ></div>
            <div
              class="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-2xl"
            ></div>
          </div>
        </div>
      </div>

      <!-- Compact Footer -->
      <div class="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
        <!-- Simple Info -->
        <p class="text-center text-xs text-slate-600 dark:text-zinc-400 mb-3">
          {{ photoTaken ? 'Periksa foto & kirim' : 'Posisikan wajah Anda' }}
        </p>

        <!-- Buttons -->
        <div class="flex gap-2">
          <button
            v-if="!photoTaken"
            @click="takePhoto"
            :disabled="!isCameraReady"
            class="group w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            <Camera size="18" />
            <span>Ambil Foto</span>
          </button>

          <template v-else>
            <button
              @click="retakePhoto"
              class="flex-1 py-3 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RefreshCcw size="16" />
              Ulang
            </button>

            <button
              @click="handleSubmit"
              :disabled="isSubmitting || !isLocationValid"
              class="flex-[2] py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              :class="
                isLocationValid
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-400 dark:bg-zinc-700 text-slate-200 dark:text-zinc-500 cursor-not-allowed'
              "
            >
              <Loader2 v-if="isSubmitting" size="18" class="animate-spin" />
              <template v-else>
                <CheckCircle2 size="18" />
                Kirim
              </template>
            </button>
          </template>
        </div>

        <!-- Compact Warning -->
        <div
          v-if="photoTaken && !isLocationValid"
          class="mt-3 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg"
        >
          <AlertTriangle class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p class="text-[10px] font-semibold text-amber-900 dark:text-amber-300">
            Menunggu sinyal GPS lebih baik
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
