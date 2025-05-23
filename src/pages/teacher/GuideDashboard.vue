<template>
  <div class="grade-manage">
    <!-- 欢迎信息 -->
    <div class="welcome-message">您好，{{ nickname }}</div>

    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">返回</button>

    <!-- 成绩管理 -->
    <div class="header-row">
      <h2>学生成绩列表</h2>
      <!-- 导出按钮 -->
      <button class="btn export" @click="exportGrades">导出成绩</button>
    </div>

    <!-- 搜索表单 -->
    <div class="controls-row">
      <div class="search-form">
        <label>学号：<input v-model="search.studentId" placeholder="请输入学号" /></label>
        <label>姓名：<input v-model="search.studentName" placeholder="请输入姓名" /></label>
        <div class="search-actions">
          <button @click="searchStudents">搜索</button>
          <button @click="resetSearch">重置</button>
        </div>
      </div>
      <!-- 分页控件 -->
      <div class="pagination-controls">
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

    <!-- 学生成绩表格 -->
    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>学号</th>
        <th>姓名</th>
        <th>必修课程</th>
        <th>选修课程</th>
        <th>挂科数</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(student, index) in paginatedStudents" :key="student.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ student.studentId }}</td>
        <td>{{ student.studentName }}</td>
        <td>{{ student.required }}</td>
        <td>{{ student.elective }}</td>
        <td>{{ student.fail }}</td>
        <td>
          <button class="btn detail" @click="goToDetail(student)">查看详情</button>
        </td>
      </tr>
      <tr v-if="!paginatedStudents.length">
        <td colspan="7" class="no-data">暂无学生成绩数据</td>
      </tr>
      </tbody>
    </table>

    <!-- 分页导航 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/authorization/request'

const router = useRouter()

// 从 sessionStorage 获取 nickname
const nickname = ref(sessionStorage.getItem('nickname') || '用户')

// 学生成绩数据
const students = ref([])
const currentPage = ref(1)
const pageSize = ref(5) // 默认每页显示 5 条
const search = ref({
  studentId: '',
  studentName: ''
})

// 计算过滤后的学生列表
const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const idMatch = search.value.studentId
        ? student.studentId.toString().includes(search.value.studentId)
        : true
    const nameMatch = search.value.studentName
        ? student.studentName.toLowerCase().includes(search.value.studentName.toLowerCase())
        : true
    return idMatch && nameMatch
  })
})

// 计算分页后的学生列表
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredStudents.value.length)
  return filteredStudents.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize.value))

// 获取学生成绩
const fetchGrades = async () => {
  const department = sessionStorage.getItem('department')
  if (!department) {
    alert('部门信息未找到，请重新登录')
    return
  }
  try {
    const res = await request.post('/edu/guide/grades', { department })
    if (Array.isArray(res.data)) {
      students.value = res.data
    } else {
      alert('获取学生成绩失败：数据格式不正确')
    }
  } catch (error) {
    alert('获取学生成绩失败：' + error.message)
  }
}

// 导出成绩
const exportGrades = async () => {
  const department = sessionStorage.getItem('department')
  if (!department) {
    alert('部门信息未找到，请重新登录')
    return
  }
  try {
    const res = await request.post('/edu/guide/grades/export', { department }, {
      responseType: 'blob' // 设置响应类型为 blob 以处理文件下载
    })
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${department}_成绩列表.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert('导出成绩失败：' + error.message)
  }
}

// 导航到成绩详情
const goToDetail = (student) => {
  sessionStorage.setItem('studentId', student.studentId)
  sessionStorage.setItem('studentName', student.studentName)
  router.push('/detailGrade')
}

// 搜索学生
const searchStudents = () => {
  currentPage.value = 1
}

// 重置搜索
const resetSearch = () => {
  search.value.studentId = ''
  search.value.studentName = ''
  currentPage.value = 1
}

// 更改每页显示条数
const changePageSize = () => {
  currentPage.value = 1
  pageSize.value = Number(pageSize.value)
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 页面加载时获取数据
onMounted(() => {
  fetchGrades()
})
</script>

<style scoped>
.grade-manage {
  padding: 24px;
  font-family: "Segoe UI", Roboto, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.welcome-message {
  font-size: 20px;
  color: #333;
  margin-bottom: 16px;
}

.back-btn {
  margin-bottom: 20px;
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

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
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

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
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

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn.export {
  background-color: #409eff;
  color: white;
}

.btn.export:hover {
  background-color: #66b1ff;
}

.btn.detail {
  background-color: #4CAF50;
  color: white;
}

.btn.detail:hover {
  background-color: #66bb6a;
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
</style>