import { LoginForm } from "@/components/login-form"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getSession()

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  const signupSuccess = searchParams.signup === "success"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
        <LoginForm />
      </div>
    </div>
  )
}
