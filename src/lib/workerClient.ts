import { auth } from './firebase'

const STORAGE_KEY = 'pm_worker_url'

export function getWorkerUrl(): string | undefined {
  return localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_WORKER_URL as string | undefined)
}

export function setWorkerUrl(url: string) {
  if (url.trim()) localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/$/, ''))
  else localStorage.removeItem(STORAGE_KEY)
}

export function isWorkerConfigured(): boolean {
  return Boolean(getWorkerUrl())
}

const REQUEST_TIMEOUT_MS = 25_000

async function authedFetch(path: string, body: BodyInit, headers: Record<string, string> = {}) {
  const workerUrl = getWorkerUrl()
  if (!workerUrl) throw new Error('Worker URL not configured. Set it in Settings.')
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not signed in.')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${workerUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, ...headers },
      body,
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.')
    }
    throw new Error('Network error. Check your connection and try again.')
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error(`Worker request failed: ${res.status}`)
  return res.json()
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append('audio', blob, 'capture.webm')
  const data = await authedFetch('/transcribe', form)
  return data.text as string
}

export interface ClassifySuggestion {
  type: 'memory' | 'task' | 'idea' | 'issue' | 'decision' | 'note'
  projectId: string | null
  confidence: number
}

export async function classifyMemory(content: string, projects: { id: string; name: string }[]): Promise<ClassifySuggestion> {
  const data = await authedFetch('/classify', JSON.stringify({ content, projects }), { 'Content-Type': 'application/json' })
  return data as ClassifySuggestion
}

export interface SummarizeResult {
  currentState: string
  nextAction: string
}

export async function summarizeProject(
  projectName: string,
  recentMemories: string[],
  recentTasks: string[],
): Promise<SummarizeResult> {
  const data = await authedFetch(
    '/summarize',
    JSON.stringify({ projectName, recentMemories, recentTasks }),
    { 'Content-Type': 'application/json' },
  )
  return data as SummarizeResult
}
