import { RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAdminStore } from '@/lib/stores/admin-store'
import { InlineFeedback } from './inline-feedback'

export function ModelPanel() {
  const { modelInfo, loading, feedback, fetchModelInfo, updateModel, clearFeedback } = useAdminStore()

  const isLoading = !!loading['model']
  const isUpdating = !!loading['model-update']

  const handleChange = (value: string) => {
    if (value && value !== modelInfo?.active) {
      void updateModel(value)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h3">Model Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the active LLM model for analysis.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchModelInfo()} disabled={isLoading}>
          {isLoading ? <Spinner /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      <InlineFeedback feedback={feedback['model']} onDismiss={() => clearFeedback('model')} />
      <InlineFeedback feedback={feedback['model-update']} onDismiss={() => clearFeedback('model-update')} />

      {isLoading && !modelInfo ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Spinner /> Loading model info...
        </div>
      ) : !modelInfo ? (
        <div className="py-16 text-center text-muted-foreground">Could not load model configuration.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Model</p>
            <p className="mt-1 text-lg font-semibold font-mono">{modelInfo.active}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Switch Model</p>
            <div className="flex items-center gap-3">
              <Select value={modelInfo.active} onValueChange={handleChange} disabled={isUpdating}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {modelInfo.available.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isUpdating && <Spinner />}
            </div>
          </div>

          {modelInfo.available.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available Models</p>
              <div className="flex flex-wrap gap-2">
                {modelInfo.available.map((m) => (
                  <span
                    key={m}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-mono ${
                      m === modelInfo.active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {m}
                    {m === modelInfo.active && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider">active</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
