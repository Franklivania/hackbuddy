import { useState, useMemo } from 'react'
import { Search, RefreshCw, Shield, ShieldOff } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAdminStore } from '@/lib/stores/admin-store'
import { InlineFeedback } from './inline-feedback'
import { UserDetailSheet } from './user-detail-sheet'
import { SortableHead, FilterSelect, sortItems, nextSort, type SortState } from './table-helpers'

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
]
const PROVIDER_OPTIONS = [
  { value: '', label: 'All providers' },
  { value: 'email', label: 'Email' },
  { value: 'google', label: 'Google' },
  { value: 'github', label: 'GitHub' },
]
const VERIFIED_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
]

export function UsersPanel() {
  const { users, loading, feedback, fetchUsers, selectUser, clearFeedback } = useAdminStore()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' })

  const filtered = useMemo(() => {
    let list = users
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (u) => u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q),
      )
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter)
    if (providerFilter) list = list.filter((u) => u.provider === providerFilter)
    if (verifiedFilter) list = list.filter((u) => String(u.verified) === verifiedFilter)
    return sortItems(list, sort)
  }, [users, query, roleFilter, providerFilter, verifiedFilter, sort])

  const isLoading = !!loading['users']

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h3">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} total &middot; {filtered.length} shown
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchUsers()} disabled={isLoading}>
          {isLoading ? <Spinner /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      <InlineFeedback feedback={feedback['users']} onDismiss={() => clearFeedback('users')} />

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} />
        <FilterSelect value={providerFilter} onChange={setProviderFilter} options={PROVIDER_OPTIONS} />
        <FilterSelect value={verifiedFilter} onChange={setVerifiedFilter} options={VERIFIED_OPTIONS} />
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner /> Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {query || roleFilter || providerFilter || verifiedFilter ? 'No users match your filters.' : 'No users found.'}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Name" sortKey="full_name" current={sort} onSort={setSort} />
                <SortableHead label="Email" sortKey="email" current={sort} onSort={setSort} />
                <SortableHead label="Role" sortKey="role" current={sort} onSort={setSort} />
                <SortableHead label="Provider" sortKey="provider" current={sort} onSort={setSort} />
                <SortableHead label="Status" sortKey="verified" current={sort} onSort={setSort} />
                <SortableHead label="Joined" sortKey="created_at" current={sort} onSort={setSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="cursor-pointer" onClick={() => selectUser(user.id)}>
                  <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {user.role === 'admin' ? <Shield className="size-3" /> : <ShieldOff className="size-3" />}
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell><span className="text-xs capitalize text-muted-foreground">{user.provider}</span></TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <UserDetailSheet />
    </div>
  )
}
