import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  content: string
}

interface ToastContextType {
  success: (content: string) => void
  error: (content: string) => void
  warning: (content: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let globalToast: ToastContextType | null = null

export const toast = {
  success: (content: string) => globalToast?.success(content),
  error: (content: string) => globalToast?.error(content),
  warning: (content: string) => globalToast?.warning(content),
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
}

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-lg border border-border text-sm text-text-primary animate-[slideDown_0.2s_ease-out]">
      {icons[item.type]}
      <span>{item.content}</span>
      <button onClick={onClose} className="ml-1 text-text-muted hover:text-text-primary cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

let idCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((type: ToastType, content: string) => {
    const id = ++idCounter
    setToasts(prev => [...prev, { id, type, content }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextType = {
    success: (c) => add('success', c),
    error: (c) => add('error', c),
    warning: (c) => add('warning', c),
  }

  useEffect(() => {
    globalToast = ctx
    return () => { globalToast = null }
  })

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onClose={() => remove(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
