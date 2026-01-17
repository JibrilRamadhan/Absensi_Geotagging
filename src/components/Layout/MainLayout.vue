<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar />
    <div class="flex flex-col flex-1">
      <Navbar />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
      <!-- <Footer /> -->
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import Footer from './Footer.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--neutral-light-gray);
}

.main-wrapper {
  display: flex;
  flex: 1;
  gap: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .main-wrapper {
    flex-direction: column;
  }
}
</style>
