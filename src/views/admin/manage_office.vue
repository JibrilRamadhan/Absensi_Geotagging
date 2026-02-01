<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useLocationStore } from '../../stores/locationStore'
import api from '../../api/axios'
import Toast from '../../components/Allert/allert.vue'
import {
  Building2,
  MapPinHouse,
  Plus,
  Edit,
  Trash2,
  Power,
  X,
  Save,
  Navigation,
  Loader2,
  MapPinOff,
  Search,
  CheckCircle,
  AlertCircle,
  MapPin,
} from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LCircle, LTooltip } from '@vue-leaflet/vue-leaflet'

const adminStore = useAdminStore()
const locationStore = useLocationStore()
const toastRef = ref(null)

// State UI
const showFormModal = ref(false)
const isEdit = ref(false)
const formCompany = ref({ id: null, name: '' })

// State Map
const showMapModal = ref(false)
const isMapReady = ref(false)
const mapCenter = ref([-6.2088, 106.8456]) // Default Jakarta
const zoom = ref(16)
const isLocating = ref(false)

// State Pencarian (Nominatim via Proxy)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showDropdown = ref(false)
let debounceTimeout = null

const formLocation = ref({
  company_id: null,
  company_name: '',
  latitude: -6.2088,
  longitude: 106.8456,
  radius: 100,
  address: '',
})

const companies = computed(() => adminStore.companies)

onMounted(() => {
  adminStore.fetchCompanies()
})

// === CRUD COMPANY ===
const openCreate = () => {
  isEdit.value = false
  formCompany.value = { name: '' }
  showFormModal.value = true
}

const openEdit = (c) => {
  isEdit.value = true
  formCompany.value = { id: c.id, name: c.name }
  showFormModal.value = true
}

const submitCompany = async () => {
  try {
    if (isEdit.value) {
      await adminStore.updateCompany(formCompany.value.id, { name: formCompany.value.name })
      toastRef.value.addToast('Nama perusahaan diperbarui', 'success')
    } else {
      await adminStore.createCompany({ name: formCompany.value.name })
      toastRef.value.addToast('Perusahaan baru dibuat', 'success')
    }
    showFormModal.value = false
  } catch (e) {
    toastRef.value.addToast(e.message || 'Gagal menyimpan', 'error')
  }
}

