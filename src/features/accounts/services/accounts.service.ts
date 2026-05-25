import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'
import type {
  TransactionAccount,
  CreateAccountInput,
  UpdateAccountInput,
} from '../types'

type Client = SupabaseClient<Database>

export const accountsService = {
  /**
   * Lista todas as contas do usuário autenticado, ordenadas por nome.
   */
  async list(client: Client): Promise<TransactionAccount[]> {
    const { data, error } = await client
      .from('transaction_groups')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Busca uma conta pelo ID.
   */
  async getById(client: Client, id: string): Promise<TransactionAccount> {
    const { data, error } = await client
      .from('transaction_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria uma nova conta.
   */
  async create(client: Client, input: CreateAccountInput): Promise<TransactionAccount> {
    const user = await client.auth.getUser()
    if (!user.data.user) throw new Error('Usuário não autenticado')

    const { data, error } = await client
      .from('transaction_groups')
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
   * Atualiza uma conta existente.
   */
  async update(client: Client, id: string, input: UpdateAccountInput): Promise<TransactionAccount> {
    const { data, error } = await client
      .from('transaction_groups')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove uma conta. Transações vinculadas ficam com group_id = null (FK nullable).
   */
  async remove(client: Client, id: string): Promise<void> {
    const { error } = await client
      .from('transaction_groups')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
