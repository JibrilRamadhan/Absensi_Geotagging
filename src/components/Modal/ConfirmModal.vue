<script setup>
defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Konfirmasi',
  },
  message: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'default',
  },
  confirmText: {
    type: String,
    default: 'Ya, Lanjutkan',
  },
  cancelText: {
    type: String,
    default: 'Batal',
  },
  loading: Boolean,
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <!-- Backdrop -->
  <transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      @click="$emit('cancel')"
    ></div>
  </transition>

  <!-- Modal -->
  <transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 scale-95 translate-y-2"
    enter-to-class="opacity-100 scale-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 scale-100 translate-y-0"
    leave-to-class="opacity-0 scale-95 translate-y-2"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl p-6"
        @click.stop
      >
        <h3 class="text-lg font-bold dark:text-white mb-2">
          {{ title }}
        </h3>

        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6" v-html="message"></p>

        <div class="flex justify-end gap-3">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            :disabled="loading"
          >
            {{ cancelText }}
          </button>

          <button
            @click="$emit('confirm')"
            :disabled="loading"
            class="px-6 py-2 font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : variant === 'warning'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
            "
          >
            {{ loading ? 'Memproses...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
