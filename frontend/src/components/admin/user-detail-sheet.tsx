import { useState } from 'react'
import {
  Shield,
  ShieldOff,
  Mail,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
  Code2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAdminStore } from '@/lib/stores/admin-store'
import { InlineFeedback } from './inline-feedback'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-all">{value}</dd>
    </div>
  )
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'primary' | 'success' | 'warning' | 'muted' }) {
  const cls = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    muted: 'bg-muted text-muted-foreground',
  }[variant]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}

export function UserDetailSheet() {
  const { users, selectedUserId, selectUser, loading, feedback, updateRole, softDeleteUser, hardDeleteUser, resendVerification, clearFeedback } = useAdminStore()
  const user = users.find((u) => u.id === selectedUserId) ?? null
  const [showJson, setShowJson] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<'soft' | 'hard' | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)

  if (!user) return null

  const roleKey = `role-${user.id}`
  const deleteKey = `delete-${user.id}`
  const hardDeleteKey = `hard-delete-${user.id}`
  const resendKey = `resend-${user.email}`
  const feedbackKeys = [roleKey, deleteKey, hardDeleteKey, resendKey]

  const handleToggleRole = () => {
    setActionsOpen(false)
    void updateRole(user.id, user.role === 'admin' ? 'user' : 'admin')
  }
  const handleResend = () => {
    setActionsOpen(false)
    void resendVerification(user.email)
  }
  const handleSoftDelete = () => {
    setActionsOpen(false)
    setConfirmDelete('soft')
  }
  const handleHardDelete = () => {
    setActionsOpen(false)
    setConfirmDelete('hard')
  }
  const handleDeleteConfirm = async () => {
    if (confirmDelete === 'soft') await softDeleteUser(user.id)
    else if (confirmDelete === 'hard') await hardDeleteUser(user.id)
    setConfirmDelete(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleString()

  return (
    <>
      <Sheet open={!!selectedUserId} onOpenChange={(open) => { if (!open) { selectUser(null); setShowJson(false) } }}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>{user.full_name || user.email}</SheetTitle>
            <SheetDescription>User details and management</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            {/* Feedback */}
            {feedbackKeys.map((k) => (
              feedback[k] ? <InlineFeedback key={k} feedback={feedback[k]} onDismiss={() => clearFeedback(k)} /> : null
            ))}

            {/* Details or JSON */}
            {showJson ? (
              <pre className="rounded-lg border border-border bg-muted/30 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <Field label="ID" value={<span className="font-mono text-xs">{user.id}</span>} />
                <Field label="Email" value={user.email} />
                <Field label="Name" value={user.full_name || '—'} />
                <Field
                  label="Role"
                  value={
                    <Badge variant={user.role === 'admin' ? 'primary' : 'muted'}>
                      {user.role === 'admin' ? <Shield className="size-3" /> : <ShieldOff className="size-3" />}
                      {user.role}
                    </Badge>
                  }
                />
                <Field label="Provider" value={<Badge variant="muted">{user.provider}</Badge>} />
                <Field label="Status" value={<Badge variant={user.verified ? 'success' : 'warning'}>{user.verified ? 'Verified' : 'Unverified'}</Badge>} />
                <Field label="Created" value={formatDate(user.created_at)} />
                <Field label="Updated" value={formatDate(user.updated_at)} />
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center gap-2 border-t border-border p-4">
            <Button
              variant={showJson ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setShowJson((v) => !v)}
            >
              <Code2 className="size-4" />
              {showJson ? 'Details' : 'Metadata'}
            </Button>

            <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <MoreHorizontal className="size-4" />
                  Actions
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-56 p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  disabled={!!loading[roleKey]}
                  onClick={handleToggleRole}
                >
                  {loading[roleKey] ? <Spinner /> : user.role === 'admin' ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                  {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                </Button>
                {!user.verified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled={!!loading[resendKey]}
                    onClick={handleResend}
                  >
                    {loading[resendKey] ? <Spinner /> : <Mail className="size-4" />}
                    Resend Verification
                  </Button>
                )}
                <div className="my-1 h-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  disabled={!!loading[deleteKey]}
                  onClick={handleSoftDelete}
                >
                  {loading[deleteKey] ? <Spinner /> : <Trash2 className="size-4" />}
                  Soft Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={!!loading[hardDeleteKey]}
                  onClick={handleHardDelete}
                >
                  {loading[hardDeleteKey] ? <Spinner /> : <AlertTriangle className="size-4" />}
                  Permanently Delete
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{confirmDelete === 'hard' ? 'Permanently Delete User?' : 'Soft Delete User?'}</DialogTitle>
            <DialogDescription>
              {confirmDelete === 'hard'
                ? 'This action is irreversible. All user data will be permanently removed.'
                : 'The user will be soft-deleted and can be restored later.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {confirmDelete === 'hard' ? 'Delete Permanently' : 'Soft Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
