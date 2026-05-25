import { createFileRoute } from '@tanstack/react-router'
import { AccountsManager } from '#/features/accounts/components/AccountsManager'

export const Route = createFileRoute('/_authenticated/accounts/')({
  component: AccountsRoute,
})

function AccountsRoute() {
  return (
    <div className="mx-auto max-w-2xl w-full flex-1 flex flex-col overflow-hidden gap-6">
      <div className="space-y-2 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
        <p className="text-sm text-muted-foreground">
          Organize seus lançamentos agrupando-os em contas e subcontas personalizadas.
        </p>
      </div>

      <AccountsManager />
    </div>
  )
}
