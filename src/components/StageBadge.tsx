import type { ProjectStage } from '../types'

const styles: Record<ProjectStage, string> = {
  idea: 'bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/30',
  planning: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
  development: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  testing: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  production: 'bg-teal-500/15 text-teal-400 ring-teal-500/30',
}

const labels: Record<ProjectStage, string> = {
  idea: 'Idea',
  planning: 'Planning',
  development: 'Development',
  testing: 'Testing',
  production: 'Production',
}

export default function StageBadge({ stage }: { stage: ProjectStage }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[stage]}`}>
      {labels[stage]}
    </span>
  )
}
