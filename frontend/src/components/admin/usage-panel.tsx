import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAdminStore } from '@/lib/stores/admin-store'
import { InlineFeedback } from './inline-feedback'

export function UsagePanel() {
  const { usageSummary, users, loading, feedback, fetchUsageSummary, clearFeedback } = useAdminStore()

  const isLoading = !!loading['usageSummary']
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const byModel = useMemo(() => {
    const map: Record<string, { tokens: number; requests: number }> = {}
    for (const r of usageSummary) {
      const e = map[r.model] ?? { tokens: 0, requests: 0 }
      e.tokens += r.total_tokens
      e.requests += r.request_count
      map[r.model] = e
    }
    return Object.entries(map).sort((a, b) => b[1].tokens - a[1].tokens)
  }, [usageSummary])

  const byUser = useMemo(() => {
    const map: Record<string, { tokens: number; requests: number }> = {}
    for (const r of usageSummary) {
      const e = map[r.user_id] ?? { tokens: 0, requests: 0 }
      e.tokens += r.total_tokens
      e.requests += r.request_count
      map[r.user_id] = e
    }
    return Object.entries(map).sort((a, b) => b[1].tokens - a[1].tokens)
  }, [usageSummary])

  const maxTokensByModel = byModel[0]?.[1].tokens || 1
  const maxTokensByUser = byUser[0]?.[1].tokens || 1
  const totalTokens = usageSummary.reduce((s, r) => s + r.total_tokens, 0)
  const totalRequests = usageSummary.reduce((s, r) => s + r.request_count, 0)

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h3">Token Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">Track consumption across models and users.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchUsageSummary()} disabled={isLoading}>
          {isLoading ? <Spinner /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      <InlineFeedback feedback={feedback['usageSummary']} onDismiss={() => clearFeedback('usageSummary')} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Tokens" value={totalTokens.toLocaleString()} />
        <SummaryCard label="Total Requests" value={totalRequests.toLocaleString()} />
        <SummaryCard label="Models Used" value={byModel.length} />
        <SummaryCard label="Active Users" value={byUser.length} />
      </div>

      {isLoading && usageSummary.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner /> Loading usage data...
        </div>
      ) : usageSummary.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No usage data yet.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* By model chart */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">By Model</p>
            <div className="space-y-2">
              {byModel.map(([model, { tokens, requests }]) => (
                <div key={model}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-muted-foreground truncate">{model}</span>
                    <span className="tabular-nums">{tokens.toLocaleString()} tok &middot; {requests} req</span>
                  </div>
                  <div className="h-5 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-chart-1/80 transition-all duration-500"
                      style={{ width: `${Math.max((tokens / maxTokensByModel) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By user chart */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">By User (Top 10)</p>
            <div className="space-y-2">
              {byUser.slice(0, 10).map(([userId, { tokens, requests }]) => {
                const u = userMap.get(userId)
                const label = u ? (u.full_name || u.email) : userId.slice(0, 8)
                return (
                  <div key={userId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate text-muted-foreground">{label}</span>
                      <span className="tabular-nums">{tokens.toLocaleString()} tok &middot; {requests} req</span>
                    </div>
                    <div className="h-5 rounded-sm bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-sm bg-chart-2/80 transition-all duration-500"
                        style={{ width: `${Math.max((tokens / maxTokensByUser) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed summary table */}
      {usageSummary.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Detailed Breakdown</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageSummary.map((row, i) => {
                const u = userMap.get(row.user_id)
                return (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {u ? (u.full_name || u.email) : <span className="font-mono text-xs">{row.user_id.slice(0, 8)}...</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{row.session_id.slice(0, 8)}...</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{row.model}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.total_tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.request_count.toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
