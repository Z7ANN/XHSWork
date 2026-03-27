

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { Value } from 'platejs'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Plus, ShieldCheck, ClipboardCopy, Send, X, Loader2,
  Sparkles, Image as ImageIcon,
  FileText, Pencil, Eye, ChevronDown,
} from 'lucide-react'
import { PlateEditor } from '@/components/editor/PlateEditor'
import { PhonePreview } from '@/components/editor/PhonePreview'
import { oneclickApi, editorApi, modelApi, API_BASE } from '@/api'
import type { AiModelOption } from '@/api'
import { stripMarkdown } from '@/utils/stripMarkdown'
import { ModelSelector } from '@/components/ModelSelector'
import { SensitiveCheck } from '@/components/SensitiveCheck'
import { toast } from '@/components/Toast'

const SERVER_ORIGIN = API_BASE.replace(/\/api$/, '')

const CATEGORIES = [
  '美妆', '个护', '穿搭', '美食', '母婴', '旅行', '家居',
  '教育', '运动', '兴趣', '影视', '婚嫁', '宠物', '情感',
  '科技', '资讯', '养生', '科普', '职场', '出行',
]

const MAX_REF_IMAGES = 5

interface OutlinePage {
  id: string
  type: 'cover' | 'content' | 'summary'
  content: string
  imageHint?: string
}

const pageTypeLabel: Record<string, { label: string; cls: string }> = {
  cover: { label: '封面', cls: 'text-primary bg-primary/10' },
  content: { label: '内容', cls: 'text-text-muted bg-surface-secondary' },
  summary: { label: '总结', cls: 'text-emerald-600 bg-emerald-500/10' },
}

const mdComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="text-lg font-extrabold text-text-primary mb-2" {...props} />,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="text-base font-bold text-text-primary mb-2" {...props} />,
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="text-sm font-bold text-text-primary mb-1.5" {...props} />,
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mb-2 leading-relaxed text-text-primary text-sm" {...props} />,
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="mb-2 pl-4 list-disc text-sm text-text-primary" {...props} />,
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => <ol className="mb-2 pl-4 list-decimal text-sm text-text-primary" {...props} />,
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="mb-0.5 leading-relaxed" {...props} />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => <strong className="font-bold text-text-primary" {...props} />,
}

