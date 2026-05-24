import { useGroups } from '../hooks/useGroups'

interface GroupSelectProps {
  value: string | null
  onChange: (value: string | null) => void
  transactionType?: 'entrada' | 'saida'
  disabled?: boolean
  id?: string
}

export function GroupSelect({ value, onChange, transactionType, disabled, id }: GroupSelectProps) {
  const { data: groups, isLoading } = useGroups()

  // Filtra as pastas pelo tipo de transação selecionado
  const filteredGroups = groups?.filter((group) => {
    if (!transactionType) return true // Se não tiver filtro, mostra todas
    return group.transaction_type === transactionType
  })

  return (
    <select
      id={id}
      value={value || ''}
      onChange={(e) => {
        const val = e.target.value
        onChange(val === '' ? null : val)
      }}
      disabled={disabled || isLoading}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Selecione uma pasta (Opcional)</option>
      {filteredGroups?.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  )
}
