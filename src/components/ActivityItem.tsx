import { Flag, CheckCircle2, MessageSquarePlus, Repeat, Tag, FolderPlus } from 'lucide-react'
import { relativeTime } from '../lib/time'
import type { Activity } from '../types'

const icons: Record<Activity['kind'], typeof Flag> = {
  stage_change: Flag,
  status_change: Flag,
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  memory_captured: MessageSquarePlus,
  memory_converted: Repeat,
  version_updated: Tag,
  project_created: FolderPlus,
}

export default function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = icons[activity.kind] ?? Flag
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300">{activity.text}</p>
        <p className="text-xs text-slate-600">{relativeTime(activity.createdAt)}</p>
      </div>
    </div>
  )
}
