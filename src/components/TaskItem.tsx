import { Trash2 } from 'lucide-react'
import type { Task, TaskStatus } from '../types'

const statusOptions: { value: TaskStatus; label: string; dot: string }[] = [
  { value: 'todo', label: 'To Do', dot: 'bg-slate-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
  { value: 'blocked', label: 'Blocked', dot: 'bg-red-500' },
  { value: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

interface Props {
  task: Task
  onStatusChange: (status: TaskStatus) => void
  onDelete: () => void
}

export default function TaskItem({ task, onStatusChange, onDelete }: Props) {
  const current = statusOptions.find((s) => s.value === task.status)!
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-900 p-3.5 ring-1 ring-white/5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${current.dot}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm text-slate-100 ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
          {task.title}
        </p>
        {task.description && <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="mt-2 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 outline-none ring-1 ring-white/10"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button onClick={onDelete} className="text-slate-600 hover:text-red-400">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
