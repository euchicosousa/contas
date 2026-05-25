import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { AccountSelect } from '#/features/accounts/components/AccountSelect'
import type { CreateTransactionInput } from '../types'
import { addMonths, format, parseISO } from 'date-fns'
import { Calendar } from '#/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import { cn } from '#/lib/utils'

interface TransactionFormProps {
  defaultValues?: Partial<CreateTransactionInput>
  onSubmit: (values: CreateTransactionInput | CreateTransactionInput[]) => Promise<void>
}

export function TransactionForm({ defaultValues, onSubmit }: TransactionFormProps) {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [installments, setInstallments] = React.useState<number>(1)
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? '',
      amount: defaultValues?.amount ?? 0,
      amount_paid: defaultValues?.amount_paid ?? 0,
      payment_date: defaultValues?.payment_date ?? new Date().toISOString().split('T')[0],
      transaction_type: defaultValues?.transaction_type ?? 'saida',
      notes: defaultValues?.notes ?? '',
      group_id: defaultValues?.group_id ?? null,
      is_paid: defaultValues?.is_paid ?? false,
    } as CreateTransactionInput,
    onSubmit: async ({ value }) => {
      setErrorMsg(null)
      try {
        // Se o valor pago for igual ou maior que o total (e maior que zero), marcamos automaticamente como pago.
        // Se marcado como pago, garantir que o valor pago é igual ao total.
        // Se não pago, garantir que o valor pago não ultrapassa o total para evitar violação de constraint do banco.
        const isPaid = value.is_paid || ((value.amount_paid ?? 0) >= value.amount && value.amount > 0)
        const finalValue = {
          ...value,
          is_paid: isPaid,
          amount_paid: isPaid ? value.amount : Math.min(value.amount_paid ?? 0, value.amount)
        }

        if (finalValue.transaction_type === 'saida' && installments > 1) {
          const generated: CreateTransactionInput[] = []
          const [year, month, day] = finalValue.payment_date.split('-').map(Number)
          
          for (let i = 1; i <= installments; i++) {
            const installmentDate = addMonths(new Date(year, month - 1, day), i - 1)
            generated.push({
              ...finalValue,
              title: `${finalValue.title} (${i}/${installments})`,
              payment_date: format(installmentDate, 'yyyy-MM-dd'),
            })
          }
          await onSubmit(generated)
        } else {
          await onSubmit(finalValue)
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao salvar transação')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        {/* Tipo */}
        <form.Field
          name="transaction_type"
          children={(field) => (
            <div className="space-y-3">
              <Label>Tipo de Lançamento</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => field.handleChange('saida')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-sm font-semibold transition-all duration-200 border ${
                    field.state.value === 'saida'
                      ? 'bg-destructive/15 text-destructive border-destructive/30 shadow-sm'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  }`}
                >
                  Saída (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.handleChange('entrada')
                    setInstallments(1) // Reset if entry
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-sm font-semibold transition-all duration-200 border ${
                    field.state.value === 'entrada'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                      : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                  }`}
                >
                  Entrada (+)
                </button>
              </div>
            </div>
          )}
        />

        <form.Field
          name="title"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Título</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ex: Conta de Luz"
                required
              />
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="amount"
            children={(field) => (
              <div className="space-y-2">
                <form.Subscribe
                  selector={(state) => state.values.transaction_type}
                  children={(type) => (
                    <Label htmlFor={field.name}>
                      Valor {type === 'saida' && installments > 1 ? 'da Parcela (R$)' : '(R$)'}
                    </Label>
                  )}
                />
                <Input
                  id={field.name}
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="payment_date"
            children={(field) => {
              const dateVal = field.state.value ? parseISO(field.state.value) : undefined
              return (
                <div className="space-y-2 flex flex-col justify-end">
                  <Label htmlFor={field.name}>Data de Pagamento</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal px-3",
                            !field.state.value && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {field.state.value ? (
                        format(parseISO(field.state.value), "dd 'de' MMMM', 'yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateVal}
                        onSelect={(date) => {
                          if (date) {
                            field.handleChange(format(date, 'yyyy-MM-dd'))
                            setIsCalendarOpen(false)
                          }
                        }}
                        locale={ptBR}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )
            }}
          />
        </div>

        <form.Field
          name="is_paid"
          children={(field) => (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={field.name}
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <Label htmlFor={field.name} className="font-medium cursor-pointer">
                  Lançamento já está pago / concluído
                </Label>
              </div>
              {!field.state.value && (
                <form.Field
                  name="amount_paid"
                  children={(amountPaidField) => (
                    <div className="ml-6 space-y-1.5 bg-muted/30 p-3 rounded-md border">
                      <Label htmlFor={amountPaidField.name} className="text-xs text-muted-foreground">Valor pago parcial (se houver)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">R$</span>
                        <Input
                          id={amountPaidField.name}
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountPaidField.state.value || ''}
                          onBlur={amountPaidField.handleBlur}
                          onChange={(e) => amountPaidField.handleChange(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-32 h-8"
                        />
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.transaction_type}
          children={(type) => 
            type === 'saida' ? (
              <div className="space-y-2">
                <Label htmlFor="installments">Quantidade de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  max="72"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
                {installments > 1 && (
                  <form.Subscribe
                    selector={(state) => state.values.amount}
                    children={(amount) => (
                      <p className="text-xs text-muted-foreground mt-1">
                        Serão gerados {installments} lançamentos de R$ {(amount || 0).toFixed(2)} cada.
                      </p>
                    )}
                  />
                )}
              </div>
            ) : null
          }
        />

        <form.Field
          name="notes"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Observações</Label>
              <Input
                id={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Detalhes adicionais (opcional)"
              />
            </div>
          )}
        />
        
        <form.Field
          name="group_id"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Conta</Label>
              <form.Subscribe
                selector={(state) => state.values.transaction_type}
                children={(type) => (
                  <AccountSelect
                    id={field.name}
                    value={field.state.value ?? null}
                    onChange={field.handleChange}
                    transactionType={type}
                    disabled={form.state.isSubmitting}
                  />
                )}
              />
            </div>
          )}
        />
      </div>

      {errorMsg && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={() => window.history.back()}
          disabled={form.state.isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
