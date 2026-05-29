<template>
  <el-container class="layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
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
import { DataAnalysis, Document, User, Setting } from '@element-plus/icons-vue';

const userStore = useUserStore();
const router = useRouter();
const isCollapse = ref(false);

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #304156; transition: width 0.3s; overflow: hidden; }
.logo {
  height: 50px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: bold; cursor: pointer;
  background: #263445;
}
.header {
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid #e6e6e6; background: #fff;
}
.welcome { font-weight: 500; }
</style>