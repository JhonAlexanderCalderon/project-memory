import { useCallback, useRef, useState } from 'react'

export type VoiceCaptureState = 'idle' | 'recording' | 'stopped'

export function useVoiceCapture() {
  const [state, setState] = useState<VoiceCaptureState>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start()
      recorderRef.current = recorder
      setState('recording')
    } catch {
      setError('Microphone access denied or unavailable.')
    }
  }, [])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder) {
        resolve(null)
        return
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        streamRef.current?.getTracks().forEach((t) => t.stop())
        setState('stopped')
        resolve(blob)
      }
      recorder.stop()
    })
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    chunksRef.current = []
  }, [])

  return { state, error, start, stop, reset }
}
