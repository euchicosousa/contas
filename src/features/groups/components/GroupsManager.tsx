import * as React from 'react'
import { useGroups, useCreateGroup, useDeleteGroup } from '../hooks/useGroups'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { FolderIcon, Trash2Icon } from 'lucide-react'

export function GroupsManager() {
  const { data: groups, isLoading } = useGroups()
  const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup()
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup()

  const [newGroupName, setNewGroupName] = React.useState('')
  const [newGroupType, setNewGroupType] = React.useState<'entrada' | 'saida'>('saida')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setErrorMsg(null)
    try {
      await createGroup({ 
        name: newGroupName.trim(),
        transaction_type: newGroupType 
      })
      setNewGroupName('')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Erro ao criar grupo')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/20 space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setNewGroupType('saida')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 px-4 text-xs font-semibold transition-all duration-200 border ${
                newGroupType === 'saida'
                  ? 'bg-destructive/15 text-destructive border-destructive/30 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
              }`}
            >
              Pasta de Saída (-)
            </button>
            <button
              type="button"
              onClick={() => setNewGroupType('entrada')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 px-4 text-xs font-semibold transition-all duration-200 border ${
                newGroupType === 'entrada'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
              }`}
            >
              Pasta de Entrada (+)
            </button>
          </div>

          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome da nova pasta (ex: Casa)"
              className="flex-1"
            />
            <Button type="submit" disabled={isCreating || !newGroupName.trim()}>
              {isCreating ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </form>
          {errorMsg && (
            <div className="mt-3 text-sm text-destructive bg-destructive/10 p-2 rounded">
              {errorMsg}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando grupos...</div>
        ) : !groups || groups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma pasta cadastrada.
          </div>
        ) : (
          <ul className="divide-y">
            {groups.map((group) => (
              <li key={group.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{group.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    group.transaction_type === 'entrada' 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-destructive/15 text-destructive'
                  }`}>
                    {group.transaction_type === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Excluir esta pasta? Os lançamentos dela ficarão sem pasta.')) {
                      deleteGroup(group.id)
                    }
                  }}
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Excluir Pasta"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
