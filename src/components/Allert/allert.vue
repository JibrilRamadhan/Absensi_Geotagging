<script setup>
import { ref } from 'vue'
import { CheckCircle2, AlertCircle, X } from 'lucide-vue-next'

const toasts = ref([])

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 3000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

defineExpose({ addToast })
</script>

<template>
  <div class="fixed top-5 right-5 z-9999 flex flex-col gap-3">
    <TransitionGroup name="slide-fade">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-75"
        :class="
          t.type === 'success'
            ? 'bg-green-50/90 border-green-200 text-green-700'
            : 'bg-red-50/90 border-red-200 text-red-700'
        "
      >
        <CheckCircle2 v-if="t.type === 'success'" size="20" />
        <AlertCircle v-else size="20" />

        <span class="text-sm font-bold flex-1">{{ t.message }}</span>

        <button @click="removeToast(t.id)" class="hover:opacity-70">
          <X size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
