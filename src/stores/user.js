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
            localStorage.setItem('userInfo', JSON.stringify(data))
        },
        loadUser() {
            const saved = JSON.parse(localStorage.getItem('userInfo'))
            if (saved) Object.assign(this, saved)
        },
        logout() {
            localStorage.removeItem('userInfo')
            this.$reset()
        }
    }
})
