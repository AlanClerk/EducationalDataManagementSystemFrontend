<template>
  <div class="grade-manage">
    <header>
      <h1>欢迎您，助教 {{ assistantName }}</h1>
    </header>

    <div class="action-buttons">
      <button @click="handleAdd" :disabled="isLoading">新增成绩</button>
      <button @click="downloadTemplate" :disabled="isLoading || !selectedCourseId || !selectedSemester || !weight">下载模板</button>
      <button @click="downloadGuide" :disabled="isLoading">填写须知</button>
      <button @click="exportGrades" :disabled="isLoading || !selectedCourseId || !selectedSemester">导出成绩列表</button>
      <button @click="$refs.fileInput.click()" :disabled="isLoading">批量导入</button>
      <input type="file" ref="fileInput" style="display: none;" accept=".xlsx,.xls" @change="handleFileUpload" />
    </div>

    <div class="filter-bar">
      <div class="filter-left">
        <label>开课学期：
          <select v-model="selectedSemester" @change="onSemesterChange" :disabled="isLoading">
            <option value="">请选择学期</option>
            <option v-for="sem in semesters" :key="sem" :value="sem">{{ sem }}</option>
          </select>
        </label>
        <label>课程号：
          <select v-model="selectedCourseId" @change="onCourseIdChange" :disabled="!selectedSemester || isLoading">
            <option value="">请选择课程号</option>
            <option v-for="course in filteredCourseIds" :key="course.courseId" :value="course.courseId">
              {{ course.courseId }}
            </option>
          </select>
        </label>
        <label>考试分权重：
          <input v-model="weight" type="number" step="0.01" min="0" max="1" :disabled="isLoading" />
        </label>
        <button class="reset-btn" @click="resetFilters" :disabled="isLoading">重置</button>
      </div>
      <div class="filter-right">
        <label>每页显示：
          <select v-model="pageSize" @change="changePageSize" :disabled="isLoading">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <span>共 {{ filteredGrades.length }} 条记录</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="!filteredGrades.length" class="no-data">暂无成绩数据，请确认所选学期和课程号是否有对应记录</div>
    <table v-else>
      <thead>
      <tr>
        <th>序号</th>
        <th>学号</th>
        <th>学生姓名</th>
        <th>课程 ID/选课 ID</th>
        <th>课程名称</th>
        <th>班级</th>
        <th>开课学期</th>
        <th>平时分</th>
        <th>考试分</th>
        <th>考试分权重</th>
        <th>总分</th>
        <th>成绩状态</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(grade, index) in paginatedGrades" :key="grade.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ grade.studentId }}</td>
        <td>{{ grade.studentName }}</td>
        <td>{{ grade.courseId }}</td>
        <td>{{ grade.courseName || '未知课程' }}</td>
        <td>{{ grade.className }}</td>
        <td>{{ grade.semester }}</td>
        <td>{{ grade.regularScore }}</td>
        <td>{{ grade.examScore }}</td>
        <td>{{ grade.weight }}</td>
        <td>{{ grade.totalScore }}</td>
        <td>{{ grade.gradeStatus ? '已录入' : '未录入' }}</td>
        <td>
          <button @click="handleEdit(grade)" :disabled="isLoading">编辑</button>
          <button @click="handleDelete(grade.id)" :disabled="isLoading">删除</button>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="filteredGrades.length">
      <button :disabled="currentPage === 1 || isLoading" @click="currentPage--">-</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages || isLoading" @click="currentPage++">+</button>
    </div>

    <div v-if="dialogVisible" class="modal">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑成绩' : '新增成绩' }}</h3>
        <form @submit.prevent="submitForm">
          <label>学号：<input v-model="form.studentId" required :disabled="isLoading" /></label>
          <label>学生姓名：<input v-model="form.studentName" required :disabled="isLoading" /></label>
          <label>开课学期：
            <select v-model="form.semester" @change="onFormSemesterChange" required :disabled="isLoading">
              <option value="">请选择学期</option>
              <option v-for="sem in semesters" :key="sem" :value="sem">{{ sem }}</option>
            </select>
          </label>
          <label>课程号：
            <select v-model="form.courseId" :disabled="!form.semester || isLoading" required>
              <option value="">请选择课程号</option>
              <option v-for="course in filteredFormCourseIds" :key="course.courseId" :value="course.courseId">
                {{ course.courseId }}
              </option>
            </select>
          </label>
          <label>班级：<input v-model="form.className" readonly :disabled="isLoading" /></label>
          <label>平时分：<input v-model="form.regularScore" type="number" step="0.01" required :disabled="isLoading" /></label>
          <label>考试分：<input v-model="form.examScore" type="number" step="0.01" required :disabled="isLoading" /></label>
          <label>考试分权重：<input v-model="form.weight" type="number" step="0.01" min="0" max="1" required :disabled="isLoading" /></label>
          <div class="modal-actions">
            <button type="submit" :disabled="isLoading">提交</button>
            <button type="button" @click="dialogVisible = false" :disabled="isLoading">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/authorization/request'

