import type { ProjectStatus } from '../types'

const styles: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  on_hold: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  completed: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  archived: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
}

const labels: Record<ProjectStatus, string> = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
