<template>
  <div>
    <div class="toolbar">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <el-input v-model="search" placeholder="搜索标题/描述" style="width:180px" clearable @keyup.enter="doSearch" />
        <el-select v-model="filterStatus" placeholder="状态" style="width:110px" @change="doSearch">
          <el-option label="全部" value="" />
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="类别" style="width:130px" clearable @change="doSearch">
          <el-option label="全部" value="" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button @click="doSearch">搜索</el-button>
        <el-button type="success" size="small" @click="handleExport">导出CSV</el-button>
      </div>
      <el-button type="primary" @click="openDialog()">新增数据</el-button>
    </div>

    <el-table :data="dataList" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="120" />
      <el-table-column prop="category" label="类别" width="100" />
      <el-table-column prop="amount" label="金额" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="STATUS_MAP[row.status]?.tagType || 'info'" size="small">{{ STATUS_MAP[row.status]?.label || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reject_reason" label="驳回原因" width="120" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="page"
      @current-change="loadData"
      style="margin-top:16px"
    />

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑数据' : '新增数据'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="form.category" filterable allow-create default-first-option style="width:100%" placeholder="选择或输入类别">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.status === 'rejected'" label="驳回原因">
          <el-input v-model="form.reject_reason" type="textarea" :rows="2" placeholder="请输入驳回原因" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { STATUS_MAP, STATUS_OPTIONS } from '../constants'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '../router'

const dataList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const search = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const categories = ref([])
const dlgVisible = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref()

const defaultForm = () => ({ title: '', category: '', amount: 0, status: 'pending', description: '', reject_reason: '' })
const form = ref(defaultForm())
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/data', {
      params: { page: page.value, pageSize, search: search.value, status: filterStatus.value, category: filterCategory.value }
    })
    dataList.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await api.get('/data/categories')
    categories.value = res.data || []
  } catch { categories.value = [] }
}

function doSearch() {
  page.value = 1
  loadData()
}

function openDialog(row = null) {
  if (row) {
    editingId.value = row.id
    form.value = { title: row.title, category: row.category, amount: row.amount, status: row.status, description: row.description || '', reject_reason: row.reject_reason || '' }
  } else {
    editingId.value = null
    form.value = defaultForm()
  }
  dlgVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await api.put(`/data/${editingId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/data', form.value)
      ElMessage.success('创建成功')
    }
    dlgVisible.value = false
    loadData()
    loadCategories()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除确认', { type: 'warning' })
  await api.delete(`/data/${row.id}`)
  ElMessage.success('删除成功')
  loadData()
}

function handleExport() {
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (filterStatus.value) params.set('status', filterStatus.value)
  if (filterCategory.value) params.set('category', filterCategory.value)
  const token = localStorage.getItem('token')
  fetch(`/api/data/export?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => {
      if (r.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        throw new Error('登录已过期，请重新登录')
      }
      if (!r.ok) throw new Error('导出失败')
      return r.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'business_data.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(err => ElMessage.error(err.message || '导出失败'))
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
</style>