<template>
  <div>
    <div class="toolbar">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <el-input v-model="search" placeholder="搜索标题/描述" style="width:200px" clearable @keyup.enter="searchData" />
        <el-select v-model="filterStatus" style="width:120px" @change="onFilterChange" placeholder="状态筛选">
          <el-option label="全部" value="" />
          <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button @click="searchData">搜索</el-button>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <template v-if="selectedRows.length">
          <el-select v-model="batchStatus" style="width:120px" placeholder="批量改状态">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button type="warning" size="small" @click="handleBatchStatus">
            批量修改 ({{ selectedRows.length }})
          </el-button>
        </template>
        <el-button type="primary" @click="openDialog()">新增数据</el-button>
      </div>
    </div>

    <el-table :data="dataList" border stripe v-loading="loading" @selection-change="onSelectionChange">
      <el-table-column type="selection" width="45" />
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="120" />
      <el-table-column prop="category" label="类别" width="100" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="STATUS_MAP[row.status]?.tagType || 'info'" size="small">{{ STATUS_MAP[row.status]?.label || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && dataList.length === 0" description="暂无数据，点击右上角新增" />

    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top:16px"
    />

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑数据' : '新增数据'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="类别">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { STATUS_MAP, STATUS_OPTIONS } from '../constants'
import { ElMessage, ElMessageBox } from 'element-plus'

const dataList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const filterStatus = ref('')
const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const loading = ref(false)
const saving = ref(false)
const selectedRows = ref([])
const batchStatus = ref('')

const defaultForm = () => ({ title: '', category: '', amount: 0, description: '', status: 'pending' })
const form = ref(defaultForm())
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/data', {
      params: { page: page.value, pageSize: pageSize.value, search: search.value, status: filterStatus.value }
    })
    dataList.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function searchData() {
  page.value = 1
  loadData()
}

function onFilterChange() {
  page.value = 1
  loadData()
}

function onSelectionChange(rows) {
  selectedRows.value = rows
}

function openDialog(row = null) {
  editId.value = row?.id ?? null
  form.value = row ? { title: row.title, category: row.category, amount: row.amount, description: row.description, status: row.status } : defaultForm()
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (editId.value) {
      await api.put(`/data/${editId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/data', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(
    `确定删除「${row.title}」吗？删除后数据将无法恢复。`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  )
  await api.delete(`/data/${row.id}`)
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchStatus() {
  if (!batchStatus.value) {
    return ElMessage.warning('请先选择要修改为的状态')
  }
  const ids = selectedRows.value.map(r => r.id)
  await ElMessageBox.confirm(
    `确认将 ${ids.length} 条数据的状态修改为「${STATUS_MAP[batchStatus.value]?.label}」？此操作不可撤销。`,
    '批量修改确认',
    { confirmButtonText: '确认修改', cancelButtonText: '取消', type: 'warning' }
  )
  await api.put('/admin/data/batch-status', { ids, status: batchStatus.value })
  ElMessage.success('批量修改成功')
  selectedRows.value = []
  batchStatus.value = ''
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
</style>