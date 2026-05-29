<template>
  <el-container class="layout-container">
    <!-- Mobile overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>

    <el-aside
      :width="isCollapse ? '64px' : '220px'"
      class="sidebar"
      :class="{ 'sidebar-mobile-open': mobileMenuOpen }"
    >
      <div class="logo" @click="isCollapse = !isCollapse">
        <span v-if="!isCollapse">企业管理系统</span>
        <span v-else>EMS</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        @select="onMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/data">
          <el-icon><Document /></el-icon>
          <template #title>业务数据</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin()" index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><Setting /></el-icon>
          <template #title>个人设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <el-button class="mobile-menu-btn" text @click="mobileMenuOpen = !mobileMenuOpen">
          <el-icon :size="20"><Menu /></el-icon>
        </el-button>
        <span class="welcome">{{ userStore.user?.name || userStore.user?.username }}</span>
        <el-tag :type="userStore.isAdmin() ? 'danger' : 'info'" size="small">
          {{ userStore.isAdmin() ? '管理员' : '用户' }}
        </el-tag>
        <el-button type="danger" text @click="handleLogout">退出</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { DataAnalysis, Document, User, Setting, Menu } from '@element-plus/icons-vue';

const userStore = useUserStore();
const router = useRouter();
const isCollapse = ref(false);
const mobileMenuOpen = ref(false);

function onMenuSelect() {
  mobileMenuOpen.value = false;
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.sidebar {
  background: var(--color-sidebar); transition: width 0.3s, transform 0.3s;
  overflow: hidden; z-index: 100;
}
.logo {
  height: 50px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: bold; cursor: pointer;
  background: var(--color-sidebar-dark);
}
.header {
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--color-border); background: #fff;
}
.welcome { font-weight: 500; }
.mobile-menu-btn { display: none; }
.mobile-overlay { display: none; }

@media (max-width: 768px) {
  .mobile-menu-btn { display: inline-flex; }
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0;
    transform: translateX(-100%); width: 220px !important;
  }
  .sidebar-mobile-open { transform: translateX(0); }
  .mobile-overlay {
    display: block; position: fixed; inset: 0;
    background: rgba(0,0,0,0.5); z-index: 99;
  }
}
</style>