import { addDoc, deleteDoc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { memoriesCol, memoryDoc, projectDoc } from './paths'
import { logActivity } from './activity'
import type { AiSuggestion, Memory, MemorySource, MemoryType } from '../types'

export async function captureMemory(uid: string, content: string, source: MemorySource, projectId: string | null = null) {
  const ref = await addDoc(memoriesCol(uid), {
    content,
    source,
    type: 'memory',
    processingStatus: 'inbox',
    projectId,
    aiSuggestion: null,
    createdAt: Date.now(),
    processedAt: null,
  })
  if (projectId) {
    await updateDoc(projectDoc(uid, projectId), { memoryCount: increment(1), updatedAt: Date.now() })
    await logActivity(uid, projectId, 'memory_captured', truncate(content), ref.id)
  }
  return ref.id
}

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export function watchInbox(uid: string, callback: (items: Memory[]) => void) {
  const q = query(memoriesCol(uid), where('processingStatus', '==', 'inbox'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory))))
}

export function watchRecentMemories(uid: string, callback: (items: Memory[]) => void, max = 10) {
  const q = query(memoriesCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.slice(0, max).map((d) => ({ id: d.id, ...d.data() } as Memory))))
}

export function watchAllMemories(uid: string, callback: (items: Memory[]) => void) {
  const q = query(memoriesCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory))))
}

export function watchProjectMemories(uid: string, projectId: string, callback: (items: Memory[]) => void) {
  const q = query(memoriesCol(uid), where('projectId', '==', projectId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory))))
}

export async function setAiSuggestion(uid: string, id: string, suggestion: AiSuggestion) {
  await updateDoc(memoryDoc(uid, id), { aiSuggestion: suggestion })
}

export async function assignToProject(uid: string, memory: Memory, projectId: string) {
  await updateDoc(memoryDoc(uid, memory.id), { projectId })
  await updateDoc(projectDoc(uid, projectId), { memoryCount: increment(1), updatedAt: Date.now() })
  await logActivity(uid, projectId, 'memory_captured', truncate(memory.content), memory.id)
}

export async function convertMemory(uid: string, memory: Memory, type: MemoryType, projectId?: string) {
  const targetProjectId = projectId ?? memory.projectId
  await updateDoc(memoryDoc(uid, memory.id), {
    type,
    processingStatus: 'processed',
    processedAt: Date.now(),
    ...(targetProjectId ? { projectId: targetProjectId } : {}),
  })
  if (targetProjectId) {
    if (!memory.projectId) {
      await updateDoc(projectDoc(uid, targetProjectId), { memoryCount: increment(1), updatedAt: Date.now() })
    }
    await logActivity(uid, targetProjectId, 'memory_converted', `Converted to ${type}: ${truncate(memory.content)}`, memory.id)
  }
}

export async function markProcessed(uid: string, id: string) {
  await updateDoc(memoryDoc(uid, id), { processingStatus: 'processed', processedAt: Date.now() })
}

export async function archiveMemory(uid: string, id: string) {
  await updateDoc(memoryDoc(uid, id), { processingStatus: 'archived', processedAt: Date.now() })
}

export async function deleteMemory(uid: string, id: string) {
  await deleteDoc(memoryDoc(uid, id))
}
