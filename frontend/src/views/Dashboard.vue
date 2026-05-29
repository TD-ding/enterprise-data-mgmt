<template>
  <div>
    <h2>仪表盘</h2>
    <div v-if="loading" v-loading="true" style="height: 200px"></div>
    <template v-else>
      <el-row :gutter="20" style="margin-top:20px">
        <el-col :span="6" v-for="card in cards" :key="card.label">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top:20px">
        <el-col :span="12">
          <el-card>
            <template #header>数据概况</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="待处理">{{ stats.pendingCount || 0 }}</el-descriptions-item>
              <el-descriptions-item label="已审批">{{ stats.approvedCount || 0 }}</el-descriptions-item>
              <el-descriptions-item label="数据总量">{{ isAdmin ? (stats.dataCount || 0) : (stats.totalCount || 0) }}</el-descriptions-item>
              <el-descriptions-item label="金额总计">¥{{ (stats.totalAmount || 0).toLocaleString() }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12" v-if="isAdmin">
          <el-card>
            <template #header>用户概况</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户总数">{{ stats.userCount || 0 }}</el-descriptions-item>
              <el-descriptions-item label="活跃用户">{{ stats.activeUsers || 0 }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12" v-else>
          <el-card>
            <template #header>温馨提示</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="我的数据">{{ stats.totalCount || 0 }} 条</el-descriptions-item>
              <el-descriptions-item label="待处理">{{ stats.pendingCount || 0 }} 条</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const stats = ref(null);
const loading = ref(true);
const isAdmin = computed(() => userStore.isAdmin());

const cards = computed(() => {
  if (!stats.value) return [];
  if (isAdmin.value) {
    return [
      { label: '用户总数', value: stats.value.userCount || 0 },
      { label: '数据总量', value: stats.value.dataCount || 0 },
      { label: '待审核', value: stats.value.pendingCount || 0 },
      { label: '金额总计', value: '¥' + (stats.value.totalAmount || 0).toLocaleString() },
    ];
  }
  return [
    { label: '我的数据', value: stats.value.totalCount || 0 },
    { label: '待处理', value: stats.value.pendingCount || 0 },
    { label: '已审批', value: stats.value.approvedCount || 0 },
    { label: '金额总计', value: '¥' + (stats.value.totalAmount || 0).toLocaleString() },
  ];
});

onMounted(async () => {
  try {
    if (isAdmin.value) {
      stats.value = await api.get('/admin/stats');
    } else {
      stats.value = await api.get('/data/my-stats');
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.stat-card { text-align: center; padding: 10px 0; }
.stat-value { font-size: 28px; font-weight: bold; color: #409EFF; }
.stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
</style>