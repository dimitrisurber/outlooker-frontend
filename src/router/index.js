import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import BookingWidget from '@/components/BookingWidget.vue';
import BookingForm from '@/components/BookingForm.vue';
import BookingSuccess from '@/components/BookingSuccess.vue';
import { authAPI } from '@/services/api';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('@/views/UserManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/book/:userId',
    name: 'BookingWidget',
    component: BookingWidget,
    // No auth required - public access
  },
  {
    path: '/booking/:userId',
    name: 'BookingForm',
    component: BookingForm,
    // No auth required - public access
  },
  {
    path: '/booking-confirmation',
    name: 'BookingConfirmation',
    component: () => import('@/components/BookingConfirmation.vue'),
    // No auth required - public access
  },
  {
    path: '/book/:userId/confirm',
    name: 'BookingConfirm',
    component: () => import('@/components/BookingForm.vue'),
    // No auth required - public access
  },
  {
    path: '/calendar-connected',
    name: 'CalendarConnected',
    component: () => import('@/views/CalendarConnected.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar-error',
    name: 'CalendarError',
    component: () => import('@/views/CalendarError.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/booking-success',
    name: 'BookingSuccess',
    component: BookingSuccess,
    // No auth required - public access
  },
  {
    path: '/success',
    name: 'Success',
    component: BookingSuccess,
    // No auth required - public access
  },
  // Redirect root to dashboard
  {
    path: '/',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check auth for protected routes
    const isAuthenticated = await authAPI.checkAuth()
    if (!isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // Check if route requires admin role
      if (to.matched.some(record => record.meta.requiresAdmin)) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'admin') {
          next();
        } else {
          // Not an admin, redirect to dashboard
          next('/dashboard');
        }
      } else {
        next();
      }
    }
  } else if (to.path === '/login') {
    // Check if already authenticated for login page
    const isAuthenticated = await authAPI.checkAuth()
    if (isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router; 