import { useState } from 'react'
import { Download, LogOut, Check } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { signOut } from '../lib/firebase'
import { getWorkerUrl, setWorkerUrl, isWorkerConfigured } from '../lib/workerClient'
import { watchAllMemories } from '../data/memories'
import { watchAllTasks } from '../data/tasks'
import { watchProjects } from '../data/projects'

export default function Settings() {
  const { user, uid } = useAuthContext()
  const [workerUrlInput, setWorkerUrlInput] = useState(getWorkerUrl() ?? '')
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)

  function handleSaveWorkerUrl() {
    setWorkerUrl(workerUrlInput)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleExport() {
    if (!uid) return
    setExporting(true)
    try {
      const [projects, memories, tasks] = await Promise.all([
        new Promise((resolve) => {
          const unsub = watchProjects(uid, (items) => {
            unsub()
            resolve(items)
          })
        }),
        new Promise((resolve) => {
          const unsub = watchAllMemories(uid, (items) => {
            unsub()
            resolve(items)
          })
        }),
        new Promise((resolve) => {
          const unsub = watchAllTasks(uid, (items) => {
            unsub()
            resolve(items)
          })
        }),
      ])
      const blob = new Blob([JSON.stringify({ projects, memories, tasks, exportedAt: new Date().toISOString() }, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-memory-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <h1 className="text-xl font-semibold text-slate-100">Settings</h1>

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-900 p-4 ring-1 ring-white/5">
        {user?.photoURL && <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{user?.displayName}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-xs font-medium text-slate-500">AI Worker URL (voice + AI assist)</p>
        <div className="flex gap-2">
          <input
            value={workerUrlInput}
            onChange={(e) => setWorkerUrlInput(e.target.value)}
            placeholder="https://your-worker.workers.dev"
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
          />
          <button onClick={handleSaveWorkerUrl} className="rounded-xl bg-slate-800 px-3 text-slate-300">
            {saved ? <Check size={16} className="text-emerald-400" /> : 'Save'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-600">
          Status: {isWorkerConfigured() ? <span className="text-emerald-400">configured</span> : <span className="text-amber-400">not configured</span>}
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/5 disabled:opacity-50"
      >
        <Download size={16} />
        {exporting ? 'Exporting…' : 'Export all data (JSON)'}
      </button>

      <button
        onClick={() => signOut()}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-red-400 ring-1 ring-white/5"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
