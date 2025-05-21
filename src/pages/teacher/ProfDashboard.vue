<template>
  <div class="dashboard">
    <header class="header">
      <h2>课程管理</h2>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('StudentManaging')">学生管理</button>
        <button class="nav-btn" @click="goTo('GradeManage')">成绩管理</button>
        <button class="nav-btn" @click="goTo('BookBorrow')">书籍借阅</button>
      </div>
    </header>

    <div class="filter-bar">
      <label>筛选学期：</label>
      <select v-model="selectedSemester">
        <option value="">全部</option>
        <option v-for="sem in allSemesters" :key="sem" :value="sem">{{ sem }}</option>
      </select>
    </div>

    <div class="course-list">
      <div
          v-for="course in filteredCourses"
          :key="course.courseId"
          class="course-card"
      >
        <div class="course-header">
          <div class="course-basic">
            <h3>{{ course.courseName }}</h3>
            <p>{{ course.semester }}</p>
          </div>
          <button class="add-btn" @click="openAddAssistantModal(course)">添加助教</button>
        </div>
        <div class="assistant-list">
          <div
              v-for="assistant in course.assistants"
              :key="assistant.assistantId"
              class="assistant-item"
          >
            {{ assistant.assistantName }}（{{ assistant.assistantId }}）
          </div>
          <div v-if="course.assistants.length === 0" class="no-assistant">暂无助教</div>
        </div>
      </div>
    </div>

    <!-- 弹出添加助教模态 -->
    <div class="modal-mask" v-if="showModal">
      <div class="modal-container">
        <h3>添加助教</h3>
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
          <input v-model="newAssistant.assistantPassword" type="password" />
        </div>
        <div class="modal-actions">
          <button class="submit-btn" @click="submitAssistant">提交</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 示例数据
const courses = ref([
  {
    courseId: 1,
    courseName: '计算机基础',
    semester: '2024秋',
    assistants: [
      { assistantId: 1001, assistantName: '张三' }
    ]
  },
  {
    courseId: 2,
    courseName: '数据结构',
    semester: '2024秋',
    assistants: []
  }
])

const selectedSemester = ref('')
const allSemesters = computed(() =>
    [...new Set(courses.value.map((c) => c.semester))]
)
const filteredCourses = computed(() => {
  return selectedSemester.value
      ? courses.value.filter((c) => c.semester === selectedSemester.value)
      : courses.value
})

const showModal = ref(false)
const currentCourse = ref(null)
const newAssistant = ref({
  assistantId: '',
  assistantName: '',
  assistantPassword: '',
  courseId: '',
  semester: ''
})

const openAddAssistantModal = (course) => {
  currentCourse.value = course
  newAssistant.value = {
    assistantId: '',
    assistantName: '',
    assistantPassword: '',
    courseId: course.courseId,
    semester: course.semester
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitAssistant = () => {
  currentCourse.value.assistants.push({
    assistantId: newAssistant.value.assistantId,
    assistantName: newAssistant.value.assistantName
  })
  closeModal()
}

const router = useRouter()
const goTo = (routeName) => {
  router.push({ name: routeName })
}
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

.filter-bar select {
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
  align-items: center;
}

.course-basic h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.course-basic p {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
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
  flex-direction: column;
  gap: 6px;
}

.assistant-item {
  background-color: #f2f6fc;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.no-assistant {
  font-size: 14px;
  color: #999;
}

/* 模态框样式 */
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
