import { useEffect, useState } from 'react'
import { useAuthContext } from '../lib/AuthContext'
import { watchInbox, assignToProject, convertMemory, archiveMemory, deleteMemory, markProcessed } from '../data/memories'
import { createTask } from '../data/tasks'
import MemoryCard from '../components/MemoryCard'
import type { Memory, MemoryType } from '../types'

export default function Inbox() {
  const { uid } = useAuthContext()
  const [items, setItems] = useState<Memory[]>([])

  useEffect(() => {
    if (!uid) return
    return watchInbox(uid, setItems)
  }, [uid])

  if (!uid) return null

  async function handleConvert(memory: Memory, type: MemoryType | 'task', projectId?: string) {
    if (type === 'task') {
      const targetProjectId = projectId ?? memory.projectId
      if (!targetProjectId) {
        alert('Assign a project first, then convert to a task.')
        return
      }
      await createTask(uid!, {
        title: memory.content.slice(0, 140),
        description: memory.content.length > 140 ? memory.content : '',
        projectId: targetProjectId,
        priority: null,
        dueDate: null,
        memoryId: memory.id,
      })
      await markProcessed(uid!, memory.id)
    } else {
      await convertMemory(uid!, memory, type, projectId)
    }
  }

  async function handleAcceptSuggestion(memory: Memory) {
    if (!memory.aiSuggestion) return
    const { type, projectId } = memory.aiSuggestion
    await handleConvert(memory, type, projectId ?? undefined)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <h1 className="text-xl font-semibold text-slate-100">Inbox</h1>
      <p className="mt-1 text-sm text-slate-500">Process captured thoughts whenever you're ready — no rush.</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {items.map((m) => (
          <MemoryCard
            key={m.id}
            memory={m}
            onAssignProject={(projectId) => assignToProject(uid, m, projectId)}
            onConvert={(type, projectId) => handleConvert(m, type, projectId)}
            onAcceptSuggestion={() => handleAcceptSuggestion(m)}
            onArchive={() => archiveMemory(uid, m.id)}
            onDelete={() => deleteMemory(uid, m.id)}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-16 text-center text-sm text-slate-500">
          <p>Inbox zero. Nothing to process.</p>
        </div>
      )}
    </div>
  )
}
