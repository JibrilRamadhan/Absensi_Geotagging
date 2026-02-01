<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
  X,
  CalendarDays,
} from 'lucide-vue-next'

const userStore = useUserStore()
const currentDate = ref(new Date())

const showModal = ref(false)
const selectedHoliday = ref(null)

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const months = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const fetchHolidays = async () => {
  await userStore.fetchHolidays()
}

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const calendarDays = computed(() => {
  let daysArray = []

  for (let i = 0; i < firstDayOfMonth.value; i++) {
    daysArray.push({ date: '', isCurrentMonth: false })
  }

  for (let i = 1; i <= daysInMonth.value; i++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`

    const holiday = userStore.holidays.find((h) => {
      const hDate = new Date(h.date)
      return (
        hDate.getFullYear() === currentYear.value &&
        hDate.getMonth() === currentMonth.value &&
        hDate.getDate() === i
      )
    })

    daysArray.push({
      day: i,
      fullDate: dateStr,
      isCurrentMonth: true,
      isToday: isToday(i),
      holiday: holiday || null,
    })
  }

  return daysArray
})

const isToday = (day) => {
  const today = new Date()
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const upcomingHolidays = computed(() => {
  return userStore.holidays
    .filter((h) => {
      const hDate = new Date(h.date)
      return hDate.getMonth() === currentMonth.value && hDate.getFullYear() === currentYear.value
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})

const openHolidayDetail = (holiday) => {
  if (!holiday) return
  selectedHoliday.value = holiday
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    selectedHoliday.value = null
  }, 300)
}

onMounted(fetchHolidays)
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 font-sans">
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon class="text-indigo-600 dark:text-indigo-400" />
            Kalender Libur
          </h1>
          <p class="text-slate-500 dark:text-zinc-400 mt-1">
            Cek jadwal libur nasional dan cuti bersama.
          </p>
        </div>

        <div
          class="flex items-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-1"
        >
          <button
            @click="prevMonth"
            class="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <ChevronLeft class="text-slate-600 dark:text-zinc-400" />
          </button>
          <span class="px-4 font-bold text-slate-800 dark:text-white min-w-[140px] text-center">
            {{ months[currentMonth] }} {{ currentYear }}
          </span>
          <button
            @click="nextMonth"
            class="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <ChevronRight class="text-slate-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6"
        >
          <div class="grid grid-cols-7 mb-4">
            <div
              v-for="(day, i) in days"
              :key="day"
              class="text-center text-xs font-bold uppercase py-2"
              :class="
                i === 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-zinc-500'
              "
            >
              {{ day }}
            </div>
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="(date, index) in calendarDays"
              :key="index"
              @click="date.holiday && openHolidayDetail(date.holiday)"
              class="min-h-[80px] md:min-h-[100px] relative p-2 rounded-2xl border transition-all duration-300 group"
              :class="[
                !date.isCurrentMonth
                  ? 'border-transparent cursor-default'
                  : 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30',
                date.holiday
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:shadow-red-500/10'
                  : 'cursor-default',
                date.isToday
                  ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900'
                  : '',
              ]"
            >
              <div v-if="date.isCurrentMonth">
                <span
                  class="text-sm font-bold block mb-1"
                  :class="[
                    date.holiday
                      ? 'text-red-600 dark:text-red-400'
                      : index % 7 === 0
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-slate-700 dark:text-zinc-300',
                    date.isToday ? '!text-indigo-600 dark:!text-indigo-400' : '',
                  ]"
                >
                  {{ date.day }}
                </span>

                <div v-if="date.holiday" class="mt-1">
                  <div class="md:hidden flex justify-center mt-2">
                    <div class="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  </div>
                  <p
                    class="hidden md:block text-[10px] leading-tight font-bold text-red-600 dark:text-red-400 line-clamp-2"
                  >
                    {{ date.holiday.name }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div
            class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20"
          >
            <h3 class="font-bold text-lg mb-1">Bulan {{ months[currentMonth] }}</h3>
            <p class="text-indigo-100 text-sm opacity-90">
              Terdapat
              <span class="font-black text-white text-lg mx-1">{{ upcomingHolidays.length }}</span>
              hari libur.
            </p>
          </div>

          <div
            class="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6"
          >
            <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info size="18" class="text-slate-400" />
              Detail Libur
            </h3>

            <div v-if="upcomingHolidays.length > 0" class="space-y-3">
              <button
                v-for="h in upcomingHolidays"
                :key="h.id"
                @click="openHolidayDetail(h)"
                class="w-full flex gap-4 items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 text-left"
              >
                <div
                  class="flex flex-col items-center bg-red-50 dark:bg-red-500/10 rounded-lg p-2 min-w-[50px]"
                >
                  <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                    {{ new Date(h.date).toLocaleDateString('id-ID', { month: 'short' }) }}
                  </span>
                  <span class="text-xl font-black text-red-600 dark:text-red-400">
                    {{ new Date(h.date).getDate() }}
                  </span>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-zinc-200 text-sm">{{ h.name }}</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                    {{ h.description || 'Klik untuk lihat detail' }}
                  </p>
                </div>
              </button>
            </div>

            <div v-else class="text-center py-8">
              <p class="text-slate-400 text-sm">Tidak ada libur bulan ini.</p>
              <p class="text-xs text-slate-300 mt-1">Tetap semangat bekerja! 💪</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>

        <div
          class="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-zinc-800 transform transition-all scale-100"
        >
          <div class="h-24 bg-gradient-to-r from-red-500 to-orange-500 relative overflow-hidden">
            <div class="absolute -right-4 -top-8 text-white/10">
              <CalendarDays size="120" />
            </div>
            <button
              @click="closeModal"
              class="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              <X size="20" />
            </button>
          </div>

          <div class="p-6 relative">
            <div class="-mt-14 mb-4">
              <div
                class="inline-flex flex-col items-center justify-center bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-700"
              >
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {{
                    selectedHoliday
                      ? new Date(selectedHoliday.date).toLocaleDateString('id-ID', {
                          month: 'long',
                        })
                      : ''
                  }}
                </span>
                <span class="text-3xl font-black text-slate-900 dark:text-white">
                  {{ selectedHoliday ? new Date(selectedHoliday.date).getDate() : '' }}
                </span>
                <span class="text-xs font-medium text-slate-400">
                  {{ selectedHoliday ? new Date(selectedHoliday.date).getFullYear() : '' }}
                </span>
              </div>
            </div>

            <div v-if="selectedHoliday" class="space-y-4">
              <div>
                <h2 class="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {{ selectedHoliday.name }}
                </h2>
                <p class="text-sm font-medium text-red-500 mt-1">Hari Libur Nasional</p>
              </div>

              <div
                class="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800/50"
              >
                <h4 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <Info size="14" />
                  Catatan / Keterangan
                </h4>
                <p class="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
                  {{
                    selectedHoliday.description || 'Tidak ada catatan khusus untuk hari libur ini.'
                  }}
                </p>
              </div>
            </div>

            <div class="mt-6">
              <button
                @click="closeModal"
                class="w-full py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
