import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import StageBadge from './StageBadge'
import type { Project } from '../types'

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl bg-slate-900 p-4 ring-1 ring-white/5 transition-colors active:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-100">{project.name}</h3>
        <div className="flex shrink-0 gap-1.5">
          <StatusBadge status={project.status} />
          <StageBadge stage={project.stage} />
        </div>
      </div>
      {project.currentState && <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{project.currentState}</p>}
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span>{project.taskOpenCount} open tasks</span>
        <span>{project.memoryCount} memories</span>
        {project.currentVersion && <span>{project.currentVersion}</span>}
      </div>
    </Link>
  )
}
