import { Link } from '@tanstack/react-router'
import { PayButton } from './PayButton'
import { formatCurrency } from '#/lib/utils'

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
    ? 'text-sm gap-1 ' 
    : ' gap-2'

  
  return (
    <Link
      to="/transactions/$id/edit"
      params={{ id: tx.id }}
      className={`border-l-4 rounded bg-secondary text-foreground hover:bg-secondary/50 grid grid-cols-[1fr_auto] items-center transition-all  p-2 px-3 ${sizeClasses} ${
        isEntrada
          ? 'border-l-emerald-500'
          : 'border-l-rose-500'
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-medium truncate opacity-90 leading-tight">{tx.title}</span>
        <span className={`font-bold tabular-nums mt-0.5 ${
          isEntrada 
            ? 'text-emerald-600' 
            : 'text-rose-600'
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
