<template>
  <div>
    <h2>仪表盘</h2>
    <el-row :gutter="20" v-if="stats" style="margin-top:20px">
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
          <template #header>待处理事项</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="待审核数据">{{ stats?.pendingCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="已审核数据">{{ stats?.approvedCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="数据总量">{{ stats?.dataCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="金额总计">¥{{ stats?.totalAmount?.toLocaleString() || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>用户概况</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户总数">{{ stats?.userCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃用户">{{ stats?.activeUsers || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const stats = ref(null);

const cards = computed(() => [
  { label: '用户总数', value: stats.value?.userCount || 0 },
  { label: '数据总量', value: stats.value?.dataCount || 0 },
  { label: '待审核', value: stats.value?.pendingCount || 0 },
  { label: '金额总计', value: '¥' + (stats.value?.totalAmount?.toLocaleString() || 0) },
]);

onMounted(async () => {
  if (userStore.isAdmin()) {
    stats.value = await api.get('/admin/stats');
  } else {
    const res = await api.get('/data', { params: { pageSize: 1 } });
    stats.value = { userCount: 1, activeUsers: 1, dataCount: res.total, pendingCount: 0, approvedCount: 0, totalAmount: 0 };
  }
});
</script>

<style scoped>
.stat-card { text-align: center; padding: 10px 0; }
.stat-value { font-size: 28px; font-weight: bold; color: #409EFF; }
.stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
</style>