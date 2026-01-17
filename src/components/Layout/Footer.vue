<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="mt-auto border-t-4 border-orange-500 bg-zinc-900 text-zinc-300">
    <div class="max-w-7xl mx-auto px-6 py-12 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <h4 class="text-lg font-semibold text-orange-500 mb-4">About</h4>
        <p class="text-sm leading-relaxed text-zinc-400">
          Academix is a comprehensive attendance and learning management system designed for
          internship programs.
        </p>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-orange-500 mb-4">Quick Links</h4>
        <ul class="space-y-3 text-sm">
          <li>
            <RouterLink to="/" class="hover:text-orange-500 transition"> Dashboard </RouterLink>
          </li>
          <li>
            <RouterLink to="/profile" class="hover:text-orange-500 transition">
              My Profile
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/resources" class="hover:text-orange-500 transition">
              Resources
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/settings" class="hover:text-orange-500 transition">
              Settings
            </RouterLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-orange-500 mb-4">Support</h4>
        <ul class="space-y-3 text-sm">
          <li><a href="#" class="hover:text-orange-500 transition">Help Center</a></li>
          <li><a href="#" class="hover:text-orange-500 transition">Contact Us</a></li>
          <li><a href="#" class="hover:text-orange-500 transition">Privacy Policy</a></li>
          <li><a href="#" class="hover:text-orange-500 transition">Terms of Service</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-orange-500 mb-4">Follow Us</h4>
        <div class="flex gap-3">
          <a
            href="#"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition"
            title="Facebook"
          >
            f
          </a>
          <a
            href="#"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition"
            title="Twitter / X"
          >
            𝕏
          </a>
          <a
            href="#"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition"
            title="LinkedIn"
          >
            in
          </a>
          <a
            href="#"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition"
            title="Instagram"
          >
            📷
          </a>
        </div>
      </div>
    </div>

    <div class="border-t border-zinc-700">
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-zinc-400"
      >
        <p>© 2026 Academix. All rights reserved.</p>
        <p>Made with ❤️ for better education</p>
      </div>
    </div>
  </footer>
</template>
