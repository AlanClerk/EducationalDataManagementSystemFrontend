<template>
  <div class="student-manage">
    <header>
      <h1>学生管理</h1>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('/ProfDashboard')">课程管理</button>
        <button class="nav-btn" @click="goTo('/gradeManage')">成绩管理</button>
        <button class="nav-btn" @click="goTo('/bookBorrow')">书籍借阅</button>
        <button class="nav-btn" @click="goTo('/feedback')">学生反馈</button>
      </div>
    </header>

    <div class="action-buttons">
      <button @click="handleAdd">新增学生</button>
      <button @click="downloadTemplate">下载模板</button>
      <button @click="downloadGuide">填写须知</button>
      <button @click="exportStudents">导出学生列表</button>
      <button @click="$refs.fileInput.click()">批量导入</button>
      <input type="file" ref="fileInput" style="display: none;" accept=".xlsx,.xls" @change="handleFileUpload" />
    </div>

    <div class="filter-bar">
      <div class="filter-left">
        <label>开课学期：
          <select v-model="selectedSemester" @change="onSemesterChange">
            <option value="">请选择学期</option>
            <option v-for="sem in allSemesters" :key="sem" :value="sem">{{ sem }}</option>
          </select>
        </label>
        <label>课程号：
          <select v-model="selectedCourseId" @change="onCourseIdChange" :disabled="!selectedSemester">
            <option value="">请选择课程号</option>
            <option v-for="courseId in filteredCourseIds" :key="courseId" :value="courseId">
              {{ courseId }}
            </option>
          </select>
        </label>
        <button class="reset-btn" @click="resetFilters">重置</button>
      </div>
      <div class="filter-right">
        <label>每页显示：
          <select v-model="pageSize" @change="changePageSize">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <span>共 {{ filteredStudents.length }} 条记录</span>
      </div>
    </div>

    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>学号</th>
        <th>学生姓名</th>
        <th>课程号</th>
        <th>开课学期</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(student, index) in paginatedStudents" :key="student.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ student.studentId }}</td>
        <td>{{ student.studentName }}</td>
        <td>{{ student.courseId }}</td>
        <td>{{ student.semester }}</td>
        <td>
          <button @click="handleEdit(student)">编辑</button>
          <button @click="handleDelete(student.id)">删除</button>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">-</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">+</button>
    </div>

    <div v-if="dialogVisible" class="modal">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑学生' : '新增学生' }}</h3>
        <form @submit.prevent="submitForm">
          <label>学号：<input v-model="form.studentId" /></label>
          <label>学生姓名：<input v-model="form.studentName" /></label>
          <label>开课学期：
            <select v-model="form.semester" @change="onFormSemesterChange">
              <option value="">请选择学期</option>
              <option v-for="sem in allSemesters" :key="sem" :value="sem">{{ sem }}</option>
            </select>
          </label>
          <label>课程号：
            <select v-model="form.courseId" :disabled="!form.semester">
              <option value="">请选择课程号</option>
              <option v-for="courseId in filteredFormCourseIds" :key="courseId" :value="courseId">
                {{ courseId }}
              </option>
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
import { useRouter } from 'vue-router'
import request from '@/authorization/request'

const router = useRouter()
const students = ref([])
const courses = ref([]) // 新增 courses 用于存储课程数据
const selectedSemester = ref('')
const selectedCourseId = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)

const form = ref({
  id: null,
  studentId: '',
  studentName: '',
  courseId: '',
  semester: ''
})

const allSemesters = computed(() => {
  return [...new Set(courses.value.map(c => c.semester))].sort((a, b) => b.localeCompare(a))
})

const filteredStudents = ref([])

const filteredCourseIds = computed(() => {
  if (!selectedSemester.value) return []
  return courses.value
      .filter(c => c.semester === selectedSemester.value)
      .map(c => c.courseId)
})

const filteredFormCourseIds = computed(() => {
  if (!form.value.semester) return []
  return courses.value
      .filter(c => c.semester === form.value.semester)
      .map(c => c.courseId)
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredStudents.value.length)
  return filteredStudents.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize.value))

// 新增 fetchCourses 函数，从 /edu/prof/queryCourses 获取课程数据
const fetchCourses = async () => {
  try {
    const uid = sessionStorage.getItem('uid')
    const res = await request.get('/edu/prof/queryCourses', { params: { uid } })
    if (res.data.code === 200) {
      courses.value = res.data.rows.map(course => ({
        ...course,
        courseId: String(course.classId), // 统一为字符串
        courseName: course.courseName || course.classId
      }))
    } else {
      alert(`获取课程列表失败：${res.data.msg}`)
    }
  } catch (error) {
    alert(`获取课程列表失败：${error.message}`)
  }
}

