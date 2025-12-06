import React from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouter,
  redirect,
} from '@tanstack/react-router'
import { useStore } from '@nanostores/react'
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  Home,
  Lock,
  LogOut,
  Plus,
  Shield,
  SlidersHorizontal,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { authMiddleware } from '@/middleware/auth'

type Project = {
  id: string
  name: string
  status: string
  updated: string
}

// Layout route for all /dashboard/* pages
export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
  server: {
    middleware: [authMiddleware],
  },
  beforeLoad: ({ location }) => {
    const normalized = location.pathname.replace(/\/+$/, '')
    if (normalized === '/dashboard') {
      throw redirect({ to: '/dashboard/home', replace: true })
    }
  },
})

function DashboardLayout() {
  const navigate = useNavigate()
  const router = useRouter()
  const session = useStore(authClient.useSession)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [projectsOpen, setProjectsOpen] = React.useState(true)

  // Placeholder data until projects are wired to backend.
  const projects: Project[] = []

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarOpen(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      await navigate({ to: '/login', replace: true, reloadDocument: true })
    } catch (error) {
      console.error('Error signing out', error)
      await router.invalidate()
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={cn(
          'group relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-[width] duration-300 shrink-0 overflow-hidden',
          sidebarOpen ? 'w-72' : 'w-20',
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Home className="size-5 shrink-0" />
          </div>
          <div
            className={cn(
              'transition-opacity duration-200 whitespace-nowrap',
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <p className="text-sm text-muted-foreground">RenovAI</p>
            <p className="text-lg font-semibold text-foreground">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-2">
          <SidebarLink
            to="/dashboard/home"
            icon={<LayoutDashboard className="size-4 shrink-0" />}
            label="Dashboard"
            sidebarOpen={sidebarOpen}
          />

          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <div
              className={cn(
                'flex items-center justify-between px-2',
                !sidebarOpen && 'justify-center px-0',
              )}
            >
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors',
                    !sidebarOpen && 'justify-center gap-0 px-0',
                  )}
                >
                  <FolderOpen className="size-4 shrink-0 text-primary" />
                  {sidebarOpen && (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Projects
                      </span>
                      {projectsOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleTrigger>
              {sidebarOpen && (
                <Link to="/dashboard/projects/new" className="ml-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-primary hover:text-primary-foreground hover:bg-primary/20"
                    title="Add project"
                  >
                    <Plus className="size-4" />
                  </Button>
                </Link>
              )}
            </div>
            <CollapsibleContent className="px-2 pt-1 space-y-1 overflow-hidden">
              {projects.length === 0 && sidebarOpen ? (
                <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar p-3 text-sm text-muted-foreground">
                  No projects yet. Create your first one to get started.
                  <div className="mt-3">
                    <Link to="/dashboard/projects/new">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center border-primary/30 text-foreground bg-primary/5 hover:bg-primary/15"
                      >
                        <Plus className="size-4" />
                        Add project
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : null}

              {projects.length > 0 ? (
                <div className="space-y-1">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/dashboard/projects/${project.id}`}
                      className="block rounded-lg px-3 py-2 hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-foreground">
                          {project.status}
                        </span>
                        <span>{project.updated}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </CollapsibleContent>
          </Collapsible>

          <div className="pt-4">
            <p
              className={cn(
                'px-4 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-opacity duration-200',
                sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
            >
              Settings
            </p>
            <div className="mt-2 space-y-1">
              <SidebarLink
                to="/dashboard/settings/auth"
                icon={<Shield className="size-4 shrink-0" />}
                label="Auth"
                sidebarOpen={sidebarOpen}
              />
              <SidebarLink
                to="/dashboard/settings/basic"
                icon={<SlidersHorizontal className="size-4 shrink-0" />}
                label="Basic settings"
                sidebarOpen={sidebarOpen}
              />
            </div>
          </div>
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4 shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              !sidebarOpen && 'justify-center px-0',
            )}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-border text-foreground">
              <Lock className="size-4 shrink-0" />
            </div>
            {sidebarOpen && (
              <div className="leading-tight overflow-hidden">
                <p className="text-sm font-semibold text-foreground truncate">
                  {session.data?.user.name ?? session.data?.user.email ?? ''}
                </p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            className={cn(
              'mt-3 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive',
              sidebarOpen ? 'justify-start' : 'justify-center px-0',
            )}
          >
            <LogOut className="size-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

type SidebarLinkProps = {
  to: string
  icon: React.ReactNode
  label: string
  sidebarOpen: boolean
}

function SidebarLink({ to, icon, label, sidebarOpen }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group/link flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-sidebar-accent/50 transition-colors',
        !sidebarOpen && 'justify-center px-0 gap-0',
      )}
      activeProps={{
        className: cn(
          'group/link flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/15 text-foreground border border-primary/40',
          !sidebarOpen && 'justify-center px-0 gap-0',
        ),
      }}
    >
      <span className="text-muted-foreground shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span
        className={cn(
          'text-sm font-medium transition-opacity duration-200 whitespace-nowrap',
          sidebarOpen ? 'opacity-100' : 'hidden pointer-events-none',
        )}
      >
        {label}
      </span>
    </Link>
  )
}


