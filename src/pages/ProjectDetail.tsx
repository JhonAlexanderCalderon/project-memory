import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useCaptureContext } from '../lib/CaptureContext'
import { watchProject, updateProject, setProjectStatus, setProjectStage, setProjectVersion, deleteProject } from '../data/projects'
import { watchProjectTasks, createTask, setTaskStatus, deleteTask } from '../data/tasks'
import { watchProjectMemories } from '../data/memories'
import { watchProjectActivity } from '../data/activity'
import { isWorkerConfigured, summarizeProject } from '../lib/workerClient'
import StatusBadge from '../components/StatusBadge'
import StageBadge from '../components/StageBadge'
import TaskItem from '../components/TaskItem'
import ActivityItem from '../components/ActivityItem'
import type { Project, ProjectStage, ProjectStatus, Task, Memory, Activity } from '../types'

const statusOptions: ProjectStatus[] = ['active', 'on_hold', 'completed', 'archived']
const stageOptions: ProjectStage[] = ['idea', 'planning', 'development', 'testing', 'production']
type Tab = 'overview' | 'tasks' | 'memory' | 'timeline'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { uid } = useAuthContext()
  const { setContextProjectId } = useCaptureContext()

  const [project, setProject] = useState<Project | null | undefined>(undefined)
  const [tasks, setTasks] = useState<Task[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [tab, setTab] = useState<Tab>('overview')

  const [currentState, setCurrentState] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [version, setVersion] = useState('')
  const [purpose, setPurpose] = useState('')

  const [summarizing, setSummarizing] = useState(false)
  const [proposal, setProposal] = useState<{ currentState: string; nextAction: string } | null>(null)

  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    if (!uid || !id) return
    setContextProjectId(id)
    const unsub1 = watchProject(uid, id, (p) => {
      setProject(p)
      if (p) {
        setCurrentState(p.currentState)
        setNextAction(p.nextAction)
        setVersion(p.currentVersion)
        setPurpose(p.purpose)
      }
    })
    const unsub2 = watchProjectTasks(uid, id, setTasks)
    const unsub3 = watchProjectMemories(uid, id, setMemories)
    const unsub4 = watchProjectActivity(uid, id, setActivity)
    return () => {
      setContextProjectId(null)
      unsub1()
      unsub2()
      unsub3()
      unsub4()
    }
  }, [uid, id, setContextProjectId])

  const counts = useMemo(
    () => ({
      ideas: memories.filter((m) => m.type === 'idea').length,
      issues: memories.filter((m) => m.type === 'issue').length,
    }),
    [memories],
  )

  if (!uid || !id) return null
  if (project === undefined) return <div className="p-6 text-sm text-slate-500">Loading…</div>
  if (project === null) return <div className="p-6 text-sm text-slate-500">Project not found.</div>

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return
    await createTask(uid!, { title: newTaskTitle.trim(), description: '', projectId: id!, priority: null, dueDate: null })
    setNewTaskTitle('')
  }

  async function handleRegenerateSummary() {
    if (!isWorkerConfigured()) {
      alert('AI summaries need the Cloudflare Worker configured. See Settings.')
      return
    }
    setSummarizing(true)
    try {
      const result = await summarizeProject(
        project!.name,
        memories.slice(0, 15).map((m) => m.content),
        tasks.slice(0, 15).map((t) => `[${t.status}] ${t.title}`),
      )
      setProposal(result)
    } catch {
      alert('Could not generate a summary right now.')
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="text-slate-500 hover:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 truncate text-xl font-semibold text-slate-100">{project.name}</h1>
        <button
          onClick={async () => {
            if (confirm('Delete this project? This cannot be undone.')) {
              await deleteProject(uid, id)
              navigate('/projects')
            }
          }}
          className="text-slate-600 hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <select
          value={project.status}
          onChange={(e) => setProjectStatus(uid, project, e.target.value as ProjectStatus)}
          className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={project.stage}
          onChange={(e) => setProjectStage(uid, project, e.target.value as ProjectStage)}
          className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
        >
          {stageOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <StatusBadge status={project.status} />
          <StageBadge stage={project.stage} />
        </div>
      </div>

      <div className="mt-5 flex gap-3 border-b border-white/10">
        {(['overview', 'tasks', 'memory', 'timeline'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-1 pb-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Why does it exist?" value={purpose} onChange={setPurpose} onBlur={() => updateProject(uid, id, { purpose })} />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Current State</span>
              <button
                onClick={handleRegenerateSummary}
                disabled={summarizing}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 disabled:opacity-50"
              >
                {summarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Regenerate
              </button>
            </div>
            <textarea
              value={currentState}
              onChange={(e) => setCurrentState(e.target.value)}
              onBlur={() => updateProject(uid, id, { currentState })}
              rows={2}
              className="w-full resize-none rounded-xl bg-slate-900 p-3 text-sm text-slate-100 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
            />
          </div>

          {proposal && (
            <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/25">
              <p className="text-xs font-medium text-emerald-400">AI suggestion — review before applying</p>
              <p className="mt-2 text-sm text-slate-200">
                <strong>State:</strong> {proposal.currentState}
              </p>
              <p className="mt-1 text-sm text-slate-200">
                <strong>Next:</strong> {proposal.nextAction}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => {
                    setCurrentState(proposal.currentState)
                    setNextAction(proposal.nextAction)
                    await updateProject(uid, id, { currentState: proposal.currentState, nextAction: proposal.nextAction })
                    setProposal(null)
                  }}
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950"
                >
                  Accept
                </button>
                <button onClick={() => setProposal(null)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <Field
            label="Next Action"
            value={nextAction}
            onChange={setNextAction}
            onBlur={() => updateProject(uid, id, { nextAction })}
          />
          <Field label="Current Version" value={version} onChange={setVersion} onBlur={() => setProjectVersion(uid, project, version)} short />

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Open Tasks" value={project.taskOpenCount} />
            <Stat label="Ideas" value={counts.ideas} />
            <Stat label="Issues" value={counts.issues} />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Recent Activity</p>
            <div className="rounded-xl bg-slate-900 px-3 ring-1 ring-white/5">
              {activity.slice(0, 5).map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
              {activity.length === 0 && <p className="py-3 text-sm text-slate-600">No activity yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="New task…"
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
            />
            <button onClick={handleAddTask} className="rounded-xl bg-emerald-500 px-3 text-slate-950">
              <Plus size={18} />
            </button>
          </div>
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onStatusChange={(status) => setTaskStatus(uid, t, status)}
              onDelete={() => deleteTask(uid, t)}
            />
          ))}
          {tasks.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">No tasks yet.</p>}
        </div>
      )}

      {tab === 'memory' && (
        <div className="mt-4 flex flex-col gap-2.5">
          {memories.map((m) => (
            <div key={m.id} className="rounded-xl bg-slate-900 p-3.5 ring-1 ring-white/5">
              <span className="mb-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {m.type}
              </span>
              <p className="text-sm text-slate-200">{m.content}</p>
            </div>
          ))}
          {memories.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">No memories linked yet.</p>}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="mt-4 rounded-xl bg-slate-900 px-3 ring-1 ring-white/5">
          {activity.map((a) => (
            <ActivityItem key={a.id} activity={a} />
          ))}
          {activity.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p>}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  short,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  short?: boolean
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {short ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full rounded-xl bg-slate-900 p-3 text-sm text-slate-100 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={2}
          className="w-full resize-none rounded-xl bg-slate-900 p-3 text-sm text-slate-100 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-900 py-3 ring-1 ring-white/5">
      <p className="text-lg font-semibold text-slate-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
