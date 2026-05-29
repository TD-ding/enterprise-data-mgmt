import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'users', name: 'UserManagement', component: () => import('../views/UserManage.vue'), meta: { role: 'admin' } },
      { path: 'data', name: 'DataList', component: () => import('../views/DataManage.vue') },
      { path: 'logs', name: 'OperationLogs', component: () => import('../views/OperationLogs.vue'), meta: { role: 'admin' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth !== false && !token) {
    next('/login');
    return;
  }

  // Non-admin users trying to access admin pages → redirect to dashboard
  if (to.meta.role === 'admin') {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;