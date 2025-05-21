<template>
  <div class="admin-dashboard">
    <header>
      <h1>用户管理</h1>
      <div class="nav-buttons">
        <button @click="goToBook">图书管理</button>
        <button @click="goToClass">课程管理</button>
      </div>
    </header>

    <div class="action-buttons">
      <button @click="handleAdd">新增用户</button>
      <button @click="downloadTemplate">下载模板</button>
      <button @click="downloadGuide">填写须知</button>
      <button @click="exportUsers">导出用户列表</button>
      <button @click="$refs.fileInput.click()">批量导入</button>
      <input type="file" ref="fileInput" style="display: none;" accept=".xlsx,.xls" @change="handleFileUpload" />
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <label>学号/工号：<input v-model="search.uid" placeholder="请输入学号/工号" /></label>
      <label>用户名：<input v-model="search.username" placeholder="请输入用户名" /></label>
      <label>昵称：<input v-model="search.nickname" placeholder="请输入昵称" /></label>
      <div class="search-actions">
        <button @click="searchUsers">搜索</button>
        <button @click="resetSearch">重置</button>
      </div>
    </div>

    <!-- 每页显示条目数选择 -->
    <div class="pagination-controls">
      <label>每页显示：
        <select v-model="pageSize" @change="changePageSize">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <span>共 {{ filteredUsers.length }} 条记录</span>
    </div>

    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>学号/工号</th>
        <th>用户名</th>
        <th>密码</th>
        <th>昵称</th>
        <th>电话</th>
        <th>邮箱</th>
        <th>角色</th>
        <th>所属单位</th>
        <th>备注</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(user, index) in paginatedUsers" :key="user.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ user.uid }}</td>
        <td>{{ user.username }}</td>
        <td>{{ user.password }}</td>
        <td>{{ user.nickname }}</td>
        <td>{{ user.phone }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.role }}</td>
        <td>{{ user.department }}</td>
        <td>{{ user.remark }}</td>
        <td>
          <button @click="handleEdit(user)">编辑</button>
          <button @click="handleDelete(user.id)">删除</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- 分页导航 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
    </div>

    <div v-if="dialogVisible" class="modal">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
        <form @submit.prevent="submitForm">
          <label>学号/工号：<input v-model="form.uid" /></label>
          <label>用户名：<input v-model="form.username" /></label>
          <label>密码：<input v-model="form.password" /></label>
          <label>昵称：<input v-model="form.nickname" /></label>
          <label>电话：<input v-model="form.phone" /></label>
          <label>邮箱：<input v-model="form.email" /></label>
          <label>所属单位：<input v-model="form.department" /></label>
          <label>角色：
            <select v-model="form.role">
              <option value="student">学生</option>
              <option value="admin">管理员</option>
              <option value="prof">教授</option>
              <option value="assistant">助教</option>
              <option value="guide">辅导员</option>
              <option value="tutor">班主任</option>
            </select>
          </label>
          <label>备注：<input v-model="form.remark" /></label>
          <div class="modal-actions">
            <button type="submit">提交</button>
            <button type="button" @click="dialogVisible = false">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const userList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  uid: '',
  username: '',
  password: '',
  nickname: '',
  remark: '',
  phone: '',
  email: '',
  department: '',
  role: ''
})
// 搜索条件
const search = ref({
  uid: '',
  username: '',
  nickname: ''
})
// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value))

// 计算属性：根据搜索条件过滤用户列表
const filteredUsers = computed(() => {
  return userList.value.filter(user => {
    const uidMatch = search.value.uid
        ? user.uid.toString().toLowerCase().includes(search.value.uid.toLowerCase())
        : true
    const usernameMatch = search.value.username
        ? user.username.toLowerCase().includes(search.value.username.toLowerCase())
        : true
    const nicknameMatch = search.value.nickname
        ? user.nickname.toLowerCase().includes(search.value.nickname.toLowerCase())
        : true
    return uidMatch && usernameMatch && nicknameMatch
  })
})

// 计算属性：分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredUsers.value.length)
  return filteredUsers.value.slice(start, end)
})

