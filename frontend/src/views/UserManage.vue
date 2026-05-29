<template>
  <div>
    <div class="toolbar">
      <h2>用户管理</h2>
      <div>
        <el-input v-model="search" placeholder="搜索用户名/姓名/邮箱" style="width:220px;margin-right:10px" clearable @clear="loadUsers" @keyup.enter="loadUsers" />
        <el-button type="primary" @click="openDialog()">新增用户</el-button>
      </div>
    </div>
    <el-table :data="users" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'warning'">{{ row.status === 'active' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px;justify-content:flex-end" v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="total, prev, pager, next" @current-change="loadUsers" />

    <el-dialog v-model="dialogVisible" :title="editUser ? '编辑用户' : '新增用户'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editUser" />
        </el-form-item>
        <el-form-item label="密码" :prop="editUser ? '' : 'password'">
          <el-input v-model="form.password" type="password" :placeholder="editUser ? '留空则不修改' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editUser" label="状态" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="正常" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

const users = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const dialogVisible = ref(false);
const editUser = ref(null);
const formRef = ref();

const form = reactive({ username: '', password: '', name: '', email: '', role: 'user', status: 'active' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

async function loadUsers() {
  const res = await api.get('/auth/users', { params: { page: page.value, pageSize: pageSize.value, search: search.value } });
  users.value = res.data;
  total.value = res.total;
}

function openDialog(user = null) {
  editUser.value = user;
  if (user) {
    Object.assign(form, { username: user.username, password: '', name: user.name, email: user.email, role: user.role, status: user.status });
  } else {
    Object.assign(form, { username: '', password: '', name: '', email: '', role: 'user', status: 'active' });
  }
  dialogVisible.value = true;
}

async function handleSubmit() {
  await formRef.value.validate();
  if (editUser.value) {
    const payload = { name: form.name, email: form.email, role: form.role, status: form.status };
    if (form.password) payload.password = form.password;
    await api.put(`/auth/users/${editUser.value.id}`, payload);
    ElMessage.success('更新成功');
  } else {
    await api.post('/auth/users', form);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadUsers();
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '提示', { type: 'warning' });
  await api.delete(`/auth/users/${row.id}`);
  ElMessage.success('删除成功');
  loadUsers();
}

onMounted(loadUsers);
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>