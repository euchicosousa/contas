import { createFileRoute, redirect, Outlet, Link, useLocation } from '@tanstack/react-router'
import { createServerClient } from '#/integrations/supabase/server'
import { LogoutButton } from '#/features/auth/components/LogoutButton'
import { ModeToggle } from '#/components/theme/mode-toggle'
import { createServerFn } from '@tanstack/react-start'

const getAuthUserFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      throw new Error('Não autenticado')
    }
    return data.user
  })

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    try {
      const user = await getAuthUserFn()
      return { user }
    } catch (e) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: AuthenticatedLayout,
})

import * as React from 'react'
import { MenuIcon, XIcon } from 'lucide-react'

function AuthenticatedLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const closeMenu = () => setIsMobileMenuOpen(false)

  const location = useLocation()
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])
  const isFullWidthView = location.pathname.includes('/transactions') && 
    (searchParams.get('view') === 'calendar' || searchParams.get('view') === 'daily')

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/transactions" onClick={closeMenu} className="text-xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity">
            MONNAIE
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link 
              to="/transactions" 
              className="text-muted-foreground hover:text-foreground transition-colors [&.active]:text-foreground"
            >
              Lançamentos
            </Link>
            <Link 
              to="/accounts" 
              className="text-muted-foreground hover:text-foreground transition-colors [&.active]:text-foreground"
            >
              Contas
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="hidden md:block">
            <LogoutButton />
          </div>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden sticky top-16 z-10 border-b border-border bg-background p-4 flex flex-col gap-4 shadow-sm animate-in slide-in-from-top-2">
          <Link 
            to="/transactions" 
            onClick={closeMenu}
            className="block text-base font-medium text-muted-foreground hover:text-foreground [&.active]:text-foreground"
          >
            Lançamentos
          </Link>
          <Link 
            to="/accounts" 
            onClick={closeMenu}
            className="block text-base font-medium text-muted-foreground hover:text-foreground [&.active]:text-foreground"
          >
            Contas
          </Link>
          <hr className="border-border" />
          <LogoutButton />
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className={isFullWidthView ? "w-full flex-1 flex flex-col p-4 md:p-6 overflow-hidden" : "mx-auto max-w-7xl w-full flex-1 flex flex-col p-4 md:p-6 overflow-hidden"}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
