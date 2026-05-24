import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import * as React from 'react'
import { TransactionItem } from './TransactionItem'


interface TransactionCalendarProps {
  transactions: any[]
  currentDate: Date
  updatingIds: Set<string>
  onMarkAsPaid: (tx: any) => void
}

export function TransactionCalendar({ 
  transactions, 
  currentDate,
  updatingIds,
  onMarkAsPaid
}: TransactionCalendarProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Group transactions by date
  const txByDate = React.useMemo(() => {
    const map = new Map<string, any[]>()
    transactions.forEach(tx => {
      // payment_date is YYYY-MM-DD
      const d = tx.payment_date 
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(tx)
    })
    return map
  }, [transactions])

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-auto">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTxs = txByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isDayToday = isToday(day)

          return (
            <div 
              key={dateKey} 
              className={`min-h-[50px] p-1.5 border-b  ${!isCurrentMonth ? 'bg-foreground/5 opacity-40' : ''}`}
            >
              <div className="flex justify-between items-center mb-1 px-1">
                <span className={`text-xs font-medium ${isDayToday ? 'text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center font-bold' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 pb-1">
                {[...dayTxs].sort((a, b) => {
                  const isEntradaA = a.transaction_type === 'entrada'
                  const isEntradaB = b.transaction_type === 'entrada'
                  if (isEntradaA && !isEntradaB) return -1
                  if (!isEntradaA && isEntradaB) return 1
                  return (a.title || '').localeCompare(b.title || '')
                }).map(tx => (
                  <TransactionItem
                    key={tx.id}
                    tx={tx}
                    updatingIds={updatingIds}
                    onMarkAsPaid={onMarkAsPaid}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
