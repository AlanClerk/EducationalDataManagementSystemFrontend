import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/login/Login.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import StudentDashboard from '@/pages/student/StudentDashboard.vue'
import TeacherDashboard from '@/pages/teacher/TeacherDashboard.vue'
import GuideDashboard from '@/pages/teacher/GuideDashboard.vue'
import TutorDashboard from '@/pages/teacher/TutorDashboard.vue'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/adminDashboard', component: AdminDashboard },
    { path: '/studentDashboard', component: StudentDashboard },
    { path: '/teacherDashboard', component: TeacherDashboard },
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
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))

    if (authRequired && (!userInfo || !userInfo.token)) {
        return next('/login')
    }

    next()
})

export default router
