import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    profileImage: (state) => {
      const BASE = import.meta.env.VITE_API_BASE_URL
      if (!state.user?.profile_picture) return `${BASE}/uploads/profiles/default-guest.png`
      return `${BASE}${state.user.profile_picture}?t=${Date.now()}`
    },
  },

  actions: {
    async login(credentials) {
      this.loading = true
      try {
        const { data } = await api.post('/api/auth/login', credentials)

        localStorage.setItem('token', data.token)
        this.user = data.user

        return true
      } catch (err) {
        this.error = err.response?.data?.message || 'Login gagal'
        return false
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      this.loading = true
      try {
        const { data } = await api.get('/api/auth/me')
        this.user = data
      } catch (err) {
        console.error('Session expired or invalid', err)
        this.logout()
      } finally {
        this.loading = false
      }
    },

    async updateProfile(formData) {
      try {
        const { data } = await api.put('/api/auth/update-profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        this.user = data
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal update profile' }
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
