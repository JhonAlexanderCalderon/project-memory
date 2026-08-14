import { addDoc, deleteDoc, increment, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { projectDoc, taskDoc, tasksCol } from './paths'
import { logActivity } from './activity'
import type { Task, TaskPriority, TaskStatus } from '../types'

export interface NewTaskInput {
  title: string
  description: string
  projectId: string
  priority: TaskPriority | null
  dueDate: number | null
  memoryId?: string | null
}

export async function createTask(uid: string, input: NewTaskInput) {
  const ref = await addDoc(tasksCol(uid), {
    title: input.title,
    description: input.description,
    status: 'todo' as TaskStatus,
    priority: input.priority,
    dueDate: input.dueDate,
    projectId: input.projectId,
    memoryId: input.memoryId ?? null,
    createdAt: Date.now(),
    completedAt: null,
  })
  await updateDoc(projectDoc(uid, input.projectId), { taskOpenCount: increment(1), updatedAt: Date.now() })
  await logActivity(uid, input.projectId, 'task_created', input.title, ref.id)
  return ref.id
}

export function watchProjectTasks(uid: string, projectId: string, callback: (items: Task[]) => void) {
  const q = query(tasksCol(uid), where('projectId', '==', projectId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))))
}

export function watchOpenTasks(uid: string, callback: (items: Task[]) => void) {
  const q = query(tasksCol(uid), where('status', 'in', ['todo', 'in_progress', 'blocked']), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))))
}

export function watchAllTasks(uid: string, callback: (items: Task[]) => void) {
  const q = query(tasksCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))))
}

export function watchBlockedTasks(uid: string, callback: (items: Task[]) => void) {
  const q = query(tasksCol(uid), where('status', '==', 'blocked'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))))
}

export async function setTaskStatus(uid: string, task: Task, status: TaskStatus) {
  const wasOpen = task.status !== 'done'
  const isOpen = status !== 'done'
  await updateDoc(taskDoc(uid, task.id), {
    status,
    completedAt: status === 'done' ? Date.now() : null,
  })
  if (wasOpen && !isOpen) {
    await updateDoc(projectDoc(uid, task.projectId), { taskOpenCount: increment(-1), updatedAt: Date.now() })
    await logActivity(uid, task.projectId, 'task_completed', task.title, task.id)
  } else if (!wasOpen && isOpen) {
    await updateDoc(projectDoc(uid, task.projectId), { taskOpenCount: increment(1), updatedAt: Date.now() })
  }
}

export async function deleteTask(uid: string, task: Task) {
  await deleteDoc(taskDoc(uid, task.id))
  if (task.status !== 'done') {
    await updateDoc(projectDoc(uid, task.projectId), { taskOpenCount: increment(-1), updatedAt: Date.now() })
  }
}
