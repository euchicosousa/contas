import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsService } from '../services/accounts.service'
import { createClient } from '#/integrations/supabase/client'
import { queryKeys } from '#/lib/query-keys'
import type { CreateAccountInput, UpdateAccountInput } from '../types'

export function useAccounts() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.groups.lists(),
    queryFn: () => accountsService.list(supabase),
  })
}

export function useCreateAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountsService.create(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}

export function useUpdateAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateAccountInput & { id: string }) => 
      accountsService.update(supabase, id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}

export function useDeleteAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => accountsService.remove(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}
