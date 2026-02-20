import { Link } from 'react-router'
import { Users, FileText, BarChart3, Cpu, ShieldCheck, MailWarning } from 'lucide-react'
import { useAdminStore } from '@/lib/stores/admin-store'
import { Spinner } from '@/components/ui/spinner'
import { InlineFeedback } from './inline-feedback'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  to?: string
  accent?: boolean
}

function StatCard({ label, value, icon: Icon, to, accent }: StatCardProps) {
  const cls = `flex flex-col gap-1 rounded-lg border p-5 text-left transition-all hover:shadow-sm ${
    accent ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
  } ${to ? 'hover:border-primary/30' : ''}`

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </>
  )

  return to ? (
    <Link to={to} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function OverviewPanel() {
  const { users, sessions, analyses, usageSummary, modelInfo, loading, feedback } = useAdminStore()

  const isLoading = loading['users'] || loading['sessions'] || loading['analyses'] || loading['usageSummary']
  const totalTokens = usageSummary.reduce((sum, r) => sum + r.total_tokens, 0)
  const totalRequests = usageSummary.reduce((sum, r) => sum + r.request_count, 0)
  const verifiedCount = users.filter((u) => u.verified).length
  const unverifiedCount = users.filter((u) => !u.verified).length
  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="h3">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">System-wide metrics at a glance.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading data...
        </div>
      )}

      <InlineFeedback feedback={feedback['users'] ?? feedback['sessions'] ?? feedback['analyses']} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Users" value={users.length} icon={Users} to="/admin/users" />
        <StatCard label="Verified" value={verifiedCount} icon={ShieldCheck} to="/admin/users" />
        <StatCard label="Unverified" value={unverifiedCount} icon={MailWarning} to="/admin/users" />
        <StatCard label="Admins" value={adminCount} icon={ShieldCheck} accent />
        <StatCard label="Sessions" value={sessions.length} icon={FileText} to="/admin/sessions" />
        <StatCard label="Analyses" value={analyses.length} icon={BarChart3} />
        <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} icon={Cpu} to="/admin/usage" />
        <StatCard label="API Requests" value={totalRequests.toLocaleString()} icon={BarChart3} to="/admin/usage" />
      </div>

      {modelInfo && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Model</p>
              <p className="mt-1 text-lg font-semibold font-mono">{modelInfo.active}</p>
            </div>
            <Link to="/admin/model" className="text-xs text-primary hover:underline">Configure</Link>
          </div>
        </div>
      )}

      {usageSummary.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tokens by Model</p>
            <Link to="/admin/usage" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <TokensByModelChart summary={usageSummary} />
        </div>
      )}
    </div>
  )
}

function TokensByModelChart({ summary }: { summary: { model: string; total_tokens: number }[] }) {
  const byModel = summary.reduce<Record<string, number>>((acc, r) => {
    acc[r.model] = (acc[r.model] || 0) + r.total_tokens
    return acc
  }, {})
  const entries = Object.entries(byModel).sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] || 1

  return (
    <div className="space-y-2">
      {entries.map(([model, tokens]) => (
        <div key={model} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs font-mono text-muted-foreground">{model}</span>
          <div className="relative flex-1 h-6 rounded-sm bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-sm bg-primary/80 transition-all duration-500"
              style={{ width: `${Math.max((tokens / max) * 100, 2)}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-mono tabular-nums">{tokens.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