const fetchStudents = async () => {
  try {
    const params = {}
    if (selectedSemester.value) params.semester = selectedSemester.value
    if (selectedCourseId.value) params.courseId = selectedCourseId.value

    const res = await request.get('/edu/prof/classStudent/list', { params })
    if (res.data.code === 200) {
      students.value = res.data.rows
      filteredStudents.value = res.data.rows
    } else {
      alert('获取学生列表失败：' + res.data.msg)
    }
  } catch (error) {
    alert('获取学生列表失败：' + error.message)
  }
}

const resetFilters = () => {
  selectedSemester.value = ''
  selectedCourseId.value = ''
  fetchStudents()
}

const onSemesterChange = () => {
  selectedCourseId.value = ''
  fetchStudents()
}

const onCourseIdChange = () => {
  fetchStudents()
}

const onFormSemesterChange = () => {
  form.value.courseId = ''
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    studentId: '',
    studentName: '',
    courseId: '',
    semester: ''
  }
  dialogVisible.value = true
}

const handleEdit = (student) => {
  isEdit.value = true
  form.value = {
    id: student.id,
    studentId: student.studentId,
    studentName: student.studentName,
    courseId: student.courseId,
    semester: student.semester
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    // 校验学期和课程号组合是否有效
    const isValidCombination = courses.value.some(
        c => c.semester === form.value.semester && c.courseId === form.value.courseId
    )
    if (!isValidCombination) {
      alert('所选学期和课程号的组合无效，请重新选择')
      return
    }

    const payload = {
      studentId: form.value.studentId,
      studentName: form.value.studentName,
      courseId: form.value.courseId,
      semester: form.value.semester
    }
    if (isEdit.value) {
      await request.put('/edu/prof/classStudent', { ...payload, id: form.value.id })
    } else {
      await request.post('/edu/prof/classStudent', payload)
    }
    dialogVisible.value = false
    await fetchStudents()
    alert('操作成功')
  } catch (error) {
    alert('操作失败：' + error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/edu/prof/classStudent/${id}`)
    await fetchStudents()
    alert('删除成功')
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}

const exportStudents = async () => {
  try {
    const res = await request.post('/edu/prof/classStudent/export', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '学生列表.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('导出失败：' + error.message)
  }
}

const downloadTemplate = async () => {
  try {
    const res = await request.post('/edu/prof/classStudent/importTemplate', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '学生信息导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载模板失败：' + error.message)
  }
}

const downloadGuide = async () => {
  try {
    const res = await request.get('/edu/prof/classStudent/import/enrollmentGuideTxt', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '学生信息填写须知.txt'
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

  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    alert('文件大小超过 100MB，请选择更小的文件')
    event.target.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', 'true')

  try {
    const res = await request.post('/edu/prof/classStudent/importData', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.code === 200) {
      alert('批量导入成功')
      await fetchStudents()
    } else {
      alert('导入失败：' + res.data.msg)
    }
  } catch (error) {
    alert('导入失败：' + error.message)
  } finally {
    event.target.value = ''
  }
}

const changePageSize = () => {
  pageSize.value = Number(pageSize.value)
  currentPage.value = 1
}

const goTo = (routePath) => {
  router.push(routePath)
}

onMounted(async () => {
  await fetchCourses() // 先获取课程数据
  await fetchStudents() // 再获取学生数据
})
</script>

<style scoped>
.student-manage {
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
  background-color: #3b82f6;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.nav-buttons button:hover {
  background-color: #2563eb;
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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-left {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.filter-right {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.filter-bar label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #666;
}

.filter-bar select,
.filter-bar input {
  margin-top: 4px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  width: 180px;
}

.filter-bar select:focus,
.filter-bar input:focus {
  border-color: #3b82f6;
}

.reset-btn {
  background-color: #909399;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
  align-self: flex-end;
}

.reset-btn:hover {
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
  background-color: #3b82f6;
  color: white;
}

.pagination button:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #2563eb;
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
  border-color: #3b82f6;
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
  background-color: #3b82f6;
  color: white;
}

.modal-actions button[type="submit"]:hover {
  background-color: #2563eb;
}

.modal-actions button[type="button"] {
  background-color: #909399;
  color: white;
}

.modal-actions button[type="button"]:hover {
  background-color: #a6a9ad;
}
</style>