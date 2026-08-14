import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X, Loader2, Send } from 'lucide-react'
import { useAuthContext } from '../lib/AuthContext'
import { useCaptureContext } from '../lib/CaptureContext'
import { useProjectsContext } from '../lib/ProjectsContext'
import { useVoiceCapture } from '../hooks/useVoiceCapture'
import { captureMemory, setAiSuggestion } from '../data/memories'
import { classifyMemory, isWorkerConfigured, transcribeAudio } from '../lib/workerClient'

export default function QuickCapture() {
  const { uid } = useAuthContext()
  const { contextProjectId, registerOpener } = useCaptureContext()
  const projects = useProjectsContext()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [source, setSource] = useState<'voice' | 'text'>('text')
  const [transcribing, setTranscribing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const voice = useVoiceCapture()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    registerOpener(() => {
      setOpen(true)
      setSource('text')
    })
  }, [registerOpener])

  if (!uid) return null

  function closeSheet() {
    setOpen(false)
    setText('')
    setNotice(null)
    voice.reset()
  }

  async function handleMicTap() {
    setNotice(null)
    if (voice.state === 'recording') {
      const blob = await voice.stop()
      if (!blob) return
      setSource('voice')
      if (!isWorkerConfigured()) {
        setNotice('Transcripción de voz aún no configurada — puedes escribir el texto manualmente. Configúrala en Settings.')
        return
      }
      setTranscribing(true)
      try {
        const transcript = await transcribeAudio(blob)
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
      } catch {
        setNotice('No se pudo transcribir. Intenta de nuevo o escribe el texto.')
      } finally {
        setTranscribing(false)
      }
    } else {
      await voice.start()
      if (voice.error) setNotice(voice.error)
    }
  }

  async function handleSave() {
    const content = text.trim()
    if (!content || !uid) return
    setSaving(true)
    try {
      const id = await captureMemory(uid, content, source, contextProjectId)
      closeSheet()
      if (isWorkerConfigured()) {
        classifyMemory(
          content,
          projects.map((p) => ({ id: p.id, name: p.name })),
        )
          .then((suggestion) =>
            setAiSuggestion(uid, id, {
              type: suggestion.type as never,
              projectId: suggestion.projectId,
              projectName: projects.find((p) => p.id === suggestion.projectId)?.name ?? null,
              confidence: suggestion.confidence,
            }),
          )
          .catch(() => {})
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
          setSource('text')
        }}
        aria-label="Quick capture"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
      >
        <Mic size={24} strokeWidth={2.25} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={closeSheet}>
          <div
            className="w-full max-w-lg rounded-t-2xl bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">
                {contextProjectId ? 'Capturing to this project' : 'Capturing to Inbox'}
              </span>
              <button onClick={closeSheet} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setSource('text')
              }}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full resize-none rounded-xl border-none bg-slate-800 p-3 text-base text-slate-100 placeholder-slate-500 outline-none ring-1 ring-white/5 focus:ring-emerald-500/40"
            />

            {notice && <p className="mt-2 text-xs text-amber-400">{notice}</p>}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleMicTap}
                disabled={transcribing}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                  voice.state === 'recording'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-800 text-emerald-400 ring-1 ring-white/10'
                }`}
              >
                {transcribing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : voice.state === 'recording' ? (
                  <Square size={18} />
                ) : (
                  <Mic size={20} />
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
