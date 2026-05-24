import * as React from 'react'
import { Button } from '#/components/ui/button'
import { authService } from '../services/auth.service'
import { createClient } from '#/integrations/supabase/client'

export function LogoutButton() {
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.signOut(supabase)
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? 'Saindo...' : 'Sair'}
    </Button>
  )
}
