import * as React from 'react'
import { useTransactions } from './useTransactions'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export function useDashboardSummary() {
  const { data: transactions, isLoading, error } = useTransactions()

  const summary = React.useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0, recentTransactions: [] }

    const today = new Date()
    const startStr = format(startOfMonth(today), 'yyyy-MM-dd')
    const endStr = format(endOfMonth(today), 'yyyy-MM-dd')

    // Filtra as transações apenas do mês corrente para receitas/despesas
    const currentMonthTxs = transactions.filter(t => {
      const date = t.payment_date
      return date >= startStr && date <= endStr
    })

    const income = currentMonthTxs
      .filter((t) => t.transaction_type === 'entrada')
      .reduce((acc, t) => acc + t.amount, 0)

    const expense = currentMonthTxs
      .filter((t) => t.transaction_type === 'saida')
      .reduce((acc, t) => acc + t.amount, 0)

    // Pegamos as últimas 5 transações de todos os tempos ordenadas pela data mais recente
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 5)

    return {
      income,
      expense,
      balance: income - expense,
      recentTransactions,
    }
  }, [transactions])

  return {
    ...summary,
    isLoading,
    error,
  }
}
