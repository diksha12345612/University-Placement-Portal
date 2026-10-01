import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  // Loading only if a token is saved: we must ask the backend who it belongs to
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

  // On page load / refresh: if a token is saved, fetch the logged-in user
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // Throws the Axios error on failure, so the login page can show the message
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Usage in any component: const { user, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)
