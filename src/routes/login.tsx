import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '#/features/auth/components/LoginForm'
import { createServerClient } from '#/integrations/supabase/server'
import { createServerFn } from '@tanstack/react-start'

const checkAuthSessionFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    return !!data.session
  })

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const hasSession = await checkAuthSessionFn()
    if (hasSession) {
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
