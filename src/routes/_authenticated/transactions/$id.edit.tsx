import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TransactionForm } from '#/features/transactions/components/TransactionForm'
import { useTransaction, useUpdateTransaction, useUpdateInstallmentSiblings } from '#/features/transactions/hooks/useTransactions'

export const Route = createFileRoute('/_authenticated/transactions/$id/edit')({
  component: EditTransactionRoute,
})

function EditTransactionRoute() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  
  const { data: transaction, isLoading, error } = useTransaction(id)
  const { mutateAsync: updateTransaction } = useUpdateTransaction()
  const { mutateAsync: updateInstallmentSiblings } = useUpdateInstallmentSiblings()

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">Carregando transação...</div>
  }

  if (error || !transaction) {
    return <div className="text-center p-8 text-destructive">Transação não encontrada ou erro ao carregar.</div>
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Editar Lançamento</h1>
        <p className="text-sm text-muted-foreground">
          Modifique os dados da transação abaixo.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <TransactionForm
          defaultValues={{
            title: transaction.title,
            amount: transaction.amount,
            amount_paid: transaction.amount_paid,
            payment_date: transaction.payment_date,
            transaction_type: transaction.transaction_type,
            notes: transaction.notes,
            group_id: transaction.group_id,
            is_paid: transaction.is_paid,
          }}
          onSubmit={async (values) => {
            if (Array.isArray(values)) return
            await updateTransaction({ id, ...values })
            if (transaction.installment_id) {
              await updateInstallmentSiblings({
                sourceId: id,
                installmentId: transaction.installment_id,
                patch: {
                  title: values.title,
                  group_id: values.group_id,
                  amount: values.amount,
                  notes: values.notes,
                },
              })
            }
            navigate({ to: '/transactions' })
          }}
        />
      </div>
    </div>
  )
}
