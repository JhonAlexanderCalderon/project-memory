import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { watchProjects } from '../data/projects'
import { useAuthContext } from './AuthContext'
import type { Project } from '../types'

const ProjectsContext = createContext<Project[]>([])

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuthContext()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!uid) {
      setProjects([])
      return
    }
    return watchProjects(uid, setProjects)
  }, [uid])

  return <ProjectsContext.Provider value={projects}>{children}</ProjectsContext.Provider>
}

export function useProjectsContext() {
  return useContext(ProjectsContext)
}
