import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
    baseURL: '/', // 后端接口前缀
    timeout: 20000   // 请求超时设置（可调整）
})

// 所有以 /edu/public 开头的接口都不需要加 token
const whiteListPrefix = '/edu/public'

request.interceptors.request.use(
    config => {
        if (config.url.startsWith(whiteListPrefix)) {
            // 请求路径以 /edu/public 开头，放行不加认证头
            return config
        }

        // 其他接口添加认证头
        const userInfoStr = sessionStorage.getItem('userInfo')
        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr)
                if (userInfo.token) {
                    config.headers.Authorization = `${userInfo.token}`
                }
            } catch (e) {
                console.warn('解析 sessionStorage.userInfo 失败', e)
            }
        }
        return config
    },
    error => Promise.reject(error)
)

export default request
