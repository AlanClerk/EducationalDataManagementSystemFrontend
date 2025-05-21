<template>
  <div class="book-info">
    <header>
      <h1>图书管理</h1>
      <div class="nav-buttons">
        <button @click="goToAdmin">用户管理</button>
        <button @click="goToClass">课程管理</button>
      </div>
    </header>

    <div class="action-buttons">
      <button @click="handleAdd">新增图书</button>
      <button @click="downloadTemplate">下载模板</button>
      <button @click="downloadGuide">填写须知</button>
      <button @click="exportBooks">导出图书列表</button>
      <button @click="$refs.fileInput.click()">批量导入</button>
      <input type="file" ref="fileInput" style="display: none;" accept=".xlsx,.xls" @change="handleFileUpload" />
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <label>书名：<input v-model="search.title" placeholder="请输入书名" /></label>
      <label>作者：<input v-model="search.author" placeholder="请输入作者" /></label>
      <label>ISBN：<input v-model="search.isbn" placeholder="请输入ISBN" /></label>
      <label>分类号：<input v-model="search.categoryCode" placeholder="请输入分类号" /></label>
      <div class="search-actions">
        <button @click="searchBooks">搜索</button>
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
      <span>共 {{ filteredBooks.length }} 条记录</span>
    </div>

    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>书名</th>
        <th>作者</th>
        <th>出版社</th>
        <th>ISBN</th>
        <th>分类号</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(book, index) in paginatedBooks" :key="book.id">
        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
        <td>{{ book.title }}</td>
        <td>{{ book.author }}</td>
        <td>{{ book.publisher }}</td>
        <td>{{ book.isbn }}</td>
        <td>{{ book.categoryCode }}</td>
        <td>{{ book.status }}</td>
        <td>
          <button @click="handleEdit(book)">编辑</button>
          <button @click="handleDelete(book.id)">删除</button>
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
        <h3>{{ isEdit ? '编辑图书' : '新增图书' }}</h3>
        <form @submit.prevent="submitForm">
          <label>书名：<input v-model="form.title" required /></label>
          <label>作者：<input v-model="form.author" required /></label>
          <label>出版社：<input v-model="form.publisher" required /></label>
          <label>ISBN：<input v-model="form.isbn" required /></label>
          <label>分类号：<input v-model="form.categoryCode" required /></label>
          <label>状态：
            <select v-model="form.status" required>
              <option value="空闲">空闲</option>
              <option value="已借">已借</option>
              <option value="逾期">逾期</option>
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
import request from '@/authorization/request';
import { useRouter } from 'vue-router'

const router = useRouter()
const bookList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  categoryCode: '',
  status: '空闲'
})
// 搜索条件
const search = ref({
  title: '',
  author: '',
  isbn: '',
  categoryCode: ''
})
// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.ceil(filteredBooks.value.length / pageSize.value))

// 计算属性：根据搜索条件过滤图书列表
const filteredBooks = computed(() => {
  return bookList.value.filter(book => {
    const titleMatch = search.value.title
        ? book.title.toLowerCase().includes(search.value.title.toLowerCase())
        : true
    const authorMatch = search.value.author
        ? book.author.toLowerCase().includes(search.value.author.toLowerCase())
        : true
    const isbnMatch = search.value.isbn
        ? book.isbn.toLowerCase().includes(search.value.isbn.toLowerCase())
        : true
    const categoryCodeMatch = search.value.categoryCode
        ? book.categoryCode.toLowerCase().includes(search.value.categoryCode.toLowerCase())
        : true
    return titleMatch && authorMatch && isbnMatch && categoryCodeMatch
  })
})

// 计算属性：分页后的图书列表
const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredBooks.value.length)
  return filteredBooks.value.slice(start, end)
})

const fetchBooks = async () => {
  try {
    const res = await request.get('/edu/public/bookList')
    if (res.data.code === 200) {
      bookList.value = res.data.rows
      currentPage.value = 1 // 重置到第一页
    } else {
      alert('获取图书列表失败：' + res.data.msg)
    }
  } catch (error) {
    alert('获取图书列表失败：' + error.message)
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form.value, {
    id: null,
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    categoryCode: '',
    status: '空闲'
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
      await request.put('/edu/books', form.value)
    } else {
      await request.post('/edu/books', form.value)
    }
    dialogVisible.value = false
    await fetchBooks()
    alert('操作成功')
  } catch (error) {
    alert('操作失败：' + error.message)
  }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/edu/books/${id}`)
    await fetchBooks()
    alert('删除成功')
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}

const exportBooks = async () => {
  try {
    const res = await request.post('/edu/books/export', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '图书列表.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('导出失败：' + error.message)
  }
}

const downloadTemplate = async () => {
  try {
    const res = await request.post('/edu/books/importTemplate', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '书籍信息导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载模板失败：' + error.message)
  }
}

const downloadGuide = async () => {
  try {
    const res = await request.get('/edu/books/import/booksGuideTxt', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = '书籍信息填写须知.txt'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('书籍信息下载填写须知失败：' + error.message)
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

  const maxSize = 100 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    alert('文件大小超过 100MB，请选择更小的文件')
    event.target.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', 'true')

  try {
    const res = await request.post('/edu/books/importData', formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })
    if (res.data.code === 200) {
      alert('批量导入成功')
      await fetchBooks()
    } else {
      alert('导入失败：' + res.data.msg)
    }
  } catch (error) {
    alert('导入失败：' + error.message)
  } finally {
    event.target.value = ''
  }
}

const searchBooks = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}

const resetSearch = () => {
  search.value.title = ''
  search.value.author = ''
  search.value.isbn = ''
  search.value.categoryCode = ''
  currentPage.value = 1 // 重置搜索时回到第一页
}

const changePageSize = () => {
  currentPage.value = 1 // 更改每页条目数时重置到第一页
  pageSize.value = Number(pageSize.value) // 确保 pageSize 是数字类型
}

const goToAdmin = () => router.push('/AdminDashboard')
const goToClass = () => router.push('/ClassInfo')

onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.book-info {
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