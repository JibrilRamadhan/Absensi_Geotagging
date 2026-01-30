import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    history: [],
    today: null,
    recap: [],
    loading: false,
  }),

  getters: {
    alreadyCheckedIn: (state) => !!state.today?.check_in,
    alreadyCheckedOut: (state) => !!state.today?.check_out,
  },

  actions: {
    async fetchTodayStatus() {
      try {
        const date = new Date().toISOString().split('T')[0]
        const { data } = await api.get(`/api/attendance/me/${date}`)
        this.today = data.length > 0 ? data[0] : null
      } catch (err) {
        console.error('Gagal cek status absen', err)
      }
    },

    async submitAttendance(type, photoBlob, coords) {
      this.loading = true
      try {
        const formData = new FormData()
        const filename = `selfie_${type}_${Date.now()}.jpg`
        const file = new File([photoBlob], filename, { type: 'image/jpeg' })

        formData.append('photo', file)
        formData.append('latitude', coords.latitude)
        formData.append('longitude', coords.longitude)

        const endpoint = type === 'IN' ? '/api/attendance/check-in' : '/api/attendance/check-out'

        const { data } = await api.post(endpoint, formData, {
          headers: {
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
        const { data } = await api.get('/api/attendance/me/history')
        this.history = data
      } finally {
        this.loading = false
      }
    },

    async fetchMonthlyRecap(month, year) {
      try {
        const { data } = await api.get(`/api/attendance/me/recap?month=${month}&year=${year}`)
        this.recap = data.data
      } catch (err) {
        console.error(err)
      }
    },
  },
})
