<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore, API_BASE_URL } from '../../stores/adminStore'
import Toast from '../../components/Allert/allert.vue'
import {
  UserPlus,
  ShieldCheck,
  Building2,
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
} from 'lucide-vue-next'

const adminStore = useAdminStore()
const toastRef = ref(null)

const showModal = ref(false)
const isLoading = ref(false)
const searchQuery = ref('')
const filterRole = ref('all')
const isEdit = ref(false)
const selectedId = ref(null)

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
  let users = adminStore.users
  if (filterRole.value !== 'all') users = users.filter((u) => u.role === filterRole.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    users = users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    )
  }
  return users
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

const toggleStatus = async (user) => {
  const newStatus = !user.status
  if (!newStatus && !confirm(`Nonaktifkan akses login untuk ${user.name}?`)) return

  try {
    if (newStatus) await adminStore.enableUser(user.id)
    else await adminStore.disableUser(user.id)

    toastRef.value.addToast(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success')
  } catch (error) {
    toastRef.value.addToast('Gagal mengubah status', 'error')
  }
}

const handleDelete = async (user) => {
  if (
    !confirm(
      `PERINGATAN: Menghapus user ${user.name} secara permanen?\nData yang dihapus tidak bisa dikembalikan.`,
    )
  )
    return

  try {
    await adminStore.deleteUser(user.id)
    toastRef.value.addToast('User berhasil dihapus permanen', 'success')
  } catch (error) {
    toastRef.value.addToast(error.message, 'error')
  }
}

const handleReset = async (id) => {
  if (!confirm('Reset password ke 123456?')) return
  try {
    await adminStore.resetPassword(id)
    toastRef.value.addToast('Password direset', 'success')
  } catch (error) {
    toastRef.value.addToast('Gagal reset', 'error')
  }
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
      <button
        @click="openCreate"
        class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition hover:-translate-y-1"
      >
        <UserPlus size="20" /> <span>Add User</span>
      </button>
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
        v-model="filterRole"
        class="px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white cursor-pointer"
      >
        <option value="all">Semua Role</option>
        <option value="intern">Intern</option>
        <option value="admin">Admin</option>
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
            v-for="u in filteredUsers"
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
                <div v-if="u.check_in || u.check_in_at" class="flex flex-col gap-1">
                  <span
                    class="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full w-fit flex items-center gap-1"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Hadir
                  </span>
                  <span class="text-[11px] text-gray-500 font-mono mt-0.5">
                    {{ formatDate(u.check_in || u.check_in_at) }} -
                    {{
                      u.check_out || u.check_out_at
                        ? formatDate(u.check_out || u.check_out_at)
                        : '...'
                    }}
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
                  @click="openEdit(u)"
                  class="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                  title="Edit Data"
                >
                  <Edit size="18" />
                </button>

                <button
                  @click="handleReset(u.id)"
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
                  @click="handleDelete(u)"
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
  </div>
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
