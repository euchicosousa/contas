import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from 'lucide-react'
import { useDashboardSummary } from '#/features/transactions/hooks/useDashboardSummary'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { buttonVariants } from '#/components/ui/button'
import { formatCurrency } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardRoute,
})

function DashboardRoute() {
  const { income, expense, balance, recentTransactions, isLoading } = useDashboardSummary()

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">Carregando painel...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Card: Saldo Total */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <WalletIcon className="h-4 w-4" />
            Saldo Atual
          </div>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
        </div>

        {/* Card: Receitas */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
            Receitas
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income)}
          </div>
        </div>

        {/* Card: Despesas */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
            Despesas
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(expense)}
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Últimas Transações</h2>
        <div className="rounded-lg border bg-card overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border-dashed border rounded-lg m-4">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-muted-foreground w-24">
                      {format(parseISO(tx.payment_date), "dd MMM", { locale: ptBR })}
                    </td>
                    <td className="p-4 font-medium">{tx.title}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className={tx.transaction_type === 'entrada' ? 'text-emerald-500 font-medium' : 'text-foreground'}>
                        {tx.transaction_type === 'entrada' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {recentTransactions.length > 0 && (
          <div className="flex justify-center mt-4">
            <Link to="/transactions" className={buttonVariants({ variant: "outline" })}>
              Ver todas as transações
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
