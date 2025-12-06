import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

// Dashboard home content; layout is provided by `_layout.tsx`
export const Route = createFileRoute('/dashboard/home/')({
  component: DashboardHome,
})

function DashboardHome() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back!</h1>
          <p className="text-base text-muted-foreground mt-1">
            Let&apos;s create together your next project.
          </p>
        </div>
        <Link to={"/dashboard/projects/new" as any}>
          <Button className="gap-2">
            <Plus className="size-4" />
            New project
          </Button>
        </Link>
      </div>
    </div>
  )
}

