import { useNavigate, useSearch } from '@tanstack/react-router'
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, FolderTree } from 'lucide-react'
import * as React from 'react'
import { useDeleteTransaction, useDuplicateTransaction, useTransactions, useUpdateTransaction } from '../hooks/useTransactions'
import { useAccounts } from '#/features/accounts/hooks/useAccounts'
import { TransactionCalendar } from './TransactionCalendar'
import { TransactionDailyView } from './TransactionDailyView'
import { TransactionTable } from './TransactionTable'
import { TransactionTabs } from './TransactionTabs'
import { TransactionFiltersForm } from './TransactionFiltersForm'
import { ptBR } from 'date-fns/locale'

function sortTransactions(a: any, b: any) {
  const dateA = a.payment_date || ''
  const dateB = b.payment_date || ''
  if (dateA !== dateB) return dateA.localeCompare(dateB)
  return (a.title || '').localeCompare(b.title || '')
}

export function TransactionList({ showFilters = false }: { showFilters?: boolean }) {
  const today = new Date()
  const [dateFrom, setDateFrom] = React.useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = React.useState(format(endOfMonth(today), 'yyyy-MM-dd'))
  const [filterType, setFilterType] = React.useState<'entrada' | 'saida' | 'todos'>('todos')
  const [filterGroup, setFilterGroup] = React.useState<string | null>(null)

  const { data: accounts } = useAccounts()

  const [isGrouped, setIsGrouped] = React.useState(true)

  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as any
  const viewMode = search.view === 'calendar' ? 'calendar' : search.view === 'daily' ? 'daily' : 'list'

  const setViewMode = (mode: 'list' | 'calendar' | 'daily') => {
    navigate({
      search: (prev: any) => ({ ...prev, view: mode }),
    } as any)
  }

  const groupIds = React.useMemo(() => {
    if (!filterGroup) return undefined
    if (!accounts) return [filterGroup]
    
    // Busca contas filhas associadas a essa conta pai
    const children = accounts.filter(acc => acc.parent_id === filterGroup)
    return [filterGroup, ...children.map(c => c.id)]
  }, [filterGroup, accounts])

  const filters = {
    dateFrom,
    dateTo,
    ...(filterType !== 'todos' ? { type: filterType as 'entrada' | 'saida' } : {}),
    ...(groupIds ? { groupIds } : {}),
  }

  const { data: transactions, isLoading, error } = useTransactions(filters)

  const { entradas, saidas } = React.useMemo(() => {
    if (!transactions) return { entradas: [], saidas: [] }
    const entradas = transactions.filter(t => t.transaction_type === 'entrada').sort(sortTransactions)
    const saidas = transactions.filter(t => t.transaction_type !== 'entrada').sort(sortTransactions)
    return { entradas, saidas }
  }, [transactions])

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
    <div className="flex-1 w-full flex flex-col overflow-hidden gap-6">

      {/* Filtros Avançados */}
      <div className="shrink-0">
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
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => {
                const nextDate = addMonths(parseISO(dateFrom), -1)
                setDateFrom(format(startOfMonth(nextDate), 'yyyy-MM-dd'))
                setDateTo(format(endOfMonth(nextDate), 'yyyy-MM-dd'))
              }}
              className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <h2 className="text-lg font-bold first-letter:capitalize min-w-[140px] text-center">
              {format(parseISO(dateFrom), "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextDate = addMonths(parseISO(dateFrom), 1)
                setDateFrom(format(startOfMonth(nextDate), 'yyyy-MM-dd'))
                setDateTo(format(endOfMonth(nextDate), 'yyyy-MM-dd'))
              }}
              className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {viewMode === 'list' && (
              <button
                type="button"
                onClick={() => setIsGrouped(!isGrouped)}
                className={`flex items-center justify-center p-2 rounded-md border shadow-sm transition-all cursor-pointer ${
                  isGrouped
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(0,0,0,0.1)]'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
                title={isGrouped ? 'Desagrupar Contas (Visualização Plana)' : 'Agrupar por Conta'}
              >
                <FolderTree className="h-4 w-4" />
              </button>
            )}
            <TransactionTabs viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center p-4 text-muted-foreground flex-1 flex items-center justify-center">Carregando lançamentos...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground flex-1 flex flex-col justify-center items-center">
            Nenhum lançamento encontrado neste período.
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full overflow-hidden items-stretch">
            {/* Tabela de Entradas */}
            <div className="flex flex-col h-full overflow-hidden space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pl-1 shrink-0">
                Entradas (+)
              </h3>
              <TransactionTable 
                txs={entradas} 
                isGrouped={isGrouped}
                updatingIds={updatingIds}
                isDeleting={isDeleting}
                isDuplicating={isDuplicating}
                onUpdateTitle={handleUpdateTitle}
                onMarkAsPaid={handleMarkAsPaid}
                onDelete={deleteTransaction}
                onDuplicate={duplicateTransaction}
              />
            </div>

            {/* Tabela de Saídas */}
            <div className="flex flex-col h-full overflow-hidden space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 pl-1 shrink-0">
                Saídas (-)
              </h3>
              <TransactionTable 
                txs={saidas} 
                isGrouped={isGrouped}
                updatingIds={updatingIds}
                isDeleting={isDeleting}
                isDuplicating={isDuplicating}
                onUpdateTitle={handleUpdateTitle}
                onMarkAsPaid={handleMarkAsPaid}
                onDelete={deleteTransaction}
                onDuplicate={duplicateTransaction}
              />
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="flex-1 overflow-auto">
            <TransactionCalendar 
              transactions={transactions} 
              currentDate={parseISO(dateFrom)} 
              updatingIds={updatingIds}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <TransactionDailyView 
              transactions={transactions}
              updatingIds={updatingIds}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </div>
        )}
      </div>

    </div>
  )
}
