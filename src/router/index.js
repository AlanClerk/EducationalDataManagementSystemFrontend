import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/login/Login.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import BookInfo from '@/pages/admin/BookInfo.vue'
import ClassInfo from '@/pages/admin/ClassInfo.vue'
import StudentDashboard from '@/pages/student/StudentDashboard.vue'
import ProfDashboard from '@/pages/teacher/ProfDashboard.vue'
import GuideDashboard from '@/pages/teacher/GuideDashboard.vue'
import TutorDashboard from '@/pages/teacher/TutorDashboard.vue'

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
