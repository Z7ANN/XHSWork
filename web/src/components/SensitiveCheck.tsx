import { useState } from 'react'
import { ShieldCheck, X, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { editorApi } from '@/api'

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  extreme: { label: '极限用语', color: 'text-red-600', bg: 'bg-red-50' },
  medical: { label: '医疗用语', color: 'text-orange-600', bg: 'bg-orange-50' },
  cosmetic: { label: '化妆品禁用语', color: 'text-pink-600', bg: 'bg-pink-50' },
  finance: { label: '金融用语', color: 'text-amber-600', bg: 'bg-amber-50' },
  legal: { label: '法律风险词', color: 'text-purple-600', bg: 'bg-purple-50' },
  vulgar: { label: '低俗用语', color: 'text-red-700', bg: 'bg-red-50' },
  other: { label: '其他', color: 'text-gray-600', bg: 'bg-gray-50' },
}

interface SensitiveResult {
  id: number
  word: string
  category: string
  replacements: string[]
  index: number
  length: number
}

interface Props {
  getText: () => string
  onReplace: (oldWord: string, newWord: string) => void
}

export function SensitiveCheck({ getText, onReplace }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SensitiveResult[]>([])
  const [checked, setChecked] = useState(false)

  const handleCheck = async () => {
    const text = getText()
    if (!text.trim()) return
    setLoading(true)
    setOpen(true)
    setChecked(false)
    try {
      const found = await editorApi.checkSensitive(text)
      setResults(found)
      setChecked(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReplace = (word: string, replacement: string) => {
    onReplace(word, replacement)
    setResults(prev => prev.filter(r => r.word !== word))
  }

  const grouped = results.reduce<Record<string, SensitiveResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    if (!acc[r.category].find(x => x.word === r.word)) acc[r.category].push(r)
    return acc
  }, {})

  return (
    <>
      <button
        onClick={handleCheck}
        className="h-8 px-3 rounded-lg bg-surface-secondary text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-border transition-colors cursor-pointer"
      >
        <ShieldCheck className="w-3.5 h-3.5" />违规词检测
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-[480px] max-w-[90vw] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                违规词检测
              </h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
              {loading && (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">检测中...</span>
                </div>
              )}

              {checked && results.length === 0 && (
                <div className="flex flex-col items-center py-12">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <Check className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-green-600">未检测到违规词</p>
                  <p className="text-xs text-text-muted mt-1">内容符合平台规范</p>
                </div>
              )}

              {checked && results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm text-red-600">检测到 {results.length} 处违规词，建议修改后再发布</span>
                  </div>

                  {Object.entries(grouped).map(([cat, words]) => {
                    const catInfo = categoryLabels[cat] || categoryLabels.other
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catInfo.bg} ${catInfo.color}`}>{catInfo.label}</span>
                          <span className="text-xs text-text-muted">{words.length} 个</span>
                        </div>
                        <div className="space-y-2">
                          {words.map((w, i) => (
                            <div key={`${w.word}-${i}`} className="rounded-lg border border-border p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-sm font-medium line-through decoration-primary/60 decoration-wavy">{w.word}</span>
                              </div>
                              {w.replacements.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs text-text-muted">替换为：</span>
                                  {w.replacements.map((r, j) => (
                                    <button
                                      key={j}
                                      onClick={() => handleReplace(w.word, r)}
                                      className="px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 hover:bg-green-100 cursor-pointer transition-colors"
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