const toggleCompStatus = async (c) => {
  try {
    const res = await adminStore.toggleCompanyStatus(c.id)
    toastRef.value.addToast(res.message, 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal mengubah status', 'error')
  }
}

const deleteComp = async (c) => {
  if (!confirm(`Hapus ${c.name} dan seluruh datanya?`)) return
  try {
    await adminStore.deleteCompany(c.id)
    toastRef.value.addToast('Perusahaan dihapus', 'success')
  } catch (e) {
    const msg = e.response?.data?.message || e.message
    toastRef.value.addToast(msg, 'error')
  }
}

// === OFFICE LOGIC ===

const openLocation = async (c) => {
  formLocation.value.company_id = c.id
  formLocation.value.company_name = c.name

  const data = await adminStore.getOffice(c.id)

  if (data && data.latitude) {
    formLocation.value.latitude = parseFloat(data.latitude)
    formLocation.value.longitude = parseFloat(data.longitude)
    formLocation.value.radius = parseInt(data.radius)
    formLocation.value.address = data.address || ''
  } else {
    // Default jika belum ada
    formLocation.value.latitude = -6.2088
    formLocation.value.longitude = 106.8456
    formLocation.value.radius = 100
    formLocation.value.address = ''
  }

  // Set Search Query sesuai alamat yang tersimpan
  searchQuery.value = formLocation.value.address

  // Reset Search State
  searchResults.value = []
  showDropdown.value = false

  mapCenter.value = [formLocation.value.latitude, formLocation.value.longitude]
  showMapModal.value = true

  // Delay render map agar ukuran container pas
  setTimeout(() => {
    isMapReady.value = true
  }, 300)
}

const toggleOfficeStatus = async (c) => {
  try {
    await adminStore.toggleOfficeStatus(c.id)
    toastRef.value.addToast('Status kantor diubah', 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal update status', 'error')
  }
}

const deleteOffice = async (c) => {
  if (!confirm(`Reset lokasi kantor untuk ${c.name}?`)) return
  try {
    await adminStore.deleteOffice(c.id)
    toastRef.value.addToast('Lokasi kantor di-reset', 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal reset lokasi', 'error')
  }
}

// 1. Logic Autocomplete Search (VIA PROXY BACKEND)
const handleSearchInput = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)

  if (!searchQuery.value || searchQuery.value.length < 3) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  isSearching.value = true
  showDropdown.value = true

  // Debounce 800ms agar tidak spam API
  debounceTimeout = setTimeout(async () => {
    try {
      // [PERUBAHAN UTAMA] Menggunakan Proxy Backend, bukan fetch langsung
      const { data } = await api.get('/api/admin/proxy/search-location', {
        params: { q: searchQuery.value },
      })

      searchResults.value = data

      if (data.length === 0) {
        toastRef.value.addToast('Lokasi tidak ditemukan', 'warning')
      }
    } catch (e) {
      console.error(e)
      toastRef.value.addToast('Gagal mencari lokasi', 'error')
    } finally {
      isSearching.value = false
    }
  }, 800)
}

// 2. Pilih Hasil Search
const selectResult = (result) => {
  const lat = parseFloat(result.lat)
  const lon = parseFloat(result.lon)

  // Update Form & Map
  formLocation.value.latitude = lat
  formLocation.value.longitude = lon
  formLocation.value.address = result.display_name
  searchQuery.value = result.display_name // Tampilkan nama di input

  mapCenter.value = [lat, lon] // Pindah kamera
  zoom.value = 18 // Zoom in

  showDropdown.value = false // Tutup dropdown
  toastRef.value.addToast('Lokasi dipilih', 'success')
}

// 3. GPS (Location Store & Proxy Reverse Geo)
const getCurrentLocation = async () => {
  isLocating.value = true
  try {
    // Panggil action store (sesuaikan nama action di store Anda)
    if (locationStore.fetchLocation) await locationStore.fetchLocation()
    else if (locationStore.getLocation) await locationStore.getLocation()

    // Ambil dari state
    const lat = locationStore.latitude || locationStore.coords?.latitude
    const lng = locationStore.longitude || locationStore.coords?.longitude

    if (lat && lng) {
      formLocation.value.latitude = lat
      formLocation.value.longitude = lng
      mapCenter.value = [lat, lng]
      zoom.value = 18

      // Auto Reverse Geocode (Dapatkan nama jalan via Proxy Backend)
      try {
        const { data } = await api.get('/api/admin/proxy/reverse-location', {
          params: { lat: lat, lon: lng },
        })
        if (data && data.display_name) {
          formLocation.value.address = data.display_name
          searchQuery.value = data.display_name
        }
      } catch (e) {
        console.error('Gagal reverse geocode:', e)
      }

      toastRef.value.addToast('Lokasi terkini diterapkan', 'success')
    } else {
      throw new Error('Koordinat tidak ditemukan di store')
    }
  } catch (e) {
    // Fallback Browser API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        formLocation.value.latitude = lat
        formLocation.value.longitude = lng
        mapCenter.value = [lat, lng]
        zoom.value = 18

        // Reverse Geo via Proxy juga untuk fallback
        try {
          const { data } = await api.get('/api/admin/proxy/reverse-location', {
            params: { lat, lon: lng },
          })
          if (data?.display_name) {
            formLocation.value.address = data.display_name
            searchQuery.value = data.display_name
          }
        } catch (err) {}

        toastRef.value.addToast('GPS Browser Berhasil', 'success')
      })
    } else {
      toastRef.value.addToast('Gagal mendapatkan lokasi', 'error')
    }
  } finally {
    isLocating.value = false
  }
}

// 4. Update saat Marker Digeser (Drag)
const updateCoordinates = (e) => {
  const { lat, lng } = e.target.getLatLng()
  formLocation.value.latitude = lat
  formLocation.value.longitude = lng
}

const saveLocation = async () => {
  try {
    // Pastikan field address terisi
    formLocation.value.address = searchQuery.value || formLocation.value.address
    await adminStore.saveOffice(formLocation.value)
    toastRef.value.addToast('Lokasi kantor berhasil disimpan', 'success')
    showMapModal.value = false
  } catch (e) {
    toastRef.value.addToast(e.message || 'Gagal menyimpan lokasi', 'error')
  }
}
</script>

