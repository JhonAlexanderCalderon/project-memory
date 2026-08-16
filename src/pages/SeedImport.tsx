import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useProjectsContext } from '../lib/ProjectsContext'
import { createProject, updateProject } from '../data/projects'
import type { ProjectCategory, ProjectStage, ProjectStatus } from '../types'

interface SeedProject {
  name: string
  purpose: string
  category: ProjectCategory
  status: ProjectStatus
  stage: ProjectStage
  currentState?: string
  nextAction?: string
}

const SEED_PROJECTS: SeedProject[] = [
  {
    name: 'gastos-pwa',
    purpose: 'Control de gastos compartidos en pareja, con categorías a medida.',
    category: 'personal',
    status: 'active',
    stage: 'production',
    currentState: 'Desplegada y en uso, es la app principal del ecosistema de gastos.',
  },
  {
    name: 'gastos_pareja',
    purpose: 'Primer intento de app de gastos en pareja, hecho en Flutter.',
    category: 'personal',
    status: 'archived',
    stage: 'idea',
    currentState: 'Scaffold sin terminar, abandonado cuando arrancó gastos-pwa en React.',
    nextAction: 'Decidir si se elimina definitivamente.',
  },
  {
    name: 'gastos-bip5',
    purpose: 'Versión de control de gastos para el reloj Amazfit Bip 5.',
    category: 'personal',
    status: 'on_hold',
    stage: 'development',
    currentState: 'Configuración inicial sin terminar.',
    nextAction: 'Terminar de configurar el proyecto Zepp OS.',
  },
  {
    name: 'gastos-alexa',
    purpose: 'Skill de Alexa para registrar gastos por voz.',
    category: 'personal',
    status: 'on_hold',
    stage: 'testing',
    currentState: 'Código escrito y probado localmente.',
    nextAction: 'Configurar Firebase y publicar en la consola de Alexa.',
  },
  {
    name: 'tareas-del-hogar',
    purpose: 'App de tareas del hogar multiusuario (crear/unirse a un hogar).',
    category: 'personal',
    status: 'active',
    stage: 'production',
    currentState: 'Muy activa, con pipeline de deploy funcionando.',
  },
  {
    name: 'gemini-alexa',
    purpose: "Skill de Alexa \"Pregunta Gemini\" para hacer preguntas por voz.",
    category: 'personal',
    status: 'on_hold',
    stage: 'testing',
    currentState: 'Código listo.',
    nextAction: 'Pegar la API key de Gemini y publicar.',
  },
  {
    name: 'quick-notes-pwa',
    purpose: 'PWA de notas rápidas.',
    category: 'personal',
    status: 'active',
    stage: 'development',
    currentState: 'En desarrollo activo, pipeline de deploy recién agregado.',
  },
  {
    name: 'quick-notes',
    purpose: 'Notas rápidas por categoría para el reloj Amazfit Bip 5.',
    category: 'personal',
    status: 'active',
    stage: 'development',
    currentState: 'En desarrollo activo, contraparte de quick-notes-pwa.',
  },
  {
    name: 'timer',
    purpose: 'Temporizador para el reloj Amazfit Bip 5.',
    category: 'personal',
    status: 'on_hold',
    stage: 'development',
    currentState: 'Sin tocar hace unos días; tiene notas técnicas de aprendizaje Zepp.',
  },
  {
    name: 'HolaMundo',
    purpose: 'Proyecto de aprendizaje inicial para probar Zepp OS.',
    category: 'personal',
    status: 'completed',
    stage: 'idea',
    currentState: 'Completado como ejercicio de aprendizaje.',
  },
]

export default function SeedImport() {
  const { uid } = useAuthContext()
  const projects = useProjectsContext()
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)

  async function handleImport() {
    if (!uid) return
    setRunning(true)
    setLog([])
    const existingNames = new Set(projects.map((p) => p.name))
    for (const seed of SEED_PROJECTS) {
      if (existingNames.has(seed.name)) {
        setLog((prev) => [...prev, `— ${seed.name}: ya existe, se omite`])
        continue
      }
      const id = await createProject(uid, {
        name: seed.name,
        purpose: seed.purpose,
        category: seed.category,
        status: seed.status,
        stage: seed.stage,
      })
      if (seed.currentState || seed.nextAction) {
        await updateProject(uid, id, {
          currentState: seed.currentState ?? '',
          nextAction: seed.nextAction ?? '',
        })
      }
      setLog((prev) => [...prev, `✓ ${seed.name}: creado`])
    }
    setRunning(false)
    setDone(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <h1 className="text-xl font-semibold text-slate-100">Importar proyectos (una sola vez)</h1>
      <p className="mt-2 text-sm text-slate-400">
        Va a crear {SEED_PROJECTS.length} proyectos personales. Los que ya existan por nombre se omiten, así que es seguro
        volver a tocar el botón si algo falla a la mitad.
      </p>

      <button
        onClick={handleImport}
        disabled={running || !uid}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : done ? <Check size={16} /> : null}
        {running ? 'Importando…' : done ? 'Listo' : 'Importar mis proyectos'}
      </button>

      {log.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-900 p-3 text-xs text-slate-300 ring-1 ring-white/5">
          {log.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}
