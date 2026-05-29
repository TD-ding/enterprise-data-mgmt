<template>
  <div>
    <div class="toolbar">
      <div style="display:flex;gap:10px;align-items:center">
        <el-input v-model="search" placeholder="搜索标题/描述" style="width:200px" clearable @keyup.enter="loadData" />
        <el-select v-model="filterStatus" style="width:120px" @change="loadData" placeholder="状态筛选">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="已审批" value="approved" />
          <el-option label="已完成" value="completed" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-button @click="loadData">搜索</el-button>
      </div>
      <el-button type="primary" @click="openDialog()">新增数据</el-button>
    </div>

    <el-table :data="dataList" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="120" />
      <el-table-column prop="category" label="类别" width="100" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
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
        <el-form-item label="类别" prop="category">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="待处理" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
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

const form = ref({ title: '', category: '', amount: 0, description: '', status: 'pending' })
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

async function loadData() {
  const res = await api.get('/data', {
    params: { page: page.value, pageSize: pageSize.value, search: search.value, status: filterStatus.value }
  })
  dataList.value = res.data
  total.value = res.total
}

function openDialog(row = null) {
  if (row) {
    editId.value = row.id
    form.value = { title: row.title, category: row.category, amount: row.amount, description: row.description, status: row.status }
  } else {
    editId.value = null
    form.value = { title: '', category: '', amount: 0, description: '', status: 'pending' }
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  if (editId.value) {
    await api.put(`/data/${editId.value}`, form.value)
    ElMessage.success('更新成功')
  } else {
    await api.post('/data', form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadData()
}

async function handleDelete(id) {
  await ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
  await api.delete(`/data/${id}`)
  ElMessage.success('删除成功')
  loadData()
}

function statusText(s) {
  return { pending: '待处理', approved: '已审批', completed: '已完成', rejected: '已拒绝' }[s] || s
}

function statusType(s) {
  return { pending: 'warning', approved: 'success', completed: '', rejected: 'danger' }[s] || 'info'
}

onMounted(loadData)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>