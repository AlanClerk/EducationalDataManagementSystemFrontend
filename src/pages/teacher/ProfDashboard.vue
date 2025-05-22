<template>
  <div class="dashboard">
    <header class="header">
      <h2>你好，{{ nickname }}教授</h2>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('StudentManaging')">学生管理</button>
        <button class="nav-btn" @click="goTo('GradeManage')">成绩管理</button>
        <button class="nav-btn" @click="goTo('BookBorrow')">书籍借阅</button>
        <button class="nav-btn" @click="goTo('FeedBack')">学生反馈</button>
      </div>
    </header>

    <div class="filter-bar">
      <label class="filter-label">筛选学期：</label>
      <select v-model="selectedSemester">
        <option value="">全部</option>
        <option v-for="sem in allSemesters" :key="sem" :value="sem">{{ sem }}</option>
      </select>
    </div>

    <div class="course-list">
      <div
          v-for="course in filteredCourses"
          :key="course.classId"
          class="course-card"
      >
        <div class="course-header">
          <div class="course-basic">
            <h3>{{ course.className }}</h3>
            <p>课程号: {{ course.classId }}</p>
            <p>学期: {{ course.semester }}</p>
            <p>学院: {{ course.academy }}</p>
            <p>上课时间: {{ course.classTime }}</p>
            <p>上课地点: {{ course.classLocation }}</p>
            <p>考核方式: {{ course.assessmentType === 0 ? '考试' : '考查' }}</p>
            <p>课程类型: {{ course.classType }}</p>
            <p>备注: {{ course.description }}</p>
          </div>
          <button class="add-btn" @click="openAddAssistantModal(course)">添加助教</button>
        </div>
        <div class="assistant-list">
          <div
              v-for="assistant in course.assistants"
              :key="assistant.assistantId"
              class="assistant-item"
          >
            <div class="assistant-info">
              <span class="assistant-name">{{ assistant.assistantName }}</span>
              <span class="assistant-id">工号: {{ assistant.assistantId }}</span>
              <span class="assistant-password">密码: {{ assistant.assistantPassword }}</span>
            </div>
            <div class="assistant-actions">
              <button class="edit-btn" @click="openEditAssistantModal(assistant, course)">编辑</button>
              <button class="delete-btn" @click="deleteAssistant(assistant, course)">删除</button>
            </div>
          </div>
          <div v-if="course.assistants.length === 0" class="no-assistant">暂无助教</div>
        </div>
      </div>
    </div>

    <!-- 弹出添加/编辑助教模态框 -->
    <div class="modal-mask" v-if="showModal">
      <div class="modal-container">
        <h3>{{ isEditMode ? '编辑助教' : '添加助教' }}</h3>
        <div class="form-group">
          <label>助教工号</label>
          <input v-model="newAssistant.assistantId" type="text" />
        </div>
        <div class="form-group">
          <label>助教账号</label>
          <input v-model="newAssistant.assistantName" type="text" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="newAssistant.assistantPassword" type="text" />
        </div>
        <div class="modal-actions">
          <button class="submit-btn" @click="isEditMode ? editAssistant() : submitAssistant()">提交</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/authorization/request';

const nickname = ref(sessionStorage.getItem('nickname') || '未知')
const router = useRouter()
const courses = ref([])
const selectedSemester = ref('')
const showModal = ref(false)
const isEditMode = ref(false)
const currentCourse = ref(null)
const newAssistant = ref({
  id: '',
  assistantId: '',
  assistantName: '',
  assistantPassword: '',
  courseId: '',
  semester: ''
})

const allSemesters = computed(() => [...new Set(courses.value.map((c) => c.semester))])
const filteredCourses = computed(() => {
  return selectedSemester.value
      ? courses.value.filter((c) => c.semester === selectedSemester.value)
      : courses.value
})

// 获取课程列表
const fetchCourses = async () => {
  try {
    const uid = sessionStorage.getItem('uid')
    const response = await request.get('/edu/prof/queryCourses', { params: { uid } })
    if (response.data.code === 200) {
      courses.value = response.data.rows.map(course => ({
        ...course,
        assistants: []
      }))
      await fetchAssistantsForCourses()
    }
  } catch (error) {
    console.error('获取课程失败:', error)
  }
}

