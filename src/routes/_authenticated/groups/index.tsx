import { createFileRoute } from '@tanstack/react-router'
import { GroupsManager } from '#/features/groups/components/GroupsManager'

export const Route = createFileRoute('/_authenticated/groups/')({
  component: GroupsRoute,
})

function GroupsRoute() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Pastas e Grupos</h1>
        <p className="text-sm text-muted-foreground">
          Organize seus lançamentos agrupando-os em pastas personalizadas.
        </p>
      </div>

      <GroupsManager />
    </div>
  )
}
