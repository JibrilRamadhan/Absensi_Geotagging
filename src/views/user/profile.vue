<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import Toast from '../../components/Allert/allert.vue'
import { User, Phone, MapPin, Camera, Save, Loader2, Mail } from 'lucide-vue-next'

const authStore = useAuthStore()
const toastRef = ref(null)
const isLoading = ref(false)
const fileInput = ref(null)
const previewImage = ref(null)

const form = ref({
  name: '',
  phone_number: '',
  address: '',
  bio: '',
  email: '',
  profile_picture: null,
})

// Sinkronisasi data user ke form saat data tersedia
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      form.value.name = newUser.name || ''
      form.value.phone_number = newUser.phone_number || ''
      form.value.address = newUser.address || ''
      form.value.bio = newUser.bio || ''
      form.value.email = newUser.email || ''
    }
  },
  { immediate: true },
)

// Logika tampilan avatar: Prioritas Preview > Store Getter > Placeholder
const displayAvatar = computed(() => {
  if (previewImage.value) return previewImage.value
  return authStore.profileImage
})

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toastRef.value.addToast('Ukuran file maksimal 2MB', 'error')
      return
    }
    form.value.profile_picture = file
    previewImage.value = URL.createObjectURL(file)
  }
}

const saveProfile = async () => {
  isLoading.value = true
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('phone_number', form.value.phone_number)
    formData.append('address', form.value.address)
    formData.append('bio', form.value.bio)

    if (form.value.profile_picture) {
      formData.append('profile_picture', form.value.profile_picture)
    }

    await authStore.updateProfile(formData)
    toastRef.value.addToast('Profil berhasil diperbarui', 'success')
  } catch (error) {
    const msg = error.message || 'Gagal menyimpan perubahan'
    toastRef.value.addToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!authStore.user) authStore.fetchUser()
})
</script>

<template>
  <div
    class="p-6 min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans transition-colors duration-300 flex justify-center items-start pt-10"
  >
    <Toast ref="toastRef" />

    <div
      class="w-full max-w-3xl bg-white dark:bg-[#121212] rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 overflow-hidden"
    >
      <div class="h-40 bg-gradient-to-r from-indigo-600 to-blue-500 relative">
        <div class="absolute inset-0 bg-black/10"></div>
      </div>

      <div class="px-8 pb-10">
        <div class="relative -mt-16 mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div class="relative group">
            <div
              class="w-36 h-36 rounded-full border-[6px] border-white dark:border-[#121212] overflow-hidden bg-gray-100 shadow-lg"
            >
              <img :src="displayAvatar" class="w-full h-full object-cover" alt="Profile Avatar" />
            </div>

            <button
              @click="fileInput.click()"
              class="absolute bottom-1 right-1 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 active:scale-95"
              title="Ganti Foto"
            >
              <Camera size="18" />
            </button>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />
          </div>

          <div class="flex-1 text-center md:text-left mb-2">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ form.name || 'User' }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ form.email }}</p>
          </div>

          <button
            @click="saveProfile"
            :disabled="isLoading"
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" class="animate-spin" size="20" />
            <Save v-else size="20" />
            <span>Simpan</span>
          </button>
        </div>

        <div class="grid gap-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Nama Lengkap</label
              >
              <div class="relative">
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full pl-4 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none font-medium"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Email (Read Only)</label
              >
              <div class="relative">
                <div class="absolute left-4 top-3.5 text-gray-400">
                  <Mail size="18" />
                </div>
                <input
                  v-model="form.email"
                  type="email"
                  disabled
                  class="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Nomor HP</label
              >
              <div class="relative">
                <div class="absolute left-4 top-3.5 text-gray-400">
                  <Phone size="18" />
                </div>
                <input
                  v-model="form.phone_number"
                  type="tel"
                  class="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
                >Alamat Domisili</label
              >
              <div class="relative">
                <div class="absolute left-4 top-3.5 text-gray-400">
                  <MapPin size="18" />
                </div>
                <input
                  v-model="form.address"
                  type="text"
                  class="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
              >Bio / Tentang Saya</label
            >
            <textarea
              v-model="form.bio"
              rows="4"
              class="w-full p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none resize-none"
              placeholder="Ceritakan peranmu di perusahaan..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
