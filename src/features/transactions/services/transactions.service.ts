import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '../types'

type Client = SupabaseClient<Database>

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
    if (!user.data.user) throw new Error('Usuário não autenticado')

    const rowsToInsert = inputs.map((input) => ({
      ...input,
      user_id: user.data.user!.id,
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
