import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc' | null
export interface SortState { key: string; dir: SortDir }

export function nextSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, dir: 'asc' }
  if (current.dir === 'asc') return { key, dir: 'desc' }
  return { key: '', dir: null }
}

export function sortItems<T>(items: T[], { key, dir }: SortState): T[] {
  if (!dir || !key) return items
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : Number(av) - Number(bv)
    return dir === 'asc' ? cmp : -cmp
  })
}

interface SortableHeadProps {
  label: string
  sortKey: string
  current: SortState
  onSort: (next: SortState) => void
  className?: string
}

export function SortableHead({ label, sortKey, current, onSort, className }: SortableHeadProps) {
  const active = current.key === sortKey
  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:text-foreground transition-colors', className)}
      onClick={() => onSort(nextSort(current, sortKey))}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && current.dir === 'asc' && <ChevronUp className="size-3" />}
        {active && current.dir === 'desc' && <ChevronDown className="size-3" />}
        {!active && <ChevronsUpDown className="size-3 opacity-30" />}
      </span>
    </TableHead>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function FilterSelect({ value, onChange, options, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:border-ring focus:outline-none',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
