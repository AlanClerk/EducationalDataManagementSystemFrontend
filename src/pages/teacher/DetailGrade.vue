<template>
  <div class="grade-detail">
    <!-- 返回按钮（左上角） -->
    <div class="header-row">
      <button class="back-btn" @click="goBack">返回</button>
    </div>

    <!-- 成绩详情标题 -->
    <h2>{{ studentName }}的成绩详情</h2>

    <!-- 成绩详情表格 -->
    <table>
      <thead>
      <tr>
        <th>学号</th>
        <th>学生姓名</th>
        <th>课程 ID/选课 ID</th>
        <th>班级</th>
        <th>教授姓名</th>
        <th>考核方式</th>
        <th>开课学期</th>
        <th>平时分</th>
        <th>考试分</th>
        <th>考试分权重</th>
        <th>总分</th>
        <th>课程类型</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="grade in grades" :key="grade.id">
        <td>{{ grade.studentId }}</td>
        <td>{{ grade.studentName }}</td>
        <td>{{ grade.courseId }}</td>
        <td>{{ grade.className }}</td>
        <td>{{ grade.teacherName }}</td>
        <td>{{ grade.assessmentType === 0 ? '考试' : '考查' }}</td>
        <td>{{ grade.semester }}</td>
        <td>{{ grade.regularScore }}</td>
        <td>{{ grade.examScore }}</td>
        <td>{{ grade.weight }}</td>
        <td>{{ grade.totalScore }}</td>
        <td>{{ grade.classType }}</td>
      </tr>
      <tr v-if="!grades.length">
        <td colspan="12" class="no-data">暂无成绩数据</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/authorization/request'

const router = useRouter()

// 从 sessionStorage 获取 studentId 和 studentName
const studentId = ref(sessionStorage.getItem('studentId') || '')
const studentName = ref(sessionStorage.getItem('studentName') || '未知学生')

// 成绩数据
const grades = ref([])

// 获取学生成绩详情
const fetchGradeDetails = async () => {
  if (!studentId.value || !studentName.value) {
    alert('学生信息未找到，请返回重试')
    return
  }
  try {
    const res = await request.post('/edu/grade/detailGrade', {
      studentId: studentId.value,
      studentName: studentName.value
    })
    if (Array.isArray(res.data)) {
      grades.value = res.data
    } else {
      alert('获取成绩详情失败：数据格式不正确')
    }
  } catch (error) {
    alert('获取成绩详情失败：' + error.message)
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 页面加载时获取数据
onMounted(() => {
  fetchGradeDetails()
})
</script>

<style scoped>
.grade-detail {
  padding: 24px;
  font-family: "Segoe UI", Roboto, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.back-btn {
  background-color: #4CAF50;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.back-btn:hover {
  background-color: #66bb6a;
}

h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
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

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>