import { defineStore } from 'pinia'
import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useUserStore = defineStore('user', {
  state: () => ({
    leaves: [],
    holidays: [],
    loading: false,
    error: null,
  }),

  actions: {
    getHeader() {
      const token = localStorage.getItem('token')
      return { Authorization: `Bearer ${token}` }
    },

    async fetchMyLeaves() {
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/leaves/me`, {
          headers: this.getHeader(),
        })
        this.leaves = data.data || data
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async fetchHolidays() {
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/holidays`, {
          headers: this.getHeader(),
        })
        this.holidays = data.data || data
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async requestLeave(formData) {
      const headers = this.getHeader()

      try {
        await axios.post(`${API_BASE_URL}/api/leaves/request`, formData, { headers })
        await this.fetchMyLeaves()
      } catch (error) {
        throw error.response?.data || { message: 'Gagal mengirim pengajuan' }
      }
    },
  },
})
