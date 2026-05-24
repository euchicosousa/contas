import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerClient } from '#/integrations/supabase/server'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    
    if (data.session) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})
