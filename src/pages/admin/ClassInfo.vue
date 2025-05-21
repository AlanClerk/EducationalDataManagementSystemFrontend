<template>
  <div class="class-info">
    <header>
      <h1>课程管理</h1>
      <div class="nav-buttons">
        <button @click="goToAdmin">用户管理</button>
        <button @click="goToBook">图书管理</button>
      </div>
    </header>

    <div class="action-buttons">
      <button @click="handleAdd">新增课程</button>
      <button @click="downloadTemplate">下载模板</button>
      <button @click="downloadGuide">填写须知</button>
      <button @click="exportClasses">导出课程列表</button>
      <button @click="$refs.fileInput.click()">批量导入</button>
      <input type="file" ref="fileInput" style="display: none;" accept=".xlsx,.xls" @change="handleFileUpload" />
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <label>课程ID：<input v-model="search.classId" placeholder="请输入课程ID" /></label>
      <label>课程名称：<input v-model="search.className" placeholder="请输入课程名称" /></label>
      <label>开课学院：<input v-model="search.academy" placeholder="请输入开课学院" /></label>
      <label>开课学期：<input v-model="search.semester" placeholder="请输入开课学期" /></label>
      <label>教师姓名：<input v-model="search.teacherName" placeholder="请输入教师姓名" /></label>
      <div class="search-actions">
        <button @click="searchClasses">搜索</button>
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
      <span>共 {{ filteredClasses.length }} 条记录</span>
    </div>

    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>课程ID</th>
        <th>课程名称</th>
        <th>开课学院</th>
        <th>上课时间</th>
        <th>上课地点</th>
        <th>教师姓名</th>
        <th>考核方式</th>
        <th>学期</th>
        <th>课程类型</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(classItem, index) in paginatedClasses" :key="classItem.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ classItem.classId }}</td>
        <td>{{ classItem.className }}</td>
        <td>{{ classItem.academy }}</td>
        <td>{{ classItem.classTime }}</td>
        <td>{{ classItem.classLocation }}</td>
        <td>{{ classItem.teacherName }}</td>
        <td>{{ classItem.assessmentType === 0 ? '考试' : '考查' }}</td>
        <td>{{ classItem.semester }}</td>
        <td>{{ classItem.classType }}</td>
        <td>
          <button @click="handleEdit(classItem)">编辑</button>
          <button @click="handleDelete(classItem.id)">删除</button>
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
        <h3>{{ isEdit ? '编辑课程' : '新增课程' }}</h3>
        <form @submit.prevent="submitForm">
          <label>课程ID：<input v-model="form.classId" required /></label>
          <label>课程名称：<input v-model="form.className" required /></label>
          <label>开课学院：<input v-model="form.academy" required /></label>
          <label>上课时间：<input v-model="form.classTime" required /></label>
          <label>上课地点：<input v-model="form.classLocation" required /></label>
          <label>教师ID：<input v-model="form.teacherId" required /></label>
          <label>教师姓名：<input v-model="form.teacherName" required /></label>
          <label>考核方式：
            <select v-model="form.assessmentType" required>
              <option :value="0">考试</option>
              <option :value="1">考查</option>
            </select>
          </label>
          <label>学期：<input v-model="form.semester" required /></label>
          <label>课程描述：<input v-model="form.description" /></label>
          <label>课程类型：
            <select v-model="form.classType" required>
              <option value="必修">必修</option>
              <option value="选修">选修</option>
              <option value="实验课">实验课</option>
            </select>
          </label>
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
const classList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: 0,
  classId: '',
  className: '',
  academy: '',
  classTime: '',
  classLocation: '',
  teacherId: '',
  teacherName: '',
  assessmentType: 0,
  semester: '',
  description: '',
  classType: '必修'
})

const search = ref({
  classId: '',
  className: '',
  academy: '',
  semester: '',
  teacherName: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.ceil(filteredClasses.value.length / pageSize.value))

const filteredClasses = computed(() => {
  return classList.value.filter(classItem => {
    const classIdMatch = search.value.classId
        ? classItem.classId.toLowerCase().includes(search.value.classId.toLowerCase())
        : true
    const classNameMatch = search.value.className
        ? classItem.className.toLowerCase().includes(search.value.className.toLowerCase())
        : true
    const academyMatch = search.value.academy
        ? classItem.academy.toLowerCase().includes(search.value.academy.toLowerCase())
        : true
    const semesterMatch = search.value.semester
        ? classItem.semester.toLowerCase().includes(search.value.semester.toLowerCase())
        : true
    const teacherNameMatch = search.value.teacherName
        ? classItem.teacherName.toLowerCase().includes(search.value.teacherName.toLowerCase())
        : true
    return classIdMatch && classNameMatch && academyMatch && semesterMatch && teacherNameMatch
  })
})

// 计算属性：分页后的课程列表
const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredClasses.value.length)
  return filteredClasses.value.slice(start, end)
})

const fetchClasses = async () => {
  try {
    const res = await axios.get('/edu/admin/class/list')
    if (res.data.code === 200) {
      classList.value = res.data.rows
      currentPage.value = 1 // 重置到第一页
    } else {
      alert('获取课程列表失败：' + res.data.msg)
    }
  } catch (error) {
    alert('获取课程列表失败：' + error.message)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form.value, {
    id: 0,
    classId: '',
    className: '',
    academy: '',
    classTime: '',
    classLocation: '',
    teacherId: '',
    teacherName: '',
    assessmentType: 0,
    semester: '',
    description: '',
    classType: '必修'
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
      await axios.put('/edu/admin/class', form.value)
    } else {
      await axios.post('/edu/admin/class', form.value)
    }
    dialogVisible.value = false
    await fetchClasses()
    alert('操作成功')
  } catch (error) {
    alert('操作失败：' + error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await axios.delete(`/edu/admin/class/${id}`)
    await fetchClasses()
    alert('删除成功')
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}

const exportClasses = async () => {
  try {
    const res = await axios.post('/edu/admin/class/export', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '课程列表.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('导出失败：' + error.message)
  }
}

const downloadTemplate = async () => {
  try {
    const res = await axios.post('/edu/admin/class/importTemplate', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '课程信息导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载模板失败：' + error.message)
  }
}

const downloadGuide = async () => {
  try {
    const res = await axios.get('/edu/admin/class/import/courseGuideTxt', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '课程信息填写须知.txt'
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

  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    alert('文件大小超过 100MB，请选择更小的文件')
    event.target.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await axios.post('/edu/admin/class/importData', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.code === 200) {
      alert('批量导入成功')
      await fetchClasses()
    } else {
      alert('导入失败：' + res.data.msg)
    }
  } catch (error) {
    alert('导入失败：' + error.message)
  } finally {
    event.target.value = ''
  }
}

const searchClasses = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}

const resetSearch = () => {
  search.value.classId = ''
  search.value.className = ''
  search.value.academy = ''
  search.value.semester = ''
  search.value.teacherName = ''
  currentPage.value = 1 // 重置搜索时回到第一页
}

const changePageSize = () => {
  currentPage.value = 1 // 更改每页条目数时重置到第一页
  pageSize.value = Number(pageSize.value) // 确保 pageSize 是数字类型
}

const goToAdmin = () => router.push('/AdminDashboard')
const goToBook = () => router.push('/BookInfo')

onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.class-info {
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

.modal-content input,
.modal-content select {
  margin-top: 4px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.modal-content input:focus,
.modal-content select:focus {
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