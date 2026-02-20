import { useState, useMemo } from 'react'
import { Search, RefreshCw, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
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
import { SortableHead, sortItems, type SortState } from './table-helpers'

export function SessionsPanel() {
  const { sessions, users, loading, feedback, fetchSessions, clearFeedback } = useAdminStore()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' })

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const enriched = useMemo(
    () =>
      sessions.map((s) => {
        const owner = userMap.get(s.user_id)
        return { ...s, owner_name: owner?.full_name || owner?.email || s.user_id.slice(0, 8) }
      }),
    [sessions, userMap],
  )

  const filtered = useMemo(() => {
    let list = enriched
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
      )
    }
    return sortItems(list, sort)
  }, [enriched, query, sort])

  const isLoading = !!loading['sessions']

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h3">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} total &middot; {filtered.length} shown
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchSessions()} disabled={isLoading}>
          {isLoading ? <Spinner /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      <InlineFeedback feedback={feedback['sessions']} onDismiss={() => clearFeedback('sessions')} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, owner, or ID..."
          className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner /> Loading sessions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {query ? 'No sessions match your search.' : 'No sessions found.'}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Name" sortKey="name" current={sort} onSort={setSort} />
                <SortableHead label="Owner" sortKey="owner_name" current={sort} onSort={setSort} />
                <SortableHead label="Created" sortKey="created_at" current={sort} onSort={setSort} />
                <SortableHead label="Updated" sortKey="updated_at" current={sort} onSort={setSort} />
                <TableCell className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell>
                    <Link to={`/admin/sessions/${s.id}`} className="font-medium hover:text-primary transition-colors">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.owner_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link to={`/admin/sessions/${s.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
