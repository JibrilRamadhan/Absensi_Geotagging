<script>
import { useRouter } from 'vue-router'
</script>
<template>
  <div class="p-6 space-y-6">
    <Transition name="fade" appear>
      <div>
        <h1 class="text-2xl font-bold dark:text-white">HALAMAN AWAL</h1>
        <div class="text-gray-500 dark:text-zinc-400 mt-1">
          <button class="outline-neutral-900">
            <RouterLink to="/login">
              <button
                class="text-black px-4 py-2 rounded outline-2 hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                Login
              </button>
            </RouterLink>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
