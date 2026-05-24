import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/database.types'
import type { LoginCredentials } from '../types'

/**
 * Authentication service that accepts a Supabase client instance.
 * This allows the same service to be used on the client (browser) and server (SSR).
 */
export const authService = {
  async signInWithPassword(supabase: SupabaseClient<Database>, credentials: LoginCredentials) {
    if (!credentials.password) throw new Error('Password is required')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    
    if (error) throw error
    return data
  },

  async signOut(supabase: SupabaseClient<Database>) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser(supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },
  
  async getProfile(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (error) throw error
    return data
  }
}
