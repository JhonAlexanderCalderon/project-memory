export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type ProjectStage = 'idea' | 'planning' | 'development' | 'testing' | 'production'

export interface Project {
  id: string
  name: string
  purpose: string
  status: ProjectStatus
  stage: ProjectStage
  currentState: string
  nextAction: string
  currentVersion: string
  memoryCount: number
  taskOpenCount: number
  createdAt: number
  updatedAt: number
}

export type MemorySource = 'voice' | 'text'
export type MemoryType = 'memory' | 'idea' | 'issue' | 'decision' | 'note'
export type ProcessingStatus = 'inbox' | 'processed' | 'archived'

export interface AiSuggestion {
  type: MemoryType | 'task'
  projectId: string | null
  projectName: string | null
  confidence: number
}

export interface Memory {
  id: string
  content: string
  source: MemorySource
  type: MemoryType
  processingStatus: ProcessingStatus
  projectId: string | null
  aiSuggestion: AiSuggestion | null
  createdAt: number
  processedAt: number | null
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'med' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority | null
  dueDate: number | null
  projectId: string
  memoryId: string | null
  createdAt: number
  completedAt: number | null
}

export type ActivityKind =
  | 'stage_change'
  | 'status_change'
  | 'task_created'
  | 'task_completed'
  | 'memory_captured'
  | 'memory_converted'
  | 'version_updated'
  | 'project_created'

export interface Activity {
  id: string
  projectId: string
  kind: ActivityKind
  text: string
  refId: string | null
  createdAt: number
}
