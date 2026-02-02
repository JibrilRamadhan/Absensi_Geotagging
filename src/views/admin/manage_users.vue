<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import Toast from '../../components/Allert/allert.vue'
import ConfirmModal from '../../components/Modal/ConfirmModal.vue'
import * as XLSX from 'xlsx'
import {
  UserPlus,
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  UserX,
  X,
  Edit,
  Trash2,
  RotateCcw,
  Search,
  Power,
  Ban,
  MapPin,
  Calendar,
  Phone,
  FileText,
  Activity,
} from 'lucide-vue-next'

const adminStore = useAdminStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const toastRef = ref(null)

const showModal = ref(false)
const showAuditModal = ref(false)
const auditLogs = ref([])
const selectedUserAudit = ref(null)

const isLoading = ref(false)
const searchQuery = ref('')
const filterCompany = ref('all')
const isEdit = ref(false)
const selectedId = ref(null)

const currentPage = ref(1)
const pageSize = ref(5)
const totalUsers = ref(0)
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value) || 1)

const confirmState = ref({
  show: false,
  title: '',
  message: '',
  action: null,
})

const confirmLoading = ref(false)

const openConfirm = ({ title, message, variant = 'default', action }) => {
  confirmState.value = {
    show: true,
    title,
    message,
    variant,
    action,
  }
}

const handleConfirm = async () => {
  if (!confirmState.value.action) return

  confirmLoading.value = true
  try {
    await confirmState.value.action()
    confirmState.value.show = false
  } catch (err) {
    toastRef.value?.addToast(err.message || 'Terjadi kesalahan', 'error')
  } finally {
    confirmLoading.value = false
  }
}

const dashboardStats = computed(() => {
  const allUsers = Array.isArray(adminStore.users)
    ? adminStore.users
    : adminStore.users?.users || []
  const allCompanies = Array.isArray(adminStore.companies)
    ? adminStore.companies
    : adminStore.companies?.companies || []

  const interns = allUsers.filter((u) => u.role === 'intern')

  const presentCount = interns.filter((u) => u.check_in).length
  const absentCount = interns.filter((u) => !u.check_in).length
  const activeOfficesCount = allCompanies.filter((c) => c.has_office && c.office_is_active).length

  return {
    total_users: allUsers.length,
    present_today: presentCount,
    absent_today: absentCount,
    active_offices: activeOfficesCount,
  }
})

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'intern',
  company_id: null,
  phone_number: '',
  address: '',
  bio: '',
}
const form = ref({ ...initialForm })

const companies = computed(() => adminStore.companies)

