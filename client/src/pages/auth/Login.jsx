import { Link } from 'react-router-dom'
import AuthCard from '../../components/AuthCard'
import LoginForm from '../../components/LoginForm'

const Login = () => (
  <AuthCard
    title="Welcome Back"
    subtitle="Sign in to access your placement portal"
    footer={
      <>
        New here?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">
          Create an account
        </Link>
      </>
    }
  >
    <LoginForm />
  </AuthCard>
)

export default Login
