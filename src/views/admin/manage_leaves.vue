<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import Toast from '../../components/Allert/allert.vue'
import {
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Search,
  Filter,
  AlertCircle,
  Calendar,
  Clock,
  ChevronDown,
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const adminStore = useAdminStore()
const toastRef = ref(null)
const leaves = ref([])
const isLoading = ref(false)

const searchQuery = ref('')
const activeTab = ref('all')

// State untuk Modal
const modal = reactive({
  show: false,
  type: '', // 'approve' atau 'reject'
  data: null,
  reason: '',
})

// --- FETCH DATA ---
const fetchLeaves = async () => {
  isLoading.value = true
  try {
    const response = await adminStore.fetchAllLeaves()
    console.log('Response dari Backend:', response)
    // Handle struktur response { success: true, data: [...] }
    leaves.value = response.data || response
  } catch (error) {
    toastRef.value.addToast('Gagal memuat data izin', 'error')
  } finally {
    isLoading.value = false
  }
}

// --- COMPUTED: FILTERING ---
const filteredLeaves = computed(() => {
  let result = leaves.value

  // 1. Filter by Tab Status
  if (activeTab.value !== 'all') {
    result = result.filter((l) => l.status === activeTab.value)
  }

  // 2. Filter by Search (Name)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (l) => l.user_name?.toLowerCase().includes(query) || l.email?.toLowerCase().includes(query),
    )
  }

  return result
})

// --- ACTIONS ---
const openModal = (type, leave) => {
  modal.type = type
  modal.data = leave
  modal.reason = ''
  modal.show = true
}

const closeModal = () => {
  modal.show = false
  modal.data = null
}

const confirmAction = async () => {
  if (!modal.data) return

  const id = modal.data.id
  isLoading.value = true

  try {
    if (modal.type === 'approve') {
      await adminStore.approveLeave(id)
      toastRef.value.addToast(`Izin ${modal.data.user_name} disetujui`, 'success')
    } else {
      if (!modal.reason) {
        toastRef.value.addToast('Alasan penolakan wajib diisi', 'error')
        isLoading.value = false
        return
      }
      await adminStore.rejectLeave(id, modal.reason)
      toastRef.value.addToast('Izin berhasil ditolak', 'success')
    }

    await fetchLeaves() // Refresh data
    closeModal()
  } catch (error) {
    toastRef.value.addToast('Gagal memproses permintaan', 'error')
  } finally {
    isLoading.value = false
  }
}

// --- HELPERS ---
const formatDate = (date) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const getDuration = (start, end) => {
  const diff = new Date(end) - new Date(start)
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1 + ' Hari'
}
const getAttachmentUrl = (path) => (path ? `${API_BASE_URL}${path}` : null)

onMounted(fetchLeaves)
</script>

