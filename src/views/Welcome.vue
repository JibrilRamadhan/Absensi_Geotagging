<script setup>
import { RouterLink } from 'vue-router'
import { Hexagon, MapPin, CalendarCheck, PlaneTakeoff, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center bg-[#050505] font-['Plus_Jakarta_Sans'] overflow-hidden relative"
  >
    <!-- Background Glow -->
    <div
      class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]"
    />
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"
    />

    <!-- Card -->
    <div
      class="w-full max-w-[1300px] bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl shadow-black/50 overflow-hidden z-10 m-5"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2">
        <!-- Left Content -->
        <div class="p-10 md:p-14 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-8">
              <div class="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Hexagon class="text-orange-500 fill-orange-500/20" size="32" />
              </div>
              <span class="text-xl font-bold text-white tracking-wide">LibTrack</span>
            </div>

            <h1 class="text-4xl font-bold text-white leading-tight mb-4">
              Smart Attendance <br />
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600"
              >
                Powered by Geo-Tagging
              </span>
            </h1>

            <p class="text-zinc-500 text-sm leading-relaxed max-w-md mb-10">
              LibTrack adalah web application sistem absensi modern berbasis
              <span class="text-zinc-300 font-medium">geo-location</span> yang memastikan
              kehadiran karyawan tercatat secara akurat, transparan, dan real-time.
            </p>

            <!-- Features -->
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <MapPin class="text-orange-500 mt-1" size="20" />
                <p class="text-zinc-400 text-sm">
                  <span class="text-white font-semibold">Geo-Tagged Attendance</span><br />
                  Absensi hanya bisa dilakukan di radius lokasi yang ditentukan.
                </p>
              </div>

              <div class="flex items-start gap-3">
                <PlaneTakeoff class="text-orange-500 mt-1" size="20" />
                <p class="text-zinc-400 text-sm">
                  <span class="text-white font-semibold">Leaves Management</span><br />
                  Pengajuan cuti karyawan terintegrasi dan terdokumentasi rapi.
                </p>
              </div>

              <div class="flex items-start gap-3">
                <CalendarCheck class="text-orange-500 mt-1" size="20" />
                <p class="text-zinc-400 text-sm">
                  <span class="text-white font-semibold">Holidays & Calendar</span><br />
                  Pengelolaan hari libur nasional dan internal perusahaan.
                </p>
              </div>
            </div>
          </div>

          <p class="text-xs text-zinc-600 mt-10">
            © 2024 LibTrack Systems — Smart Workforce Control
          </p>
        </div>

        <!-- Right CTA -->
        <div
          class="flex flex-col justify-center items-center bg-gradient-to-br from-zinc-900 to-black p-10 md:p-14"
        >
          <h2 class="text-2xl font-bold text-white mb-3">
            Ready to streamline attendance?
          </h2>
          <p class="text-zinc-500 text-sm mb-8 text-center max-w-xs">
            Login untuk mengakses dashboard dan mulai mengelola kehadiran tim Anda.
          </p>

          <RouterLink
            to="/login"
            class="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-900/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>Go to Login</span>
            <ArrowRight
              size="18"
              class="group-hover:translate-x-1 transition-transform"
            />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
