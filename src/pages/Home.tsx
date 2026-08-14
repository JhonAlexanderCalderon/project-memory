import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Inbox as InboxIcon, AlertTriangle, ArrowRight, Settings as SettingsIcon } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useCaptureContext } from '../lib/CaptureContext'
import { useProjectsContext } from '../lib/ProjectsContext'
import { watchInbox } from '../data/memories'
import { watchBlockedTasks } from '../data/tasks'
import { watchRecentMemories } from '../data/memories'
import StageBadge from '../components/StageBadge'
import type { Memory, Task } from '../types'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 19) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { uid, user } = useAuthContext()
  const { openCapture } = useCaptureContext()
  const projects = useProjectsContext()
  const [inboxCount, setInboxCount] = useState(0)
  const [blockedTasks, setBlockedTasks] = useState<Task[]>([])
  const [recentMemories, setRecentMemories] = useState<Memory[]>([])

  useEffect(() => {
    if (!uid) return
    const unsub1 = watchInbox(uid, (items) => setInboxCount(items.length))
    const unsub2 = watchBlockedTasks(uid, setBlockedTasks)
    const unsub3 = watchRecentMemories(uid, setRecentMemories, 5)
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [uid])

  const continueWorking = projects.filter((p) => p.status === 'active').slice(0, 3)
  const firstName = user?.displayName?.split(' ')[0]

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <Link to="/settings" className="text-slate-500 hover:text-slate-300">
          <SettingsIcon size={20} />
        </Link>
      </div>

      <button
        onClick={openCapture}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-4 text-left shadow-lg shadow-emerald-500/20 transition-transform active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/15">
          <Mic size={20} className="text-slate-950" />
        </div>
        <div>
          <p className="font-semibold text-slate-950">Quick Capture</p>
          <p className="text-xs text-slate-950/70">Speak or type — save in seconds</p>
        </div>
      </button>

      {(inboxCount > 0 || blockedTasks.length > 0) && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-400">Needs Attention</h2>
          <div className="flex flex-col gap-2">
            {inboxCount > 0 && (
              <Link
                to="/inbox"
                className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 ring-1 ring-white/5"
              >
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <InboxIcon size={16} className="text-amber-400" />
                  {inboxCount} unprocessed {inboxCount === 1 ? 'memory' : 'memories'}
                </span>
                <ArrowRight size={16} className="text-slate-500" />
              </Link>
            )}
            {blockedTasks.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 ring-1 ring-white/5">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <AlertTriangle size={16} className="text-red-400" />
                  {blockedTasks.length} blocked {blockedTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {continueWorking.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-400">Continue Working</h2>
          <div className="flex flex-col gap-2">
            {continueWorking.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 ring-1 ring-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{p.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.nextAction || 'No next action set'}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <StageBadge stage={p.stage} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentMemories.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-400">Recent Memories</h2>
          <div className="flex flex-col gap-2">
            {recentMemories.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-900 px-4 py-3 ring-1 ring-white/5">
                <p className="line-clamp-2 text-sm text-slate-200">{m.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="mt-10 text-center text-sm text-slate-500">
          <p>No projects yet.</p>
          <Link to="/projects" className="mt-1 inline-block text-emerald-400">
            Create your first project →
          </Link>
        </div>
      )}
    </div>
  )
}