<template>
  <div
    class="p-6 min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans transition-colors duration-300"
  >
    <Toast ref="toastRef" />

    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Manajemen Izin
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Kelola pengajuan cuti dan izin karyawan.
        </p>
      </div>

      <div class="relative w-full md:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama user..."
          class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
        />
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-zinc-800 pb-1">
      <button
        v-for="tab in ['all', 'pending', 'approved', 'rejected']"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2"
        :class="
          activeTab === tab
            ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
            : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
        "
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>

    <div
      class="bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead
            class="bg-gray-50/80 dark:bg-zinc-800/50 text-gray-400 text-xs uppercase font-semibold"
          >
            <tr>
              <th class="px-6 py-4">Karyawan</th>
              <th class="px-6 py-4">Tipe & Tanggal</th>
              <th class="px-6 py-4">Alasan</th>
              <th class="px-6 py-4 text-center">Bukti</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
              <th class="px-6 py-4">Validator</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
            <tr v-if="isLoading && leaves.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex justify-center items-center gap-2 text-gray-500">
                  <div
                    class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
                  ></div>
                  Memuat data...
                </div>
              </td>
            </tr>

            <tr v-else-if="filteredLeaves.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400">
                <div class="flex flex-col items-center gap-3">
                  <div class="p-3 bg-gray-50 dark:bg-zinc-800 rounded-full">
                    <Filter class="w-6 h-6 opacity-50" />
                  </div>
                  <p>Tidak ada data pengajuan yang sesuai.</p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="leave in filteredLeaves"
              :key="leave.id"
              class="group hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs"
                  >
                    {{ leave.user_name?.[0]?.toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white text-sm">
                      {{ leave.user_name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ leave.email }}</p>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit tracking-wide"
                    :class="{
                      'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800':
                        leave.type === 'izin',
                      'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800':
                        leave.type === 'sakit',
                      'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800':
                        leave.type === 'cuti',
                    }"
                  >
                    {{ leave.type }}
                  </span>
                  <div
                    class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mt-1"
                  >
                    <Calendar class="w-3.5 h-3.5" />
                    {{ formatDate(leave.start_date) }} - {{ formatDate(leave.end_date) }}
                  </div>
                  <div class="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock class="w-3 h-3" />
                    {{ getDuration(leave.start_date, leave.end_date) }}
                  </div>
                </div>
              </td>

              <td class="px-6 py-4">
                <p
                  class="text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate"
                  :title="leave.reason"
                >
                  {{ leave.reason }}
                </p>
              </td>

              <td class="px-6 py-4 text-center">
                <a
                  v-if="leave.attachment_url"
                  :href="getAttachmentUrl(leave.attachment_url)"
                  target="_blank"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition"
                  title="Lihat Bukti"
                >
                  <FileText class="w-4 h-4" />
                </a>
                <span v-else class="text-gray-300 dark:text-zinc-700">-</span>
              </td>

              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border"
                  :class="{
                    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30':
                      leave.status === 'pending',
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30':
                      leave.status === 'approved',
                    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30':
                      leave.status === 'rejected',
                  }"
                >
                  {{ leave.status }}
                </span>
              </td>

              <td class="px-6 py-4 text-right">
                <div v-if="leave.status === 'pending'" class="flex justify-end gap-2">
                  <button
                    @click="openModal('approve', leave)"
                    class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                    title="Setujui"
                  >
                    <CheckCircle2 class="w-5 h-5" />
                  </button>
                  <button
                    @click="openModal('reject', leave)"
                    class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Tolak"
                  >
                    <XCircle class="w-5 h-5" />
                  </button>
                </div>
                <span v-else class="text-xs text-gray-400 italic">Selesai</span>
              </td>

              <td class="px-6 py-4">
                <div v-if="leave.validator_name" class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300"
                  >
                    {{ leave.validator_name[0].toUpperCase() }}
                  </div>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{
                    leave.validator_name
                  }}</span>
                </div>
                <span v-else class="text-xs text-gray-400 italic">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="modal.show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          class="bg-white dark:bg-[#18181b] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
        >
          <div
            class="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-4"
            :class="
              modal.type === 'approve'
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'bg-red-50/50 dark:bg-red-900/10'
            "
          >
            <div
              class="p-3 rounded-full shrink-0"
              :class="
                modal.type === 'approve'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
              "
            >
              <CheckCircle2 v-if="modal.type === 'approve'" class="w-6 h-6" />
              <AlertCircle v-else class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ modal.type === 'approve' ? 'Setujui Pengajuan?' : 'Tolak Pengajuan?' }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{
                  modal.type === 'approve'
                    ? 'Tindakan ini akan mencatat kehadiran user.'
                    : 'User akan menerima notifikasi penolakan.'
                }}
              </p>
            </div>
          </div>

          <div class="p-6">
            <div v-if="modal.type === 'reject'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Alasan Penolakan <span class="text-red-500">*</span></label
              >
              <textarea
                v-model="modal.reason"
                rows="3"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none dark:text-white"
                placeholder="Contoh: Kuota cuti habis..."
              ></textarea>
            </div>
            <p v-else class="text-gray-600 dark:text-gray-300">
              Anda yakin ingin menyetujui izin dari <b>{{ modal.data?.user_name }}</b
              >?
            </p>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-zinc-900/50 flex justify-end gap-3">
            <button
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="confirmAction"
              class="px-5 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition flex items-center gap-2"
              :class="
                modal.type === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
              "
              :disabled="isLoading"
            >
              <div
                v-if="isLoading"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              {{ modal.type === 'approve' ? 'Ya, Setujui' : 'Tolak Pengajuan' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
