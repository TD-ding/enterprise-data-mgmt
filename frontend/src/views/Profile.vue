<template>
  <div>
    <h2>个人设置</h2>
    <el-card style="max-width:560px;margin-top:20px" v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名">
          <el-input :model-value="userStore.user?.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-tag :type="userStore.isAdmin() ? 'danger' : 'info'">{{ userStore.isAdmin() ? '管理员' : '用户' }}</el-tag>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.password" type="password" placeholder="留空则不修改" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const saving = ref(false)

const form = reactive({ name: '', email: '', password: '' })
const rules = {
  name: [{ required: true, message: '请输��姓名', trigger: 'blur' }],
}

onMounted(async () => {
  loading.value = true
  try {
    const profile = await api.get('/auth/profile')
    form.name = profile.name
    form.email = profile.email
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = { name: form.name, email: form.email }
    if (form.password) payload.password = form.password
    await api.put(`/auth/users/${userStore.user.id}`, payload)

    const updated = await api.get('/auth/profile')
    userStore.user = { ...userStore.user, ...updated }
    localStorage.setItem('user', JSON.stringify(userStore.user))

    ElMessage.success('保存成功')
  } finally {
    saving.value = false
  }
}
</script>