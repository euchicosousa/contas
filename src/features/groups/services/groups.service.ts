import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'
import type {
  TransactionGroup,
  CreateGroupInput,
  UpdateGroupInput,
} from '../types'

type Client = SupabaseClient<Database>

export const groupsService = {
  /**
   * Lista todos os grupos do usuário autenticado, ordenados por nome.
   */
  async list(client: Client): Promise<TransactionGroup[]> {
    const { data, error } = await client
      .from('transaction_groups')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Busca um grupo pelo ID.
   */
  async getById(client: Client, id: string): Promise<TransactionGroup> {
    const { data, error } = await client
      .from('transaction_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Cria um novo grupo.
   */
  async create(client: Client, input: CreateGroupInput): Promise<TransactionGroup> {
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
   * Atualiza um grupo existente.
   */
  async update(client: Client, id: string, input: UpdateGroupInput): Promise<TransactionGroup> {
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
   * Remove um grupo. Transações vinculadas ficam com group_id = null (FK nullable).
   */
  async remove(client: Client, id: string): Promise<void> {
    const { error } = await client
      .from('transaction_groups')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
