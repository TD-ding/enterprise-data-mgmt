<template>
  <div>
    <h2>个人设置</h2>
    <el-card style="max-width:560px;margin-top:20px" v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>

        <el-divider>修改密码</el-divider>

        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="form.oldPassword" type="password" placeholder="修改密码时必填" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" placeholder="留空则不修改密码" show-password />
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

const form = reactive({ name: '', email: '', oldPassword: '', newPassword: '' })
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  oldPassword: [{
    validator: (rule, value, callback) => {
      if (form.newPassword && !value) callback(new Error('修改密码需输入旧密码'))
      else callback()
    }, trigger: 'blur'
  }],
  newPassword: [{ min: 6, message: '密码至少6个字符', trigger: 'blur' }],
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/auth/profile')
    form.name = res.data.name
    form.email = res.data.email
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    await api.put('/auth/profile', {
      name: form.name,
      email: form.email,
      oldPassword: form.oldPassword || undefined,
      newPassword: form.newPassword || undefined,
    })
    const updated = await api.get('/auth/profile')
    userStore.user = { ...userStore.user, ...updated.data }
    localStorage.setItem('user', JSON.stringify(userStore.user))
    form.oldPassword = ''
    form.newPassword = ''
    ElMessage.success('保存成功')
  } finally {
    saving.value = false
  }
}
</script>
