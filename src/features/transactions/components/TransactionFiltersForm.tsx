import { DatePickerWithRange } from '#/components/ui/date-range-picker'
import { AccountSelect } from '#/features/accounts/components/AccountSelect'
import { FilterIcon } from 'lucide-react'

interface TransactionFiltersFormProps {
  dateFrom: string
  dateTo: string
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  filterType: 'entrada' | 'saida' | 'todos'
  setFilterType: (type: 'entrada' | 'saida' | 'todos') => void
  filterGroup: string | null
  setFilterGroup: (group: string | null) => void
  showFilters: boolean
}

export function TransactionFiltersForm({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  filterType,
  setFilterType,
  filterGroup,
  setFilterGroup,
  showFilters,
}: TransactionFiltersFormProps) {
  if (!showFilters) return null

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border animate-in fade-in duration-200">
      <div className="hidden md:flex pt-5">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Período</label>
          <DatePickerWithRange 
            dateFrom={dateFrom} 
            dateTo={dateTo} 
            onSelect={({ from, to }) => {
              setDateFrom(from)
              setDateTo(to)
            }} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="saida">Saídas (-)</option>
            <option value="entrada">Entradas (+)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Conta</label>
          <AccountSelect
            value={filterGroup}
            onChange={setFilterGroup}
            transactionType={filterType !== 'todos' ? filterType : undefined}
          />
        </div>
      </div>
    </div>
  )
}
