import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export default function GlobalStatusBar() {
  const { globalMessage, clearGlobalMessage } = useAppStore()

  useEffect(() => {
    if (!globalMessage) return
    const timer = setTimeout(() => clearGlobalMessage(), 4000)
    return () => clearTimeout(timer)
  }, [globalMessage, clearGlobalMessage])

  if (!globalMessage) return null

  const tone =
    globalMessage.type === 'success'
      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-300/40'
      : globalMessage.type === 'error'
        ? 'bg-rose-500 text-white shadow-lg shadow-rose-300/40'
        : 'bg-sky-500 text-white shadow-lg shadow-sky-300/40'

  return (
    <div className="fixed top-0 inset-x-0 z-[999] flex justify-center px-3">
      <div className={`mt-3 inline-flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold ${tone}`}>
        <span>{globalMessage.text}</span>
        <button
          type="button"
          onClick={clearGlobalMessage}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 transition"
          aria-label="Close message"
        >
          x
        </button>
      </div>
    </div>
  )
}
