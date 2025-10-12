import { SignupForm } from "@/components/signup-form"
import AuthLayout from "@/components/AuthLayout"

export default function SignupPage() {
  return (
    <AuthLayout
      title="Join Teachers Connect"
      subtitle="Create your account and start building the future of rural education with AI-powered tools and global collaboration."
    >
      <SignupForm />
    </AuthLayout>
  )
}
