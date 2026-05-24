import { useNavigate, useSearch } from '@tanstack/react-router'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { AlertCircleIcon } from 'lucide-react'
import * as React from 'react'
import { useDeleteTransaction, useDuplicateTransaction, useLateTransactions, useTransactions, useUpdateTransaction } from '../hooks/useTransactions'
import { TransactionCalendar } from './TransactionCalendar'
import { TransactionDailyView } from './TransactionDailyView'
import { TransactionTable } from './TransactionTable'
import { TransactionTabs } from './TransactionTabs'
import { TransactionFiltersForm } from './TransactionFiltersForm'
import { ptBR } from 'date-fns/locale'

export function TransactionList({ showFilters = false }: { showFilters?: boolean }) {
  const today = new Date()
  const [dateFrom, setDateFrom] = React.useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = React.useState(format(endOfMonth(today), 'yyyy-MM-dd'))
  const [filterType, setFilterType] = React.useState<'entrada' | 'saida' | 'todos'>('todos')
  const [filterGroup, setFilterGroup] = React.useState<string | null>(null)

  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as any
  const viewMode = search.view === 'calendar' ? 'calendar' : search.view === 'daily' ? 'daily' : 'list'

  const setViewMode = (mode: 'list' | 'calendar' | 'daily') => {
    navigate({
      search: (prev: any) => ({ ...prev, view: mode }),
    } as any)
  }

  const filters = {
    dateFrom,
    dateTo,
    ...(filterType !== 'todos' ? { type: filterType as 'entrada' | 'saida' } : {}),
    ...(filterGroup ? { groupId: filterGroup } : {}),
  }

  const { data: transactions, isLoading, error } = useTransactions(filters)
  const { data: lateTransactions } = useLateTransactions()

  const sortedTransactionsForList = React.useMemo(() => {
    if (!transactions) return []
    const sortFn = (a: any, b: any) => {
      const dateA = a.payment_date || ''
      const dateB = b.payment_date || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.title || '').localeCompare(b.title || '')
    }
    const entradas = transactions.filter(t => t.transaction_type === 'entrada').sort(sortFn)
    const saidas = transactions.filter(t => t.transaction_type !== 'entrada').sort(sortFn)
    return [...entradas, ...saidas]
  }, [transactions])

  const sortedLateTransactions = React.useMemo(() => {
    if (!lateTransactions) return []
    const sortFn = (a: any, b: any) => {
      const dateA = a.payment_date || ''
      const dateB = b.payment_date || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.title || '').localeCompare(b.title || '')
    }
    const entradas = lateTransactions.filter(t => t.transaction_type === 'entrada').sort(sortFn)
    const saidas = lateTransactions.filter(t => t.transaction_type !== 'entrada').sort(sortFn)
    return [...entradas, ...saidas]
  }, [lateTransactions])

  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction()
  const { mutate: duplicateTransaction, isPending: isDuplicating } = useDuplicateTransaction()
  const { mutateAsync: updateTransactionAsync } = useUpdateTransaction()
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(new Set())

  const handleMarkAsPaid = async (tx: any) => {
    setUpdatingIds((prev) => new Set(prev).add(tx.id))
    try {
      await updateTransactionAsync({
        id: tx.id,
        is_paid: true,
        amount_paid: tx.amount
      })
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(tx.id)
        return next
      })
    }
  }

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    setUpdatingIds((prev) => new Set(prev).add(id))
    try {
      await updateTransactionAsync({
        id,
        title: newTitle
      })
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (error) {
    return <div className="text-center p-4 text-destructive">Erro ao carregar lançamentos.</div>
  }

  return (
    <div className="space-y-8">
      
      {/* Contas em Atraso Section */}
      {lateTransactions && lateTransactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            <h2 className="text-lg font-bold">Contas em Atraso</h2>
          </div>
          <TransactionTable 
            txs={sortedLateTransactions} 
            isLateSection={true} 
            updatingIds={updatingIds}
            isDeleting={isDeleting}
            isDuplicating={isDuplicating}
            onUpdateTitle={handleUpdateTitle}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={deleteTransaction}
            onDuplicate={duplicateTransaction}
          />
        </div>
      )}

      {/* Filtros Avançados */}
      <TransactionFiltersForm
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        filterType={filterType}
        setFilterType={setFilterType}
        filterGroup={filterGroup}
        setFilterGroup={setFilterGroup}
        showFilters={showFilters}
      />

      {/* Main View Area */}
      <div className="space-y-4">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold first-letter:capitalize">{ format(dateFrom, "MMMM 'de' yyyy", { locale: ptBR }) }</h2>
          
          <TransactionTabs viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center p-4 text-muted-foreground">Carregando lançamentos...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
            Nenhum lançamento encontrado neste período.
          </div>
        ) : viewMode === 'list' ? (
          <TransactionTable 
            txs={sortedTransactionsForList} 
            updatingIds={updatingIds}
            isDeleting={isDeleting}
            isDuplicating={isDuplicating}
            onUpdateTitle={handleUpdateTitle}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={deleteTransaction}
            onDuplicate={duplicateTransaction}
          />
        ) : viewMode === 'calendar' ? (
          <TransactionCalendar 
            transactions={transactions} 
            currentDate={parseISO(dateFrom)} 
            updatingIds={updatingIds}
            onMarkAsPaid={handleMarkAsPaid}
          />
        ) : (
          <TransactionDailyView 
            transactions={transactions}
            updatingIds={updatingIds}
            onMarkAsPaid={handleMarkAsPaid}
          />
        )}
      </div>

    </div>
  )
}
