<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-vue-next'

const toasts = ref([])
const TOAST_DURATION = 4000 // 4 seconds

const addToast = (message, type = 'success') => {
  const id = Date.now()
  const toast = {
    id,
    message,
    type,
    progress: 100,
  }

  toasts.value.push(toast)

  // Animate progress bar
  const interval = setInterval(() => {
    const currentToast = toasts.value.find((t) => t.id === id)
    if (currentToast) {
      currentToast.progress -= (100 / TOAST_DURATION) * 50 // Update every 50ms
      if (currentToast.progress <= 0) {
        clearInterval(interval)
      }
    } else {
      clearInterval(interval)
    }
  }, 50)

  // Auto remove after duration
  setTimeout(() => {
    removeToast(id)
    clearInterval(interval)
  }, TOAST_DURATION)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

const getToastConfig = (type) => {
  const configs = {
    success: {
      icon: CheckCircle2,
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-500/10',
      borderLight: 'border-emerald-200',
      borderDark: 'dark:border-emerald-500/30',
      textLight: 'text-emerald-700',
      textDark: 'dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressBg: 'bg-emerald-500 dark:bg-emerald-400',
    },
    error: {
      icon: AlertCircle,
      bgLight: 'bg-red-50',
      bgDark: 'dark:bg-red-500/10',
      borderLight: 'border-red-200',
      borderDark: 'dark:border-red-500/30',
      textLight: 'text-red-700',
      textDark: 'dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
      progressBg: 'bg-red-500 dark:bg-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bgLight: 'bg-amber-50',
      bgDark: 'dark:bg-amber-500/10',
      borderLight: 'border-amber-200',
      borderDark: 'dark:border-amber-500/30',
      textLight: 'text-amber-700',
      textDark: 'dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressBg: 'bg-amber-500 dark:bg-amber-400',
    },
    info: {
      icon: Info,
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-500/10',
      borderLight: 'border-blue-200',
      borderDark: 'dark:border-blue-500/30',
      textLight: 'text-blue-700',
      textDark: 'dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      progressBg: 'bg-blue-500 dark:bg-blue-400',
    },
  }
  return configs[type] || configs.success
}

defineExpose({ addToast })
</script>

<template>
  <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto group relative overflow-hidden rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        :class="[
          getToastConfig(toast.type).bgLight,
          getToastConfig(toast.type).bgDark,
          getToastConfig(toast.type).borderLight,
          getToastConfig(toast.type).borderDark,
        ]"
      >
        <!-- Main Content -->
        <div class="flex items-start gap-3 p-4 pr-3 min-w-[320px] max-w-md">
          <!-- Icon Container -->
          <div
            class="size-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            :class="getToastConfig(toast.type).iconBg"
          >
            <component
              :is="getToastConfig(toast.type).icon"
              :class="getToastConfig(toast.type).iconColor"
              class="transition-transform duration-300 group-hover:scale-110"
              size="20"
            />
          </div>

          <!-- Message -->
          <div class="flex-1 min-w-0 pt-1">
            <p
              class="text-sm font-bold leading-relaxed"
              :class="[getToastConfig(toast.type).textLight, getToastConfig(toast.type).textDark]"
            >
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            @click="removeToast(toast.id)"
            class="size-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 flex-shrink-0"
            :class="[getToastConfig(toast.type).iconBg, getToastConfig(toast.type).iconColor]"
          >
            <X size="16" />
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <div
            class="h-full transition-all duration-[50ms] linear rounded-full"
            :class="getToastConfig(toast.type).progressBg"
            :style="{ width: `${toast.progress}%` }"
          ></div>
        </div>

        <!-- Glow Effect on Hover -->
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-xl"
          :class="getToastConfig(toast.type).iconBg"
        ></div>

        <!-- Shine Effect -->
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Toast Enter/Leave Animations */
.toast-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  transform: translateX(120%) scale(0.8);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(120%) scale(0.8);
  opacity: 0;
}

.toast-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth transitions */
* {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow, width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
  