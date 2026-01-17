<script setup>
import { ref, onMounted, reactive } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { UserCircle, Loader2 } from 'lucide-vue-next'
import api from '../../api/axios'

const showProfileModal = ref(false)
const loading = ref(false)
const form = reactive({
  phone_number: '',
  bio: '',
  address: '',
})

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    const user = jwtDecode(token)
    if (user.is_first_login) {
      showProfileModal.value = true
    }
  }
})

const handleUpdateProfile = async () => {
  loading.value = true
  try {
    await api.put('/api/auth/update-profile', form)
    showProfileModal.value = false
  } catch (error) {
    console.error('Gagal update profil', error)
  } finally {
    loading.value = false
  }
}

const handleSkip = async () => {
  try {
    await api.put('/api/auth/update-profile', { skip: true })
    showProfileModal.value = false
  } catch (error) {
    console.error('Gagal skip', error)
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <Transition name="fade" appear>
      <div>
        <h1 class="text-2xl font-bold dark:text-white">User Dashboard</h1>
        <div class="text-gray-500 dark:text-zinc-400 mt-1">Welcome back!</div>
      </div>
    </Transition>

    <Transition name="scale">
      <div
        v-if="showProfileModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showProfileModal = false"
        ></div>

        <div
          class="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border dark:border-zinc-800"
        >
          <div class="p-8 text-center">
            <div
              class="size-16 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <UserCircle class="text-orange-600 size-10" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">Lengkapi Profilmu</h3>
            <p class="text-sm text-gray-500 mt-2">
              Hanya butuh semenit agar data kamu valid di sistem kami.
            </p>

            <form @submit.prevent="handleUpdateProfile" class="mt-6 space-y-4 text-left">
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase">Nomor Telepon</label>
                <input
                  v-model="form.phone_number"
                  type="text"
                  class="w-full mt-1 px-4 py-3 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="08..."
                />
              </div>
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase">Bio Singkat</label>
                <textarea
                  v-model="form.bio"
                  class="w-full mt-1 px-4 py-3 rounded-xl border dark:bg-zinc-800 dark:border-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="I am a software intern..."
                ></textarea>
              </div>

              <div class="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center justify-center gap-2"
                >
                  <Loader2 v-if="loading" class="animate-spin size-4" />
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  @click="handleSkip"
                  class="w-full py-3 text-gray-400 font-medium hover:text-gray-600 dark:hover:text-zinc-200 transition"
                >
                  Lewati untuk sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
