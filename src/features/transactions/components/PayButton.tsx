
import { CheckIcon, AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { Button } from '#/components/ui/button'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface PayButtonProps {
  tx: any
  isUpdating: boolean
  onMarkAsPaid: (tx: any) => void
  variant?: 'table' | 'circle'
}

export function PayButton({ 
  tx, 
  isUpdating, 
  onMarkAsPaid, 
  variant = 'table' 
}: PayButtonProps) {
  const isLate = !tx.is_paid && new Date(tx.payment_date) < new Date(new Date().setHours(0,0,0,0))

  if (variant === 'circle') {
    if (tx.is_paid) {
      return (
        <div 
          className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shrink-0" 
          title="Pago"
        >
          <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMarkAsPaid(tx)
        }}
        disabled={isUpdating}
        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-all hover:scale-110 focus:outline-none disabled:opacity-50 group border-2 ${
          isLate 
            ? 'bg-amber-500 border-amber-500 text-white hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-500' 
            : 'border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-transparent hover:text-emerald-500 bg-background'
        }`}
        title={isLate ? "Atrasado - Clique para Pagar" : "Pendente - Clique para Pagar"}
      >
        {isLate ? (
          <>
            <AlertTriangleIcon className="w-3 h-3 text-white block group-hover:hidden" strokeWidth={2.5} />
            <CheckIcon className="w-3 h-3 text-current hidden group-hover:block" strokeWidth={3} />
          </>
        ) : (
          <CheckIcon className="w-3 h-3 text-current" strokeWidth={3} />
        )}
      </button>
    )
  }

  // --- Table Variant ---
  if (tx.is_paid) {
    return (
      <span className="text-emerald-600 text-xs font-semibold px-2 flex items-center gap-1">
        <CheckCircle2Icon className="h-3 w-3" /> Pago
      </span>
    )
  }

  return (
    <div className="flex items-center justify-end w-full h-full">
      {tx.amount_paid > 0 && (
        <span 
          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-2 py-0.5 rounded flex sm:group-hover/row:hidden"
          title="Valor pago parcialmente"
        >
          Pago: {formatCurrency(tx.amount_paid)}
        </span>
      )}
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMarkAsPaid(tx)
        }}
        disabled={isUpdating}
        className={`h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-3 shadow-sm transition-all duration-200 ${
          tx.amount_paid > 0 
            ? 'flex sm:hidden sm:group-hover/row:flex'
            : 'opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100'
        }`}
      >
        <CheckCircle2Icon className="h-3.5 w-3.5" /> Pagar
      </Button>
    </div>
  )
}
