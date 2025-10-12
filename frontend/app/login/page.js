import { LoginForm } from "@/components/login-form"
import AuthLayout from "@/components/AuthLayout"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Sign in to access your Teachers Connect account and continue empowering rural education."
    >
      <LoginForm />
    </AuthLayout>
  )
}
