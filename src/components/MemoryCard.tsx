import { useState } from 'react'
import { Mic, Type, Sparkles, Archive, Trash2, Check } from 'lucide-react'
import { relativeTime } from '../lib/time'
import type { Memory, MemoryType } from '../types'
import { useProjectsContext } from '../lib/ProjectsContext'

const typeOptions: { value: MemoryType; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'issue', label: 'Issue' },
  { value: 'decision', label: 'Decision' },
  { value: 'note', label: 'Note' },
]

interface Props {
  memory: Memory
  onAssignProject: (projectId: string) => void
  onConvert: (type: MemoryType | 'task', projectId?: string) => void
  onAcceptSuggestion: () => void
  onArchive: () => void
  onDelete: () => void
}

export default function MemoryCard({ memory, onAssignProject, onConvert, onAcceptSuggestion, onArchive, onDelete }: Props) {
  const projects = useProjectsContext()
  const [expanded, setExpanded] = useState(false)
  const project = projects.find((p) => p.id === memory.projectId)

  return (
    <div className="rounded-xl bg-slate-900 p-3.5 ring-1 ring-white/5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-slate-500">
          {memory.source === 'voice' ? <Mic size={14} /> : <Type size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words text-sm text-slate-100">{memory.content}</p>
          <p className="mt-1 text-xs text-slate-500">
            {relativeTime(memory.createdAt)}
            {project ? ` · ${project.name}` : ''}
          </p>
        </div>
      </div>

      {memory.aiSuggestion && (
        <button
          onClick={onAcceptSuggestion}
          className="mt-2.5 flex w-full items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-left ring-1 ring-emerald-500/20"
        >
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Sparkles size={13} />
            Looks like <strong className="font-semibold">{memory.aiSuggestion.type}</strong>
            {memory.aiSuggestion.projectName ? ` · ${memory.aiSuggestion.projectName}` : ''}
          </span>
          <Check size={14} className="text-emerald-400" />
        </button>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300"
        >
          {expanded ? 'Hide actions' : 'Actions'}
        </button>
        <button onClick={onArchive} className="rounded-full p-1.5 text-slate-500 hover:text-slate-300">
          <Archive size={14} />
        </button>
        <button onClick={onDelete} className="rounded-full p-1.5 text-slate-500 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
          <label className="text-xs text-slate-500">
            Assign to project
            <select
              defaultValue={memory.projectId ?? ''}
              onChange={(e) => e.target.value && onAssignProject(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-800 px-2.5 py-2 text-sm text-slate-200 outline-none ring-1 ring-white/10"
            >
              <option value="" disabled>
                Select project…
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onConvert('task', memory.projectId ?? undefined)}
              className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30"
            >
              Convert to Task
            </button>
            {typeOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => onConvert(t.value)}
                className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
