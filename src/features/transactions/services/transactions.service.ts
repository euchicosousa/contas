import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '../types'

type Client = SupabaseClient<Database>

function buildInstallmentId(userId: string): string {
  const ts = Date.now().toString(16).padStart(12, '0')          // 12 hex chars
  const uFragment = userId.replace(/-/g, '').slice(0, 8)        // 8 hex chars
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(16).padStart(2, '0')).join('')         // 12 hex chars
  const hex = ts + uFragment + rand                             // 32 chars total
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

export const transactionsService = {
  /**
   * Lista todas as transações do usuário autenticado.
   * Suporta filtros opcionais por tipo, conta e data.
   */
  async list(client: Client, filters?: TransactionFilters): Promise<Transaction[]> {
    let query = client
      .from('transactions')
      .select('*')
      .order('payment_date', { ascending: false })

    if (filters?.type) {
      query = query.eq('transaction_type', filters.type)
    }
    if (filters?.groupIds && filters.groupIds.length > 0) {
      query = query.in('group_id', filters.groupIds)
    } else if (filters?.groupId !== undefined) {
      query = filters.groupId === null
        ? query.is('group_id', null)
        : query.eq('group_id', filters.groupId)
    }
    if (filters?.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('payment_date', filters.dateTo)
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Busca contas de saída atrasadas (is_paid = false e payment_date < hoje).
   */
  async getLateTransactions(client: Client): Promise<Transaction[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('transaction_type', 'saida')
      .eq('is_paid', false)
      .lt('payment_date', today)
      .order('payment_date', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Busca uma transação pelo ID.
   */
  async getById(client: Client, id: string): Promise<Transaction> {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria uma nova transação.
   * O user_id é preenchido automaticamente via RLS no Supabase.
   */
  async create(client: Client, input: CreateTransactionInput): Promise<Transaction> {
    const user = await client.auth.getUser()
    if (!user.data.user) throw new Error('Usuário não autenticado')

    const { data, error } = await client
      .from('transactions')
      .insert({
        ...input,
        user_id: user.data.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria múltiplas transações em lote (útil para parcelamentos).
   */
  async createMany(client: Client, inputs: CreateTransactionInput[]): Promise<Transaction[]> {
    const user = await client.auth.getUser()
    const userId = user.data.user?.id
    if (!userId) throw new Error('Usuário não autenticado')

    const isInstallmentBatch = inputs.some((i) => i.installment_index != null)
    const sharedInstallmentId = isInstallmentBatch
      ? buildInstallmentId(userId)
      : null

    const rowsToInsert = inputs.map((input) => ({
      ...input,
      user_id: userId,
      ...(sharedInstallmentId ? { installment_id: sharedInstallmentId } : {}),
    }))

    const { data, error } = await client
      .from('transactions')
      .insert(rowsToInsert)
      .select()

    if (error) throw error
    return data
  },

  /**
   * Atualiza uma transação existente.
   */
  async update(client: Client, id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const { data, error } = await client
      .from('transactions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Atualiza as transações irmãs do mesmo parcelamento.
   */
  async updateInstallmentSiblings(
    client: Client,
    sourceId: string,
    installmentId: string,
    patch: {
      title?: string
      group_id?: string | null
      amount?: number
      notes?: string | null
    }
  ): Promise<void> {
    const { error } = await client
      .from('transactions')
      .update(patch)
      .eq('installment_id', installmentId)
      .neq('id', sourceId)

    if (error) throw error
  },

  /**
   * Remove uma transação.
   */
  async remove(client: Client, id: string): Promise<void> {
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
