<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../api/axios'
import {
  Edit2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  Camera,
  X,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const showEditModal = ref(false)
const isSaving = ref(false)
const previewImage = ref(null)

const editForm = reactive({
  name: '',
  email: '',
  phone_number: '',
  bio: '',
  address: '',
  password: '',
  profile_picture: null,
})

const attendanceStats = ref({
  present: 0,
  absent: 0,
  late: 0,
  total: 0,
})

const fetchStats = async () => {
  try {
    const { data } = await api.get('/api/attendance/me/history')

    let present = 0
    let late = 0
    let absent = 0

    data.forEach((log) => {
      //Jika check_in > jam 9 pagi = Telat (Contoh)
      const checkInTime = new Date(log.check_in)
      const limitTime = new Date(log.check_in)
      limitTime.setHours(9, 0, 0) // Misal jam 9 teng

      if (checkInTime > limitTime) {
        late++
      } else {
        present++
      }
    })
    const total = data.length

    attendanceStats.value = {
      present,
      late,
      absent,
      total,
    }
  } catch (err) {
    console.error('Gagal hitung statistik', err)
  }
}

const user = computed(() => authStore.user)
const isLoading = computed(() => authStore.loading)
const profileImage = computed(() => authStore.profileImage)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (authStore.user) {
    syncForm(authStore.user)
    fetchStats()
  }
})

const syncForm = (data) => {
  editForm.name = data.name || ''
  editForm.email = data.email || ''
  editForm.phone_number = data.phone_number || ''
  editForm.bio = data.bio || ''
  editForm.address = data.address || ''
  editForm.password = ''
  editForm.profile_picture = null
}

/* ===============================
   IMAGE HANDLER
================================ */
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  editForm.profile_picture = file
  previewImage.value = URL.createObjectURL(file)
}

/* ===============================
   MODAL
================================ */
const openEditModal = () => {
  if (!user.value) return
  syncForm(user.value)
  previewImage.value = null
  showEditModal.value = true
}

const saveProfile = async () => {
  isSaving.value = true

  try {
    const formData = new FormData()

    Object.entries(editForm).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })

    await authStore.updateProfile(formData)

    showEditModal.value = false
    previewImage.value = null
  } catch (err) {
    console.error('Update profile failed:', err)
  } finally {
    isSaving.value = false
  }
}

const getAttendancePercentage = (value) => {
  if (!attendanceStats.value.total) return 0
  return Math.round((value / attendanceStats.value.total) * 100)
}

