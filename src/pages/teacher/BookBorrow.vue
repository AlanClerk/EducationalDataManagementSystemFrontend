<template>
  <div class="book-borrow">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">返回</button>

    <!-- 已借阅书籍卡片 -->
    <h2>已借阅书籍</h2>
    <div class="card-container">
      <div v-for="book in borrowedBooks" :key="book.id" class="card">
        <h3>{{ book.title }}</h3>
        <p>作者：{{ book.author }}</p>
        <p>出版社：{{ book.publisher }}</p>
        <p>ISBN：{{ book.isbn }}</p>
        <p>分类号：{{ book.categoryCode }}</p>
        <div class="actions">
          <button class="btn return" @click="returnBook(book.id)">归还</button>
        </div>
      </div>
      <p v-if="!borrowedBooks.length" class="no-data">暂无已借阅书籍</p>
    </div>

    <!-- 空闲书籍查询 -->
    <h2>空闲书籍</h2>
    <div class="controls-row">
      <!-- 搜索表单 -->
      <div class="search-form">
        <label>书名：<input v-model="search.title" placeholder="请输入书名" /></label>
        <label>作者：<input v-model="search.author" placeholder="请输入作者" /></label>
        <label>出版社：<input v-model="search.publisher" placeholder="请输入出版社" /></label>
        <label>ISBN：<input v-model="search.isbn" placeholder="请输入ISBN" /></label>
        <label>分类号：<input v-model="search.categoryCode" placeholder="请输入分类号" /></label>
        <div class="search-actions">
          <button @click="searchBooks">搜索</button>
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
        <span>共 {{ filteredBooks.length }} 条记录</span>
      </div>
    </div>

    <!-- 空闲书籍表格 -->
    <table>
      <thead>
      <tr>
        <th>序号</th>
        <th>书名</th>
        <th>作者</th>
        <th>出版社</th>
        <th>ISBN</th>
        <th>分类号</th>
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
        <td>
          <button
              class="btn borrow"
              :disabled="borrowedBooks.length >= 3"
              @click="borrowBook(book.id)"
              :title="borrowedBooks.length >= 3 ? '已借阅3本书，无法继续借阅' : ''"
          >
            借阅
          </button>
        </td>
      </tr>
      <tr v-if="!paginatedBooks.length">
        <td colspan="7" class="no-data">暂无空闲书籍</td>
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
import {ref, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import request from '@/authorization/request'

const router = useRouter()

// 已借阅书籍
const borrowedBooks = ref([])

// 空闲书籍及分页
const blankBooks = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const search = ref({
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  categoryCode: ''
})

// 计算过滤后的书籍
const filteredBooks = computed(() => {
  return blankBooks.value.filter(book => {
    const titleMatch = search.value.title
        ? book.title.toLowerCase().includes(search.value.title.toLowerCase())
        : true
    const authorMatch = search.value.author
        ? book.author.toLowerCase().includes(search.value.author.toLowerCase())
        : true
    const publisherMatch = search.value.publisher
        ? book.publisher.toLowerCase().includes(search.value.publisher.toLowerCase())
        : true
    const isbnMatch = search.value.isbn
        ? book.isbn.toLowerCase().includes(search.value.isbn.toLowerCase())
        : true
    const categoryCodeMatch = search.value.categoryCode
        ? book.categoryCode.toLowerCase().includes(search.value.categoryCode.toLowerCase())
        : true
    return titleMatch && authorMatch && publisherMatch && isbnMatch && categoryCodeMatch
  })
})

// 计算分页后的书籍
const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = Math.min(start + pageSize.value, filteredBooks.value.length)
  return filteredBooks.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredBooks.value.length / pageSize.value))

// 获取已借阅书籍
const fetchBorrowedBooks = async () => {
  const userId = sessionStorage.getItem('uid')
  if (!userId) {
    alert('用户未登录，请先登录')
    return
  }
  try {
    const res = await request.post('/edu/public/bookBorrowedList', {userId})
    if (Array.isArray(res.data)) {
      borrowedBooks.value = res.data
    } else {
      alert('获取已借阅书籍失败：数据格式不正确')
    }
  } catch (error) {
    alert('获取已借阅书籍失败：' + error.message)
  }
}

// 获取空闲书籍
const fetchBlankBooks = async () => {
  try {
    const res = await request.get('/edu/public/blankBookList')
    if (res.data.code === 200) {
      blankBooks.value = res.data.rows
      currentPage.value = 1
    } else {
      alert('获取空闲书籍失败：' + res.data.msg)
    }
  } catch (error) {
    alert('获取空闲书籍失败：' + error.message)
  }
}

// 借阅书籍
const borrowBook = async (bookId) => {
  const userId = sessionStorage.getItem('uid')
  if (!userId) {
    alert('用户未登录，请先登录')
    return
  }
  if (borrowedBooks.value.length >= 3) {
    alert('您已借阅3本书，无法继续借阅')
    return
  }
  try {
    const res = await request.post('/edu/public/borrowBook', {bookId, userId})
    if (res.data === true) {
      alert('借阅成功')
      await fetchBorrowedBooks()
      await fetchBlankBooks()
    } else {
      alert('借阅失败')
    }
  } catch (error) {
    alert('借阅失败：' + error.message)
  }
}

// 归还书籍
const returnBook = async (bookId) => {
  const userId = sessionStorage.getItem('uid')
  if (!userId) {
    alert('用户未登录，请先登录')
    return
  }
  try {
    const res = await request.post('/edu/public/returnBook', {bookId, userId})
    if (res.data === true) {
      alert('归还成功')
      await fetchBorrowedBooks()
      await fetchBlankBooks()
    } else {
      alert('归还失败')
    }
  } catch (error) {
    alert('归还失败：' + error.message)
  }
}

// 搜索书籍
const searchBooks = () => {
  currentPage.value = 1
}

// 重置搜索
const resetSearch = () => {
  search.value.title = ''
  search.value.author = ''
  search.value.publisher = ''
  search.value.isbn = ''
  search.value.categoryCode = ''
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
  fetchBorrowedBooks()
  fetchBlankBooks()
})
</script>

<style scoped>
.book-borrow {
  padding: 24px;
  font-family: "Segoe UI", Roboto, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.back-btn {
  margin-bottom: 20px;
  background-color: #4CAF50; /* 与借阅按钮颜色一致 */
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.back-btn:hover {
  background-color: #66bb6a; /* 与借阅按钮的悬停颜色一致 */
}

h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

/* 卡片样式 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
}

.card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: #333;
}

.card p {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn.return {
  background-color: #f44336;
  color: white;
}

.btn.borrow {
  background-color: #4CAF50;
  color: white;
}

.btn.borrow:disabled {
  background-color: #dcdfe6;
  cursor: not-allowed;
}

/* 搜索表单和分页控件容器 */
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

/* 分页控件样式 */
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

/* 表格样式 */
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

/* 分页导航 */
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