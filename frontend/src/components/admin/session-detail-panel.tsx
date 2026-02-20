import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Code2, FileText, BarChart3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/lib/stores/admin-store'

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-card p-5 ${className ?? ''}`}>{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{children}</p>
}

interface Props {
  sessionId: string
}

export function SessionDetailPanel({ sessionId }: Props) {
  const { sessions, users, analyses, usageSummary } = useAdminStore()
  const [showJson, setShowJson] = useState(false)

  const session = sessions.find((s) => s.id === sessionId)
  const owner = useMemo(() => users.find((u) => u.id === session?.user_id), [users, session])

  const sessionAnalyses = useMemo(
    () => analyses.filter((a) => a.session_id === sessionId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [analyses, sessionId],
  )

  const sessionUsage = useMemo(
    () => usageSummary.filter((u) => u.session_id === sessionId),
    [usageSummary, sessionId],
  )

  const totalTokens = sessionUsage.reduce((s, r) => s + r.total_tokens, 0)
  const totalRequests = sessionUsage.reduce((s, r) => s + r.request_count, 0)

  if (!session) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Link to="/admin/sessions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back to sessions
        </Link>
        <div className="py-16 text-center text-muted-foreground">Session not found.</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/admin/sessions" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3" /> Sessions
          </Link>
          <h1 className="h3">{session.name}</h1>
        </div>
        <Button variant={showJson ? 'default' : 'outline'} size="sm" className="gap-2" onClick={() => setShowJson((v) => !v)}>
          <Code2 className="size-4" />
          {showJson ? 'Details' : 'Metadata'}
        </Button>
      </div>

      {showJson ? (
        <pre className="rounded-lg border border-border bg-muted/30 p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(session, null, 2)}
        </pre>
      ) : (
        <>
          {/* Session info */}
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <div>
                <Label>Session ID</Label>
                <p className="mt-0.5 text-sm font-mono break-all">{session.id}</p>
              </div>
              <div>
                <Label>Owner</Label>
                <p className="mt-0.5 text-sm">{owner ? owner.full_name || owner.email : session.user_id.slice(0, 12)}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p className="mt-0.5 text-sm">{new Date(session.created_at).toLocaleString()}</p>
              </div>
              <div>
                <Label>Updated</Label>
                <p className="mt-0.5 text-sm">{new Date(session.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <Label>Analyses</Label>
              <p className="mt-1 text-xl font-semibold flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" /> {sessionAnalyses.length}
              </p>
            </Card>
            <Card>
              <Label>Tokens Used</Label>
              <p className="mt-1 text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" /> {totalTokens.toLocaleString()}
              </p>
            </Card>
            <Card>
              <Label>Requests</Label>
              <p className="mt-1 text-xl font-semibold flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" /> {totalRequests.toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Usage by model */}
          {sessionUsage.length > 0 && (
            <Card className="space-y-3">
              <Label>Usage by Model</Label>
              {sessionUsage.map((u, i) => {
                const max = Math.max(...sessionUsage.map((r) => r.total_tokens), 1)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-muted-foreground">{u.model}</span>
                      <span className="tabular-nums">{u.total_tokens.toLocaleString()} tok &middot; {u.request_count} req</span>
                    </div>
                    <div className="h-4 rounded-sm bg-muted overflow-hidden">
                      <div className="h-full rounded-sm bg-chart-1/70" style={{ width: `${Math.max((u.total_tokens / max) * 100, 3)}%` }} />
                    </div>
                  </div>
                )
              })}
            </Card>
          )}

          {/* Analyses */}
          <Card className="space-y-3">
            <Label>Analysis History</Label>
            {sessionAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analyses run for this session.</p>
            ) : (
              <div className="space-y-2">
                {sessionAnalyses.map((a) => (
                  <AnalysisEntry key={a.id} analysis={a} />
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function AnalysisEntry({ analysis }: { analysis: { id: string; recommendation: string; result_json: string; created_at: string } }) {
  const [expanded, setExpanded] = useState(false)

  let preview = analysis.recommendation?.slice(0, 120) || ''
  if (!preview) {
    try {
      const obj = JSON.parse(analysis.result_json)
      preview = JSON.stringify(obj).slice(0, 120)
    } catch {
      preview = analysis.result_json?.slice(0, 120) || 'No content'
    }
  }

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{new Date(analysis.created_at).toLocaleString()}</span>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded ? (
        <pre className="mt-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto text-muted-foreground">
          {analysis.result_json ? JSON.stringify(JSON.parse(analysis.result_json), null, 2) : analysis.recommendation}
        </pre>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground truncate">{preview}{preview.length >= 120 ? '...' : ''}</p>
      )}
    </div>
  )
}
