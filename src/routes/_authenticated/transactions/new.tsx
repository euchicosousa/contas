import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TransactionForm } from '#/features/transactions/components/TransactionForm'
import { useCreateTransaction, useCreateManyTransactions } from '#/features/transactions/hooks/useTransactions'

export const Route = createFileRoute('/_authenticated/transactions/new')({
  component: NewTransactionRoute,
})

function NewTransactionRoute() {
  const navigate = useNavigate()
  const { mutateAsync: createTransaction } = useCreateTransaction()
  const { mutateAsync: createManyTransactions } = useCreateManyTransactions()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Novo Lançamento</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados abaixo para registrar uma nova transação.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <TransactionForm
          onSubmit={async (values) => {
            if (Array.isArray(values)) {
              await createManyTransactions(values)
            } else {
              await createTransaction(values)
            }
            navigate({ to: '/transactions' })
          }}
        />
      </div>
    </div>
  )
}
