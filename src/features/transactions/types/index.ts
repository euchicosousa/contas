import type { Database } from '#/integrations/supabase/database.types'

// --- Tipos base derivados do banco ---
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// --- Enum do banco ---
export type TransactionType = Database['public']['Enums']['transaction_type']
// "entrada" | "saida"

// --- Tipo para criação via form (omite campos gerenciados pelo servidor) ---
export type CreateTransactionInput = Omit<
  TransactionInsert,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

// --- Tipo para edição ---
export type UpdateTransactionInput = Omit<
  TransactionUpdate,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

// --- Filtros para listagem ---
export type TransactionFilters = {
  type?: TransactionType
  groupId?: string | null
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
