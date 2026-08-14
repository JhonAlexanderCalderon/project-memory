import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface Env {
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGIN: string
  GROQ_API_KEY: string
}

const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

// Cached across requests within the same isolate.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
}

async function verifyFirebaseToken(request: Request, env: Env): Promise<string> {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Missing bearer token')

  if (!jwks) jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL))

  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  })
  if (!payload.sub) throw new Error('Invalid token subject')
  return payload.sub
}

async function groqChatJSON(env: Env, systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Groq chat error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  return JSON.parse(data.choices[0].message.content)
}

async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  const incomingForm = await request.formData()
  const audio = incomingForm.get('audio')
  if (typeof audio === 'string' || audio === null) {
    return json({ error: 'Missing audio field' }, { status: 400 })
  }

  const groqForm = new FormData()
  groqForm.append('file', audio, 'capture.webm')
  groqForm.append('model', 'whisper-large-v3-turbo')
  groqForm.append('response_format', 'json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: groqForm,
  })
  if (!res.ok) return json({ error: `Transcription failed: ${await res.text()}` }, { status: 502 })
  const data = (await res.json()) as { text: string }
  return json({ text: data.text })
}

async function handleClassify(request: Request, env: Env): Promise<Response> {
  const { content, projects } = (await request.json()) as {
    content: string
    projects: { id: string; name: string }[]
  }

  const system = `You classify short personal project-management notes. Reply with strict JSON only:
{"type": "memory"|"task"|"idea"|"issue"|"decision"|"note", "projectId": string|null, "confidence": number between 0 and 1}
- "task": something actionable to do now.
- "idea": a future possibility, not urgent.
- "issue": a problem or risk.
- "decision": a choice that was made.
- "note": reference info worth keeping.
- "memory": use only if none of the above clearly fit.
Pick projectId from the given list by best topical match, or null if unclear. Never invent a projectId not in the list.`

  const user = `Note: "${content}"\n\nProjects: ${JSON.stringify(projects)}`

  try {
    const result = await groqChatJSON(env, system, user)
    return json({
      type: result.type ?? 'memory',
      projectId: projects.some((p) => p.id === result.projectId) ? result.projectId : null,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
    })
  } catch (e) {
    return json({ error: String(e) }, { status: 502 })
  }
}

async function handleSummarize(request: Request, env: Env): Promise<Response> {
  const { projectName, recentMemories, recentTasks } = (await request.json()) as {
    projectName: string
    recentMemories: string[]
    recentTasks: string[]
  }

  const system = `You write terse project-status summaries for a personal project tracker. Reply with strict JSON only:
{"currentState": string, "nextAction": string}
Keep each field to one short sentence, plain language, no fluff.`

  const user = `Project: ${projectName}\n\nRecent memories:\n${recentMemories.map((m) => `- ${m}`).join('\n')}\n\nRecent tasks:\n${recentTasks.map((t) => `- ${t}`).join('\n')}`

  try {
    const result = await groqChatJSON(env, system, user)
    return json({
      currentState: String(result.currentState ?? ''),
      nextAction: String(result.nextAction ?? ''),
    })
  } catch (e) {
    return json({ error: String(e) }, { status: 502 })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    const headers = corsHeaders(origin)

    try {
      await verifyFirebaseToken(request, env)
    } catch {
      return json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    try {
      let response: Response
      if (request.method === 'POST' && url.pathname === '/transcribe') {
        response = await handleTranscribe(request, env)
      } else if (request.method === 'POST' && url.pathname === '/classify') {
        response = await handleClassify(request, env)
      } else if (request.method === 'POST' && url.pathname === '/summarize') {
        response = await handleSummarize(request, env)
      } else {
        response = json({ error: 'Not found' }, { status: 404 })
      }
      const merged = new Headers(response.headers)
      for (const [k, v] of Object.entries(headers)) merged.set(k, v)
      return new Response(response.body, { status: response.status, headers: merged })
    } catch (e) {
      return json({ error: String(e) }, { status: 500, headers })
    }
  },
}
