<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
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
} from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LCircle, LTooltip } from '@vue-leaflet/vue-leaflet'

const adminStore = useAdminStore()
const toastRef = ref(null)
const isLoading = ref(false)

const showFormModal = ref(false)
const isEdit = ref(false)
const formCompany = ref({ id: null, name: '' })

const showMapModal = ref(false)
const isMapReady = ref(false)
const mapCenter = ref([-6.2088, 106.8456])
const zoom = ref(15)

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

const openCreate = () => {
  isEdit.value = false
  formCompany.value = { name: '' }
  showFormModal.value = true
}

const timeoutId = ref(null)

const updateCoordinates = (e) => {
  const { lat, lng } = e.target.getLatLng()

  formLocation.value.latitude = lat
  formLocation.value.longitude = lng

  if (timeoutId.value) clearTimeout(timeoutId.value)

  timeoutId.value = setTimeout(async () => {
    try {
      const emailContact = 'jibrilnation@gmail.com'

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=${emailContact}`

      const response = await fetch(url)
      const data = await response.json()

      if (data && data.display_name) {
        formLocation.value.address = data.display_name
      }
    } catch (error) {
      console.error('Gagal mengambil alamat otomatis', error)
    }
  }, 800)
}
const openEdit = (c) => {
  isEdit.value = true
  formCompany.value = { id: c.id, name: c.name }
  showFormModal.value = true
}

const submitCompany = async () => {
  try {
    if (isEdit.value) {
      if (adminStore.updateCompany) {
        await adminStore.updateCompany(formCompany.value.id, { name: formCompany.value.name })
      } else {
        throw new Error('Fitur update company belum tersedia di store')
      }
    } else {
      await adminStore.createCompany({ name: formCompany.value.name })
    }
    toastRef.value.addToast('Data perusahaan berhasil disimpan', 'success')
    showFormModal.value = false
  } catch (e) {
    toastRef.value.addToast(e.message || 'Gagal menyimpan data', 'error')
  }
}

const deleteComp = async (c) => {
  if (
    !confirm(
      `Hapus permanen perusahaan ${c.name}?\nData user & absensi terkait mungkin akan error atau hilang.`,
    )
  )
    return
  try {
    if (adminStore.deleteCompany) {
      await adminStore.deleteCompany(c.id)
    } else {
      throw new Error('Fitur delete company belum tersedia di store')
    }
    toastRef.value.addToast('Perusahaan dihapus', 'success')
  } catch (e) {
    toastRef.value.addToast(e.message || 'Gagal hapus', 'error')
  }
}

// --- MAP & LOCATION LOGIC ---

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
    formLocation.value.latitude = -6.2088
    formLocation.value.longitude = 106.8456
    formLocation.value.radius = 100
    formLocation.value.address = ''
  }

  mapCenter.value = [formLocation.value.latitude, formLocation.value.longitude]

  showMapModal.value = true

  setTimeout(() => {
    isMapReady.value = true
  }, 500)
}

const saveLocation = async () => {
  try {
    // Kirim data ke backend
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

    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold dark:text-white">Manage Companies</h1>
        <p class="text-gray-500">Kelola perusahaan dan lokasi kantor pusat.</p>
      </div>
      <button
        @click="openCreate"
        class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition hover:-translate-y-1"
      >
        <Plus size="20" /> Tambah Perusahaan
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="c in companies"
        :key="c.id"
        class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm hover:shadow-md transition group"
      >
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400"
            >
              <Building2 size="24" />
            </div>
            <div>
              <h3 class="font-bold text-lg dark:text-white line-clamp-1">{{ c.name }}</h3>
              <p class="text-xs text-gray-400">ID: {{ c.id }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-3 mb-6 min-h-[60px]">
          <div class="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <MapPinHouse size="16" class="mt-0.5 shrink-0 text-gray-400" />
            <span v-if="c.has_office" class="line-clamp-2 text-xs">{{
              c.office_address || 'Lokasi Terpasang'
            }}</span>
            <span
              v-else
              class="text-xs text-red-400 italic bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded"
              >Belum ada lokasi kantor</span
            >
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t dark:border-zinc-800">
          <button
            @click="openLocation(c)"
            class="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
          >
            <MapPinHouse size="14" /> Set Lokasi
          </button>

          <div class="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <button
            @click="openEdit(c)"
            class="p-2 text-gray-400 hover:text-orange-500 bg-gray-50 dark:bg-zinc-800 rounded-lg transition"
            title="Edit Nama"
          >
            <Edit size="16" />
          </button>
          <button
            @click="deleteComp(c)"
            class="p-2 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-zinc-800 rounded-lg transition"
            title="Hapus"
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
        class="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200"
      >
        <div
          class="p-5 border-b dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10"
        >
          <div>
            <h2 class="text-lg font-bold dark:text-white flex items-center gap-2">
              <MapPinHouse class="text-orange-500" /> Set Lokasi Kantor
            </h2>
            <p class="text-xs text-gray-500">
              Perusahaan:
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
            class="w-full lg:w-1/3 p-6 space-y-5 overflow-y-auto bg-gray-50 dark:bg-zinc-950 border-r dark:border-zinc-800"
          >
            <div
              class="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 text-xs text-orange-700 dark:text-orange-400"
            >
              <p class="font-bold mb-1">Panduan:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>Geser marker biru di peta untuk menentukan titik pusat.</li>
                <li>Atur radius untuk area absensi yang valid.</li>
              </ul>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase">Alamat Kantor</label>
              <textarea
                v-model="formLocation.address"
                rows="3"
                class="w-full p-3 rounded-xl border-none bg-white dark:bg-zinc-800 dark:text-white text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="Detail alamat..."
              ></textarea>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between">
                <label class="text-xs font-bold text-gray-400 uppercase">Radius Absensi</label>
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
                class="w-full accent-orange-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase">Latitude</label>
                <input
                  v-model.number="formLocation.latitude"
                  type="number"
                  step="any"
                  class="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase">Longitude</label>
                <input
                  v-model.number="formLocation.longitude"
                  type="number"
                  step="any"
                  class="w-full p-2 rounded-lg bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

            <button
              @click="saveLocation"
              class="w-full py-3 bg-orange-500 text-white rounded-xl font-bold flex justify-center gap-2 hover:bg-orange-600 transition shadow-lg shadow-orange-500/20 mt-4"
            >
              <Save size="18" /> Simpan Lokasi
            </button>
          </div>

          <div class="w-full lg:w-2/3 h-[400px] lg:h-full relative bg-gray-200">
            <l-map
              v-if="isMapReady"
              v-model:zoom="zoom"
              :center="mapCenter"
              :use-global-leaflet="false"
              class="z-0"
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
                color="orange"
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