const filteredUsers = computed(() => {
  // pastikan array
  let users = Array.isArray(adminStore.users?.users) ? adminStore.users.users : []

  // filter berdasarkan company
  if (filterCompany.value !== 'all') {
    const company = adminStore.companies.find((c) => String(c.id) === String(filterCompany.value))
    if (company) {
      users = users.filter((u) => u.company_name === company.name)
    }
  }

  // filter berdasarkan search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    users = users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    )
  }

  // hanya tampilkan intern
  users = users.filter((u) => u.role === 'intern')

  return users
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const getAvatarUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

const formatDate = (d) =>
  d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'

const formatJoinDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'

const openCreate = () => {
  isEdit.value = false
  selectedId.value = null
  form.value = { ...initialForm }
  showModal.value = true
}

const openEdit = (user) => {
  isEdit.value = true
  selectedId.value = user.id
  form.value = { ...user, password: '' }
  showModal.value = true
}

const openAudit = async (user) => {
  selectedUserAudit.value = user
  showAuditModal.value = true
  auditLogs.value = []
  try {
    if (adminStore.fetchUserAuditLogs) {
      const logs = await adminStore.fetchUserAuditLogs(user.id)
      auditLogs.value = logs
    } else {
    }
  } catch (error) {
    toastRef.value.addToast('Gagal memuat audit log', 'error')
  }
}

const formatTimeOrStatus = (checkIn, checkOut, type) => {
  if (!checkIn && !checkOut) return 'Tidak Hadir'

  if (type === 'in') {
    if (!checkIn) return 'Belum Check-in'
    return new Date(checkIn).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (type === 'out') {
    if (!checkOut) return 'Belum Check-out'
    return new Date(checkOut).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
}

const handleExportToday = async () => {
  const today = new Date().toISOString().slice(0, 10)

  try {
    const rows = await adminStore.exportAttendanceDaily(today)
    exportToExcel(rows, `attendance_${today}.xlsx`)
    toastRef.value.addToast('Export harian berhasil', 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal export harian', 'error')
  }
}

const exportToExcel = (rows, filename) => {
  if (!rows || !rows.length) {
    toastRef.value.addToast('Tidak ada data untuk diexport', 'error')
    return
  }

  const formatted = rows.map((r, i) => ({
    No: i + 1,
    Nama: r.name,
    Email: r.email,
    Company: r.company_name,
    Tanggal: r.date,
    CheckIn: formatTimeOrStatus(r.check_in_at, r.check_out_at, 'in'),
    CheckOut: formatTimeOrStatus(r.check_in_at, r.check_out_at, 'out'),
  }))

  const ws = XLSX.utils.json_to_sheet(formatted)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  XLSX.writeFile(wb, filename)
}

const selectedMonth = ref(
  new Date().toISOString().slice(0, 7), // YYYY-MM
)

const handleExportMonthly = async () => {
  try {
    const rows = await adminStore.exportAttendanceMonthly(selectedMonth.value)
    exportToExcel(rows, `attendance_${selectedMonth.value}.xlsx`)
    toastRef.value.addToast('Export bulanan berhasil', 'success')
  } catch (e) {
    toastRef.value.addToast('Gagal export bulanan', 'error')
  }
}

const goPrev = () => {
  if (currentPage.value > 1) currentPage.value--
}

const goNext = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const toggleStatus = (user) => {
  const newStatus = !user.status

  openConfirm({
    title: newStatus ? 'Aktifkan User' : 'Nonaktifkan User',
    variant: newStatus ? 'default' : 'warning',
    message: newStatus
      ? `User <b>${user.name}</b> akan diaktifkan kembali dan dapat login.`
      : `
        <b class="text-yellow-600">PERINGATAN</b><br/>
        Akses login <b>${user.name}</b> akan dinonaktifkan.<br/>
        User tidak dapat masuk ke sistem.
      `,
    action: async () => {
      await adminStore.toggleUserStatus(user.id, newStatus)
      toastRef.value.addToast(
        `User berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
        'success',
      )
    },
  })
}

const openDeleteModal = (user) => {
  openConfirm({
    title: 'Hapus User Permanen',
    message: `
      <b>PERINGATAN!</b><br/>
      User <b>${user.name}</b> akan dihapus permanen.<br/>
      <span class="text-red-500 font-semibold">
        Data tidak dapat dikembalikan.
      </span>
    `,
    action: async () => {
      await adminStore.deleteUser(user.id)
      toastRef.value.addToast('User berhasil dihapus permanen', 'success')
    },
  })
}

const openResetModal = (user) => {
  openConfirm({
    title: 'Reset Password',
    message: `Password ${user.name} akan direset ke <b>123456</b>. User wajib mengganti setelah login.`,
    action: async () => {
      await adminStore.resetPassword(user.id)
      toastRef.value.addToast('Password berhasil direset', 'success')
    },
  })
}

const handleSubmit = async () => {
  isLoading.value = true

  if (form.value.role === 'intern' && !form.value.company_id) {
    toastRef.value.addToast('Intern wajib memiliki company', 'error')
    isLoading.value = false
    return
  }

  const payload = {}
  Object.entries(form.value).forEach(([k, v]) => {
    if (v !== '' && v !== null) payload[k] = v
  })

  try {
    if (isEdit.value) {
      if (!payload.password) delete payload.password
      await adminStore.updateUser(selectedId.value, payload)
      toastRef.value.addToast('Data berhasil diperbarui', 'success')
    } else {
      await adminStore.createUser(payload)
      toastRef.value.addToast('User baru dibuat', 'success')
    }
    showModal.value = false
  } catch (error) {
    toastRef.value.addToast(error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

watch([filteredUsers], () => {
  totalUsers.value = filteredUsers.value.length
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

onMounted(() => {
  adminStore.fetchUsers()
  adminStore.fetchCompanies()
})
</script>

<template>
  <div class="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans">
    <Toast ref="toastRef" />

    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold dark:text-white">Manage Users</h1>
        <p class="text-gray-500">Kelola akses, registrasi, dan status personil.</p>
      </div>
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <button
              @click="handleExportToday"
              class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all hover:-translate-y-0.5"
            >
              Export Hari Ini
            </button>
          </div>

          <div class="flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-700">
            <input
              v-model="selectedMonth"
              type="month"
              class="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              title="Exports by month"
            />

            <button
              @click="handleExportMonthly"
              class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all hover:-translate-y-0.5"
            >
              Export Bulan
            </button>
          </div>
        </div>

        <div class="flex items-center">
          <button
            @click="openCreate"
            class="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md hover:shadow-orange-500/20 transition-all hover:-translate-y-0.5"
          >
            <UserPlus size="20" />
            <span>Add User</span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Users size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total Account</p>
          <p class="text-2xl font-bold dark:text-white">{{ dashboardStats.total_users }}</p>
        </div>
      </div>
      <div
        class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-green-50 text-green-600 rounded-xl">
          <UserCheck size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Hadir Hari Ini</p>
          <p class="text-2xl font-bold dark:text-white">{{ dashboardStats.present_today }}</p>
        </div>
      </div>
      <div
        class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-red-50 text-red-600 rounded-xl">
          <UserX size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Belum Absen</p>
          <p class="text-2xl font-bold dark:text-white">{{ dashboardStats.absent_today }}</p>
        </div>
      </div>
      <div
        class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center gap-4"
      >
        <div class="p-3 bg-orange-50 text-orange-600 rounded-xl">
          <Building2 size="24" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Kantor Aktif</p>
          <p class="text-2xl font-bold dark:text-white">{{ dashboardStats.active_offices }}</p>
        </div>
      </div>
    </div>

    <div
      class="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm flex gap-4"
    >
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size="20" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau email..."
          class="w-full pl-12 py-3 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white"
        />
      </div>
      <select
        v-model="filterCompany"
        class="px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white cursor-pointer"
      >
        <option value="all">Semua Company</option>
        <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div
      class="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden"
    >
      <table class="w-full text-left">
        <thead
          class="bg-gray-50 dark:bg-zinc-800/50 text-gray-400 text-xs uppercase font-semibold border-b dark:border-zinc-800"
        >
          <tr>
            <th class="px-6 py-5">Profile & Contact</th>
            <th class="px-6 py-5">Office / Location</th>
            <th class="px-6 py-5">Role</th>
            <th class="px-6 py-5">Attendance Today</th>
            <th class="px-6 py-5">Status</th>
            <th class="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
          <tr
            v-for="u in paginatedUsers"
            :key="u.id"
            class="hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 transition"
          >
            <td class="px-6 py-4">
              <div class="flex items-start gap-4">
                <div class="shrink-0">
                  <img
                    v-if="u.profile_picture"
                    :src="getAvatarUrl(u.profile_picture)"
                    alt="Avatar"
                    class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-zinc-700 shadow-sm"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                  <div
                    v-if="!u.profile_picture"
                    class="w-12 h-12 rounded-full bg-linear-to-br from-orange-400 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm"
                  >
                    {{ getInitials(u.name) }}
                  </div>
                </div>

                <div>
                  <p class="font-bold text-gray-800 dark:text-gray-100">{{ u.name }}</p>
                  <div class="text-xs text-gray-500 space-y-0.5 mt-1">
                    <p>{{ u.email }}</p>
                    <p v-if="u.phone_number" class="flex items-center gap-1 text-gray-400">
                      <Phone size="10" /> {{ u.phone_number }}
                    </p>
                    <p class="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                      <Calendar size="10" /> Joined: {{ formatJoinDate(u.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </td>

            <td class="px-6 py-4">
              <div v-if="u.role === 'intern' || u.company_name" class="flex flex-col gap-1">
                <div class="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                  <Building2 size="16" class="text-orange-500" />
                  {{ u.company_name || 'No Company' }}
                </div>
                <div v-if="u.address" class="flex items-start gap-2 text-xs text-gray-400 max-w-50">
                  <MapPin size="12" class="mt-0.5 shrink-0" />
                  <span class="truncate">{{ u.address }}</span>
                </div>
              </div>
              <div v-else class="text-xs text-gray-400 italic">Global Admin</div>
            </td>

            <td class="px-6 py-4">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold capitalize inline-flex items-center gap-1"
                :class="
                  u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                "
              >
                <ShieldCheck v-if="u.role === 'admin'" size="12" /> {{ u.role }}
              </span>
            </td>

            <td class="px-6 py-4">
              <div v-if="u.role === 'intern'">
                <div v-if="u.check_in" class="flex flex-col gap-1">
                  <span
                    class="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full w-fit flex items-center gap-1"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Hadir
                  </span>
                  <span class="text-[11px] text-gray-500 font-mono mt-0.5">
                    {{ formatDate(u.check_in) }} -
                    {{ u.check_out ? formatDate(u.check_out) : '...' }}
                  </span>
                </div>

                <div v-else>
                  <span
                    class="text-[10px] font-medium text-gray-400 italic bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700"
                  >
                    Belum Absen
                  </span>
                </div>
              </div>

              <div v-else class="flex items-center gap-2 opacity-40">
                <span class="text-lg font-bold text-gray-300 dark:text-zinc-600">-</span>
                <span class="text-[10px] text-gray-400 uppercase tracking-widest">N/A</span>
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full animate-pulse',
                    u.status ? 'bg-emerald-500' : 'bg-red-500',
                  ]"
                ></div>
                <span
                  class="text-sm font-medium"
                  :class="u.status ? 'text-emerald-600' : 'text-red-600'"
                >
                  {{ u.status ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2">
                <button
                  @click="openAudit(u)"
                  class="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                  title="Audit Log"
                >
                  <Activity size="18" />
                </button>

                <button
                  @click="openEdit(u)"
                  class="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                  title="Edit Data"
                >
                  <Edit size="18" />
                </button>

                <button
                  @click="openResetModal(u)"
                  class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  title="Reset Password"
                >
                  <RotateCcw size="18" />
                </button>

                <div class="w-px h-8 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

                <button
                  @click="toggleStatus(u)"
                  class="p-2 rounded-lg transition group"
                  :class="
                    u.status
                      ? 'text-emerald-500 hover:bg-red-50 hover:text-red-500'
                      : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'
                  "
                  :title="u.status ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'"
                >
                  <div class="relative">
                    <Power v-if="u.status" size="18" class="group-hover:hidden" />
                    <Ban v-if="u.status" size="18" class="hidden group-hover:block" />

                    <Power v-else size="18" />
                  </div>
                </button>

                <button
                  @click="openDeleteModal(u)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition"
                  title="Hapus Permanen"
                >
                  <Trash2 size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-between items-center px-6 py-4 border-t dark:border-zinc-800">
        <div class="text-sm text-gray-500 dark:text-gray-400">Total Users: {{ totalUsers }}</div>
        <div class="flex items-center gap-2">
          <button
            @click="goPrev"
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span class="text-sm"> Page {{ currentPage }} of {{ totalPages }} </span>
          <button
            @click="goNext"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false"></div>
      <div
        class="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div
          class="p-6 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center sticky top-0 z-10"
        >
          <h2 class="text-xl font-bold dark:text-white">{{ isEdit ? 'Edit User' : 'Add User' }}</h2>
          <button @click="showModal = false"><X class="text-gray-500" /></button>
        </div>
        <div class="p-8 overflow-y-auto custom-scrollbar">
          <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1 md:col-span-2">
              <label class="text-xs font-bold text-gray-400 uppercase">Name</label>
              <input
                v-model="form.name"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase">Email</label>
              <input
                v-model="form.email"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase">Role</label>
              <select
                v-model="form.role"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="intern">Intern</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="space-y-1 md:col-span-2">
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Building2 size="14" />
                  Company
                </label>

                <select
                  v-model="form.company_id"
                  class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
                  :disabled="form.role === 'admin'"
                  required
                >
                  <option disabled value="">Pilih Company</option>
                  <option v-for="c in companies" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>

                <p v-if="form.role === 'admin'" class="text-[11px] text-gray-400 italic">
                  Admin tidak terikat ke company
                </p>
              </div>

              <label class="text-xs font-bold text-gray-400 uppercase mt-4 block">Password</label>
              <input
                v-model="form.password"
                type="password"
                :required="!isEdit"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
                placeholder="Isi untuk ubah password"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase">Phone</label>
              <input
                v-model="form.phone_number"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase">Address</label>
              <input
                v-model="form.address"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <label class="text-xs font-bold text-gray-400 uppercase">Bio</label>
              <textarea
                v-model="form.bio"
                rows="3"
                class="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-white border-none focus:ring-2 focus:ring-orange-500"
                placeholder="Deskripsi singkat user..."
              ></textarea>
            </div>
            <div class="md:col-span-2 pt-4 flex justify-end gap-3 border-t dark:border-zinc-800">
              <button type="button" @click="showModal = false" class="px-6 py-3 text-gray-500">
                Cancel
              </button>
              <button
                type="submit"
                class="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Audit Log -->
    <div v-if="showAuditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="showAuditModal = false"
      ></div>
      <div
        class="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div class="p-5 border-b dark:border-zinc-800 flex justify-between items-center">
          <h3 class="font-bold text-lg dark:text-white flex items-center gap-2">
            <Activity class="text-purple-500" /> Audit Log: {{ selectedUserAudit?.name }}
          </h3>
          <button @click="showAuditModal = false"><X class="text-gray-500" /></button>
        </div>
        <div class="p-0 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-zinc-950">
          <div v-if="auditLogs.length === 0" class="p-8 text-center text-gray-400 italic">
            Belum ada aktivitas tercatat.
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-zinc-800">
            <div
              v-for="(log, idx) in auditLogs"
              :key="idx"
              class="p-4 bg-white dark:bg-zinc-900 flex gap-3"
            >
              <div class="text-xs font-mono text-gray-400 w-24 shrink-0 pt-1">
                {{ new Date(log.created_at).toLocaleString() }}
              </div>
              <div>
                <p class="text-sm font-medium dark:text-gray-200">{{ log.action }}</p>
                <p class="text-xs text-gray-500">{{ log.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ConfirmModal
    :show="confirmState.show"
    :title="confirmState.title"
    :message="confirmState.message"
    :variant="confirmState.variant"
    :loading="confirmLoading"
    confirm-text="Ya, Lanjutkan"
    @confirm="handleConfirm"
    @cancel="confirmState.show = false"
  />
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(209, 213, 219, 0.5);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(209, 213, 219, 0.7);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(209, 213, 219, 0.5) transparent;
}
.custom-scrollbar:hover {
  scrollbar-color: rgba(209, 213, 219, 0.7) transparent;
}
</style>
