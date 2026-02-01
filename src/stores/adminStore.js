import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    companies: [],
    leaves: [],
    holidays: [],
    loading: false,
  }),

  getters: {
    totalUsers: (state) => state.users.length,

    internUsers: (state) => state.users.filter((u) => u.role === 'intern'),

    internPresentToday() {
      return this.internUsers.filter((u) => u.check_in)
    },

    internAbsentToday() {
      return this.internUsers.filter((u) => !u.check_in)
    },

    activeOffices: (state) => state.companies.filter((c) => c.has_office),
  },

  actions: {
    async fetchUsers(filters = {}) {
      this.loading = true
      try {
        const params = new URLSearchParams(filters).toString()
        const { data } = await api.get(`/api/admin/users/all?${params}`)
        this.users = data
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      const { data } = await api.post('/api/admin/users', userData)
      await this.fetchUsers()
      return data
    },

    async updateUser(id, payload) {
      const { data } = await api.put(`/api/admin/users/${id}`, payload)
      await this.fetchUsers()
      return data
    },

    async toggleUserStatus(id, status) {
      const action = status ? 'enable' : 'disable'
      await api.patch(`/api/admin/users/${id}/${action}`)
      await this.fetchUsers()
    },

    async resetPassword(id) {
      const { data } = await api.patch(`/api/admin/users/${id}/reset-password`)
      return data
    },

    async deleteUser(id) {
      await api.delete(`/api/admin/users/${id}`)
      await this.fetchUsers()
    },

    // ================= OFFICE & COMPANY =================
    async fetchCompanies() {
      const { data } = await api.get('/api/admin/companies')
      this.companies = data
    },

    async createCompany(payload) {
      await api.post('/api/admin/companies', payload)
      await this.fetchCompanies()
    },

    async getOffice(companyId = null) {
      const url = companyId ? `/api/admin/office/${companyId}` : '/api/admin/office'
      const { data } = await api.get(url)
      return data
    },

    async saveOffice(payload) {
      // Payload: { latitude, longitude, radius, address, company_id }
      const { data } = await api.post('/api/admin/office', payload)
      return data
    },

    // ================= LEAVE MANAGEMENT (APPROVAL) =================
    async fetchAllLeaves(status = '') {
      const { data } = await api.get(`/api/leaves/all?status=${status}`)
      this.leaves = data.data || data

      return data
    },

    async approveLeave(id) {
      await api.put(`/api/leaves/${id}/approve`)
      await this.fetchAllLeaves()
    },

    async rejectLeave(id, note) {
      await api.put(`/api/leaves/${id}/reject`, { note })
      await this.fetchAllLeaves()
    },

    // ================= HOLIDAY MANAGEMENT =================
    async fetchHolidays() {
      const { data } = await api.get('/api/holidays')
      const result = data.data || data
      this.holidays = result
      return result
    },

    async createHoliday(payload) {
      await api.post('/api/holidays/create', payload)
      await this.fetchHolidays()
    },

    async deleteHoliday(id) {
      await api.delete(`/api/holidays/${id}/delete`)
      await this.fetchHolidays()
    },

    // ================= AUDIT & EXPORT =================
    async exportDailyData(date) {
      const { data } = await api.get(`/api/export/daily/${date}`)
      return data.data || data
    },

    async fetchUserAuditLogs(id) {
      const { data } = await api.get(`/api/audit/user/${id}`)
      console.log(`/api/audit/user/${id}`)
      return data.data || data
    },

    async syncHolidays() {
      const { data } = await api.post('/api/holidays/sync')
      await this.fetchHolidays()
      return data
    },
  },
})
