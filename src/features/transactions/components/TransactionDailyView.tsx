import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as React from 'react'
import { TransactionItem } from './TransactionItem'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface TransactionDailyViewProps {
  transactions: any[]
  updatingIds: Set<string>
  onMarkAsPaid: (tx: any) => void
}

export function TransactionDailyView({ 
  transactions,
  updatingIds,
  onMarkAsPaid
}: TransactionDailyViewProps) {
  // Group transactions by payment_date
  const txByDate = React.useMemo(() => {
    const map = new Map<string, any[]>()
    transactions.forEach(tx => {
      const d = tx.payment_date
      if (d) {
        if (!map.has(d)) map.set(d, [])
        map.get(d)!.push(tx)
      }
    })
    return map
  }, [transactions])

  // Get sorted list of dates with transactions
  const sortedDates = React.useMemo(() => {
    return Array.from(txByDate.keys()).sort((a, b) => a.localeCompare(b))
  }, [txByDate])

  // Pre-calculate cumulative running balance for each date
  const cumulativeBalances = React.useMemo(() => {
    const map = new Map<string, number>()
    let running = 0
    sortedDates.forEach(dateKey => {
      const dayTxs = txByDate.get(dateKey) || []
      let dayBalance = 0
      dayTxs.forEach(tx => {
        if (tx.transaction_type === 'entrada') {
          dayBalance += tx.amount
        } else {
          dayBalance -= tx.amount
        }
      })
      running += dayBalance
      map.set(dateKey, running)
    })
    return map
  }, [sortedDates, txByDate])

  if (sortedDates.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
        Nenhum lançamento encontrado para exibir no fluxo.
      </div>
    )
  }

  return (
    <div className="flex overflow-x-auto snap-x scroll-smooth no-scrollbar">
      {sortedDates.map((dateKey, index) => {
        const isLast = index === sortedDates.length - 1
        const dayDate = parseISO(dateKey)
        const dayTxs = txByDate.get(dateKey) || []
        

        // Fetch cumulative balance
        const balance = cumulativeBalances.get(dateKey) || 0

        // Sort: Entradas (A-Z) -> Saídas (A-Z)
        const sortedDayTxs = [...dayTxs].sort((a, b) => {
          const isEntradaA = a.transaction_type === 'entrada'
          const isEntradaB = b.transaction_type === 'entrada'

          if (isEntradaA && !isEntradaB) return -1
          if (!isEntradaA && isEntradaB) return 1

          return (a.title || '').localeCompare(b.title || '')
        })

        const dayNameRaw = format(dayDate, 'EEEE', { locale: ptBR })
        const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1)
        const dateStr = format(dayDate, "dd 'de' MMMM", { locale: ptBR })

        return (
          <div
            key={dateKey}
            className={`flex flex-col min-w-[220px] xl:min-w-[280px] shrink-0 snap-align-start transition-all h-[calc(100vh-250px)] min-h-[420px] `}
          >
            {/* Header */}
            <div className="border-b border-border/80 py-3 text-center shrink-0">
              <h5 className={`font-bold text-xs uppercase opacity-30`}>
                {dayName}
              </h5>
              <p className="text-xl font-medium mt-0.5">{dateStr}</p>
            </div>

            {/* List */}
            <div className={`flex-1 space-y-1 px-2 py-3 overflow-y-auto no-scrollbar min-h-0 ${!isLast ? 'border-r border-border/80' : ''}`}>
              {sortedDayTxs.map(tx => (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  updatingIds={updatingIds}
                  onMarkAsPaid={onMarkAsPaid}
                  size="md"
                />
              ))}
            </div>

            {/* Footer / Balance */}
            <div className="border-y border-border/80 p-3 mt-auto shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Saldo Acumulado</span>
                <span className={`font-bold text-sm ${
                  balance >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
