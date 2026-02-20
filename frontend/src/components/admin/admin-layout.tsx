import { useEffect, useState, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Cpu,
  ArrowLeft,
  LogOut,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/lib/stores/admin-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getInitials } from '@/lib/initials'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/sessions', label: 'Sessions', icon: FileText },
  { to: '/admin/usage', label: 'Usage', icon: BarChart3 },
  { to: '/admin/model', label: 'Model', icon: Cpu },
] as const

export function AdminLayout() {
  const { bootstrap } = useAdminStore()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => { void bootstrap() }, [bootstrap])

  const handleLogoutClick = useCallback(() => {
    setPopoverOpen(false)
    setDialogOpen(true)
  }, [])

  const handleLogoutConfirm = useCallback(async () => {
    setDialogOpen(false)
    await logout()
    navigate('/', { replace: true })
  }, [logout, navigate])

  const initials = user ? getInitials(user.full_name, user.email) : ''
  const displayName = user?.full_name?.trim() || user?.email || ''

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="font-mono text-xs tracking-wider uppercase">Admin</span>
          </NavLink>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest}
              className={({ isActive }) =>
                cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div className="flex-1" />
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </span>
                <div className="hidden sm:flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                asChild
                onClick={() => setPopoverOpen(false)}
              >
                <NavLink to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </NavLink>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={handleLogoutClick}
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </PopoverContent>
          </Popover>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout confirmation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>You will need to sign in again to continue.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleLogoutConfirm}>Log out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
