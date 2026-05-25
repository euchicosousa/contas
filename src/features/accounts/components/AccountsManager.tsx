import * as React from 'react'
import { useAccounts, useCreateAccount, useDeleteAccount } from '../hooks/useAccounts'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { WalletIcon, CornerDownRightIcon, Trash2Icon } from 'lucide-react'

export function AccountsManager() {
  const { data: accounts, isLoading } = useAccounts()
  const { mutateAsync: createAccount, isPending: isCreating } = useCreateAccount()
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount()

  const [newAccountName, setNewAccountName] = React.useState('')
  const [newAccountType, setNewAccountType] = React.useState<'entrada' | 'saida'>('saida')
  const [parentAccountId, setParentAccountId] = React.useState<string>('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Filtra as contas que podem ser pais (apenas contas do mesmo tipo que NÃO possuem pai)
  const availableParents = React.useMemo(() => {
    if (!accounts) return []
    return accounts.filter(
      (acc) => acc.transaction_type === newAccountType && !acc.parent_id
    )
  }, [accounts, newAccountType])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) return

    setErrorMsg(null)
    try {
      await createAccount({ 
        name: newAccountName.trim(),
        transaction_type: newAccountType,
        parent_id: parentAccountId || null
      })
      setNewAccountName('')
      setParentAccountId('')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Erro ao criar conta')
    }
  }

  // Agrupa contas hierarquicamente por tipo (entrada/saida)
  const structuredAccounts = React.useMemo(() => {
    if (!accounts) return { entradas: [], saidas: [] }

    const buildTree = (type: 'entrada' | 'saida') => {
      const typeAccounts = accounts.filter((acc) => acc.transaction_type === type)
      const roots = typeAccounts.filter((acc) => !acc.parent_id)
      const children = typeAccounts.filter((acc) => acc.parent_id)

      const tree: Array<{ account: typeof accounts[0]; children: typeof accounts }> = []

      for (const root of roots) {
        const rootChildren = children.filter((child) => child.parent_id === root.id)
        tree.push({ account: root, children: rootChildren })
      }

      // Adiciona órfãos (caso haja alguma inconsistência de dados)
      const rootIds = new Set(roots.map((r) => r.id))
      const orphans = children.filter((child) => !rootIds.has(child.parent_id!))
      for (const orphan of orphans) {
        tree.push({ account: orphan, children: [] })
      }

      return tree
    }

    return {
      entradas: buildTree('entrada'),
      saidas: buildTree('saida'),
    }
  }, [accounts])

  const renderAccountItem = (acc: any, isChild = false) => {
    return (
      <div key={acc.id} className={`flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors ${isChild ? 'pl-8 border-l-2 border-muted/50 bg-muted/5' : ''}`}>
        <div className="flex items-center gap-3">
          {isChild ? (
            <CornerDownRightIcon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          ) : (
            <WalletIcon className="h-4 w-4 text-primary/70 shrink-0" />
          )}
          <span className={isChild ? 'text-sm font-medium text-foreground' : 'font-semibold text-foreground'}>
            {acc.name}
          </span>
          {!isChild && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
              acc.transaction_type === 'entrada' 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                : 'bg-destructive/15 text-destructive'
            }`}>
              {acc.transaction_type === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const confirmMsg = isChild 
              ? 'Excluir esta subconta? Os lançamentos dela ficarão sem conta.'
              : 'Excluir esta conta? Subcontas associadas perderão o vínculo e os lançamentos ficarão sem conta.'
            if (window.confirm(confirmMsg)) {
              deleteAccount(acc.id)
            }
          }}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          title="Excluir Conta"
        >
          <Trash2Icon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const renderAccountSection = (title: string, items: typeof structuredAccounts.entradas) => {
    if (items.length === 0) {
      return (
        <div className="p-6 text-center text-sm text-muted-foreground border-b last:border-b-0">
          Nenhuma conta de {title.toLowerCase()} cadastrada.
        </div>
      )
    }

    return (
      <div className="divide-y">
        {items.map(({ account, children }) => (
          <div key={account.id} className="flex flex-col">
            {renderAccountItem(account, false)}
            {children.map((child) => renderAccountItem(child, true))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden gap-6">
      <div className="flex-1 w-full flex flex-col overflow-hidden rounded-lg border bg-card">
        {/* Formulário de Criação */}
        <div className="p-5 border-b bg-muted/20 space-y-4 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setNewAccountType('saida')
                setParentAccountId('')
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-bold transition-all duration-200 border ${
                newAccountType === 'saida'
                  ? 'bg-destructive/15 text-destructive border-destructive/30 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
              }`}
            >
              Conta de Saída (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setNewAccountType('entrada')
                setParentAccountId('')
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-bold transition-all duration-200 border ${
                newAccountType === 'entrada'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
              }`}
            >
              Conta de Entrada (+)
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="account-name">Nome da Conta</Label>
                <Input
                  id="account-name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ex: Compras, Cartão de Crédito, Aluguel"
                  className="flex-1"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parent-account">Conta Pai (Opcional - para Subconta)</Label>
                <select
                  id="parent-account"
                  value={parentAccountId}
                  onChange={(e) => setParentAccountId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhuma (Esta será uma conta principal)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isCreating || !newAccountName.trim()} className="w-full">
              {isCreating ? 'Adicionando...' : 'Adicionar Conta'}
            </Button>
          </form>
          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-2.5 rounded">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Listagem de Contas */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground shrink-0">Carregando contas...</div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y w-full">
            <div>
              <div className="px-4 py-2 bg-muted/40 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b">
                Contas de Saída
              </div>
              {renderAccountSection('Saída', structuredAccounts.saidas)}
            </div>

            <div>
              <div className="px-4 py-2 bg-muted/40 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-t">
                Contas de Entrada
              </div>
              {renderAccountSection('Entrada', structuredAccounts.entradas)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