function CustomSelect({ value, onChange, options, placeholder, className = '', size = 'normal' }: {
  value: string | number | undefined
  onChange: (val: any) => void
  options: { value: any; label: string }[]
  placeholder?: string
  className?: string
  size?: 'small' | 'normal'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)
  const h = size === 'small' ? 'h-7 text-xs' : 'h-9 text-sm'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        onClick={() => setOpen(!open)}
        className={`${h} px-3 rounded-lg border border-border flex items-center justify-between gap-2 cursor-pointer hover:border-primary transition-colors ${selected ? 'text-text-primary' : 'text-text-muted'}`}
      >
        <span className="truncate">{selected?.label || placeholder || '请选择'}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg border border-border shadow-lg z-30 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {value !== undefined && value !== '' && (
            <div onClick={() => { onChange(undefined as any); setOpen(false) }} className={`${h} px-3 flex items-center text-text-muted hover:bg-surface-secondary cursor-pointer`}>
              清除
            </div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`${h} px-3 flex items-center cursor-pointer transition-colors ${opt.value === value ? 'text-primary bg-primary/5' : 'text-text-primary hover:bg-surface-secondary'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConfirmButton({ onConfirm, title, children, className = '' }: {
  onConfirm: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen(true)}>{children}</div>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-border p-3 z-20 w-44">
          <p className="text-xs text-text-primary mb-2">{title}</p>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 h-7 text-xs rounded-md border border-border text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors">取消</button>
            <button onClick={() => { onConfirm(); setOpen(false) }} className="flex-1 h-7 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors">删除</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OneClickPage() {
  const [searchParams] = useSearchParams()

  const [topic, setTopic] = useState('')
  const [pageCount, setPageCount] = useState(5)
  const [category, setCategory] = useState('')
  const [refImages, setRefImages] = useState<string[]>([])
  const [styleAnalysis, setStyleAnalysis] = useState('')
  const refFileRef = useRef<HTMLInputElement>(null)

  const [pages, setPages] = useState<OutlinePage[]>([])
  const [outlineStreaming, setOutlineStreaming] = useState(false)
  const outlineAbortRef = useRef<AbortController | null>(null)
  const draftIdRef = useRef<string | null>(null)
  const pageCountRef = useRef(0)

  const [noteTitle, setNoteTitle] = useState('')
  const [coverImages, setCoverImages] = useState<string[]>([])
  const [editorValue, setEditorValue] = useState<Value>([{ type: 'p', children: [{ text: '' }] }])
  const [editorKey, setEditorKey] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [generatingImages, setGeneratingImages] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [qrcode, setQrcode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef(false)
  const finalContentRef = useRef<{ title: string; content: string; tags: string[] } | null>(null)
  const finalImagesRef = useRef<string[]>([])

  const [activeTab, setActiveTab] = useState<'outline' | 'result'>('outline')
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const generationIdRef = useRef<number | null>(null)
  const [textModels, setTextModels] = useState<AiModelOption[]>([])
  const [imageModels, setImageModels] = useState<AiModelOption[]>([])
  const [textModelId, setTextModelId] = useState<number | null>(null)
  const [imageModelId, setImageModelId] = useState<number | null>(null)
  const [enableThinking, setEnableThinking] = useState(false)

  useEffect(() => {
    modelApi.list().then(({ text, image }) => {
      setTextModels(text)
      setImageModels(image)
      if (text.length > 0) setTextModelId(text[0].id)
      if (image.length > 0) setImageModelId(image[0].id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    const historyId = searchParams.get('historyId')
    if (!historyId) return
    editorApi.historyDetail(Number(historyId)).then((record) => {
      setNoteTitle(record.title || '')
      setTopic(record.topic || '')
      setCategory(record.category || '')
      setCoverImages(record.images || [])
      setTags(record.tags || [])
      const lines = (record.content || '').split('\n').filter(Boolean)
      const tagLine = record.tags?.length ? record.tags.map(t => `#${t}`).join(' ') : ''
      const value: Value = [
        ...lines.map((line: string) => ({ type: 'p' as const, children: [{ text: line }] })),
        ...(tagLine ? [{ type: 'p' as const, children: [{ text: tagLine }] }] : []),
      ]
      setEditorValue(value.length ? value : [{ type: 'p', children: [{ text: '' }] }])
      setEditorKey(k => k + 1)
      setActiveTab('result')
    }).catch(() => {
      toast.error('加载历史记录失败')
    })
  }, [searchParams])

  const wordCount = useMemo(() => {
    return editorValue.reduce((count, node: any) => {
      const text = (node.children || []).map((c: any) => c.text ?? '').join('')
      return count + text.length
    }, 0)
  }, [editorValue])

  const isGenerating = generatingImages || generatingContent

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = MAX_REF_IMAGES - refImages.length
    if (remaining <= 0) return toast.warning(`最多上传 ${MAX_REF_IMAGES} 张参考图`)
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setRefImages((prev) => prev.length < MAX_REF_IMAGES ? [...prev, reader.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
    if (refFileRef.current) refFileRef.current.value = ''
  }

  const handleGenerateOutline = useCallback(async () => {
    if (!topic.trim()) return toast.warning('请输入创作主题')
    if (!category) return toast.warning('请选择分类')

    outlineAbortRef.current?.abort()
    const abortController = new AbortController()
    outlineAbortRef.current = abortController

    setPages([])
    setOutlineStreaming(true)
    setActiveTab('outline')
    draftIdRef.current = null
    pageCountRef.current = 0

    let analysis = styleAnalysis
    if (refImages.length > 0 && !styleAnalysis) {
      try {
        if (!textModelId) { toast.warning('请选择文本模型'); setOutlineStreaming(false); return }
        const result = await oneclickApi.analyzeStyle(refImages, textModelId, enableThinking)
        analysis = result.styleAnalysis
        setStyleAnalysis(analysis)
      } catch {
        console.error('风格分析失败')
      }
    }

    try {
      if (!textModelId) { toast.warning('请选择文本模型'); setOutlineStreaming(false); return }
      const response = await oneclickApi.generateOutlineSSE({
        topic: topic.trim(), pageCount, category, textModelId: textModelId!,
        referenceImages: refImages.length > 0 ? refImages : undefined,
        styleAnalysis: analysis || undefined,
        enableThinking,
      })
      if (!response.ok || !response.body) throw new Error('请求失败')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        if (abortController.signal.aborted) { reader.cancel(); break }
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (!dataStr) continue
            try {
              const data = JSON.parse(dataStr)
              if (currentEvent === 'typing') {
                const text = data.text || ''
                const type = data.type || 'content'
                const displayText = text.replace(/^\[(?:封面|内容|总结)\]\s*\n?/, '')
                if (!draftIdRef.current) {
                  const newId = `draft-${Date.now()}`
                  draftIdRef.current = newId
                  setPages(prev => [...prev, { id: newId, type, content: displayText, imageHint: '' }])
                } else {
                  const draftId = draftIdRef.current
                  setPages(prev => prev.map(p => p.id === draftId ? { ...p, content: displayText, type } : p))
                }
              } else if (currentEvent === 'page') {
                pageCountRef.current++
                const finalId = data.id || `page-${pageCountRef.current}`
                if (draftIdRef.current) {
                  const draftId = draftIdRef.current
                  setPages(prev => prev.map(p => p.id === draftId ? { ...p, id: finalId, type: data.type, content: data.content, imageHint: data.imageHint || '' } : p))
                } else {
                  setPages(prev => [...prev, { id: finalId, type: data.type, content: data.content, imageHint: data.imageHint || '' }])
                }
                draftIdRef.current = null
              } else if (currentEvent === 'finish') {
                draftIdRef.current = null
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) console.error('大纲生成失败:', err)
    } finally {
      if (!abortController.signal.aborted) {
        setOutlineStreaming(false)
        draftIdRef.current = null
      }
    }
  }, [topic, pageCount, category, refImages, styleAnalysis, textModelId, enableThinking])

  const buildOutlineText = useCallback(() => {
    return pages.map((p, i) => `[${p.type}] 第${i + 1}页:\n${p.content}`).join('\n\n')
  }, [pages])

  // 大纲生成完成后自动保存
  const prevStreamingRef = useRef(false)
  useEffect(() => {
    if (prevStreamingRef.current && !outlineStreaming && pages.length > 0) {
      const outlineContent = pages.map((p, i) => `[${p.type}] 第${i + 1}页:\n${p.content}`).join('\n\n')
      editorApi.save({ type: 'oneclick', title: `[大纲] ${topic}`, content: outlineContent, topic, category }).catch(() => {})
    }
    prevStreamingRef.current = outlineStreaming
  }, [outlineStreaming, pages, topic, category])

  const handleGenerateAll = useCallback(async () => {
    if (pages.length === 0) return toast.warning('请先生成大纲')
    if (outlineStreaming) return toast.warning('大纲正在生成中')
    if (!textModelId) return toast.warning('请选择文本模型')
    if (!imageModelId) return toast.warning('请选择图片模型')

    setNoteTitle('')
    setTags([])
    setCoverImages([])
    setEditorValue([{ type: 'p', children: [{ text: '' }] }])
    setEditorKey(k => k + 1)
    setGeneratingImages(true)
    setGeneratingContent(true)
    setActiveTab('result')
    savedRef.current = false
    finalContentRef.current = null
    finalImagesRef.current = []
    generationIdRef.current = null

    await Promise.allSettled([generateImagesSSE(), generateContentSSE()])
  }, [pages, topic, category, styleAnalysis, refImages, outlineStreaming, textModelId, imageModelId, enableThinking])

  const generateImagesSSE = async () => {
    try {
      const response = await oneclickApi.generateImagesSSE({
        pages, topic, category, imageModelId: imageModelId!,
        styleAnalysis: styleAnalysis || undefined,
        referenceImages: refImages.length > 0 ? refImages : undefined,
      })
      if (!response.ok || !response.body) throw new Error('图片生成请求失败')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
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
            const dataStr = line.slice(6).trim()
            if (!dataStr) continue
            try {
              const data = JSON.parse(dataStr)
              if (currentEvent === 'complete' && data.imageUrl) {
                const fullUrl = `${SERVER_ORIGIN}${data.imageUrl}`
                setCoverImages(prev => [...prev, fullUrl])
                finalImagesRef.current = [...finalImagesRef.current, fullUrl]
                // 图片完成后更新记录
                if (generationIdRef.current) {
                  editorApi.update(generationIdRef.current, { images: finalImagesRef.current }).catch(() => {})
                }
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('图片生成失败:', err)
      toast.error('图片生成失败')
    } finally {
      setGeneratingImages(false)
    }
  }

  const generateContentSSE = async () => {
    try {
      const res = await oneclickApi.generateContentSSE(topic, buildOutlineText(), category, textModelId!, enableThinking)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error?.message || '文案生成失败')
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
              const titleMatch = fullText.match(/【标题】(.+)/)
              if (titleMatch) setNoteTitle(titleMatch[1].replace(/【标签】.*/, '').trim())
              let content = fullText
              const tIdx = content.indexOf('【标题】')
              if (tIdx !== -1) { const nl = content.indexOf('\n', tIdx); content = nl !== -1 ? content.slice(nl + 1) : '' }
              const tagIdx = content.indexOf('【标签】')
              if (tagIdx !== -1) content = content.slice(0, tagIdx)
              content = stripMarkdown(content.trim())
              const contentLines = content ? content.split('\n').filter(Boolean) : ['']
              setEditorValue(contentLines.map(l => ({ type: 'p' as const, children: [{ text: l }] })))
              setEditorKey(k => k + 1)
            } else if (currentEvent === 'done') {
              setNoteTitle(data.title)
              setTags(data.tags)
              const contentLines = stripMarkdown(data.content).split('\n').filter(Boolean)
              const tagLine = data.tags.map((t: string) => `#${t}`).join(' ')
              setEditorValue([
                ...contentLines.map((l: string) => ({ type: 'p' as const, children: [{ text: l }] })),
                { type: 'p' as const, children: [{ text: tagLine }] },
              ])
              setEditorKey(k => k + 1)
              finalContentRef.current = { title: data.title, content: data.content, tags: data.tags }
              // 文案完成立即保存
              editorApi.save({
                type: 'oneclick', title: data.title, content: data.content,
                images: finalImagesRef.current, tags: data.tags, topic, category,
              }).then(res => { generationIdRef.current = res.id }).catch(() => {})
            } else if (currentEvent === 'error') {
              toast.error(data.message || '文案生成失败')
            }
          }
        }
      }
    } catch (err: any) {
      console.error('文案生成失败:', err)
      toast.error(err.message || '文案生成失败')
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = 18 - coverImages.length
    Array.from(files).slice(0, remaining).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setCoverImages(prev => prev.length < 18 ? [...prev, ev.target?.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleCopyContent = async () => {
    const text = editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')
    const full = [noteTitle, text, tags.map(t => `#${t}`).join(' ')].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(full)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  const handlePublish = async () => {
    if (!noteTitle.trim()) return toast.warning('请先填写标题')
    const text = editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')
    if (!text.trim()) return toast.warning('请先填写内容')
    const contentWithTags = [text, tags.length ? tags.map(t => `#${t}`).join(' ') : ''].filter(Boolean).join('\n\n')
    setPublishing(true)
    try {
      const result = await editorApi.publish({ title: noteTitle.trim(), content: contentWithTags, images: coverImages })
      setQrcode(result.qrcode)
    } catch (err: any) {
      toast.error(err.message || '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  const handleUpdatePage = (id: string, content: string, imageHint: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, content, imageHint } : p))
  }

  const handleDeletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
    if (editingPageId === id) setEditingPageId(null)
  }

  const hasContent = pages.length > 0 || outlineStreaming || noteTitle

  return (
    <div className="animate-page-in flex flex-col max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_400px] gap-4 flex-1 min-h-0">

        {/* 左侧：控制面板 */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-border bg-white p-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">分类</label>
                <CustomSelect
                  value={category || undefined}
                  onChange={(v) => setCategory(v || '')}
                  placeholder="选择内容分类"
                  className="w-full"
                  options={CATEGORIES.map(c => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">创作主题</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="描述你想创作的内容..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">页数</span>
                <div className="flex items-center gap-2">
                  <CustomSelect
                    value={pageCount}
                    onChange={setPageCount}
                    size="small"
                    className="w-20"
                    options={[3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ value: n, label: `${n} 页` }))}
                  />
                  <span className="text-xs text-text-muted">≈{(() => {
                    const tm = textModels.find(m => m.id === textModelId)
                    const im = imageModels.find(m => m.id === imageModelId)
                    const textCost = tm ? tm.pointsCost + (enableThinking ? tm.thinkingPointsCost : 0) : 0
                    const imgCost = im ? im.pointsCost : 0
                    return textCost * 2 + imgCost * pageCount
                  })()}积分</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">参考图片</span>
                  <span className="text-xs text-text-muted">{refImages.length}/{MAX_REF_IMAGES}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {refImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`参考${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-border" />
                      <button
                        onClick={() => setRefImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {refImages.length < MAX_REF_IMAGES && (
                    <button
                      onClick={() => refFileRef.current?.click()}
                      className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-text-muted" />
                    </button>
                  )}
                  <input ref={refFileRef} type="file" accept="image/*" multiple onChange={handleRefImageUpload} className="hidden" />
                </div>
              </div>

              {pages.length > 0 && !outlineStreaming ? (
                <>
                  <ModelSelector models={textModels} value={textModelId} onChange={setTextModelId} label="文本模型" enableThinking={enableThinking} onThinkingChange={setEnableThinking} storageKey="oneclick_text" />
                  <ModelSelector models={imageModels} value={imageModelId} onChange={setImageModelId} label="图片模型" storageKey="oneclick_image" />
                  <button
                    onClick={handleGenerateAll}
                    disabled={isGenerating}
                    className="w-full h-10 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />生成中...</>
                    ) : (
                      <><ImageIcon className="w-4 h-4" />生成图文</>
                    )}
                  </button>
                  <button
                    onClick={handleGenerateOutline}
                    disabled={isGenerating}
                    className="w-full h-10 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />重新生成大纲
                  </button>
                </>
              ) : (
                <>
                  <ModelSelector models={textModels} value={textModelId} onChange={setTextModelId} label="文本模型" enableThinking={enableThinking} onThinkingChange={setEnableThinking} storageKey="oneclick_text" />
                  <ModelSelector models={imageModels} value={imageModelId} onChange={setImageModelId} label="图片模型" storageKey="oneclick_image" />
                  <button
                    onClick={handleGenerateOutline}
                    disabled={outlineStreaming}
                    className="w-full h-10 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
                  >
                    {outlineStreaming ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />生成大纲中...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />生成大纲</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 中间：内容区 */}
        <div className="flex flex-col min-h-0 bg-white rounded-2xl border border-border overflow-hidden">
          {hasContent ? (
            <>
              {/* Tab 切换 */}
              <div className="flex items-center border-b border-border shrink-0">
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors cursor-pointer relative ${activeTab === 'outline' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  <FileText className="w-4 h-4" />大纲
                  {activeTab === 'outline' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('result')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors cursor-pointer relative ${activeTab === 'result' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  <Pencil className="w-4 h-4" />编辑
                  {activeTab === 'result' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>

              {activeTab === 'outline' ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
                  <div className="grid grid-cols-2 gap-3">
                  {pages.map((page, index) => {
                    const typeInfo = pageTypeLabel[page.type] || pageTypeLabel.content
                    const isEditing = editingPageId === page.id
                    const displayContent = page.content.replace(/^\[(?:封面|内容|总结)\]\s*\n?/, '')
                    return (
                      <div key={page.id} className="flex flex-col rounded-md bg-white min-h-[280px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-primary font-mono">P{index + 1}</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${typeInfo.cls}`}>{typeInfo.label}</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingPageId(isEditing ? null : page.id)} className="w-7 h-7 rounded-md hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors">
                              {isEditing ? <Eye className="w-4 h-4 text-text-muted" /> : <Pencil className="w-4 h-4 text-text-muted" />}
                            </button>
                            <ConfirmButton title="确定删除此页？" onConfirm={() => handleDeletePage(page.id)}>
                              <button className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors">
                                <X className="w-4 h-4 text-red-400" />
                              </button>
                            </ConfirmButton>
                          </div>
                        </div>
                        <div className="flex-1 px-3 pb-1.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={page.content}
                                rows={8}
                                className="w-full px-2.5 py-2 rounded-md border border-border text-base text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
                                onBlur={(e) => handleUpdatePage(page.id, e.target.value, page.imageHint || '')}
                              />
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <ImageIcon className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold text-primary">配图建议</span>
                                </div>
                                <textarea
                                  defaultValue={page.imageHint || ''}
                                  rows={2}
                                  placeholder="描述配图风格和内容..."
                                  className="w-full px-2.5 py-1.5 rounded-md border border-primary/20 bg-primary/[0.02] text-sm text-text-secondary focus:outline-none focus:border-primary transition-colors resize-none"
                                  onBlur={(e) => handleUpdatePage(page.id, page.content, e.target.value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-text-primary leading-relaxed">
                              <ReactMarkdown components={mdComponents}>{displayContent}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                        {page.imageHint && !isEditing && (
                          <div className="mx-3 mb-2 px-2.5 py-2 rounded-md bg-primary/[0.04] border border-primary/10">
                            <div className="flex items-center gap-1 mb-0.5">
                              <ImageIcon className="w-3 h-3 text-primary" />
                              <span className="text-xs font-semibold text-primary">配图建议</span>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{page.imageHint}</p>
                          </div>
                        )}
                        <div className="px-3 pb-2 text-right text-xs text-text-muted/40">
                          {page.content.length} 字
                        </div>
                      </div>
                    )
                  })}
                  </div>
                  {outlineStreaming && (
                    <div className="flex items-center justify-center py-4 gap-2 text-sm text-text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />生成中...
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-5 space-y-4 shrink-0">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">笔记标题</label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="请输入笔记标题..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-text-primary">封面图片</label>
                        <span className="text-xs text-text-muted">{coverImages.length}/18</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {coverImages.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                            <img src={img} alt={`封面${i + 1}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewImg(img)} />
                            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setCoverImages(prev => prev.filter((_, idx) => idx !== i))} className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {generatingImages && (
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.03] flex flex-col items-center justify-center gap-1">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <span className="text-xs text-primary">生成中</span>
                          </div>
                        )}
                        {!generatingImages && coverImages.length < 18 && (
                          <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer">
                            <Plus className="w-5 h-5 text-text-muted" />
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <PlateEditor key={editorKey} initialValue={editorValue} placeholder="开始编辑你的小红书笔记内容..." onChange={setEditorValue} textModelId={textModelId} />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <SensitiveCheck
                        getText={() => editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')}
                        onReplace={(oldWord, newWord) => {
                          setEditorValue(prev => prev.map((node: any) => ({
                            ...node,
                            children: (node.children || []).map((c: any) => ({
                              ...c,
                              text: typeof c.text === 'string' ? c.text.replaceAll(oldWord, newWord) : c.text,
                            })),
                          })))
                          setEditorKey(k => k + 1)
                        }}
                      />
                      <button onClick={handleCopyContent} className="h-8 px-3 rounded-lg bg-surface-secondary text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-border transition-colors cursor-pointer">
                        <ClipboardCopy className="w-3.5 h-3.5" />复制内容
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>字数: {wordCount}</span>
                      <span>图片: {coverImages.length}/18</span>
                    </div>
                    <button onClick={handlePublish} disabled={publishing} className="h-8 px-4 rounded-sm bg-primary hover:bg-primary-dark text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer">
                      {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      一键发布
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-text-muted/40" />
                </div>
                <p className="text-sm text-text-muted">输入主题，一键生成图文</p>
                <p className="text-xs text-text-muted/60 mt-1">AI 自动生成大纲、文案和配图</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：手机预览 */}
        <div className="hidden lg:block overflow-y-auto">
          <PhonePreview title={noteTitle} tags={tags} editorValue={editorValue} coverImages={coverImages} coverLoading={generatingImages} />
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImg && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={previewImg} alt="预览" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-surface-secondary transition-colors">
              <X className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* 发布二维码弹窗 */}
      {qrcode && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center" onClick={() => setQrcode('')}>
          <div className="bg-white rounded-2xl p-6 w-[360px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                扫码发布到小红书
              </h3>
              <button onClick={() => setQrcode('')} className="w-7 h-7 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col items-center py-4 gap-3">
              <img src={qrcode} alt="发布二维码" className="w-52 h-52" />
              <span className="text-sm text-text-muted">请使用小红书 App 扫描二维码完成发布</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}
