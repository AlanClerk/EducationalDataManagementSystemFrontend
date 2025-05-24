<template>
  <div class="dashboard">
    <header class="header">
      <h2>你好，{{ nickname }}教授 - 学生反馈</h2>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('/studentManage')">学生管理</button>
        <button class="nav-btn" @click="goTo('/gradeManage')">成绩管理</button>
        <button class="nav-btn" @click="goTo('/bookBorrow')">书籍借阅</button>
        <button class="nav-btn" @click="goTo('/feedBack')">学生反馈</button>
      </div>
    </header>

    <div class="filter-bar">
      <label class="filter-label">筛选学期：</label>
      <select v-model="selectedSemester">
        <option value="">全部</option>
        <option v-for="sem in allSemesters" :key="sem" :value="sem">{{ sem }}</option>
      </select>
    </div>

    <div class="feedback-list">
      <div
          v-for="feedback in filteredFeedbacks"
          :key="feedback.id"
          class="feedback-card"
      >
        <div class="feedback-header">
          <div class="feedback-basic">
            <h3>{{ feedback.courseName }}</h3>
            <p>课程号: {{ feedback.courseId }}</p>
            <p>学期: {{ feedback.semester }}</p>
            <p>学号: {{ feedback.studentId }}</p>
          </div>
          <button class="details-btn" @click="openDetailsModal(feedback)">详情</button>
        </div>
      </div>
      <div v-if="filteredFeedbacks.length === 0" class="no-feedback">暂无反馈</div>
    </div>

    <!-- 反馈详情弹窗 -->
    <div class="modal-mask" v-if="showModal">
      <div class="modal-container">
        <h3>反馈详情</h3>
        <div class="form-group">
          <label>反馈内容</label>
          <textarea
              v-model="currentFeedback.feedbackContent"
              readonly
              rows="5"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import request from '@/authorization/request'

const nickname = ref(sessionStorage.getItem('nickname') || '未知')
const router = useRouter()
const feedbacks = ref([])
const selectedSemester = ref('')
const showModal = ref(false)
const currentFeedback = ref({})

const allSemesters = computed(() => [...new Set(feedbacks.value.map((f) => f.semester))])
const filteredFeedbacks = computed(() => {
  return selectedSemester.value
      ? feedbacks.value.filter((f) => f.semester === selectedSemester.value)
      : feedbacks.value
})

// 获取反馈列表
const fetchFeedbacks = async () => {
  try {
    const teacherId = sessionStorage.getItem('uid')
    const response = await request.get('/edu/feedback/list', {params: {teacherId}})
    if (response.data.code === 200) {
      feedbacks.value = Array.isArray(response.data.rows) ? response.data.rows : []
    } else {
      console.error('获取反馈失败:', response.data.msg)
      feedbacks.value = []
    }
  } catch (error) {
    console.error('获取反馈失败:', error)
    feedbacks.value = []
  }
}

// 打开反馈详情弹窗
const openDetailsModal = (feedback) => {
  currentFeedback.value = feedback
  showModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  currentFeedback.value = {}
}

// 导航到其他页面
const goTo = (routePath) => {
  router.push(routePath)
}

onMounted(() => {
  fetchFeedbacks()
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
  background-color: #3b82f6;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.nav-btn:hover {
  background-color: #2563eb;
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
  flex-wrap: nowrap;
}

.filter-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  white-space: nowrap;
}

.filter-bar select {
  width: 120px;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.filter-bar select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.feedback-list {
  display: grid;
  gap: 12px;
}

.feedback-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feedback-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf2f7;
}

.feedback-basic {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 14px;
  color: #2d3748;
}

.feedback-basic h3 {
  font-size: 18px;
  color: #1a202c;
  margin: 0;
  flex: 1 1 100%;
  font-weight: 700;
  background: linear-gradient(to right, #e6fffa, #ffffff);
  padding: 6px 8px;
  border-radius: 4px;
}

.feedback-basic p {
  margin: 0;
  flex: 0 1 auto;
  padding: 4px 8px;
  background: #e6fffa;
  border-radius: 4px;
  font-weight: 500;
}

.details-btn {
  background-color: #3b82f6;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.details-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.no-feedback {
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

.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  background-color: #f7fafc;
  color: #2d3748;
}

.form-group textarea[readonly] {
  cursor: default;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.cancel-btn {
  background-color: #6b7280;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.cancel-btn:hover {
  background-color: #4b5563;
  transform: translateY(-1px);
}

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

@media (max-width: 768px) {
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .feedback-basic {
    flex-direction: column;
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