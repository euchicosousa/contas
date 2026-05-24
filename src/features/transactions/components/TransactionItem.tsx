import { Link } from '@tanstack/react-router'
import { PayButton } from './PayButton'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface TransactionItemProps {
  tx: any
  updatingIds: Set<string>
  onMarkAsPaid: (tx: any) => void
  size?: 'sm' | 'md'
}

export function TransactionItem({
  tx,
  updatingIds,
  onMarkAsPaid,
  size = 'md',
}: TransactionItemProps) {
  const isEntrada = tx.transaction_type === 'entrada'

  const sizeClasses = size === 'sm' 
    ? 'text-sm rounded-md gap-1' 
    : 'rounded-lg gap-2'

  
  return (
    <Link
      to="/transactions/$id/edit"
      params={{ id: tx.id }}
      className={` grid grid-cols-[1fr_auto] items-center transition-all  p-2 px-3 ${sizeClasses} ${
        isEntrada
          ? 'bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-100'
          : 'bg-red-500/10 hover:bg-red-500/20 text-red-900 dark:text-red-100'
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-medium truncate opacity-90 leading-tight">{tx.title}</span>
        <span className={`font-bold tabular-nums mt-0.5 ${
          isEntrada 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : 'text-rose-600 dark:text-rose-400'
        }`}>
          {formatCurrency(tx.amount)}
        </span>
      </div>

      <PayButton 
        tx={tx}
        isUpdating={updatingIds.has(tx.id)}
        onMarkAsPaid={onMarkAsPaid}
        variant="circle"
      />
    </Link>
  )
}
