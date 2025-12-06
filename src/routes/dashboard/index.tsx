import { createFileRoute, redirect } from '@tanstack/react-router'

// Index route for /dashboard – redirect handled in parent layout (route.tsx)
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: ({ location }) => {
    const normalized = location.pathname.replace(/\/+$/, '')
    if (normalized === '/dashboard') {
      throw redirect({ to: '/dashboard/home', replace: true })
    }
  },
  component: () => null,
})

