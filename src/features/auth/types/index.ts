import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password?: string // optional if we support magic link later
}
