<template>
  <div class="dashboard">
    <header class="header">
      <h2>你好，{{ nickname }}教授</h2>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('StudentManage')">学生管理</button>
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
  background-color: #f7f9fc;
  padding: 16px;
  font-family: 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header h2 {
  font-size: 22px;
  color: #2d3748;
  font-weight: 600;
  margin: 0;
}

.nav-buttons {
  display: flex;
  gap: 8px;
}

.nav-btn {
  background-color: #3b82f6; /* 更鲜艳的蓝色 */
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.nav-btn:hover {
  background-color: #2563eb; /* 更深的鲜艳蓝色 */
  transform: translateY(-1px);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 6px;
  flex-wrap: nowrap; /* 确保不换行 */
}

.filter-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  white-space: nowrap;
}

.filter-bar select {
  width: 120px; /* 缩短下拉框宽度 */
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.filter-bar select:focus {
  border-color: #3b82f6; /* 与导航按钮一致的蓝色 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.course-list {
  display: grid;
  gap: 12px;
}

.course-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf2f7;
}

.course-basic {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 14px;
  color: #2d3748;
}

.course-basic h3 {
  font-size: 18px; /* 增大标题字体 */
  color: #1a202c; /* 更深的颜色 */
  margin: 0;
  flex: 1 1 100%;
  font-weight: 700;
  background: linear-gradient(to right, #e6fffa, #ffffff); /* 背景渐变 */
  padding: 6px 8px;
  border-radius: 4px;
}

.course-basic p {
  margin: 0;
  flex: 0 1 auto;
  padding: 4px 8px;
  background: #e6fffa; /* 更亮的背景色 */
  border-radius: 4px;
  font-weight: 500;
}

.add-btn {
  background-color: #22c55e; /* 更鲜艳的绿色 */
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.add-btn:hover {
  background-color: #16a34a; /* 更深的鲜艳绿色 */
  transform: translateY(-1px);
}

.assistant-list {
  margin-top: 8px;
  display: grid;
  gap: 8px;
}

.assistant-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 按钮移到右侧 */
  background-color: #f7fafc;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: background-color 0.3s ease;
}

.assistant-item:hover {
  background-color: #edf2f7;
}

.assistant-info {
  display: flex;
  gap: 12px; /* 助教信息横向展示 */
  align-items: center;
}

.assistant-name {
  font-weight: 500;
  color: #2d3748;
  font-size: 14px;
}

.assistant-id,
.assistant-password {
  color: #718096;
  font-size: 13px;
}

.assistant-actions {
  display: flex;
  gap: 6px;
}

.edit-btn {
  background-color: #f59e0b; /* 更鲜艳的橙色 */
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background-color: #d97706; /* 更深的鲜艳橙色 */
}

.delete-btn {
  background-color: #ef4444; /* 更鲜艳的红色 */
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #dc2626; /* 更深的鲜艳红色 */
}

.no-assistant {
  font-size: 13px;
  color: #718096;
  text-align: center;
  padding: 8px;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  width: 480px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 20px;
  transform: scale(0.8);
  animation: scaleIn 0.3s ease forwards;
}

.modal-container h3 {
  text-align: center;
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  font-size: 13px;
  color: #4a5568;
  margin-bottom: 4px;
  display: block;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus {
  border-color: #3b82f6; /* 与导航按钮一致的蓝色 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.submit-btn {
  background-color: #3b82f6; /* 更鲜艳的蓝色 */
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #2563eb; /* 更深的鲜艳蓝色 */
  transform: translateY(-1px);
}

.cancel-btn {
  background-color: #6b7280; /* 更鲜艳的灰色 */
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.cancel-btn:hover {
  background-color: #4b5563; /* 更深的灰色 */
  transform: translateY(-1px);
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .course-basic {
    flex-direction: column;
  }

  .assistant-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .modal-container {
    width: 90%;
  }

  .filter-bar {
    flex-direction: row;
    gap: 6px;
  }

  .filter-bar select {
    width: 100px;
  }
}
</style>