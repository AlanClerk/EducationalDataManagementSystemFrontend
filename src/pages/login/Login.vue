<template>
  <div class="login-page">
    <div class="login-box">
      <h2>教学状态数据系统登录</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="username" placeholder="请输入用户名" required />
        <input v-model="password" type="password" placeholder="请输入密码" required />
        <button type="submit">登录</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/stores/user'

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const router = useRouter()
const userStore = useUserStore()

// 组件挂载时恢复 sessionStorage 中的字段
onMounted(() => {
  const id = sessionStorage.getItem('id')
  const uid = sessionStorage.getItem('uid')
  const token = sessionStorage.getItem('token')
  const role = sessionStorage.getItem('role')
  const username = sessionStorage.getItem('username')
  const name = sessionStorage.getItem('name')
  const department = sessionStorage.getItem('department')
  const nickname = sessionStorage.getItem('nickname')

  if (id && uid && token && role && username) {
    const userData = {
      id,
      uid,
      token,
      role,
      username,
      name: name || '',
      department: department || '',
      nickname: nickname || ''
    }
    userStore.setUser(userData)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
})

const handleLogin = async () => {
  isLoading.value = true
  try {
    const response = await axios.post('/edu/public/login', {
      username: username.value,
      password: password.value
    })

    const res = response.data
    if (res.code === 200) {
      // 保存用户信息到 userStore 和 sessionStorage
      userStore.setUser(res.data)
      // 直接存储字段到 sessionStorage
      sessionStorage.setItem('id', res.data.id)
      sessionStorage.setItem('uid', res.data.uid)
      sessionStorage.setItem('token', res.data.token)
      sessionStorage.setItem('role', res.data.role)
      sessionStorage.setItem('username', res.data.username)
      if (res.data.name) {
        sessionStorage.setItem('name', res.data.name)
      }
      if (res.data.department) {
        sessionStorage.setItem('department', res.data.department)
      }
      if (res.data.nickname) {
        sessionStorage.setItem('nickname', res.data.nickname)
      }
      axios.defaults.headers.common['Authorization'] = `${res.data.token}`
      alert('登录成功')

      const role = res.data.role
      router.push(`/${role}Dashboard`)
    } else {
      alert(res.msg)
    }
  } catch (err) {
    alert('登录失败，请检查网络或稍后重试')
  } finally {
    isLoading.value = false
  }
}
</script>
<style scoped>
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #4e73df, #224abe);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  width: 320px;
  animation: fadeIn 0.6s ease-in-out;
}

.login-box h2 {
  margin-bottom: 25px;
  text-align: center;
  color: #333;
}

input {
  width: 100%;
  padding: 12px;
  margin-bottom: 18px;
  border: 1px solid #ccc;
  border-radius: 8px;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #4e73df;
  outline: none;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #4e73df;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3c5ccf;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>