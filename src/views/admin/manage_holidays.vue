<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import Toast from '../../components/Allert/allert.vue'
import { Calendar, Trash2, Plus, RefreshCw, CloudDownloadIcon } from 'lucide-vue-next'

const adminStore = useAdminStore()
const toastRef = ref(null)
const holidays = ref([])
const newHoliday = ref({ name: '', date: '' })
const isSyncing = ref(false)

const handleSync = async () => {
  if (isSyncing.value) return
  isSyncing.value = true
  try {
    const res = await adminStore.syncHolidays()
    toastRef.value.addToast(res.message, 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal sinkronisasi', 'error')
  } finally {
    isSyncing.value = false
  }
}

const fetchHolidays = async () => {
  try {
    holidays.value = await adminStore.fetchHolidays()
  } catch (e) {
    console.error(e)
  }
}

const addHoliday = async () => {
  if (!newHoliday.value.name || !newHoliday.value.date) return
  try {
    await adminStore.createHoliday(newHoliday.value)
    toastRef.value.addToast('Hari libur ditambahkan', 'success')
    newHoliday.value = { name: '', date: '' }
    fetchHolidays()
  } catch (e) {
    toastRef.value.addToast('Gagal menambah', 'error')
  }
}

const deleteHoliday = async (id) => {
  if (!confirm('Hapus hari libur ini?')) return
  try {
    await adminStore.deleteHoliday(id)
    toastRef.value.addToast('Dihapus', 'success')
    fetchHolidays()
  } catch (e) {
    toastRef.value.addToast('Gagal menghapus', 'error')
  }
}

onMounted(fetchHolidays)
</script>

<template>
  <div class="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans">
    <Toast ref="toastRef" />
    <h1 class="text-3xl font-bold dark:text-white">Manage Holidays</h1>

    <button
      @click="handleSync"
      :disabled="isSyncing"
      class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw :class="{ 'animate-spin': isSyncing }" size="18" />
      <span>{{ isSyncing ? 'Mengambil Data...' : 'Sync Nasional' }}</span>
    </button>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Form Tambah -->
      <div
        class="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border dark:border-zinc-800 h-fit"
      >
        <h2 class="font-bold mb-4 dark:text-white">Tambah Hari Libur</h2>
        <form @submit.prevent="addHoliday" class="space-y-4">
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">Nama Libur</label>
            <input
              v-model="newHoliday.name"
              class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none"
              placeholder="Contoh: Idul Fitri"
              required
            />
          </div>
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">Tanggal</label>
            <input
              v-model="newHoliday.date"
              type="date"
              class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 flex justify-center gap-2"
          >
            <Plus size="20" /> Tambah
          </button>
        </form>
      </div>

      <!-- List Holidays -->
      <div
        class="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 overflow-hidden"
      >
        <table class="w-full text-left">
          <thead
            class="bg-gray-50 dark:bg-zinc-800/50 text-gray-400 text-xs uppercase font-semibold"
          >
            <tr>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Keterangan</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
            <tr v-for="h in holidays" :key="h.id">
              <td class="px-6 py-4 font-mono text-sm dark:text-gray-300">
                {{
                  new Date(h.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                }}
              </td>
              <td class="px-6 py-4 font-bold text-gray-700 dark:text-white">{{ h.name }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="deleteHoliday(h.id)"
                  class="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size="18" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="holidays.length === 0" class="p-8 text-center text-gray-400">
          Belum ada data hari libur.
        </div>
      </div>
    </div>
  </div>
</template>
