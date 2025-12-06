import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/projects/new')({ component: NewProject })

function NewProject() {
  return <div>New Project</div>
}