// 获取所有课程的助教信息
const fetchAssistantsForCourses = async () => {
  for (const course of courses.value) {
    await fetchAssistants(course)
  }
}

// 获取单个课程的助教
const fetchAssistants = async (course) => {
  try {
    const response = await request.post('/edu/prof/queryAssistant', {
      courseId: course.classId,
      semester: course.semester
    })
    if (response.data.code === 200) {
      course.assistants = response.data.rows
    }
  } catch (error) {
    console.error(`获取课程${course.classId}助教失败:`, error)
  }
}

// 添加助教
const submitAssistant = async () => {
  try {
    const response = await request.post('/edu/prof/addAssistant', {
      assistantId: newAssistant.value.assistantId,
      assistantName: newAssistant.value.assistantName,
      assistantPassword: newAssistant.value.assistantPassword,
      courseId: newAssistant.value.courseId,
      semester: newAssistant.value.semester
    })
    if (response.data.code === 200) {
      await fetchAssistants(currentCourse.value)
      closeModal()
    }
  } catch (error) {
    console.error('添加助教失败:', error)
  }
}

// 编辑助教
const editAssistant = async () => {
  try {
    const response = await request.put('/edu/prof/editAssistant', {
      id: newAssistant.value.id,
      assistantId: newAssistant.value.assistantId,
      assistantName: newAssistant.value.assistantName,
      assistantPassword: newAssistant.value.assistantPassword,
      courseId: newAssistant.value.courseId,
      semester: newAssistant.value.semester
    })
    if (response.data.code === 200) {
      await fetchAssistants(currentCourse.value)
      closeModal()
    }
  } catch (error) {
    console.error('编辑助教失败:', error)
  }
}

// 删除助教
const deleteAssistant = async (assistant, course) => {
  try {
    const response = await request.post('/edu/prof/deleteAssistant', {
      id: assistant.id,
      assistantId: assistant.assistantId,
      assistantName: assistant.assistantName,
      assistantPassword: assistant.assistantPassword,
      courseId: course.classId,
      semester: course.semester
    })
    if (response.data.code === 200) {
      await fetchAssistants(course)
    }
  } catch (error) {
    console.error('删除助教失败:', error)
  }
}

const openAddAssistantModal = (course) => {
  isEditMode.value = false
  currentCourse.value = course
  newAssistant.value = {
    assistantId: '',
    assistantName: '',
    assistantPassword: '',
    courseId: course.classId,
    semester: course.semester
  }
  showModal.value = true
}

const openEditAssistantModal = (assistant, course) => {
  isEditMode.value = true
  currentCourse.value = course
  newAssistant.value = {
    id: assistant.id,
    assistantId: assistant.assistantId,
    assistantName: assistant.assistantName,
    assistantPassword: assistant.assistantPassword,
    courseId: course.classId,
    semester: course.semester
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  isEditMode.value = false
}

const goTo = (routeName) => {
  router.push({name: routeName})
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.dashboard {
  background-color: #f5f7fa;
  padding: 20px;
  font-family: "Segoe UI", Roboto, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.nav-btn {
  background-color: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.nav-btn:hover {
  background-color: #66b1ff;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.filter-label {
  width: 100px;
  white-space: nowrap;
}

.filter-bar select {
  width: 150px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: 0.3s;
}

.filter-bar select:focus {
  outline: none;
  border-color: #409eff;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-card {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-basic h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.course-basic p {
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.add-btn {
  background-color: #67c23a;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.add-btn:hover {
  background-color: #85ce61;
}

.assistant-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.assistant-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  background-color: #f8fafc;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.assistant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assistant-name {
  font-weight: 500;
  color: #333;
}

.assistant-id, .assistant-password {
  color: #666;
}

.assistant-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background-color: #e6a23c;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.delete-btn {
  background-color: #f56c6c;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.no-assistant {
  font-size: 14px;
  color: #999;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  width: 520px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  padding: 24px;
}

.modal-container h3 {
  text-align: center;
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}

.form-group input {
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: 0.3s;
}

.form-group input:focus {
  border-color: #409eff;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.submit-btn {
  background-color: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.submit-btn:hover {
  background-color: #66b1ff;
}

.cancel-btn {
  background-color: #909399;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.cancel-btn:hover {
  background-color: #a6a9ad;
}
</style>