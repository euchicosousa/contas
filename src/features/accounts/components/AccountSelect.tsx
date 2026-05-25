import * as React from 'react'
import { useAccounts } from '../hooks/useAccounts'

interface AccountSelectProps {
  value: string | null
  onChange: (value: string | null) => void
  transactionType?: 'entrada' | 'saida'
  disabled?: boolean
  id?: string
}

export function AccountSelect({ value, onChange, transactionType, disabled, id }: AccountSelectProps) {
  const { data: accounts, isLoading } = useAccounts()

  const flatTree = React.useMemo(() => {
    if (!accounts) return []

    // Filtra pelo tipo de transação se informado
    const typeAccounts = accounts.filter((acc) => {
      if (!transactionType) return true
      return acc.transaction_type === transactionType
    })

    const parents = typeAccounts.filter((acc) => !acc.parent_id)
    const children = typeAccounts.filter((acc) => acc.parent_id)

    const list: Array<{ id: string; name: string; isChild: boolean }> = []

    for (const parent of parents) {
      list.push({ id: parent.id, name: parent.name, isChild: false })
      const parentChildren = children.filter((child) => child.parent_id === parent.id)
      for (const child of parentChildren) {
        list.push({ id: child.id, name: child.name, isChild: true })
      }
    }

    // Adiciona órfãos (para consistência de dados)
    const parentIds = new Set(parents.map((p) => p.id))
    const orphans = children.filter((c) => !parentIds.has(c.parent_id!))
    for (const orphan of orphans) {
      list.push({ id: orphan.id, name: orphan.name, isChild: false })
    }

    return list
  }, [accounts, transactionType])

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
      <option value="">Selecione uma conta (Opcional)</option>
      {flatTree.map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.isChild ? `\u00A0\u00A0↳ ${acc.name}` : acc.name}
        </option>
      ))}
    </select>
  )
}
