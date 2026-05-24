import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsService } from '../services/groups.service'
import { createClient } from '#/integrations/supabase/client'
import { queryKeys } from '#/lib/query-keys'
import type { CreateGroupInput, UpdateGroupInput } from '../types'

export function useGroups() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.groups.lists(),
    queryFn: () => groupsService.list(supabase),
  })
}

export function useCreateGroup() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateGroupInput) => groupsService.create(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}

export function useUpdateGroup() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateGroupInput & { id: string }) => 
      groupsService.update(supabase, id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}

export function useDeleteGroup() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => groupsService.remove(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() })
    },
  })
}
