import { collection, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const projectsCol = (uid: string) => collection(db, 'users', uid, 'projects')
export const projectDoc = (uid: string, id: string) => doc(db, 'users', uid, 'projects', id)

export const memoriesCol = (uid: string) => collection(db, 'users', uid, 'memories')
export const memoryDoc = (uid: string, id: string) => doc(db, 'users', uid, 'memories', id)

export const tasksCol = (uid: string) => collection(db, 'users', uid, 'tasks')
export const taskDoc = (uid: string, id: string) => doc(db, 'users', uid, 'tasks', id)

export const activityCol = (uid: string) => collection(db, 'users', uid, 'activity')
