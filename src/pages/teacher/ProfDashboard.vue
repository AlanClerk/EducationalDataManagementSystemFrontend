<template>
  <div class="dashboard">
    <h1>Teacher Dashboard</h1>
    <p>Welcome, {{ userStore.nickname || 'Teacher' }}!</p>
    <p>Your UID: {{ userStore.uid || 'N/A' }}</p>
    <p>Your ID: {{ userStore.id || 'N/A' }}</p>
    <p>Department: {{ userStore.department || 'N/A' }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  text-align: center;
}
h1 {
  color: #2c3e50;
}
button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #3aa876;
}
</style>