<script setup>
import { onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useLocationStore } from '../../stores/locationStore'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import Toast from '../Allert/allert.vue'
import { Loader2, MapPinOff, Satellite, NavigationOff } from 'lucide-vue-next'

const locationStore = useLocationStore()
const toastRef = ref(null)

onMounted(() => {
  locationStore.startTracking()
})

onUnmounted(() => {
  locationStore.stopTracking()
})

const isBlocking = computed(() => {
  return locationStore.isLoading && !locationStore.permissionDenied && !locationStore.gpsTurnedOff
})

watch(
  () => locationStore.satelliteReady,
  (isReady) => {
    if (isReady) {
      toastRef.value?.addToast('Terhubung ke Satelit GPS (Akurasi Tinggi)', 'success')
    }
  },
)

const reloadPage = () => {
  window.location.reload()
}

const retryGps = () => {
  locationStore.stopTracking()
  setTimeout(() => {
    locationStore.startTracking()
  }, 500)
}
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
    <Toast ref="toastRef" />

    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <Navbar />

      <main class="flex-1 overflow-y-auto overflow-x-hidden relative">
        <RouterView />
      </main>

      <Transition
        enter-active-class="transition opacity-300"
        leave-active-class="transition opacity-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isBlocking"
          class="fixed inset-0 z-9999 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
        >
          <div class="relative mb-8">
            <div
              class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 duration-1000"
            ></div>
            <div
              class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40 duration-1000 delay-300"
            ></div>
            <div
              class="relative bg-zinc-900 p-6 rounded-full border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            >
              <Satellite class="w-16 h-16 text-emerald-500 animate-pulse" />
            </div>
          </div>

          <h2 class="text-2xl font-bold text-white mb-2">Mencari Koordinat</h2>
          <p class="text-emerald-400 font-mono text-sm animate-pulse">Menunggu sinyal lokasi...</p>

          <div class="w-64 h-1 bg-zinc-800 rounded-full mt-8 overflow-hidden">
            <div
              class="h-full bg-emerald-500 animate-[width_2s_ease-out_infinite]"
              style="width: 50%"
            ></div>
          </div>
        </div>
      </Transition>

      <div
        v-if="locationStore.permissionDenied"
        class="fixed inset-0 z-9999 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-8"
      >
        <div class="bg-red-50 dark:bg-red-900/10 p-6 rounded-full mb-6">
          <MapPinOff class="w-16 h-16 text-red-500" />
        </div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-4">Akses Lokasi Ditolak</h1>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          Aplikasi terkunci karena Anda memblokir akses lokasi.
        </p>
        <button
          @click="reloadPage"
          class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-red-500/20"
        >
          <Loader2 class="w-5 h-5" /> Reload Halaman
        </button>
      </div>

      <div
        v-if="locationStore.gpsTurnedOff"
        class="fixed inset-0 z-9999 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-8"
      >
        <div class="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-full mb-6 animate-bounce">
          <NavigationOff class="w-16 h-16 text-orange-500" />
        </div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-4">GPS Tidak Aktif</h1>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          Aplikasi terkunci. Mohon nyalakan GPS Anda.
        </p>
        <button
          @click="retryGps"
          class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Loader2 class="w-5 h-5" /> Coba Deteksi Ulang
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes width {
  0% {
    width: 0%;
    transform: translateX(-100%);
  }
  100% {
    width: 100%;
    transform: translateX(100%);
  }
}
</style>
