import { createRouter, createWebHistory } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '../stores/authStore'
import MainLayout from '../components/Layout/MainLayout.vue'
import LoginPage from '../views/LoginPage.vue'
import AdminDashboard from '../views/admin/dashboard.vue'
import UserDashboard from '../views/user/dashboard.vue'
import Home from '../views/Welcome.vue'
import UserProfile from '../views/user/profile.vue'
import UserLeaves from '../views/user/leaves.vue'
import Manage_users from '../views/admin/manage_users.vue'
import manage_office from '@/views/admin/manage_office.vue'
import manage_leaves from '@/views/admin/manage_leaves.vue'
import manage_holidays from '@/views/admin/manage_holidays.vue'
import calender from '@/views/user/calender.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },

  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { role: 'admin' },
      },
      {
        path: '/admin/manage-users',
        name: 'ManageUsers',
        component: Manage_users,
        meta: { role: 'admin' },
      },
      {
        path: '/admin/manage-office',
        name: 'ManageOffice',
        component: manage_office,
        meta: { role: 'admin' },
      },
      {
        path: '/admin/manage-leaves',
        name: 'ManageLeaves',
        component: manage_leaves,
        meta: { role: 'admin' },
      },
      {
        path: '/admin/manage-holidays',
        name: 'ManageHolidays',
        component: manage_holidays,
        meta: { role: 'admin' },
      },
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: UserDashboard,
        meta: { role: 'intern' },
      },
      {
        path: 'calender',
        name: 'UserCalender',
        component: calender,
        meta: { role: 'intern' },
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
      },
      {
        path: 'leaves',
        name: 'UserLeaves',
        component: UserLeaves,
        meta: { role: 'intern' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')

  if (token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (err) {
      authStore.logout()
      return next('/login')
    }
  }

  const user = authStore.user
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !user) {
    return next({ path: '/login', query: { auth_error: 'Silakan login.' } })
  }

  if (to.path === '/login' && user) {
    return next(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
  }

  if (to.meta.role && user.role !== to.meta.role) {
    return next(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
  }

  next()
})

export default router
