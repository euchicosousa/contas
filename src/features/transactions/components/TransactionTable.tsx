import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from '@tanstack/react-router'
import { CopyIcon, Edit2Icon, Trash2Icon } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { PayButton } from './PayButton'

function InlineEditableTitle({ 
  initialTitle, 
  onSave, 
  disabled 
}: { 
  initialTitle: string, 
  onSave: (newTitle: string) => void,
  disabled: boolean
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [title, setTitle] = React.useState(initialTitle)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    setIsEditing(false)
    if (title.trim() && title !== initialTitle) {
      onSave(title.trim())
    } else {
      setTitle(initialTitle)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') {
            setTitle(initialTitle)
            setIsEditing(false)
          }
        }}
        disabled={disabled}
        className="w-full h-7 text-sm py-1 px-2 -ml-2 font-medium"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      disabled={disabled}
      className="font-medium text-foreground hover:bg-muted/50 rounded -ml-2 px-2 py-0.5 transition-colors text-left disabled:opacity-50"
    >
      {title}
    </button>
  )
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface TransactionTableProps {
  txs: any[]
  isLateSection?: boolean
  updatingIds: Set<string>
  isDuplicating: boolean
  isDeleting: boolean
  onUpdateTitle: (id: string, title: string) => void
  onMarkAsPaid: (tx: any) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function TransactionTable({ 
  txs, 
  isLateSection = false,
  updatingIds,
  isDuplicating,
  isDeleting,
  onUpdateTitle,
  onMarkAsPaid,
  onDuplicate,
  onDelete
}: TransactionTableProps) {
  return (
    <div className={`rounded-lg border overflow-hidden ${isLateSection ? 'border-destructive/30 shadow-sm' : 'bg-card'}`}>
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className={`border-b text-left text-muted-foreground ${isLateSection ? 'bg-destructive/10 text-destructive' : 'bg-muted/50'}`}>
            <th className="p-4 font-medium w-20 sm:w-24">Data</th>
            <th className="p-4 font-medium">Título</th>
            <th className="p-4 font-medium text-right w-24 sm:w-28">Valor</th>
            <th className="p-4 font-medium w-40 sm:w-44 text-center">Status / Ações</th>
          </tr>
        </thead>
        <tbody className="group">
          {txs.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted-foreground border-b last:border-0 border-dashed">
                Nenhum lançamento registrado.
              </td>
            </tr>
          ) : (
            txs.map((tx) => (
              <tr key={tx.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors group/row ${isLateSection ? 'bg-destructive/5' : ''}`}>
              <td className="p-4 whitespace-nowrap">
                {format(parseISO(tx.payment_date), "dd 'de' MMM", { locale: ptBR })}
              </td>
              <td className="p-4">
                <InlineEditableTitle 
                  initialTitle={tx.title} 
                  onSave={(newTitle) => onUpdateTitle(tx.id, newTitle)}
                  disabled={updatingIds.has(tx.id)}
                />
                {tx.categories && tx.categories.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {tx.categories.join(', ')}
                  </div>
                )}
              </td>
              <td className="p-4 text-right whitespace-nowrap">
                <span className={tx.transaction_type === 'entrada' ? 'text-emerald-500 font-medium' : 'text-foreground'}>
                  {tx.transaction_type === 'entrada' ? '+' : '-'} 
                  {formatCurrency(tx.amount)}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end">
                  {/* Status Area */}
                  <div className="w-[110px] flex justify-end items-center mr-3 h-7">
                    <PayButton 
                      tx={tx}
                      isUpdating={updatingIds.has(tx.id)}
                      onMarkAsPaid={onMarkAsPaid}
                      variant="table"
                    />
                  </div>
                  
                  {/* Actions Area */}
                  <div className="flex items-center gap-2 border-l pl-3">
                    <button
                      onClick={() => onDuplicate(tx.id)}
                      disabled={isDuplicating}
                      className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      title="Duplicar"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                    <Link to="/transactions/$id/edit" params={{ id: tx.id }} className="text-muted-foreground hover:text-primary transition-colors" title="Editar">
                      <Edit2Icon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
                          onDelete(tx.id)
                        }
                      }}
                      disabled={isDeleting}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  )
}