const goBackDashboard = () => {
  router.push(user.value?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
}

const getStatusColor = (status) =>
  ({
    present: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    absent: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    late: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  })[status] || 'bg-gray-100 text-gray-700'

const getStatusLabel = (status) =>
  ({
    present: 'Hadir',
    absent: 'Absen',
    late: 'Terlambat',
  })[status] || status
</script>

<template>
  <div class="profile-page space-y-6">
    <div class="flex items-center gap-3 mb-4">
      <button
        @click="goBackDashboard"
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 dark:border-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition shadow-sm"
      >
        <ChevronLeft size="18" />
      </button>
    </div>

    <!-- Profile Header Section -->
    <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <div
          class="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:border dark:border-zinc-800 overflow-hidden"
        >
          <!-- Cover Background -->
          <div class="h-24 bg-gradient-to-r from-orange-500 to-orange-600"></div>

          <!-- Profile Info -->
          <div class="px-6 pb-6 -mt-12 relative z-10">
            <div class="flex justify-center mb-4">
              <img
                :src="profileImage"
                :alt="user?.name"
                class="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-900 object-cover shadow-md"
              />
            </div>

            <h2 class="text-xl font-bold text-center dark:text-white mb-1">
              {{ user?.name || 'User' }}
            </h2>
            <p class="text-sm text-center text-gray-500 dark:text-zinc-400 capitalize mb-4">
              {{ user?.role || 'Intern' }}
            </p>

            <button
              @click="openEditModal"
              class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <Edit2 size="18" />
              Edit Profil
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div
          class="mt-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:border dark:border-zinc-800 p-6"
        >
          <h3 class="font-bold text-lg dark:text-white mb-4">Statistik Hari Ini</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-zinc-400">Jam Kerja</span>
              <span class="font-bold text-lg dark:text-white">08:45</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: 73%"></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-zinc-500">Target: 12 jam</p>
          </div>
        </div>
      </div>

      <!-- Profile Details & Stats -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Personal Information -->
        <div
          class="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:border dark:border-zinc-800 p-6"
        >
          <h3 class="font-bold text-lg dark:text-white mb-6">Informasi Pribadi</h3>

          <div class="space-y-4">
            <!-- Email -->
            <div class="flex items-start gap-4">
              <div class="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
                <Mail size="20" class="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold">Email</p>
                <p class="font-medium text-gray-800 dark:text-white">{{ user?.email || '-' }}</p>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex items-start gap-4">
              <div class="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                <Phone size="20" class="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold">
                  No. Telepon
                </p>
                <p class="font-medium text-gray-800 dark:text-white">
                  {{ user?.phone_number || 'Belum diisi' }}
                </p>
              </div>
            </div>

            <!-- Address -->
            <div class="flex items-start gap-4">
              <div class="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
                <MapPin size="20" class="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold">Alamat</p>
                <p class="font-medium text-gray-800 dark:text-white">
                  {{ user?.address || 'Belum diisi' }}
                </p>
              </div>
            </div>

            <!-- Bio -->
            <div class="flex items-start gap-4">
              <div class="p-3 bg-green-100 dark:bg-green-500/10 rounded-xl">
                <FileText size="20" class="text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1">
                <p class="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold">Bio</p>
                <p class="font-medium text-gray-800 dark:text-white">
                  {{ user?.bio || 'Belum diisi' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Attendance Statistics -->
        <div
          class="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:border dark:border-zinc-800 p-6"
        >
          <h3 class="font-bold text-lg dark:text-white mb-6">Statistik Kehadiran</h3>

          <div class="grid grid-cols-4 gap-3">
            <!-- Present -->
            <div class="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 text-center">
              <div class="flex justify-center mb-2">
                <CheckCircle size="24" class="text-green-600 dark:text-green-400" />
              </div>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ attendanceStats.present }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Hadir</p>
              <p class="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                {{ getAttendancePercentage(attendanceStats.present) }}%
              </p>
            </div>

            <!-- Absent -->
            <div class="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 text-center">
              <div class="flex justify-center mb-2">
                <XCircle size="24" class="text-red-600 dark:text-red-400" />
              </div>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ attendanceStats.absent }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Absen</p>
              <p class="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                {{ getAttendancePercentage(attendanceStats.absent) }}%
              </p>
            </div>

            <!-- Late -->
            <div class="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 text-center">
              <div class="flex justify-center mb-2">
                <Clock size="24" class="text-orange-600 dark:text-orange-400" />
              </div>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ attendanceStats.late }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Terlambat</p>
              <p class="text-xs font-bold text-orange-600 dark:text-orange-400 mt-1">
                {{ getAttendancePercentage(attendanceStats.late) }}%
              </p>
            </div>

            <!-- Total -->
            <div class="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 text-center">
              <div class="flex justify-center mb-2">
                <Calendar size="24" class="text-blue-600 dark:text-blue-400" />
              </div>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ attendanceStats.total }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
              <p class="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">100%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div
      v-if="!isLoading"
      class="bg-white dark:bg-zinc-900 rounded-2xl shadow-md dark:border dark:border-zinc-800 p-6"
    >
      <h3 class="font-bold text-lg dark:text-white mb-6">Aktivitas Terbaru</h3>

      <div class="space-y-3">
        <div
          v-for="(activity, index) in recentActivity"
          :key="index"
          class="flex items-center justify-between p-4 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
        >
          <div class="flex items-center gap-4">
            <div class="text-sm font-medium text-gray-600 dark:text-zinc-400 min-w-24">
              {{ new Date(activity.date).toLocaleDateString('id-ID') }}
            </div>
            <span
              :class="['px-3 py-1 rounded-full text-xs font-bold', getStatusColor(activity.status)]"
            >
              {{ getStatusLabel(activity.status) }}
            </span>
          </div>
          <span class="text-sm font-medium text-gray-600 dark:text-zinc-400">{{
            activity.time
          }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-12">
      <Loader2 class="animate-spin text-orange-600" size="32" />
    </div>

    <!-- Edit Profile Modal -->
    <Transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          @click="showEditModal = false"
        ></div>

        <div
          class="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border dark:border-zinc-800 animate-in fade-in zoom-in duration-200"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10"
          >
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">Edit Profil</h3>
            <button
              @click="showEditModal = false"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
            >
              <component :is="X || 'span'" class="w-5 h-5">✕</component>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <form id="editProfileForm" @submit.prevent="saveProfile" class="space-y-6">
              <div class="flex flex-col items-center">
                <div class="relative group cursor-pointer">
                  <img
                    :src="previewImage || profileImage"
                    class="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-zinc-800 group-hover:border-orange-200 transition"
                  />
                  <label
                    class="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <component :is="Camera || 'span'" class="w-8 h-8" />
                    <input type="file" accept="image/*" @change="handleFileChange" class="hidden" />
                  </label>
                  <div
                    class="absolute bottom-0 right-0 p-1.5 bg-orange-600 rounded-full text-white border-2 border-white dark:border-zinc-900"
                  >
                    <component :is="Edit2 || 'span'" class="w-3 h-3" />
                  </div>
                </div>
                <p class="text-xs text-gray-400 mt-2">Klik foto untuk mengubah</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >Nama Lengkap</label
                  >
                  <input v-model="editForm.name" type="text" class="input-field" required />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >Email</label
                  >
                  <input v-model="editForm.email" type="email" class="input-field" required />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >No. Telepon</label
                  >
                  <input v-model="editForm.phone_number" type="tel" class="input-field" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >Alamat</label
                  >
                  <input v-model="editForm.address" type="text" class="input-field" />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
                <textarea
                  v-model="editForm.bio"
                  rows="3"
                  class="input-field resize-none leading-relaxed"
                ></textarea>
              </div>

              <div class="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Password Baru
                    <span class="text-gray-400 font-normal lowercase">(opsional)</span>
                  </label>
                  <input
                    v-model="editForm.password"
                    type="password"
                    class="input-field"
                    placeholder="Biarkan kosong jika tidak ingin mengganti"
                  />
                </div>
              </div>
            </form>
          </div>

          <div
            class="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-end gap-3 z-10"
          >
            <button
              type="button"
              @click="showEditModal = false"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              form="editProfileForm"
              :disabled="isSaving"
              class="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isSaving" class="animate-spin w-4 h-4" />
              <span>{{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile-page {
  padding: var(--spacing-lg);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
