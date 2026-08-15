import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useProjectsContext } from '../lib/ProjectsContext'
import { createProject } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import type { ProjectCategory, ProjectStatus } from '../types'

const filters: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const categories: { value: ProjectCategory; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'personal', label: 'Personal' },
]

export default function Projects() {
  const { uid } = useAuthContext()
  const projects = useProjectsContext()
  const [category, setCategory] = useState<ProjectCategory>('professional')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('active')
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [newCategory, setNewCategory] = useState<ProjectCategory>('professional')
  const [saving, setSaving] = useState(false)

  const inCategory = projects.filter((p) => (p.category ?? 'professional') === category)
  const visible = filter === 'all' ? inCategory : inCategory.filter((p) => p.status === filter)

  async function handleCreate() {
    if (!uid || !name.trim()) return
    setSaving(true)
    try {
      await createProject(uid, { name: name.trim(), purpose: purpose.trim(), category: newCategory, status: 'active', stage: 'idea' })
      setName('')
      setPurpose('')
      setShowNew(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Projects</h1>
        <button
          onClick={() => {
            setNewCategory(category)
            setShowNew(true)
          }}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-900 p-1 ring-1 ring-white/10">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              category === c.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 ring-1 ring-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="mt-16 text-center text-sm text-slate-500">
          <p>No projects here.</p>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div
            className="w-full max-w-lg rounded-t-2xl bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">New Project</span>
              <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-800 p-1 ring-1 ring-white/5">
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewCategory(c.value)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    newCategory === c.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-xl bg-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
            />
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why does it exist? (optional)"
              rows={2}
              className="mt-2 w-full resize-none rounded-xl bg-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || saving}
              className="mt-3 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
            >
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
