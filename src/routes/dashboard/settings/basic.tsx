import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/basic')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/settings/basic"!</div>
}
