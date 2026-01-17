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
        ? 'bg-orange-50 text-orange-500 dark:bg-orange-500/10'
        : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
    ]"
  >
    <component :is="IconComponent" size="18" class="shrink-0" />

    <span v-show="!collapsed" class="text-sm font-medium whitespace-nowrap">
      {{ label }}
    </span>
  </a>
</template>
