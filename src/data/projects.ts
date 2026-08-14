import { addDoc, deleteDoc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { projectDoc, projectsCol } from './paths'
import { logActivity } from './activity'
import type { Project, ProjectStage, ProjectStatus } from '../types'

export interface NewProjectInput {
  name: string
  purpose: string
  status: ProjectStatus
  stage: ProjectStage
}

export async function createProject(uid: string, input: NewProjectInput) {
  const now = Date.now()
  const ref = await addDoc(projectsCol(uid), {
    ...input,
    currentState: '',
    nextAction: '',
    currentVersion: '',
    memoryCount: 0,
    taskOpenCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity(uid, ref.id, 'project_created', `Project "${input.name}" created`)
  return ref.id
}

export function watchProjects(uid: string, callback: (projects: Project[]) => void) {
  const q = query(projectsCol(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)))
  })
}

export function watchProject(uid: string, id: string, callback: (project: Project | null) => void) {
  return onSnapshot(projectDoc(uid, id), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null)
  })
}

export async function getProjectOnce(uid: string, id: string) {
  const snap = await getDoc(projectDoc(uid, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null
}

export async function updateProject(uid: string, id: string, patch: Partial<Project>) {
  await updateDoc(projectDoc(uid, id), { ...patch, updatedAt: Date.now() })
}

export async function setProjectStatus(uid: string, project: Project, status: ProjectStatus) {
  await updateProject(uid, project.id, { status })
  await logActivity(uid, project.id, 'status_change', `Status changed to "${status}"`)
}

export async function setProjectStage(uid: string, project: Project, stage: ProjectStage) {
  await updateProject(uid, project.id, { stage })
  await logActivity(uid, project.id, 'stage_change', `Stage changed to "${stage}"`)
}

export async function setProjectVersion(uid: string, project: Project, version: string) {
  await updateProject(uid, project.id, { currentVersion: version })
  await logActivity(uid, project.id, 'version_updated', `Version set to "${version}"`)
}

export async function deleteProject(uid: string, id: string) {
  await deleteDoc(projectDoc(uid, id))
}
