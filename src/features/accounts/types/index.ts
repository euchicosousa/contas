import type { Database } from '#/integrations/supabase/database.types'

// --- Tipos base derivados do banco (transaction_groups) ---
export type TransactionAccount = Database['public']['Tables']['transaction_groups']['Row']
export type TransactionAccountInsert = Database['public']['Tables']['transaction_groups']['Insert']
export type TransactionAccountUpdate = Database['public']['Tables']['transaction_groups']['Update']

// --- Tipo para criação via form ---
export type CreateAccountInput = Omit<
  TransactionAccountInsert,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

// --- Tipo para edição ---
export type UpdateAccountInput = Omit<
  TransactionAccountUpdate,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
