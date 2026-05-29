<template>
  <div>
    <h2>操作日志</h2>
    <el-table :data="logs" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户" width="120" />
      <el-table-column prop="action" label="操作" width="200" />
      <el-table-column prop="target_type" label="目标类型" width="120" />
      <el-table-column prop="target_id" label="目标ID" width="80" />
      <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" width="180" />
    </el-table>
    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="load"
      style="margin-top:16px;justify-content:center"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const logs = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20

async function load() {
  loading.value = true
  try {
    const res = await api.get('/logs', { params: { page: page.value, pageSize } })
    logs.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>