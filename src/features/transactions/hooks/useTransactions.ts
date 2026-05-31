import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsService } from '../services/transactions.service'
import { createClient } from '#/integrations/supabase/client'
import { queryKeys } from '#/lib/query-keys'
import type { CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from '../types'

export function useTransactions(filters?: TransactionFilters) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionsService.list(supabase, filters),
  })
}

export function useLateTransactions() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.transactions.late(),
    queryFn: () => transactionsService.getLateTransactions(supabase),
  })
}

export function useTransaction(id: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionsService.create(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useUpdateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTransactionInput & { id: string }) => 
      transactionsService.update(supabase, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useDeleteTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useCreateManyTransactions() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateTransactionInput[]) => transactionsService.createMany(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useDuplicateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch the existing transaction
      const existing = await transactionsService.getById(supabase, id)
      
      // Strip out auto-managed fields
      const { id: _, created_at: __, updated_at: ___, user_id: ____, ...rest } = existing
      
      // Update the title to include (Cópia) but keep the exact same date
      const duplicated: CreateTransactionInput = {
        ...rest,
        title: `${existing.title} (Cópia)`,
        amount_paid: 0,
        is_paid: false,
      }
      
      return transactionsService.create(supabase, duplicated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useUpdateInstallmentSiblings() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      sourceId,
      installmentId,
      patch,
    }: {
      sourceId: string
      installmentId: string
      patch: {
        title?: string
        group_id?: string | null
        amount?: number
        notes?: string | null
      }
    }) => transactionsService.updateInstallmentSiblings(supabase, sourceId, installmentId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}
