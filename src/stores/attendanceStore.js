import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    loading: false,
    history: [],
    today: null,
  }),

  getters: {
    alreadyCheckedIn: (state) => !!state.today?.check_in,
    alreadyCheckedOut: (state) => !!state.today?.check_out,
  },

  actions: {
    authHeader() {
      return { Authorization: `Bearer ${localStorage.getItem('token')}` }
    },

    async fetchTodayStatus() {
      try {
        const date = new Date().toISOString().split('T')[0]
        const { data } = await axios.get(`${API_BASE}/api/attendance/me/${date}`, {
          headers: this.authHeader(),
        })
        this.today = data.length > 0 ? data[0] : null
      } catch (err) {
        console.error('Gagal cek status absen', err)
      }
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
            'x-screen': `${window.screen.width}x${window.screen.height}`,
          },
        })

        await this.fetchTodayStatus()

        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal melakukan absensi' }
      } finally {
        this.loading = false
      }
    },

    async fetchHistory() {
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE}/api/attendance/me`, {
          headers: this.authHeader(),
        })
        this.history = data
      } catch (err) {
        console.error('Gagal mengambil riwayat absen', err)
      } finally {
        this.loading = false
      }
    },
  },
})
