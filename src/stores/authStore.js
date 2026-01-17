import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
  }),

  getters: {
    profileImage: (state) => {
      const API_BASE = import.meta.env.VITE_API_BASE_URL
      if (!state.user?.profile_picture) {
        return `${API_BASE}/uploads/profiles/default-guest.png`
      }
      return `${API_BASE}${state.user.profile_picture}?t=${Date.now()}`
    },
  },

  actions: {
    async fetchUser() {
      this.loading = true
      try {
        const { data } = await api.get('/api/auth/me')
        this.user = data
      } catch (err) {
        console.error('Fetch user failed:', err)
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

        window.dispatchEvent(new Event('profile-updated'))

        return data
      } catch (error) {
        throw error
      }
    },
    logout() {
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
