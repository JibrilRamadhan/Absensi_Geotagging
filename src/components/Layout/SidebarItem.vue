<script setup>
import * as Icons from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  icon: String,
  label: String,
  collapsed: Boolean,
  active: Boolean,
})

const IconComponent = computed(() => Icons[props.icon])
</script>

<template>
  <a
    href="#"
    :class="[
      'group flex items-center h-11 rounded-xl transition-all duration-200 p-4',
      collapsed ? 'justify-center' : 'px-3 gap-3',
      active
        ? 'bg-indigo-50 text-indigo-600 dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.15)]'
        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]',
    ]"
  >
    <component :is="IconComponent" size="18" class="shrink-0" />

    <span v-show="!collapsed" class="text-sm font-medium whitespace-nowrap">
      {{ label }}
    </span>
  </a>
</template>
