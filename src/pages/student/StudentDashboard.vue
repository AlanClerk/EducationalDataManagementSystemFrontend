<template>
  <div class="dashboard">
    <header class="header">
      <h2>{{ nickname }} 的课程页面</h2>
      <div class="nav-buttons">
        <button class="nav-btn" @click="goTo('/bookBorrow')">书籍借阅</button>
        <button class="nav-btn" @click="goToGradeManage">查询详情成绩</button>
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
      <div v-if="filteredCourses.length === 0" class="no-courses">
        <p>没有找到课程信息。请确认您已选课或联系管理员。</p>
      </div>
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
            <p>教授姓名: {{ course.teacherName }}</p>
            <p>考核方式: {{ course.assessmentType === 0 ? '考试' : '考查' }}</p>
            <p>课程类型: {{ course.classType }}</p>
            <p>备注: {{ course.description }}</p>
          </div>
          <button class="feedback-btn" @click="openFeedbackModal(course)">提交反馈</button>
        </div>
      </div>
    </div>

    <!-- 反馈弹窗 -->
    <div class="modal-mask" v-if="showModal">
      <div class="modal-container">
        <h3>提交课程反馈</h3>
        <div class="form-group">
          <label>反馈内容</label>
          <textarea
              v-model="feedbackContent"
              placeholder="请输入您的反馈"
              rows="5"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="submit-btn" @click="submitFeedback">提交</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/authorization/request'

const nickname = ref(sessionStorage.getItem('nickname') || '未知')
const router = useRouter()
const courses = ref([])
const selectedSemester = ref('')
const showModal = ref(false)
const feedbackContent = ref('')
const currentCourse = ref(null)

const allSemesters = computed(() => [...new Set(courses.value.map((c) => c.semester))])
const filteredCourses = computed(() => {
  return selectedSemester.value
      ? courses.value.filter((c) => c.semester === selectedSemester.value)
      : courses.value
})

// 获取当前学期（假设春季为“年份-1”，秋季为“年份-2”）
const getCurrentSemester = () => {
  const now = new Date('2025-05-24') // 系统提供的当前日期
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  // 假设 1-6 月为春季学期（“年份-1”），7-12 月为秋季学期（“年份-2”）
  return month <= 6 ? `${year}-1` : `${year}-2`
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    const uid = sessionStorage.getItem('uid')
    if (!uid) {
      console.error('未找到用户 ID')
      courses.value = []
      return
    }
    const response = await request.post('/edu/student/courses', { studentId: uid })
    console.log('API 返回数据:', response.data) // 调试用
    let fetchedCourses = []
    if (response.data && Array.isArray(response.data)) {
      // 如果返回的是裸数组（如样例数据）
      fetchedCourses = response.data
    } else if (response.data.code === 200 && Array.isArray(response.data.rows)) {
      // 如果返回的是 { code: 200, rows: [...] }
      fetchedCourses = response.data.rows
    } else {
      console.error('API 返回格式错误:', response.data)
      fetchedCourses = []
    }
    courses.value = fetchedCourses
    // 默认选中当前学期（如果存在）
    const currentSem = getCurrentSemester()
    if (allSemesters.value.includes(currentSem)) {
      selectedSemester.value = currentSem
    }
  } catch (error) {
    console.error('获取课程失败:', error)
    courses.value = []
  }
}

// 提交反馈
const submitFeedback = async () => {
  try {
    if (!feedbackContent.value.trim()) {
      alert('反馈内容不能为空')
      return
    }
    const response = await request.post('/edu/student/feedback', {
      courseId: currentCourse.value.classId,
      courseName: currentCourse.value.className,
      studentId: sessionStorage.getItem('uid'),
      teacherId: currentCourse.value.teacherId,
      feedbackContent: feedbackContent.value,
      semester: currentCourse.value.semester
    })
    if (response.data.code === 200) {
      closeModal()
      alert('反馈提交成功')
    } else {
      alert('反馈提交失败: ' + response.data.message)
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    alert('提交反馈失败，请稍后重试')
  }
}

// 打开反馈弹窗
const openFeedbackModal = (course) => {
  currentCourse.value = course
  feedbackContent.value = ''
  showModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  feedbackContent.value = ''
}

// 导航到其他页面
const goTo = (routePath) => {
  router.push(routePath)
}

// 导航到成绩管理页面前设置 sessionStorage
const goToGradeManage = () => {
  const uid = sessionStorage.getItem('uid')
  const nickname = sessionStorage.getItem('nickname')
  sessionStorage.setItem('studentId', uid)
  sessionStorage.setItem('studentName', nickname)
  router.push('/detailGrade')
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
  font-size: 18px;
  color: #1a202c;
  margin: 0;
  flex: 1 1 100%;
  font-weight: 700;
  background: linear-gradient(to right, #e6fffa, #ffffff);
  padding: 6px 8px;
  border-radius: 4px;
}

.course-basic p {
  margin: 0;
  flex: 0 1 auto;
  padding: 4px 8px;
  background: #e6fffa;
  border-radius: 4px;
  font-weight: 500;
}

.feedback-btn {
  background-color: #22c55e;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.feedback-btn:hover {
  background-color: #16a34a;
  transform: translateY(-1px);
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
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group textarea:focus {
  border-color: #3b82f6;
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
  background-color: #3b82f6;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
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
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .course-basic {
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
/* 其他样式保持不变 */
.no-courses {
  text-align: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.no-courses p {
  color: #4a5568;
  font-size: 16px;
  margin: 0;
}
</style>