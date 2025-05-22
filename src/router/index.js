import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/login/Login.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import BookInfo from '@/pages/admin/BookInfo.vue'
import ClassInfo from '@/pages/admin/ClassInfo.vue'
import StudentDashboard from '@/pages/student/StudentDashboard.vue'
import ProfDashboard from '@/pages/teacher/ProfDashboard.vue'
import GuideDashboard from '@/pages/teacher/GuideDashboard.vue'
import TutorDashboard from '@/pages/teacher/TutorDashboard.vue'
import GradeManage from "@/pages/teacher/GradeManage.vue";
import BookBorrow from "@/pages/teacher/BookBorrow.vue";
import FeedBack from "@/pages/teacher/FeedBack.vue";
import StudentManage from "@/pages/teacher/StudentManage.vue";

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/adminDashboard', component: AdminDashboard },
    { path: '/bookInfo', component: BookInfo },
    { path: '/classInfo', component: ClassInfo },
    { path: '/studentDashboard', component: StudentDashboard },
    { path: '/ProfDashboard', component: ProfDashboard },
    { path: '/guideDashboard', component: GuideDashboard },
    { path: '/tutorDashboard', component: TutorDashboard },
    { path: '/gradeManage', component: GradeManage },
    { path: '/studentManage', component: StudentManage },
    { path: '/bookBorrow', component: BookBorrow },
    { path: '/feedback', component: FeedBack },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const publicPages = ['/login']
    const authRequired = !publicPages.includes(to.path)
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'))

    if (authRequired && (!userInfo || !userInfo.token)) {
        return next('/login')
    }

    next()
})

export default router
