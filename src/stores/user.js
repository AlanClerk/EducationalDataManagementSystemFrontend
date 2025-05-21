import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        uid: null,
        role: '',
        nickname: '',
        id: null,
        department: '',
        token: '',
        username: '',
    }),
    actions: {
        setUser(data) {
            Object.assign(this, data)
            sessionStorage.setItem('userInfo', JSON.stringify(data)) // 非永久存储
        },
        loadUser() {
            const saved = JSON.parse(sessionStorage.getItem('userInfo'))
            if (saved) Object.assign(this, saved)
        },
        logout() {
            sessionStorage.removeItem('userInfo')
            this.$reset()
        }
    }
})
