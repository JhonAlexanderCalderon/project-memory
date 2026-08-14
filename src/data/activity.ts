import { addDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { activityCol } from './paths'
import type { Activity, ActivityKind } from '../types'

export function logActivity(uid: string, projectId: string, kind: ActivityKind, text: string, refId: string | null = null) {
  return addDoc(activityCol(uid), {
    projectId,
    kind,
    text,
    refId,
    createdAt: Date.now(),
  })
}

export function watchProjectActivity(uid: string, projectId: string, callback: (items: Activity[]) => void) {
  const q = query(activityCol(uid), where('projectId', '==', projectId), orderBy('createdAt', 'desc'), limit(50))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity)))
  })
}

export function watchRecentActivity(uid: string, callback: (items: Activity[]) => void) {
  const q = query(activityCol(uid), orderBy('createdAt', 'desc'), limit(20))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity)))
  })
}
