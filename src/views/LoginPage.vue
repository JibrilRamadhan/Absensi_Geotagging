<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/axios'
import { jwtDecode } from 'jwt-decode'
import { Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft, Loader2, Hexagon } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const isVisible = ref(false)

const form = reactive({
  email: '',
  password: '',
})

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
  if (route.query.auth_error) {
    errorMessage.value = route.query.auth_error
    router.replace({ query: null })
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data } = await api.post('/api/auth/login', {
      email: form.email,
      password: form.password,
    })

    localStorage.setItem('token', data.token)

    const user = jwtDecode(data.token)

    setTimeout(() => {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    }, 300)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Email atau password salah.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center bg-[#050505] font-['Plus_Jakarta_Sans'] overflow-hidden relative selection:bg-orange-500/30 selection:text-orange-200"
  >
    <div
      class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse-slow"
    ></div>
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"
    ></div>

    <div
      class="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl shadow-black/50 overflow-hidden z-10 m-4 transition-all duration-700 ease-out transform"
      :class="isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'"
    >
      <div
        class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-black p-12 relative overflow-hidden group"
      >
        <div
          class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"
        ></div>

        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[60px] group-hover:bg-orange-500/20 transition-all duration-700"
        ></div>

        <RouterLink to="/" class="z-20 self-start">
          <div
            class="size-10 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
          >
            <ChevronLeft size="20" class="text-white/70" />
          </div>
        </RouterLink>

        <div class="z-10 relative">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Hexagon class="text-orange-500 fill-orange-500/20" size="32" />
            </div>
            <span class="text-xl font-bold text-white tracking-wide">LibTrack</span>
          </div>

          <h1 class="text-4xl font-bold text-white leading-tight mb-4">
            Smart Attendance <br />
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600"
              >for Modern Teams.</span
            >
          </h1>
          <p class="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Streamline your workflow with our AI-powered tracking system. Secure, fast, and
            reliable.
          </p>
        </div>
      </div>

      <div class="p-8 md:p-12 flex flex-col justify-center bg-zinc-900/40 relative">
        <div class="max-w-[380px] w-full mx-auto space-y-8">
          <div class="text-center space-y-2 stagger-1" :class="{ 'fade-up': isVisible }">
            <h2 class="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p class="text-zinc-500 text-sm">Please enter your details to sign in.</p>
          </div>

          <Transition name="slide-down">
            <div
              v-if="errorMessage"
              class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2 justify-center"
            >
              <span class="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
              {{ errorMessage }}
            </div>
          </Transition>

          <div class="space-y-5">
            <div class="space-y-1.5 stagger-2" :class="{ 'fade-up': isVisible }">
              <label class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1"
                >Email</label
              >
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    class="text-zinc-600 group-focus-within:text-orange-500 transition-colors duration-300"
                    size="18"
                  />
                </div>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  class="w-full bg-zinc-950/50 border border-white/5 text-white text-sm rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all placeholder:text-zinc-700 hover:border-white/10"
                />
              </div>
            </div>

            <div class="space-y-1.5 stagger-3" :class="{ 'fade-up': isVisible }">
              <div class="flex justify-between items-center ml-1">
                <label class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider"
                  >Password</label
                >
                <a
                  href="#"
                  class="text-[11px] text-orange-500 hover:text-orange-400 transition-colors font-semibold"
                  >Forgot Password?</a
                >
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    class="text-zinc-600 group-focus-within:text-orange-500 transition-colors duration-300"
                    size="18"
                  />
                </div>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="••••••••"
                  class="w-full bg-zinc-950/50 border border-white/5 text-white text-sm rounded-xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all placeholder:text-zinc-700 hover:border-white/10"
                  @keydown.enter="handleLogin"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <component :is="showPassword ? EyeOff : Eye" size="18" />
                </button>
              </div>
            </div>

            <div class="pt-2 stagger-4" :class="{ 'fade-up': isVisible }">
              <button
                @click="handleLogin"
                :disabled="isLoading"
                class="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                <div class="flex items-center justify-center gap-2 relative z-10">
                  <Loader2 v-if="isLoading" class="animate-spin" size="18" />
                  <span v-else>Sign In to Account</span>
                  <ArrowRight
                    v-if="!isLoading"
                    class="group-hover:translate-x-1 transition-transform"
                    size="18"
                  />
                </div>
                <div
                  class="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"
                />
              </button>
            </div>
          </div>

          <p class="text-center text-xs text-zinc-600 stagger-5" :class="{ 'fade-up': isVisible }">
            © 2024 LibTrack Systems. Secure Access.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keyframes untuk animasi halus */
.animate-pulse-slow {
  animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes shine {
  100% {
    left: 125%;
  }
}

.group:hover .group-hover\:animate-shine {
  animation: shine 0.75s;
}

/* Staggered Fade Up Animation */
.stagger-1,
.stagger-2,
.stagger-3,
.stagger-4,
.stagger-5 {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up.stagger-1 {
  transition-delay: 100ms;
  opacity: 1;
  transform: translateY(0);
}
.fade-up.stagger-2 {
  transition-delay: 200ms;
  opacity: 1;
  transform: translateY(0);
}
.fade-up.stagger-3 {
  transition-delay: 300ms;
  opacity: 1;
  transform: translateY(0);
}
.fade-up.stagger-4 {
  transition-delay: 400ms;
  opacity: 1;
  transform: translateY(0);
}
.fade-up.stagger-5 {
  transition-delay: 500ms;
  opacity: 1;
  transform: translateY(0);
}

/* Slide Down Transition for Error */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
