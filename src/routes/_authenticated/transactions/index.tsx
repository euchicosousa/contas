import { createFileRoute, Link } from '@tanstack/react-router'
import { TransactionList } from '#/features/transactions/components/TransactionList'
import { buttonVariants, Button } from '#/components/ui/button'
import { Plus, FilterIcon } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: TransactionsRoute,
})

function TransactionsRoute() {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden gap-6">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Link to="/transactions/new" className={buttonVariants({ className: "flex items-center gap-2" })}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Novo</span>
          </Link>
        </div>
      </div>

      <TransactionList showFilters={showFilters} />
    </div>
  )
}
