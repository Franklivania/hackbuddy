import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  feedback: { type: 'success' | 'error'; message: string } | undefined
  onDismiss?: () => void
  className?: string
}

export function InlineFeedback({ feedback, onDismiss, className }: Props) {
  if (!feedback) return null
  const isError = feedback.type === 'error'
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200',
        isError
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-emerald-300 bg-emerald-50 text-emerald-700',
        className,
      )}
    >
      {isError ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
      <span className="flex-1">{feedback.message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
