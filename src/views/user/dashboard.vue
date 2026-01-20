<script setup>
import { ref } from 'vue'
import AttendanceModal from '../../components/Attendance/AttendanceModal.vue'
import Toast from '../../components/Allert/allert.vue'

const showAttendanceModal = ref(false)
const attendanceType = ref('IN')
const toastRef = ref(null)

const openAttendance = (type) => {
  attendanceType.value = type
  showAttendanceModal.value = true
}

const handleSuccess = (msg) => {
  toastRef.value.addToast(msg, 'success')
}

const handleError = (msg) => {
  toastRef.value.addToast(msg, 'error')
}
</script>

<template>
  <div>
    <Toast ref="toastRef" />

    <div class="flex gap-4">
      <button
        @click="openAttendance('IN')"
        class="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
      >
        Check In
      </button>
      <button
        @click="openAttendance('OUT')"
        class="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
      >
        Check Out
      </button>
    </div>

    <AttendanceModal
      v-if="showAttendanceModal"
      :type="attendanceType"
      @close="showAttendanceModal = false"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>
