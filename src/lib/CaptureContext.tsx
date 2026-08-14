import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

interface CaptureContextValue {
  contextProjectId: string | null
  setContextProjectId: (id: string | null) => void
  registerOpener: (fn: () => void) => void
  openCapture: () => void
}

const CaptureContext = createContext<CaptureContextValue>({
  contextProjectId: null,
  setContextProjectId: () => {},
  registerOpener: () => {},
  openCapture: () => {},
})

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [contextProjectId, setContextProjectId] = useState<string | null>(null)
  const openerRef = useRef<() => void>(() => {})

  const registerOpener = (fn: () => void) => {
    openerRef.current = fn
  }
  const openCapture = () => openerRef.current()

  return (
    <CaptureContext.Provider value={{ contextProjectId, setContextProjectId, registerOpener, openCapture }}>
      {children}
    </CaptureContext.Provider>
  )
}

export function useCaptureContext() {
  return useContext(CaptureContext)
}