const router = useRouter()
const grades = ref([])
const courses = ref([])
const selectedSemester = ref('')
const selectedCourseId = ref('')
const weight = ref(0.5)
const dialogVisible = ref(false)
const isEdit = ref(false)
const isLoading = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)
const assistantName = ref('') // 助教名称

const form = ref({
  id: null,
  studentId: '',
  studentName: '',
  courseId: '',
  semester: '',
  className: '',
  regularScore: '',
  examScore: '',
  weight: ''
})

const semesters = computed(() => [...new Set(courses.value.map(c => c.semester))].sort((a, b) => b.localeCompare(a)))

const filteredCourseIds = computed(() => {
  if (!selectedSemester.value) return []
  return courses.value.filter(c => c.semester === selectedSemester.value).map(c => ({
    courseId: String(c.courseId),
  }))
})

const filteredFormCourseIds = computed(() => {
  if (!form.value.semester) return []
  return courses.value.filter(c => c.semester === form.value.semester).map(c => ({
    courseId: String(c.courseId),
  }))
})

const filteredGrades = computed(() => {
  return grades.value.filter(grade =>
      (!selectedSemester.value || grade.semester === selectedSemester.value) &&
      (!selectedCourseId.value || grade.courseId === selectedCourseId.value)
  )
})

const paginatedGrades = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredGrades.value.length)
  return filteredGrades.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredGrades.value.length / pageSize.value))

