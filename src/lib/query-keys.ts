/**
 * Chaves de query centralizadas para uso com TanStack Query.
 * Seguindo a convenção de arrays para invalidação granular.
 */
export const queryKeys = {
  // --- Transactions ---
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    late: () => [...queryKeys.transactions.all, 'late'] as const,
  },

  // --- Groups ---
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: () => [...queryKeys.groups.lists()] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
  },

  // --- Auth / Profile ---
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
} as const
