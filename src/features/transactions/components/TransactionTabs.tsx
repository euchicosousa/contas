import { CalendarIcon, ColumnsIcon, ListIcon } from 'lucide-react'

interface TransactionTabsProps {
  viewMode: 'list' | 'calendar' | 'daily'
  setViewMode: (mode: 'list' | 'calendar' | 'daily') => void
}

export function TransactionTabs({ viewMode, setViewMode }: TransactionTabsProps) {
  return (
    <div className="flex p-1 bg-muted rounded-md shrink-0">
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
      >
        <ListIcon className="h-4 w-4" />
        Lista
      </button>
      <button
        onClick={() => setViewMode('calendar')}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${
          viewMode === 'calendar'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
      >
        <CalendarIcon className="h-4 w-4" />
        Calendário
      </button>
      <button
        onClick={() => setViewMode('daily')}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${
          viewMode === 'daily'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
      >
        <ColumnsIcon className="h-4 w-4" />
        Fluxo
      </button>
    </div>
  )
}