const fetchCourses = async () => {
  isLoading.value = true
  try {
    const assistantId = sessionStorage.getItem('uid')
    if (!assistantId) {
      alert('未找到用户ID，请重新登录')
      router.push('/login') // 假设有登录页面
      return
    }
    const res = await request.get('/edu/classAssistant/list', {
      params: {
        assistantId: assistantId // 使用 assistantId 作为参数名
      }
    })
    if (res.data.code === 200) {
      courses.value = res.data.rows.map(course => ({
        courseId: String(course.courseId),
        semester: course.semester,
        assistantName: course.assistantName,
        className: course.className // 确保className被正确映射
      }))
      // 设置助教名称（假设所有记录的assistantName一致，取第一个）
      if (courses.value.length > 0) {
        assistantName.value = courses.value[0].assistantName || '未知'
      }
      console.log('Courses fetched:', courses.value)
    } else {
      alert(`获取课程列表失败：${res.data.msg}`)
    }
  } catch (error) {
    alert(`获取课程列表失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const fetchGrades = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (selectedSemester.value) params.semester = selectedSemester.value
    if (selectedCourseId.value) params.courseId = selectedCourseId.value
    console.log('Fetch Grades Params:', params)
    const res = await request.get('/edu/grade/list', { params })
    console.log('Grades API Response:', res.data)
    if (res.data.code === 200) {
      grades.value = res.data.rows.map(grade => ({
        ...grade,
        courseId: String(grade.courseId),
        courseName: grade.courseName || grade.courseId
      }))
      console.log('Updated grades.value:', grades.value)
    } else {
      alert(`获取成绩列表失败：${res.data.msg}`)
    }
  } catch (error) {
    alert(`获取成绩列表失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  selectedSemester.value = ''
  selectedCourseId.value = ''
  weight.value = 0.5
  fetchGrades()
}

const onSemesterChange = () => {
  selectedCourseId.value = ''
  fetchGrades()
}

const onCourseIdChange = () => {
  console.log('Selected Course ID:', selectedCourseId.value, typeof selectedCourseId.value)
  console.log('Grades Course IDs:', grades.value.map(g => ({ courseId: g.courseId, type: typeof g.courseId })))
  fetchGrades()
}

const onFormSemesterChange = () => {
  form.value.courseId = ''
  form.value.className = ''
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    studentId: '',
    studentName: '',
    courseId: '',
    semester: '',
    className: '',
    regularScore: '',
    examScore: '',
    weight: ''
  }
  dialogVisible.value = true
}

const handleEdit = (grade) => {
  isEdit.value = true
  form.value = { ...grade }
  dialogVisible.value = true
}

const submitForm = async () => {
  isLoading.value = true
  try {
    const payload = {
      studentId: form.value.studentId,
      studentName: form.value.studentName,
      courseId: form.value.courseId,
      className: form.value.className,
      semester: form.value.semester,
      regularScore: form.value.regularScore,
      examScore: form.value.examScore,
      weight: form.value.weight
    }
    if (isEdit.value) {
      await request.put('/edu/grade', { ...payload, id: form.value.id })
    } else {
      await request.post('/edu/grade', payload)
    }
    dialogVisible.value = false
    await fetchGrades()
    alert('操作成功')
  } catch (error) {
    alert(`操作失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (id) => {
  isLoading.value = true
  try {
    await request.delete(`/edu/grade/${id}`)
    await fetchGrades()
    alert('删除成功')
  } catch (error) {
    alert(`删除失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const downloadTemplate = async () => {
  if (!selectedCourseId.value || !selectedSemester.value || !weight.value) {
    alert('请先选择学期、课程号和考试分权重')
    return
  }
  isLoading.value = true
  try {
    const res = await request.post('/edu/grade/importTemplate', {
      courseId: selectedCourseId.value,
      semester: selectedSemester.value,
      weight: weight.value
    }, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '成绩导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert(`下载模板失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const downloadGuide = async () => {
  isLoading.value = true
  try {
    const res = await request.get('/edu/grade/import/studentGradeGuideTxt', {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '成绩填写须知.txt'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert(`下载填写须知失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const exportGrades = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) {
    alert('请先选择学期和课程号')
    return
  }
  isLoading.value = true
  try {
    const res = await request.post('/edu/grade/export', {
      courseId: selectedCourseId.value,
      semester: selectedSemester.value
    }, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '成绩列表.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert(`导出失败：${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isLoading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await request.post('/edu/grade/importData', formData)
    if (res.data.code === 200) {
      alert('批量导入成功')
      await fetchGrades()
    } else {
      alert(`导入失败：${res.data.msg}`)
    }
  } catch (error) {
    alert(`导入失败：${error.message}`)
  } finally {
    event.target.value = ''
    isLoading.value = false
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
  await fetchCourses()
  await fetchGrades()
})

watch([form.value.semester, form.value.courseId], () => {
  if (form.value.semester && form.value.courseId) {
    const course = courses.value.find(c => c.semester === form.value.semester && c.courseId === form.value.courseId)
    if (course) {
      form.value.className = course.className || ''
    }
  }
})
</script>

<style scoped>
.grade-manage {
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

.action-buttons button:hover:not(:disabled) {
  background-color: #85ce61;
}

.action-buttons button:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
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

.filter-bar select:disabled,
.filter-bar input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.reset-btn:hover:not(:disabled) {
  background-color: #a6a9ad;
}

.reset-btn:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
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

td button {
  margin: 0 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

td button:first-child {
  background-color: #67c23a;
}

td button:first-child:hover:not(:disabled) {
  background-color: #85ce61;
}

td button:last-child {
  background-color: #52a01e;
}

td button:last-child:hover:not(:disabled) {
  background-color: #6bb83a;
}

td button:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
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

.modal-content input:disabled,
.modal-content select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.modal-actions button[type="submit"]:hover:not(:disabled) {
  background-color: #2563eb;
}

.modal-actions button[type="button"] {
  background-color: #909399;
  color: white;
}

.modal-actions button[type="button"]:hover:not(:disabled) {
  background-color: #a6a9ad;
}

.modal-actions button:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #999;
}
</style>