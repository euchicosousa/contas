import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '#/features/auth/components/LoginForm'
import { createServerClient } from '#/integrations/supabase/server'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Check if already authenticated on the server side
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <LoginForm />
      </div>
    </div>
  )
}
