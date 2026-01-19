<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Camera,
  MapPin,
  X,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-vue-next'
import { useAttendanceStore } from '../../stores/attendanceStore'

const props = defineProps(['type'])
const emit = defineEmits(['close', 'success', 'error'])

const attendanceStore = useAttendanceStore()
const videoEl = ref(null)
const canvasEl = ref(null)

const isCameraReady = ref(false)
const photoTaken = ref(null)
const photoBlob = ref(null)
const location = ref(null)
const locationError = ref(null)
const isSubmitting = ref(false)

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      isCameraReady.value = true
    }
  } catch (err) {
    console.error('Camera Error:', err)
    emit('error', 'Gagal mengakses kamera. Izinkan akses kamera.')
  }
}

const getLocation = () => {
  if (!navigator.geolocation) {
    locationError.value = 'Browser tidak mendukung Geolocation.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      location.value = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }
    },
    (err) => {
      console.error('Geo Error:', err)
      locationError.value = 'Gagal mengambil lokasi. Pastikan GPS aktif.'
    },
    { enableHighAccuracy: true },
  )
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

const handleSubmit = async () => {
  if (!photoBlob.value || !location.value) return

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

const stopCamera = () => {
  const stream = videoEl.value?.srcObject
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

onMounted(() => {
  startCamera()
  getLocation()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="fixed inset-0 z-100 flex items-center justify-center p-4">
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <div
      class="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300"
    >
      <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
        <div>
          <span
            class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
            :class="props.type === 'IN' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
          >
            Check {{ props.type }}
          </span>
        </div>
        <button
          @click="emit('close')"
          class="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition"
        >
          <X size="20" />
        </button>
      </div>

      <div class="relative h-100 bg-black">
        <video
          v-show="!photoTaken"
          ref="videoEl"
          autoplay
          playsinline
          class="w-full h-full object-cover transform -scale-x-100"
        ></video>

        <img v-if="photoTaken" :src="photoTaken" class="w-full h-full object-cover" />

        <canvas ref="canvasEl" class="hidden"></canvas>

        <div
          class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/40 border border-white/10 shadow-lg"
        >
          <div v-if="location" class="flex items-center gap-2 text-emerald-400">
            <MapPin size="14" />
            <span class="text-xs font-mono text-white">
              {{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}
            </span>
          </div>
          <div v-else-if="locationError" class="flex items-center gap-2 text-red-400">
            <AlertTriangle size="14" />
            <span class="text-xs text-white">Lokasi Gagal</span>
          </div>
          <div v-else class="flex items-center gap-2 text-orange-400">
            <Loader2 size="14" class="animate-spin" />
            <span class="text-xs text-white">Mencari GPS...</span>
          </div>
        </div>
      </div>

      <div class="p-6 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-bold dark:text-white">Verifikasi Kehadiran</h3>
          <p class="text-sm text-gray-500">Pastikan wajah terlihat jelas dan lokasi akurat.</p>
        </div>

        <div class="flex gap-3">
          <button
            v-if="!photoTaken"
            @click="takePhoto"
            class="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Camera size="18" /> Ambil Foto
          </button>

          <button
            v-else
            @click="retakePhoto"
            class="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <RefreshCcw size="18" /> Foto Ulang
          </button>

          <button
            @click="handleSubmit"
            :disabled="!photoTaken || !location || isSubmitting"
            class="flex-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Loader2 v-if="isSubmitting" size="20" class="animate-spin" />
            <CheckCircle2 v-else size="20" />
            <span>{{
              isSubmitting ? 'Mengirim...' : props.type === 'IN' ? 'Check In' : 'Check Out'
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
