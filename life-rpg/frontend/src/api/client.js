import axios from 'axios'

// In-memory token storage
let inMemoryToken = null

export const setAccessToken = (token) => {
  inMemoryToken = token
}

export const getAccessToken = () => inMemoryToken

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // required for HttpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers['Authorization'] = `Bearer ${inMemoryToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 & token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/register') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = data.access_token
        setAccessToken(newToken)
        processQueue(null, newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        setAccessToken(null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
