import type { Database } from '#/integrations/supabase/database.types'

// --- Tipos base derivados do banco ---
export type TransactionGroup = Database['public']['Tables']['transaction_groups']['Row']
export type TransactionGroupInsert = Database['public']['Tables']['transaction_groups']['Insert']
export type TransactionGroupUpdate = Database['public']['Tables']['transaction_groups']['Update']

// --- Tipo para criação via form ---
export type CreateGroupInput = Omit<
  TransactionGroupInsert,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

// --- Tipo para edição ---
export type UpdateGroupInput = Omit<
  TransactionGroupUpdate,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