const fetchUsers = async () => {
  try {
    const res = await axios.get('/edu/admin/users/list')
    if (res.data.code === 200) {
      userList.value = res.data.rows
      // 重置到第一页
      currentPage.value = 1
    } else {
      alert('获取用户列表失败：' + res.data.message)
    }
  } catch (error) {
    alert('获取用户列表失败：' + error.message)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form.value, {
    id: null, uid: '', username: '', password: '', nickname: '',
    remark: '', phone: '', email: '', department: '', role: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form.value, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    if (isEdit.value) {
      await axios.put('/edu/admin/users', form.value)
    } else {
      await axios.post('/edu/admin/users', form.value)
    }
    dialogVisible.value = false
    await fetchUsers()
    alert('操作成功')
  } catch (error) {
    alert('操作失败：' + error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await axios.delete(`/edu/admin/users/${id}`)
    await fetchUsers()
    alert('删除成功')
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}

const exportUsers = async () => {
  try {
    const res = await axios.post('/edu/admin/users/export', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '用户列表.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('导出失败：' + error.message)
  }
}

const downloadTemplate = async () => {
  try {
    const res = await axios.post('/edu/admin/users/importTemplate', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '用户信息导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载模板失败：' + error.message)
  }
}

const downloadGuide = async () => {
  try {
    const res = await axios.get('/edu/admin/users/import/guideTxt', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '用户信息填写须知.txt'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载填写须知失败：' + error.message)
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
  if (!validTypes.includes(file.type)) {
    alert('请上传有效的 Excel 文件（.xlsx 或 .xls）')
    event.target.value = ''
    return
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    alert('文件大小超过 10MB，请选择更小的文件')
    event.target.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', 'true')

  try {
    const res = await axios.post('/edu/admin/users/importData', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.code === 200) {
      alert('批量导入成功')
      await fetchUsers()
    } else {
      alert('导入失败：' + res.data.message)
    }
  } catch (error) {
    alert('导入失败：' + error.message)
  } finally {
    event.target.value = ''
  }
}

const searchUsers = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}

const resetSearch = () => {
  search.value.uid = ''
  search.value.username = ''
  search.value.nickname = ''
  currentPage.value = 1 // 重置搜索时回到第一页
}

const changePageSize = () => {
  currentPage.value = 1 // 更改每页条目数时重置到第一页
  // 确保 pageSize 是数字类型
  pageSize.value = Number(pageSize.value)
}

const goToBook = () => router.push('/BookInfo')
const goToClass = () => router.push('/ClassInfo')

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
  font-family: "Segoe UI", Roboto, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.nav-buttons button {
  margin-left: 10px;
  background-color: #409eff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.nav-buttons button:hover {
  background-color: #66b1ff;
}

.action-buttons {
  margin-bottom: 16px;
}

.action-buttons button {
  margin-right: 10px;
  background-color: #67c23a;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.action-buttons button:hover {
  background-color: #85ce61;
}

/* 搜索表单样式 */
.search-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-form label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #666;
}

.search-form input {
  margin-top: 4px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  width: 180px;
}

.search-form input:focus {
  border-color: #409eff;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.search-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.search-actions button:first-child {
  background-color: #409eff;
  color: white;
}

.search-actions button:first-child:hover {
  background-color: #66b1ff;
}

.search-actions button:last-child {
  background-color: #909399;
  color: white;
}

.search-actions button:last-child:hover {
  background-color: #a6a9ad;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

thead {
  background-color: #f2f6fc;
}

th, td {
  border: 1px solid #ebeef5;
  padding: 12px;
  text-align: center;
  font-size: 14px;
}

tbody tr:nth-child(even) {
  background-color: #f9fafc;
}

tbody tr:hover {
  background-color: #ecf5ff;
}

/* 分页控件样式 */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px;
}

.pagination-controls select {
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}

.pagination-controls select:focus {
  border-color: #409eff;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.pagination button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background-color: #409eff;
  color: white;
}

.pagination button:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #ffffff;
  width: 520px;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
  text-align: center;
}

.modal-content form label {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.modal-content input, .modal-content select {
  margin-top: 4px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.modal-content input:focus, .modal-content select:focus {
  border-color: #409eff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.modal-actions button[type="submit"] {
  background-color: #409eff;
  color: white;
}

.modal-actions button[type="submit"]:hover {
  background-color: #66b1ff;
}

.modal-actions button[type="button"] {
  background-color: #909399;
  color: white;
}

.modal-actions button[type="button"]:hover {
  background-color: #a6a9ad;
}
</style>