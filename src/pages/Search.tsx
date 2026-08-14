import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useProjectsContext } from '../lib/ProjectsContext'
import { watchAllMemories } from '../data/memories'
import { watchAllTasks } from '../data/tasks'
import { relativeTime } from '../lib/time'
import type { Memory, Task } from '../types'

export default function Search() {
  const { uid } = useAuthContext()
  const projects = useProjectsContext()
  const [q, setQ] = useState('')
  const [memories, setMemories] = useState<Memory[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!uid) return
    const unsub1 = watchAllMemories(uid, setMemories)
    const unsub2 = watchAllTasks(uid, setTasks)
    return () => {
      unsub1()
      unsub2()
    }
  }, [uid])

  const needle = q.trim().toLowerCase()

  const matchedMemories = useMemo(
    () => (needle ? memories.filter((m) => m.content.toLowerCase().includes(needle)) : []),
    [memories, needle],
  )
  const matchedTasks = useMemo(
    () => (needle ? tasks.filter((t) => t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)) : []),
    [tasks, needle],
  )

  function projectName(id: string | null) {
    return projects.find((p) => p.id === id)?.name
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <h1 className="text-xl font-semibold text-slate-100">Search</h1>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 ring-1 ring-white/5 focus-within:ring-emerald-500/40">
        <SearchIcon size={16} className="text-slate-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search memories, tasks…"
          className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder-slate-500"
        />
      </div>

      {needle && (
        <div className="mt-5 flex flex-col gap-5">
          {matchedTasks.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-slate-400">Tasks ({matchedTasks.length})</h2>
              <div className="flex flex-col gap-2">
                {matchedTasks.map((t) => (
                  <Link
                    key={t.id}
                    to={`/projects/${t.projectId}`}
                    className="block rounded-xl bg-slate-900 p-3 ring-1 ring-white/5"
                  >
                    <p className="text-sm text-slate-100">{t.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t.status} · {projectName(t.projectId) ?? 'Unknown project'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {matchedMemories.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-slate-400">Memories ({matchedMemories.length})</h2>
              <div className="flex flex-col gap-2">
                {matchedMemories.map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-900 p-3 ring-1 ring-white/5">
                    <p className="text-sm text-slate-200">{m.content}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {relativeTime(m.createdAt)}
                      {projectName(m.projectId) ? ` · ${projectName(m.projectId)}` : ''} · {m.type}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {matchedMemories.length === 0 && matchedTasks.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">No results for "{q}"</p>
          )}
        </div>
      )}
    </div>
  )
}
