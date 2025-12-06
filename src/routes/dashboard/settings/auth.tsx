import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/settings/auth"!</div>
}
