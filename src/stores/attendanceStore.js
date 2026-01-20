import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    loading: false,
    history: [],
  }),

  actions: {
    authHeader() {
      return { Authorization: `Bearer ${localStorage.getItem('token')}` }
    },

    async submitAttendance(type, photoBlob, coords) {
      this.loading = true
      try {
        const formData = new FormData()
        const file = new File([photoBlob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })

        formData.append('photo', file)
        formData.append('latitude', coords.latitude)
        formData.append('longitude', coords.longitude)

        const endpoint = type === 'IN' ? '/api/attendance/check-in' : '/api/attendance/check-out'

        const { data } = await axios.post(`${API_BASE}${endpoint}`, formData, {
          headers: {
            ...this.authHeader(),
            'Content-Type': 'multipart/form-data',
            'x-screen': `${window.screen.width}x${window.screen.height}`, // Kirim ukuran layar untuk Risk Engine
          },
        })

        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal melakukan absensi' }
      } finally {
        this.loading = false
      }
    },
  },
})
