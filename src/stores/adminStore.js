import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    companies: [],
    loading: false,
    error: null,
  }),

  getters: {
    activeUsers: (state) => state.users.filter((u) => u.active !== false),
    internUsers: (state) => state.users.filter((u) => u.role === 'intern'),
    adminUsers: (state) => state.users.filter((u) => u.role === 'admin'),
  },

  actions: {
    authHeader() {
      const token = localStorage.getItem('token')
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    },

    async fetchUsers() {
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/users/all`, {
          headers: this.authHeader(),
        })
        this.users = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data user'
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      this.loading = true
      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/admin/users`, userData, {
          headers: this.authHeader(),
        })
        await this.fetchUsers()
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal membuat user' }
      } finally {
        this.loading = false
      }
    },

    async updateUser(id, payload) {
      try {
        const { data } = await axios.put(`${API_BASE_URL}/api/admin/users/${id}`, payload, {
          headers: this.authHeader(),
        })
        await this.fetchUsers()
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal update user' }
      }
    },

    async disableUser(id) {
      try {
        const { data } = await axios.patch(
          `${API_BASE_URL}/api/admin/users/${id}/disable`,
          {},
          {
            headers: this.authHeader(),
          },
        )
        await this.fetchUsers()
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal menonaktifkan user' }
      }
    },

    async enableUser(id) {
      try {
        const { data } = await axios.patch(
          `${API_BASE_URL}/api/admin/users/${id}/enable`,
          {},
          {
            headers: this.authHeader(),
          },
        )
        await this.fetchUsers()
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal mengaktifkan user' }
      }
    },

    async resetPassword(id) {
      try {
        const { data } = await axios.patch(
          `${API_BASE_URL}/api/admin/users/${id}/reset-password`,
          {},
          {
            headers: this.authHeader(),
          },
        )
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal reset password' }
      }
    },

    async deleteUser(id) {
      try {
        const { data } = await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
          headers: this.authHeader(),
        })
        await this.fetchUsers()
        return data
      } catch (error) {
        throw error.response?.data || { message: 'Gagal menghapus user' }
      }
    },

    async fetchCompanies() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/companies`, {
          headers: this.authHeader(),
        })
        this.companies = res.data
      } catch (e) {
        console.error('Failed fetch companies', e)
        this.companies = []
      }
    },
  },
})
