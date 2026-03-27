import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Coins, Sparkles, Brain } from 'lucide-react'
import type { AiModelOption } from '@/api'

function getIconSrc(icon: string) {
  if (!icon) return ''
  if (icon.startsWith('/api/')) return icon
  return `/model-icons/${icon}.svg`
}

interface Props {
  models: AiModelOption[]
  value: number | null
  onChange: (id: number) => void
  enableThinking?: boolean
  onThinkingChange?: (v: boolean) => void
  label?: string
  storageKey?: string
}

export function ModelSelector({ models, value, onChange, enableThinking, onThinkingChange, label, storageKey }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const selected = models.find(m => m.id === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (initRef.current || models.length === 0) return
    initRef.current = true
    if (storageKey) {
      const cached = localStorage.getItem(`model_${storageKey}`)
      if (cached) {
        const id = parseInt(cached)
        if (models.find(m => m.id === id)) { onChange(id); return }
      }
      const cachedThinking = localStorage.getItem(`thinking_${storageKey}`)
      if (cachedThinking && onThinkingChange) onThinkingChange(cachedThinking === '1')
    }
    if (!value) onChange(models[0].id)
  }, [models])

  const handleChange = (id: number) => {
    onChange(id)
    if (storageKey) localStorage.setItem(`model_${storageKey}`, String(id))
  }

  const handleThinkingChange = (v: boolean) => {
    onThinkingChange?.(v)
    if (storageKey) localStorage.setItem(`thinking_${storageKey}`, v ? '1' : '0')
  }

  const totalCost = selected ? selected.pointsCost + (enableThinking && selected.supportThinking ? selected.thinkingPointsCost : 0) : 0

  return (
    <div ref={ref} className="relative">
      {label && <p className="text-xs text-text-muted mb-1.5">{label}</p>}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-white cursor-pointer hover:border-primary/40 transition-colors"
      >
        {selected ? (
          <>
            {selected.icon && <img src={getIconSrc(selected.icon)} alt="" className="w-4 h-4 rounded-sm shrink-0" />}
            <span className="text-sm text-text-primary truncate">{selected.name}</span>
            <span className="flex items-center gap-0.5 text-xs text-primary ml-auto shrink-0">
              <Coins className="w-3 h-3" />{totalCost}
            </span>
          </>
        ) : (
          <span className="text-sm text-text-muted">选择模型</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && models.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-border shadow-lg py-1 max-h-60 overflow-y-auto">
          {models.map(m => (
            <div
              key={m.id}
              onClick={() => { handleChange(m.id); setOpen(false) }}
              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${m.id === value ? 'bg-primary/5' : 'hover:bg-surface-secondary'}`}
            >
              {m.icon ? (
                <img src={getIconSrc(m.icon)} alt="" className="w-5 h-5 rounded-sm shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-text-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-text-primary truncate block">{m.name}</span>
                {m.supportThinking === 1 && onThinkingChange && <span className="text-[10px] text-primary">支持深度思考</span>}
              </div>
              <span className="flex items-center gap-0.5 text-xs text-primary shrink-0">
                <Coins className="w-3 h-3" />{m.pointsCost}/次
              </span>
            </div>
          ))}
        </div>
      )}

      {selected?.supportThinking === 1 && onThinkingChange && (
        <div className="flex items-center justify-between mt-3 px-2 py-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm text-text-primary">深度思考</span>
            {selected.thinkingPointsCost > 0 && (
              <span className="text-xs text-primary">+{selected.thinkingPointsCost}积分</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleThinkingChange(!enableThinking)}
            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${enableThinking ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow transition-transform ${enableThinking ? 'left-[16px]' : 'left-[2px]'}`} />
          </button>
        </div>
      )}
    </div>
  )
}