<template>
  <div class="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans">
    <Toast ref="toastRef" />

    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold dark:text-white flex items-center gap-2">
          <Building2 class="text-orange-500" /> Manajemen Perusahaan
        </h1>
        <p class="text-gray-500">
          Kelola entitas perusahaan, lokasi kantor pusat (Leaflet), dan status akses.
        </p>
      </div>
      <button
        @click="openCreate"
        class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition hover:-translate-y-1"
      >
        <Plus size="20" /> Tambah Perusahaan
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="c in companies"
        :key="c.id"
        class="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative group"
        :class="!c.is_active ? 'grayscale-[0.8] opacity-80' : ''"
      >
        <div class="absolute top-0 right-0 p-4">
          <span
            v-if="!c.is_active"
            class="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded border border-red-200"
          >
            SUSPENDED
          </span>
        </div>

        <div class="p-6 pb-2 flex items-start gap-4">
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0"
            :class="c.is_active ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gray-400'"
          >
            {{ c.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-lg dark:text-white truncate" :title="c.name">{{ c.name }}</h3>
            <p class="text-xs text-gray-400">ID: {{ c.id }}</p>
          </div>
        </div>

        <div class="px-6 py-4 flex-1 space-y-3">
          <div class="flex items-start gap-2 text-sm">
            <div class="mt-0.5">
              <MapPinHouse v-if="c.has_office" size="16" class="text-blue-500" />
              <AlertCircle v-else size="16" class="text-red-400" />
            </div>

            <div v-if="c.has_office">
              <p class="text-gray-700 dark:text-gray-300 text-xs line-clamp-2 leading-relaxed">
                {{ c.office_address || 'Alamat terpasang' }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span
                  class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-semibold"
                  :class="
                    c.office_is_active
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  "
                >
                  <CheckCircle v-if="c.office_is_active" size="10" />
                  <X v-else size="10" />
                  {{ c.office_is_active ? 'Geofencing ON' : 'Geofencing OFF' }}
                </span>
                <span class="text-[10px] text-gray-400">Radius: {{ c.office_radius }}m</span>
              </div>
            </div>
            <p v-else class="text-xs text-red-400 italic mt-0.5">
              Lokasi belum diset (Absensi Bebas)
            </p>
          </div>
        </div>

        <div
          class="bg-gray-50 dark:bg-zinc-950/50 p-3 border-t dark:border-zinc-800 flex gap-2 items-center"
        >
          <button
            @click="openLocation(c)"
            class="flex-1 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 hover:border-orange-500 text-gray-600 dark:text-gray-300 hover:text-orange-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm"
          >
            <MapPinHouse size="14" /> {{ c.has_office ? 'Ubah Lokasi' : 'Set Lokasi' }}
          </button>

          <button
            v-if="c.has_office"
            @click="toggleOfficeStatus(c)"
            class="p-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg transition"
            title="Toggle Geofencing"
          >
            <Navigation
              size="16"
              :class="c.office_is_active ? 'text-green-500' : 'text-gray-400'"
            />
          </button>

          <button
            v-if="c.has_office"
            @click="deleteOffice(c)"
            class="p-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-gray-400 hover:text-red-500 rounded-lg transition"
            title="Reset Lokasi"
          >
            <MapPinOff size="16" />
          </button>

          <div class="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <button
            @click="openEdit(c)"
            class="p-2 text-gray-400 hover:text-orange-500 bg-white dark:bg-zinc-800 rounded-lg transition"
          >
            <Edit size="16" />
          </button>
          <button
            @click="toggleCompStatus(c)"
            class="p-2 bg-white dark:bg-zinc-800 rounded-lg transition"
            :class="c.is_active ? 'text-green-500' : 'text-red-500'"
          >
            <Power size="16" />
          </button>
          <button
            @click="deleteComp(c)"
            class="p-2 text-gray-400 hover:text-red-600 bg-white dark:bg-zinc-800 rounded-lg transition"
          >
            <Trash2 size="16" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-200"
      >
        <h2 class="text-xl font-bold dark:text-white mb-4">
          {{ isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan' }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">Nama Perusahaan</label>
            <input
              v-model="formCompany.name"
              class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-none mt-1 focus:ring-2 focus:ring-orange-500 dark:text-white"
              placeholder="Contoh: PT. Teknologi Maju"
            />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              @click="showFormModal = false"
              class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="submitCompany"
              class="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showMapModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        class="bg-white dark:bg-zinc-900 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200"
      >
        <div
          class="p-5 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10"
        >
          <div>
            <h2 class="text-lg font-bold dark:text-white flex items-center gap-2">
              <MapPinHouse class="text-orange-500" /> Konfigurasi Lokasi (Leaflet)
            </h2>
            <p class="text-xs text-gray-500">
              Setting untuk:
              <span class="font-bold text-orange-500">{{ formLocation.company_name }}</span>
            </p>
          </div>
          <button
            @click="showMapModal = false"
            class="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X class="text-gray-500" />
          </button>
        </div>

        <div class="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          <div
            class="w-full lg:w-1/3 p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-zinc-950 border-r dark:border-zinc-800 flex flex-col"
          >
            <div class="relative space-y-2 z-50">
              <label class="text-xs font-bold text-gray-400 uppercase">Cari Lokasi / Gedung</label>

              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search class="text-gray-400" size="18" />
                </div>
                <input
                  v-model="searchQuery"
                  @input="handleSearchInput"
                  @focus="showDropdown = true"
                  placeholder="Ketik nama sekolah/gedung..."
                  class="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 dark:text-white shadow-sm transition"
                />
                <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 class="animate-spin text-orange-500" size="18" />
                </div>
              </div>

              <div
                v-if="showDropdown && searchResults.length > 0"
                class="absolute w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border dark:border-zinc-700 mt-1 max-h-60 overflow-y-auto z-[100]"
              >
                <ul class="py-2">
                  <li
                    v-for="(res, idx) in searchResults"
                    :key="idx"
                    @click="selectResult(res)"
                    class="px-4 py-3 hover:bg-orange-50 dark:hover:bg-zinc-800 cursor-pointer border-b dark:border-zinc-800 last:border-0 transition flex items-start gap-3"
                  >
                    <MapPin class="shrink-0 text-orange-500 mt-0.5" size="16" />
                    <div>
                      <p class="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                        {{ res.display_name.split(',')[0] }}
                      </p>
                      <p class="text-xs text-gray-500 line-clamp-1">{{ res.display_name }}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <button
                @click="getCurrentLocation"
                :disabled="isLocating"
                class="w-full py-3 bg-white dark:bg-zinc-800 border dark:border-zinc-700 hover:border-orange-500 text-gray-700 dark:text-gray-300 hover:text-orange-500 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Loader2 v-if="isLocating" class="animate-spin" size="18" />
                <Navigation v-else size="18" />
                Gunakan Lokasi Saya Saat Ini
              </button>
            </div>

            <hr class="border-gray-200 dark:border-zinc-800" />

            <div class="space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between">
                  <label class="text-xs font-bold text-gray-400 uppercase"
                    >Radius (Toleransi)</label
                  >
                  <span class="text-xs font-bold text-orange-500"
                    >{{ formLocation.radius }} Meter</span
                  >
                </div>
                <input
                  v-model.number="formLocation.radius"
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  class="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase">Latitude</label>
                  <input
                    v-model.number="formLocation.latitude"
                    type="number"
                    step="any"
                    class="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 text-xs font-mono border dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase">Longitude</label>
                  <input
                    v-model.number="formLocation.longitude"
                    type="number"
                    step="any"
                    class="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 text-xs font-mono border dark:border-zinc-700"
                  />
                </div>
              </div>

              <div
                class="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 text-xs text-orange-700 dark:text-orange-400"
              >
                <p class="font-bold mb-1">Panduan:</p>
                <ul class="list-disc list-inside space-y-1 opacity-80">
                  <li>Ketik nama tempat (tunggu sebentar) dan pilih dari dropdown.</li>
                  <li>Gunakan tombol "Lokasi Saya" untuk deteksi GPS cepat.</li>
                  <li>Geser Pin Biru di peta untuk akurasi posisi.</li>
                </ul>
              </div>
            </div>

            <button
              @click="saveLocation"
              class="w-full py-4 bg-orange-500 text-white rounded-xl font-bold flex justify-center gap-2 hover:bg-orange-600 transition shadow-xl shadow-orange-500/20 mt-auto"
            >
              <Save size="20" /> SIMPAN KONFIGURASI
            </button>
          </div>

          <div class="w-full lg:w-2/3 h-[400px] lg:h-full relative bg-gray-100 z-0">
            <l-map
              v-if="isMapReady"
              v-model:zoom="zoom"
              :center="mapCenter"
              :use-global-leaflet="false"
              class="h-full w-full"
              @click="() => (showDropdown = false)"
            >
              <l-tile-layer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              ></l-tile-layer>

              <l-marker
                :lat-lng="[formLocation.latitude, formLocation.longitude]"
                draggable
                @moveend="updateCoordinates"
              >
                <l-tooltip>Pusat Kantor</l-tooltip>
              </l-marker>

              <l-circle
                :lat-lng="[formLocation.latitude, formLocation.longitude]"
                :radius="formLocation.radius"
                color="#f97316"
                :weight="2"
                fillColor="#f97316"
                :fillOpacity="0.2"
              />
            </l-map>
            <div v-else class="flex items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 class="animate-spin" /> Memuat Peta...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
