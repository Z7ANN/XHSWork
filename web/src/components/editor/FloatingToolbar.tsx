import { useState, useRef, useEffect } from 'react'
import { useFloatingToolbar, useFloatingToolbarState } from '@platejs/floating'
import { useEditorRef, useEditorId, useEventEditorValue } from 'platejs/react'
import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter,
  Heading1, Heading2, Heading3, Quote, Sparkles, Loader2,
  Copy, Replace, ArrowRight, Check,
} from 'lucide-react'
import { editorApi } from '@/api'

function FloatingBtn({ onClick, active, children, label }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; label: string
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`p-1 rounded-md transition-colors cursor-pointer ${active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}`}
      aria-label={label}
    >{children}</button>
  )
}

const aiActions = [
  { label: '润色优化', prompt: '请润色优化以下文字，使其更加生动有吸引力，保持小红书风格，直接输出优化后的文字，不要任何解释：' },
  { label: '扩写内容', prompt: '请扩写以下内容，增加更多细节和描述，保持小红书风格，直接输出扩写后的文字，不要任何解释：' },
  { label: '缩写精简', prompt: '请精简以下内容，保留核心信息，保持小红书风格，直接输出精简后的文字，不要任何解释：' },
  { label: '改变语气', prompt: '请将以下内容改为更活泼俏皮的语气，保持小红书风格，直接输出修改后的文字，不要任何解释：' },
  { label: '生成标题', prompt: '请根据以下内容生成5个吸引人的小红书标题，每行一个，不要序号：' },
  { label: '翻译中英', prompt: '请翻译以下内容（中文翻英文，英文翻中文），直接输出翻译结果，不要任何解释：' },
]

function AiPanel({ selectedText, textModelId, enableThinking, onClose }: { selectedText: string; textModelId: number | null; enableThinking?: boolean; onClose: () => void }) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const editor = useEditorRef()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleAiAction = async (prompt: string) => {
    if (!textModelId) return
    setLoading(true)
    setAiResult('')
    try {
      const res = await editorApi.aiAssist({ selectedText, prompt, textModelId, enableThinking })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error?.message || 'AI 请求失败')
      }
      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法读取流')
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) currentEvent = line.slice(7).trim()
          else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (currentEvent === 'delta') {
              fullText += data.text
              setAiResult(fullText)
            } else if (currentEvent === 'done') {
              setAiResult(data.result)
            }
          }
        }
      }
    } catch (err: any) {
      setAiResult(`错误：${err.message || 'AI 请求失败'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAsk = () => {
    if (!customPrompt.trim()) return
    handleAiAction(customPrompt)
  }

  const handleReplace = () => {
    if (!aiResult) return
    editor.tf.delete()
    editor.tf.insertText(aiResult)
    onClose()
  }

  const handleCopy = () => {
    if (!aiResult) return
    navigator.clipboard.writeText(aiResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-80" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 p-2.5 border-b border-border">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomAsk()}
          placeholder="问 AI 任何问题..."
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
        <button onClick={handleCustomAsk} disabled={!customPrompt.trim() || loading || !textModelId} className="p-1 rounded-md text-text-muted hover:text-primary disabled:opacity-40 cursor-pointer transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {!textModelId && <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50">请先在左侧选择文本模型</div>}
      {!aiResult && !loading && (
        <div className="p-2 flex flex-wrap gap-1">
          {aiActions.map((action) => (
            <button key={action.label} onClick={() => handleAiAction(action.prompt)} disabled={!textModelId} className="px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-secondary rounded-md cursor-pointer transition-colors disabled:opacity-40">
              {action.label}
            </button>
          ))}
        </div>
      )}
      {loading && !aiResult && (
        <div className="p-4 flex items-center justify-center gap-2 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">AI 思考中...</span>
        </div>
      )}
      {aiResult && (
        <div className="p-2.5">
          <div className="max-h-40 overflow-y-auto rounded-md bg-surface-secondary p-2.5 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiResult}
            {loading && <span className="inline-block w-1 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
          </div>
          {!loading && (
            <div className="flex items-center gap-1 mt-2">
              <button onClick={handleReplace} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark cursor-pointer transition-colors">
                <Replace className="w-3 h-3" />替换选中
              </button>
              <button onClick={handleCopy} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-secondary rounded-md cursor-pointer transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
              <div className="flex-1" />
              <button onClick={() => { setAiResult(''); setCustomPrompt('') }} className="px-2.5 py-1 text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors">
                重新提问
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function FloatingToolbar({ textModelId, enableThinking }: { textModelId?: number | null; enableThinking?: boolean }) {
  const editor = useEditorRef()
  const editorId = useEditorId()
  const focusedEditorId = useEventEditorValue('focus')
  const [aiOpen, setAiOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)

  const floatingToolbarState = useFloatingToolbarState({ editorId, focusedEditorId })
  const { ref, props, hidden } = useFloatingToolbar(floatingToolbarState)
  const selectedText = floatingToolbarState.selectionText

  const tf = editor.tf as any

  const isMarkActive = (mark: string) => {
    try {
      const marks = editor.api.marks()
      return marks ? !!(marks as Record<string, boolean>)[mark] : false
    } catch { return false }
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) setAiOpen(false)
    }
    if (aiOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aiOpen])

  if (hidden) return null

  const iconSize = 'w-4 h-4'

  return (
    <div ref={ref} className="z-50 flex items-center gap-0.5 rounded-md bg-white px-1 py-0.5 shadow-lg border border-border" {...props}>
      <div className="relative" ref={aiRef}>
        <button
          onMouseDown={(e) => { e.preventDefault(); setAiOpen(!aiOpen) }}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${aiOpen ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/5'}`}
        >
          <Sparkles className="w-4 h-4" />Ask AI
        </button>
        {aiOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-border shadow-xl z-50">
            <AiPanel selectedText={selectedText} textModelId={textModelId ?? null} enableThinking={enableThinking} onClose={() => setAiOpen(false)} />
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-border mx-0.5" />
      <FloatingBtn onClick={() => tf.bold.toggle()} active={isMarkActive('bold')} label="加粗"><Bold className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.italic.toggle()} active={isMarkActive('italic')} label="斜体"><Italic className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.underline.toggle()} active={isMarkActive('underline')} label="下划线"><Underline className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.strikethrough.toggle()} active={isMarkActive('strikethrough')} label="删除线"><Strikethrough className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.code.toggle()} active={isMarkActive('code')} label="代码"><Code className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.highlight.toggle()} active={isMarkActive('highlight')} label="高亮"><Highlighter className={iconSize} /></FloatingBtn>
      <div className="w-px h-5 bg-border mx-0.5" />
      <FloatingBtn onClick={() => tf.h1.toggle()} label="标题1"><Heading1 className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.h2.toggle()} label="标题2"><Heading2 className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.h3.toggle()} label="标题3"><Heading3 className={iconSize} /></FloatingBtn>
      <FloatingBtn onClick={() => tf.blockquote.toggle()} label="引用"><Quote className={iconSize} /></FloatingBtn>
    </div>
  )
}
