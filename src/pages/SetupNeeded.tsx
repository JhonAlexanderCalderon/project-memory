import { Wrench } from 'lucide-react'

export default function SetupNeeded() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
        <Wrench size={26} />
      </div>
      <h1 className="text-lg font-semibold text-slate-100">Firebase not configured</h1>
      <p className="max-w-xs text-sm text-slate-400">
        Add your Firebase project config to <code className="text-slate-300">.env.local</code> (see{' '}
        <code className="text-slate-300">.env.example</code> and the README) and restart the dev server.
      </p>
    </div>
  )
}
