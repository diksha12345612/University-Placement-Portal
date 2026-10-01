import axios from 'axios'

// One Axios instance for the whole app, so the base URL and token logic live in one place
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Before every request: attach the JWT if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// After every response: if the token is invalid or expired, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// Turns any Axios error into a message we can show in a toast
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.request) return 'Cannot reach the server. Please check that the backend is running.'
  return error.message || 'Something went wrong'
}

export default api
