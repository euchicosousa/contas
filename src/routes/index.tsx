import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerClient } from '#/integrations/supabase/server'
import { createServerFn } from '@tanstack/react-start'

const checkAuthSessionFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    return !!data.session
  })

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const hasSession = await checkAuthSessionFn()
    
    if (hasSession) {
      throw redirect({ to: '/transactions' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})
