import { Button } from '#/components/ui/button'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={cycleTheme} 
      className="flex items-center gap-2 rounded-full px-3"
      title="Alternar tema"
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
      <span className="text-xs font-medium capitalize">{theme}</span>
    </Button>
  )
}
