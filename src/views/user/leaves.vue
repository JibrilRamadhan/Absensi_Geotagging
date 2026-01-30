<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/userStore'
import Toast from '../../components/Allert/allert.vue'
import {
  Calendar,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Stethoscope,
  Plane,
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()
const toastRef = ref(null)
const showModal = ref(false)
const isLoading = ref(false)

const form = ref({
  type: '',
  start_date: '',
  end_date: '',
  reason: '',
  attachment: null,
})

// Opsi Tipe Izin
const leaveTypes = [
  { value: 'izin', label: 'Izin Pribadi', icon: Briefcase },
  { value: 'sakit', label: 'Sakit', icon: Stethoscope },
  { value: 'cuti', label: 'Cuti Tahunan', icon: Plane },
]

const handleFile = (e) => {
  const file = e.target.files[0]
  // Validasi ukuran file (max 2MB)
  if (file && file.size > 2 * 1024 * 1024) {
    toastRef.value.addToast('Ukuran file maksimal 2MB', 'error')
    e.target.value = null // Reset input
    return
  }
  form.value.attachment = file
}

const submitLeave = async () => {
  // 1. Validasi Input Dasar
  if (!form.value.type || !form.value.start_date || !form.value.end_date || !form.value.reason) {
    toastRef.value.addToast('Mohon lengkapi semua kolom wajib (*)', 'error')
    return
  }

  // 2. Validasi Tanggal Logis
  if (new Date(form.value.start_date) > new Date(form.value.end_date)) {
    toastRef.value.addToast('Tanggal selesai tidak boleh sebelum tanggal mulai', 'error')
    return
  }

  if (form.value.type === 'sakit' && !form.value.attachment) {
    toastRef.value.addToast('Wajib melampirkan surat dokter untuk izin sakit', 'error')
    return
  }

  isLoading.value = true
  try {
    const formData = new FormData()
    formData.append('type', form.value.type)
    formData.append('start_date', form.value.start_date)
    formData.append('end_date', form.value.end_date)
    formData.append('reason', form.value.reason)
    if (form.value.attachment) {
      formData.append('attachment', form.value.attachment)
    }

    await userStore.requestLeave(formData)

    toastRef.value.addToast('Pengajuan berhasil dikirim', 'success')
    showModal.value = false

    form.value = { type: '', start_date: '', end_date: '', reason: '', attachment: null }
  } catch (error) {
    const msg = error.message || 'Gagal mengirim pengajuan'
    toastRef.value.addToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getDuration = (start, end) => {
  const diff = new Date(end) - new Date(start)
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  return `${days} Hari`
}

onMounted(() => {
  userStore.fetchMyLeaves()
})
</script>

<template>
  <div
    class="p-6 min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans transition-colors duration-300"
  >
    <Toast ref="toastRef" />

    <div
      class="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Manajemen Izin
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Ajukan dan pantau status permohonan cuti Anda.
        </p>
      </div>
      <button
        @click="showModal = true"
        class="group bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
      >
        <Plus class="w-5 h-5 transition-transform group-hover:rotate-90" />
        Buat Pengajuan Baru
      </button>
    </div>

    <div class="max-w-5xl mx-auto">
      <div
        v-if="userStore.loading && userStore.leaves.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-500 text-sm">Memuat data...</p>
      </div>

      <div
        v-else-if="userStore.leaves.length === 0"
        class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700"
      >
        <div class="bg-gray-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
          <Calendar class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Belum ada riwayat</h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-6">
          Anda belum pernah mengajukan izin atau cuti. Mulai dengan membuat pengajuan baru.
        </p>
        <button
          @click="showModal = true"
          class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Ajukan Sekarang
        </button>
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="leave in userStore.leaves"
          :key="leave.id"
          class="group bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800/50 hover:border-indigo-100 dark:hover:border-indigo-900/30 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div class="flex flex-col md:flex-row gap-5 justify-between">
            <div class="flex gap-4">
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                :class="{
                  'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400':
                    leave.type === 'izin',
                  'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400':
                    leave.type === 'sakit',
                  'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400':
                    leave.type === 'cuti',
                }"
              >
                <Briefcase v-if="leave.type === 'izin'" class="w-6 h-6" />
                <Stethoscope v-else-if="leave.type === 'sakit'" class="w-6 h-6" />
                <Plane v-else class="w-6 h-6" />
              </div>

              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {{ leave.type }}
                  </span>
                  <span class="text-gray-300 dark:text-zinc-700">•</span>
                  <span class="text-xs text-gray-500">{{ formatDate(leave.created_at) }}</span>
                </div>

                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {{ leave.reason }}
                </h3>

                <div
                  class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <div
                    class="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded-md"
                  >
                    <Calendar class="w-4 h-4 text-gray-400" />
                    <span
                      >{{ formatDate(leave.start_date) }} - {{ formatDate(leave.end_date) }}</span
                    >
                  </div>
                  <div
                    class="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded-md"
                  >
                    <Clock class="w-4 h-4 text-gray-400" />
                    <span>{{ getDuration(leave.start_date, leave.end_date) }}</span>
                  </div>
                </div>

                <a
                  v-if="leave.attachment_url"
                  :href="`${API_BASE_URL}${leave.attachment_url}`"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline transition-colors"
                >
                  <FileText class="w-3.5 h-3.5" />
                  Lihat Lampiran Bukti
                </a>
              </div>
            </div>

            <div
              class="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center min-w-[140px] gap-2"
            >
              <div
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border"
                :class="{
                  'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30':
                    leave.status === 'pending',
                  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30':
                    leave.status === 'approved',
                  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30':
                    leave.status === 'rejected',
                }"
              >
                <Clock v-if="leave.status === 'pending'" class="w-3.5 h-3.5" />
                <CheckCircle2 v-if="leave.status === 'approved'" class="w-3.5 h-3.5" />
                <XCircle v-if="leave.status === 'rejected'" class="w-3.5 h-3.5" />
                {{ leave.status }}
              </div>

              <div
                v-if="leave.status !== 'pending' && leave.validator_name"
                class="text-right mt-1"
              >
                <p class="text-[10px] text-gray-400 uppercase tracking-wide">Diproses oleh:</p>
                <p
                  class="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-end gap-1"
                >
                  <User class="w-3 h-3" /> {{ leave.validator_name }}
                </p>
              </div>

              <div
                v-if="leave.status === 'rejected' && leave.rejection_note"
                class="text-right mt-1 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-800/30"
              >
                <p
                  class="text-[10px] text-red-500 font-medium italic max-w-[200px] truncate"
                  :title="leave.rejection_note"
                >
                  "{{ leave.rejection_note }}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        @click.self="showModal = false"
      >
        <div
          class="bg-white dark:bg-[#121212] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-[#121212] rounded-t-2xl"
          >
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Form Pengajuan</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Silakan isi detail izin atau cuti Anda.
              </p>
            </div>
            <button
              @click="showModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <XCircle class="w-6 h-6" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto">
            <form @submit.prevent="submitLeave" class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >Tipe Pengajuan <span class="text-red-500">*</span></label
                >
                <div class="grid grid-cols-3 gap-3">
                  <div v-for="type in leaveTypes" :key="type.value">
                    <input
                      type="radio"
                      :id="type.value"
                      :value="type.value"
                      v-model="form.type"
                      class="hidden peer"
                    />
                    <label
                      :for="type.value"
                      class="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-gray-100 dark:border-zinc-800 cursor-pointer transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/20 dark:peer-checked:border-indigo-500 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <component
                        :is="type.icon"
                        class="w-6 h-6 mb-1 text-gray-500 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400"
                      />
                      <span
                        class="text-xs font-medium text-gray-600 peer-checked:text-indigo-700 dark:text-gray-400 dark:peer-checked:text-indigo-300 text-center"
                        >{{ type.label }}</span
                      >
                    </label>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >Dari <span class="text-red-500">*</span></label
                  >
                  <div class="relative">
                    <input
                      v-model="form.start_date"
                      type="date"
                      class="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                    />
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >Sampai <span class="text-red-500">*</span></label
                  >
                  <div class="relative">
                    <input
                      v-model="form.end_date"
                      type="date"
                      class="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                    />
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >Keterangan / Alasan <span class="text-red-500">*</span></label
                >
                <textarea
                  v-model="form.reason"
                  rows="3"
                  class="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none resize-none"
                  placeholder="Contoh: Saya sedang demam tinggi..."
                ></textarea>
              </div>

              <div class="space-y-1.5">
                <div class="flex justify-between">
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Lampiran Bukti
                    <span v-if="form.type === 'sakit'" class="text-red-500 text-xs font-normal ml-1"
                      >(Wajib Surat Dokter)</span
                    >
                    <span v-else class="text-gray-400 text-xs font-normal ml-1">(Opsional)</span>
                  </label>
                </div>

                <div class="relative group">
                  <input
                    @change="handleFile"
                    type="file"
                    id="file_input"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                  <div
                    class="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-zinc-700 transition"
                  >
                    <div class="bg-white dark:bg-zinc-600 p-2 rounded-lg shadow-sm">
                      <FileText class="w-5 h-5 text-indigo-500" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {{ form.attachment ? form.attachment.name : 'Klik untuk upload file' }}
                      </p>
                      <p class="text-xs text-gray-400">Max 2MB (JPG, PNG, PDF)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  @click="showModal = false"
                  class="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <div
                    v-if="isLoading"
                    class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  ></div>
                  {{ isLoading ? 'Mengirim...' : 'Kirim Pengajuan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
